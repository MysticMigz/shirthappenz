import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectToDatabase } from '@/lib/mongodb';
import Order from '@/backend/models/Order';
import User from '@/backend/models/User';
import mongoose from 'mongoose';

// Helper function to check admin status
async function verifyAdmin(email: string) {
  const user = await User.findOne({ email });
  if (!user?.isAdmin) {
    throw new Error('Admin access required');
  }
  return user;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectToDatabase();
    await verifyAdmin(session.user.email);

    // Validate order ID
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { error: 'Invalid order ID' },
        { status: 400 }
      );
    }

    // Get request body
    const body = await request.json();
    const { 
      trackingNumber, 
      courier, 
      shippingMethod = 'Standard Delivery',
      estimatedDelivery,
      notes 
    } = body;

    // Validate required fields
    if (!trackingNumber || !courier) {
      return NextResponse.json(
        { error: 'Tracking number and courier are required' },
        { status: 400 }
      );
    }

    // Validate courier
    const validCouriers = ['Royal Mail', 'Evri', 'DPD', 'DHL', 'FedEx', 'UPS'];
    if (!validCouriers.includes(courier)) {
      return NextResponse.json(
        { error: 'Invalid courier. Must be one of: ' + validCouriers.join(', ') },
        { status: 400 }
      );
    }

    // Get the order
    const order = await Order.findById(params.id);
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Update order with shipping information
    const updateData: any = {
      status: 'shipped',
      productionStatus: 'completed',
      'shippingDetails.trackingNumber': trackingNumber,
      'shippingDetails.courier': courier,
      'shippingDetails.shippingMethod': shippingMethod,
      'shippingDetails.estimatedDelivery': estimatedDelivery,
      'shippingDetails.shippedAt': new Date(),
      productionCompletedDate: new Date(),
    };

    // Add notes if provided
    if (notes) {
      updateData.productionNotes = order.productionNotes 
        ? `${order.productionNotes}\n\n[SHIPPED] ${new Date().toLocaleString()}: ${notes}`
        : `[SHIPPED] ${new Date().toLocaleString()}: ${notes}`;
    }

    // Update the order
    const updatedOrder = await Order.findByIdAndUpdate(
      params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: `Order ${order.reference} has been marked as shipped with ${courier} tracking: ${trackingNumber}`
    });

  } catch (error) {
    console.error('Error shipping order:', error);
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to ship order' },
      { status: 500 }
    );
  }
} 