import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import mongoose from 'mongoose';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = headers().get('stripe-signature');

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
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      console.log('Payment completed for session:', session.id);
      console.log('Session metadata:', session.metadata);

      // Check if this is a custom order payment
      if (session.metadata?.orderType === 'custom' && session.metadata?.orderId) {
        const orderId = session.metadata.orderId;
        
        console.log('Updating custom order status for:', orderId);

        // Connect to database
        const mongoose = await connectToDatabase();
        const db = mongoose.connection.db;
        
        if (!db) {
          console.error('Database connection failed');
          return NextResponse.json(
            { error: 'Database connection failed' },
            { status: 500 }
          );
        }

        const customOrdersCollection = db.collection('customOrders');

        // Update order status to paid
        const result = await customOrdersCollection.updateOne(
          { _id: new mongoose.Types.ObjectId(orderId) },
          {
            $set: {
              status: 'paid',
              paymentStatus: 'completed',
              paymentId: session.payment_intent as string,
              paymentCompletedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          }
        );

        if (result.matchedCount === 0) {
          console.error('Order not found:', orderId);
          return NextResponse.json(
            { error: 'Order not found' },
            { status: 404 }
          );
        }

        console.log('Order status updated to paid:', orderId);
      }
    }

    // Handle payment intent succeeded (alternative event)
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      
      console.log('Payment intent succeeded:', paymentIntent.id);
      console.log('Payment intent metadata:', paymentIntent.metadata);

      // Check if this is a custom order payment
      if (paymentIntent.metadata?.orderType === 'custom' && paymentIntent.metadata?.orderId) {
        const orderId = paymentIntent.metadata.orderId;
        
        console.log('Updating custom order status for payment intent:', orderId);

        // Connect to database
        const mongoose = await connectToDatabase();
        const db = mongoose.connection.db;
        
        if (!db) {
          console.error('Database connection failed');
          return NextResponse.json(
            { error: 'Database connection failed' },
            { status: 500 }
          );
        }

        const customOrdersCollection = db.collection('customOrders');

        // Update order status to paid
        const result = await customOrdersCollection.updateOne(
          { _id: new mongoose.Types.ObjectId(orderId) },
          {
            $set: {
              status: 'paid',
              paymentStatus: 'completed',
              paymentId: paymentIntent.id,
              paymentCompletedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          }
        );

        if (result.matchedCount === 0) {
          console.error('Order not found:', orderId);
          return NextResponse.json(
            { error: 'Order not found' },
            { status: 404 }
          );
        }

        console.log('Order status updated to paid:', orderId);
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