import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
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

    await connectToDatabase();
    const background = await CarouselBackground.findByIdAndUpdate(
      id,
      { ...body, updatedAt: new Date() },
      { new: true }
    );

    if (!background) {
      return NextResponse.json({ error: 'Background not found' }, { status: 404 });
    }

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
    const background = await CarouselBackground.findById(id);

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
    await CarouselBackground.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Background deleted successfully' });

  } catch (error) {
    console.error('Error deleting carousel background:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
