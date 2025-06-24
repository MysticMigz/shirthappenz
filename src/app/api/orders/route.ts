import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectToDatabase } from '@/lib/mongodb';
import Order from '@/backend/models/Order';
import User from '@/backend/models/User';
import Product from '@/backend/models/Product';

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

export async function GET() {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const orders = await Order.find({ userId: session.user.email })
      .populate({
        path: 'items.productId',
        model: 'Product',
        select: 'images'
      })
      .sort({ createdAt: -1 })
      .lean()
      .then(orders => {
        // Transform the populated data to include image URLs
        return orders.map(order => ({
          ...order,
          items: order.items.map((item: OrderItem): TransformedOrderItem => ({
            ...item,
            image: (item.productId as PopulatedProduct)?.images?.[0]?.url || null,
            productId: (item.productId as PopulatedProduct)?._id || (item.productId as string)
          }))
        }));
      });

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
        !shippingDetails?.postcode) {
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

    // Connect to database
    try {
      await connectToDatabase();
    } catch (error) {
      console.error('Database connection error:', error);
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    // Fetch product images for each item
    const itemsWithImages = await Promise.all(items.map(async (item: any) => {
      try {
        const product = await Product.findById(item.productId).select('images');
        return {
          ...item,
          image: product?.images?.[0]?.url || item.image || null
        };
      } catch (error) {
        console.error(`Failed to fetch product ${item.productId}:`, error);
        return item;
      }
    }));

    // Generate initial reference number
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

    // Generate random reference as fallback
    const generateRandomReference = () => {
      const date = new Date();
      const year = date.getFullYear().toString().slice(-2);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      return `SH-${year}${month}${day}-${random}`;
    };

    // Create and save order with retries
    let order;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        // Generate reference based on attempt number
        const reference = attempts === 0 ? 
          await generateReference() : 
          generateRandomReference();

        // Create a new order instance
        order = new Order({
          userId: session.user.email,
          reference,
          items: itemsWithImages.map((item: any) => ({
            productId: item.productId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            size: item.size,
            color: item.color,
            image: item.image
          })),
          shippingDetails: {
            firstName: shippingDetails.firstName,
            lastName: shippingDetails.lastName,
            email: shippingDetails.email,
            phone: shippingDetails.phone,
            address: shippingDetails.address,
            addressLine2: shippingDetails.addressLine2 || '',
            city: shippingDetails.city,
            county: shippingDetails.county || '',
            postcode: shippingDetails.postcode,
            country: shippingDetails.country || 'United Kingdom'
          },
          total,
          status: 'pending',
          createdAt: new Date(),
        });

        // Save the order and wait for it to complete
        await order.save();

        // If we get here, the save was successful
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

        console.error(`Order creation attempt ${attempts + 1} failed:`, error);
        attempts++;
        
        if (attempts === maxAttempts) {
          return NextResponse.json(
            { error: 'Failed to create order after multiple attempts' },
            { status: 500 }
          );
        }
        
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 100));
      }
    }

    // Final verification
    if (!order?._id || !order?.reference) {
      console.error('Order or reference missing after creation:', order);
      return NextResponse.json(
        { error: 'Order creation failed - missing data' },
        { status: 500 }
      );
    }

    // Log success
    console.log('Order created successfully:', {
      id: order._id,
      reference: order.reference,
      userId: order.userId,
      total: order.total,
      items: order.items.length
    });

    return NextResponse.json({ 
      orderId: order._id,
      reference: order.reference
    });
  } catch (error) {
    // Log the full error for debugging
    console.error('Unexpected error in order creation:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 