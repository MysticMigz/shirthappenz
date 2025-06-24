import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { IUser } from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '7d';

interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export function generateToken(user: IUser): string {
  return jwt.sign(
    { userId: user._id, email: user.email, role: user.role },
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
  const decoded = await verifyAuth(request);
  
  if (!decoded) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return decoded;
}

export async function requireAdmin(request: NextRequest) {
  const decoded = await requireAuth(request);
  
  if (decoded instanceof NextResponse) {
    return decoded;
  }

  if (decoded.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return decoded;
} 