import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import OurWorkSlide from '@/backend/models/OurWorkSlide';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const FOLDER = 'our-work-slides';

function parsePublicId(imageUrl: string): string | null {
  if (!imageUrl || !imageUrl.includes('cloudinary.com')) return null;
  const parts = imageUrl.split('/');
  const filename = parts[parts.length - 1];
  const publicId = filename.split('.')[0];
  return `${FOLDER}/${publicId}`;
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectToDatabase();

    const contentType = request.headers.get('content-type') || '';
    let updateData: Record<string, unknown> = { updatedAt: new Date() };

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('image') as File | null;

      if (file && file.size > 0) {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
          return NextResponse.json({ error: 'Invalid file type.' }, { status: 400 });
        }
        if (file.size > 10 * 1024 * 1024) {
          return NextResponse.json({ error: 'File too large. Max 10MB.' }, { status: 400 });
        }

        const existing = await (OurWorkSlide as any).findById(id);
        if (existing?.imageUrl) {
          const fullPublicId = parsePublicId(existing.imageUrl);
          if (fullPublicId) {
            try {
              await cloudinary.uploader.destroy(fullPublicId);
            } catch (e) {
              console.warn('Cloudinary delete failed:', e);
            }
          }
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const uploadResult = await new Promise<any>((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              folder: FOLDER,
              public_id: `slide-${id}-${Date.now()}`,
              transformation: [{ width: 1920, height: 1080, crop: 'fill', quality: 'auto' }]
            },
            (err, result) => (err ? reject(err) : resolve(result))
          ).end(buffer);
        });
        updateData.imageUrl = uploadResult.secure_url;
      }

      const title = formData.get('title');
      const subtitle = formData.get('subtitle');
      const order = formData.get('order');
      const isActive = formData.get('isActive');
      if (title !== null && title !== undefined) updateData.title = String(title).trim();
      if (subtitle !== null && subtitle !== undefined) updateData.subtitle = String(subtitle).trim();
      if (order !== null && order !== undefined) {
        const n = parseInt(String(order), 10);
        if (!isNaN(n)) updateData.order = n;
      }
      if (isActive !== null && isActive !== undefined) {
        updateData.isActive = String(isActive) === 'true';
      }
    } else {
      const body = await request.json();
      if (body.title !== undefined) updateData.title = String(body.title).trim();
      if (body.subtitle !== undefined) updateData.subtitle = String(body.subtitle).trim();
      if (body.order !== undefined) {
        const n = parseInt(body.order, 10);
        if (!isNaN(n)) updateData.order = n;
      }
      if (body.isActive !== undefined) updateData.isActive = !!body.isActive;
    }

    const slide = await (OurWorkSlide as any).findByIdAndUpdate(id, updateData, { new: true });
    if (!slide) {
      return NextResponse.json({ error: 'Slide not found' }, { status: 404 });
    }
    return NextResponse.json({
      message: 'Updated',
      slide: {
        id: slide._id,
        imageUrl: slide.imageUrl,
        title: slide.title,
        subtitle: slide.subtitle,
        order: slide.order,
        isActive: slide.isActive
      }
    });
  } catch (error) {
    console.error('Error updating our-work slide:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectToDatabase();
    const slide = await (OurWorkSlide as any).findById(id);
    if (!slide) {
      return NextResponse.json({ error: 'Slide not found' }, { status: 404 });
    }

    const fullPublicId = parsePublicId(slide.imageUrl);
    if (fullPublicId) {
      try {
        await cloudinary.uploader.destroy(fullPublicId);
      } catch (e) {
        console.warn('Cloudinary delete failed:', e);
      }
    }

    await (OurWorkSlide as any).findByIdAndDelete(id);
    return NextResponse.json({ message: 'Slide deleted' });
  } catch (error) {
    console.error('Error deleting our-work slide:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
