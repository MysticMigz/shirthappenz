import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('🔍 Debug endpoint called');
  console.log('Environment variables check:', {
    NODE_ENV: process.env.NODE_ENV,
    hasShipEngineApiKey: !!process.env.SHIPENGINE_API_KEY,
    apiKeyLength: process.env.SHIPENGINE_API_KEY?.length || 0,
    apiKeyPrefix: process.env.SHIPENGINE_API_KEY?.substring(0, 10) || 'Not set'
  });

  return new Response(JSON.stringify({
    message: 'Debug endpoint working',
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      hasApiKey: !!process.env.SHIPENGINE_API_KEY,
      apiKeyLength: process.env.SHIPENGINE_API_KEY?.length || 0
    }
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

