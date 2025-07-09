import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Order from '@/backend/models/Order';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  await connectToDatabase();
  const { id } = params;
  const order = await Order.findById(id);
  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }
  return NextResponse.json({ order });
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  await connectToDatabase();
  const { id } = params;
  const body = await request.json();

  // Only allow updating status or productionNotes
  const update: any = {};
  if (body.status) update.status = body.status;
  if (body.productionNotes !== undefined) update.productionNotes = body.productionNotes;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const updatedOrder = await Order.findByIdAndUpdate(id, update, { new: true });
  if (!updatedOrder) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }
  return NextResponse.json({ order: updatedOrder });
} 