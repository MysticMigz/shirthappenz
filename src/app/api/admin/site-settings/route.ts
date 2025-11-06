import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/backend/utils/database';
import SiteSettings from '@/backend/models/SiteSettings';
import User from '@/backend/models/User';

// Get all site settings or a specific setting
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
    const user = await User.findOne({ email: session.user.email });
    if (!user?.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    
    if (key) {
      // Get specific setting
      const setting = await SiteSettings.findOne({ key });
      if (!setting) {
        return NextResponse.json({ setting: null });
      }
      return NextResponse.json({ setting });
    }
    
    // Get all settings
    const settings = await SiteSettings.find().sort({ key: 1 });
    
    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error fetching site settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch site settings' },
      { status: 500 }
    );
  }
}

// Create or update site settings
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
    const user = await User.findOne({ email: session.user.email });
    if (!user?.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const { key, value, description } = body;
    
    // Validate required fields
    if (!key || value === undefined) {
      return NextResponse.json(
        { error: 'Key and value are required' },
        { status: 400 }
      );
    }
    
    // Check if setting already exists
    let setting = await SiteSettings.findOne({ key });
    
    if (setting) {
      // Update existing setting
      setting.value = value;
      if (description !== undefined) {
        setting.description = description;
      }
      setting.updatedBy = session.user.email;
      setting.updatedAt = new Date();
      await setting.save();
    } else {
      // Create new setting
      setting = await SiteSettings.create({
        key,
        value,
        description: description || '',
        updatedBy: session.user.email
      });
    }
    
    return NextResponse.json({ setting }, { status: setting ? 200 : 201 });
  } catch (error: any) {
    console.error('Error updating site settings:', error);
    
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Setting with this key already exists' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update site settings' },
      { status: 500 }
    );
  }
}

