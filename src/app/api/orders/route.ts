import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectToDatabase } from '@/lib/mongodb';
import Order from '@/backend/models/Order';
import User from '@/backend/models/User';
import Product from '@/backend/models/Product';
import mongoose from 'mongoose';

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
}

// Helper function to update stock levels
async function updateProductStock(productId: string, size: string, quantity: number): Promise<boolean> {
  try {
    // Convert string ID to ObjectId if needed
    const _id = typeof productId === 'string' ? new mongoose.Types.ObjectId(productId) : productId;

    // For decreasing stock (quantity is negative), check if we have enough
    if (quantity < 0) {
      const product = await Product.findById(_id);
      if (!product) {
        console.error(`Product not found: ${productId}`);
        return false;
      }

      const available = product.stock[size] || 0;
      if (available < Math.abs(quantity)) {
        console.error(`Insufficient stock for product ${productId}, size ${size}`);
        return false;
      }
    }

    // Use $inc for atomic update
    const updateQuery = {
      $inc: {
        [`stock.${size}`]: quantity
      }
    };

    // Add a condition to prevent stock from going below 0
    const options = {
      new: true,
      runValidators: true
    };

    const product = await Product.findOneAndUpdate(
      {
        _id,
        [`stock.${size}`]: { $gte: Math.abs(quantity) }
      },
      updateQuery,
      options
    );

    if (!product) {
      console.error(`Failed to update stock for product ${productId}, size ${size}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`Error updating stock for product ${productId}:`, error);
    return false;
  }
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
    await connectToDatabase();

    // Fetch products and validate stock before proceeding
    const stockValidation = await Promise.all(items.map(async (item: any) => {
      const product = await Product.findById(item.productId);
      if (!product) {
        throw new Error(`Product not found: ${item.productId}`);
      }
      
      const available = product.stock[item.size] || 0;
      if (available < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name} (${item.size}): requested ${item.quantity}, available ${available}`);
      }
      
      return {
        ...item,
        currentStock: available
      };
    }));

    // Fetch product images
    const itemsWithImages = await Promise.all(stockValidation.map(async (item: any) => {
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
        const reference = attempts === 0 ? 
          await generateReference() : 
          generateRandomReference();

        // Create the order first
        order = new Order({
          userId: session.user.email,
          reference,
          items: itemsWithImages.map((item: any) => ({
            productId: new mongoose.Types.ObjectId(item.productId),  // Ensure ObjectId
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

        // Save the order
        await order.save();

        // Update stock levels for all items
        const stockUpdates = await Promise.all(
          order.items.map((item: OrderItemDB) =>
            updateProductStock(item.productId.toString(), item.size, -item.quantity)
          )
        );

        // If any stock update failed, throw error to trigger rollback
        if (stockUpdates.includes(false)) {
          await Order.findByIdAndDelete(order._id); // Rollback the order
          throw new Error('Failed to update stock levels');
        }

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
    console.error('Order creation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create order' },
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