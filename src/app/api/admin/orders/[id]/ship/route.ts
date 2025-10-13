import { NextRequest } from 'next/server';
import Order from '@/backend/models/Order';
import { connectToDatabase } from '@/backend/utils/database';
import { sendOrderShippedEmail } from '@/lib/email';
import ShipEngineAPI from '@/lib/shipengine';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const { trackingNumber, courier, generateLabel = false } = await request.json();
    
    let finalTrackingNumber = trackingNumber;
    let finalCourier = courier || 'EVRi';
    let labelResponse: any = null;

    // If generateLabel is true, create a ShipEngine label
    if (generateLabel) {
      console.log('🏷️ Generating ShipEngine label for order:', params.id);
      try {
        const shipengine = new ShipEngineAPI();
        const order = await Order.findById(params.id);
        
        if (!order) {
          return new Response(JSON.stringify({ error: 'Order not found' }), { 
            status: 404, 
            headers: { 'Content-Type': 'application/json' } 
          });
        }

        // Prepare order data for ShipStation
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
        console.log('📦 Preparing order data for ShipEngine:', {
          orderReference: orderData.orderReference,
          itemCount: orderData.items.length,
          shipToName: orderData.shipTo.name,
          shipToCity: orderData.shipTo.city
        });
        
        labelResponse = await shipengine.createEVRiShipment(orderData);
        finalTrackingNumber = labelResponse.tracking_number;
        finalCourier = 'EVRi';
        
        console.log('✅ ShipEngine label generated successfully:', {
          orderId: params.id,
          labelId: labelResponse.label_id,
          trackingNumber: finalTrackingNumber,
          shipmentId: labelResponse.shipment_id,
          cost: labelResponse.shipping_cost?.amount || 'N/A',
          labelDownloadUrl: labelResponse.label_download?.pdf || 'N/A'
        });
      } catch (labelError) {
        console.error('❌ Failed to generate ShipEngine label:', {
          orderId: params.id,
          error: labelError instanceof Error ? labelError.message : 'Unknown error',
          stack: labelError instanceof Error ? labelError.stack : undefined
        });
        // Continue with manual tracking if label generation fails
        if (!trackingNumber) {
          return new Response(JSON.stringify({ 
            error: 'Failed to generate shipping label and no tracking number provided' 
          }), { 
            status: 400, 
            headers: { 'Content-Type': 'application/json' } 
          });
        }
      }
    }

    const update: any = {
      status: 'shipped',
      productionStatus: 'completed',
      'shippingDetails.trackingNumber': finalTrackingNumber,
      'shippingDetails.courier': finalCourier,
      'shippingDetails.shippedAt': new Date(),
    };

    // Add label download URL if label was generated
    if (generateLabel && labelResponse) {
      console.log('🏷️ Label response data:', {
        labelDownloadUrl: labelResponse.label_download?.pdf,
        labelId: labelResponse.label_id,
        shipmentId: labelResponse.shipment_id,
        shippingCost: labelResponse.shipping_cost,
        fullResponse: labelResponse
      });
      
      update['shippingDetails.labelDownloadUrl'] = labelResponse.label_download?.pdf || null;
      update['shippingDetails.labelId'] = labelResponse.label_id || null;
      update['shippingDetails.shipmentId'] = labelResponse.shipment_id || null;
      update['shippingDetails.actualShippingCost'] = labelResponse.shipping_cost?.amount || null;
      update['shippingDetails.actualShippingCurrency'] = labelResponse.shipping_cost?.currency || null;
    }
    
    console.log('📝 Updating order with shipping details:', {
      orderId: params.id,
      trackingNumber: finalTrackingNumber,
      courier: finalCourier,
      labelGenerated: generateLabel
    });
    
    const order = await Order.findByIdAndUpdate(
      params.id,
      { $set: update },
      { new: true }
    );
    
    if (!order) {
      return new Response(JSON.stringify({ error: 'Order not found' }), { 
        status: 404, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    // Send order shipped email
    try {
      await sendOrderShippedEmail(
        order.reference,
        order.shippingDetails,
        order.items,
        order.shippingDetails.shippedAt || new Date()
      );
    } catch (error) {
      console.error('Failed to send order shipped email:', error);
    }
    
    return new Response(JSON.stringify({ 
      message: 'Order shipped', 
      order,
      labelGenerated: generateLabel,
      labelInfo: labelResponse ? {
        labelId: labelResponse.label_id,
        trackingNumber: labelResponse.tracking_number,
        labelDownloadUrl: labelResponse.label_download?.pdf,
        shipmentId: labelResponse.shipment_id,
        shippingCost: {
          amount: labelResponse.shipping_cost?.amount,
          currency: labelResponse.shipping_cost?.currency,
          formatted: labelResponse.shipping_cost ? `${labelResponse.shipping_cost.currency} ${labelResponse.shipping_cost.amount.toFixed(2)}` : 'N/A'
        }
      } : null
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error shipping order:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to ship order' 
    }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
} 