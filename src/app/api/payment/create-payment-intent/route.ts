import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
// import { stripe } from '@/lib/stripe';
import { connectToDatabase } from '@/lib/mongodb';
import Order from '@/backend/models/Order';
import Transaction from '@/backend/models/Transaction';
import User from '@/backend/models/User';
// import { createPaymentIntent } from '@/lib/stripe';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Temporarily disabled for testing
    // const { amount, orderId } = await request.json();
    // if (!amount || amount <= 0) {
    //   return NextResponse.json(
    //     { error: 'Invalid amount provided' },
    //     { status: 400 }
    //   );
    // }
    // const { clientSecret } = await createPaymentIntent(amount);
    // return NextResponse.json({ clientSecret });

    // Temporary response for testing
    return NextResponse.json({ 
      message: 'Payment processing temporarily disabled for testing',
      success: true 
    });
  } catch (error) {
    console.error('Payment intent creation error:', error);
    return NextResponse.json(
      { error: 'Error creating payment intent' },
      { status: 500 }
    );
  }
} 