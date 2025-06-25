import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectToDatabase } from '@/lib/mongodb';
import Supply from '@/backend/models/Supply';
import User from '@/backend/models/User';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const user = await User.findOne({ email: session.user.email });
    if (!user?.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const supply = await Supply.findById(params.id);
    if (!supply) {
      return NextResponse.json(
        { error: 'Supply not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(supply);
  } catch (error) {
    console.error('Error fetching supply:', error);
    return NextResponse.json(
      { error: 'Failed to fetch supply' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const user = await User.findOne({ email: session.user.email });
    if (!user?.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const data = await request.json();

    // Validate required fields
    if (data.name && (typeof data.name !== 'string' || !data.name.trim())) {
      return NextResponse.json({ error: 'Invalid name' }, { status: 400 });
    }

    if (data.price && (typeof data.price !== 'number' || data.price < 0)) {
      return NextResponse.json({ error: 'Invalid price' }, { status: 400 });
    }

    if (data.unit && (typeof data.unit !== 'string' || !data.unit.trim())) {
      return NextResponse.json({ error: 'Invalid unit' }, { status: 400 });
    }

    if (data.category && (typeof data.category !== 'string' || !data.category.trim())) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }

    if (data.supplier && (typeof data.supplier !== 'object' || !data.supplier.name || !data.supplier.name.trim())) {
      return NextResponse.json({ error: 'Invalid supplier data' }, { status: 400 });
    }

    // Find and update the supply
    const supply = await Supply.findById(params.id);
    if (!supply) {
      return NextResponse.json(
        { error: 'Supply not found' },
        { status: 404 }
      );
    }

    // Update fields
    if (data.name) supply.name = data.name.trim();
    if (data.description !== undefined) supply.description = data.description?.trim() || '';
    if (data.price !== undefined) supply.price = Number(data.price);
    if (data.unit) supply.unit = data.unit.trim();
    if (data.category) supply.category = data.category.trim();
    if (data.minimumOrderQuantity !== undefined) supply.minimumOrderQuantity = data.minimumOrderQuantity;
    if (data.image !== undefined) supply.image = data.image || null;
    if (data.supplier) {
      supply.supplier = {
        name: data.supplier.name.trim(),
        contactInfo: data.supplier.contactInfo?.trim() || '',
        website: data.supplier.website?.trim() || ''
      };
    }
    if (data.notes !== undefined) supply.notes = data.notes?.trim() || '';

    await supply.save();
    return NextResponse.json(supply);

  } catch (error) {
    console.error('Error updating supply:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update supply' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const user = await User.findOne({ email: session.user.email });
    if (!user?.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const supply = await Supply.findById(params.id);
    if (!supply) {
      return NextResponse.json(
        { error: 'Supply not found' },
        { status: 404 }
      );
    }

    await supply.deleteOne();
    return NextResponse.json({ message: 'Supply deleted successfully' });

  } catch (error) {
    console.error('Error deleting supply:', error);
    return NextResponse.json(
      { error: 'Failed to delete supply' },
      { status: 500 }
    );
  }
} 