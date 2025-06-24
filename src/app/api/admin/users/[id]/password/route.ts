import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/backend/models/User';
import bcrypt from 'bcryptjs';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication and admin status
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get admin user from database
    await connectToDatabase();
    const adminUser = await User.findOne({ email: session.user.email });
    if (!adminUser?.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get request data
    const data = await request.json();
    if (!data.newPassword) {
      return NextResponse.json(
        { error: 'New password is required' },
        { status: 400 }
      );
    }

    // Find user to update
    const user = await User.findById(params.id);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(data.newPassword, 12);
    
    // Update password
    user.password = hashedPassword;
    await user.save();

    return NextResponse.json({
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Update password error:', error);
    return NextResponse.json(
      { error: 'Failed to update password' },
      { status: 500 }
    );
  }
} 