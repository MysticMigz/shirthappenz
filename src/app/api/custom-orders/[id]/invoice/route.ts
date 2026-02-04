import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { generateCustomOrderInvoicePDF } from '@/lib/pdf';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const orderId = params.id;
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const mongooseConn = await connectToDatabase();
    const db = mongooseConn.connection.db;
    if (!db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const customOrdersCollection = db.collection('customOrders');
    const order = await customOrdersCollection.findOne({
      _id: new mongoose.Types.ObjectId(orderId),
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Only admins or the order owner (by email) can download
    const isAdmin = !!(session.user as any).isAdmin;
    if (!isAdmin) {
      const sessionEmail = String(session.user.email || '').toLowerCase();
      const orderEmail = String((order as any).email || '').toLowerCase();
      if (!sessionEmail || !orderEmail || sessionEmail !== orderEmail) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const invoiceData = (order as any).invoiceData;
    if (!invoiceData) {
      return NextResponse.json(
        { error: 'Invoice not generated for this order yet' },
        { status: 400 }
      );
    }

    const pdfData = {
      ...invoiceData,
      paymentLink: (order as any).paymentLink || invoiceData.paymentLink || null,
    };

    const pdfDoc = await generateCustomOrderInvoicePDF(pdfData);
    const pdfBuffer = pdfDoc.output('arraybuffer');

    const invoiceNumber = pdfData?.invoiceNumber || `custom-order-${orderId}`;

    return new NextResponse(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Invoice-${invoiceNumber}.pdf"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Error generating custom order invoice:', error);
    return NextResponse.json(
      { error: 'Failed to generate invoice' },
      { status: 500 }
    );
  }
}

