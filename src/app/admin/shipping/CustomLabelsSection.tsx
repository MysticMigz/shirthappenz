'use client';

import { useState, useEffect } from 'react';

interface ShippingLabel {
  _id: string;
  labelId: string;
  shipmentId: string;
  trackingNumber: string;
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
    email?: string;
  };
  shipFrom: {
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
  package: {
    weight: {
      value: number;
      unit: string;
    };
    dimensions: {
      length: number;
      width: number;
      height: number;
      unit: string;
    };
  };
  items: Array<{
    name: string;
    sku?: string;
    quantity: number;
    weight?: {
      value: number;
      unit: string;
    };
    unitPrice?: number;
  }>;
  shipEngineConfig: {
    carrierId: string;
    carrierName?: string;
    serviceCode: string;
    serviceName?: string;
    labelFormat: string;
    labelLayout: string;
    labelDownloadType: string;
    testLabel: boolean;
    shipDate: string;
    externalShipmentId?: string;
  };
  labelDownloadUrl: string;
  labelPngUrl?: string;
  labelZplUrl?: string;
  shippingCost: {
    amount: number;
    currency: string;
  };
  insuranceCost?: {
    amount: number;
    currency: string;
  };
  status: string;
  voided: boolean;
  voidedAt?: string;
  createdBy: string;
  notes?: string;
  orderReference?: string;
  createdAt: string;
}

interface Carrier {
  carrier_id: string;
  friendly_name: string;
}

interface Service {
  service_code: string;
  name: string;
}

export default function CustomLabelsSection() {
  const [labels, setLabels] = useState<ShippingLabel[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Initialize with default EVRi carrier so dropdown isn't empty
  const [carriers, setCarriers] = useState<Carrier[]>([
    { carrier_id: 'se-340606', friendly_name: 'EVRi - ShipStation Carrier Services' }
  ]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedCarrier, setSelectedCarrier] = useState<string>('se-340606'); // Default to EVRi
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    // Ship To
    shipTo: {
      name: '',
      company: '',
      address1: '',
      address2: '',
      city: '',
      county: '',
      postcode: '',
      country: 'United Kingdom',
      phone: '',
      email: ''
    },
    // Ship From
    shipFrom: {
      name: 'MR SHIRT PERSONALISATION LTD',
      company: 'MR SHIRT PERSONALISATION LTD',
      address1: '10 Barney Close',
      address2: '',
      city: 'London',
      county: 'London',
      postcode: 'SE7 8SS',
      country: 'United Kingdom',
      phone: '+447902870824'
    },
    // Package
    package: {
      weight: {
        value: 0.5,
        unit: 'kilogram'
      },
      dimensions: {
        length: 30,
        width: 20,
        height: 5,
        unit: 'centimeter'
      }
    },
    // Items
    items: [{
      name: '',
      sku: '',
      quantity: 1,
      weight: {
        value: 0.5,
        unit: 'kilogram'
      },
      unitPrice: 0
    }],
    // ShipEngine Config
    shipEngineConfig: {
      carrierId: 'se-340606',
      carrierName: 'EVRi - ShipStation Carrier Services',
      serviceCode: 'hermes_domestic_parcelshop_dropoff',
      serviceName: 'EVRi Domestic - ParcelShop Dropoff',
      labelFormat: 'pdf',
      labelLayout: '4x6',
      labelDownloadType: 'url',
      testLabel: process.env.NODE_ENV !== 'production',
      shipDate: new Date().toISOString().split('T')[0],
      externalShipmentId: `custom-${Date.now()}`
    },
    notes: '',
    orderReference: ''
  });

  useEffect(() => {
    fetchLabels();
    fetchCarriers();
  }, [page]);


  useEffect(() => {
    if (selectedCarrier) {
      fetchServices(selectedCarrier);
    }
  }, [selectedCarrier]);

  const fetchLabels = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/shipping-labels?page=${page}&limit=20`);
      if (!response.ok) throw new Error('Failed to fetch labels');
      const data = await response.json();
      setLabels(data.labels);
      setTotalPages(data.pagination.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch labels');
    } finally {
      setLoading(false);
    }
  };

  const fetchCarriers = async () => {
    try {
      const response = await fetch('/api/admin/test-carriers');
      if (response.ok) {
        const data = await response.json();
        if (data.carriers && data.carriers.length > 0) {
          // Update carriers list, but keep EVRi as default if it exists
          setCarriers(data.carriers);
          // If EVRi is in the list, ensure it's selected
          const evriCarrier = data.carriers.find((c: Carrier) => c.carrier_id === 'se-340606');
          if (evriCarrier && selectedCarrier === 'se-340606') {
            // EVRi is already selected, no need to change
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch carriers:', err);
      // Keep the default EVRi carrier even if fetch fails
    }
  };

  const fetchServices = async (carrierId: string) => {
    try {
      const response = await fetch(`/api/admin/shipping-labels/services?carrierId=${carrierId}`);
      if (response.ok) {
        const data = await response.json();
        setServices(data.services || []);
      } else {
        setServices([]);
      }
    } catch (err) {
      console.error('Failed to fetch services:', err);
      setServices([]);
    }
  };

  const handleGenerateLabel = async () => {
    setGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/shipping-labels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate label');
      }

      const result = await response.json();
      alert(`Label generated successfully!\nTracking: ${result.label.trackingNumber}`);
      setShowForm(false);
      resetForm();
      fetchLabels();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate label');
    } finally {
      setGenerating(false);
    }
  };

  const handleVoidLabel = async (labelId: string) => {
    if (!confirm('Are you sure you want to void this label? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/shipping-labels/${labelId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to void label');

      alert('Label voided successfully');
      fetchLabels();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to void label');
    }
  };

  const resetForm = () => {
    setFormData({
      shipTo: {
        name: '',
        company: '',
        address1: '',
        address2: '',
        city: '',
        county: '',
        postcode: '',
        country: 'United Kingdom',
        phone: '',
        email: ''
      },
      shipFrom: {
        name: 'MR SHIRT PERSONALISATION LTD',
        company: 'MR SHIRT PERSONALISATION LTD',
        address1: '10 Barney Close',
        address2: '',
        city: 'London',
        county: 'London',
        postcode: 'SE7 8SS',
        country: 'United Kingdom',
        phone: '+447902870824'
      },
      package: {
        weight: {
          value: 0.5,
          unit: 'kilogram'
        },
        dimensions: {
          length: 30,
          width: 20,
          height: 5,
          unit: 'centimeter'
        }
      },
      items: [{
        name: '',
        sku: '',
        quantity: 1,
        weight: {
          value: 0.5,
          unit: 'kilogram'
        },
        unitPrice: 0
      }],
      shipEngineConfig: {
        carrierId: selectedCarrier,
        carrierName: carriers.find(c => c.carrier_id === selectedCarrier)?.friendly_name || 'Unknown',
        serviceCode: '',
        serviceName: '',
        labelFormat: 'pdf',
        labelLayout: '4x6',
        labelDownloadType: 'url',
        testLabel: process.env.NODE_ENV !== 'production',
        shipDate: new Date().toISOString().split('T')[0],
        externalShipmentId: `custom-${Date.now()}`
      },
      notes: '',
      orderReference: ''
    });
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        name: '',
        sku: '',
        quantity: 1,
        weight: {
          value: 0.5,
          unit: 'kilogram'
        },
        unitPrice: 0
      }]
    }));
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateItem = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  if (loading && labels.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Custom Shipping Labels</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm font-medium"
        >
          {showForm ? 'Cancel' : '+ Generate Custom Label'}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Generate Label Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          <h3 className="text-lg font-medium text-gray-900">Generate Custom Shipping Label</h3>
          
          {/* Ship To Address */}
          <div className="border-t pt-4">
            <h4 className="text-md font-medium text-gray-900 mb-4">Ship To Address</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.shipTo.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, shipTo: { ...prev.shipTo, name: e.target.value } }))}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                <input
                  type="text"
                  value={formData.shipTo.company}
                  onChange={(e) => setFormData(prev => ({ ...prev, shipTo: { ...prev.shipTo, company: e.target.value } }))}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1 *</label>
                <input
                  type="text"
                  value={formData.shipTo.address1}
                  onChange={(e) => setFormData(prev => ({ ...prev, shipTo: { ...prev.shipTo, address1: e.target.value } }))}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  required
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
                <input
                  type="text"
                  value={formData.shipTo.address2}
                  onChange={(e) => setFormData(prev => ({ ...prev, shipTo: { ...prev.shipTo, address2: e.target.value } }))}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                <input
                  type="text"
                  value={formData.shipTo.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, shipTo: { ...prev.shipTo, city: e.target.value } }))}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">County *</label>
                <input
                  type="text"
                  value={formData.shipTo.county}
                  onChange={(e) => setFormData(prev => ({ ...prev, shipTo: { ...prev.shipTo, county: e.target.value } }))}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Postcode *</label>
                <input
                  type="text"
                  value={formData.shipTo.postcode}
                  onChange={(e) => setFormData(prev => ({ ...prev, shipTo: { ...prev.shipTo, postcode: e.target.value } }))}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
                <input
                  type="text"
                  value={formData.shipTo.country}
                  onChange={(e) => setFormData(prev => ({ ...prev, shipTo: { ...prev.shipTo, country: e.target.value } }))}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="text"
                  value={formData.shipTo.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, shipTo: { ...prev.shipTo, phone: e.target.value } }))}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email {formData.shipTo.country && formData.shipTo.country !== 'United Kingdom' && <span className="text-amber-600">(required for international)</span>}
                </label>
                <input
                  type="email"
                  value={formData.shipTo.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, shipTo: { ...prev.shipTo, email: e.target.value } }))}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  required={formData.shipTo.country !== 'United Kingdom'}
                />
              </div>
            </div>
          </div>

          {/* Ship From Address */}
          <div className="border-t pt-4">
            <h4 className="text-md font-medium text-gray-900 mb-4">Ship From Address</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.shipFrom.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, shipFrom: { ...prev.shipFrom, name: e.target.value } }))}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                <input
                  type="text"
                  value={formData.shipFrom.company}
                  onChange={(e) => setFormData(prev => ({ ...prev, shipFrom: { ...prev.shipFrom, company: e.target.value } }))}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1 *</label>
                <input
                  type="text"
                  value={formData.shipFrom.address1}
                  onChange={(e) => setFormData(prev => ({ ...prev, shipFrom: { ...prev.shipFrom, address1: e.target.value } }))}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  required
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
                <input
                  type="text"
                  value={formData.shipFrom.address2}
                  onChange={(e) => setFormData(prev => ({ ...prev, shipFrom: { ...prev.shipFrom, address2: e.target.value } }))}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                <input
                  type="text"
                  value={formData.shipFrom.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, shipFrom: { ...prev.shipFrom, city: e.target.value } }))}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">County *</label>
                <input
                  type="text"
                  value={formData.shipFrom.county}
                  onChange={(e) => setFormData(prev => ({ ...prev, shipFrom: { ...prev.shipFrom, county: e.target.value } }))}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Postcode *</label>
                <input
                  type="text"
                  value={formData.shipFrom.postcode}
                  onChange={(e) => setFormData(prev => ({ ...prev, shipFrom: { ...prev.shipFrom, postcode: e.target.value } }))}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
                <input
                  type="text"
                  value={formData.shipFrom.country}
                  onChange={(e) => setFormData(prev => ({ ...prev, shipFrom: { ...prev.shipFrom, country: e.target.value } }))}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="text"
                  value={formData.shipFrom.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, shipFrom: { ...prev.shipFrom, phone: e.target.value } }))}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Package Details */}
          <div className="border-t pt-4">
            <h4 className="text-md font-medium text-gray-900 mb-4">Package Details</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg) *</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.package.weight.value}
                  onChange={(e) => setFormData(prev => ({ ...prev, package: { ...prev.package, weight: { ...prev.package.weight, value: parseFloat(e.target.value) || 0 } } }))}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Weight Unit</label>
                <select
                  value={formData.package.weight.unit}
                  onChange={(e) => setFormData(prev => ({ ...prev, package: { ...prev.package, weight: { ...prev.package.weight, unit: e.target.value } } }))}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                >
                  <option value="kilogram">Kilogram</option>
                  <option value="gram">Gram</option>
                  <option value="pound">Pound</option>
                  <option value="ounce">Ounce</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Length (cm) *</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.package.dimensions.length}
                  onChange={(e) => setFormData(prev => ({ ...prev, package: { ...prev.package, dimensions: { ...prev.package.dimensions, length: parseFloat(e.target.value) || 0 } } }))}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Width (cm) *</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.package.dimensions.width}
                  onChange={(e) => setFormData(prev => ({ ...prev, package: { ...prev.package, dimensions: { ...prev.package.dimensions, width: parseFloat(e.target.value) || 0 } } }))}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm) *</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.package.dimensions.height}
                  onChange={(e) => setFormData(prev => ({ ...prev, package: { ...prev.package, dimensions: { ...prev.package.dimensions, height: parseFloat(e.target.value) || 0 } } }))}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dimension Unit</label>
                <select
                  value={formData.package.dimensions.unit}
                  onChange={(e) => setFormData(prev => ({ ...prev, package: { ...prev.package, dimensions: { ...prev.package.dimensions, unit: e.target.value } } }))}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                >
                  <option value="centimeter">Centimeter</option>
                  <option value="inch">Inch</option>
                </select>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-md font-medium text-gray-900">Items</h4>
              <button
                onClick={addItem}
                className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
              >
                + Add Item
              </button>
            </div>
            <div className="space-y-4">
              {formData.items.map((item, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">Item {index + 1}</span>
                    {formData.items.length > 1 && (
                      <button
                        onClick={() => removeItem(index)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateItem(index, 'name', e.target.value)}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                      <input
                        type="text"
                        value={item.sku}
                        onChange={(e) => updateItem(index, 'sku', e.target.value)}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={item.weight?.value || 0.5}
                        onChange={(e) => updateItem(index, 'weight', { ...item.weight, value: parseFloat(e.target.value) || 0.5 })}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price</label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.unitPrice || 0}
                        onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ShipEngine Configuration */}
          <div className="border-t pt-4">
            <h4 className="text-md font-medium text-gray-900 mb-4">ShipEngine Configuration</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Carrier *</label>
                <select
                  value={selectedCarrier}
                  onChange={(e) => {
                    setSelectedCarrier(e.target.value);
                    setFormData(prev => ({ ...prev, shipEngineConfig: { ...prev.shipEngineConfig, carrierId: e.target.value, carrierName: carriers.find(c => c.carrier_id === e.target.value)?.friendly_name || 'Unknown' } }));
                  }}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  required
                >
                  {carriers.map(carrier => (
                    <option key={carrier.carrier_id} value={carrier.carrier_id}>
                      {carrier.friendly_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service *</label>
                <select
                  value={formData.shipEngineConfig.serviceCode}
                  onChange={(e) => {
                    const selectedService = services.find(s => s.service_code === e.target.value);
                    setFormData(prev => ({ ...prev, shipEngineConfig: { ...prev.shipEngineConfig, serviceCode: e.target.value, serviceName: selectedService?.name || '' } }));
                  }}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  required
                >
                  <option value="">Select a service</option>
                  {services.map(service => (
                    <option key={service.service_code} value={service.service_code}>
                      {service.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Label Format</label>
                <select
                  value={formData.shipEngineConfig.labelFormat}
                  onChange={(e) => setFormData(prev => ({ ...prev, shipEngineConfig: { ...prev.shipEngineConfig, labelFormat: e.target.value } }))}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                >
                  <option value="pdf">PDF</option>
                  <option value="png">PNG</option>
                  <option value="zpl">ZPL</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Label Layout</label>
                <select
                  value={formData.shipEngineConfig.labelLayout}
                  onChange={(e) => setFormData(prev => ({ ...prev, shipEngineConfig: { ...prev.shipEngineConfig, labelLayout: e.target.value } }))}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                >
                  <option value="4x6">4x6</option>
                  <option value="4x8">4x8</option>
                  <option value="letter">Letter</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ship Date *</label>
                <input
                  type="date"
                  value={formData.shipEngineConfig.shipDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, shipEngineConfig: { ...prev.shipEngineConfig, shipDate: e.target.value } }))}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  required
                />
              </div>
              <div className="flex items-center pt-6">
                <input
                  type="checkbox"
                  id="testLabel"
                  checked={formData.shipEngineConfig.testLabel}
                  onChange={(e) => setFormData(prev => ({ ...prev, shipEngineConfig: { ...prev.shipEngineConfig, testLabel: e.target.checked } }))}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="testLabel" className="ml-2 text-sm font-medium text-gray-700">
                  Test Label (ShipEngine test mode)
                </label>
              </div>
            </div>
          </div>

          {/* Additional Fields */}
          <div className="border-t pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Order Reference</label>
                <input
                  type="text"
                  value={formData.orderReference}
                  onChange={(e) => setFormData(prev => ({ ...prev, orderReference: e.target.value }))}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  placeholder="Optional: Link to an order"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  placeholder="Optional notes"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-2 pt-4 border-t">
            <button
              onClick={handleGenerateLabel}
              disabled={generating || !formData.shipTo.name || !formData.shipTo.address1 || !formData.shipTo.city || !formData.shipTo.postcode || !formData.shipEngineConfig.serviceCode || (formData.shipTo.country !== 'United Kingdom' && !formData.shipTo.email?.trim())}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 font-medium"
            >
              {generating ? 'Generating Label...' : 'Generate Label'}
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Labels List */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Saved Custom Labels ({labels.length})</h3>
        
        {labels.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No custom labels generated yet.</p>
            <p className="text-sm mt-2">Click "Generate Custom Label" to create your first label.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {labels.map((label) => (
              <div
                key={label._id}
                className={`border rounded-lg p-4 ${label.voided ? 'bg-gray-50 opacity-75' : 'bg-white'}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        {label.shipTo.name}
                      </span>
                      {label.voided && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">VOIDED</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Tracking: {label.trackingNumber}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {label.labelDownloadUrl && (
                      <a
                        href={label.labelDownloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700"
                      >
                        Download PDF
                      </a>
                    )}
                    {!label.voided && (
                      <button
                        onClick={() => handleVoidLabel(label._id)}
                        className="px-3 py-1 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700"
                      >
                        Void
                      </button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                  <div>
                    <strong>Ship To:</strong> {label.shipTo.address1}, {label.shipTo.city}, {label.shipTo.postcode}
                  </div>
                  <div>
                    <strong>Carrier:</strong> {label.shipEngineConfig.carrierName || 'Unknown'}
                  </div>
                  <div>
                    <strong>Service:</strong> {label.shipEngineConfig.serviceName || label.shipEngineConfig.serviceCode}
                  </div>
                  <div>
                    <strong>Cost:</strong> {label.shippingCost.currency} {label.shippingCost.amount.toFixed(2)}
                  </div>
                  {label.orderReference && (
                    <div>
                      <strong>Order Ref:</strong> {label.orderReference}
                    </div>
                  )}
                  <div>
                    <strong>Created:</strong> {new Date(label.createdAt).toLocaleDateString()}
                  </div>
                </div>
                {label.notes && (
                  <div className="mt-2 text-xs text-gray-600">
                    <strong>Notes:</strong> {label.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

