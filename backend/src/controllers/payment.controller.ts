import { Context } from 'hono';
import { z } from 'zod';
import { stripe, getPublishableKey, getWebhookSecret } from '../config/stripe';
import { getUser } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { sql } from '../config/database';

const createCheckoutSchema = z.object({
  packageId: z.string().uuid(),
});

/**
 * Get Stripe publishable key for frontend
 */
export async function getStripeConfig(c: Context) {
  return c.json({
    data: {
      publishableKey: getPublishableKey(),
    },
  });
}

/**
 * Create a Stripe checkout session for a package purchase
 */
export async function createCheckout(c: Context) {
  const { userId } = getUser(c);
  const body = await c.req.json();
  const { packageId } = createCheckoutSchema.parse(body);

  // Get package details
  const [pkg] = await sql`
    SELECT id, name, price, flex_points, bonus_percentage
    FROM packages
    WHERE id = ${packageId} AND is_active = true
  `;

  if (!pkg) {
    throw new AppError(404, 'Package not found', 'PACKAGE_NOT_FOUND');
  }

  // Get user details
  const [user] = await sql`
    SELECT id, email, username FROM users WHERE id = ${userId}
  `;

  if (!user) {
    throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
  }

  // Create a pending transaction
  const [transaction] = await sql`
    INSERT INTO transactions (user_id, package_id, amount, flex_points, status, payment_method)
    VALUES (${userId}, ${packageId}, ${pkg.price}, ${pkg.flex_points}, 'pending', 'stripe')
    RETURNING id
  `;

  // Create Stripe checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${pkg.name} Package`,
            description: `${pkg.flex_points} Flex Points${pkg.bonus_percentage > 0 ? ` (+${pkg.bonus_percentage}% bonus)` : ''}`,
          },
          unit_amount: Math.round(parseFloat(pkg.price) * 100), // Convert to cents
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${c.req.header('origin') || 'http://localhost:3000'}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${c.req.header('origin') || 'http://localhost:3000'}/payment/cancel`,
    customer_email: user.email,
    client_reference_id: transaction.id,
    metadata: {
      userId: user.id,
      packageId: pkg.id,
      transactionId: transaction.id,
      flexPoints: pkg.flex_points.toString(),
    },
  });

  // Update transaction with payment ID
  await sql`
    UPDATE transactions
    SET payment_id = ${session.id}
    WHERE id = ${transaction.id}
  `;

  return c.json({
    data: {
      sessionId: session.id,
      sessionUrl: session.url,
      transactionId: transaction.id,
    },
  });
}

/**
 * Create a payment intent for direct payment (alternative to checkout)
 */
export async function createPaymentIntent(c: Context) {
  const { userId } = getUser(c);
  const body = await c.req.json();
  const { packageId } = createCheckoutSchema.parse(body);

  // Get package details
  const [pkg] = await sql`
    SELECT id, name, price, flex_points, bonus_percentage
    FROM packages
    WHERE id = ${packageId} AND is_active = true
  `;

  if (!pkg) {
    throw new AppError(404, 'Package not found', 'PACKAGE_NOT_FOUND');
  }

  // Create a pending transaction
  const [transaction] = await sql`
    INSERT INTO transactions (user_id, package_id, amount, flex_points, status, payment_method)
    VALUES (${userId}, ${packageId}, ${pkg.price}, ${pkg.flex_points}, 'pending', 'stripe')
    RETURNING id
  `;

  // Create payment intent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(parseFloat(pkg.price) * 100), // Convert to cents
    currency: 'usd',
    metadata: {
      userId,
      packageId: pkg.id,
      transactionId: transaction.id,
      flexPoints: pkg.flex_points.toString(),
    },
  });

  // Update transaction with payment ID
  await sql`
    UPDATE transactions
    SET payment_id = ${paymentIntent.id}
    WHERE id = ${transaction.id}
  `;

  return c.json({
    data: {
      clientSecret: paymentIntent.client_secret,
      transactionId: transaction.id,
    },
  });
}

/**
 * Verify payment status and complete transaction
 */
export async function verifyPayment(c: Context) {
  const { userId } = getUser(c);
  const { transactionId } = c.req.param();

  // Get transaction
  const [transaction] = await sql`
    SELECT id, user_id, payment_id, status
    FROM transactions
    WHERE id = ${transactionId}
  `;

  if (!transaction) {
    throw new AppError(404, 'Transaction not found', 'TRANSACTION_NOT_FOUND');
  }

  if (transaction.user_id !== userId) {
    throw new AppError(403, 'Unauthorized', 'UNAUTHORIZED');
  }

  // If already completed, return success
  if (transaction.status === 'completed') {
    return c.json({
      data: {
        status: 'completed',
        transactionId: transaction.id,
      },
    });
  }

  // Check payment status with Stripe
  try {
    let paid = false;

    // Check if it's a checkout session or payment intent
    if (transaction.payment_id.startsWith('cs_')) {
      const session = await stripe.checkout.sessions.retrieve(transaction.payment_id);
      paid = session.payment_status === 'paid';
    } else if (transaction.payment_id.startsWith('pi_')) {
      const paymentIntent = await stripe.paymentIntents.retrieve(transaction.payment_id);
      paid = paymentIntent.status === 'succeeded';
    }

    if (paid) {
      // Update transaction status
      await sql`
        UPDATE transactions
        SET status = 'completed', updated_at = NOW()
        WHERE id = ${transactionId}
      `;

      return c.json({
        data: {
          status: 'completed',
          transactionId: transaction.id,
        },
      });
    } else {
      return c.json({
        data: {
          status: transaction.status,
          transactionId: transaction.id,
        },
      });
    }
  } catch (error) {
    throw new AppError(500, 'Failed to verify payment', 'PAYMENT_VERIFICATION_FAILED');
  }
}

/**
 * Handle Stripe webhooks
 */
export async function handleWebhook(c: Context) {
  const signature = c.req.header('stripe-signature');
  const webhookSecret = getWebhookSecret();

  if (!signature) {
    throw new AppError(400, 'Missing stripe-signature header', 'MISSING_SIGNATURE');
  }

  if (!webhookSecret) {
    throw new AppError(500, 'Webhook secret not configured', 'WEBHOOK_NOT_CONFIGURED');
  }

  let event: any;

  try {
    const rawBody = await c.req.text();
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err: any) {
    throw new AppError(400, `Webhook signature verification failed: ${err.message}`, 'INVALID_SIGNATURE');
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const transactionId = session.client_reference_id || session.metadata?.transactionId;

      if (transactionId) {
        await sql`
          UPDATE transactions
          SET status = 'completed', updated_at = NOW()
          WHERE id = ${transactionId}
        `;
      }
      break;
    }

    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object;
      const transactionId = paymentIntent.metadata?.transactionId;

      if (transactionId) {
        await sql`
          UPDATE transactions
          SET status = 'completed', updated_at = NOW()
          WHERE id = ${transactionId}
        `;
      }
      break;
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object;
      const transactionId = paymentIntent.metadata?.transactionId;

      if (transactionId) {
        await sql`
          UPDATE transactions
          SET status = 'failed', updated_at = NOW()
          WHERE id = ${transactionId}
        `;
      }
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return c.json({ received: true });
}
