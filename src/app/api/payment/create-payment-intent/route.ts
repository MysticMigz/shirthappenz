import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { connectToDatabase } from '@/lib/mongodb';
import Order from '@/backend/models/Order';
import Transaction from '@/backend/models/Transaction';
import { requireAuth } from '@/backend/utils/auth';

export async function POST() {
  return NextResponse.json(
    { error: 'Payment processing is temporarily unavailable.' },
    { status: 503 }
  );
} 