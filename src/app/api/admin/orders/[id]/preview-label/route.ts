import { NextRequest } from 'next/server';
import Order from '@/backend/models/Order';
import { connectToDatabase } from '@/backend/utils/database';
import ShipEngineAPI from '@/lib/shipengine';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    
    // Get the order
    const order = await Order.findById(params.id);
    if (!order) {
      return new Response(JSON.stringify({ error: 'Order not found' }), { 
        status: 404, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    // Initialize ShipEngine API
    const shipengine = new ShipEngineAPI();

    // Prepare order data for ShipEngine
    const orderData = {
      orderReference: order.reference,
      shipTo: {
        name: `${order.shippingDetails.firstName} ${order.shippingDetails.lastName}`,
        address1: order.shippingDetails.address,
        address2: order.shippingDetails.addressLine2 || '',
        city: order.shippingDetails.city,
        county: order.shippingDetails.county,
        postcode: order.shippingDetails.postcode,
        country: order.shippingDetails.country,
        phone: order.shippingDetails.phone
      },
      items: order.items.map(item => ({
        name: item.name || `${item.baseProductName} - ${item.size}`,
        quantity: item.quantity,
        weight: 0.5 // Default weight per item in kg
      }))
    };

    // Generate the label preview
    const preview = await shipengine.generateLabelPreview(orderData);

    return new Response(JSON.stringify(preview), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error generating label preview:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to generate label preview',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}
