interface ShipEngineConfig {
  apiKey: string;
  baseUrl: string;
}

interface ShipEngineAddress {
  name: string;
  company?: string;
  address_line1: string;
  address_line2?: string;
  city_locality: string;
  state_province: string;
  postal_code: string;
  country_code: string;
  phone?: string;
  address_residential_indicator?: 'yes' | 'no';
}

interface ShipEngineWeight {
  value: number;
  unit: 'pound' | 'ounce' | 'gram' | 'kilogram';
}

interface ShipEngineDimensions {
  length: number;
  width: number;
  height: number;
  unit: 'inch' | 'centimeter';
}

interface ShipEngineItem {
  name: string;
  sku?: string;
  quantity: number;
  unit_price?: number;
  weight?: ShipEngineWeight;
}

interface CreateLabelRequest {
  carrier_id: string;
  service_code: string;
  external_shipment_id?: string;
  ship_date: string;
  ship_to: ShipEngineAddress;
  ship_from: ShipEngineAddress;
  packages: Array<{
    weight: ShipEngineWeight;
    dimensions?: ShipEngineDimensions;
  }>;
  items?: ShipEngineItem[];
  test_label?: boolean;
  label_download_type?: 'url' | 'inline';
  label_format?: 'pdf' | 'png' | 'zpl';
  label_layout?: '4x6' | '4x8' | 'letter';
}

interface PackageDimensions {
  length: number;
  width: number;
  height: number;
  unit: 'centimeter' | 'inch';
}

interface LabelPreview {
  totalWeight: number;
  itemCount: number;
  packageCount: number;
  packages: Array<{
    weight: number;
    dimensions: PackageDimensions;
    items: Array<{
      name: string;
      quantity: number;
      weight: number;
    }>;
  }>;
  estimatedCost?: {
    amount: number;
    currency: string;
  };
  shipEngineConfig?: {
    carrierId: string;
    serviceCode: string;
    serviceName: string;
    labelFormat: string;
    labelLayout: string;
    labelDownloadType: string;
    testMode: boolean;
    shipDate: string;
    externalShipmentId: string;
  };
  addresses?: {
    shipTo: {
      name: string;
      address: string;
      country: string;
    };
    shipFrom: {
      name: string;
      address: string;
      country: string;
    };
  };
}

interface CreateLabelResponse {
  label_id: string;
  status: string;
  shipment_id: string;
  created_at: string;
  ship_date: string;
  tracking_number: string;
  is_return_label: boolean;
  rma_number?: string;
  is_international: boolean;
  batch_id?: string;
  carrier_id: string;
  service_code: string;
  package_code: string;
  voided: boolean;
  voided_at?: string;
  label_format: string;
  display_scheme: string;
  label_layout: string;
  trackable: boolean;
  label_image_id?: string;
  carrier_code: string;
  tracking_status: string;
  label_download: {
    pdf: string;
    png: string;
    zpl: string;
    href: string;
  };
  form_download?: {
    href: string;
  };
  insurance_cost: {
    currency: string;
    amount: number;
  };
  shipping_cost: {
    currency: string;
    amount: number;
  };
  packages: Array<{
    package_id: number;
    package_code: string;
    weight: ShipEngineWeight;
    dimensions?: ShipEngineDimensions;
    tracking_number: string;
    label_download: {
      pdf: string;
      png: string;
      zpl: string;
    };
  }>;
}

class ShipEngineAPI {
  private config: ShipEngineConfig;

  constructor() {
    this.config = {
      apiKey: process.env.SHIPENGINE_API_KEY || '',
      baseUrl: 'https://api.shipengine.com'
    };

    console.log('🚀 ShipEngine API Initialized:', {
      hasApiKey: !!this.config.apiKey,
      baseUrl: this.config.baseUrl,
      apiKeyLength: this.config.apiKey.length,
      apiKeyPrefix: this.config.apiKey.substring(0, 10),
      isTestKey: this.config.apiKey.startsWith('TEST_'),
      isSandboxKey: this.config.apiKey.includes('sandbox') || this.config.apiKey.includes('test')
    });

    if (!this.config.apiKey) {
      console.error('❌ ShipEngine API credentials not configured');
      throw new Error('ShipEngine API credentials not configured');
    }
  }

  // Calculate dynamic package dimensions based on item count
  private calculatePackageDimensions(itemCount: number, totalWeight: number): PackageDimensions {
    // Define dimension tiers based on item count and weight
    if (itemCount <= 2 && totalWeight <= 1) {
      return { length: 30, width: 20, height: 5, unit: 'centimeter' };
    } else if (itemCount <= 5 && totalWeight <= 2.5) {
      return { length: 40, width: 30, height: 10, unit: 'centimeter' };
    } else if (itemCount <= 10 && totalWeight <= 5) {
      return { length: 50, width: 40, height: 15, unit: 'centimeter' };
    } else if (itemCount <= 20 && totalWeight <= 10) {
      return { length: 60, width: 50, height: 20, unit: 'centimeter' };
    } else if (itemCount <= 30 && totalWeight <= 15) {
      return { length: 70, width: 60, height: 25, unit: 'centimeter' };
    } else {
      // For very large orders, suggest splitting
      return { length: 80, width: 70, height: 30, unit: 'centimeter' };
    }
  }

  // Determine if order should be split into multiple packages
  private shouldSplitOrder(itemCount: number, totalWeight: number): boolean {
    // Split if more than 30 items or more than 15kg
    return itemCount > 30 || totalWeight > 15;
  }

  // Calculate how many packages needed for large orders
  private calculatePackageSplit(itemCount: number, totalWeight: number): number {
    if (!this.shouldSplitOrder(itemCount, totalWeight)) {
      return 1;
    }
    
    // Calculate packages needed (max 15kg or 20 items per package)
    const maxWeightPerPackage = 15;
    const maxItemsPerPackage = 20;
    
    const packagesByWeight = Math.ceil(totalWeight / maxWeightPerPackage);
    const packagesByItems = Math.ceil(itemCount / maxItemsPerPackage);
    
    return Math.max(packagesByWeight, packagesByItems);
  }

  // Generate label preview with dynamic dimensions
  async generateLabelPreview(orderData: {
    orderReference: string;
    shipTo: {
      name: string;
      company?: string;
      address1: string;
      address2?: string;
      city: string;
      county: string;
      postcode: string;
      country: string;
      phone?: string;
    };
    items: Array<{
      name: string;
      quantity: number;
      weight?: number;
    }>;
    shipFrom?: {
      name: string;
      company?: string;
      address1: string;
      address2?: string;
      city: string;
      county: string;
      postcode: string;
      country: string;
      phone?: string;
    };
  }): Promise<LabelPreview> {
    // Calculate total weight
    const totalWeight = orderData.items.reduce((sum, item) => {
      return sum + (item.weight || 0.5) * item.quantity;
    }, 0);

    const itemCount = orderData.items.reduce((sum, item) => sum + item.quantity, 0);
    const shouldSplit = this.shouldSplitOrder(itemCount, totalWeight);
    const packageCount = shouldSplit ? this.calculatePackageSplit(itemCount, totalWeight) : 1;

    const packages = [];
    
    if (shouldSplit) {
      // Split items across multiple packages
      const itemsPerPackage = Math.ceil(orderData.items.length / packageCount);
      const weightPerPackage = totalWeight / packageCount;
      
      for (let i = 0; i < packageCount; i++) {
        const startIndex = i * itemsPerPackage;
        const endIndex = Math.min(startIndex + itemsPerPackage, orderData.items.length);
        const packageItems = orderData.items.slice(startIndex, endIndex);
        
        const packageWeight = packageItems.reduce((sum, item) => {
          return sum + (item.weight || 0.5) * item.quantity;
        }, 0);
        
        const packageItemCount = packageItems.reduce((sum, item) => sum + item.quantity, 0);
        const dimensions = this.calculatePackageDimensions(packageItemCount, packageWeight);
        
        packages.push({
          weight: packageWeight,
          dimensions,
          items: packageItems.map(item => ({
            name: item.name,
            quantity: item.quantity,
            weight: item.weight || 0.5
          }))
        });
      }
    } else {
      // Single package
      const dimensions = this.calculatePackageDimensions(itemCount, totalWeight);
      packages.push({
        weight: totalWeight,
        dimensions,
        items: orderData.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          weight: item.weight || 0.5
        }))
      });
    }

    return {
      totalWeight,
      itemCount,
      packageCount,
      packages,
      shipEngineConfig: {
        carrierId: 'se-340606',
        serviceCode: 'hermes_domestic_parcelshop_dropoff',
        serviceName: 'EVRi Domestic - ParcelShop Dropoff',
        labelFormat: 'pdf',
        labelLayout: '4x6',
        labelDownloadType: 'url',
        testMode: process.env.NODE_ENV !== 'production',
        shipDate: new Date().toISOString().split('T')[0],
        externalShipmentId: `${orderData.orderReference}-${Date.now()}`
      },
      addresses: {
        shipTo: {
          name: orderData.shipTo.name,
          address: `${orderData.shipTo.address1}, ${orderData.shipTo.city}, ${orderData.shipTo.postcode}`,
          country: orderData.shipTo.country
        },
        shipFrom: {
          name: 'MR SHIRT PERSONALISATION LTD',
          address: 'Your Business Address, Your City, Your Postcode',
          country: 'United Kingdom'
        }
      }
    };
  }

  private async makeRequest(endpoint: string, method: 'GET' | 'POST' = 'GET', data?: any) {
    const url = `${this.config.baseUrl}${endpoint}`;

    console.log(`📡 ShipEngine API Request: ${method} ${endpoint}`, {
      url,
      hasData: !!data,
      dataKeys: data ? Object.keys(data) : []
    });

    const options: RequestInit = {
      method,
      headers: {
        'API-Key': this.config.apiKey,
        'Content-Type': 'application/json',
      },
    };

    if (data && method === 'POST') {
      options.body = JSON.stringify(data);
      console.log('📦 ShipEngine Request Data:', JSON.stringify(data, null, 2));
    }

    try {
      const response = await fetch(url, options);
      
      console.log(`📊 ShipEngine API Response: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ ShipEngine API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
          url: url,
          apiKeyLength: this.config.apiKey.length,
          apiKeyPrefix: this.config.apiKey.substring(0, 10) + '...'
        });
        
        // Parse error response for better debugging
        try {
          const errorData = JSON.parse(errorText);
          console.error('📋 Parsed Error Details:', errorData);
        } catch (e) {
          console.error('📋 Raw Error Text:', errorText);
        }
        
        throw new Error(`ShipEngine API error: ${response.status} - ${errorText}`);
      }

      const responseData = await response.json();
      console.log('✅ ShipEngine API Success:', {
        responseKeys: Object.keys(responseData),
        hasData: !!responseData
      });

      return responseData;
    } catch (error) {
      console.error('💥 ShipEngine API Request Failed:', error);
      throw error;
    }
  }

  async createLabel(labelData: CreateLabelRequest): Promise<CreateLabelResponse> {
    // ShipEngine requires the data to be wrapped in a 'shipment' object
    const requestData = {
      shipment: labelData
    };
    return this.makeRequest('/v1/labels', 'POST', requestData);
  }

  async getCarriers() {
    return this.makeRequest('/v1/carriers');
  }

  async getServices(carrierId: string) {
    return this.makeRequest(`/v1/carriers/${carrierId}/services`);
  }

  async getPackages(carrierId: string) {
    return this.makeRequest(`/v1/carriers/${carrierId}/packages`);
  }

  async getRates(request: {
    carrier_id: string;
    service_code?: string;
    ship_to: ShipEngineAddress;
    ship_from: ShipEngineAddress;
    packages: Array<{
      weight: ShipEngineWeight;
      dimensions?: ShipEngineDimensions;
    }>;
  }) {
    return this.makeRequest('/v1/rates', 'POST', request);
  }

  async voidLabel(labelId: string) {
    return this.makeRequest(`/v1/labels/${labelId}/void`, 'PUT');
  }

  // Helper method to create EVRi shipment
  async createEVRiShipment(orderData: {
    orderReference: string;
    shipTo: {
      name: string;
      company?: string;
      address1: string;
      address2?: string;
      city: string;
      county: string;
      postcode: string;
      country: string;
      phone?: string;
    };
    items: Array<{
      name: string;
      quantity: number;
      weight?: number; // in kg
    }>;
    shipFrom?: {
      name: string;
      company?: string;
      address1: string;
      address2?: string;
      city: string;
      county: string;
      postcode: string;
      country: string;
      phone?: string;
    };
  }): Promise<CreateLabelResponse> {
    console.log('🏷️ Creating EVRi Shipment for Order:', orderData.orderReference);
    
    // Default ship from address (UK address for EVRi)
    const defaultShipFrom: ShipEngineAddress = {
      name: 'MR Shirt Personalisation LTD', // Change this to your company name
      company: 'MR Shirt Personalisation LTD', // Change this to your company name
      address_line1: '10 Barney Close', // Change this to your actual address
      address_line2: '',
      city_locality: 'London', // Change this to your city
      state_province: 'London', // Change this to your county/state
      postal_code: 'SE7 8SS', // Change this to your postcode
      country_code: 'GB',
      phone: '+447902870824', // Change this to your phone number
      address_residential_indicator: 'no'
    };

    const shipFrom = orderData.shipFrom ? {
      name: orderData.shipFrom.name,
      company: orderData.shipFrom.company,
      address_line1: orderData.shipFrom.address1,
      address_line2: orderData.shipFrom.address2 || '',
      city_locality: orderData.shipFrom.city,
      state_province: orderData.shipFrom.county,
      postal_code: orderData.shipFrom.postcode,
      country_code: orderData.shipFrom.country === 'United Kingdom' ? 'GB' : orderData.shipFrom.country,
      phone: orderData.shipFrom.phone || '',
      address_residential_indicator: 'no' as const
    } : defaultShipFrom;

    // Use actual customer address for EVRi (UK courier)
    const shipTo: ShipEngineAddress = {
      name: orderData.shipTo.name,
      company: orderData.shipTo.company || '',
      address_line1: orderData.shipTo.address1,
      address_line2: orderData.shipTo.address2 || '',
      city_locality: orderData.shipTo.city,
      state_province: orderData.shipTo.county,
      postal_code: orderData.shipTo.postcode,
      country_code: orderData.shipTo.country === 'United Kingdom' ? 'GB' : orderData.shipTo.country,
      phone: orderData.shipTo.phone || '',
      address_residential_indicator: 'yes'
    };

    // Calculate total weight (default to 0.5kg per item if not specified)
    const totalWeight = orderData.items.reduce((sum, item) => {
      return sum + (item.weight || 0.5) * item.quantity;
    }, 0);

    const itemCount = orderData.items.reduce((sum, item) => sum + item.quantity, 0);
    const dimensions = this.calculatePackageDimensions(itemCount, totalWeight);

    const labelRequest: CreateLabelRequest = {
      carrier_id: 'se-340606', // EVRi carrier ID
      service_code: 'hermes_domestic_parcelshop_dropoff', // EVRi Domestic - ParcelShop Dropoff
      external_shipment_id: `${orderData.orderReference}-${Date.now()}`, // Make unique with timestamp
      ship_date: new Date().toISOString().split('T')[0], // Today's date
      ship_to: shipTo,
      ship_from: shipFrom,
      packages: [{
        weight: {
          value: Math.max(totalWeight, 0.1), // Minimum 0.1kg
          unit: 'kilogram'
        },
        dimensions: {
          length: dimensions.length,
          width: dimensions.width,
          height: dimensions.height,
          unit: dimensions.unit
        }
      }],
      items: orderData.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        weight: {
          value: item.weight || 0.5,
          unit: 'kilogram'
        }
      })),
      test_label: process.env.NODE_ENV !== 'production', // Use test labels in development
      label_download_type: 'url', // Get URLs to download labels
      label_format: 'pdf', // PDF format for labels
      label_layout: '4x6' // Standard 4x6 label size
    };

    console.log('📋 EVRi Label Request Details:', {
      carrier_id: labelRequest.carrier_id,
      service_code: labelRequest.service_code,
      service_name: 'EVRi Domestic - ParcelShop Dropoff',
      totalWeight: labelRequest.packages[0].weight.value,
      itemCount: labelRequest.items?.length || 0,
      shipTo: {
        name: labelRequest.ship_to.name,
        city: labelRequest.ship_to.city_locality,
        postcode: labelRequest.ship_to.postal_code
      },
      testLabel: labelRequest.test_label,
      labelFormat: labelRequest.label_format,
      labelLayout: labelRequest.label_layout
    });

    const result = await this.createLabel(labelRequest);
    
    console.log('🎉 EVRi Label Generated Successfully:', {
      labelId: result.label_id,
      trackingNumber: result.tracking_number,
      shipmentId: result.shipment_id,
      shippingCost: {
        amount: result.shipping_cost?.amount || 'N/A',
        currency: result.shipping_cost?.currency || 'N/A',
        formatted: result.shipping_cost ? `${result.shipping_cost.currency} ${result.shipping_cost.amount.toFixed(2)}` : 'N/A'
      },
      insuranceCost: {
        amount: result.insurance_cost?.amount || 0,
        currency: result.insurance_cost?.currency || 'N/A'
      },
      labelDownloadUrl: result.label_download?.pdf || 'N/A'
    });

    return result;
  }

  // Create EVRi shipment with custom dimensions
  async createEVRiShipmentWithCustomDimensions(orderData: {
    orderReference: string;
    shipTo: {
      name: string;
      company?: string;
      address1: string;
      address2?: string;
      city: string;
      county: string;
      postcode: string;
      country: string;
      phone?: string;
    };
    items: Array<{
      name: string;
      quantity: number;
      weight?: number;
    }>;
    shipFrom?: {
      name: string;
      company?: string;
      address1: string;
      address2?: string;
      city: string;
      county: string;
      postcode: string;
      country: string;
      phone?: string;
    };
    customDimensions?: PackageDimensions;
    splitPackages?: boolean;
  }): Promise<CreateLabelResponse> {
    
    // Default ship from address (your business address)
    const shipFrom: ShipEngineAddress = {
      name: orderData.shipFrom?.name || 'MR SHIRT PERSONALISATION LTD',
      company: orderData.shipFrom?.company || 'MR SHIRT PERSONALISATION LTD',
      address_line1: orderData.shipFrom?.address1 || 'Your Business Address',
      address_line2: orderData.shipFrom?.address2 || '',
      city_locality: orderData.shipFrom?.city || 'Your City',
      state_province: orderData.shipFrom?.county || 'Your County',
      postal_code: orderData.shipFrom?.postcode || 'Your Postcode',
      country_code: orderData.shipFrom?.country === 'United Kingdom' ? 'GB' : (orderData.shipFrom?.country || 'GB'),
      phone: orderData.shipFrom?.phone || '+447902870824',
      address_residential_indicator: 'no' as 'yes' | 'no'
    };

    // Format ship to address
    const shipTo: ShipEngineAddress = {
      name: orderData.shipTo.name,
      company: orderData.shipTo.company || '',
      address_line1: orderData.shipTo.address1,
      address_line2: orderData.shipTo.address2 || '',
      city_locality: orderData.shipTo.city,
      state_province: orderData.shipTo.county,
      postal_code: orderData.shipTo.postcode,
      country_code: orderData.shipTo.country === 'United Kingdom' ? 'GB' : orderData.shipTo.country,
      phone: orderData.shipTo.phone || '',
      address_residential_indicator: 'yes' as 'yes' | 'no'
    };

    // Calculate total weight
    const totalWeight = orderData.items.reduce((sum, item) => {
      return sum + (item.weight || 0.5) * item.quantity;
    }, 0);

    const itemCount = orderData.items.reduce((sum, item) => sum + item.quantity, 0);

    // Use custom dimensions if provided, otherwise calculate dynamically
    const dimensions = orderData.customDimensions || this.calculatePackageDimensions(itemCount, totalWeight);

    const labelRequest: CreateLabelRequest = {
      carrier_id: 'se-340606', // EVRi carrier ID
      service_code: 'hermes_domestic_parcelshop_dropoff', // EVRi Domestic - ParcelShop Dropoff
      external_shipment_id: `${orderData.orderReference}-${Date.now()}`, // Make unique with timestamp
      ship_date: new Date().toISOString().split('T')[0], // Today's date
      ship_to: shipTo,
      ship_from: shipFrom,
      packages: [{
        weight: {
          value: Math.max(totalWeight, 0.1), // Minimum 0.1kg
          unit: 'kilogram'
        },
        dimensions: {
          length: dimensions.length,
          width: dimensions.width,
          height: dimensions.height,
          unit: dimensions.unit
        }
      }],
      items: orderData.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        weight: {
          value: item.weight || 0.5,
          unit: 'kilogram'
        }
      })),
      test_label: process.env.NODE_ENV !== 'production', // Use test labels in development
      label_download_type: 'url', // Get URLs to download labels
      label_format: 'pdf', // PDF format for labels
      label_layout: '4x6' // Standard 4x6 label size
    };

    console.log('📋 Custom EVRi Label Request Details:', {
      carrier_id: labelRequest.carrier_id,
      service_code: labelRequest.service_code,
      service_name: 'EVRi Domestic - ParcelShop Dropoff',
      totalWeight: labelRequest.packages[0].weight.value,
      customDimensions: dimensions,
      itemCount: labelRequest.items?.length || 0,
      shipTo: {
        name: labelRequest.ship_to.name,
        city: labelRequest.ship_to.city_locality,
        postcode: labelRequest.ship_to.postal_code
      },
      testLabel: labelRequest.test_label,
      labelFormat: labelRequest.label_format,
      labelLayout: labelRequest.label_layout
    });

    const result = await this.createLabel(labelRequest);
    
    console.log('🎉 Custom EVRi Label Generated Successfully:', {
      labelId: result.label_id,
      trackingNumber: result.tracking_number,
      shipmentId: result.shipment_id,
      shippingCost: {
        amount: result.shipping_cost?.amount || 'N/A',
        currency: result.shipping_cost?.currency || 'N/A',
        formatted: result.shipping_cost ? `${result.shipping_cost.currency} ${result.shipping_cost.amount.toFixed(2)}` : 'N/A'
      },
      insuranceCost: {
        amount: result.insurance_cost?.amount || 0,
        currency: result.insurance_cost?.currency || 'N/A'
      },
      labelDownloadUrl: result.label_download?.pdf || 'N/A'
    });

    return result;
  }
}

export default ShipEngineAPI;
export type { CreateLabelResponse, ShipEngineAddress };
