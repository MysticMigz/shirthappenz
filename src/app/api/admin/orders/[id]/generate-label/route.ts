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

    // Check if order is ready to ship
    if (order.productionStatus !== 'ready_to_ship') {
      return new Response(JSON.stringify({ 
        error: 'Order must be in "ready_to_ship" status to generate label' 
      }), { 
        status: 400, 
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

    // Generate the shipping label
    const labelResponse = await shipengine.createEVRiShipment(orderData);

    // Update the order with tracking information
    console.log('🏷️ Label response data:', {
      labelDownloadUrl: labelResponse.label_download?.pdf,
      labelId: labelResponse.label_id,
      shipmentId: labelResponse.shipment_id,
      trackingNumber: labelResponse.tracking_number,
      fullResponse: labelResponse
    });
    
    const updateData = {
      'shippingDetails.trackingNumber': labelResponse.tracking_number,
      'shippingDetails.courier': 'EVRi',
      'shippingDetails.shippedAt': new Date(),
      'shippingDetails.labelDownloadUrl': labelResponse.label_download?.pdf || null,
      'shippingDetails.labelId': labelResponse.label_id || null,
      'shippingDetails.shipmentId': labelResponse.shipment_id || null,
      'shippingDetails.actualShippingCost': labelResponse.shipping_cost?.amount || null,
      'shippingDetails.actualShippingCurrency': labelResponse.shipping_cost?.currency || null,
      status: 'shipped',
      productionStatus: 'completed'
    };
    
    console.log('📝 Update data being sent to database:', updateData);

    const updatedOrder = await Order.findByIdAndUpdate(
      params.id,
      { $set: updateData },
      { new: true }
    );

    return new Response(JSON.stringify({
      message: 'Shipping label generated successfully',
      order: updatedOrder,
      label: {
        labelId: labelResponse.label_id,
        trackingNumber: labelResponse.tracking_number,
        labelDownloadUrl: labelResponse.label_download.pdf,
        shippingCost: {
          amount: labelResponse.shipping_cost.amount,
          currency: labelResponse.shipping_cost.currency,
          formatted: `${labelResponse.shipping_cost.currency} ${labelResponse.shipping_cost.amount.toFixed(2)}`
        },
        shipmentId: labelResponse.shipment_id
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error generating shipping label:', error);
    
    let errorMessage = 'Failed to generate shipping label';
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return new Response(JSON.stringify({ 
      error: errorMessage 
    }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}
