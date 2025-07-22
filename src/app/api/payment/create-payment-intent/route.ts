import { NextResponse } from 'next/server';
import { createPaymentIntent } from '@/lib/stripe';

export async function POST(request: Request) {
  if (typeof window !== 'undefined') {
    return NextResponse.json(
      { error: 'This endpoint can only be called from the server' },
      { status: 400 }
    );
  }

  try {
    // Debug request
    console.log('Creating payment intent...');

    const { amount, orderId, items, shippingDetails, visitorId } = await request.json();
    console.log('Payment intent request:', { amount, orderId, items, shippingDetails, visitorId });

    if (!amount) {
      return NextResponse.json(
        { error: 'Amount is required' },
        { status: 400 }
      );
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Stripe is not properly configured' },
        { status: 500 }
      );
    }

    // Store all order/cart/shipping details in metadata
    const { clientSecret, paymentIntentId } = await createPaymentIntent({
      amount,
      orderId,
      metadata: {
        items: JSON.stringify(items),
        shippingDetails: JSON.stringify(shippingDetails),
        visitorId: visitorId || '',
      },
    });

    console.log('Payment intent created:', { paymentIntentId });

    return NextResponse.json({ clientSecret, paymentIntentId });
  } catch (error: any) {
    console.error('Payment intent creation error:', {
      message: error.message,
      stack: error.stack,
    });
    
    return NextResponse.json(
      { error: error.message || 'Failed to create payment intent' },
      { status: 500 }
    );
  }
} 