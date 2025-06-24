import { NextResponse } from 'next/server';
import { clearAuthCookie } from '@/backend/utils/auth';

export async function POST() {
  try {
    clearAuthCookie();
    return NextResponse.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    );
  }
} 