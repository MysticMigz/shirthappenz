import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectToDatabase } from '@/lib/mongodb';
import Order from '@/backend/models/Order';
import User from '@/backend/models/User';
import mongoose from 'mongoose';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    // Validate the ID format
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { error: 'Invalid order ID' },
        { status: 400 }
      );
    }

    const order = await Order.findOne({
      _id: params.id,
      userId: session.user.email,
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      reference: order.reference,
      status: order.status,
      total: order.total,
      shippingDetails: {
        firstName: order.shippingDetails.firstName,
        lastName: order.shippingDetails.lastName,
        email: order.shippingDetails.email,
        phone: order.shippingDetails.phone,
        address: order.shippingDetails.address,
        addressLine2: order.shippingDetails.addressLine2,
        city: order.shippingDetails.city,
        county: order.shippingDetails.county,
        postcode: order.shippingDetails.postcode,
        country: order.shippingDetails.country
      },
      createdAt: order.createdAt,
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order details' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication and admin status
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user from database
    await connectToDatabase();
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Only admins can update orders
    if (!user.isAdmin) {
      return NextResponse.json(
        { error: 'Not authorized to update orders' },
        { status: 403 }
      );
    }

    const data = await request.json();
    const order = await Order.findByIdAndUpdate(
      params.id,
      { $set: data },
      { new: true }
    ).populate('items.product');

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Update order error:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication and admin status
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user from database
    await connectToDatabase();
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Only admins can delete orders
    if (!user.isAdmin) {
      return NextResponse.json(
        { error: 'Not authorized to delete orders' },
        { status: 403 }
      );
    }

    const order = await Order.findByIdAndDelete(params.id);
    
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Delete order error:', error);
    return NextResponse.json(
      { error: 'Failed to delete order' },
      { status: 500 }
    );
  }
} 