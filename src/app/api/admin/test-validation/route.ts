import { NextRequest } from 'next/server';
import { productSchema } from '@/lib/validation';

export async function GET(request: NextRequest) {
  console.log('🧪 Testing validation schema...');
  
  // Test data with crewneck category
  const testData = {
    name: 'Test Crewneck',
    description: 'Test description',
    price: 25.99,
    basePrice: 20.00,
    category: 'crewneck',
    gender: 'unisex',
    sizes: ['M', 'L'],
    colors: [],
    stock: { 'M': 10, 'L': 5 },
    featured: false,
    customizable: true
  };

  console.log('📋 Test data:', testData);
  
  try {
    const result = productSchema.safeParse(testData);
    
    if (result.success) {
      console.log('✅ Validation successful!');
      return new Response(JSON.stringify({
        success: true,
        message: 'Crewneck category validation works!',
        data: result.data
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      console.log('❌ Validation failed:', result.error.issues);
      return new Response(JSON.stringify({
        success: false,
        message: 'Validation failed',
        errors: result.error.issues
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('💥 Validation test error:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Test error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}


