import { loadStripe } from '@stripe/stripe-js';
import Stripe from 'stripe';

// Debug environment variables
if (typeof window === 'undefined') {  // Only log on server-side
  console.log('Checking Stripe environment:', {
    hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
    hasPublishableKey: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  });
}

// Client-side Stripe instance
export const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// Server-side Stripe instance - only initialize if we're on the server
let stripe: Stripe | undefined;

if (typeof window === 'undefined') {  // Only run on server side
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('Warning: STRIPE_SECRET_KEY is not configured in environment');
  } else {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-05-28.basil',
      typescript: true,
    });
  }
}

export interface CreatePaymentIntentOptions {
  amount: number;
  orderId?: string;
  currency?: string;
  paymentMethodTypes?: string[];
  metadata?: Record<string, string>;
}

export async function createPaymentIntent({
  amount,
  orderId,
  currency = 'gbp',
  paymentMethodTypes = ['card'],
  metadata = {},
}: CreatePaymentIntentOptions) {
  if (!stripe) {
    throw new Error('Stripe has not been initialized. This method can only be called from the server.');
  }

  try {
    // Validate amount
    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    // Merge orderId into metadata if present
    const fullMetadata = { ...metadata };
    if (orderId) fullMetadata.orderId = orderId;

    // Create the payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      payment_method_types: paymentMethodTypes,
      metadata: fullMetadata,
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw new Error('Failed to create payment intent');
  }
} 