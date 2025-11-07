import { NextRequest } from 'next/server';
import Order from '@/backend/models/Order';
import { connectToDatabase } from '@/backend/utils/database';
import ShipEngineAPI from '@/lib/shipengine';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    
    // Get the order
    const order = await (Order as any).findById(params.id);
    if (!order) {
      return new Response(JSON.stringify({ error: 'Order not found' }), { 
        status: 404, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    // Check if order is ready to ship
    if (order.productionStatus !== 'ready_to_ship') {
      return new Response(JSON.stringify({ 
        error: 'Order must be in "ready_to_ship" status to generate label' 
      }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    // Check if shipping details exist
    if (!order.shippingDetails) {
      return new Response(JSON.stringify({ 
        error: 'Order shipping details are missing' 
      }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    // Parse custom dimensions from request body
    const { customDimensions, splitPackages = false } = await request.json();

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
      })),
      customDimensions,
      splitPackages
    };

    // Generate the shipping label with custom settings
    const labelResponse = await shipengine.createEVRiShipmentWithCustomDimensions(orderData);

    // Update the order with tracking information
    console.log('🏷️ Custom Label response data:', {
      labelDownloadUrl: labelResponse.label_download?.pdf,
      labelId: labelResponse.label_id,
      shipmentId: labelResponse.shipment_id,
      trackingNumber: labelResponse.tracking_number,
      shippingCost: labelResponse.shipping_cost
    });

    // Update order with tracking information
    (order as any).trackingNumber = labelResponse.tracking_number;
    (order as any).shipmentId = labelResponse.shipment_id;
    (order as any).labelId = labelResponse.label_id;
    (order as any).labelDownloadUrl = labelResponse.label_download?.pdf;
    (order as any).shippingCost = labelResponse.shipping_cost?.amount || 0;
    (order as any).shippingCurrency = labelResponse.shipping_cost?.currency || 'GBP';
    (order as any).productionStatus = 'shipped';
    (order as any).shippedAt = new Date();

    await order.save();

    return new Response(JSON.stringify({
      success: true,
      labelId: labelResponse.label_id,
      trackingNumber: labelResponse.tracking_number,
      shipmentId: labelResponse.shipment_id,
      labelDownloadUrl: labelResponse.label_download?.pdf,
      shippingCost: labelResponse.shipping_cost,
      message: 'Shipping label generated successfully with custom dimensions'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error generating custom label:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to generate shipping label',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}
