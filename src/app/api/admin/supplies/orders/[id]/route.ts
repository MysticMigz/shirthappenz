import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectToDatabase } from '@/backend/utils/database';
import SupplyOrder from '@/backend/models/SupplyOrder';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const { id } = params;
    const data = await request.json();

    // Validate the request body
    if (data.status && !['draft', 'pending', 'ordered', 'received', 'cancelled'].includes(data.status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Find the order
    const order = await SupplyOrder.findById(id);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Update the order
    if (data.status) {
      order.status = data.status;
    }

    if (data.items) {
      // Validate items
      if (!Array.isArray(data.items)) {
        return NextResponse.json({ error: 'Items must be an array' }, { status: 400 });
      }

      for (const item of data.items) {
        if (!item.supply || !item.quantity || item.quantity < 1 || !item.priceAtOrder) {
          return NextResponse.json({ error: 'Invalid item data' }, { status: 400 });
        }
      }

      order.items = data.items;
      order.totalAmount = data.totalAmount;
    }

    if (data.notes !== undefined) {
      order.notes = data.notes;
    }

    await order.save();

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error updating supply order:', error);
    return NextResponse.json(
      { error: 'Failed to update supply order' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const { id } = params;

    // Find the order
    const order = await SupplyOrder.findById(id);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Only allow deletion of draft orders
    if (order.status !== 'draft') {
      return NextResponse.json(
        { error: 'Only draft orders can be deleted' },
        { status: 400 }
      );
    }

    await order.deleteOne();

    return NextResponse.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting supply order:', error);
    return NextResponse.json(
      { error: 'Failed to delete supply order' },
      { status: 500 }
    );
  }
} 