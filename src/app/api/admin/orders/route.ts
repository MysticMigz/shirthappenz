import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Order from '@/backend/models/Order';

export async function GET(request: NextRequest) {
  await connectToDatabase();
  const { searchParams } = new URL(request.url);

  // Filtering
  const query: any = {};
  
  // Basic filters
  const status = searchParams.get('status');
  const productionStatus = searchParams.get('productionStatus');
  if (status && status !== 'all') query.status = status;
  if (productionStatus && productionStatus !== 'all') query.productionStatus = productionStatus;

  // Reference number filter
  const reference = searchParams.get('reference');
  if (reference) {
    query.reference = { $regex: reference, $options: 'i' };
  }

  // Customer name filter
  const customerName = searchParams.get('customerName');
  if (customerName) {
    query.$or = [
      { 'shippingDetails.firstName': { $regex: customerName, $options: 'i' } },
      { 'shippingDetails.lastName': { $regex: customerName, $options: 'i' } }
    ];
  }

  // Email filter
  const email = searchParams.get('email');
  if (email) {
    query['shippingDetails.email'] = { $regex: email, $options: 'i' };
  }

  // Date range filters
  const dateFrom = searchParams.get('dateFrom');
  const dateTo = searchParams.get('dateTo');
  if (dateFrom || dateTo) {
    query.createdAt = {};
    if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
    if (dateTo) query.createdAt.$lte = new Date(dateTo + 'T23:59:59.999Z');
  }

  // Total range filters
  const totalMin = searchParams.get('totalMin');
  const totalMax = searchParams.get('totalMax');
  if (totalMin || totalMax) {
    query.total = {};
    if (totalMin) query.total.$gte = parseFloat(totalMin);
    if (totalMax) query.total.$lte = parseFloat(totalMax);
  }

  // Priority range filters
  const priorityMin = searchParams.get('priorityMin');
  const priorityMax = searchParams.get('priorityMax');
  if (priorityMin || priorityMax) {
    query.deliveryPriority = {};
    if (priorityMin) query.deliveryPriority.$gte = parseInt(priorityMin);
    if (priorityMax) query.deliveryPriority.$lte = parseInt(priorityMax);
  }

  // Shipping method filter
  const shippingMethod = searchParams.get('shippingMethod');
  if (shippingMethod && shippingMethod !== 'all') {
    query['shippingDetails.shippingMethod'] = shippingMethod;
  }

  // Voucher filter
  const hasVoucher = searchParams.get('hasVoucher');
  if (hasVoucher && hasVoucher !== 'all') {
    if (hasVoucher === 'yes') {
      query.voucherCode = { $exists: true, $ne: null };
    } else {
      query.$or = [
        { voucherCode: { $exists: false } },
        { voucherCode: null },
        { voucherCode: '' }
      ];
    }
  }

  // Customization filter
  const hasCustomization = searchParams.get('hasCustomization');
  if (hasCustomization && hasCustomization !== 'all') {
    if (hasCustomization === 'yes') {
      query['items.customization.isCustomized'] = true;
    } else {
      query.$or = [
        { 'items.customization.isCustomized': { $ne: true } },
        { 'items.customization.isCustomized': { $exists: false } }
      ];
    }
  }

  // Sorting
  let sort: any = { createdAt: -1 };
  const sortBy = searchParams.get('sortBy');
  if (sortBy === 'priority') sort = { deliveryPriority: -1, createdAt: -1 };
  if (sortBy === 'production') sort = { productionStatus: 1, createdAt: -1 };
  if (sortBy === 'date') sort = { createdAt: -1 };

  const orders = await Order.find(query).sort(sort);
  return NextResponse.json({ orders });
} 