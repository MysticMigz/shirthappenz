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

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDatabase();
    const slides = await (OurWorkSlide as any).find({}).sort({ order: 1, createdAt: 1 }).lean();
    const transformed = slides.map((s: any) => ({
      ...s,
      id: s._id?.toString(),
      _id: undefined
    }));
    return NextResponse.json(transformed);
  } catch (error) {
    console.error('Error fetching our-work slides (admin):', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('image') as File;
    const title = (formData.get('title') as string) || '';
    const subtitle = (formData.get('subtitle') as string) || '';
    const order = parseInt(String(formData.get('order') || '0'), 10) || 0;

    if (!file) {
      return NextResponse.json({ error: 'No image uploaded' }, { status: 400 });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only JPG, PNG, and WebP are allowed.' }, { status: 400 });
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum size is 10MB.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadResult = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: FOLDER,
          public_id: `slide-${Date.now()}`,
          transformation: [{ width: 1920, height: 1080, crop: 'fill', quality: 'auto' }]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    });

    await connectToDatabase();
    const slide = new (OurWorkSlide as any)({
      imageUrl: uploadResult.secure_url,
      title: title.trim(),
      subtitle: subtitle.trim(),
      order: isNaN(order) ? 0 : order,
      isActive: true
    });
    await slide.save();

    return NextResponse.json({
      message: 'Slide created',
      slide: {
        id: slide._id,
        imageUrl: slide.imageUrl,
        title: slide.title,
        subtitle: slide.subtitle,
        order: slide.order,
        isActive: slide.isActive,
        createdAt: slide.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating our-work slide:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
