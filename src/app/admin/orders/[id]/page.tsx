'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { saveAs } from 'file-saver';
import Image from 'next/image';
import RefundModal from '@/app/components/RefundModal';
import ProductImageOverlay from '@/app/components/ProductImageOverlay';
import { getImageUrl } from '@/lib/utils';

const formatVoucherDiscount = (order: Order) => {
  if (!order.voucherCode || !order.voucherDiscount) {
    return null;
  }

  // Display the exact voucher discount value from database without any conversion
  const discountAmount = order.voucherDiscount;
  
  let discountText = '';
  if (order.voucherType === 'percentage') {
    discountText = `${order.voucherValue}% off`;
  } else if (order.voucherType === 'fixed') {
    discountText = `£${order.voucherValue || 0} off`;
  } else if (order.voucherType === 'free_shipping') {
    discountText = 'Free shipping';
  }

  return {
    code: order.voucherCode,
    discountText,
    discountAmount,
    originalTotal: order.total, // Use the total as stored in database
    finalTotal: order.total, // Use the total as stored in database
  };
};

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  size: string;
  color?: string;
  image?: string;
  mockupImage?: { url: string; alt: string };
  designImage?: { url: string; alt: string; position?: { x: number; y: number }; scale?: number; rotation?: number };
  customization?: {
    isCustomized?: boolean;
    name?: string;
    number?: string;
    nameCharacters?: number;
    numberCharacters?: number;
    customizationCost?: number;
    frontImage?: string;
    backImage?: string;
    frontPosition: { x: number; y: number };
    backPosition: { x: number; y: number };
    frontScale: number;
    backScale: number;
    frontRotation?: number;
    backRotation?: number;
  };
}

interface Order {
  _id: string;
  reference: string;
  userId: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'payment_failed';
  productionStatus: 'not_started' | 'in_production' | 'quality_check' | 'ready_to_ship' | 'completed';
  deliveryPriority: number;
  productionNotes: string;
  productionStartDate: string | null;
  productionCompletedDate: string | null;
  voucherCode?: string;
  voucherDiscount?: number;
  voucherType?: 'percentage' | 'fixed' | 'free_shipping';
  voucherValue?: number;
  metadata?: {
    refundAmount?: number;
    refundReason?: string;
    refundNotes?: string;
    refundedAt?: string;
    refundedBy?: string;
    stripeRefundId?: string;
  };
  createdAt: string;
  shippingDetails: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    postcode: string;
    shippingMethod: string;
    shippingCost: number;
    trackingNumber?: string;
    courier?: string;
    shippedAt?: string;
    labelDownloadUrl?: string;
    labelId?: string;
    shipmentId?: string;
    actualShippingCost?: number;
    actualShippingCurrency?: string;
  };
}

export default function AdminOrderDetailsPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const [productionStatusUpdateLoading, setProductionStatusUpdateLoading] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState('');
  const [refundModal, setRefundModal] = useState<{
    isOpen: boolean;
    orderReference: string;
    orderTotal: number;
  }>({ isOpen: false, orderReference: '', orderTotal: 0 });
  const [refundLoading, setRefundLoading] = useState(false);
  const [refundInfo, setRefundInfo] = useState<any>(null);
  
  // Label preview and custom dimensions state
  const [showLabelPreview, setShowLabelPreview] = useState(false);
  const [labelPreview, setLabelPreview] = useState<any>(null);
  const [customDimensions, setCustomDimensions] = useState({
    length: 0,
    width: 0,
    height: 0,
    unit: 'centimeter' as 'centimeter' | 'inch'
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const response = await fetch(`/api/admin/orders/${params.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch order details');
        }
        const data = await response.json();
        setOrder(data.order);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch order details');
      } finally {
        setLoading(false);
      }
    };

    if (session?.user) {
      fetchOrderDetails();
    }
  }, [session, params.id]);

  const handleStatusChange = async (newStatus: string) => {
    setStatusUpdateLoading(true);
    try {
      const response = await fetch(`/api/admin/orders/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update order status');
      }

      const updatedOrder = await response.json();
      setOrder(updatedOrder.order);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update order status');
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  const handleProductionStatusChange = async (newProductionStatus: string) => {
    setProductionStatusUpdateLoading(true);
    try {
      const response = await fetch(`/api/admin/orders/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productionStatus: newProductionStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update production status');
      }

      const updatedOrder = await response.json();
      setOrder(updatedOrder);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update production status');
    } finally {
      setProductionStatusUpdateLoading(false);
    }
  };

  const handleNotesUpdate = async () => {
    try {
      const response = await fetch(`/api/admin/orders/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productionNotes: notesText }),
      });

      if (!response.ok) {
        throw new Error('Failed to update production notes');
      }

      const updatedOrder = await response.json();
      setOrder(updatedOrder.order);
      setEditingNotes(false);
      setNotesText('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update production notes');
    }
  };

  const fetchRefundInfo = async () => {
    try {
      const response = await fetch(`/api/admin/orders/${params.id}/refund`);
      if (response.ok) {
        const data = await response.json();
        setRefundInfo(data);
      }
    } catch (error) {
      console.error('Failed to fetch refund info:', error);
    }
  };

  const handleRefund = async (refundAmount: number, reason: string, notes: string) => {
    setRefundLoading(true);
    try {
      const response = await fetch(`/api/admin/orders/${params.id}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refundAmount, reason, notes }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process refund');
      }

      const result = await response.json();
      alert(`Refund processed successfully! Refund ID: ${result.refund.id}`);
      setRefundModal({ isOpen: false, orderReference: '', orderTotal: 0 });
      
      // Refresh order details
      const orderResponse = await fetch(`/api/admin/orders/${params.id}`);
      if (orderResponse.ok) {
        const orderData = await orderResponse.json();
        setOrder(orderData.order);
      }
    } catch (err) {
      console.error('Refund error:', err);
      alert(err instanceof Error ? err.message : 'Failed to process refund');
    } finally {
      setRefundLoading(false);
    }
  };

  // Fetch refund info when order is cancelled
  useEffect(() => {
    if (order?.status === 'cancelled') {
      fetchRefundInfo();
    }
  }, [order?.status]);

  // Label preview and generation handlers
  const handlePreviewLabel = async () => {
    try {
      setShowLabelPreview(true);
      setLabelPreview(null); // Reset preview
      
      const response = await fetch(`/api/admin/orders/${params.id}/preview-label`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Failed to generate label preview');
      }

      const preview = await response.json();
      setLabelPreview(preview);
      
      // Initialize custom dimensions with first package dimensions
      if (preview.packages && preview.packages.length > 0) {
        setCustomDimensions({
          length: preview.packages[0].dimensions.length,
          width: preview.packages[0].dimensions.width,
          height: preview.packages[0].dimensions.height,
          unit: preview.packages[0].dimensions.unit
        });
      }
    } catch (error) {
      console.error('Error generating label preview:', error);
      alert('Failed to generate label preview');
      setShowLabelPreview(false);
    }
  };

  const handleGenerateLabel = async () => {
    try {
      const response = await fetch(`/api/admin/orders/${params.id}/generate-label`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Failed to generate shipping label');
      }

      const result = await response.json();
      alert('Shipping label generated successfully!');
      
      // Refresh order data
      const orderResponse = await fetch(`/api/admin/orders/${params.id}`);
      if (orderResponse.ok) {
        const orderData = await orderResponse.json();
        setOrder(orderData.order);
      }
    } catch (error) {
      console.error('Error generating label:', error);
      alert('Failed to generate shipping label');
    }
  };

  const handleGenerateCustomLabel = async () => {
    try {
      const response = await fetch(`/api/admin/orders/${params.id}/generate-label-custom`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customDimensions: customDimensions,
          splitPackages: false
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate custom shipping label');
      }

      const result = await response.json();
      alert('Custom shipping label generated successfully!');
      setShowLabelPreview(false);
      
      // Refresh order data
      const orderResponse = await fetch(`/api/admin/orders/${params.id}`);
      if (orderResponse.ok) {
        const orderData = await orderResponse.json();
        setOrder(orderData.order);
      }
    } catch (error) {
      console.error('Error generating custom label:', error);
      alert('Failed to generate custom shipping label');
    }
  };

  const exportOrderItemForDTF = (customization: OrderItem['customization'], side = 'front', designName = 'dtf-design') => {
    if (!customization) return;
    const PRINT_WIDTH = 2480; // A4 at 300 DPI
    const PRINT_HEIGHT = 3508;
    const scaleFactor = PRINT_WIDTH / 600; // assuming previewWidth = 600

    const design = customization;
    const imageUrl = side === 'front' ? design.frontImage : design.backImage;
    if (!imageUrl) return;

    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = PRINT_WIDTH;
      canvas.height = PRINT_HEIGHT;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Clear canvas with transparent background (no fill)
      ctx.clearRect(0, 0, PRINT_WIDTH, PRINT_HEIGHT);

      // Use stored customization controls
      const imgPreviewW = 200 * (side === 'front' ? design.frontScale ?? 1 : design.backScale ?? 1);
      const imgPreviewH = 200 * (side === 'front' ? design.frontScale ?? 1 : design.backScale ?? 1);
      const imgPrintW = imgPreviewW * scaleFactor;
      const imgPrintH = imgPreviewH * scaleFactor;
      const offsetX = (side === 'front' ? design.frontPosition?.x ?? 0 : design.backPosition?.x ?? 0) * scaleFactor;
      const offsetY = (side === 'front' ? design.frontPosition?.y ?? 0 : design.backPosition?.y ?? 0) * scaleFactor;
      const rotation = (side === 'front' ? design.frontRotation ?? 0 : design.backRotation ?? 0);

      const centerX = PRINT_WIDTH / 2;
      const centerY = PRINT_HEIGHT / 2;

      ctx.save();
      ctx.translate(centerX + offsetX, centerY + offsetY);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.drawImage(img, -imgPrintW / 2, -imgPrintH / 2, imgPrintW, imgPrintH);
      ctx.restore();

      canvas.toBlob(blob => {
        if (blob) {
          saveAs(blob, `${designName}-${side}-transparent.png`);
        }
      }, 'image/png');
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error || 'Order not found'}</p>
          </div>
          <Link
            href="/admin/orders"
            className="text-purple-600 hover:text-purple-900"
          >
            ← Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link
            href="/admin/orders"
            className="text-purple-600 hover:text-purple-900"
          >
            ← Back to Orders
          </Link>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-semibold text-gray-900">
                Order {order.reference}
              </h1>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">
                  {new Date(order.createdAt).toLocaleString()}
                </span>
                <select
                  value={order.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  disabled={statusUpdateLoading}
                  className="rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="payment_failed">Payment Failed</option>
                </select>
                {order.metadata?.refundAmount && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Refunded £{order.metadata.refundAmount.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Customer Details</h2>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Name:</span>{' '}
                    {order.shippingDetails
                      ? `${order.shippingDetails.firstName ?? ''} ${order.shippingDetails.lastName ?? ''}`.trim() || 'N/A'
                      : 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    <span className="font-medium">Email:</span>{' '}
                    {order.shippingDetails?.email || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    <span className="font-medium">Phone:</span>{' '}
                    {order.shippingDetails?.phone || 'N/A'}
                  </p>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Shipping Address</h2>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">
                    {order.shippingDetails?.address || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    {order.shippingDetails?.city || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    {order.shippingDetails?.postcode || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Label Generation Section */}
            {order.productionStatus === 'ready_to_ship' && !order.shippingDetails?.labelDownloadUrl && (
              <div className="mt-8">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Shipping Label Generation</h2>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-yellow-900 mb-2">Generate Shipping Label</h3>
                      <p className="text-sm text-yellow-700">
                        This order is ready to ship. Preview the ShipEngine settings before generating the label.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handlePreviewLabel}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium transition-colors"
                      >
                        Preview Settings
                      </button>
                      <button
                        onClick={handleGenerateLabel}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium transition-colors"
                      >
                        Generate Label
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Label Preview Modal */}
            {showLabelPreview && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">ShipEngine Settings Preview</h3>
                    <button
                      onClick={() => setShowLabelPreview(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {labelPreview ? (
                    <div className="space-y-6">
                      {/* ShipEngine Configuration Summary */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-blue-900 mb-3">ShipEngine Configuration</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-blue-700">Carrier ID:</span>
                            <p className="text-blue-600">{labelPreview.shipEngineConfig?.carrierId || 'se-340606'} (EVRi)</p>
                          </div>
                          <div>
                            <span className="font-medium text-blue-700">Service Code:</span>
                            <p className="text-blue-600">{labelPreview.shipEngineConfig?.serviceCode || 'hermes_domestic_parcelshop_dropoff'}</p>
                          </div>
                          <div>
                            <span className="font-medium text-blue-700">Label Format:</span>
                            <p className="text-blue-600">{labelPreview.shipEngineConfig?.labelFormat?.toUpperCase()} ({labelPreview.shipEngineConfig?.labelLayout})</p>
                          </div>
                          <div>
                            <span className="font-medium text-blue-700">Test Mode:</span>
                            <p className="text-blue-600">{labelPreview.shipEngineConfig?.testMode ? 'Yes' : 'No'}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-3">
                          <div>
                            <span className="font-medium text-blue-700">Ship Date:</span>
                            <p className="text-blue-600">{labelPreview.shipEngineConfig?.shipDate}</p>
                          </div>
                          <div>
                            <span className="font-medium text-blue-700">Download Type:</span>
                            <p className="text-blue-600">{labelPreview.shipEngineConfig?.labelDownloadType}</p>
                          </div>
                          <div>
                            <span className="font-medium text-blue-700">External ID:</span>
                            <p className="text-blue-600 font-mono text-xs">{labelPreview.shipEngineConfig?.externalShipmentId}</p>
                          </div>
                          <div>
                            <span className="font-medium text-blue-700">Service Name:</span>
                            <p className="text-blue-600">{labelPreview.shipEngineConfig?.serviceName}</p>
                          </div>
                        </div>
                      </div>

                      {/* Package Configuration */}
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Package Configuration</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">Total Weight:</span>
                            <p className="text-gray-600">{labelPreview.totalWeight.toFixed(2)} kg</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Item Count:</span>
                            <p className="text-gray-600">{labelPreview.itemCount}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Package Count:</span>
                            <p className="text-gray-600">{labelPreview.packageCount}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Min Weight:</span>
                            <p className="text-gray-600">0.1 kg</p>
                          </div>
                        </div>
                      </div>

                      {/* ShipEngine Request Details */}
                      {labelPreview.packages.map((pkg: any, index: number) => (
                        <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-3">
                            Package {index + 1} Configuration {labelPreview.packages.length > 1 ? `(${pkg.weight.toFixed(2)} kg)` : ''}
                          </h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* ShipEngine Package Object */}
                            <div>
                              <h5 className="text-xs font-medium text-gray-700 mb-2">ShipEngine Package Object</h5>
                              <div className="bg-white border border-gray-200 rounded p-3">
                                <div className="space-y-2 text-sm font-mono">
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">weight.value:</span>
                                    <span className="text-gray-900">{Math.max(pkg.weight, 0.1).toFixed(2)} kg</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">weight.unit:</span>
                                    <span className="text-gray-900">kilogram</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">dimensions.length:</span>
                                    <span className="text-gray-900">{pkg.dimensions.length} {pkg.dimensions.unit}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">dimensions.width:</span>
                                    <span className="text-gray-900">{pkg.dimensions.width} {pkg.dimensions.unit}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">dimensions.height:</span>
                                    <span className="text-gray-900">{pkg.dimensions.height} {pkg.dimensions.unit}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">dimensions.unit:</span>
                                    <span className="text-gray-900">{pkg.dimensions.unit}</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Custom Dimensions Override */}
                            <div>
                              <h5 className="text-xs font-medium text-gray-700 mb-2">Override Dimensions</h5>
                              <div className="space-y-2">
                                <div className="grid grid-cols-3 gap-2">
                                  <input
                                    type="number"
                                    placeholder="Length"
                                    value={customDimensions.length || ''}
                                    onChange={(e) => setCustomDimensions(prev => ({ ...prev, length: parseInt(e.target.value) || 0 }))}
                                    className="text-sm border border-gray-300 rounded px-2 py-1"
                                  />
                                  <input
                                    type="number"
                                    placeholder="Width"
                                    value={customDimensions.width || ''}
                                    onChange={(e) => setCustomDimensions(prev => ({ ...prev, width: parseInt(e.target.value) || 0 }))}
                                    className="text-sm border border-gray-300 rounded px-2 py-1"
                                  />
                                  <input
                                    type="number"
                                    placeholder="Height"
                                    value={customDimensions.height || ''}
                                    onChange={(e) => setCustomDimensions(prev => ({ ...prev, height: parseInt(e.target.value) || 0 }))}
                                    className="text-sm border border-gray-300 rounded px-2 py-1"
                                  />
                                </div>
                                <div className="flex items-center space-x-2">
                                  <label className="flex items-center text-xs">
                                    <input
                                      type="radio"
                                      name="unit"
                                      value="centimeter"
                                      checked={customDimensions.unit === 'centimeter'}
                                      onChange={(e) => setCustomDimensions(prev => ({ ...prev, unit: e.target.value as 'centimeter' | 'inch' }))}
                                      className="mr-1"
                                    />
                                    cm
                                  </label>
                                  <label className="flex items-center text-xs">
                                    <input
                                      type="radio"
                                      name="unit"
                                      value="inch"
                                      checked={customDimensions.unit === 'inch'}
                                      onChange={(e) => setCustomDimensions(prev => ({ ...prev, unit: e.target.value as 'centimeter' | 'inch' }))}
                                      className="mr-1"
                                    />
                                    in
                                  </label>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* ShipEngine Items Array */}
                          <div className="mt-4">
                            <h5 className="text-xs font-medium text-gray-700 mb-2">ShipEngine Items Array</h5>
                            <div className="bg-white border border-gray-200 rounded p-3">
                              <div className="space-y-1">
                                {pkg.items.map((item: any, itemIndex: number) => (
                                  <div key={itemIndex} className="flex justify-between text-sm font-mono">
                                    <span className="text-gray-600">name: "{item.name}"</span>
                                    <span className="text-gray-900">quantity: {item.quantity}, weight: {item.weight}kg</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Shipping Addresses */}
                      {labelPreview.addresses && (
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-purple-900 mb-3">Shipping Addresses</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h5 className="text-xs font-medium text-purple-700 mb-2">Ship To (Customer)</h5>
                              <div className="bg-white border border-purple-200 rounded p-3">
                                <div className="space-y-1 text-sm">
                                  <div><span className="font-medium">Name:</span> {labelPreview.addresses.shipTo.name}</div>
                                  <div><span className="font-medium">Address:</span> {labelPreview.addresses.shipTo.address}</div>
                                  <div><span className="font-medium">Country:</span> {labelPreview.addresses.shipTo.country}</div>
                                </div>
                              </div>
                            </div>
                            <div>
                              <h5 className="text-xs font-medium text-purple-700 mb-2">Ship From (Your Business)</h5>
                              <div className="bg-white border border-purple-200 rounded p-3">
                                <div className="space-y-1 text-sm">
                                  <div><span className="font-medium">Name:</span> {labelPreview.addresses.shipFrom.name}</div>
                                  <div><span className="font-medium">Address:</span> {labelPreview.addresses.shipFrom.address}</div>
                                  <div><span className="font-medium">Country:</span> {labelPreview.addresses.shipFrom.country}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* ShipEngine Request Summary */}
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-green-900 mb-3">Complete ShipEngine Request Object</h4>
                        <div className="bg-white border border-green-200 rounded p-3">
                          <div className="space-y-2 text-sm font-mono">
                            <div><span className="text-green-700">carrier_id:</span> <span className="text-gray-900">"{labelPreview.shipEngineConfig?.carrierId || 'se-340606'}"</span></div>
                            <div><span className="text-green-700">service_code:</span> <span className="text-gray-900">"{labelPreview.shipEngineConfig?.serviceCode || 'hermes_domestic_parcelshop_dropoff'}"</span></div>
                            <div><span className="text-green-700">ship_date:</span> <span className="text-gray-900">"{labelPreview.shipEngineConfig?.shipDate}"</span></div>
                            <div><span className="text-green-700">test_label:</span> <span className="text-gray-900">{labelPreview.shipEngineConfig?.testMode ? 'true' : 'false'}</span></div>
                            <div><span className="text-green-700">label_download_type:</span> <span className="text-gray-900">"{labelPreview.shipEngineConfig?.labelDownloadType}"</span></div>
                            <div><span className="text-green-700">label_format:</span> <span className="text-gray-900">"{labelPreview.shipEngineConfig?.labelFormat}"</span></div>
                            <div><span className="text-green-700">label_layout:</span> <span className="text-gray-900">"{labelPreview.shipEngineConfig?.labelLayout}"</span></div>
                            <div><span className="text-green-700">external_shipment_id:</span> <span className="text-gray-900">"{labelPreview.shipEngineConfig?.externalShipmentId}"</span></div>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                        <button
                          onClick={() => setShowLabelPreview(false)}
                          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm font-medium"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleGenerateCustomLabel}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
                        >
                          Generate Label with These Settings
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-500">Loading ShipEngine settings...</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tracking Information */}
            {(order.shippingDetails?.trackingNumber || order.shippingDetails?.courier) && (
              <div className="mt-8">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Tracking Information</h2>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {order.shippingDetails?.trackingNumber && (
                      <div>
                        <h3 className="text-sm font-medium text-blue-900 mb-2">Tracking Number</h3>
                        <p className="text-sm text-blue-700 font-mono bg-blue-100 px-3 py-2 rounded border">
                          {order.shippingDetails.trackingNumber}
                        </p>
                      </div>
                    )}
                    {order.shippingDetails?.courier && (
                      <div>
                        <h3 className="text-sm font-medium text-blue-900 mb-2">Courier</h3>
                        <p className="text-sm text-blue-700">
                          {order.shippingDetails.courier}
                        </p>
                      </div>
                    )}
                    {order.shippingDetails?.shippedAt && (
                      <div>
                        <h3 className="text-sm font-medium text-blue-900 mb-2">Shipped Date</h3>
                        <p className="text-sm text-blue-700">
                          {new Date(order.shippingDetails.shippedAt).toLocaleDateString()} at {new Date(order.shippingDetails.shippedAt).toLocaleTimeString()}
                        </p>
                      </div>
                    )}
                    {order.shippingDetails?.labelDownloadUrl && (
                      <div className="md:col-span-2">
                        <h3 className="text-sm font-medium text-blue-900 mb-2">Shipping Label</h3>
                        <div className="flex items-center gap-3">
                          <a
                            href={order.shippingDetails.labelDownloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium transition-colors"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Download Label PDF
                          </a>
                          {order.shippingDetails?.labelId && (
                            <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                              Label ID: {order.shippingDetails.labelId}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  {order.shippingDetails?.trackingNumber && order.shippingDetails?.courier && (
                    <div className="mt-4 pt-4 border-t border-blue-200">
                      <a
                        href={`https://www.google.com/search?q=${order.shippingDetails.courier}+tracking+${order.shippingDetails.trackingNumber}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium transition-colors"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Track Package
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Production Information */}
            <div className="mt-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Production Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Delivery Priority</h3>
                  <p className={`text-2xl font-bold ${
                    order.deliveryPriority >= 100 ? 'text-red-600' : 
                    order.deliveryPriority >= 50 ? 'text-orange-600' : 'text-gray-600'
                  }`}>
                    {order.deliveryPriority}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {order.shippingDetails?.shippingMethod || 'N/A'}
                  </p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Production Status</h3>
                  <select
                    value={order.productionStatus}
                    onChange={(e) => handleProductionStatusChange(e.target.value)}
                    disabled={productionStatusUpdateLoading}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  >
                    <option value="not_started">Not Started</option>
                    <option value="in_production">In Production</option>
                    <option value="quality_check">Quality Check</option>
                    <option value="ready_to_ship">Ready to Ship</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Production Dates</h3>
                  <div className="space-y-1 text-xs text-gray-600">
                    {order.productionStartDate && (
                      <p><strong>Started:</strong> {new Date(order.productionStartDate).toLocaleDateString()}</p>
                    )}
                    {order.productionCompletedDate && (
                      <p><strong>Completed:</strong> {new Date(order.productionCompletedDate).toLocaleDateString()}</p>
                    )}
                    {!order.productionStartDate && !order.productionCompletedDate && (
                      <p>No production dates set</p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Production Notes */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Production Notes</h3>
                {editingNotes ? (
                  <div className="space-y-2">
                    <textarea
                      value={notesText}
                      onChange={(e) => setNotesText(e.target.value)}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                      rows={3}
                      placeholder="Add production notes..."
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleNotesUpdate}
                        className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                      >
                        Save Notes
                      </button>
                      <button
                        onClick={() => {
                          setEditingNotes(false);
                          setNotesText('');
                        }}
                        className="px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">
                      {order.productionNotes || 'No production notes added yet.'}
                    </p>
                    <button
                      onClick={() => {
                        setEditingNotes(true);
                        setNotesText(order.productionNotes || '');
                      }}
                      className="px-3 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm"
                    >
                      {order.productionNotes ? 'Edit Notes' : 'Add Notes'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Order Items</h2>
              <div className="bg-gray-50 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Image
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Size
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Color
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customization
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Array.isArray(order.items) && order.items.length > 0 ? (
                      order.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-200 bg-white">
                              {item.mockupImage || item.designImage ? (
                                <ProductImageOverlay
                                  mockupImage={item.mockupImage}
                                  designImage={item.designImage}
                                  fallbackImage={item.image ? { url: getImageUrl(item.image), alt: item.name } : undefined}
                                  className="w-full h-full"
                                />
                              ) : item.image ? (
                                <img
                                  src={getImageUrl(item.image)}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = getImageUrl('/images/logo.png');
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                  <span className="text-gray-400 text-xs">No image</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.size}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.color || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.customization?.isCustomized ? (
                              <div className="space-y-1">
                                {item.customization.name && (
                                  <div className="text-xs">
                                    <span className="font-medium">Name:</span> {item.customization.name}
                                    {item.customization.nameCharacters && (
                                      <span className="text-gray-500 ml-1">({item.customization.nameCharacters} chars)</span>
                                    )}
                                  </div>
                                )}
                                {item.customization.number && (
                                  <div className="text-xs">
                                    <span className="font-medium">Number:</span> {item.customization.number}
                                    {item.customization.numberCharacters && (
                                      <span className="text-gray-500 ml-1">({item.customization.numberCharacters} chars)</span>
                                    )}
                                  </div>
                                )}
                                {item.customization.customizationCost && (
                                  <div className="text-xs text-purple-600">
                                    Cost: £{item.customization.customizationCost.toFixed(2)}
                                  </div>
                                )}
                                {(item.customization?.frontImage || item.customization?.backImage) && (
                                  <div className="mt-2 flex flex-col gap-1">
                                    {item.customization?.frontImage && (
                                      <button
                                        className="px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 text-xs"
                                        onClick={() => exportOrderItemForDTF(item.customization, 'front', item.customization?.name || item.name)}
                                      >
                                        Export Front for DTF
                                      </button>
                                    )}
                                    {item.customization?.backImage && (
                                      <button
                                        className="px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 text-xs"
                                        onClick={() => exportOrderItemForDTF(item.customization, 'back', item.customization?.name || item.name)}
                                      >
                                        Export Back for DTF
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.quantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            £{item.price.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            £{(item.price * item.quantity).toFixed(2)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="text-center text-gray-500 py-4">
                          No items found.
                        </td>
                      </tr>
                    )}
                                         {(() => {
                       const voucherInfo = formatVoucherDiscount(order);
                       if (voucherInfo) {
                         return (
                           <>
                             <tr className="bg-purple-50">
                               <td colSpan={7} className="px-6 py-4 text-sm font-medium text-purple-700 text-right">
                                 Discount ({voucherInfo.code})
                               </td>
                               <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-purple-700">
                                 -£{voucherInfo.discountAmount.toFixed(2)}
                               </td>
                             </tr>
                             <tr className="bg-blue-50">
                               <td colSpan={7} className="px-6 py-4 text-sm font-medium text-blue-700 text-right">
                                 Shipping ({order.shippingDetails.shippingMethod})
                               </td>
                               <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-700">
                                 £{order.shippingDetails.shippingCost.toFixed(2)}
                               </td>
                             </tr>
                             <tr className="bg-gray-50">
                               <td colSpan={7} className="px-6 py-4 text-sm font-medium text-gray-900 text-right">
                                 Total
                               </td>
                               <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                 £{order.total.toFixed(2)}
                               </td>
                             </tr>
                           </>
                         );
                       } else {
                         // No voucher - show the actual total from database
                         return (
                           <>
                             <tr className="bg-blue-50">
                               <td colSpan={7} className="px-6 py-4 text-sm font-medium text-blue-700 text-right">
                                 Shipping ({order.shippingDetails.shippingMethod})
                               </td>
                               <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-700">
                                 £{order.shippingDetails.shippingCost.toFixed(2)}
                               </td>
                             </tr>
                             <tr className="bg-gray-50">
                               <td colSpan={7} className="px-6 py-4 text-sm font-medium text-gray-900 text-right">
                                 Total
                               </td>
                               <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                 £{order.total.toFixed(2)}
                               </td>
                             </tr>
                           </>
                         );
                       }
                     })()}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Customer Uploaded Images Section */}
            {order.items.some(item => item.customization?.frontImage || item.customization?.backImage) && (
              <div className="mt-8">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Customer Uploaded Images</h2>
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {order.items.map((item, index) => {
                      if (!item.customization?.frontImage && !item.customization?.backImage) return null;
                      
                      return (
                        <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                          <h3 className="text-md font-semibold text-gray-900 mb-3">
                            {item.name} - {item.size}
                          </h3>
                          
                          <div className="space-y-4">
                            {item.customization?.frontImage && (
                              <div>
                                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                                  <svg className="w-4 h-4 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                  </svg>
                                  Front Image
                                </h4>
                                <div className="relative">
                                  <img 
                                    src={item.customization.frontImage} 
                                    alt="Front design" 
                                    className="w-full h-48 object-contain bg-gray-100 rounded-lg border border-gray-300"
                                    onError={(e) => {
                                      e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik02MCA4MGg4MHY0MEg2MHoiIGZpbGw9IiM5Q0EzQUYiLz4KPHN2ZyB4PSI3MCIgeT0iOTAiIHdpZHRoPSI2MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM2QjcyODAiIHN0cm9rZS13aWR0aD0iMiI+CjxwYXRoIGQ9Ik0xNCAxM2g3djdoLTd6Ii8+CjxwYXRoIGQ9Ik0xMCAxN2gxMHYyaC0xMHoiLz4KPC9zdmc+Cjwvc3ZnPgo=';
                                    }}
                                  />
                                  <div className="absolute top-2 right-2">
                                    <a 
                                      href={item.customization.frontImage} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 transition-colors"
                                    >
                                      View Full Size
                                    </a>
                                  </div>
                                </div>
                                <div className="mt-2 text-xs text-gray-500">
                                  <p><strong>Position:</strong> X: {item.customization.frontPosition?.x || 0}, Y: {item.customization.frontPosition?.y || 0}</p>
                                  <p><strong>Scale:</strong> {item.customization.frontScale || 1}</p>
                                  {item.customization.frontRotation && (
                                    <p><strong>Rotation:</strong> {item.customization.frontRotation}°</p>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            {item.customization?.backImage && (
                              <div>
                                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                                  <svg className="w-4 h-4 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                  </svg>
                                  Back Image
                                </h4>
                                <div className="relative">
                                  <img 
                                    src={item.customization.backImage} 
                                    alt="Back design" 
                                    className="w-full h-48 object-contain bg-gray-100 rounded-lg border border-gray-300"
                                    onError={(e) => {
                                      e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik02MCA4MGg4MHY0MEg2MHoiIGZpbGw9IiM5Q0EzQUYiLz4KPHN2ZyB4PSI3MCIgeT0iOTAiIHdpZHRoPSI2MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM2QjcyODAiIHN0cm9rZS13aWR0aD0iMiI+CjxwYXRoIGQ9Ik0xNCAxM2g3djdoLTd6Ii8+CjxwYXRoIGQ9Ik0xMCAxN2gxMHYyaC0xMHoiLz4KPC9zdmc+Cjwvc3ZnPgo=';
                                    }}
                                  />
                                  <div className="absolute top-2 right-2">
                                    <a 
                                      href={item.customization.backImage} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700 transition-colors"
                                    >
                                      View Full Size
                                    </a>
                                  </div>
                                </div>
                                <div className="mt-2 text-xs text-gray-500">
                                  <p><strong>Position:</strong> X: {item.customization.backPosition?.x || 0}, Y: {item.customization.backPosition?.y || 0}</p>
                                  <p><strong>Scale:</strong> {item.customization.backScale || 1}</p>
                                  {item.customization.backRotation && (
                                    <p><strong>Rotation:</strong> {item.customization.backRotation}°</p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="flex gap-2">
                              {item.customization?.frontImage && (
                                <button
                                  className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 text-xs"
                                  onClick={() => exportOrderItemForDTF(item.customization, 'front', item.name)}
                                >
                                  Export Front for DTF
                                </button>
                              )}
                              {item.customization?.backImage && (
                                <button
                                  className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 text-xs"
                                  onClick={() => exportOrderItemForDTF(item.customization, 'back', item.name)}
                                >
                                  Export Back for DTF
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Refund Section */}
            {order.status === 'cancelled' && (
              <div className="mt-8">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Refund Management</h2>
                <div className="bg-gray-50 rounded-lg p-6">
                  {refundInfo ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-md font-semibold text-gray-900">Refund Status</h3>
                          <p className="text-sm text-gray-600">
                            {refundInfo.transaction.status === 'refunded' || order.metadata?.refundAmount
                              ? 'Refund has been processed' 
                              : 'Refund not yet processed'}
                          </p>
                        </div>
                        {refundInfo.canRefund && !order.metadata?.refundAmount && (
                          <button
                            onClick={() => setRefundModal({
                              isOpen: true,
                              orderReference: order.reference,
                              orderTotal: order.total
                            })}
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
                          >
                            Process Refund
                          </button>
                        )}
                        {(refundInfo.transaction.status === 'refunded' || order.metadata?.refundAmount) && (
                          <div className="flex items-center">
                            <svg className="h-5 w-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm font-medium text-green-700">Refunded</span>
                          </div>
                        )}
                      </div>
                      
                      {(refundInfo.transaction.status === 'refunded' || order.metadata?.refundAmount) && (
                        <div className="bg-green-50 border border-green-200 rounded-md p-4">
                          <h4 className="text-sm font-semibold text-green-800 mb-2">Refund Details</h4>
                          <div className="text-sm text-green-700 space-y-1">
                            <p><strong>Refund ID:</strong> {refundInfo.transaction.refundId || order.metadata?.stripeRefundId || 'N/A'}</p>
                            <p><strong>Amount:</strong> £{Number(refundInfo.transaction.metadata?.refundAmount || order.metadata?.refundAmount || 0).toFixed(2)}</p>
                            <p><strong>Reason:</strong> {refundInfo.transaction.metadata?.refundReason || order.metadata?.refundReason || 'N/A'}</p>
                            {refundInfo.transaction.metadata?.refundNotes || order.metadata?.refundNotes ? (
                              <p><strong>Notes:</strong> {refundInfo.transaction.metadata?.refundNotes || order.metadata?.refundNotes}</p>
                            ) : null}
                            <p><strong>Processed by:</strong> {refundInfo.transaction.metadata?.refundedBy || order.metadata?.refundedBy || 'N/A'}</p>
                            <p><strong>Date:</strong> {(refundInfo.transaction.metadata?.refundedAt || order.metadata?.refundedAt) ? new Date(refundInfo.transaction.metadata?.refundedAt || order.metadata?.refundedAt || '').toLocaleDateString() : 'N/A'}</p>
                          </div>
                        </div>
                      )}
                      
                      {refundInfo.transaction.status !== 'refunded' && !order.metadata?.refundAmount && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                          <h4 className="text-sm font-semibold text-yellow-800 mb-2">Refund Information</h4>
                          <div className="text-sm text-yellow-700 space-y-1">
                            <p><strong>Original Payment:</strong> £{refundInfo.transaction.amount.toFixed(2)}</p>
                            <p><strong>Payment Method:</strong> {refundInfo.transaction.paymentMethod}</p>
                            <p><strong>Payment Intent:</strong> {refundInfo.transaction.paymentIntentId}</p>
                            <p><strong>Order Status:</strong> {refundInfo.order.status}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-500">Loading refund information...</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Refund Modal */}
      <RefundModal
        isOpen={refundModal.isOpen}
        onClose={() => setRefundModal({ isOpen: false, orderReference: '', orderTotal: 0 })}
        onRefund={handleRefund}
        orderReference={refundModal.orderReference}
        orderTotal={refundModal.orderTotal}
        loading={refundLoading}
      />
    </div>
  );
} 