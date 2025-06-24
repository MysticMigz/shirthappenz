import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { IUser } from '../models/User';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import User from '../models/User';
import { connectToDatabase } from './database';
import type { NextAuthOptions } from 'next-auth';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '7d';

interface JwtPayload {
  userId: string;
  email: string;
  isAdmin: boolean;
}

export function generateToken(user: IUser): string {
  return jwt.sign(
    { userId: user._id, email: user.email, isAdmin: user.isAdmin },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): JwtPayload | string {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    return 'Invalid token';
  }
}

export function setAuthCookie(token: string): void {
  cookies().set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/',
  });
}

export function clearAuthCookie(): void {
  cookies().delete('auth_token');
}

export function getAuthToken(request: NextRequest) {
  return request.cookies.get('auth_token')?.value;
}

export async function verifyAuth(request: NextRequest) {
  const cookieStore = cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) {
    return null;
  }

  const decoded = verifyToken(token);
  if (!decoded || typeof decoded === 'string') {
    return null;
  }

  return decoded;
}

export async function requireAuth(request: NextRequest) {
  const session = await getServerSession(authOptions as NextAuthOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  await connectToDatabase();
  const user = await User.findOne({ email: session.user.email });
  
  if (!user) {
    return NextResponse.json(
      { error: 'User not found' },
      { status: 404 }
    );
  }

  return user;
}

export async function requireAdmin(request: NextRequest) {
  const user = await requireAuth(request);
  
  if (user instanceof NextResponse) {
    return user;
  }

  if (!user.isAdmin) {
    return NextResponse.json(
      { error: 'Admin access required' },
      { status: 403 }
    );
  }

  return user;
} 