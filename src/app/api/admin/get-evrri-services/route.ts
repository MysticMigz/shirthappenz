import { NextRequest } from 'next/server';
import ShipEngineAPI from '@/lib/shipengine';

export async function GET(request: NextRequest) {
  console.log('🔍 Fetching EVRi services using List Carrier Services endpoint...');
  
  try {
    const shipengine = new ShipEngineAPI();
    
    // Use the List Carrier Services endpoint to get actual service codes
    console.log('📡 Calling ShipEngine List Carrier Services for EVRi...');
    const services = await shipengine.getServices('se-340606');
    
    console.log('✅ EVRi services retrieved:', services);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'EVRi services retrieved successfully',
      carrier_id: 'se-340606',
      carrier_name: 'EVRi - ShipStation Carrier Services',
      services: services.map(service => ({
        service_code: service.service_code,
        name: service.name,
        domestic: service.domestic,
        international: service.international
      })),
      total_services: services.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('💥 Failed to fetch EVRi services:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Failed to fetch EVRi services',
      error: error instanceof Error ? error.message : 'Unknown error',
      suggestion: 'Your EVRi account may not be properly connected to ShipEngine'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
