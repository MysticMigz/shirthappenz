import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/backend/utils/database';
import ShippingLabel from '@/backend/models/ShippingLabel';
import ShipEngineAPI from '@/lib/shipengine';

/** Normalize country name or code to ISO 3166-1 alpha-2 for ShipEngine. */
function normalizeCountryCode(country: string): string {
  if (!country || typeof country !== 'string') return 'GB';
  const n = country.trim();
  if (n.length === 2) return n.toUpperCase();
  const map: Record<string, string> = {
    'United Kingdom': 'GB', 'UK': 'GB', 'Great Britain': 'GB',
    'Japan': 'JP', 'USA': 'US', 'United States': 'US', 'United States of America': 'US',
    'Germany': 'DE', 'France': 'FR', 'Spain': 'ES', 'Italy': 'IT', 'Netherlands': 'NL',
    'Ireland': 'IE', 'Australia': 'AU', 'Canada': 'CA', 'Mexico': 'MX'
  };
  return map[n] ?? map[n.replace(/\s+/g, ' ')] ?? n.substring(0, 2).toUpperCase();
}

// GET - List all custom shipping labels
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const query: any = {};
    if (status) {
      query.status = status;
    }
    if (search) {
      query.$or = [
        { trackingNumber: { $regex: search, $options: 'i' } },
        { 'shipTo.name': { $regex: search, $options: 'i' } },
        { 'shipTo.postcode': { $regex: search, $options: 'i' } },
        { orderReference: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const labels = await (ShippingLabel as any)
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await (ShippingLabel as any).countDocuments(query);

    return NextResponse.json({
      labels,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching shipping labels:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shipping labels' },
      { status: 500 }
    );
  }
}

// POST - Generate a new custom shipping label
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const body = await request.json();
    const {
      shipTo,
      shipFrom,
      package: packageData,
      items,
      shipEngineConfig,
      notes,
      orderReference
    } = body;

    // Validate required fields
    if (!shipTo || !shipFrom || !packageData || !items || !shipEngineConfig) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Initialize ShipEngine API
    const shipengine = new ShipEngineAPI();

    let labelResponse: any;

    // If using EVRi with the standard service, use the same helper method as orders for consistency
    let isEVRiStandard = shipEngineConfig.carrierId === 'se-340606' && 
                        (shipEngineConfig.serviceCode === 'hermes_domestic_parcelshop_dropoff' || 
                         !shipEngineConfig.serviceCode);

    if (isEVRiStandard) {
      // Use the same method as order shipping for consistency
      const orderData = {
        orderReference: orderReference || `custom-${Date.now()}`,
        shipTo: {
          name: shipTo.name,
          company: shipTo.company,
          address1: shipTo.address1,
          address2: shipTo.address2,
          city: shipTo.city,
          county: shipTo.county,
          postcode: shipTo.postcode,
          country: shipTo.country,
          phone: shipTo.phone
        },
        shipFrom: {
          name: shipFrom.name,
          company: shipFrom.company,
          address1: shipFrom.address1,
          address2: shipFrom.address2,
          city: shipFrom.city,
          county: shipFrom.county,
          postcode: shipFrom.postcode,
          country: shipFrom.country,
          phone: shipFrom.phone
        },
        items: items.map((item: any) => ({
          name: item.name,
          quantity: item.quantity,
          weight: item.weight?.value || 0.5 // Convert to simple number format expected by createEVRiShipment
        }))
      };

      try {
        labelResponse = await shipengine.createEVRiShipment(orderData);
      } catch (evriError: any) {
        // If EVRi fails (e.g., not connected in sandbox), fall back to generic createLabel
        console.warn('⚠️ EVRi shipment creation failed, falling back to generic label creation:', evriError.message);
        // Set flag to use generic method
        isEVRiStandard = false;
      }
    }
    
    // If EVRi method failed or we're using a different carrier, use generic createLabel
    if (!isEVRiStandard || !labelResponse) {
      // For other carriers or custom configurations, use the lower-level createLabel method
      // Prepare ShipEngine address format (country_code must be ISO 3166-1 alpha-2)
      const shipToCountryCode = normalizeCountryCode(shipTo.country);
      const shipFromCountryCode = normalizeCountryCode(shipFrom.country);
      const shipToAddress = {
        name: shipTo.name,
        company: shipTo.company || '',
        address_line1: shipTo.address1,
        address_line2: shipTo.address2 || '',
        city_locality: shipTo.city,
        state_province: shipTo.county,
        postal_code: shipTo.postcode,
        country_code: shipToCountryCode,
        phone: shipTo.phone || '',
        ...(shipTo.email && { email: shipTo.email }),
        address_residential_indicator: 'yes' as const
      };

      const shipFromAddress = {
        name: shipFrom.name,
        company: shipFrom.company || '',
        address_line1: shipFrom.address1,
        address_line2: shipFrom.address2 || '',
        city_locality: shipFrom.city,
        state_province: shipFrom.county,
        postal_code: shipFrom.postcode,
        country_code: shipFromCountryCode,
        phone: shipFrom.phone || '',
        ...(shipFrom.email && { email: shipFrom.email }),
        address_residential_indicator: 'no' as const
      };

      const isInternational = shipToCountryCode !== shipFromCountryCode;
      // GlobalPost and some other international carriers require receiver email
      if (isInternational && !shipTo.email?.trim()) {
        return NextResponse.json(
          { error: 'Receiver email is required for international shipping labels' },
          { status: 400 }
        );
      }

      // Build package payload; for international, add products (customs) per package
      const packageWeight = {
        value: packageData.weight.value,
        unit: packageData.weight.unit
      };
      const packageDimensions = {
        length: packageData.dimensions.length,
        width: packageData.dimensions.width,
        height: packageData.dimensions.height,
        unit: packageData.dimensions.unit
      };

      const customsProducts = isInternational
        ? items.map((item: any) => ({
            description: (item.name || 'Item').substring(0, 100),
            quantity: item.quantity ?? 1,
            value: {
              currency: 'GBP',
              amount: Math.max(typeof item.unitPrice === 'number' ? item.unitPrice * (item.quantity ?? 1) : 10, 1)
            },
            weight: {
              value: item.weight?.value ?? packageData.weight.value / Math.max(items.length, 1),
              unit: item.weight?.unit ?? packageData.weight.unit
            },
            sku: (item.sku || item.name || '')?.substring(0, 20) || undefined,
            harmonized_tariff_code: '6110', // Sweatshirts / jumpers
            country_of_origin: shipFromCountryCode
          }))
        : undefined;

      const packages = [{
        weight: packageWeight,
        dimensions: packageDimensions,
        ...(customsProducts && customsProducts.length > 0 ? { products: customsProducts } : {})
      }];

      // Prepare items (used for domestic; for international, products are on packages)
      const shipEngineItems = items.map((item: any) => ({
        name: item.name,
        sku: item.sku || '',
        quantity: item.quantity,
        weight: item.weight ? {
          value: item.weight.value,
          unit: item.weight.unit
        } : undefined,
        unit_price: item.unitPrice || undefined
      }));

      // Create label request
      const labelRequest: Record<string, unknown> = {
        carrier_id: shipEngineConfig.carrierId,
        service_code: shipEngineConfig.serviceCode,
        external_shipment_id: shipEngineConfig.externalShipmentId || `custom-${Date.now()}`,
        ship_date: shipEngineConfig.shipDate || new Date().toISOString().split('T')[0],
        ship_to: shipToAddress,
        ship_from: shipFromAddress,
        packages,
        items: shipEngineItems,
        test_label: shipEngineConfig.testLabel !== undefined ? shipEngineConfig.testLabel : process.env.NODE_ENV !== 'production',
        label_download_type: shipEngineConfig.labelDownloadType || 'url',
        label_format: shipEngineConfig.labelFormat || 'pdf',
        label_layout: shipEngineConfig.labelLayout || '4x6'
      };

      if (isInternational) {
        labelRequest.customs = {
          contents: 'merchandise',
          non_delivery: 'return_to_sender',
          declaration: 'I hereby certify that the information on this invoice is true and correct and the contents and value of this shipment is as stated above.'
        };
      }

      // Generate label via ShipEngine
      labelResponse = await shipengine.createLabel(labelRequest as any);
    }

    // Save to database
    const shippingLabel = new (ShippingLabel as any)({
      labelId: labelResponse.label_id,
      shipmentId: labelResponse.shipment_id,
      trackingNumber: labelResponse.tracking_number,
      shipTo,
      shipFrom,
      package: packageData,
      items,
      shipEngineConfig: {
        ...shipEngineConfig,
        carrierName: shipEngineConfig.carrierName || 'Unknown',
        serviceName: shipEngineConfig.serviceName || 'Unknown Service'
      },
      labelDownloadUrl: labelResponse.label_download?.pdf || '',
      labelPngUrl: labelResponse.label_download?.png || '',
      labelZplUrl: labelResponse.label_download?.zpl || '',
      shippingCost: {
        amount: labelResponse.shipping_cost?.amount || 0,
        currency: labelResponse.shipping_cost?.currency || 'GBP'
      },
      insuranceCost: {
        amount: labelResponse.insurance_cost?.amount || 0,
        currency: labelResponse.insurance_cost?.currency || 'GBP'
      },
      status: labelResponse.voided ? 'voided' : 'created',
      voided: labelResponse.voided || false,
      voidedAt: labelResponse.voided_at ? new Date(labelResponse.voided_at) : undefined,
      createdBy: session.user.email || 'unknown',
      notes,
      orderReference
    });

    await shippingLabel.save();

    return NextResponse.json({
      success: true,
      label: shippingLabel,
      message: 'Shipping label generated successfully'
    });
  } catch (error) {
    console.error('Error generating shipping label:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate shipping label',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

