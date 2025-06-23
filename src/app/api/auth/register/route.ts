import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/backend/models/User';
import { generateToken, setAuthCookie } from '@/backend/utils/auth';

export async function POST(request: Request) {
  try {
    await dbConnect();
    const data = await request.json();

    // Check if user already exists
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Create new user
    const user = await User.create({
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName
    });

    // Generate token
    const token = generateToken(user);
    
    // Set auth cookie
    setAuthCookie(token);

    // Return user data (excluding password)
    const userData = {
      _id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    };

    return NextResponse.json(userData, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to register user' },
      { status: 500 }
    );
  }
} 