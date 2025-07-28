import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectToDatabase } from '@/lib/mongodb';
import Order from '@/backend/models/Order';
import User from '@/backend/models/User';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user from database and verify admin status
    await connectToDatabase();
    const user = await User.findOne({ email: session.user.email });
    if (!user?.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get all orders (excluding cancelled and refunded orders), sorted by deliveryPriority and createdAt
    const orders = await Order.find({
      status: { $nin: ['cancelled', 'payment_failed'] },
      $or: [
        { 'metadata.refundAmount': { $exists: false } },
        { 'metadata.refundAmount': { $exists: true, $eq: null } }
      ]
    })
      .sort({ deliveryPriority: -1, createdAt: -1 });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Error fetching production orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch production orders' },
      { status: 500 }
    );
  }
} 