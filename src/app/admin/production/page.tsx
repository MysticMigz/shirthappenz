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

interface ProductionBatch {
  id: string;
  name: string;
  orders: Order[];
  maxOrders: number;
  createdAt: string;
}

const PRODUCTION_STATUSES = [
  'not_started',
  'in_production', 
  'quality_check',
  'ready_to_ship',
  'completed'
] as const;

const PRODUCTION_COLORS = {
  not_started: 'bg-gray-100 text-gray-800 border-gray-300',
  in_production: 'bg-blue-100 text-blue-800 border-blue-300',
  quality_check: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  ready_to_ship: 'bg-green-100 text-green-800 border-green-300',
  completed: 'bg-purple-100 text-purple-800 border-purple-300',
};

const PRODUCTION_ACTIONS: Record<Order['productionStatus'], Array<Order['productionStatus']>> = {
  not_started: ['in_production'],
  in_production: ['quality_check'],
  quality_check: ['ready_to_ship', 'in_production'],
  ready_to_ship: ['completed'],
  completed: [],
};

// Calculate if an order is overdue (more than 7 days old for standard delivery, 3 days for express)
const isOrderOverdue = (order: Order): boolean => {
  const orderDate = new Date(order.createdAt);
  const now = new Date();
  const daysSinceOrder = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (order.shippingDetails.shippingMethod.toLowerCase().includes('express')) {
    return daysSinceOrder > 3;
  }
  return daysSinceOrder > 7;
};

// Calculate due date for an order
const getDueDate = (order: Order): Date => {
  const orderDate = new Date(order.createdAt);
  const dueDate = new Date(orderDate);
  
  if (order.shippingDetails.shippingMethod.toLowerCase().includes('express')) {
    dueDate.setDate(dueDate.getDate() + 3); // Express: 3 days
  } else {
    dueDate.setDate(dueDate.getDate() + 7); // Standard: 7 days
  }
  
  return dueDate;
};

// Calculate days until due
const getDaysUntilDue = (order: Order): number => {
  const dueDate = getDueDate(order);
  const now = new Date();
  const timeDiff = dueDate.getTime() - now.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  return daysDiff;
};

// Get due date color based on urgency
const getDueDateColor = (order: Order): string => {
  if (isOrderOverdue(order)) return 'text-red-600 font-bold';
  
  const daysUntilDue = getDaysUntilDue(order);
  
  if (daysUntilDue <= 1) return 'text-red-600 font-bold';
  if (daysUntilDue <= 3) return 'text-orange-600 font-semibold';
  if (daysUntilDue <= 5) return 'text-gray-800 font-medium';
  return 'text-gray-600';
};

// Format due date for display
const formatDueDate = (order: Order): string => {
  const dueDate = getDueDate(order);
  return dueDate.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

// Calculate estimated production start date
const getEstimatedProductionStart = (order: Order): Date => {
  const orderDate = new Date(order.createdAt);
  const productionStart = new Date(orderDate);
  
  // Add 1-2 days for order processing before production starts
  productionStart.setDate(productionStart.getDate() + 1);
  
  return productionStart;
};

// Calculate estimated production completion date
const getEstimatedProductionCompletion = (order: Order): Date => {
  const productionStart = getEstimatedProductionStart(order);
  const completionDate = new Date(productionStart);
  
  // Standard production time: 2-3 days
  completionDate.setDate(completionDate.getDate() + 2);
  
  return completionDate;
};

// Generate production schedule for a specific date
const generateProductionSchedule = (orders: Order[], targetDate: string): Order[] => {
  const target = new Date(targetDate);
  const schedule = orders.filter(order => {
    const productionStart = getEstimatedProductionStart(order);
    const productionEnd = getEstimatedProductionCompletion(order);
    
    // Check if the target date falls within the production period
    return target >= productionStart && target <= productionEnd;
  });
  
  return schedule.sort((a, b) => {
    const priorityA = calculateOverduePriority(a);
    const priorityB = calculateOverduePriority(b);
    return priorityB - priorityA;
  });
};

// Get next 7 days for schedule view
const getNextWeekDates = (): string[] => {
  const dates = [];
  const today = new Date();
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
  }
  
  return dates;
};

// Format date for display
const formatScheduleDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
};

// Calculate priority boost for overdue orders
const calculateOverduePriority = (order: Order): number => {
  if (!isOrderOverdue(order)) return order.deliveryPriority;
  
  const orderDate = new Date(order.createdAt);
  const now = new Date();
  const daysOverdue = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Boost priority by 50 points per day overdue
  return Math.max(order.deliveryPriority + (daysOverdue * 50), 150);
};

// Generate daily production batch
const generateDailyBatch = (orders: Order[], maxOrders: number = 50): ProductionBatch => {
  const eligibleOrders = orders.filter(order => 
    order.productionStatus === 'not_started' && 
    order.status === 'paid'
  );
  
  // Sort by priority (including overdue boost)
  const sortedOrders = eligibleOrders.sort((a, b) => {
    const priorityA = calculateOverduePriority(a);
    const priorityB = calculateOverduePriority(b);
    return priorityB - priorityA;
  });
  
  return {
    id: `batch-${Date.now()}`,
    name: `Daily Production - ${new Date().toLocaleDateString()}`,
    orders: sortedOrders.slice(0, maxOrders),
    maxOrders,
    createdAt: new Date().toISOString(),
  };
};

export default function ProductionDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesText, setNotesText] = useState('');
  const [dailyBatch, setDailyBatch] = useState<ProductionBatch | null>(null);
  const [batchSize, setBatchSize] = useState<number>(50);
  const [overdueOrders, setOverdueOrders] = useState<Order[]>([]);
  const [showOverdueAlert, setShowOverdueAlert] = useState(false);
  const [viewMode, setViewMode] = useState<'current' | 'schedule'>('current');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const params = new URLSearchParams({
          sortBy: 'production',
          ...(selectedStatus !== 'all' && { productionStatus: selectedStatus }),
        });
        
        const response = await fetch(`/api/admin/orders?${params}`);
        if (!response.ok) {
          throw new Error('Failed to fetch orders');
        }
        const data = await response.json();
        setOrders(data.orders);
        
        // Check for overdue orders
        const overdue = data.orders.filter(isOrderOverdue);
        setOverdueOrders(overdue);
        setShowOverdueAlert(overdue.length > 0);
        
        // Generate daily batch
        const batch = generateDailyBatch(data.orders, batchSize);
        setDailyBatch(batch);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch orders');
      } finally {
        setLoading(false);
      }
    };

    if (session?.user) {
      fetchOrders();
    }
  }, [session, selectedStatus, batchSize]);

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

  const handleBatchSizeChange = (newSize: number) => {
    setBatchSize(newSize);
    const newBatch = generateDailyBatch(orders, newSize);
    setDailyBatch(newBatch);
  };

  const handlePriorityUpdate = async (orderId: string, newPriority: number) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ deliveryPriority: newPriority }),
      });

      if (!response.ok) {
        throw new Error('Failed to update priority');
      }

      // Update local state
      setOrders(orders.map(order => 
        order._id === orderId ? { ...order, deliveryPriority: newPriority } : order
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update priority');
    }
  };

  const getStatusBadgeClass = (status: string) => {
    return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${PRODUCTION_COLORS[status as keyof typeof PRODUCTION_COLORS]}`;
  };

  const getNextProductionActions = (currentProductionStatus: Order['productionStatus']): Array<Order['productionStatus']> => {
    return PRODUCTION_ACTIONS[currentProductionStatus] || [];
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 150) return 'text-red-600 font-bold';
    if (priority >= 100) return 'text-red-600 font-bold';
    if (priority >= 50) return 'text-orange-600 font-semibold';
    return 'text-gray-600';
  };

  const getOrdersByStatus = (status: Order['productionStatus']) => {
    return orders.filter(order => order.productionStatus === status);
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
        {/* Overdue Orders Alert */}
        {showOverdueAlert && overdueOrders.length > 0 && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Overdue Orders Alert
                </h3>
                <p className="text-sm text-red-700 mt-1">
                  {overdueOrders.length} order(s) are overdue and have been automatically boosted to highest priority.
                </p>
              </div>
              <div className="ml-auto">
                <button
                  onClick={() => setShowOverdueAlert(false)}
                  className="text-red-400 hover:text-red-600"
                >
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6 flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Production Dashboard</h1>
            <p className="text-sm text-gray-600 mt-1">Manage production workflow and prioritize orders by delivery type</p>
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            {/* View Mode Toggle */}
            <div className="flex rounded-md shadow-sm">
              <button
                onClick={() => setViewMode('current')}
                className={`px-4 py-2 text-sm font-medium rounded-l-md border ${
                  viewMode === 'current'
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Current
              </button>
              <button
                onClick={() => setViewMode('schedule')}
                className={`px-4 py-2 text-sm font-medium rounded-r-md border-t border-r border-b ${
                  viewMode === 'schedule'
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Schedule
              </button>
            </div>
            
            {viewMode === 'current' && (
              <>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                >
                  <option value="all">All Production Statuses</option>
                  {PRODUCTION_STATUSES.map(status => (
                    <option key={status} value={status}>
                      {status.replace('_', ' ').toUpperCase()}
                    </option>
                  ))}
                </select>
                <select
                  value={batchSize}
                  onChange={(e) => handleBatchSizeChange(Number(e.target.value))}
                  className="rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                >
                  <option value={20}>Batch Size: 20</option>
                  <option value={30}>Batch Size: 30</option>
                  <option value={40}>Batch Size: 40</option>
                  <option value={50}>Batch Size: 50</option>
                </select>
              </>
            )}
            
            {viewMode === 'schedule' && (
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
              />
            )}
            
            <Link
              href="/admin/orders"
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm font-medium"
            >
              View All Orders
            </Link>
          </div>
        </div>

        {/* Daily Production Batch */}
        {dailyBatch && (
          <div className="mb-6 bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">{dailyBatch.name}</h2>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  {dailyBatch.orders.length} orders selected
                </span>
                <span className="text-sm text-gray-600">
                  Max: {dailyBatch.maxOrders} orders
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dailyBatch.orders.map((order) => (
                <div key={order._id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-medium ${getPriorityColor(calculateOverduePriority(order))}`}>
                      Priority: {calculateOverduePriority(order)}
                      {isOrderOverdue(order) && <span className="ml-1 text-red-600">(OVERDUE)</span>}
                    </span>
                    <span className="text-xs font-medium text-gray-900">
                      {order.reference}
                    </span>
                  </div>
                  
                  <div className="mb-2">
                    <p className="text-sm font-medium text-gray-900">
                      {order.shippingDetails.firstName} {order.shippingDetails.lastName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {order.shippingDetails.shippingMethod}
                    </p>
                    <p className={`text-xs ${getDueDateColor(order)}`}>
                      Due: {formatDueDate(order)}
                      {!isOrderOverdue(order) && (
                        <span className="ml-1">
                          ({getDaysUntilDue(order)} days left)
                        </span>
                      )}
                    </p>
                  </div>
                  
                  <div className="mb-2">
                    {order.items.map((item, index) => (
                      <div key={index} className="text-xs text-gray-600">
                        {item.quantity}x {item.name} ({item.size})
                        {item.customization?.isCustomized && (
                          <span className="ml-1 text-purple-600">• Custom</span>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleProductionStatusChange(order._id, 'in_production')}
                      className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                      Start Production
                    </button>
                    <Link
                      href={`/admin/orders/${order._id}`}
                      className="px-2 py-1 text-xs text-purple-600 hover:text-purple-900"
                    >
                      Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Production Schedule View */}
        {viewMode === 'schedule' && (
          <div className="mb-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">Production Schedule</h2>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">
                    Selected Date: {formatScheduleDate(selectedDate)}
                  </span>
                  <span className="text-sm text-gray-600">
                    {generateProductionSchedule(orders, selectedDate).length} orders scheduled
                  </span>
                </div>
              </div>

              {/* Weekly Overview */}
              <div className="mb-6">
                <h3 className="text-md font-medium text-gray-900 mb-3">Next 7 Days Overview</h3>
                <div className="grid grid-cols-7 gap-2">
                  {getNextWeekDates().map((date) => {
                    const scheduledOrders = generateProductionSchedule(orders, date);
                    const isSelected = date === selectedDate;
                    return (
                      <div
                        key={date}
                        onClick={() => setSelectedDate(date)}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-purple-100 border-purple-300'
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        <div className="text-xs font-medium text-gray-900">
                          {formatScheduleDate(date)}
                        </div>
                        <div className="text-lg font-bold text-gray-900 mt-1">
                          {scheduledOrders.length}
                        </div>
                        <div className="text-xs text-gray-500">orders</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Selected Date Schedule */}
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-3">
                  Production Schedule for {formatScheduleDate(selectedDate)}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {generateProductionSchedule(orders, selectedDate).map((order) => (
                    <div key={order._id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs font-medium ${getPriorityColor(calculateOverduePriority(order))}`}>
                          Priority: {calculateOverduePriority(order)}
                          {isOrderOverdue(order) && <span className="ml-1 text-red-600">(OVERDUE)</span>}
                        </span>
                        <span className="text-xs font-medium text-gray-900">
                          {order.reference}
                        </span>
                      </div>
                      
                      <div className="mb-2">
                        <p className="text-sm font-medium text-gray-900">
                          {order.shippingDetails.firstName} {order.shippingDetails.lastName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {order.shippingDetails.shippingMethod}
                        </p>
                        <p className={`text-xs ${getDueDateColor(order)}`}>
                          Due: {formatDueDate(order)}
                          {!isOrderOverdue(order) && (
                            <span className="ml-1">
                              ({getDaysUntilDue(order)} days left)
                            </span>
                          )}
                        </p>
                      </div>
                      
                      <div className="mb-2">
                        <p className="text-xs text-gray-600">
                          <strong>Production Period:</strong>
                        </p>
                        <p className="text-xs text-gray-600">
                          {getEstimatedProductionStart(order).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                          })} - {getEstimatedProductionCompletion(order).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </p>
                      </div>
                      
                      <div className="mb-2">
                        {order.items.map((item, index) => (
                          <div key={index} className="text-xs text-gray-600">
                            {item.quantity}x {item.name} ({item.size})
                            {item.customization?.isCustomized && (
                              <span className="ml-1 text-purple-600">• Custom</span>
                            )}
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex space-x-2">
                        <Link
                          href={`/admin/orders/${order._id}`}
                          className="px-2 py-1 text-xs text-purple-600 hover:text-purple-900"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
                
                {generateProductionSchedule(orders, selectedDate).length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No orders scheduled for this date</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Production Statistics */}
        {viewMode === 'current' && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            {PRODUCTION_STATUSES.map(status => {
              const count = getOrdersByStatus(status).length;
              return (
                <div key={status} className="bg-white rounded-lg shadow-sm p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        {status.replace('_', ' ').toUpperCase()}
                      </p>
                      <p className="text-2xl font-bold text-gray-900">{count}</p>
                    </div>
                    <span className={getStatusBadgeClass(status)}>
                      {status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Production Workflow */}
        {viewMode === 'current' && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {PRODUCTION_STATUSES.map(status => {
            const statusOrders = getOrdersByStatus(status);
            const sortedOrders = [...statusOrders].sort((a, b) => {
              const priorityA = calculateOverduePriority(a);
              const priorityB = calculateOverduePriority(b);
              return priorityB - priorityA;
            });
            
            return (
              <div key={status} className="bg-white rounded-lg shadow-sm">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">
                      {status.replace('_', ' ').toUpperCase()}
                    </h3>
                    <span className="text-sm font-medium text-gray-500">
                      {statusOrders.length} orders
                    </span>
                  </div>
                </div>
                
                <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                  {sortedOrders.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No orders in this stage
                    </p>
                  ) : (
                    sortedOrders.map((order) => (
                      <div key={order._id} className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow">
                        {/* Priority and Reference */}
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-xs font-medium ${getPriorityColor(calculateOverduePriority(order))}`}>
                            Priority: {calculateOverduePriority(order)}
                            {isOrderOverdue(order) && <span className="ml-1 text-red-600">(OVERDUE)</span>}
                          </span>
                          <span className="text-xs font-medium text-gray-900">
                            {order.reference}
                          </span>
                        </div>

                        {/* Customer Info */}
                        <div className="mb-2">
                          <p className="text-sm font-medium text-gray-900">
                            {order.shippingDetails.firstName} {order.shippingDetails.lastName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {order.shippingDetails.shippingMethod}
                          </p>
                          <p className={`text-xs ${getDueDateColor(order)}`}>
                            Due: {formatDueDate(order)}
                            {!isOrderOverdue(order) && (
                              <span className="ml-1">
                                ({getDaysUntilDue(order)} days left)
                              </span>
                            )}
                          </p>
                        </div>

                        {/* Items */}
                        <div className="mb-3">
                          {order.items.map((item, index) => (
                            <div key={index} className="text-xs text-gray-600">
                              {item.quantity}x {item.name} ({item.size})
                              {item.customization?.isCustomized && (
                                <span className="ml-1 text-purple-600">• Custom</span>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Production Notes */}
                        {order.productionNotes && (
                          <div className="mb-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
                            <strong>Notes:</strong> {order.productionNotes}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="space-y-2">
                          {/* Production Status Actions */}
                          <div>
                            <div className="flex flex-wrap gap-1">
                              {getNextProductionActions(order.productionStatus).map((nextStatus) => (
                                <button
                                  key={nextStatus}
                                  onClick={() => handleProductionStatusChange(order._id, nextStatus)}
                                  className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200"
                                >
                                  → {nextStatus.replace('_', ' ')}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Priority Update for Overdue Orders */}
                          {isOrderOverdue(order) && (
                            <div>
                              <button
                                onClick={() => handlePriorityUpdate(order._id, 150)}
                                className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                              >
                                Set Highest Priority
                              </button>
                            </div>
                          )}

                          {/* Notes Button */}
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
                                className="w-full px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                              >
                                {order.productionNotes ? 'Edit Notes' : 'Add Notes'}
                              </button>
                            )}
                          </div>

                          {/* View Details Link */}
                          <div>
                            <Link
                              href={`/admin/orders/${order._id}`}
                              className="block w-full text-center px-2 py-1 text-xs text-purple-600 hover:text-purple-900 hover:bg-purple-50 rounded"
                            >
                              View Details
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
        )}

        {/* Priority Guide */}
        <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Production Priority Guide</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Delivery Priority</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-red-600 font-bold">150+</span>
                  <span className="text-sm text-gray-600">Overdue Orders - Highest Priority</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-red-600 font-bold">100+</span>
                  <span className="text-sm text-gray-600">Next Day Delivery - Process First</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-orange-600 font-semibold">50-99</span>
                  <span className="text-sm text-gray-600">Express Delivery - High Priority</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">10-49</span>
                  <span className="text-sm text-gray-600">Standard Delivery - Normal Priority</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Due Date Colors</h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <span className="text-red-600 font-bold">Red</span>
                  <span className="ml-2 text-sm text-gray-600">1 day or less until due / Overdue</span>
                </div>
                <div className="flex items-center">
                  <span className="text-orange-600 font-semibold">Orange</span>
                  <span className="ml-2 text-sm text-gray-600">2-3 days until due</span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-800 font-medium">Black</span>
                  <span className="ml-2 text-sm text-gray-600">4-5 days until due</span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-600">Gray</span>
                  <span className="ml-2 text-sm text-gray-600">More than 5 days until due</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Production Workflow</h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <span className={getStatusBadgeClass('not_started')}>NOT STARTED</span>
                  <span className="ml-2 text-sm text-gray-600">→ Ready for production</span>
                </div>
                <div className="flex items-center">
                  <span className={getStatusBadgeClass('in_production')}>IN PRODUCTION</span>
                  <span className="ml-2 text-sm text-gray-600">→ Currently being made</span>
                </div>
                <div className="flex items-center">
                  <span className={getStatusBadgeClass('quality_check')}>QUALITY CHECK</span>
                  <span className="ml-2 text-sm text-gray-600">→ Final inspection</span>
                </div>
                <div className="flex items-center">
                  <span className={getStatusBadgeClass('ready_to_ship')}>READY TO SHIP</span>
                  <span className="ml-2 text-sm text-gray-600">→ Packaged and ready</span>
                </div>
                <div className="flex items-center">
                  <span className={getStatusBadgeClass('completed')}>COMPLETED</span>
                  <span className="ml-2 text-sm text-gray-600">→ Production finished</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 