'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Order {
  _id: string;
  reference: string;
  userId: string;
  total: number;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'payment_failed';
  productionStatus: 'not_started' | 'in_production' | 'quality_check' | 'ready_to_ship' | 'completed';
  deliveryPriority: number;
  productionNotes: string;
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
    trackingNumber?: string;
    courier?: string;
    estimatedDelivery?: string;
    shippedAt?: string;
    notes?: string; // Added for shipped orders
  };
  items: Array<{
    name: string;
    quantity: number;
    size: string;
    customization?: {
      isCustomized: boolean;
      name?: string;
      number?: string;
    };
  }>;
}

const COURIERS = [
  { name: 'Royal Mail', value: 'Royal Mail', color: 'bg-red-100 text-red-800' },
  { name: 'Evri', value: 'Evri', color: 'bg-purple-100 text-purple-800' },
  { name: 'DPD', value: 'DPD', color: 'bg-yellow-100 text-yellow-800' },
  { name: 'DHL', value: 'DHL', color: 'bg-orange-100 text-orange-800' },
  { name: 'FedEx', value: 'FedEx', color: 'bg-blue-100 text-blue-800' },
  { name: 'UPS', value: 'UPS', color: 'bg-brown-100 text-brown-800' },
];

export default function ShippingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [shippingForm, setShippingForm] = useState({
    trackingNumber: '',
    courier: 'Royal Mail',
    notes: ''
  });
  const [shippingLoading, setShippingLoading] = useState(false);
  const [scanMode, setScanMode] = useState(false);
  const [view, setView] = useState<'ready' | 'shipped'>('ready');
  const [shippedOrders, setShippedOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const params = new URLSearchParams({
          sortBy: 'priority',
          productionStatus: 'ready_to_ship'
        });
        
        const response = await fetch(`/api/admin/orders?${params}`);
        if (!response.ok) {
          throw new Error('Failed to fetch orders');
        }
        const data = await response.json();
        setOrders(data.orders);
        // Fetch shipped orders
        const shippedRes = await fetch(`/api/admin/orders?status=shipped`);
        if (shippedRes.ok) {
          const shippedData = await shippedRes.json();
          setShippedOrders(shippedData.orders);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch orders');
      } finally {
        setLoading(false);
      }
    };

    if (session?.user) {
      fetchOrders();
    }
  }, [session]);

  const handleShipOrder = async (orderId: string) => {
    setShippingLoading(true);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/ship`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(shippingForm),
      });

      if (!response.ok) {
        throw new Error('Failed to ship order');
      }

      const result = await response.json();
      
      // Update local state: remove from ready, add to shipped
      setOrders(orders.filter(order => order._id !== orderId));
      setShippedOrders(prev => [...prev, result.order]);
      setSelectedOrder(null);
      setShippingForm({
        trackingNumber: '',
        courier: 'Royal Mail',
        notes: ''
      });
      // Show success message
      alert(result.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to ship order');
    } finally {
      setShippingLoading(false);
    }
  };

  const handleBarcodeScan = (barcode: string) => {
    // Try to find order by reference
    const order = orders.find(o => o.reference === barcode);
    if (order) {
      setSelectedOrder(order);
      setShippingForm(prev => ({ ...prev, trackingNumber: '' }));
    } else {
      // If not found by reference, assume it's a tracking number
      setShippingForm(prev => ({ ...prev, trackingNumber: barcode }));
    }
    setScanMode(false);
  };

  const filteredOrders = (view === 'ready' ? orders : shippedOrders).filter(order =>
    order.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.shippingDetails.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.shippingDetails.lastName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPriorityColor = (priority: number) => {
    if (priority >= 100) return 'text-red-600 font-bold';
    if (priority >= 50) return 'text-orange-600 font-semibold';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold text-gray-900">Shipping Station</h1>
            <Link
              href="/admin/orders"
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm font-medium"
            >
              Back to Orders
            </Link>
          </div>
          {/* Tabs for Ready to Ship / Shipped */}
          <div className="flex gap-2 mb-4">
            <button
              className={`px-4 py-2 rounded-md text-sm font-medium border ${view === 'ready' ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-700 border-gray-300'}`}
              onClick={() => setView('ready')}
            >
              Ready to Ship
            </button>
            <button
              className={`px-4 py-2 rounded-md text-sm font-medium border ${view === 'shipped' ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-700 border-gray-300'}`}
              onClick={() => setView('shipped')}
            >
              Shipped
            </button>
            <input
              type="text"
              placeholder="Search orders by reference or customer name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 ml-2"
            />
            <button
              onClick={() => setScanMode(!scanMode)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
            >
              {scanMode ? 'Cancel Scan' : 'Scan Barcode'}
            </button>
          </div>

          {/* Barcode Scanner Placeholder */}
          {scanMode && (
            <div className="bg-white rounded-lg p-4 mb-4 border-2 border-dashed border-gray-300">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">📱 Use your phone's camera to scan barcode</p>
                <p className="text-xs text-gray-500">Or manually enter tracking number below:</p>
                <input
                  type="text"
                  placeholder="Enter tracking number manually..."
                  value={shippingForm.trackingNumber}
                  onChange={(e) => setShippingForm(prev => ({ ...prev, trackingNumber: e.target.value }))}
                  className="mt-2 w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                />
                <button
                  onClick={() => handleBarcodeScan(shippingForm.trackingNumber)}
                  disabled={!shippingForm.trackingNumber}
                  className="mt-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 text-sm"
                >
                  Process
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Shipping Form (only for non-shipped orders) */}
        {selectedOrder && selectedOrder.status !== 'shipped' && (
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Ship Order: {selectedOrder.reference}
            </h2>
            <div className="space-y-4">
              {/* Order Info */}
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm font-medium text-gray-900">
                  {selectedOrder.shippingDetails.firstName} {selectedOrder.shippingDetails.lastName}
                </p>
                <p className="text-xs text-gray-600">
                  {selectedOrder.shippingDetails.shippingMethod} • Priority: {selectedOrder.deliveryPriority}
                </p>
                <p className="text-xs text-gray-600">
                  {selectedOrder.items.map(item => `${item.quantity}x ${item.name}`).join(', ')}
                </p>
              </div>
              {/* Shipping Form */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tracking Number
                </label>
                <input
                  type="text"
                  value={shippingForm.trackingNumber}
                  onChange={(e) => setShippingForm(prev => ({ ...prev, trackingNumber: e.target.value }))}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  placeholder="Enter tracking number..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Courier
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {COURIERS.map(courier => (
                    <button
                      key={courier.value}
                      onClick={() => setShippingForm(prev => ({ ...prev, courier: courier.value }))}
                      className={`p-2 rounded-md text-sm font-medium border ${
                        shippingForm.courier === courier.value
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-300 bg-white hover:bg-gray-50'
                      } ${courier.color}`}
                    >
                      {courier.name}
                    </button>
                  ))}
                </div>
              </div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (optional)
              </label>
              <textarea
                value={shippingForm.notes}
                onChange={(e) => setShippingForm(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                rows={2}
                placeholder="Add any shipping notes..."
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleShipOrder(selectedOrder._id)}
                  disabled={!shippingForm.trackingNumber || shippingLoading}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 font-medium"
                >
                  {shippingLoading ? 'Shipping...' : 'Mark as Shipped'}
                </button>
                <button
                  onClick={() => {
                    setSelectedOrder(null);
                    setShippingForm({
                      trackingNumber: '',
                      courier: 'Royal Mail',
                      notes: ''
                    });
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Orders List */}
        <div className="space-y-3">
          <h3 className="text-lg font-medium text-gray-900">
            {view === 'ready' ? 'Ready to Ship' : 'Shipped'} ({filteredOrders.length})
          </h3>
          
          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-lg p-6 text-center">
              <p className="text-gray-500">No orders {view === 'ready' ? 'ready to ship' : 'shipped'}</p>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div
                key={order._id}
                className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedOrder(order)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">
                    {order.reference}
                  </span>
                  <span className={`text-xs font-medium ${getPriorityColor(order.deliveryPriority)}`}>
                    Priority: {order.deliveryPriority}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-1">
                  {order.shippingDetails.firstName} {order.shippingDetails.lastName}
                </p>
                <p className="text-xs text-gray-500 mb-2">
                  {order.shippingDetails.shippingMethod} • {order.shippingDetails.city}
                </p>
                <div className="text-xs text-gray-600">
                  {order.items.map((item, index) => (
                    <span key={index}>
                      {item.quantity}x {item.name} ({item.size})
                      {index < order.items.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                </div>
                {view === 'shipped' && (
                  <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-800">
                    <div><strong>Tracking:</strong> {order.shippingDetails.trackingNumber || <span className="text-gray-400">N/A</span>}</div>
                    <div><strong>Courier:</strong> {order.shippingDetails.courier || <span className="text-gray-400">N/A</span>}</div>
                    {order.shippingDetails.notes && (
                      <div><strong>Notes:</strong> {order.shippingDetails.notes}</div>
                    )}
                  </div>
                )}
                {view !== 'shipped' && order.productionNotes && (
                  <div className="mt-2 p-2 bg-yellow-50 rounded text-xs text-yellow-800">
                    <strong>Notes:</strong> {order.productionNotes}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
} 