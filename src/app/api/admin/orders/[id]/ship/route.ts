import { NextRequest } from 'next/server';
import Order from '@/backend/models/Order';
import { connectToDatabase } from '@/backend/utils/database';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  await connectToDatabase();
  const { trackingNumber, courier } = await request.json();
  const update: any = {
    status: 'shipped',
    productionStatus: 'completed',
    'shippingDetails.trackingNumber': trackingNumber,
    'shippingDetails.courier': courier,
    'shippingDetails.shippedAt': new Date(),
  };
  const order = await Order.findByIdAndUpdate(
    params.id,
    { $set: update },
    { new: true }
  );
  if (!order) {
    return new Response(JSON.stringify({ error: 'Order not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
  }
  return new Response(JSON.stringify({ message: 'Order shipped', order }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
} 