import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Force dynamic rendering - webhooks use headers() and cannot be statically generated
export const dynamic = 'force-dynamic';
// Stripe signature verification + Stripe SDK require Node.js runtime
export const runtime = 'nodejs';

async function resolveCustomOrderFromCheckoutSession(session: Stripe.Checkout.Session): Promise<{ orderId: string } | null> {
  // Preferred: metadata on the session
  if (session.metadata?.orderType === 'custom' && session.metadata?.orderId) {
    return { orderId: session.metadata.orderId };
  }

  // Payment links sometimes don't propagate metadata to the session.
  // In that case, fetch the PaymentLink and read metadata from there.
  const paymentLinkId = session.payment_link;
  if (paymentLinkId && typeof paymentLinkId === 'string') {
    try {
      const paymentLink = await stripe.paymentLinks.retrieve(paymentLinkId);
      if (paymentLink.metadata?.orderType === 'custom' && paymentLink.metadata?.orderId) {
        return { orderId: paymentLink.metadata.orderId };
      }
    } catch (err) {
      console.warn('Failed to retrieve payment link for session:', session.id, err);
    }
  }

  return null;
}

async function markCustomOrderPaid(params: {
  orderId: string;
  paymentId?: string | null;
  checkoutSessionId?: string | null;
  paymentIntentId?: string | null;
  paymentLinkId?: string | null;
  eventType: string;
}) {
  const mongoose = await connectToDatabase();
  const db = mongoose.connection.db;

  if (!db) {
    throw new Error('Database connection failed');
  }

  const customOrdersCollection = db.collection('customOrders');

  const existing = await customOrdersCollection.findOne(
    { _id: new mongoose.Types.ObjectId(params.orderId) },
    { projection: { paymentLinkId: 1, paymentStatus: 1, status: 1 } }
  );

  const existingStatus = String((existing as any)?.status || '').toLowerCase();
  const nextWorkflowStatus =
    !existingStatus || existingStatus === 'pending' || existingStatus === 'paid'
      ? 'in-progress'
      : (existing as any)?.status;

  const update: any = {
    status: nextWorkflowStatus,
    paymentStatus: 'completed',
    paymentCompletedAt: new Date().toISOString(),
    lastStripeEventType: params.eventType,
    updatedAt: new Date().toISOString(),
  };
  // Ensure custom orders enter production workflow
  if (!(existing as any)?.productionStatus) {
    update.productionStatus = 'not_started';
  }
  if (!Number.isFinite(Number((existing as any)?.deliveryPriority))) {
    update.deliveryPriority = 100;
  }

  if (params.paymentId) update.paymentId = params.paymentId;
  if (params.checkoutSessionId) update.lastStripeCheckoutSessionId = params.checkoutSessionId;
  if (params.paymentIntentId) update.lastStripePaymentIntentId = params.paymentIntentId;
  if (params.paymentLinkId) update.paymentLinkId = params.paymentLinkId;

  const result = await customOrdersCollection.updateOne(
    { _id: new mongoose.Types.ObjectId(params.orderId) },
    { $set: update }
  );

  if (result.matchedCount === 0) {
    throw new Error(`Custom order not found: ${params.orderId}`);
  }

  // Deactivate the payment link to prevent duplicate payments.
  // Prefer the ID from Stripe session; otherwise use the one stored on the order.
  const paymentLinkIdToDeactivate =
    params.paymentLinkId || (existing as any)?.paymentLinkId || null;

  if (paymentLinkIdToDeactivate) {
    try {
      await stripe.paymentLinks.update(paymentLinkIdToDeactivate, { active: false });
      await customOrdersCollection.updateOne(
        { _id: new mongoose.Types.ObjectId(params.orderId) },
        {
          $set: {
            paymentLinkActive: false,
            paymentLinkDeactivatedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        }
      );
      console.log('Payment link deactivated:', paymentLinkIdToDeactivate);
    } catch (err) {
      // Don't fail the webhook if deactivation fails; log for follow-up.
      console.warn('Failed to deactivate payment link:', paymentLinkIdToDeactivate, err);
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'No signature provided' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    console.log('Received Stripe webhook:', event.type);

    // Handle payment link completed event
    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      console.log('Payment completed for session:', session.id);
      console.log('Session metadata:', session.metadata);

      const resolved = await resolveCustomOrderFromCheckoutSession(session);
      // Check if this is a custom order payment
      if (resolved?.orderId) {
        const orderId = resolved.orderId;
        
        console.log('Updating custom order status for:', orderId);

        await markCustomOrderPaid({
          orderId,
          paymentId: (session.payment_intent as string) || null,
          checkoutSessionId: session.id,
          paymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : null,
          paymentLinkId: typeof session.payment_link === 'string' ? session.payment_link : null,
          eventType: event.type,
        });
        console.log('Order status updated to paid:', orderId);
      }
    }

    // Handle payment intent succeeded (alternative event)
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      
      console.log('Payment intent succeeded:', paymentIntent.id);
      console.log('Payment intent metadata:', paymentIntent.metadata);

      // Preferred: metadata on the payment intent
      if (paymentIntent.metadata?.orderType === 'custom' && paymentIntent.metadata?.orderId) {
        const orderId = paymentIntent.metadata.orderId;
        console.log('Updating custom order status for payment intent:', orderId);
        await markCustomOrderPaid({
          orderId,
          paymentId: paymentIntent.id,
          paymentIntentId: paymentIntent.id,
          eventType: event.type,
        });
        console.log('Order status updated to paid:', orderId);
      } else {
        // Fallback: find checkout session for this payment intent, then resolve via session/payment link metadata
        try {
          const sessions = await (stripe.checkout.sessions.list as any)({
            payment_intent: paymentIntent.id,
            limit: 5,
          });
          const session = sessions?.data?.[0] as Stripe.Checkout.Session | undefined;
          if (session) {
            const resolved = await resolveCustomOrderFromCheckoutSession(session);
            if (resolved?.orderId) {
              await markCustomOrderPaid({
                orderId: resolved.orderId,
                paymentId: paymentIntent.id,
                checkoutSessionId: session.id,
                paymentIntentId: paymentIntent.id,
                paymentLinkId: typeof session.payment_link === 'string' ? session.payment_link : null,
                eventType: event.type,
              });
              console.log('Order status updated to paid via session lookup:', resolved.orderId);
            }
          }
        } catch (err) {
          console.warn('Could not resolve custom order from payment intent:', paymentIntent.id, err);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}