import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/backend/utils/database';
import { requireAdmin } from '@/backend/utils/auth';
import Product from '@/backend/models/Product';

// Get single product
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin authorization
    const admin = await requireAdmin(request);
    if (admin instanceof NextResponse) return admin;

    await connectToDatabase();
    
    const product = await Product.findById(params.id);
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

// Update product
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    const product = await Product.findByIdAndUpdate(
      params.id,
      { ...data, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

// Delete product
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin authorization
    const admin = await requireAdmin(request);
    if (admin instanceof NextResponse) return admin;

    await connectToDatabase();
    
    const product = await Product.findByIdAndDelete(params.id);
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
} 