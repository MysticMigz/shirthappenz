import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import Order from '@/backend/models/Order';
import User from '@/backend/models/User';
import mongoose from 'mongoose';

// Force dynamic rendering - this route uses getServerSession() which accesses headers
export const dynamic = 'force-dynamic';

function safeTotalQuantityFromSizeQuantities(sizeQuantities: any): number {
  try {
    return Object.values(sizeQuantities || {}).reduce((sum: number, colorQuantities: any) => {
      return (
        sum +
        Object.values(colorQuantities || {}).reduce((sizeSum: number, qty: any) => sizeSum + (Number(qty) || 0), 0)
      );
    }, 0);
  } catch {
    return 0;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user from database and verify admin status
    const mongooseConn = await connectToDatabase();
    const user = await (User as any).findOne({ email: session.user.email });
    if (!user?.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Standard orders (excluding cancelled and refunded orders)
    const standardOrders = await (Order as any).find({
      status: { $nin: ['cancelled', 'payment_failed'] },
      $or: [
        { 'metadata.refundAmount': { $exists: false } },
        { 'metadata.refundAmount': { $exists: true, $eq: null } }
      ]
    })
      .sort({ deliveryPriority: -1, createdAt: -1 });

    // Custom orders live in a separate collection
    const db = mongooseConn.connection.db;
    let mappedCustomOrders: any[] = [];
    if (db) {
      const customOrders = await db
        .collection('customOrders')
        .find({
          // Only show paid custom orders in production queue
          paymentStatus: 'completed',
          status: { $ne: 'cancelled' },
        })
        .sort({ submittedAt: -1 })
        .toArray();

      mappedCustomOrders = customOrders.map((co: any) => {
        const customOrderId = co?._id?.toString?.() || String(co?._id || '');
        const reference = `CO-${String(customOrderId).slice(-6).toUpperCase()}`;
        const createdAt = co?.submittedAt ? new Date(co.submittedAt).toISOString() : new Date().toISOString();
        const updatedAt = co?.updatedAt ? new Date(co.updatedAt).toISOString() : undefined;

        const qty = safeTotalQuantityFromSizeQuantities(co?.sizeQuantities) || 1;
        const total = Number(co?.invoiceData?.pricing?.total) || 0;
        const unitPrice = qty > 0 ? total / qty : total;

        const thumbUrl =
          co?.productDetails?.images?.[0]?.url ||
          co?.productDetails?.colors?.find((c: any) => c?.imageUrl)?.imageUrl ||
          null;

        return {
          _id: `custom_${customOrderId}`,
          orderType: 'custom',
          customOrderId,
          reference,
          userId: '',
          total,
          status: co?.status || 'in-progress',
          productionStatus: co?.productionStatus || 'not_started',
          // Default custom orders to high priority so they show up in today's batch
          deliveryPriority: Number.isFinite(Number(co?.deliveryPriority)) ? Number(co.deliveryPriority) : 100,
          createdAt,
          updatedAt,
          shippingDetails: {
            firstName: co?.firstName || '',
            lastName: co?.lastName || '',
            shippingMethod: 'Standard Delivery',
            email: co?.email || '',
            phone: co?.phone || '',
            address: co?.address || '',
            address2: co?.company || '',
            city: co?.city || '',
            state: co?.province || '',
            zipCode: co?.postalCode || '',
            country: co?.country || 'United Kingdom',
          },
          items: [
            {
              name: co?.productDetails?.name ? `Custom ${co.productDetails.name}` : 'Custom Order',
              quantity: qty,
              size: 'Custom',
              price: Number.isFinite(unitPrice) ? unitPrice : undefined,
              productId: String(co?.selectedProduct || ''),
              image: thumbUrl || undefined,
              customization: {
                isCustomized: true,
              },
            },
          ],
        };
      });
    }

    const merged = [...mappedCustomOrders, ...standardOrders];
    merged.sort((a: any, b: any) => {
      const pa = Number(a?.deliveryPriority) || 0;
      const pb = Number(b?.deliveryPriority) || 0;
      if (pb !== pa) return pb - pa;
      const da = new Date(a?.createdAt || 0).getTime();
      const dbt = new Date(b?.createdAt || 0).getTime();
      return dbt - da;
    });

    return NextResponse.json({ orders: merged });
  } catch (error) {
    console.error('Error fetching production orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch production orders' },
      { status: 500 }
    );
  }
} 