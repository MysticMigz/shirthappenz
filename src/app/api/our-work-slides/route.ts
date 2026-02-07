import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import OurWorkSlide from '@/backend/models/OurWorkSlide';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    await connectToDatabase();
    const slides = await (OurWorkSlide as any).find({ isActive: true })
      .sort({ order: 1, createdAt: 1 })
      .lean();

    const transformed = slides.map((s: any) => ({
      id: s._id?.toString(),
      imageUrl: s.imageUrl,
      title: s.title,
      subtitle: s.subtitle,
      order: s.order
    }));

    return NextResponse.json(transformed, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Error fetching our-work slides:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
