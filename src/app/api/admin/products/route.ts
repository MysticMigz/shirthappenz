import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectToDatabase } from '@/backend/utils/database';
import Product from '@/backend/models/Product';
import User from '@/backend/models/User';

interface ProductData {
  name: string;
  description: string;
  price: number;
  basePrice: number;
  category: string;
  sizes: string[];
  colors: Array<{ name: string; hexCode: string }>;
  images: Array<{ url: string; alt: string }>;
  stock: { [key: string]: number };
  featured?: boolean;
  customizable?: boolean;
  gender: string;
}

// Get all products
export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin status
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectToDatabase();
    
    // Verify admin status
    const user = await User.findOne({ email: session.user.email });
    if (!user?.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    
    // Build query
    const query: any = {};
    if (search) {
      query.$text = { $search: search };
    }
    if (category) {
      query.category = category;
    }
    
    // Execute query with pagination
    const skip = (page - 1) * limit;
    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Product.countDocuments(query);
    
    return NextResponse.json({
      products,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// Create new product
export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin status
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectToDatabase();
    
    // Verify admin status
    const user = await User.findOne({ email: session.user.email });
    if (!user?.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const data = await request.json() as ProductData;
    console.log('Received product data:', data);

    // Validate required fields
    if (!data.name || !data.description || !data.price || !data.category || !data.basePrice) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate stock data
    if (typeof data.stock !== 'object' || data.stock === null) {
      return NextResponse.json(
        { error: 'Invalid stock data format' },
        { status: 400 }
      );
    }

    // Ensure all stock quantities are non-negative integers
    for (const [size, quantity] of Object.entries(data.stock)) {
      if (!Number.isInteger(quantity) || quantity < 0) {
        return NextResponse.json(
          { error: `Invalid stock quantity for size ${size}. Must be a non-negative integer.` },
          { status: 400 }
        );
      }
    }

    // Create product with properly formatted data
    const productData = {
      name: data.name.trim(),
      description: data.description.trim(),
      price: Number(data.price),
      basePrice: Number(data.basePrice),
      category: data.category,
      gender: data.gender,
      sizes: Array.isArray(data.sizes) ? data.sizes : [],
      colors: Array.isArray(data.colors) ? data.colors : [],
      images: Array.isArray(data.images) ? data.images : [],
      stock: data.stock,
      featured: Boolean(data.featured),
      customizable: data.customizable ?? true
    };

    const product = await Product.create(productData);
    
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create product' },
      { status: 500 }
    );
  }
} 