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
    const body = await request.json();

    console.log('🔧 PATCH request received:', { id, body });
    console.log('🔧 Button color in request:', body.buttonColor);

    await connectToDatabase();
    
    // Ensure buttonColor has a default value if not provided
    const updateData = {
      ...body,
      buttonColor: body.buttonColor || 'bg-white text-gray-900',
      updatedAt: new Date()
    };
    
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
