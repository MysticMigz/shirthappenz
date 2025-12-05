import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import Order from '@/backend/models/Order';
import User from '@/backend/models/User';
import Product from '@/backend/models/Product';
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
      order = await (Order as any).findOne({ _id: params.id }).lean();
      order = order as any;
    } else {
      const session = await getServerSession(authOptions);
      if (!session?.user?.email) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
      order = await (Order as any).findOne({
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

    // Fetch product data for each item to get mockupImage and designImage
    const itemsWithProductData = await Promise.all(
      order.items.map(async (item: any) => {
        let mockupImage = undefined;
        let designImage = undefined;
        let productImage = item.image; // Use stored image as fallback
        
        // Try to fetch product to get mockupImage and designImage
        if (item.productId && mongoose.Types.ObjectId.isValid(item.productId)) {
          try {
            const product = await (Product as any).findById(item.productId).lean();
            if (product) {
              if (product.mockupImage) {
                mockupImage = {
                  url: product.mockupImage.url,
                  alt: product.mockupImage.alt || item.name
                };
              }
              if (product.designImage) {
                designImage = {
                  url: product.designImage.url,
                  alt: product.designImage.alt || item.name,
                  position: product.designImage.position,
                  scale: product.designImage.scale,
                  rotation: product.designImage.rotation
                };
              }
              
              // If no image stored in order, try to get from product
              if (!productImage && product.images && product.images.length > 0) {
                // Try to find color-specific image first
                if (item.color) {
                  const colorImage = product.images.find((img: any) => img.color === item.color);
                  if (colorImage) {
                    productImage = colorImage.url;
                  }
                }
                // Fallback to first image
                if (!productImage) {
                  productImage = product.images[0].url;
                }
              }
              
              // Also check if color has imageUrl
              if (!productImage && item.color && product.colors) {
                const colorData = product.colors.find((c: any) => c.name === item.color);
                if (colorData?.imageUrl) {
                  productImage = colorData.imageUrl;
                }
              }
            }
          } catch (error) {
            console.error(`Error fetching product ${item.productId}:`, error);
            // Continue without product data
          }
        }
        
        return {
          productId: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          size: item.size,
          color: item.color,
          image: productImage,
          mockupImage: mockupImage,
          designImage: designImage,
          baseProductName: item.baseProductName,
          baseProductImage: item.baseProductImage,
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
        };
      })
    );

    return NextResponse.json({
      _id: order._id.toString(),
      reference: order.reference,
      status: order.status,
      total: order.total,
      vat: order.vat,
      // Voucher fields
      voucherCode: order.voucherCode,
      voucherDiscount: order.voucherDiscount,
      voucherType: order.voucherType,
      voucherValue: order.voucherValue,
      voucherId: order.voucherId,
      items: itemsWithProductData,
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
    const user = await (User as any).findOne({ email: session.user.email });
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
    const order = await (Order as any).findByIdAndUpdate(
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
    const user = await (User as any).findOne({ email: session.user.email });
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

    const order = await (Order as any).findByIdAndDelete(params.id);
    
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