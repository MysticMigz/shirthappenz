import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectToDatabase } from '@/lib/mongodb';
import Supply from '@/backend/models/Supply';
import User from '@/backend/models/User';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    // Get user and check admin status
    const user = await User.findOne({ email: session.user.email });
    if (!user?.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const supplier = searchParams.get('supplier');
    const search = searchParams.get('search');

    // Build query
    let query: any = {};
    if (category) query.category = category;
    if (supplier) query['supplier.name'] = supplier;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const supplies = await Supply.find(query).sort({ category: 1, name: 1 });
    return NextResponse.json(supplies);

  } catch (error) {
    console.error('Error fetching supplies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch supplies' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    // Get user and check admin status
    const user = await User.findOne({ email: session.user.email });
    if (!user?.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const data = await request.json();

    // Validate required fields
    if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (!data.price || typeof data.price !== 'number' || data.price < 0) {
      return NextResponse.json({ error: 'Valid price is required' }, { status: 400 });
    }

    if (!data.unit || typeof data.unit !== 'string' || !data.unit.trim()) {
      return NextResponse.json({ error: 'Unit is required' }, { status: 400 });
    }

    if (!data.category || typeof data.category !== 'string' || !data.category.trim()) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 });
    }

    if (!data.supplier || typeof data.supplier !== 'object' || !data.supplier.name || !data.supplier.name.trim()) {
      return NextResponse.json({ error: 'Supplier name is required' }, { status: 400 });
    }

    // Create new supply with cleaned data
    const supply = new Supply({
      name: data.name.trim(),
      description: data.description?.trim() || '',
      price: Number(data.price),
      unit: data.unit.trim(),
      category: data.category.trim(),
      minimumOrderQuantity: data.minimumOrderQuantity || 1,
      image: data.image || null,
      supplier: {
        name: data.supplier.name.trim(),
        contactInfo: data.supplier.contactInfo?.trim() || '',
        website: data.supplier.website?.trim() || ''
      },
      notes: data.notes?.trim() || ''
    });

    await supply.save();
    return NextResponse.json(supply);

  } catch (error) {
    console.error('Error creating supply:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create supply' },
      { status: 500 }
    );
  }
} 