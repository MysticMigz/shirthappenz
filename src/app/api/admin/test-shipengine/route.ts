import { NextRequest } from 'next/server';
import ShipEngineAPI from '@/lib/shipengine';

export async function GET(request: NextRequest) {
  console.log('🧪 Testing ShipEngine API connection...');
  console.log('Environment check:', {
    NODE_ENV: process.env.NODE_ENV,
    hasApiKey: !!process.env.SHIPENGINE_API_KEY,
    apiKeyLength: process.env.SHIPENGINE_API_KEY?.length || 0
  });
  
  try {
    // Test ShipEngine API connection
    console.log('🔧 Initializing ShipEngine API...');
    const shipengine = new ShipEngineAPI();
    
    // Test getting carriers
    console.log('📡 Fetching carriers from ShipEngine...');
    const response = await shipengine.getCarriers();
    
    console.log('📋 ShipEngine API response:', response);
    
    // Handle different response structures from ShipEngine API
    // The API might return an object with a 'carriers' property or an array directly
    let carriers: any[] = [];
    if (Array.isArray(response)) {
      carriers = response;
    } else if (response && typeof response === 'object' && 'carriers' in response && Array.isArray(response.carriers)) {
      carriers = response.carriers;
    } else if (response && typeof response === 'object' && 'data' in response && Array.isArray(response.data)) {
      carriers = response.data;
    } else {
      console.warn('⚠️ Unexpected response structure from ShipEngine:', response);
      carriers = [];
    }
    
    console.log('📋 Available carriers:', carriers.map((c: any) => ({
      carrier_id: c.carrier_id,
      friendly_name: c.friendly_name,
      supports_return_labels: c.supports_return_labels
    })));
    
    console.log('✅ ShipEngine API test successful:', {
      carrierCount: carriers.length,
      firstCarrier: carriers[0]?.friendly_name || 'No carriers found'
    });
    
    return new Response(JSON.stringify({
      success: true,
      message: 'ShipEngine API connection successful',
      carriers: carriers.slice(0, 5).map((c: any) => ({
        carrier_id: c.carrier_id,
        friendly_name: c.friendly_name,
        supports_return_labels: c.supports_return_labels
      })), // Return first 5 carriers for testing
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