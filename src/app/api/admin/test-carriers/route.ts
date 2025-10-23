import { NextRequest } from 'next/server';
import ShipEngineAPI from '@/lib/shipengine';

interface Carrier {
  carrier_id: string;
  friendly_name: string;
  supports_return_labels: boolean;
  service_codes?: Array<{ service_code: string }>;
}

export async function GET(request: NextRequest) {
  console.log('🧪 Testing available carriers and services...');
  
  try {
    const shipengine = new ShipEngineAPI();
    
    // Get all carriers
    console.log('📡 Fetching carriers...');
    const carriers = await shipengine.getCarriers();
    
    console.log('📋 Available carriers:', carriers.map((c: Carrier) => ({
      carrier_id: c.carrier_id,
      friendly_name: c.friendly_name,
      supports_return_labels: c.supports_return_labels
    })));
    
    // Try to get services for Stamps.com
    const stampsCarrier = carriers.find((c: Carrier) => c.carrier_id === 'se-340579');
    if (stampsCarrier) {
      console.log('🎯 Found Stamps.com carrier:', stampsCarrier);
    }
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Carriers fetched successfully',
      carriers: carriers.map((c: Carrier) => ({
        carrier_id: c.carrier_id,
        friendly_name: c.friendly_name,
        supports_return_labels: c.supports_return_labels
      })),
      stampsCarrier: stampsCarrier || null
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('💥 Carrier test error:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Failed to fetch carriers',
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}



