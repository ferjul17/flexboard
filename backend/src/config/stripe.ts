import Stripe from 'stripe';
import { env } from './env';

/**
 * Initialize Stripe client with the secret key
 */
export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
  typescript: true,
});

/**
 * Get Stripe publishable key for frontend
 */
export function getPublishableKey(): string {
  return env.STRIPE_PUBLISHABLE_KEY;
}

/**
 * Get Stripe webhook secret
 */
export function getWebhookSecret(): string | undefined {
  return env.STRIPE_WEBHOOK_SECRET;
}
