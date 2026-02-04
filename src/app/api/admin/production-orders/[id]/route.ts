import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import Order from '@/backend/models/Order';
import User from '@/backend/models/User';
import mongoose from 'mongoose';

// Force dynamic rendering - this route uses getServerSession() which accesses headers
export const dynamic = 'force-dynamic';

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
    const mongooseConn = await connectToDatabase();
    const user = await (User as any).findOne({ email: session.user.email });
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

    // Custom orders are sent with an id like "custom_<objectId>"
    if (id.startsWith('custom_')) {
      const customId = id.replace(/^custom_/, '');
      if (!mongoose.Types.ObjectId.isValid(customId)) {
        return NextResponse.json({ error: 'Invalid custom order id' }, { status: 400 });
      }

      const db = mongooseConn.connection.db;
      if (!db) {
        return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
      }

      const customOrdersCollection = db.collection('customOrders');
      const result = await customOrdersCollection.updateOne(
        { _id: new mongoose.Types.ObjectId(customId) },
        { $set: { productionStatus, updatedAt: new Date().toISOString() } }
      );

      if (result.matchedCount === 0) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      return NextResponse.json({ success: true });
    }

    const order = await (Order as any).findByIdAndUpdate(id, { productionStatus }, { new: true });
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    return NextResponse.json({ order });
  } catch (error) {
    console.error('Error updating production status:', error);
    return NextResponse.json(
      { error: 'Failed to update production status' },
      { status: 500 }
    );
  }
} 