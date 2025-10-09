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

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    console.log('🔐 Admin API session check:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      isAdmin: session?.user?.isAdmin,
      userEmail: session?.user?.email
    });
    
    if (!session?.user?.isAdmin) {
      console.log('❌ Admin API: Unauthorized access');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const backgrounds = await CarouselBackground.find({})
      .sort({ order: 1, createdAt: -1 })
      .lean();

    // Transform _id to id for frontend compatibility
    const transformedBackgrounds = backgrounds.map(bg => ({
      ...bg,
      id: bg._id,
      _id: undefined // Remove _id to avoid confusion
    }));

    return NextResponse.json(transformedBackgrounds);
  } catch (error) {
    console.error('Error fetching carousel backgrounds:', error);
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
    const slideId = parseInt(formData.get('slideId') as string);
    const title = formData.get('title') as string;
    const subtitle = formData.get('subtitle') as string;
    const description = formData.get('description') as string;
    const buttonText = formData.get('buttonText') as string;
    const buttonLink = formData.get('buttonLink') as string;
    const bgGradient = formData.get('bgGradient') as string;
    const textColor = formData.get('textColor') as string;
    const buttonColor = formData.get('buttonColor') as string;

    console.log('🎨 Upload form data:', {
      slideId: slideId,
      slideIdType: typeof slideId,
      slideIdString: formData.get('slideId'),
      title: title,
      subtitle: subtitle
    });

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (!slideId || isNaN(slideId)) {
      console.error('❌ Invalid slideId:', slideId, 'from string:', formData.get('slideId'));
      return NextResponse.json({ error: 'Invalid slide ID' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only JPG, PNG, and WebP are allowed.' }, { status: 400 });
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum size is 10MB.' }, { status: 400 });
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { 
          folder: 'carousel-backgrounds',
          public_id: `carousel-${slideId}-${Date.now()}`,
          transformation: [
            { width: 1920, height: 1080, crop: 'fill', quality: 'auto' }
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

    // Save to database
    await connectToDatabase();
    
    console.log('🎨 Creating background object with:', {
      slideId: slideId,
      slideIdType: typeof slideId,
      title: title,
      imageUrl: (uploadResult as any).secure_url
    });
    
    const background = new CarouselBackground({
      slideId: slideId,
      title: title || `Slide ${slideId} Background`,
      subtitle: subtitle || 'Custom Design',
      description: description || 'Custom carousel background',
      buttonText: buttonText || 'EXPLORE',
      buttonLink: buttonLink || '/products',
      imageUrl: (uploadResult as any).secure_url,
      bgGradient: bgGradient || 'from-gray-800 to-gray-900',
      textColor: textColor || 'text-white',
      buttonColor: buttonColor || 'bg-white text-gray-900',
      isActive: true,
      order: slideId
    });

    await background.save();

    console.log('🎨 Saved background to database:', {
      id: background._id,
      slideId: background.slideId,
      title: background.title,
      imageUrl: background.imageUrl,
      isActive: background.isActive,
      allFields: background.toObject()
    });

    return NextResponse.json({ 
      message: 'Background uploaded successfully',
      background: {
        id: background._id,
        slideId: background.slideId,
        title: background.title,
        subtitle: background.subtitle,
        description: background.description,
        buttonText: background.buttonText,
        buttonLink: background.buttonLink,
        imageUrl: background.imageUrl,
        bgGradient: background.bgGradient,
        textColor: background.textColor,
        buttonColor: background.buttonColor,
        isActive: background.isActive,
        order: background.order,
        createdAt: background.createdAt
      }
    });

  } catch (error) {
    console.error('Error uploading carousel background:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
