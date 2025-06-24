import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectToDatabase } from '@/lib/mongodb';
import Order from '@/backend/models/Order';
import User from '@/backend/models/User';
import Product from '@/backend/models/Product';
import mongoose from 'mongoose';

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  size: string;
  color?: string;
  image?: string;
}

interface OrderDocument extends mongoose.Document {
  reference: string;
  userId: string;
  items: OrderItem[];
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'payment_failed';
  total: number;
  createdAt: Date;
  updatedAt: Date;
}

// Helper function to check admin status
async function verifyAdmin(email: string) {
  const user = await User.findOne({ email });
  if (!user?.isAdmin) {
    throw new Error('Admin access required');
  }
  return user;
}

// Helper function to update stock levels
async function updateProductStock(productId: string, size: string, quantity: number): Promise<boolean> {
  try {
    // Convert string ID to ObjectId if needed
    const _id = typeof productId === 'string' ? new mongoose.Types.ObjectId(productId) : productId;

    // Use $inc for atomic update
    const updateQuery = {
      $inc: {
        [`stock.${size}`]: quantity
      }
    };

    const options = {
      new: true,
      runValidators: true
    };

    const product = await Product.findOneAndUpdate(
      { _id },
      updateQuery,
      options
    );

    if (!product) {
      console.error(`Failed to update stock for product ${productId}, size ${size}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`Error updating stock for product ${productId}:`, error);
    return false;
  }
}

export async function GET(
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

    // Get order details
    const order = await Order.findById(params.id);
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error fetching order details:', error);
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to fetch order details' },
      { status: 500 }
    );
  }
}

export async function PATCH(
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
    const { status } = body;

    // Validate status
    const validStatuses = ['pending', 'paid', 'shipped', 'delivered', 'cancelled', 'payment_failed'] as const;
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Get the order
    const order = await Order.findById(params.id) as OrderDocument | null;
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // If the order is being cancelled and wasn't cancelled before
    if (status === 'cancelled' && order.status !== 'cancelled') {
      // Restore stock for all items
      const stockUpdates = await Promise.all(
        order.items.map((item: OrderItem) =>
          updateProductStock(item.productId, item.size, item.quantity)
        )
      );

      // If any stock update failed, return error
      if (stockUpdates.includes(false)) {
        return NextResponse.json(
          { error: 'Failed to restore stock levels' },
          { status: 500 }
        );
      }
    }

    // Update status and save
    order.status = status;
    await order.save();

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error updating order:', error);
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }
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

    // Delete order
    const order = await Order.findByIdAndDelete(params.id);
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to delete order' },
      { status: 500 }
    );
  }
} 