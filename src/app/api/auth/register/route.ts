import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/backend/models/User';
import { userRegistrationSchema, validateAndSanitize } from '@/lib/validation';
import { sendRegistrationConfirmationEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const data = await request.json();

    // Validate and sanitize input using Zod
    const validation = validateAndSanitize(userRegistrationSchema, data);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.errors[0] },
        { status: 400 }
      );
    }

    const validatedData = validation.data;

    // Check if user already exists
    const existingUser = await User.findOne({ email: validatedData.email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Create new user with validated data
    const user = await User.create({
      email: validatedData.email,
      password: validatedData.password, // Will be hashed by the User model pre-save hook
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      phoneNumber: validatedData.phoneNumber,
      address: validatedData.address,
      isAdmin: false, // Default value for new registrations
      visitorId: data.visitorId || ''
    });

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

    // Send registration confirmation email
    try {
      await sendRegistrationConfirmationEmail(user.email, user.firstName);
    } catch (error) {
      console.error('Failed to send registration confirmation email:', error);
    }

    return NextResponse.json(userData, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to register user' },
      { status: 500 }
    );
  }
} 