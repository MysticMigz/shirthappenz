import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/backend/utils/database';
import Product from '@/backend/models/Product';
import SiteSettings from '@/backend/models/SiteSettings';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    
    // Check if products are enabled
    const productsEnabledSetting = await (SiteSettings as any).findOne({ key: 'productsEnabled' });
    const productsEnabled = productsEnabledSetting ? productsEnabledSetting.value !== false : true;
    
    if (!productsEnabled) {
      return NextResponse.json(
        { error: 'Products are currently unavailable' },
        { status: 503 }
      );
    }
    
    const product = await (Product as any).findById(params.id).lean();
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Log combinations for debugging
    if (product.mockupDesignCombinations) {
      console.log('📸 Product has combinations:', {
        count: Array.isArray(product.mockupDesignCombinations) ? product.mockupDesignCombinations.length : 0,
        combinations: product.mockupDesignCombinations
      });
    } else {
      console.log('📸 Product has no combinations');
    }
    
    return NextResponse.json({ product });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
} 