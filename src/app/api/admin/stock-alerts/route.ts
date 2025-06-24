import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/backend/utils/database';
import { requireAdmin } from '@/backend/utils/auth';
import StockAlert from '@/backend/models/StockAlert';

export async function GET(request: NextRequest) {
  try {
    // Check admin authorization
    const admin = await requireAdmin(request);
    if (admin instanceof NextResponse) return admin;

    await connectToDatabase();
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    
    // Build query
    const query: any = {};
    if (status && ['active', 'resolved'].includes(status)) {
      query.status = status;
    }
    
    // Fetch alerts with sorting
    const alerts = await StockAlert.find(query)
      .sort({ createdAt: -1 });
    
    return NextResponse.json({ alerts });
  } catch (error) {
    console.error('Error fetching stock alerts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stock alerts' },
      { status: 500 }
    );
  }
} 