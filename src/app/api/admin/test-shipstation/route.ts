import { NextRequest } from 'next/server';
import ShipEngineAPI from '@/lib/shipengine';

export async function GET(request: NextRequest) {
  console.log('🧪 Testing ShipEngine API connection...');
  
  try {
    // Test ShipEngine API connection
    console.log('🔧 Initializing ShipEngine API...');
    const shipengine = new ShipEngineAPI();
    
    // Test getting carriers
    console.log('📡 Fetching carriers from ShipEngine...');
    const carriers = await shipengine.getCarriers();
    
    console.log('✅ ShipEngine API test successful:', {
      carrierCount: carriers.length,
      firstCarrier: carriers[0]?.friendly_name || 'No carriers found'
    });
    
    return new Response(JSON.stringify({
      success: true,
      message: 'ShipEngine API connection successful',
      carriers: carriers.slice(0, 5), // Return first 5 carriers for testing
      totalCarriers: carriers.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('❌ ShipEngine API test failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    let errorMessage = 'Failed to connect to ShipEngine API';
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return new Response(JSON.stringify({
      success: false,
      error: errorMessage,
      hint: 'Make sure SHIPENGINE_API_KEY is set in your environment variables'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
