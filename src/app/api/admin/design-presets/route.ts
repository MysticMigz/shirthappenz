import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/backend/utils/database';
import DesignPreset from '@/backend/models/DesignPreset';
import User from '@/backend/models/User';

// Get all design presets
export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin status
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectToDatabase();
    
    // Verify admin status
    const user = await (User as any).findOne({ email: session.user.email });
    if (!user?.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    const presets = await (DesignPreset as any).find()
      .sort({ name: 1 })
      .select('-__v');
    
    return NextResponse.json({ presets });
  } catch (error) {
    console.error('Error fetching design presets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch design presets' },
      { status: 500 }
    );
  }
}

// Create a new design preset
export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin status
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectToDatabase();
    
    // Verify admin status
    const user = await (User as any).findOne({ email: session.user.email });
    if (!user?.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const { name, description, position, scale, rotation } = body;
    
    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Preset name is required' },
        { status: 400 }
      );
    }

    if (position === undefined || scale === undefined || rotation === undefined) {
      return NextResponse.json(
        { error: 'Position, scale, and rotation are required' },
        { status: 400 }
      );
    }

    // Check if preset with this name already exists
    const existingPreset = await (DesignPreset as any).findOne({ name: name.trim() });
    if (existingPreset) {
      return NextResponse.json(
        { error: 'A preset with this name already exists' },
        { status: 400 }
      );
    }
    
    // Create new preset
    const preset = await (DesignPreset as any).create({
      name: name.trim(),
      description: description?.trim() || '',
      position: {
        x: parseFloat(position.x) || 0,
        y: parseFloat(position.y) || 0
      },
      scale: parseFloat(scale) || 100,
      rotation: parseFloat(rotation) || 0,
      createdBy: session.user.email
    });
    
    return NextResponse.json({ preset }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating design preset:', error);
    
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'A preset with this name already exists' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create design preset' },
      { status: 500 }
    );
  }
}

