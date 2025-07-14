import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectToDatabase } from '@/lib/mongodb';
import Order from '@/backend/models/Order';
import User from '@/backend/models/User';
import mongoose from 'mongoose';

interface OrderDocument {
  _id: mongoose.Types.ObjectId;
  reference: string;
  status: string;
  total: number;
  items: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
    size: string;
    color?: string;
    image?: string;
    customization?: {
      name?: string;
      number?: string;
      isCustomized: boolean;
      nameCharacters?: number;
      numberCharacters?: number;
      customizationCost?: number;
      // Custom design fields
      frontImage?: string;
      backImage?: string;
      frontPosition?: { x: number; y: number };
      backPosition?: { x: number; y: number };
      frontScale?: number;
      backScale?: number;
      frontRotation?: number;
      backRotation?: number;
    };
  }>;
  shippingDetails: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    addressLine2?: string;
    city: string;
    county: string;
    postcode: string;
    country: string;
    shippingMethod: string;
    shippingCost: number;
    estimatedDeliveryDays: string;
  };
  createdAt: Date;
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const url = new URL(request.url);
    const isPublic = url.searchParams.get('public') === '1';

    await connectToDatabase();

    // Validate the ID format
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { error: 'Invalid order ID' },
        { status: 400 }
      );
    }

    let order: any = null;
    if (isPublic) {
      order = await Order.findOne({ _id: params.id }).lean();
      order = order as any;
    } else {
      const session = await getServerSession(authOptions);
      if (!session?.user?.email) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
      order = await Order.findOne({
        _id: params.id,
        userId: session.user.email,
      }).lean();
      order = order as any;
    }

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      _id: order._id.toString(),
      reference: order.reference,
      status: order.status,
      total: order.total,
      items: order.items.map((item: any) => ({
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        image: item.image,
        customization: item.customization ? {
          name: item.customization.name,
          number: item.customization.number,
          isCustomized: item.customization.isCustomized,
          nameCharacters: item.customization.nameCharacters,
          numberCharacters: item.customization.numberCharacters,
          customizationCost: item.customization.customizationCost,
          // Custom design fields
          frontImage: item.customization.frontImage,
          backImage: item.customization.backImage,
          frontPosition: item.customization.frontPosition,
          backPosition: item.customization.backPosition,
          frontScale: item.customization.frontScale,
          backScale: item.customization.backScale,
          frontRotation: item.customization.frontRotation,
          backRotation: item.customization.backRotation
        } : undefined
      })),
      shippingDetails: {
        firstName: order.shippingDetails.firstName,
        lastName: order.shippingDetails.lastName,
        email: order.shippingDetails.email,
        phone: order.shippingDetails.phone,
        address: order.shippingDetails.address,
        addressLine2: order.shippingDetails.addressLine2,
        city: order.shippingDetails.city,
        county: order.shippingDetails.county,
        postcode: order.shippingDetails.postcode,
        country: order.shippingDetails.country,
        shippingMethod: order.shippingDetails.shippingMethod,
        shippingCost: order.shippingDetails.shippingCost,
        estimatedDeliveryDays: order.shippingDetails.estimatedDeliveryDays
      },
      createdAt: order.createdAt,
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order details' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication and admin status
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user from database
    await connectToDatabase();
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Only admins can update orders
    if (!user.isAdmin) {
      return NextResponse.json(
        { error: 'Not authorized to update orders' },
        { status: 403 }
      );
    }

    const data = await request.json();
    const order = await Order.findByIdAndUpdate(
      params.id,
      { $set: data },
      { new: true }
    ).populate('items.product');

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Update order error:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication and admin status
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user from database
    await connectToDatabase();
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Only admins can delete orders
    if (!user.isAdmin) {
      return NextResponse.json(
        { error: 'Not authorized to delete orders' },
        { status: 403 }
      );
    }

    const order = await Order.findByIdAndDelete(params.id);
    
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Delete order error:', error);
    return NextResponse.json(
      { error: 'Failed to delete order' },
      { status: 500 }
    );
  }
} 