import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/backend/utils/database';
import Product from '@/backend/models/Product';
import User from '@/backend/models/User';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Get all previously uploaded mockups
export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin status
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectToDatabase();
    
    // Verify admin status
    const user = await (User as any).findOne({ email: session.user.email });
    if (!user?.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    // Get all products with mockup images
    const products = await (Product as any).find({
      mockupImage: { $exists: true, $ne: null },
      'mockupImage.url': { $exists: true, $ne: '' }
    })
    .select('name mockupImage category createdAt')
    .sort({ createdAt: -1 })
    .limit(100); // Limit to most recent 100 products with mockups
    
    // Extract unique mockups (group by URL to avoid duplicates)
    const mockupMap = new Map<string, {
      url: string;
      alt: string;
      productName: string;
      category: string;
      createdAt: Date;
    }>();
    
    products.forEach((product: any) => {
      if (product.mockupImage?.url) {
        let url = product.mockupImage.url;
        
        // Ensure URL is a valid string
        if (typeof url !== 'string' || !url.trim()) {
          console.warn('⚠️ [Mockups API] Invalid URL found:', url, 'for product:', product.name);
          return;
        }
        
        // Ensure URL is absolute (Cloudinary URLs should already be absolute)
        // Don't modify URLs that already start with http:// or https://
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          // If it's a relative URL, make it absolute
          url = url.startsWith('/') ? url : `/${url}`;
        }
        
        // Only add if we haven't seen this URL before, or if this product is newer
        if (!mockupMap.has(url) || 
            new Date(product.createdAt) > new Date(mockupMap.get(url)!.createdAt)) {
          mockupMap.set(url, {
            url: url.trim(),
            alt: product.mockupImage.alt || product.name || 'Product mockup',
            productName: product.name || 'Unknown Product',
            category: product.category || 'uncategorized',
            createdAt: product.createdAt
          });
        }
      }
    });
    
    // Convert map to array and sort by creation date (newest first)
    const mockups = Array.from(mockupMap.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    console.log('🔍 [Mockups API] Found mockups:', mockups.length);
    if (mockups.length > 0) {
      console.log('🔍 [Mockups API] Sample URL:', mockups[0].url);
    }
    
    return NextResponse.json({
      mockups,
      count: mockups.length
    });
  } catch (error) {
    console.error('Error fetching mockups:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch mockups',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

