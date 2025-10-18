import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { createPaymentLink } from '@/lib/stripe';
import mongoose from 'mongoose';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { amount, description } = await request.json();
    
    console.log('Payment link request:', { amount, description, orderId: params.id });

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Valid amount is required' },
        { status: 400 }
      );
    }

    // Connect to database
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }
    const customOrdersCollection = db.collection('customOrders');

    // Get the custom order
    const order = await customOrdersCollection.findOne({ 
      _id: new mongoose.Types.ObjectId(params.id) 
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Create payment link
    const paymentLink = await createPaymentLink({
      amount,
      description: description || `Custom Order #${order._id}`,
      metadata: {
        orderId: order._id.toString(),
        orderType: 'custom',
        customerEmail: order.email,
        customerName: `${order.firstName} ${order.lastName}`,
      },
      successUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/thank-you?order=${order._id}`,
    });

    return NextResponse.json({
      paymentLink: paymentLink.url,
      paymentLinkId: paymentLink.paymentLinkId,
    });
  } catch (error) {
    console.error('Error creating payment link:', error);
    return NextResponse.json(
      { error: 'Failed to create payment link' },
      { status: 500 }
    );
  }
}
