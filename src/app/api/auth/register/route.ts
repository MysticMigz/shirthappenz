import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/backend/models/User';
import { userRegistrationSchema, validateAndSanitize, sanitizeUserInput } from '@/lib/validation';
import { sendRegistrationConfirmationEmail } from '@/lib/email';
import { registrationRateLimiter } from '@/lib/rate-limit';
import { securityLogger } from '@/lib/security-audit';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting check
    const rateLimitResult = await registrationRateLimiter.checkLimit(request, 'registration');
    if (!rateLimitResult.allowed) {
      const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
      const userAgent = request.headers.get('user-agent') || undefined;
      securityLogger.logRateLimitExceeded(ip, 'registration', userAgent);
      
      return NextResponse.json(
        { error: rateLimitResult.message },
        { status: 429 }
      );
    }

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
      const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
      const userAgent = request.headers.get('user-agent') || undefined;
      securityLogger.logFailedRegistration(ip, validatedData.email, userAgent);
      
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Create new user with validated and sanitized data
    const user = await User.create({
      email: validatedData.email.toLowerCase().trim(),
      password: validatedData.password, // Will be hashed by the User model pre-save hook
      firstName: sanitizeUserInput(validatedData.firstName),
      lastName: sanitizeUserInput(validatedData.lastName),
      phoneNumber: validatedData.phoneNumber.trim(),
      address: {
        street: sanitizeUserInput(validatedData.address.street),
        city: sanitizeUserInput(validatedData.address.city),
        county: sanitizeUserInput(validatedData.address.county),
        postcode: validatedData.address.postcode.toUpperCase().trim(),
        country: validatedData.address.country
      },
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