import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Order from '@/backend/models/Order';

export async function GET(request: NextRequest) {
  await connectToDatabase();
  const { searchParams } = new URL(request.url);

  // Filtering
  const query: any = {};
  const status = searchParams.get('status');
  const productionStatus = searchParams.get('productionStatus');
  if (status && status !== 'all') query.status = status;
  if (productionStatus && productionStatus !== 'all') query.productionStatus = productionStatus;

  // Sorting
  let sort: any = { createdAt: -1 };
  const sortBy = searchParams.get('sortBy');
  if (sortBy === 'priority') sort = { deliveryPriority: -1, createdAt: -1 };
  if (sortBy === 'production') sort = { productionStatus: 1, createdAt: -1 };
  if (sortBy === 'date') sort = { createdAt: -1 };

  const orders = await Order.find(query).sort(sort);
  return NextResponse.json({ orders });
} 