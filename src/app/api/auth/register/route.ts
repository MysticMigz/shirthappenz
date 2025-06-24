import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/backend/models/User';
import { generateToken, setAuthCookie } from '@/backend/utils/auth';

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const data = await request.json();

    // Basic validation
    if (!data.email || !data.password || !data.firstName || !data.lastName || !data.phoneNumber ||
        !data.address?.street || !data.address?.city || !data.address?.county || !data.address?.postcode) {
      return NextResponse.json(
        { error: 'All required fields must be provided' },
        { status: 400 }
      );
    }

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
      lastName: data.lastName,
      phoneNumber: data.phoneNumber,
      address: {
        street: data.address.street,
        city: data.address.city,
        county: data.address.county,
        postcode: data.address.postcode,
        country: data.address.country || 'United Kingdom'
      },
      isAdmin: false // Default value for new registrations
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
      phoneNumber: user.phoneNumber,
      address: user.address,
      isAdmin: user.isAdmin
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