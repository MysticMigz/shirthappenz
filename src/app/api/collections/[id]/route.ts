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
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    const contentType = request.headers.get('content-type') || '';
    let updateData: any = {};

    if (contentType.includes('multipart/form-data')) {
      // Handle FormData (with image uploads)
      const formData = await request.formData();
      const imageFile = formData.get('image') as File;
      const bannerImageFile = formData.get('bannerImage') as File;
      
      updateData.name = formData.get('name') as string;
      updateData.description = formData.get('description') as string;
      updateData.slug = formData.get('slug') as string;
      updateData.isActive = formData.get('isActive') === 'true';
      updateData.featured = formData.get('featured') === 'true';
      updateData.sortOrder = parseInt(formData.get('sortOrder') as string) || 0;
      updateData.imageAlt = formData.get('imageAlt') as string || '';
      updateData.bannerImageAlt = formData.get('bannerImageAlt') as string || '';

      // Get existing collection to delete old images if needed
      const existingCollection = await (Collection as any).findById(params.id);
      if (!existingCollection) {
        return NextResponse.json(
          { error: 'Collection not found' },
          { status: 404 }
        );
      }

      // Upload new collection image if provided
      if (imageFile && imageFile.size > 0) {
        // Delete old image from Cloudinary if it exists
        if (existingCollection.image?.url && existingCollection.image.url.includes('cloudinary.com')) {
          try {
            const urlParts = existingCollection.image.url.split('/');
            const publicId = urlParts[urlParts.length - 1].split('.')[0];
            const folder = 'collections';
            const fullPublicId = `${folder}/${publicId}`;
            await cloudinary.uploader.destroy(fullPublicId);
          } catch (fileError) {
            console.warn('Could not delete old image from Cloudinary:', fileError);
          }
        }

        const arrayBuffer = await imageFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const uploadResult = await new Promise<any>((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            { 
              folder: 'collections',
              public_id: `collection-${params.id}-${Date.now()}`,
              transformation: [
                { width: 800, height: 800, crop: 'fill', quality: 'auto' }
              ]
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(buffer);
        });

        updateData.image = {
          url: uploadResult.secure_url,
          alt: updateData.imageAlt
        };
      } else if (formData.get('imageUrl')) {
        updateData.image = {
          url: formData.get('imageUrl') as string,
          alt: updateData.imageAlt
        };
      } else if (existingCollection.image) {
        // Keep existing image but update alt text if changed
        updateData.image = {
          url: existingCollection.image.url,
          alt: updateData.imageAlt || existingCollection.image.alt
        };
      }

      // Upload new banner image if provided
      if (bannerImageFile && bannerImageFile.size > 0) {
        // Delete old banner image from Cloudinary if it exists
        if (existingCollection.bannerImage?.url && existingCollection.bannerImage.url.includes('cloudinary.com')) {
          try {
            const urlParts = existingCollection.bannerImage.url.split('/');
            const publicId = urlParts[urlParts.length - 1].split('.')[0];
            const folder = 'collections';
            const fullPublicId = `${folder}/${publicId}`;
            await cloudinary.uploader.destroy(fullPublicId);
          } catch (fileError) {
            console.warn('Could not delete old banner image from Cloudinary:', fileError);
          }
        }

        const arrayBuffer = await bannerImageFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const uploadResult = await new Promise<any>((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            { 
              folder: 'collections',
              public_id: `collection-banner-${params.id}-${Date.now()}`,
              transformation: [
                { width: 1920, height: 600, crop: 'fill', quality: 'auto' }
              ]
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(buffer);
        });

        updateData.bannerImage = {
          url: uploadResult.secure_url,
          alt: updateData.bannerImageAlt
        };
      } else if (formData.get('bannerImageUrl')) {
        updateData.bannerImage = {
          url: formData.get('bannerImageUrl') as string,
          alt: updateData.bannerImageAlt
        };
      } else if (existingCollection.bannerImage) {
        // Keep existing banner image but update alt text if changed
        updateData.bannerImage = {
          url: existingCollection.bannerImage.url,
          alt: updateData.bannerImageAlt || existingCollection.bannerImage.alt
        };
      }
    } else {
      // Handle JSON (no file uploads)
      const data = await request.json();
      updateData = data;
    }
    
    // Remove fields that shouldn't be updated directly
    delete updateData._id;
    delete updateData.createdAt;
    
    // Update slug if name changed
    if (updateData.name && !updateData.slug) {
      updateData.slug = updateData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }

    const collection = await (Collection as any).findByIdAndUpdate(
      params.id,
      { ...updateData, updatedAt: new Date() },
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
