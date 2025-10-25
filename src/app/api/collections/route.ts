import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Collection from '@/backend/models/Collection';
import Product from '@/backend/models/Product';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const includeProducts = searchParams.get('includeProducts') === 'true';
    const isActive = searchParams.get('isActive');
    const featured = searchParams.get('featured');
    const sortBy = searchParams.get('sortBy') || 'sortOrder';

    // Build query
    const query: any = {};
    if (isActive !== null) {
      query.isActive = isActive === 'true';
    }
    if (featured !== null) {
      query.featured = featured === 'true';
    }

    // Build sort
    let sort: any = { sortOrder: 1, createdAt: -1 };
    if (sortBy === 'name') sort = { name: 1 };
    if (sortBy === 'created') sort = { createdAt: -1 };
    if (sortBy === 'updated') sort = { updatedAt: -1 };

    const collections = await Collection.find(query)
      .sort(sort)
      .lean();

    // If including products, populate them
    if (includeProducts) {
      const collectionsWithProducts = await Promise.all(
        collections.map(async (collection) => {
          const products = await Product.find({ collections: collection._id })
            .select('name price basePrice images category gender featured')
            .lean();
          
          return {
            ...collection,
            products
          };
        })
      );
      
      return NextResponse.json({ collections: collectionsWithProducts });
    }

    return NextResponse.json({ collections });
  } catch (error) {
    console.error('Error fetching collections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch collections' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const data = await request.json();
    
    // Validate required fields
    if (!data.name || !data.description) {
      return NextResponse.json(
        { error: 'Name and description are required' },
        { status: 400 }
      );
    }

    // Generate slug if not provided
    if (!data.slug) {
      data.slug = data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }

    const collection = await Collection.create(data);
    return NextResponse.json(collection, { status: 201 });
  } catch (error: any) {
    console.error('Error creating collection:', error);
    
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Collection with this name or slug already exists' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create collection' },
      { status: 500 }
    );
  }
}
