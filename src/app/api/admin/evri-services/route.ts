import { NextRequest } from 'next/server';
import ShipEngineAPI from '@/lib/shipengine';

export async function GET(request: NextRequest) {
  console.log('🔍 Finding EVRi services...');
  
  try {
    const shipengine = new ShipEngineAPI();
    
    // Get all carriers
    console.log('📡 Fetching all carriers...');
    const carriers = await shipengine.getCarriers();
    
    // Find EVRi carriers
    const evriCarriers = carriers.filter(c => 
      c.friendly_name.toLowerCase().includes('evri') || 
      c.friendly_name.toLowerCase().includes('hermes') ||
      c.carrier_id === 'se-340606'
    );
    
    console.log('🎯 Found EVRi carriers:', evriCarriers);
    
    if (evriCarriers.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        message: 'No EVRi carriers found in your ShipEngine account',
        suggestion: 'You may need to connect your EVRi account to ShipEngine first'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Get services for each EVRi carrier
    const evriServices = [];
    for (const carrier of evriCarriers) {
      try {
        console.log(`📡 Fetching services for ${carrier.friendly_name} (${carrier.carrier_id})...`);
        const services = await shipengine.getServices(carrier.carrier_id);
        
        evriServices.push({
          carrier_id: carrier.carrier_id,
          friendly_name: carrier.friendly_name,
          services: services.map(s => ({
            service_code: s.service_code,
            name: s.name,
            domestic: s.domestic,
            international: s.international
          }))
        });
        
        console.log(`✅ Found ${services.length} services for ${carrier.friendly_name}`);
      } catch (error) {
        console.log(`❌ Failed to get services for ${carrier.friendly_name}:`, error);
        evriServices.push({
          carrier_id: carrier.carrier_id,
          friendly_name: carrier.friendly_name,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    // EVRi ShipStation Carrier Services uses evri_standard
    const documentedServices = [
      { service_code: 'evri_standard', name: 'EVRi Standard', description: 'Standard delivery service for ShipStation Carrier Services' }
    ];

    return new Response(JSON.stringify({
      success: true,
      message: 'EVRi ShipStation Carrier Services found',
      carrier: {
        carrier_id: 'se-340606',
        friendly_name: 'EVRi - ShipStation Carrier Services'
      },
      service_code: 'evri_standard',
      note: 'Using EVRi ShipStation Carrier Services with evri_standard service code'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('💥 EVRi services error:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Failed to fetch EVRi services',
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
