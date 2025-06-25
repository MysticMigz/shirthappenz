'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { generateSupplyOrderPDF } from '@/lib/pdf';
import { FaFilter, FaSearch, FaEye, FaEdit, FaTrash, FaFilePdf } from 'react-icons/fa';

interface Supply {
  _id: string;
  name: string;
  description?: string;
  image?: string;
  price: number;
  unit: string;
  category: string;
  minimumOrderQuantity: number;
  supplier: {
    name: string;
    contactInfo?: string;
    website?: string;
  };
  notes?: string;
}

interface OrderItem {
  supply: Supply;
  quantity: number;
  priceAtOrder: number;
  notes?: string;
}

interface SupplyOrder {
  _id: string;
  reference: string;
  items: OrderItem[];
  status: 'draft' | 'pending' | 'ordered' | 'received' | 'cancelled';
  totalAmount: number;
  orderedBy: string;
  orderedAt?: Date;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export default function SupplyOrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [selectedSupplies, setSelectedSupplies] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<SupplyOrder[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<SupplyOrder | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedOrder, setEditedOrder] = useState<SupplyOrder | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
    search: ''
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }

    fetchSupplies();
    fetchOrders();
  }, [status, router]);

  const fetchSupplies = async () => {
    try {
      const response = await fetch('/api/admin/supplies');
      if (!response.ok) throw new Error('Failed to fetch supplies');
      const data = await response.json();
      setSupplies(data);
    } catch (err) {
      setError('Failed to load supplies');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      let url = '/api/admin/supplies/orders';
      const queryParams = new URLSearchParams();
      
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      
      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch orders');
      
      const data = await response.json();
      setOrders(data);
    } catch (err) {
      setError('Failed to load orders');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addToOrder = (supply: Supply) => {
    setSelectedSupplies(prev => {
      const existing = prev.find(item => item.supply._id === supply._id);
      if (existing) {
        return prev.map(item =>
          item.supply._id === supply._id
            ? { ...item, quantity: item.quantity + supply.minimumOrderQuantity }
            : item
        );
      }
      return [...prev, { supply, quantity: supply.minimumOrderQuantity, priceAtOrder: supply.price }];
    });
  };

  const updateQuantity = (supplyId: string, quantity: number) => {
    setSelectedSupplies(prev =>
      prev.map(item =>
        item.supply._id === supplyId
          ? { ...item, quantity: Math.max(item.supply.minimumOrderQuantity, quantity) }
          : item
      )
    );
  };

  const updateNotes = (supplyId: string, notes: string) => {
    setSelectedSupplies(prev =>
      prev.map(item =>
        item.supply._id === supplyId
          ? { ...item, notes }
          : item
      )
    );
  };

  const removeFromOrder = (supplyId: string) => {
    setSelectedSupplies(prev => prev.filter(item => item.supply._id !== supplyId));
  };

  const calculateTotal = () => {
    return selectedSupplies.reduce((total, item) => total + (item.supply.price * item.quantity), 0);
  };

  const handleCreateOrder = async () => {
    try {
      const orderData = {
        items: selectedSupplies.map(item => ({
          supply: item.supply._id,
          quantity: item.quantity,
          priceAtOrder: item.supply.price,
          notes: item.notes
        })),
        totalAmount: calculateTotal(),
        status: 'draft'
      };

      const response = await fetch('/api/admin/supplies/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) throw new Error('Failed to create order');

      // Clear the selected supplies after successful order creation
      setSelectedSupplies([]);
      
      // Show success message or redirect to orders list
      router.push('/admin/supplies/orders/list');
    } catch (err) {
      setError('Failed to create order');
      console.error(err);
    }
  };

  const exportToPDF = (order: SupplyOrder) => {
    try {
      console.log('Starting PDF export for order:', order.reference);
      const doc = generateSupplyOrderPDF(order);
      doc.save(`supply-order-${order.reference}.pdf`);
      // Show success message
      setError(null);
    } catch (err) {
      console.error('Error exporting to PDF:', err);
      setError(`Failed to generate PDF: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: SupplyOrder['status']) => {
    try {
      const response = await fetch(`/api/admin/supplies/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update order status');
      
      await fetchOrders();
      setSelectedOrder(null);
    } catch (err) {
      setError('Failed to update order status');
      console.error(err);
    }
  };

  const updateOrderQuantity = async (orderId: string, itemIndex: number, newQuantity: number) => {
    try {
      if (!editedOrder) return;
      
      const updatedItems = [...editedOrder.items];
      updatedItems[itemIndex] = {
        ...updatedItems[itemIndex],
        quantity: newQuantity
      };

      const totalAmount = updatedItems.reduce((total, item) => 
        total + (item.quantity * item.priceAtOrder), 0
      );

      setEditedOrder({
        ...editedOrder,
        items: updatedItems,
        totalAmount
      });
    } catch (err) {
      setError('Failed to update quantity');
      console.error(err);
    }
  };

  const updateOrderNotes = async (orderId: string, itemIndex: number, newNotes: string) => {
    try {
      if (!editedOrder) return;
      
      const updatedItems = [...editedOrder.items];
      updatedItems[itemIndex] = {
        ...updatedItems[itemIndex],
        notes: newNotes
      };

      setEditedOrder({
        ...editedOrder,
        items: updatedItems
      });
    } catch (err) {
      setError('Failed to update notes');
      console.error(err);
    }
  };

  const saveOrderChanges = async () => {
    try {
      if (!editedOrder) return;

      const response = await fetch(`/api/admin/supplies/orders/${editedOrder._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: editedOrder.items,
          notes: editedOrder.notes,
          totalAmount: editedOrder.totalAmount
        }),
      });

      if (!response.ok) throw new Error('Failed to save order changes');

      await fetchOrders();
      setEditedOrder(null);
      setIsEditMode(false);
      setSelectedOrder(null);
    } catch (err) {
      setError('Failed to save order changes');
      console.error(err);
    }
  };

  const deleteOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to delete this order?')) return;

    try {
      const response = await fetch(`/api/admin/supplies/orders/${orderId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete order');

      await fetchOrders();
      setSelectedOrder(null);
    } catch (err) {
      setError('Failed to delete order');
      console.error(err);
    }
  };

  const getStatusColor = (status: SupplyOrder['status']) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'ordered':
        return 'bg-blue-100 text-blue-800';
      case 'received':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Supply Orders</h1>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 flex items-center"
        >
          <FaFilter className="mr-2" /> Filters
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {showFilters && (
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
              >
                <option value="">All</option>
                <option value="draft">Draft</option>
                <option value="pending">Pending</option>
                <option value="ordered">Ordered</option>
                <option value="received">Received</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchOrders}
                className="w-full bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 flex items-center justify-center"
              >
                <FaSearch className="mr-2" /> Search
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reference
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created At
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map((order) => (
              <tr key={order._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{order.reference}</div>
                  <div className="text-sm text-gray-500">{order.orderedBy}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">£{order.totalAmount.toFixed(2)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{formatDate(order.createdAt)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setSelectedOrder(order);
                        setEditedOrder(null);
                        setIsEditMode(false);
                      }}
                      className="text-purple-600 hover:text-purple-900"
                      title="View Order"
                    >
                      <FaEye className="w-5 h-5" />
                    </button>
                    {order.status !== 'cancelled' && order.status !== 'received' && (
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setEditedOrder(order);
                          setIsEditMode(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit Order"
                      >
                        <FaEdit className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => exportToPDF(order)}
                      className="text-green-600 hover:text-green-900"
                      title="Export to PDF"
                    >
                      <FaFilePdf className="w-5 h-5" />
                    </button>
                    {order.status === 'draft' && (
                      <button
                        onClick={() => deleteOrder(order._id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Order"
                      >
                        <FaTrash className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {isEditMode ? 'Edit Order' : 'Order Details'} - {selectedOrder.reference}
              </h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => exportToPDF(selectedOrder)}
                  className="text-green-600 hover:text-green-900 p-2"
                  title="Export to PDF"
                >
                  <FaFilePdf className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    setSelectedOrder(null);
                    setEditedOrder(null);
                    setIsEditMode(false);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <div className="flex items-center mt-1">
                  <span className={`px-2 py-1 text-sm font-semibold rounded-full ${getStatusColor(selectedOrder.status)}`}>
                    {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                  </span>
                  {!isEditMode && selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'received' && (
                    <select
                      value={selectedOrder.status}
                      onChange={(e) => updateOrderStatus(selectedOrder._id, e.target.value as SupplyOrder['status'])}
                      className="ml-2 rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                    >
                      <option value="draft">Draft</option>
                      <option value="pending">Mark as Pending</option>
                      <option value="ordered">Mark as Ordered</option>
                      <option value="received">Mark as Received</option>
                      <option value="cancelled">Cancel Order</option>
                    </select>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-lg font-semibold">
                  £{(isEditMode && editedOrder ? editedOrder.totalAmount : selectedOrder.totalAmount).toFixed(2)}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Order Items</h3>
              {(isEditMode && editedOrder ? editedOrder.items : selectedOrder.items).map((item, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{item.supply.name}</h4>
                      <p className="text-sm text-gray-600">
                        £{item.priceAtOrder} per {item.supply.unit}
                      </p>
                    </div>
                    <div className="text-right">
                      {isEditMode ? (
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateOrderQuantity(selectedOrder._id, index, parseInt(e.target.value))}
                          min={1}
                          className="w-20 rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                        />
                      ) : (
                        <p className="font-semibold">
                          {item.quantity} {item.supply.unit}
                        </p>
                      )}
                      <p className="text-sm text-gray-600">
                        Subtotal: £{(item.quantity * item.priceAtOrder).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  {isEditMode ? (
                    <div className="mt-2">
                      <input
                        type="text"
                        value={item.notes || ''}
                        onChange={(e) => updateOrderNotes(selectedOrder._id, index, e.target.value)}
                        placeholder="Add notes..."
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                      />
                    </div>
                  ) : item.notes && (
                    <p className="mt-2 text-sm text-gray-600">
                      Notes: {item.notes}
                    </p>
                  )}
                </div>
              ))}

              {selectedOrder.notes && !isEditMode && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold mb-2">Order Notes</h3>
                  <p className="text-gray-600">{selectedOrder.notes}</p>
                </div>
              )}

              {isEditMode && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold mb-2">Order Notes</h3>
                  <textarea
                    value={editedOrder?.notes || ''}
                    onChange={(e) => setEditedOrder(prev => prev ? { ...prev, notes: e.target.value } : null)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                    rows={3}
                    placeholder="Add general notes for the order..."
                  />
                </div>
              )}

              {isEditMode && (
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setIsEditMode(false);
                      setEditedOrder(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveOrderChanges}
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                  >
                    Save Changes
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 