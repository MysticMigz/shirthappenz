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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const productionStatus = searchParams.get('productionStatus');
    const sortBy = searchParams.get('sortBy') || 'priority';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build query
    const query: any = {};
    if (status && status !== 'all') {
      query.status = status;
    }
    if (productionStatus && productionStatus !== 'all') {
      query.productionStatus = productionStatus;
    }

    // Build sort object
    let sortObject: any = {};
    switch (sortBy) {
      case 'priority':
        sortObject = { deliveryPriority: -1, createdAt: -1 };
        break;
      case 'production':
        sortObject = { productionStatus: 1, deliveryPriority: -1, createdAt: -1 };
        break;
      case 'date':
        sortObject = { createdAt: -1 };
        break;
      default:
        sortObject = { deliveryPriority: -1, createdAt: -1 };
    }

    // Get orders with pagination
    const orders = await Order.find(query)
      .sort(sortObject)
      .skip((page - 1) * limit)
      .limit(limit);

    // Get total count for pagination
    const total = await Order.countDocuments(query);

    return NextResponse.json({
      orders,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
} 