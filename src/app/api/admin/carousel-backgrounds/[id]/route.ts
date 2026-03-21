import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import CarouselBackground from '@/backend/models/CarouselBackground';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    await connectToDatabase();
    
    // Check if request contains FormData (image upload) or JSON
    const contentType = request.headers.get('content-type') || '';
    let updateData: any;
    let imageUrl: string | undefined;

    // Try to detect FormData - it will have multipart/form-data in content-type
    if (contentType.includes('multipart/form-data')) {
      // Handle FormData (with image)
      const formData = await request.formData();
      const file = formData.get('image') as File;
      
      // If there's a new image, upload it to Cloudinary
      if (file) {
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
          return NextResponse.json({ error: 'Invalid file type. Only JPG, PNG, and WebP are allowed.' }, { status: 400 });
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          return NextResponse.json({ error: 'File too large. Maximum size is 10MB.' }, { status: 400 });
        }

        // Get existing background to delete old image
        const existingBackground = await (CarouselBackground as any).findById(id);
        if (existingBackground?.imageUrl && existingBackground.imageUrl.includes('cloudinary.com')) {
          try {
            const urlParts = existingBackground.imageUrl.split('/');
            const publicId = urlParts[urlParts.length - 1].split('.')[0];
            const folder = 'carousel-backgrounds';
            const fullPublicId = `${folder}/${publicId}`;
            await cloudinary.uploader.destroy(fullPublicId);
            console.log('🗑️ Deleted old image from Cloudinary:', fullPublicId);
          } catch (fileError) {
            console.warn('Could not delete old image from Cloudinary:', fileError);
          }
        }

        // Convert file to buffer and upload to Cloudinary
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const uploadResult = await new Promise<any>((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            { 
              folder: 'carousel-backgrounds',
              public_id: `carousel-${id}-${Date.now()}`,
              transformation: [
                { width: 1920, crop: 'limit', quality: 'auto' }
              ]
            },
            (error, result) => {
              if (error) {
                console.error('❌ Cloudinary upload error:', error);
                reject(error);
              } else {
                console.log('✅ Cloudinary upload successful:', {
                  secure_url: result?.secure_url,
                  public_id: result?.public_id
                });
                resolve(result);
              }
            }
          ).end(buffer);
        });

        imageUrl = uploadResult.secure_url;
      }

      // Extract form fields
      const orderVal = formData.get('order');
      updateData = {
        title: formData.get('title') as string,
        subtitle: formData.get('subtitle') as string,
        description: formData.get('description') as string,
        buttonText: formData.get('buttonText') as string,
        buttonLink: formData.get('buttonLink') as string,
        bgGradient: formData.get('bgGradient') as string,
        textColor: formData.get('textColor') as string,
        buttonColor: (formData.get('buttonColor') as string) || 'bg-white text-gray-900',
        updatedAt: new Date()
      };
      if (orderVal !== null && orderVal !== undefined && orderVal !== '') {
        const n = parseInt(String(orderVal), 10);
        if (!isNaN(n)) updateData.order = n;
      }

      const buttonMarginTopRaw = formData.get('buttonMarginTop');
      if (buttonMarginTopRaw !== null && buttonMarginTopRaw !== '') {
        const n = parseInt(String(buttonMarginTopRaw), 10);
        if (!isNaN(n)) updateData.buttonMarginTop = Math.min(600, Math.max(0, n));
      }

      // Only update imageUrl if a new image was uploaded
      if (imageUrl) {
        updateData.imageUrl = imageUrl;
      }
    } else {
      // Handle JSON — partial updates (e.g. isActive-only toggle) + full save from admin form
      const body = await request.json();
      updateData = { updatedAt: new Date() } as Record<string, unknown>;

      if (body.title !== undefined) updateData.title = body.title;
      if (body.subtitle !== undefined) updateData.subtitle = body.subtitle;
      if (body.description !== undefined) updateData.description = body.description;
      if (body.buttonText !== undefined) updateData.buttonText = body.buttonText;
      if (body.buttonLink !== undefined) updateData.buttonLink = body.buttonLink;
      if (body.bgGradient !== undefined) updateData.bgGradient = body.bgGradient;
      if (body.textColor !== undefined) updateData.textColor = body.textColor;
      if (body.buttonColor !== undefined) {
        updateData.buttonColor = body.buttonColor || 'bg-white text-gray-900';
      }
      if (body.order !== undefined) {
        const orderNum =
          typeof body.order === 'number' && !Number.isNaN(body.order)
            ? body.order
            : parseInt(String(body.order ?? 0), 10);
        updateData.order = Number.isNaN(orderNum) ? 0 : orderNum;
      }
      if (body.buttonMarginTop !== undefined && body.buttonMarginTop !== null) {
        const marginRaw = body.buttonMarginTop;
        const marginNum =
          typeof marginRaw === 'number' && !Number.isNaN(marginRaw)
            ? marginRaw
            : parseInt(String(marginRaw), 10);
        updateData.buttonMarginTop = Math.min(
          600,
          Math.max(0, Number.isNaN(marginNum) ? 0 : marginNum)
        );
      }
      if (typeof body.isActive === 'boolean') {
        updateData.isActive = body.isActive;
      }
    }

    console.log('🔧 PATCH request received:', { id, updateData });
    console.log('🔧 Button color in request:', updateData.buttonColor);

    console.log('🔧 About to update with data:', updateData);
    
    const background = await (CarouselBackground as any).findByIdAndUpdate(
      id,
      updateData,
      { new: true, upsert: false }
    );

    if (!background) {
      return NextResponse.json({ error: 'Background not found' }, { status: 404 });
    }

    console.log('🔧 Updated background:', background.toObject());
    console.log('🔧 Button color after update:', background.buttonColor);

    return NextResponse.json({
      message: 'Background updated successfully',
      background: {
        id: background._id,
        title: background.title,
        description: background.description,
        imageUrl: background.imageUrl,
        isActive: background.isActive,
        order: background.order,
        createdAt: background.createdAt,
        updatedAt: background.updatedAt
      }
    });

  } catch (error) {
    console.error('Error updating carousel background:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    await connectToDatabase();
    const background = await (CarouselBackground as any).findById(id);

    if (!background) {
      return NextResponse.json({ error: 'Background not found' }, { status: 404 });
    }

    // Delete the file from Cloudinary
    try {
      if (background.imageUrl && background.imageUrl.includes('cloudinary.com')) {
        // Extract public_id from Cloudinary URL
        const urlParts = background.imageUrl.split('/');
        const publicId = urlParts[urlParts.length - 1].split('.')[0];
        const folder = 'carousel-backgrounds';
        const fullPublicId = `${folder}/${publicId}`;
        
        await cloudinary.uploader.destroy(fullPublicId);
        console.log('🗑️ Deleted from Cloudinary:', fullPublicId);
      }
    } catch (fileError) {
      console.warn('Could not delete from Cloudinary:', fileError);
      // Continue with database deletion even if file deletion fails
    }

    // Delete from database
    await (CarouselBackground as any).findByIdAndDelete(id);

    return NextResponse.json({ message: 'Background deleted successfully' });

  } catch (error) {
    console.error('Error deleting carousel background:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
