import { Hono } from 'hono';
import { authenticateUser } from '../middleware/auth';
import {
  getStripeConfig,
  createCheckout,
  createPaymentIntent,
  verifyPayment,
  handleWebhook,
} from '../controllers/payment.controller';

const paymentRoutes = new Hono();

// Public routes
paymentRoutes.get('/config', getStripeConfig);
paymentRoutes.post('/webhook', handleWebhook);

// Protected routes
paymentRoutes.use('/*', authenticateUser);
paymentRoutes.post('/checkout', createCheckout);
paymentRoutes.post('/payment-intent', createPaymentIntent);
paymentRoutes.get('/verify/:transactionId', verifyPayment);

export default paymentRoutes;
