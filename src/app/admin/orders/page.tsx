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
  productionStartDate: string | null;
  productionCompletedDate: string | null;
  cancellationRequested: boolean;
  cancellationReason?: string;
  cancellationRequestedAt?: string;
  cancellationRequestedBy?: 'customer' | 'admin';
  cancellationNotes?: string;
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
    addressLine2?: string;
    city: string;
    county: string;
    postcode: string;
    country: string;
    shippingMethod: string;
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

const STATUS_PRIORITY = {
  payment_failed: 1,
  pending: 2,
  paid: 3,
  shipped: 4,
  delivered: 5,
  cancelled: 6,
};

const PRODUCTION_PRIORITY = {
  not_started: 1,
  in_production: 2,
  quality_check: 3,
  ready_to_ship: 4,
  completed: 5,
};

const STATUS_COLORS = {
  payment_failed: 'bg-red-100 text-red-800',
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

const PRODUCTION_COLORS = {
  not_started: 'bg-gray-100 text-gray-800',
  in_production: 'bg-blue-100 text-blue-800',
  quality_check: 'bg-yellow-100 text-yellow-800',
  ready_to_ship: 'bg-green-100 text-green-800',
  completed: 'bg-purple-100 text-purple-800',
};

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

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

const STATUS_ACTIONS: Record<Order['status'], Array<Order['status']>> = {
  payment_failed: ['pending', 'cancelled'],
  pending: ['paid', 'cancelled'],
  paid: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: ['pending'],
};

const PRODUCTION_ACTIONS: Record<Order['productionStatus'], Array<Order['productionStatus']>> = {
  not_started: ['in_production'],
  in_production: ['quality_check'],
  quality_check: ['ready_to_ship', 'in_production'],
  ready_to_ship: ['completed'],
  completed: [],
};

export default function AdminOrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedProductionStatus, setSelectedProductionStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'priority' | 'production' | 'date'>('priority');
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesText, setNotesText] = useState('');
  
  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [referenceFilter, setReferenceFilter] = useState('');
  const [customerNameFilter, setCustomerNameFilter] = useState('');
  const [emailFilter, setEmailFilter] = useState('');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  const [totalMinFilter, setTotalMinFilter] = useState('');
  const [totalMaxFilter, setTotalMaxFilter] = useState('');
  const [priorityMinFilter, setPriorityMinFilter] = useState('');
  const [priorityMaxFilter, setPriorityMaxFilter] = useState('');
  const [shippingMethodFilter, setShippingMethodFilter] = useState('all');
  const [hasVoucherFilter, setHasVoucherFilter] = useState('all');
  const [hasCustomizationFilter, setHasCustomizationFilter] = useState('all');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const params = new URLSearchParams({
          sortBy,
          ...(selectedStatus !== 'all' && { status: selectedStatus }),
          ...(selectedProductionStatus !== 'all' && { productionStatus: selectedProductionStatus }),
          ...(referenceFilter && { reference: referenceFilter }),
          ...(customerNameFilter && { customerName: customerNameFilter }),
          ...(emailFilter && { email: emailFilter }),
          ...(dateFromFilter && { dateFrom: dateFromFilter }),
          ...(dateToFilter && { dateTo: dateToFilter }),
          ...(totalMinFilter && { totalMin: totalMinFilter }),
          ...(totalMaxFilter && { totalMax: totalMaxFilter }),
          ...(priorityMinFilter && { priorityMin: priorityMinFilter }),
          ...(priorityMaxFilter && { priorityMax: priorityMaxFilter }),
          ...(shippingMethodFilter !== 'all' && { shippingMethod: shippingMethodFilter }),
          ...(hasVoucherFilter !== 'all' && { hasVoucher: hasVoucherFilter }),
          ...(hasCustomizationFilter !== 'all' && { hasCustomization: hasCustomizationFilter }),
        });
        
        const response = await fetch(`/api/admin/orders?${params}`);
        if (!response.ok) {
          throw new Error('Failed to fetch orders');
        }
        const data = await response.json();
        setOrders(data.orders);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch orders');
      } finally {
        setLoading(false);
      }
    };

    if (session?.user) {
      fetchOrders();
    }
  }, [
    session, 
    sortBy, 
    selectedStatus, 
    selectedProductionStatus,
    referenceFilter,
    customerNameFilter,
    emailFilter,
    dateFromFilter,
    dateToFilter,
    totalMinFilter,
    totalMaxFilter,
    priorityMinFilter,
    priorityMaxFilter,
    shippingMethodFilter,
    hasVoucherFilter,
    hasCustomizationFilter
  ]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update order status');
      }

      // Update local state
      setOrders(orders.map(order => 
        order._id === orderId ? { ...order, status: newStatus as Order['status'] } : order
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update order status');
    }
  };

  const handleProductionStatusChange = async (orderId: string, newProductionStatus: string) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productionStatus: newProductionStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update production status');
      }

      // Update local state
      setOrders(orders.map(order => 
        order._id === orderId ? { ...order, productionStatus: newProductionStatus as Order['productionStatus'] } : order
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update production status');
    }
  };

  const handleNotesUpdate = async (orderId: string) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productionNotes: notesText }),
      });

      if (!response.ok) {
        throw new Error('Failed to update production notes');
      }

      // Update local state
      setOrders(orders.map(order => 
        order._id === orderId ? { ...order, productionNotes: notesText } : order
      ));
      setEditingNotes(null);
      setNotesText('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update production notes');
    }
  };

  const getStatusBadgeClass = (status: string, type: 'status' | 'production' = 'status') => {
    const colors = type === 'production' ? PRODUCTION_COLORS : STATUS_COLORS;
    return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status as keyof typeof colors]}`;
  };

  const getNextActions = (currentStatus: Order['status']): Array<Order['status']> => {
    return STATUS_ACTIONS[currentStatus] || [];
  };

  const getNextProductionActions = (currentProductionStatus: Order['productionStatus']): Array<Order['productionStatus']> => {
    return PRODUCTION_ACTIONS[currentProductionStatus] || [];
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 100) return 'text-red-600 font-bold';
    if (priority >= 50) return 'text-orange-600 font-semibold';
    return 'text-gray-600';
  };

  const clearAllFilters = () => {
    setReferenceFilter('');
    setCustomerNameFilter('');
    setEmailFilter('');
    setDateFromFilter('');
    setDateToFilter('');
    setTotalMinFilter('');
    setTotalMaxFilter('');
    setPriorityMinFilter('');
    setPriorityMaxFilter('');
    setShippingMethodFilter('all');
    setHasVoucherFilter('all');
    setHasCustomizationFilter('all');
  };

  const hasActiveFilters = () => {
    return referenceFilter || 
           customerNameFilter || 
           emailFilter || 
           dateFromFilter || 
           dateToFilter || 
           totalMinFilter || 
           totalMaxFilter || 
           priorityMinFilter || 
           priorityMaxFilter || 
           shippingMethodFilter !== 'all' || 
           hasVoucherFilter !== 'all' || 
           hasCustomizationFilter !== 'all';
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
          <h1 className="text-2xl font-semibold text-gray-900">Production & Orders Management</h1>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'priority' | 'production' | 'date')}
              className="rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
            >
              <option value="priority">Sort by Delivery Priority</option>
              <option value="production">Sort by Production Status</option>
              <option value="date">Sort by Date</option>
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
            >
              <option value="all">All Order Statuses</option>
              <option value="payment_failed">Payment Failed</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={selectedProductionStatus}
              onChange={(e) => setSelectedProductionStatus(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
            >
              <option value="all">All Production Statuses</option>
              <option value="not_started">Not Started</option>
              <option value="in_production">In Production</option>
              <option value="quality_check">Quality Check</option>
              <option value="ready_to_ship">Ready to Ship</option>
              <option value="completed">Completed</option>
            </select>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                showFilters 
                  ? 'bg-purple-600 text-white hover:bg-purple-700' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mb-6 bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">Advanced Filters</h2>
              {hasActiveFilters() && (
                <button
                  onClick={clearAllFilters}
                  className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                >
                  Clear All Filters
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {/* Reference Number Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reference Number</label>
                <input
                  type="text"
                  value={referenceFilter}
                  onChange={(e) => setReferenceFilter(e.target.value)}
                  placeholder="e.g., SH-241201-0001"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm"
                />
              </div>

              {/* Customer Name Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                <input
                  type="text"
                  value={customerNameFilter}
                  onChange={(e) => setCustomerNameFilter(e.target.value)}
                  placeholder="First or last name"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm"
                />
              </div>

              {/* Email Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={emailFilter}
                  onChange={(e) => setEmailFilter(e.target.value)}
                  placeholder="customer@example.com"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm"
                />
              </div>

              {/* Date Range Filters */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
                <input
                  type="date"
                  value={dateFromFilter}
                  onChange={(e) => setDateFromFilter(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
                <input
                  type="date"
                  value={dateToFilter}
                  onChange={(e) => setDateToFilter(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm"
                />
              </div>

              {/* Total Range Filters */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Min (£)</label>
                <input
                  type="number"
                  value={totalMinFilter}
                  onChange={(e) => setTotalMinFilter(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Max (£)</label>
                <input
                  type="number"
                  value={totalMaxFilter}
                  onChange={(e) => setTotalMaxFilter(e.target.value)}
                  placeholder="1000.00"
                  step="0.01"
                  min="0"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm"
                />
              </div>

              {/* Priority Range Filters */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority Min</label>
                <input
                  type="number"
                  value={priorityMinFilter}
                  onChange={(e) => setPriorityMinFilter(e.target.value)}
                  placeholder="0"
                  min="0"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority Max</label>
                <input
                  type="number"
                  value={priorityMaxFilter}
                  onChange={(e) => setPriorityMaxFilter(e.target.value)}
                  placeholder="200"
                  min="0"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm"
                />
              </div>

              {/* Shipping Method Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Method</label>
                <select
                  value={shippingMethodFilter}
                  onChange={(e) => setShippingMethodFilter(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm"
                >
                  <option value="all">All Methods</option>
                  <option value="Standard Delivery">Standard Delivery</option>
                  <option value="Express Delivery">Express Delivery</option>
                  <option value="Next Day Delivery">Next Day Delivery</option>
                </select>
              </div>

              {/* Voucher Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Voucher Used</label>
                <select
                  value={hasVoucherFilter}
                  onChange={(e) => setHasVoucherFilter(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm"
                >
                  <option value="all">All Orders</option>
                  <option value="yes">With Voucher</option>
                  <option value="no">Without Voucher</option>
                </select>
              </div>

              {/* Customization Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customization</label>
                <select
                  value={hasCustomizationFilter}
                  onChange={(e) => setHasCustomizationFilter(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm"
                >
                  <option value="all">All Orders</option>
                  <option value="yes">With Customization</option>
                  <option value="no">Without Customization</option>
                </select>
              </div>
            </div>

            {/* Active Filters Summary */}
            {hasActiveFilters() && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Active Filters:</h3>
                <div className="flex flex-wrap gap-2">
                  {referenceFilter && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                      Reference: {referenceFilter}
                    </span>
                  )}
                  {customerNameFilter && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                      Customer: {customerNameFilter}
                    </span>
                  )}
                  {emailFilter && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                      Email: {emailFilter}
                    </span>
                  )}
                  {dateFromFilter && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                      From: {dateFromFilter}
                    </span>
                  )}
                  {dateToFilter && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                      To: {dateToFilter}
                    </span>
                  )}
                  {totalMinFilter && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                      Min Total: £{totalMinFilter}
                    </span>
                  )}
                  {totalMaxFilter && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                      Max Total: £{totalMaxFilter}
                    </span>
                  )}
                  {priorityMinFilter && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                      Min Priority: {priorityMinFilter}
                    </span>
                  )}
                  {priorityMaxFilter && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                      Max Priority: {priorityMaxFilter}
                    </span>
                  )}
                  {shippingMethodFilter !== 'all' && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                      Shipping: {shippingMethodFilter}
                    </span>
                  )}
                  {hasVoucherFilter !== 'all' && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                      Voucher: {hasVoucherFilter === 'yes' ? 'Yes' : 'No'}
                    </span>
                  )}
                  {hasCustomizationFilter !== 'all' && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                      Customization: {hasCustomizationFilter === 'yes' ? 'Yes' : 'No'}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reference
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer & Delivery
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total & Discount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Production Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`text-sm ${getPriorityColor(order.deliveryPriority)}`}>
                        {order.deliveryPriority}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order.reference}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateTime(order.createdAt)}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      <div>
                        <div className="font-medium">{order.shippingDetails.firstName} {order.shippingDetails.lastName}</div>
                        <div className="text-xs text-gray-400">{order.shippingDetails.shippingMethod}</div>
                        <div className="text-xs text-gray-400">{order.shippingDetails.address}</div>
                        {order.shippingDetails.addressLine2 && (
                          <div className="text-xs text-gray-400">{order.shippingDetails.addressLine2}</div>
                        )}
                        <div className="text-xs text-gray-400">{order.shippingDetails.city}, {order.shippingDetails.county}</div>
                        <div className="text-xs text-gray-400">{order.shippingDetails.postcode}</div>
                        <div className="text-xs text-gray-400">{order.shippingDetails.country}</div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      <div className="space-y-1">
                        {order.items.map((item, index) => (
                          <div key={index} className="text-xs">
                            {item.quantity}x {item.name} ({item.size})
                            {item.customization?.isCustomized && (
                              <span className="ml-1 text-purple-600">• Custom</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      <div className="space-y-1">
                        {(() => {
                          const voucherInfo = formatVoucherDiscount(order);
                          if (voucherInfo) {
                            return (
                              <div className="space-y-1">
                                <div className="text-xs text-gray-400 line-through">
                                  £{voucherInfo.originalTotal.toFixed(2)}
                                </div>
                                <div className="text-sm font-medium text-green-600">
                                  £{voucherInfo.finalTotal.toFixed(2)}
                                </div>
                                <div className="text-xs text-purple-600 font-medium">
                                  {voucherInfo.code} - {voucherInfo.discountText}
                                </div>
                                <div className="text-xs text-green-600">
                                  -£{voucherInfo.discountAmount.toFixed(2)} saved
                                </div>
                              </div>
                            );
                          } else {
                            return (
                              <div className="text-sm font-medium">
                                £{order.total.toFixed(2)}
                              </div>
                            );
                          }
                        })()}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {order.metadata?.refundAmount ? (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                          REFUNDED
                        </span>
                      ) : (
                        <span className={getStatusBadgeClass(order.status, 'status')}>
                          {order.status.replace('_', ' ').toUpperCase()}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={getStatusBadgeClass(order.productionStatus, 'production')}>
                        {order.productionStatus.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="space-y-2">
                        {/* Production Status Actions */}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Production:</label>
                          <div className="flex flex-wrap gap-1">
                            {getNextProductionActions(order.productionStatus).map((nextStatus) => (
                              <button
                                key={nextStatus}
                                onClick={() => handleProductionStatusChange(order._id, nextStatus)}
                                className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200"
                              >
                                {nextStatus.replace('_', ' ')}
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        {/* Order Status Actions */}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Order:</label>
                          {order.metadata?.refundAmount ? (
                            <div className="text-xs text-gray-500 italic">
                              Order has been refunded - status cannot be changed
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {getNextActions(order.status).map((nextStatus) => (
                                <button
                                  key={nextStatus}
                                  onClick={() => handleStatusChange(order._id, nextStatus)}
                                  className={`px-2 py-1 rounded text-xs font-medium ${
                                    nextStatus === 'cancelled'
                                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                                  }`}
                                >
                                  {nextStatus.charAt(0).toUpperCase() + nextStatus.slice(1)}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Cancellation Information */}
                        {order.cancellationRequested && (
                          <div className="bg-red-50 border border-red-200 rounded p-2">
                            <label className="block text-xs font-medium text-red-700 mb-1">Cancellation:</label>
                            <div className="text-xs text-red-600 space-y-1">
                              <p><strong>Reason:</strong> {order.cancellationReason}</p>
                              <p><strong>Requested by:</strong> {order.cancellationRequestedBy}</p>
                              <p><strong>Date:</strong> {order.cancellationRequestedAt ? new Date(order.cancellationRequestedAt).toLocaleDateString() : 'N/A'}</p>
                              {order.cancellationNotes && (
                                <p><strong>Notes:</strong> {order.cancellationNotes}</p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Refund Information */}
                        {order.metadata?.refundAmount && (
                          <div className="bg-green-50 border border-green-200 rounded p-2">
                            <label className="block text-xs font-medium text-green-700 mb-1">Refund:</label>
                            <div className="text-xs text-green-600 space-y-1">
                              <p><strong>Amount:</strong> £{order.metadata.refundAmount.toFixed(2)}</p>
                              <p><strong>Reason:</strong> {order.metadata.refundReason || 'Order cancellation'}</p>
                              {order.metadata.refundNotes && (
                                <p><strong>Notes:</strong> {order.metadata.refundNotes}</p>
                              )}
                              <p><strong>Processed by:</strong> {order.metadata.refundedBy || 'N/A'}</p>
                              <p><strong>Date:</strong> {order.metadata.refundedAt ? new Date(order.metadata.refundedAt).toLocaleDateString() : 'N/A'}</p>
                              {order.metadata.stripeRefundId && (
                                <p><strong>Stripe ID:</strong> {order.metadata.stripeRefundId}</p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Production Notes */}
                        <div>
                          {editingNotes === order._id ? (
                            <div className="space-y-1">
                              <textarea
                                value={notesText}
                                onChange={(e) => setNotesText(e.target.value)}
                                className="w-full text-xs border rounded p-1"
                                rows={2}
                                placeholder="Add production notes..."
                              />
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleNotesUpdate(order._id)}
                                  className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingNotes(null);
                                    setNotesText('');
                                  }}
                                  className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingNotes(order._id);
                                setNotesText(order.productionNotes || '');
                              }}
                              className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                            >
                              {order.productionNotes ? 'Edit Notes' : 'Add Notes'}
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      <Link
                        href={`/admin/orders/${order._id}`}
                        className="text-purple-600 hover:text-purple-900"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Priority Guide */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Delivery Priority Guide</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-red-600 font-bold">100+</span>
                <span className="text-sm text-gray-600">Next Day Delivery - Highest Priority</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-orange-600 font-semibold">50-99</span>
                <span className="text-sm text-gray-600">Express Delivery - High Priority</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">10-49</span>
                <span className="text-sm text-gray-600">Standard Delivery - Normal Priority</span>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                * Priority increases by 5 points per day since order placement
              </div>
            </div>
          </div>

          {/* Production Status Guide */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Production Status Guide</h2>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className={getStatusBadgeClass('not_started', 'production')}>NOT STARTED</span>
                <span className="ml-2 text-sm text-gray-600">Ready for production</span>
              </div>
              <div className="flex items-center">
                <span className={getStatusBadgeClass('in_production', 'production')}>IN PRODUCTION</span>
                <span className="ml-2 text-sm text-gray-600">Currently being made</span>
              </div>
              <div className="flex items-center">
                <span className={getStatusBadgeClass('quality_check', 'production')}>QUALITY CHECK</span>
                <span className="ml-2 text-sm text-gray-600">Final inspection</span>
              </div>
              <div className="flex items-center">
                <span className={getStatusBadgeClass('ready_to_ship', 'production')}>READY TO SHIP</span>
                <span className="ml-2 text-sm text-gray-600">Packaged and ready</span>
              </div>
              <div className="flex items-center">
                <span className={getStatusBadgeClass('completed', 'production')}>COMPLETED</span>
                <span className="ml-2 text-sm text-gray-600">Production finished</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 