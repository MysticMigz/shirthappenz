import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
// import { stripe } from '@/lib/stripe';
import { connectToDatabase } from '@/lib/mongodb';
import Order from '@/backend/models/Order';
import Transaction from '@/backend/models/Transaction';

// Temporarily disabled for testing
// const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: Request) {
  try {
    // Temporarily disabled for testing
    // const body = await request.text();
    // const sig = headers().get('stripe-signature');

    // if (!sig || !endpointSecret) {
    //   return NextResponse.json(
    //     { error: 'Missing signature or endpoint secret' },
    //     { status: 400 }
    //   );
    // }

    // let event;
    // try {
    //   event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    // } catch (err) {
    //   console.error('Webhook signature verification failed:', err);
    //   return NextResponse.json(
    //     { error: 'Webhook signature verification failed' },
    //     { status: 400 }
    //   );
    // }

    // // Handle the event
    // switch (event.type) {
    //   case 'payment_intent.succeeded':
    //     const paymentIntent = event.data.object;
        
    //     // Connect to database
    //     await connectToDatabase();

    //     // Create transaction record
    //     const transaction = await Transaction.create({
    //       paymentIntentId: paymentIntent.id,
    //       amount: paymentIntent.amount / 100,
    //       status: 'completed',
    //       createdAt: new Date(),
    //     });

    //     // Update order status if order exists
    //     if (paymentIntent.metadata.orderId) {
    //       await Order.findByIdAndUpdate(
    //         paymentIntent.metadata.orderId,
    //         {
    //           status: 'paid',
    //           transactionId: transaction._id,
    //         }
    //       );
    //     }
    //     break;
      
    //   case 'payment_intent.payment_failed':
    //     const failedPayment = event.data.object;
        
    //     // Connect to database
    //     await connectToDatabase();

    //     // Create failed transaction record
    //     await Transaction.create({
    //       paymentIntentId: failedPayment.id,
    //       amount: failedPayment.amount / 100,
    //       status: 'failed',
    //       createdAt: new Date(),
    //     });

    //     // Update order status if order exists
    //     if (failedPayment.metadata.orderId) {
    //       await Order.findByIdAndUpdate(
    //         failedPayment.metadata.orderId,
    //         { status: 'payment_failed' }
    //       );
    //     }
    //     break;

    //   default:
    //     console.log(`Unhandled event type ${event.type}`);
    // }

    // Temporary response for testing
    return NextResponse.json({ 
      message: 'Webhook processing temporarily disabled for testing',
      success: true 
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
} 