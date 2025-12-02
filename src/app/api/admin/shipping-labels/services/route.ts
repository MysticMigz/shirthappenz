import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import ShipEngineAPI from '@/lib/shipengine';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const carrierId = searchParams.get('carrierId');

    if (!carrierId) {
      return NextResponse.json(
        { error: 'carrierId is required' },
        { status: 400 }
      );
    }

    const shipengine = new ShipEngineAPI();
    const servicesData = await shipengine.getServices(carrierId);
    
    // Handle different response structures
    const servicesArray = Array.isArray(servicesData) 
      ? servicesData 
      : (servicesData as any).services || [];

    return NextResponse.json({ services: servicesArray });
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch services',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

