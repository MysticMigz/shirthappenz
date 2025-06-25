import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectToDatabase } from '@/backend/utils/database';
import SupplyOrder from '@/backend/models/SupplyOrder';
import Supply from '@/backend/models/Supply';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build query
    const query: any = {};
    if (status) {
      query.status = status;
    }
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    // Fetch orders with populated supply details
    const orders = await SupplyOrder.find(query)
      .populate({
        path: 'items.supply',
        select: 'name description image price unit category minimumOrderQuantity supplier notes'
      })
      .sort({ createdAt: -1 });

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching supply orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch supply orders' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const data = await request.json();
    console.log('Received order data:', data);

    if (!data.items?.length) {
      return NextResponse.json(
        { error: 'No items in order' },
        { status: 400 }
      );
    }

    // Fetch complete supply information for each item
    const itemsWithSupplyInfo = await Promise.all(
      data.items.map(async (item: any) => {
        const supply = await Supply.findById(item.supply._id || item.supply);
        if (!supply) {
          throw new Error(`Supply not found for ID: ${item.supply._id || item.supply}`);
        }
        return {
          supply: supply._id, // Store only the ID in the order
          quantity: item.quantity,
          priceAtOrder: supply.price, // Store current price at time of order
          notes: item.notes
        };
      })
    );

    // Calculate total amount
    const totalAmount = itemsWithSupplyInfo.reduce((total: number, item: any) => {
      return total + (item.priceAtOrder * item.quantity);
    }, 0);

    // Generate reference number
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
    
    const todayCount = await SupplyOrder.countDocuments({
      createdAt: {
        $gte: startOfDay,
        $lt: endOfDay
      }
    });

    const sequence = (todayCount + 1).toString().padStart(4, '0');
    const reference = `SUP-${year}${month}${day}-${sequence}`;

    // Create the order
    const order = new SupplyOrder({
      reference,
      items: itemsWithSupplyInfo,
      status: data.status || 'draft',
      totalAmount,
      orderedBy: session.user.email,
      orderedAt: data.status === 'ordered' ? new Date() : undefined,
      notes: data.notes
    });

    await order.save();

    // Fetch the complete order with populated supply information
    const populatedOrder = await SupplyOrder.findById(order._id).populate({
      path: 'items.supply',
      select: 'name description image price unit category minimumOrderQuantity supplier notes'
    });

    if (!populatedOrder) {
      throw new Error('Failed to fetch populated order');
    }

    return NextResponse.json(populatedOrder);
  } catch (error) {
    console.error('Error creating supply order:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create supply order' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const data = await request.json();
    const orderId = request.url.split('/').pop();

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const order = await SupplyOrder.findById(orderId);
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Update order status
    if (data.status) {
      order.status = data.status;
      if (data.status === 'ordered') {
        order.orderedAt = new Date();
      }
    }

    await order.save();

    // Return populated order
    const populatedOrder = await SupplyOrder.findById(order._id).populate({
      path: 'items.supply',
      select: 'name description image price unit category minimumOrderQuantity supplier notes'
    });

    return NextResponse.json(populatedOrder);
  } catch (error) {
    console.error('Error updating supply order:', error);
    return NextResponse.json(
      { error: 'Failed to update supply order' },
      { status: 500 }
    );
  }
} 