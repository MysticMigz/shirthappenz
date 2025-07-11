import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectToDatabase } from '@/lib/mongodb';
import Order from '@/backend/models/Order';
import User from '@/backend/models/User';
import Product from '@/backend/models/Product';
import mongoose from 'mongoose';
import { updateProductStock } from '@/lib/server-utils';
import { sendOrderConfirmationEmail } from '@/lib/email';

interface ProductImage {
  url: string;
  alt: string;
}

interface PopulatedProduct {
  _id: string;
  images?: ProductImage[];
}

interface BaseOrderItem {
  name: string;
  price: number;
  quantity: number;
  size: string;
  color?: string;
}

interface OrderItem extends BaseOrderItem {
  productId: string | PopulatedProduct;
  image?: string;
}

interface TransformedOrderItem extends BaseOrderItem {
  productId: string;
  image: string | null;
}

interface OrderItemWithStock extends OrderItem {
  currentStock?: number;
}

interface OrderItemDB {
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
  };
  baseProductName?: string;
  baseProductImage?: string;
}

export async function GET(request: Request) {
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

    // Get user's orders
    const orders = await Order.find({ userId: session.user.email })
      .sort({ createdAt: -1 });

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      console.error('Error parsing request body:', error);
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { items, shippingDetails, total } = body;

    // Validate request data
    if (!items?.length) {
      return NextResponse.json(
        { error: 'No items in order' },
        { status: 400 }
      );
    }

    if (!shippingDetails?.firstName || !shippingDetails?.lastName || !shippingDetails?.email ||
        !shippingDetails?.phone || !shippingDetails?.address || !shippingDetails?.city ||
        !shippingDetails?.postcode || !shippingDetails?.shippingMethod || !shippingDetails?.shippingCost) {
      return NextResponse.json(
        { error: 'Missing shipping details' },
        { status: 400 }
      );
    }

    if (typeof total !== 'number' || total <= 0) {
      return NextResponse.json(
        { error: 'Invalid total amount' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Generate reference number functions
    const generateReference = async () => {
      const date = new Date();
      const year = date.getFullYear().toString().slice(-2);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
      
      const todayCount = await Order.countDocuments({
        createdAt: {
          $gte: startOfDay,
          $lt: endOfDay
        }
      });

      const sequence = (todayCount + 1).toString().padStart(4, '0');
      return `SH-${year}${month}${day}-${sequence}`;
    };

    const generateRandomReference = () => {
      const date = new Date();
      const year = date.getFullYear().toString().slice(-2);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      return `SH-${year}${month}${day}-${random}`;
    };

    // Validate and process each item
    const processedItems: OrderItemDB[] = [];

    for (const item of items) {
      // Validate customization if present
      if (item.customization?.isCustomized) {
        const nameLength = item.customization.name?.length || 0;
        const numberLength = item.customization.number?.length || 0;
        const expectedCost = (nameLength + numberLength) * 2;

        if (item.customization.customizationCost !== expectedCost) {
          return NextResponse.json(
            { error: 'Invalid customization cost' },
            { status: 400 }
          );
        }

        // Validate name characters (letters, dots, apostrophes)
        if (item.customization.name && !/^[A-ZÀ-ÿ.']+$/i.test(item.customization.name)) {
          return NextResponse.json(
            { error: 'Invalid characters in name customization' },
            { status: 400 }
          );
        }

        // Validate number (0-99)
        if (item.customization.number && 
            (!/^\d{1,2}$/.test(item.customization.number) || 
             parseInt(item.customization.number) > 99)) {
          return NextResponse.json(
            { error: 'Invalid jersey number' },
            { status: 400 }
          );
        }
      }

      // Always include baseProductName and baseProductImage if present
      processedItems.push({
        productId: item.productId.toString(),
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        image: item.image,
        baseProductName: item.baseProductName || undefined,
        baseProductImage: item.baseProductImage || undefined,
        customization: item.customization ? {
          name: item.customization.name,
          number: item.customization.number,
          isCustomized: item.customization.isCustomized,
          nameCharacters: item.customization.name?.length || 0,
          numberCharacters: item.customization.number?.length || 0,
          customizationCost: item.customization.customizationCost
        } : undefined
      });
    }

    // Decrement stock for each item atomically before saving the order
    for (const item of processedItems) {
      if (mongoose.Types.ObjectId.isValid(item.productId)) {
        const stockUpdated = await updateProductStock(item.productId, item.size, -item.quantity);
        if (!stockUpdated) {
          return NextResponse.json(
            { error: `Insufficient stock for ${item.name} (size ${item.size})` },
            { status: 400 }
          );
        }
      }
    }

    // Determine order source from first item (if present)
    const orderSource = items?.[0]?.orderSource || undefined;

    // Calculate VAT (UK VAT 20%) on subtotal + shipping cost
    const vatBase = total + shippingDetails.shippingCost;
    const vat = Number((vatBase / 1.2 * 0.2).toFixed(2));

    // Calculate backend total for safety
    const subtotal = processedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const backendTotal = subtotal + shippingDetails.shippingCost;

    // Create and save order with retries
    let order;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        const reference = attempts === 0 ? 
          await generateReference() : 
          generateRandomReference();

        // Create the order
        order = new Order({
          userId: session.user.email,
          reference,
          items: processedItems,
          shippingDetails,
          total: backendTotal,
          vat,
          status: 'pending',
          orderSource,
        });

        await order.save();
        break;
      } catch (error) {
        if (error instanceof Error && 
            'code' in error && 
            (error as any).code === 11000 && 
            (error as any).keyPattern?.reference) {
          // If duplicate reference, try again with a new reference
          attempts++;
          continue;
        }
        throw error;
      }
    }

    if (!order) {
      return NextResponse.json(
        { error: 'Failed to create order after multiple attempts' },
        { status: 500 }
      );
    }

    // Send order confirmation email
    try {
      await sendOrderConfirmationEmail(
        order.reference,
        order.items,
        order.shippingDetails,
        order.total
      );
    } catch (error) {
      console.error('Failed to send order confirmation email:', error);
      // Don't fail the request if email fails
    }

    // Return the order ID and reference
    return NextResponse.json({
      orderId: order._id.toString(),
      reference: order.reference
    });

  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // ... existing authentication and admin validation ...

    const data = await request.json();
    
    // If the order is being cancelled, we need to restore stock
    if (data.status === 'cancelled') {
      const existingOrder = await Order.findById(params.id);
      if (!existingOrder) {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        );
      }

      // Only restore stock if the order was not already cancelled
      if (existingOrder.status !== 'cancelled') {
        // Restore stock for all items
        const stockUpdates = await Promise.all(
          existingOrder.items.map((item: OrderItemDB) =>
            updateProductStock(item.productId, item.size, item.quantity)
          )
        );

        // If any stock update failed, return error
        if (stockUpdates.includes(false)) {
          return NextResponse.json(
            { error: 'Failed to restore stock levels' },
            { status: 500 }
          );
        }
      }
    }

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