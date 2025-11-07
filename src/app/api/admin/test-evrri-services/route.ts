import { NextRequest } from 'next/server';
import ShipEngineAPI from '@/lib/shipengine';

export async function GET(request: NextRequest) {
  console.log('🔍 Testing EVRi services for your account...');
  
  try {
    const shipengine = new ShipEngineAPI();
    
    // Get the actual services available for your EVRi account
    console.log('📡 Fetching services for EVRi carrier se-340606...');
    const response = await shipengine.getServices('se-340606');
    
    console.log('✅ EVRi services response:', response);
    
    // Handle different response structures from ShipEngine API
    // The API might return an array directly or an object with a 'services' property
    let services: any[] = [];
    if (Array.isArray(response)) {
      services = response;
    } else if (response && typeof response === 'object' && 'services' in response && Array.isArray(response.services)) {
      services = response.services;
    } else if (response && typeof response === 'object' && 'data' in response && Array.isArray(response.data)) {
      services = response.data;
    } else {
      console.warn('⚠️ Unexpected response structure from ShipEngine:', response);
      // Try to extract services from the response object
      services = [];
    }
    
    console.log('✅ EVRi services array:', services);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'EVRi services retrieved successfully',
      carrier_id: 'se-340606',
      carrier_code: services.length > 0 ? services[0].carrier_code : 'hermes',
      carrier_name: 'EVRi - ShipStation Carrier Services',
      services: services.map((service: any) => ({
        service_code: service.service_code,
        name: service.name,
        carrier_code: service.carrier_code,
        domestic: service.domestic,
        international: service.international,
        is_multi_package_supported: service.is_multi_package_supported || false,
        is_return_supported: service.is_return_supported || false,
        display_schemes: service.display_schemes || []
      })),
      total_services: services.length,
      domestic_services: services.filter((s: any) => s.domestic).length,
      international_services: services.filter((s: any) => s.international).length,
      recommended_service: services.find((s: any) => s.domestic)?.service_code || 'No domestic service found',
      recommended_service_name: services.find((s: any) => s.domestic)?.name || 'No domestic service found'
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
