"use client";

import { useEffect, useState } from "react";
import { FaBoxOpen, FaCheckCircle, FaClipboardList, FaShippingFast, FaCogs, FaChevronLeft, FaChevronRight, FaEye, FaTimes } from "react-icons/fa";
import { getImageUrl } from "@/lib/utils";

interface Order {
  _id: string;
  reference: string;
  userId: string;
  total: number;
  status: string;
  productionStatus: string;
  deliveryPriority: number;
  createdAt: string;
  updatedAt?: string; // Added for completed orders
  shippingDetails: {
    firstName: string;
    lastName: string;
    shippingMethod: string;
    email?: string;
    phone?: string;
    address?: string;
    address2?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    size: string;
    price?: number; // Added for item price
    productId?: string; // Added for product images
    image?: string; // Added for product images
    customization?: {
      name?: string;
      number?: string;
      isCustomized: boolean;
      color?: string;
      instructions?: string;
      customImage?: string; // Added for custom design images
    };
  }>;
}

const PRODUCTION_STATUSES = [
  "not_started",
  "in_production",
  "quality_check",
  "ready_to_ship",
  "completed",
];

const STATUS_LABELS: Record<string, string> = {
  not_started: "Not Started",
  in_production: "In Production",
  quality_check: "Quality Check",
  ready_to_ship: "Ready to Ship",
  completed: "Completed",
};

const STATUS_COLORS: Record<string, string> = {
  not_started: "bg-gray-50 border-gray-200",
  in_production: "bg-blue-50 border-blue-200",
  quality_check: "bg-yellow-50 border-yellow-200",
  ready_to_ship: "bg-green-50 border-green-200",
  completed: "bg-purple-50 border-purple-200",
};

const DAYS_TO_SCHEDULE = 7;
const BATCH_SIZE = 50;
const STATUS_FLOW = [
  "not_started",
  "in_production",
  "quality_check",
  "ready_to_ship",
  "completed",
];

function getDueDate(order: Order): string {
  const orderDate = new Date(order.createdAt);
  const shipping = order.shippingDetails.shippingMethod.toLowerCase();
  if (shipping.includes("next day")) orderDate.setDate(orderDate.getDate() + 1);
  else if (shipping.includes("express")) orderDate.setDate(orderDate.getDate() + 3);
  else orderDate.setDate(orderDate.getDate() + 5);
  return orderDate.toLocaleDateString();
}

function formatPlacedDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString();
}

function getPriorityBadge(priority: number) {
  if (priority >= 150) return <span className="bg-red-600 text-white px-2 py-0.5 rounded text-xs font-bold">{priority}</span>;
  if (priority >= 100) return <span className="bg-red-400 text-white px-2 py-0.5 rounded text-xs font-bold">{priority}</span>;
  if (priority >= 50) return <span className="bg-orange-400 text-white px-2 py-0.5 rounded text-xs font-bold">{priority}</span>;
  return <span className="bg-gray-400 text-white px-2 py-0.5 rounded text-xs font-bold">{priority}</span>;
}

function getStatusBadge(status: string) {
  const map: Record<string, string> = {
    not_started: "bg-gray-200 text-gray-700",
    in_production: "bg-blue-200 text-blue-700",
    quality_check: "bg-yellow-200 text-yellow-800",
    ready_to_ship: "bg-green-200 text-green-700",
    completed: "bg-purple-200 text-purple-700",
  };
  return <span className={`px-2 py-0.5 rounded text-xs font-semibold ${map[status]}`}>{STATUS_LABELS[status]}</span>;
}

function getNextStatus(status: string) {
  const idx = STATUS_FLOW.indexOf(status);
  return idx < STATUS_FLOW.length - 1 ? STATUS_FLOW[idx + 1] : null;
}
function getPrevStatus(status: string) {
  const idx = STATUS_FLOW.indexOf(status);
  return idx > 0 ? STATUS_FLOW[idx - 1] : null;
}

export default function ProductionDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState(0); // 0 = today
  const [processing, setProcessing] = useState<string | null>(null); // order id being updated
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null); // for modal

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/admin/production-orders");
        if (!res.ok) throw new Error("Failed to fetch orders");
        const data = await res.json();
        setOrders(data.orders || []);
      } catch (err: any) {
        setError(err.message || "Failed to fetch orders");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  // --- Scheduling logic ---
  // Only orders not completed
  const eligibleOrders = orders.filter(o => o.productionStatus !== "completed");
  // Sort by priority
  const sortedOrders = [...eligibleOrders].sort((a, b) => b.deliveryPriority - a.deliveryPriority);
  // Assign to days in rolling batches
  const scheduledBatches: Record<number, Order[]> = {};
  let idx = 0;
  for (let day = 0; day < DAYS_TO_SCHEDULE; day++) {
    scheduledBatches[day] = sortedOrders.slice(idx, idx + BATCH_SIZE);
    idx += BATCH_SIZE;
  }
  // Dates for navigation
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dateList: string[] = [];
  for (let i = 0; i < DAYS_TO_SCHEDULE; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dateList.push(d.toLocaleDateString());
  }

  // Orders for the selected day
  const batch = scheduledBatches[selectedDay] || [];
  // Group by status for columns
  const ordersByStatus: Record<string, Order[]> = {};
  for (const status of PRODUCTION_STATUSES) {
    ordersByStatus[status] = batch.filter(o => o.productionStatus === status);
  }

  // --- Status update handler ---
  async function handleStatusChange(orderId: string, newStatus: string) {
    setProcessing(orderId);
    try {
      const res = await fetch(`/api/admin/production-orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productionStatus: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      // Update local state
      setOrders(orders =>
        orders.map(o =>
          o._id === orderId ? { ...o, productionStatus: newStatus } : o
        )
      );
    } catch (err) {
      alert("Failed to update status");
    } finally {
      setProcessing(null);
    }
  }

  // --- Modal handlers ---
  function openOrderDetails(order: Order) {
    setSelectedOrder(order);
  }

  function closeOrderDetails() {
    setSelectedOrder(null);
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6 font-sans">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 tracking-tight">Production Dashboard</h1>
        {/* Day navigation */}
        <div className="flex items-center gap-4 mb-4">
          <button
            className="p-2 rounded bg-white border shadow hover:bg-gray-50 disabled:opacity-50"
            onClick={() => setSelectedDay(d => Math.max(0, d - 1))}
            disabled={selectedDay === 0}
            title="Previous day"
          >
            <FaChevronLeft />
          </button>
          <div className="font-semibold text-lg">
            {dateList[selectedDay]}
          </div>
          <button
            className="p-2 rounded bg-white border shadow hover:bg-gray-50 disabled:opacity-50"
            onClick={() => setSelectedDay(d => Math.min(DAYS_TO_SCHEDULE - 1, d + 1))}
            disabled={selectedDay === DAYS_TO_SCHEDULE - 1}
            title="Next day"
          >
            <FaChevronRight />
          </button>
          <span className="ml-4 text-gray-500 text-sm">Batch: {batch.length} / {BATCH_SIZE}</span>
        </div>
        {/* Daily Production Batch */}
        <div className="mb-8 p-6 bg-gradient-to-r from-purple-100 to-blue-100 rounded-2xl shadow-lg border border-purple-200">
          <h2 className="text-xl font-bold mb-4 text-purple-900 flex items-center gap-2">
            <FaClipboardList className="inline-block text-purple-500" />
            Daily Production - {dateList[selectedDay]}
          </h2>
          <div className="flex flex-wrap gap-4">
            {batch.length === 0 && <div className="text-gray-500">No orders for this day</div>}
            {batch.map(order => (
              <div key={order._id} className="border-2 border-purple-200 rounded-xl p-4 min-w-[260px] bg-white shadow hover:shadow-lg transition-shadow duration-200 flex flex-col gap-1">
                <div className="flex items-center gap-2 mb-1">
                  {getPriorityBadge(order.deliveryPriority)}
                  <span className="text-xs text-gray-400">{order.reference}</span>
                </div>
                <div className="text-xs text-gray-700 font-semibold mb-1">{order.shippingDetails.firstName} {order.shippingDetails.lastName}</div>
                <div className="text-xs text-gray-500 mb-1">{order.shippingDetails.shippingMethod}</div>
                <div className="text-xs text-gray-500 mb-1">Placed: {formatPlacedDate(order.createdAt)}</div>
                <div className="text-xs text-gray-500 mb-1">Due: {getDueDate(order)}</div>
                <div className="text-xs text-gray-500 mb-1">{order.items.length} item(s)</div>
                <div className="text-xs text-gray-500 mb-1">Total: £{order.total?.toFixed(2) ?? 'N/A'}</div>
                <div className="mt-1">{getStatusBadge(order.productionStatus)}</div>
                <div className="mt-2">
                  <div className="font-semibold text-xs text-gray-700 mb-1">Items:</div>
                  <ul className="text-xs text-gray-600 list-disc list-inside">
                    {order.items.map((item, idx) => (
                      <li key={idx}>
                        {item.name} ({item.size}) × {item.quantity}
                        {item.customization?.isCustomized && (
                          <div className="ml-2 text-[11px] text-purple-700 font-medium">
                            {item.customization.name && <span>Name: {item.customization.name} </span>}
                            {item.customization.number && <span>Number: {item.customization.number}</span>}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
                {/* Action buttons */}
                <div className="flex gap-2 mt-2">
                  <button
                    className="px-2 py-1 rounded bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 flex items-center gap-1"
                    onClick={() => openOrderDetails(order)}
                  >
                    <FaEye className="text-xs" />
                    View Details
                  </button>
                  {getPrevStatus(order.productionStatus) && (
                    <button
                      className="px-2 py-1 rounded bg-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-300 disabled:opacity-50"
                      onClick={() => handleStatusChange(order._id, getPrevStatus(order.productionStatus)!)}
                      disabled={processing === order._id}
                    >
                      ← {STATUS_LABELS[getPrevStatus(order.productionStatus)!]}
                    </button>
                  )}
                  {getNextStatus(order.productionStatus) && (
                    <button
                      className="px-2 py-1 rounded bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 disabled:opacity-50"
                      onClick={() => handleStatusChange(order._id, getNextStatus(order.productionStatus)!)}
                      disabled={processing === order._id}
                    >
                      {STATUS_LABELS[getNextStatus(order.productionStatus)!]} →
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Production Status Columns */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-10">
          {PRODUCTION_STATUSES.map((status) => (
            <div key={status} className={`rounded-2xl shadow border p-4 min-h-[260px] flex flex-col gap-2 ${STATUS_COLORS[status]}`}>
              <h3 className="font-bold text-gray-700 mb-2 uppercase text-xs tracking-wider flex items-center gap-2">
                {status === "not_started" && <FaBoxOpen className="text-gray-400" />}
                {status === "in_production" && <FaCogs className="text-blue-400" />}
                {status === "quality_check" && <FaCheckCircle className="text-yellow-400" />}
                {status === "ready_to_ship" && <FaShippingFast className="text-green-400" />}
                {status === "completed" && <FaCheckCircle className="text-purple-400" />}
                {STATUS_LABELS[status]}
              </h3>
              {ordersByStatus[status].length === 0 ? (
                <div className="text-gray-400 text-sm">No orders</div>
              ) : (
                ordersByStatus[status].map(order => (
                  <div key={order._id} className="border border-gray-200 rounded-lg p-3 mb-2 bg-white shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col gap-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getPriorityBadge(order.deliveryPriority)}
                      <span className="text-xs text-gray-400">{order.reference}</span>
                    </div>
                    <div className="text-xs text-gray-700 font-semibold mb-1">{order.shippingDetails.firstName} {order.shippingDetails.lastName}</div>
                    <div className="text-xs text-gray-500 mb-1">{order.shippingDetails.shippingMethod}</div>
                    <div className="text-xs text-gray-500 mb-1">Placed: {formatPlacedDate(order.createdAt)}</div>
                    <div className="text-xs text-gray-500 mb-1">Due: {getDueDate(order)}</div>
                    <div className="text-xs text-gray-500 mb-1">{order.items.length} item(s)</div>
                    <div className="text-xs text-gray-500 mb-1">Total: £{order.total?.toFixed(2) ?? 'N/A'}</div>
                    <div className="mt-1">{getStatusBadge(order.productionStatus)}</div>
                    <div className="mt-2">
                      <div className="font-semibold text-xs text-gray-700 mb-1">Items:</div>
                      <ul className="text-xs text-gray-600 list-disc list-inside">
                        {order.items.map((item, idx) => (
                          <li key={idx}>
                            {item.name} ({item.size}) × {item.quantity}
                            {item.customization?.isCustomized && (
                              <div className="ml-2 text-[11px] text-purple-700 font-medium">
                                {item.customization.name && <span>Name: {item.customization.name} </span>}
                                {item.customization.number && <span>Number: {item.customization.number}</span>}
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                    {/* Action buttons */}
                    <div className="flex gap-2 mt-2">
                      <button
                        className="px-2 py-1 rounded bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 flex items-center gap-1"
                        onClick={() => openOrderDetails(order)}
                      >
                        <FaEye className="text-xs" />
                        View Details
                      </button>
                      {getPrevStatus(order.productionStatus) && (
                        <button
                          className="px-2 py-1 rounded bg-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-300 disabled:opacity-50"
                          onClick={() => handleStatusChange(order._id, getPrevStatus(order.productionStatus)!)}
                          disabled={processing === order._id}
                        >
                          ← {STATUS_LABELS[getPrevStatus(order.productionStatus)!]}
                        </button>
                      )}
                      {getNextStatus(order.productionStatus) && (
                        <button
                          className="px-2 py-1 rounded bg-white text-black text-xs font-semibold hover:bg-gradient-to-r hover:from-[var(--brand-red)] hover:to-[var(--brand-blue)] hover:bg-clip-text hover:text-transparent disabled:opacity-50"
                          onClick={() => handleStatusChange(order._id, getNextStatus(order.productionStatus)!)}
                          disabled={processing === order._id}
                        >
                          {STATUS_LABELS[getNextStatus(order.productionStatus)!]} →
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          ))}
        </div>
        {/* Completed Orders */}
        <div className="mt-10 p-6 bg-gradient-to-r from-green-100 to-emerald-100 rounded-2xl shadow-lg border border-green-200">
          <h2 className="text-xl font-bold mb-4 text-green-900 flex items-center gap-2">
            <FaCheckCircle className="inline-block text-green-500" />
            Completed Orders
          </h2>
          <div className="flex flex-wrap gap-4">
            {orders.filter(o => o.productionStatus === "completed").length === 0 && (
              <div className="text-gray-500">No completed orders</div>
            )}
            {orders
              .filter(o => o.productionStatus === "completed")
              .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
              .map(order => (
                <div key={order._id} className="border-2 border-green-200 rounded-xl p-4 min-w-[260px] bg-white shadow hover:shadow-lg transition-shadow duration-200 flex flex-col gap-1">
                  <div className="flex items-center gap-2 mb-1">
                    {getPriorityBadge(order.deliveryPriority)}
                    <span className="text-xs text-gray-400">{order.reference}</span>
                  </div>
                  <div className="text-xs text-gray-700 font-semibold mb-1">{order.shippingDetails.firstName} {order.shippingDetails.lastName}</div>
                  <div className="text-xs text-gray-500 mb-1">{order.shippingDetails.shippingMethod}</div>
                  <div className="text-xs text-gray-500 mb-1">Placed: {formatPlacedDate(order.createdAt)}</div>
                  <div className="text-xs text-gray-500 mb-1">Due: {getDueDate(order)}</div>
                  <div className="text-xs text-gray-500 mb-1">{order.items.length} item(s)</div>
                  <div className="text-xs text-gray-500 mb-1">Total: £{order.total?.toFixed(2) ?? 'N/A'}</div>
                  <div className="mt-1">{getStatusBadge(order.productionStatus)}</div>
                  <div className="mt-2">
                    <div className="font-semibold text-xs text-gray-700 mb-1">Items:</div>
                    <ul className="text-xs text-gray-600 list-disc list-inside">
                      {order.items.map((item, idx) => (
                        <li key={idx}>
                          {item.name} ({item.size}) × {item.quantity}
                          {item.customization?.isCustomized && (
                            <div className="ml-2 text-[11px] text-purple-700 font-medium">
                              {item.customization.name && <span>Name: {item.customization.name} </span>}
                              {item.customization.number && <span>Number: {item.customization.number}</span>}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {/* Action buttons */}
                  <div className="flex gap-2 mt-2">
                    <button
                      className="px-2 py-1 rounded bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 flex items-center gap-1"
                      onClick={() => openOrderDetails(order)}
                    >
                      <FaEye className="text-xs" />
                      View Details
                    </button>
                    <button
                      className="px-2 py-1 rounded bg-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-300 disabled:opacity-50"
                      onClick={() => handleStatusChange(order._id, "ready_to_ship")}
                      disabled={processing === order._id}
                    >
                      ← Move to Ready to Ship
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
        {/* Order Details Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Order Details</h2>
                  <button
                    onClick={closeOrderDetails}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <FaTimes className="text-gray-500" />
                  </button>
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-sm text-gray-500">Order #{selectedOrder.reference}</span>
                  {getPriorityBadge(selectedOrder.deliveryPriority)}
                  {getStatusBadge(selectedOrder.productionStatus)}
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Customer Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-gray-500">Name:</span>
                        <p className="text-gray-900">{selectedOrder.shippingDetails.firstName} {selectedOrder.shippingDetails.lastName}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Email:</span>
                        <p className="text-gray-900">{selectedOrder.shippingDetails.email}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Phone:</span>
                        <p className="text-gray-900">{selectedOrder.shippingDetails.phone}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Shipping Method:</span>
                        <p className="text-gray-900">{selectedOrder.shippingDetails.shippingMethod}</p>
                      </div>
                    </div>
                  </div>
                  {/* Order Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Information</h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-gray-500">Order Date:</span>
                        <p className="text-gray-900">{formatPlacedDate(selectedOrder.createdAt)}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Due Date:</span>
                        <p className="text-gray-900">{getDueDate(selectedOrder)}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Total:</span>
                        <p className="text-gray-900">£{selectedOrder.total?.toFixed(2) ?? 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Status:</span>
                        <p className="text-gray-900">{STATUS_LABELS[selectedOrder.productionStatus]}</p>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Shipping Address */}
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Shipping Address</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-900">{selectedOrder.shippingDetails.firstName} {selectedOrder.shippingDetails.lastName}</p>
                    <p className="text-gray-900">{selectedOrder.shippingDetails.address}</p>
                    {selectedOrder.shippingDetails.address2 && (
                      <p className="text-gray-900">{selectedOrder.shippingDetails.address2}</p>
                    )}
                    <p className="text-gray-900">{selectedOrder.shippingDetails.city}, {selectedOrder.shippingDetails.state} {selectedOrder.shippingDetails.zipCode}</p>
                    <p className="text-gray-900">{selectedOrder.shippingDetails.country}</p>
                  </div>
                </div>
                {/* Order Items */}
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
                  <div className="space-y-6">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{item.name}</h4>
                            <p className="text-sm text-gray-500">Size: {item.size} | Quantity: {item.quantity}</p>
                            <p className="text-sm text-gray-500">Price: £{item.price?.toFixed(2) ?? 'N/A'}</p>
                          </div>
                          <div className="text-right ml-4">
                            <p className="font-semibold text-gray-900">£{((item.price || 0) * item.quantity).toFixed(2)}</p>
                          </div>
                        </div>
                        
                        {/* Product Image */}
                        <div className="mb-4">
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Product Image:</h5>
                          <div className="flex gap-4">
                            {item.image ? (
                              <div className="flex flex-col items-center gap-2">
                                <img
                                  src={getImageUrl(item.image)}
                                  alt={item.name}
                                  className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = getImageUrl('/images/logo.jpg');
                                  }}
                                />
                                <a
                                  href={getImageUrl(item.image)}
                                  download
                                  className="mt-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold hover:bg-blue-200 border border-blue-200"
                                >
                                  Export Image
                                </a>
                              </div>
                            ) : (
                              <div className="w-24 h-24 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                                <span className="text-xs text-gray-400">No image</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Custom Design Details */}
                        {item.customization?.isCustomized && (
                          <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                            <h5 className="font-semibold text-purple-900 text-sm mb-3">Custom Design Details</h5>
                            <div className="space-y-2 text-sm">
                              {item.customization.name && (
                                <p><span className="font-medium text-purple-700">Name:</span> {item.customization.name}</p>
                              )}
                              {item.customization.number && (
                                <p><span className="font-medium text-purple-700">Number:</span> {item.customization.number}</p>
                              )}
                              {item.customization.color && (
                                <p><span className="font-medium text-purple-700">Color:</span> {item.customization.color}</p>
                              )}
                              {item.customization.instructions && (
                                <p><span className="font-medium text-purple-700">Instructions:</span> {item.customization.instructions}</p>
                              )}
                            </div>
                            
                            {/* Custom Design Image */}
                            {item.customization.customImage && (
                              <div className="mt-3">
                                <h6 className="text-sm font-medium text-purple-700 mb-2">Custom Design Image:</h6>
                                <div className="flex gap-4">
                                  <div className="flex flex-col items-center gap-2">
                                    <img
                                      src={getImageUrl(item.customization.customImage)}
                                      alt="Custom design"
                                      className="w-32 h-32 object-cover rounded-lg border border-purple-200"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = getImageUrl('/images/logo.jpg');
                                      }}
                                    />
                                    <a
                                      href={getImageUrl(item.customization.customImage)}
                                      download
                                      className="mt-1 px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-semibold hover:bg-purple-200 border border-purple-200"
                                    >
                                      Export Image
                                    </a>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                {/* Production Status Controls */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Production Status</h3>
                  <div className="flex gap-3">
                    {getPrevStatus(selectedOrder.productionStatus) && (
                      <button
                        className="px-4 py-2 rounded bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 disabled:opacity-50"
                        onClick={() => {
                          handleStatusChange(selectedOrder._id, getPrevStatus(selectedOrder.productionStatus)!);
                          closeOrderDetails();
                        }}
                        disabled={processing === selectedOrder._id}
                      >
                        ← {STATUS_LABELS[getPrevStatus(selectedOrder.productionStatus)!]}
                      </button>
                    )}
                    {getNextStatus(selectedOrder.productionStatus) && (
                      <button
                        className="px-4 py-2 rounded bg-white text-black font-semibold hover:bg-gradient-to-r hover:from-[var(--brand-red)] hover:to-[var(--brand-blue)] hover:bg-clip-text hover:text-transparent disabled:opacity-50"
                        onClick={() => {
                          handleStatusChange(selectedOrder._id, getNextStatus(selectedOrder.productionStatus)!);
                          closeOrderDetails();
                        }}
                        disabled={processing === selectedOrder._id}
                      >
                        {STATUS_LABELS[getNextStatus(selectedOrder.productionStatus)!]} →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {loading && <div className="mt-6 text-center text-gray-500">Loading...</div>}
        {error && <div className="mt-6 text-center text-red-500">{error}</div>}
      </div>
    </div>
  );
} 