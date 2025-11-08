import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
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
paymentRoutes.use('/*', authMiddleware);
paymentRoutes.post('/checkout', createCheckout);
paymentRoutes.post('/payment-intent', createPaymentIntent);
paymentRoutes.get('/verify/:transactionId', verifyPayment);

export default paymentRoutes;
