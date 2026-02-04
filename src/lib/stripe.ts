import { loadStripe } from '@stripe/stripe-js';
import Stripe from 'stripe';

type StripeMode = 'live' | 'test' | 'unknown';

function getStripeModeFromSecretKey(secretKey?: string | null): StripeMode {
  if (!secretKey) return 'unknown';
  if (secretKey.startsWith('sk_live_')) return 'live';
  if (secretKey.startsWith('sk_test_')) return 'test';
  return 'unknown';
}

function assertNotTestModeInProduction(secretKey?: string | null) {
  const mode = getStripeModeFromSecretKey(secretKey);
  if (process.env.NODE_ENV === 'production' && mode === 'test') {
    throw new Error(
      'Stripe is configured with a TEST secret key in production. Set STRIPE_SECRET_KEY to a live key (sk_live_...) in Vercel before generating live payment links.'
    );
  }
}

// Debug environment variables
if (typeof window === 'undefined') {  // Only log on server-side
  console.log('Checking Stripe environment:', {
    hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
    hasPublishableKey: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    stripeMode: getStripeModeFromSecretKey(process.env.STRIPE_SECRET_KEY),
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
    console.log('Stripe secret key found, initializing Stripe client');
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

  assertNotTestModeInProduction(process.env.STRIPE_SECRET_KEY);

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

export interface CreatePaymentLinkOptions {
  amount: number;
  currency?: string;
  description?: string;
  metadata?: Record<string, string>;
  successUrl?: string;
  cancelUrl?: string;
}

export async function createPaymentLink({
  amount,
  currency = 'gbp',
  description = 'Custom Order Payment',
  metadata = {},
  successUrl,
  cancelUrl,
}: CreatePaymentLinkOptions) {
  if (!stripe) {
    console.error('Stripe not initialized. Check STRIPE_SECRET_KEY environment variable.');
    throw new Error('Stripe has not been initialized. This method can only be called from the server.');
  }

  assertNotTestModeInProduction(process.env.STRIPE_SECRET_KEY);

  try {
    console.log('Creating payment link with:', { amount, currency, description, metadata });
    
    // Validate amount
    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    // Create a price for the payment link
    const price = await stripe.prices.create({
      unit_amount: Math.round(amount * 100), // Convert to cents
      currency,
      product_data: {
        name: description,
      },
    });

    // Create the payment link
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      metadata,
      after_completion: {
        type: 'redirect',
        redirect: {
          url: successUrl || `${process.env.NEXT_PUBLIC_BASE_URL || 'https://mrshirtpersonalisation.co.uk'}/thank-you`,
        },
      },
    });

    return {
      url: paymentLink.url,
      paymentLinkId: paymentLink.id,
      stripeMode: getStripeModeFromSecretKey(process.env.STRIPE_SECRET_KEY),
    };
  } catch (error) {
    console.error('Error creating payment link:', error);
    throw new Error('Failed to create payment link');
  }
} 