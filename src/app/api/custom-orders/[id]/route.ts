import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { status, invoiceData, paymentLink } = body;

    if (!status && !invoiceData && !paymentLink) {
      return NextResponse.json(
        { error: 'Status, invoiceData, or paymentLink is required' },
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

    // Prepare update object
    const updateData: any = {
      updatedAt: new Date().toISOString()
    };

    if (status) {
      updateData.status = status;
    }

    if (invoiceData) {
      updateData.invoiceData = invoiceData;
      updateData.invoiceGeneratedAt = new Date().toISOString();
    }

    if (paymentLink) {
      updateData.paymentLink = paymentLink;
      updateData.paymentLinkGeneratedAt = new Date().toISOString();
    }

    // Update order
    const result = await customOrdersCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(params.id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating custom order:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    // Get specific order
    const order = await customOrdersCollection.findOne({ _id: new mongoose.Types.ObjectId(params.id) });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error fetching custom order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}