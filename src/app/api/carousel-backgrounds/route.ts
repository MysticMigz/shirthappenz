import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import CarouselBackground from '@/backend/models/CarouselBackground';

export async function GET() {
  try {
    await connectToDatabase();
    const backgrounds = await CarouselBackground.find({ isActive: true })
      .sort({ order: 1, createdAt: -1 })
      .lean();

    // Transform _id to id for frontend compatibility
    const transformedBackgrounds = backgrounds.map(bg => ({
      ...bg,
      id: bg._id,
      _id: undefined // Remove _id to avoid confusion
    }));

    console.log('🎨 API: Found carousel backgrounds:', transformedBackgrounds.length);
    console.log('🎨 API: Raw backgrounds from DB:', backgrounds);
    transformedBackgrounds.forEach((bg, index) => {
      console.log(`🎨 API: Background ${index}:`, {
        id: bg.id,
        slideId: bg.slideId,
        title: bg.title,
        imageUrl: bg.imageUrl,
        isActive: bg.isActive,
        hasSlideId: !!bg.slideId
      });
    });

    return NextResponse.json(transformedBackgrounds);
  } catch (error) {
    console.error('Error fetching active carousel backgrounds:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
