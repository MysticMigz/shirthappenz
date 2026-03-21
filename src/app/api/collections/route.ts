import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import Collection from '@/backend/models/Collection';
import Product from '@/backend/models/Product';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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

    const collections = await (Collection as any).find(query)
      .sort(sort)
      .lean();

    // If including products, populate them
    if (includeProducts) {
      const collectionsWithProducts = await Promise.all(
        collections.map(async (collection) => {
          const products = await (Product as any).find({ collections: collection._id })
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
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    const contentType = request.headers.get('content-type') || '';
    let collectionData: any = {};

    if (contentType.includes('multipart/form-data')) {
      // Handle FormData (with image uploads)
      const formData = await request.formData();
      const imageFile = formData.get('image') as File;
      const bannerImageFile = formData.get('bannerImage') as File;
      
      collectionData.name = formData.get('name') as string;
      collectionData.description = formData.get('description') as string;
      collectionData.slug = formData.get('slug') as string;
      collectionData.isActive = formData.get('isActive') === 'true';
      collectionData.featured = formData.get('featured') === 'true';
      collectionData.sortOrder = parseInt(formData.get('sortOrder') as string) || 0;
      collectionData.imageAlt = formData.get('imageAlt') as string || '';
      collectionData.bannerImageAlt = formData.get('bannerImageAlt') as string || '';

      // Upload collection image if provided
      if (imageFile && imageFile.size > 0) {
        const arrayBuffer = await imageFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const uploadResult = await new Promise<any>((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            { 
              folder: 'collections',
              public_id: `collection-${Date.now()}`,
              // limit = fit inside box, preserve aspect ratio (no crop)
              transformation: [
                { width: 800, height: 800, crop: 'limit', quality: 'auto' }
              ]
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(buffer);
        });

        collectionData.image = {
          url: uploadResult.secure_url,
          alt: collectionData.imageAlt
        };
      } else if (formData.get('imageUrl')) {
        collectionData.image = {
          url: formData.get('imageUrl') as string,
          alt: collectionData.imageAlt
        };
      }

      // Upload banner image if provided
      if (bannerImageFile && bannerImageFile.size > 0) {
        const arrayBuffer = await bannerImageFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const uploadResult = await new Promise<any>((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            { 
              folder: 'collections',
              public_id: `collection-banner-${Date.now()}`,
              transformation: [
                { width: 1920, crop: 'limit', quality: 'auto' }
              ]
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(buffer);
        });

        collectionData.bannerImage = {
          url: uploadResult.secure_url,
          alt: collectionData.bannerImageAlt
        };
      } else if (formData.get('bannerImageUrl')) {
        collectionData.bannerImage = {
          url: formData.get('bannerImageUrl') as string,
          alt: collectionData.bannerImageAlt
        };
      }
    } else {
      // Handle JSON (no file uploads)
      const data = await request.json();
      collectionData = data;
    }
    
    // Validate required fields
    if (!collectionData.name || !collectionData.description) {
      return NextResponse.json(
        { error: 'Name and description are required' },
        { status: 400 }
      );
    }

    // Generate slug if not provided
    if (!collectionData.slug) {
      collectionData.slug = collectionData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }

    const collection = await (Collection as any).create(collectionData);
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
