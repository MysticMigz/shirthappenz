import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectToDatabase } from '@/lib/mongodb';
import Order from '@/backend/models/Order';
import User from '@/backend/models/User';
import { sendOrderCancellationEmail } from '@/lib/email';

export async function POST(
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

    // Get user from database
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const { id } = params;
    const { reason, notes } = await request.json();

    if (!reason) {
      return NextResponse.json(
        { error: 'Cancellation reason is required' },
        { status: 400 }
      );
    }

    // Find the order
    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check if user owns this order or is admin
    if (order.userId !== user._id.toString() && !user.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized to cancel this order' },
        { status: 403 }
      );
    }

    // Check if order can be cancelled based on UK consumer law
    const orderDate = new Date(order.createdAt);
    const currentDate = new Date();
    const daysSinceOrder = Math.floor((currentDate.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // UK Consumer Law: 14-day cooling-off period
    const withinCoolingOffPeriod = daysSinceOrder <= 14;
    
    // Check if production has started
    const productionStarted = order.productionStatus === 'in_production' || 
                             order.productionStatus === 'quality_check' || 
                             order.productionStatus === 'ready_to_ship' || 
                             order.productionStatus === 'completed';
    
    // Custom-made items cannot be cancelled once production starts
    const hasCustomItems = order.items.some((item: any) => item.customization?.isCustomized);
    
    let canCancel = false;
    let cancellationError = '';
    
    if (order.status === 'cancelled') {
      cancellationError = 'Order is already cancelled';
    } else if (order.status === 'delivered') {
      // For delivered orders, check 14-day cooling-off period
      if (!withinCoolingOffPeriod) {
        cancellationError = '14-day cancellation period has expired';
      } else {
        canCancel = true;
      }
    } else if (order.status === 'shipped') {
      // For shipped orders, check 14-day cooling-off period
      if (!withinCoolingOffPeriod) {
        cancellationError = '14-day cancellation period has expired';
      } else {
        canCancel = true;
      }
    } else if (order.status === 'paid' || order.status === 'pending') {
      // For paid/pending orders, check if production has started
      if (productionStarted && hasCustomItems) {
        cancellationError = 'Custom-made items cannot be cancelled once production has started';
      } else if (productionStarted) {
        cancellationError = 'Order cannot be cancelled as production has already started';
      } else {
        canCancel = true;
      }
    } else {
      cancellationError = 'Order cannot be cancelled at this stage';
    }

    if (!canCancel) {
      return NextResponse.json(
        { error: cancellationError },
        { status: 400 }
      );
    }

    // Check if cancellation is already requested
    if (order.cancellationRequested) {
      return NextResponse.json(
        { error: 'Cancellation already requested for this order' },
        { status: 400 }
      );
    }

    // Update order with cancellation request
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      {
        cancellationRequested: true,
        cancellationReason: reason,
        cancellationRequestedAt: new Date(),
        cancellationRequestedBy: user.isAdmin ? 'admin' : 'customer',
        cancellationNotes: notes || '',
        status: 'cancelled', // Automatically cancel the order
      },
      { new: true }
    );

    // Send cancellation email
    try {
      await sendOrderCancellationEmail(
        order.reference,
        order.shippingDetails,
        order.items,
        order.total,
        reason,
        notes
      );
    } catch (error) {
      console.error('Failed to send cancellation email:', error);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      message: 'Cancellation request submitted successfully',
      order: updatedOrder
    });

  } catch (error) {
    console.error('Order cancellation error:', error);
    return NextResponse.json(
      { error: 'Failed to process cancellation request' },
      { status: 500 }
    );
  }
} 