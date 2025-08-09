import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/backend/utils/database';
import CategoryVisibility from '@/backend/models/CategoryVisibility';

// Get visible categories for the store (public endpoint)
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const gender = searchParams.get('gender') || 'all';
    
    // Build query for visible categories
    let query: any = { isVisible: true };
    
    // If gender is specified, filter by gender visibility
    if (gender !== 'all') {
      query[`genderVisibility.${gender}`] = true;
    }
    
    // Get visible categories sorted by sort order
    const categories = await CategoryVisibility.find(query)
      .sort({ sortOrder: 1, category: 1 })
      .select('category displayName description sortOrder genderVisibility');
    
    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error fetching visible categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
