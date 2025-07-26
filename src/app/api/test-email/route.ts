import { NextResponse } from 'next/server';
import { sendOrderConfirmationEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    console.log('[Test Email] Starting email test...');
    
    const testData = {
      orderReference: 'TEST-123',
      items: [
        {
          name: 'Test Product',
          size: 'M',
          quantity: 1,
          price: 10,
          customization: { isCustomized: false }
        }
      ],
      shippingDetails: {
        firstName: 'Test',
        lastName: 'User',
        email: 'miguelangelosilva@hotmail.co.uk', // Use your email for testing
        phone: '1234567890',
        address: '123 Test St',
        city: 'Test City',
        county: 'Test County',
        postcode: 'TE1 1ST',
        country: 'United Kingdom',
        shippingMethod: 'Standard Delivery',
        shippingCost: 5.99
      },
      total: 15.99,
      vat: 2.67,
      createdAt: new Date().toISOString(),
      status: 'paid'
    };

    console.log('[Test Email] Sending test email to:', testData.shippingDetails.email);
    
    await sendOrderConfirmationEmail(
      testData.orderReference,
      testData.items,
      testData.shippingDetails,
      testData.total,
      testData.vat,
      testData.createdAt,
      testData.status
    );

    console.log('[Test Email] Test email sent successfully!');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Test email sent successfully' 
    });
    
  } catch (error) {
    console.error('[Test Email] Error sending test email:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 