import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/backend/models/User';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '@/lib/email';
import { forgotPasswordRateLimiter } from '@/lib/rate-limit';
import { securityLogger } from '@/lib/security-audit';

export async function POST(req: NextRequest) {
  try {
    // Rate limiting check
    const rateLimitResult = await forgotPasswordRateLimiter.checkLimit(req, 'forgot-password');
    if (!rateLimitResult.allowed) {
      const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
      const userAgent = req.headers.get('user-agent') || undefined;
      securityLogger.logRateLimitExceeded(ip, 'forgot-password', userAgent);
      
      return NextResponse.json(
        { message: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ message: 'Email is required' }, { status: 400 });
    }
    await connectToDatabase();
    const user = await User.findOne({ email });
    // Always respond with success to prevent user enumeration
    if (user) {
      // Generate reset token and expiry
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = Date.now() + 3600000; // 1 hour
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpiry = resetTokenExpiry;
      await user.save();
      // Send reset email with link to mrshirtpersonalisation.co.uk
      const resetUrl = `https://mrshirtpersonalisation.co.uk/auth/reset-password?token=${resetToken}`;
      await sendPasswordResetEmail(email, resetToken, resetUrl);
    }
    return NextResponse.json({ message: 'If an account exists with this email, you will receive password reset instructions.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
} 