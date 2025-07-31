import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Order from '@/backend/models/Order';
import { generateCustomerInvoicePDF } from '@/lib/pdf';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;
    const { searchParams } = new URL(req.url);
    const publicAccess = searchParams.get('public') === '1';
    const visitorId = searchParams.get('visitorId');

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    await connectToDatabase();

    // Build query based on access type
    let query: any = { _id: orderId };
    
    if (publicAccess) {
      // For public access, require visitorId
      if (!visitorId) {
        return NextResponse.json({ error: 'Visitor ID required for public access' }, { status: 400 });
      }
      query.visitorId = visitorId;
    } else {
      // For authenticated access, require userId
      // Note: This would need to be implemented with proper authentication
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const order = await Order.findOne(query);
    
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Generate invoice PDF
               const pdfDoc = await generateCustomerInvoicePDF(order);
    const pdfBuffer = pdfDoc.output('arraybuffer');

    // Return PDF as response
    return new NextResponse(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Invoice-${order.reference}.pdf"`,
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    console.error('Error generating invoice:', error);
    return NextResponse.json(
      { error: 'Failed to generate invoice' },
      { status: 500 }
    );
  }
} 