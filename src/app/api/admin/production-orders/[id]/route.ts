import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectToDatabase } from '@/lib/mongodb';
import Order from '@/backend/models/Order';
import User from '@/backend/models/User';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
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

    const { id } = params;
    const body = await request.json();
    const { productionStatus } = body;
    if (!productionStatus) {
      return NextResponse.json(
        { error: 'Missing productionStatus' },
        { status: 400 }
      );
    }

    const order = await Order.findByIdAndUpdate(
      id,
      { productionStatus },
      { new: true }
    );
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }
    return NextResponse.json({ order });
  } catch (error) {
    console.error('Error updating production status:', error);
    return NextResponse.json(
      { error: 'Failed to update production status' },
      { status: 500 }
    );
  }
} 