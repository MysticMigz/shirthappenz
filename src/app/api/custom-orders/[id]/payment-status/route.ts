import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import Stripe from 'stripe';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }

    const mongooseConn = await connectToDatabase();
    const db = mongooseConn.connection.db;
    if (!db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const customOrdersCollection = db.collection('customOrders');
    const order = await customOrdersCollection.findOne({
      _id: new mongoose.Types.ObjectId(params.id),
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // If already paid, return as-is
    if ((order as any).paymentStatus === 'completed' || (order as any).status === 'paid') {
      return NextResponse.json({
        paid: true,
        status: (order as any).status,
        paymentStatus: (order as any).paymentStatus,
        paymentCompletedAt: (order as any).paymentCompletedAt || null,
      });
    }

    const paymentLinkId = (order as any).paymentLinkId as string | undefined;
    const paymentLinkUrl = (order as any).paymentLink as string | undefined;

    if (!paymentLinkId) {
      return NextResponse.json(
        {
          paid: false,
          status: (order as any).status || 'pending',
          paymentStatus: (order as any).paymentStatus || 'pending',
          error:
            'No paymentLinkId saved on this order. Regenerate the payment link so we can verify it.',
          paymentLinkUrl: paymentLinkUrl || null,
        },
        { status: 400 }
      );
    }

    // Find the most recent checkout session for this payment link
    const sessions = await stripe.checkout.sessions.list({
      payment_link: paymentLinkId,
      limit: 5,
    });

    const paidSession = sessions.data.find(
      (s) => (s.payment_status === 'paid' || s.status === 'complete') && !!s.payment_intent
    );

    if (!paidSession) {
      return NextResponse.json({
        paid: false,
        status: (order as any).status || 'pending',
        paymentStatus: (order as any).paymentStatus || 'pending',
        paymentLinkId,
        lastSeenSessions: sessions.data.map((s) => ({
          id: s.id,
          status: s.status,
          payment_status: s.payment_status,
          created: s.created,
        })),
      });
    }

    await customOrdersCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(params.id) },
      {
        $set: {
          status: 'paid',
          paymentStatus: 'completed',
          paymentId: typeof paidSession.payment_intent === 'string' ? paidSession.payment_intent : null,
          paymentCompletedAt: new Date().toISOString(),
          lastStripeEventType: 'manual.verify',
          lastStripeCheckoutSessionId: paidSession.id,
          updatedAt: new Date().toISOString(),
        },
      }
    );

    // Deactivate the payment link to prevent accidental double payment
    try {
      await stripe.paymentLinks.update(paymentLinkId, { active: false });
      await customOrdersCollection.updateOne(
        { _id: new mongoose.Types.ObjectId(params.id) },
        {
          $set: {
            paymentLinkActive: false,
            paymentLinkDeactivatedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        }
      );
    } catch (err) {
      console.warn('Failed to deactivate payment link after verification:', paymentLinkId, err);
    }

    return NextResponse.json({
      paid: true,
      status: 'paid',
      paymentStatus: 'completed',
      paymentId: typeof paidSession.payment_intent === 'string' ? paidSession.payment_intent : null,
      checkoutSessionId: paidSession.id,
    });
  } catch (error) {
    console.error('Error verifying custom order payment status:', error);
    return NextResponse.json({ error: 'Failed to verify payment status' }, { status: 500 });
  }
}

