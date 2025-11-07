import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Collection from '@/backend/models/Collection';
import Product from '@/backend/models/Product';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const includeProducts = searchParams.get('includeProducts') === 'true';

    const collection = await (Collection as any).findById(params.id).lean();
    
    if (!collection) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      );
    }

    if (includeProducts) {
      const products = await (Product as any).find({ collections: params.id })
        .select('name price basePrice images category gender featured')
        .lean();
      
      return NextResponse.json({
        ...collection,
        products
      });
    }

    return NextResponse.json(collection);
  } catch (error) {
    console.error('Error fetching collection:', error);
    return NextResponse.json(
      { error: 'Failed to fetch collection' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const data = await request.json();
    
    // Remove fields that shouldn't be updated directly
    delete data._id;
    delete data.createdAt;
    
    // Update slug if name changed
    if (data.name && !data.slug) {
      data.slug = data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }

    const collection = await (Collection as any).findByIdAndUpdate(
      params.id,
      { ...data, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!collection) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(collection);
  } catch (error: any) {
    console.error('Error updating collection:', error);
    
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Collection with this name or slug already exists' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update collection' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    
    // Check if collection has products
    const productsCount = await (Product as any).countDocuments({ collections: params.id });
    if (productsCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete collection with products. Remove products first.' },
        { status: 400 }
      );
    }

    const collection = await (Collection as any).findByIdAndDelete(params.id);
    
    if (!collection) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Collection deleted successfully' });
  } catch (error) {
    console.error('Error deleting collection:', error);
    return NextResponse.json(
      { error: 'Failed to delete collection' },
      { status: 500 }
    );
  }
}
