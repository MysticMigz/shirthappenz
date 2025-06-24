import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { connectToDatabase } from '@/lib/mongodb';
import Transaction from '@/backend/models/Transaction';
import Order from '@/backend/models/Order';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST() {
  return NextResponse.json(
    { error: 'Payment processing is temporarily unavailable.' },
    { status: 503 }
  );
} 