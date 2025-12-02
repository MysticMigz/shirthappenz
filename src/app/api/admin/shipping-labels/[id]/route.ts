import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/backend/utils/database';
import ShippingLabel from '@/backend/models/ShippingLabel';
import ShipEngineAPI from '@/lib/shipengine';

// GET - Get a specific shipping label
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const label = await (ShippingLabel as any).findById(params.id);
    if (!label) {
      return NextResponse.json(
        { error: 'Shipping label not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ label });
  } catch (error) {
    console.error('Error fetching shipping label:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shipping label' },
      { status: 500 }
    );
  }
}

// DELETE - Void a shipping label
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const label = await (ShippingLabel as any).findById(params.id);
    if (!label) {
      return NextResponse.json(
        { error: 'Shipping label not found' },
        { status: 404 }
      );
    }

    if (label.voided) {
      return NextResponse.json(
        { error: 'Label is already voided' },
        { status: 400 }
      );
    }

    // Void label via ShipEngine
    try {
      const shipengine = new ShipEngineAPI();
      await shipengine.voidLabel(label.labelId);
    } catch (error) {
      console.error('Error voiding label in ShipEngine:', error);
      // Continue with database update even if ShipEngine call fails
    }

    // Update database
    label.voided = true;
    label.voidedAt = new Date();
    label.status = 'voided';
    await label.save();

    return NextResponse.json({
      success: true,
      message: 'Shipping label voided successfully',
      label
    });
  } catch (error) {
    console.error('Error voiding shipping label:', error);
    return NextResponse.json(
      { error: 'Failed to void shipping label' },
      { status: 500 }
    );
  }
}

