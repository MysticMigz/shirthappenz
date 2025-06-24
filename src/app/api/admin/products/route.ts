import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/backend/utils/database';
import { requireAdmin } from '@/backend/utils/auth';
import Product from '@/backend/models/Product';

// Get all products
export async function GET(request: NextRequest) {
  try {
    // Check admin authorization
    const admin = await requireAdmin(request);
    if (admin instanceof NextResponse) return admin;

    await connectToDatabase();
    
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
    // Check admin authorization
    const admin = await requireAdmin(request);
    if (admin instanceof NextResponse) return admin;

    await connectToDatabase();
    
    const data = await request.json();
    
    // Validate required fields
    const requiredFields = ['name', 'description', 'price', 'category', 'basePrice'];
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }
    
    // Create new product
    const product = new Product(data);
    await product.save();
    
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
} 