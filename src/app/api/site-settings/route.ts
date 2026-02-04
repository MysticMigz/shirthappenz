import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/backend/utils/database';
import SiteSettings from '@/backend/models/SiteSettings';

// Public API to get site settings (for customer-facing pages)
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    const defaults: Record<string, any> = {
      productsEnabled: true,
    };
    
    if (key) {
      // Get specific setting
      const setting = await (SiteSettings as any).findOne({ key });
      if (!setting) {
        // Return default value if setting doesn't exist (only for explicitly defaulted keys)
        return NextResponse.json({ 
          key,
          value: Object.prototype.hasOwnProperty.call(defaults, key) ? defaults[key] : null
        });
      }
      return NextResponse.json({ 
        key: setting.key,
        value: setting.value 
      });
    }
    
    // Get all public settings (only return key and value, not admin info)
    const settings = await (SiteSettings as any).find()
      .select('key value')
      .sort({ key: 1 });
    
    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error fetching site settings:', error);
    // Return default values on error
    return NextResponse.json({ 
      settings: [
        { key: 'productsEnabled', value: true },
      ]
    });
  }
}

