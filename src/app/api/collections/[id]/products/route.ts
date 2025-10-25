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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const gender = searchParams.get('gender');
    const category = searchParams.get('category');

    // Verify collection exists
    const collection = await Collection.findById(params.id);
    if (!collection) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      );
    }

    // Build query
    const query: any = { collections: params.id };
    if (gender) {
      if (gender === 'men' || gender === 'women') {
        query.$or = [
          { gender: gender },
          { gender: 'unisex' }
        ];
      } else {
        query.gender = gender;
      }
    }
    if (category) {
      query.category = category;
    }

    // Build sort
    let sort: any = { createdAt: -1 };
    if (sortBy === 'price-asc') sort = { basePrice: 1 };
    if (sortBy === 'price-desc') sort = { basePrice: -1 };
    if (sortBy === 'name-asc') sort = { name: 1 };
    if (sortBy === 'name-desc') sort = { name: -1 };
    if (sortBy === 'featured') sort = { featured: -1, createdAt: -1 };

    // Get total count
    const total = await Product.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    // Fetch products
    const products = await Product.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return NextResponse.json({
      products,
      collection: {
        _id: collection._id,
        name: collection.name,
        description: collection.description,
        image: collection.image
      },
      pagination: {
        total,
        pages: totalPages,
        page,
        limit
      }
    });
  } catch (error) {
    console.error('Error fetching collection products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch collection products' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const { productIds } = await request.json();
    
    if (!productIds || !Array.isArray(productIds)) {
      return NextResponse.json(
        { error: 'Product IDs array is required' },
        { status: 400 }
      );
    }

    // Verify collection exists
    const collection = await Collection.findById(params.id);
    if (!collection) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      );
    }

    // Add products to collection
    const result = await Product.updateMany(
      { _id: { $in: productIds } },
      { $addToSet: { collections: params.id } }
    );

    return NextResponse.json({
      message: `Added ${result.modifiedCount} products to collection`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error adding products to collection:', error);
    return NextResponse.json(
      { error: 'Failed to add products to collection' },
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
    const { productIds } = await request.json();
    
    if (!productIds || !Array.isArray(productIds)) {
      return NextResponse.json(
        { error: 'Product IDs array is required' },
        { status: 400 }
      );
    }

    // Remove products from collection
    const result = await Product.updateMany(
      { _id: { $in: productIds } },
      { $pull: { collections: params.id } }
    );

    return NextResponse.json({
      message: `Removed ${result.modifiedCount} products from collection`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error removing products from collection:', error);
    return NextResponse.json(
      { error: 'Failed to remove products from collection' },
      { status: 500 }
    );
  }
}
