import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../[...nextauth]/route';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/backend/models/User';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ user: null });
    }

    await connectToDatabase();
    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json({ user: null });
    }

    // Return user data (excluding sensitive information)
    const userData = {
      _id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isAdmin: user.isAdmin
    };

    return NextResponse.json({ user: userData });
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json({ user: null });
  }
} 