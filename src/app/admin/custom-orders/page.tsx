'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { generateCustomOrderInvoicePDF } from '@/lib/pdf';

interface CustomOrder {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  preferredContact: string;
  company: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  selectedProduct: string;
  productDetails?: {
    _id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    gender: string;
    images: Array<{ url: string; alt: string; color?: string }>;
    colors: Array<{ name: string; hexCode: string; imageUrl?: string }>;
  };
  quantity: number;
  sizeQuantities: { [color: string]: { [size: string]: number } };
  selectedColors: string[];
  printingType: 'dtf';
  printingSurface: string[];
  designLocation: string[];
  printSize: string;
  paperSize: string;
  needsDesignAssistance: boolean;
  notes: string;
  designFiles: Array<{ name: string; size: number; type: string; url: string; publicId: string }>;
  submittedAt: string;
  status: string;
  invoiceData?: any;
  invoiceGeneratedAt?: string;
  paymentLink?: string;
  paymentLinkGeneratedAt?: string;
  paymentStatus?: string;
  paymentId?: string;
  paymentCompletedAt?: string;
}

export default function CustomOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<CustomOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<CustomOrder | null>(null);
  const [selectedOrderPreviewColor, setSelectedOrderPreviewColor] = useState<string>('');
  const [selectedOrderPreviewImageIndex, setSelectedOrderPreviewImageIndex] = useState<number>(0);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [paymentLink, setPaymentLink] = useState<string | null>(null);
  const [generatingPaymentLink, setGeneratingPaymentLink] = useState(false);

  // Reset product preview when selecting a different order
  useEffect(() => {
    setSelectedOrderPreviewColor('');
    setSelectedOrderPreviewImageIndex(0);
  }, [selectedOrder?._id]);

  useEffect(() => {
    fetchOrders();
  }, [currentPage, statusFilter]);

  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10'
      });
      
      if (statusFilter) {
        params.append('status', statusFilter);
      }

      const response = await fetch(`/api/custom-orders?${params}`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/custom-orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        // Refresh orders
        fetchOrders();
        setSelectedOrder(null);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const deleteOrder = async (order: CustomOrder) => {
    const ok = window.confirm(
      `Delete this custom order?\n\n${order.firstName} ${order.lastName}\n${order.productDetails?.name || order.selectedProduct}\n\nThis cannot be undone.`
    );
    if (!ok) return;

    try {
      const response = await fetch(`/api/custom-orders/${order._id}`, { method: 'DELETE' });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || 'Failed to delete order');
      }

      // Refresh list + close modal if needed
      if (selectedOrder?._id === order._id) {
        setSelectedOrder(null);
      }
      fetchOrders();
    } catch (error) {
      console.error('Error deleting order:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete order');
    }
  };

  const generateInvoice = async (order: CustomOrder) => {
    try {
      // Use saved product details or fetch if not available
      let productData = order.productDetails;
      if (!productData) {
        const productResponse = await fetch(`/api/products/${order.selectedProduct}`);
        productData = await productResponse.json();
      }
      
      // Calculate total quantity
      const totalQuantity = Object.values(order.sizeQuantities).reduce((colorSum, colorQuantities) => {
        return (
          colorSum +
          Object.values(colorQuantities).reduce((sizeSum, qty) => sizeSum + (Number(qty) || 0), 0)
        );
      }, 0);

      // Calculate pricing: A4/A3 unit price × total units
      // A4: £10, A3: £12.50
      const unitPrice = order.paperSize === 'A3' ? 12.5 : 10;
      const subtotal = unitPrice * totalQuantity;
      const vatRate = 0.20; // 20% VAT
      const vatAmount = subtotal * vatRate;
      const total = subtotal + vatAmount;

      const invoice = {
        invoiceNumber: `INV-${Date.now()}`,
        invoiceDate: new Date().toLocaleDateString('en-GB'),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB'), // 30 days from now
        orderId: order._id,
        paperSize: order.paperSize || 'A4',
        printSize: order.printSize || '',
        product: productData,
        customer: {
          name: `${order.firstName} ${order.lastName}`,
          company: order.company || '',
          email: order.email,
          phone: order.phone,
          address: {
            street: order.address,
            city: order.city,
            province: order.province,
            postalCode: order.postalCode
          }
        },
        items: [
          {
            description: `Custom ${productData?.name || 'Product'} Design - ${order.paperSize} DTF Printing${order.printSize ? ` (Print size: ${order.printSize})` : ''}`,
            quantity: totalQuantity,
            unitPrice: unitPrice,
            total: subtotal
          }
        ],
        pricing: {
          subtotal,
          vatRate: vatRate * 100,
          vatAmount,
          total
        },
        notes: order.notes || '',
        designFiles: order.designFiles || []
      };

      setInvoiceData(invoice);
      setShowInvoiceModal(true);
    } catch (error) {
      console.error('Error fetching product details:', error);
      // Fallback to basic invoice without product details
      const totalQuantity = Object.values(order.sizeQuantities).reduce((colorSum, colorQuantities) => {
        return (
          colorSum +
          Object.values(colorQuantities).reduce((sizeSum, qty) => sizeSum + (Number(qty) || 0), 0)
        );
      }, 0);

      const unitPrice = order.paperSize === 'A3' ? 12.5 : 10;
      const subtotal = unitPrice * totalQuantity;
      const vatRate = 0.20;
      const vatAmount = subtotal * vatRate;
      const total = subtotal + vatAmount;

      const invoice = {
        invoiceNumber: `INV-${Date.now()}`,
        invoiceDate: new Date().toLocaleDateString('en-GB'),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB'),
        orderId: order._id,
        paperSize: order.paperSize || 'A4',
        printSize: order.printSize || '',
        product: null,
        customer: {
          name: `${order.firstName} ${order.lastName}`,
          company: order.company || '',
          email: order.email,
          phone: order.phone,
          address: {
            street: order.address,
            city: order.city,
            province: order.province,
            postalCode: order.postalCode
          }
        },
        items: [
          {
            description: `Custom Design - ${order.paperSize || 'A4'} DTF Printing${order.printSize ? ` (Print size: ${order.printSize})` : ''}`,
            quantity: totalQuantity,
            unitPrice: unitPrice,
            total: subtotal
          }
        ],
        pricing: {
          subtotal,
          vatRate: vatRate * 100,
          vatAmount,
          total
        },
        notes: order.notes || '',
        designFiles: order.designFiles || []
      };

      setInvoiceData(invoice);
      setShowInvoiceModal(true);
    }
  };

  const generatePaymentLink = async () => {
    if (!selectedOrder || !invoiceData) return;

    console.log('Generating payment link for:', {
      orderId: selectedOrder._id,
      amount: invoiceData.pricing.total,
      description: `Custom Order #${selectedOrder._id} - ${invoiceData.paperSize || selectedOrder.paperSize || 'A4'} DTF Printing${invoiceData.printSize ? ` (Print size: ${invoiceData.printSize})` : ''}`
    });

    setGeneratingPaymentLink(true);
    try {
      const response = await fetch(`/api/custom-orders/${selectedOrder._id}/payment-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: invoiceData.pricing.total,
          description: `Custom Order #${selectedOrder._id} - ${invoiceData.paperSize || selectedOrder.paperSize || 'A4'} DTF Printing${invoiceData.printSize ? ` (Print size: ${invoiceData.printSize})` : ''}`,
        }),
      });

      console.log('Payment link response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Payment link error:', errorData);
        throw new Error(errorData.error || 'Failed to generate payment link');
      }

      const data = await response.json();
      console.log('Payment link generated:', data);
      setPaymentLink(data.paymentLink);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error generating payment link:', errorMessage);
      alert(`Failed to generate payment link: ${errorMessage}`);
    } finally {
      setGeneratingPaymentLink(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Custom Orders</h1>
          <p className="text-gray-600 mt-2">Manage custom order requests from customers</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-wrap gap-4">
            <div>
              <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Status
              </label>
              <select
                id="statusFilter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-20 border-r-2 border-gray-300 min-w-[200px] max-w-[200px]">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[250px]">
                    Product
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                    Quantity
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[180px]">
                    Colors & Sizes
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[180px]">
                    Printing Details
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[140px]">
                    Payment Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                    Order Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[140px]">
                    Submitted
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
                    Notes
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                      No orders found
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => {
                    const totalQuantity = Object.values(order.sizeQuantities || {}).reduce((colorSum, colorQuantities) => {
                      return (
                        colorSum +
                        Object.values(colorQuantities).reduce((sizeSum, qty) => sizeSum + (Number(qty) || 0), 0)
                      );
                    }, 0);
                    
                    return (
                      <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 sticky left-0 bg-white z-10 border-r-2 border-gray-300 min-w-[200px] max-w-[200px] shadow-[2px_0_4px_rgba(0,0,0,0.05)]">
                          <div className="pr-2">
                            <div className="text-sm font-medium text-gray-900 break-words">
                              {order.firstName} {order.lastName}
                            </div>
                            <div className="text-xs text-gray-500 mt-1 break-all">{order.email}</div>
                            <div className="text-xs text-gray-500 break-all">{order.phone}</div>
                            {order.company && (
                              <div className="text-xs text-gray-400 mt-1 break-words">{order.company}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 min-w-[250px]">
                          <div className="flex items-start gap-3">
                            {order.productDetails && (() => {
                              const thumbUrl =
                                order.productDetails.images?.[0]?.url ||
                                order.productDetails.colors?.find(c => c.imageUrl)?.imageUrl;
                              if (!thumbUrl) return null;
                              return (
                                <button
                                  type="button"
                                  onClick={() => setSelectedOrder(order)}
                                  className="relative w-12 h-12 rounded-md overflow-hidden border border-gray-200 bg-gray-50 flex-shrink-0 hover:ring-2 hover:ring-purple-300"
                                  aria-label={`View images for ${order.productDetails?.name || 'product'}`}
                                  title="Click to preview images"
                                >
                                  <Image
                                    src={thumbUrl}
                                    alt={order.productDetails.images?.[0]?.alt || order.productDetails.name}
                                    fill
                                    className="object-cover"
                                    sizes="48px"
                                  />
                                </button>
                              );
                            })()}

                            <div className="min-w-0">
                              <div className="text-sm font-medium text-gray-900 break-words">
                                {order.productDetails ? order.productDetails.name : `Product ID: ${order.selectedProduct}`}
                              </div>
                              {order.productDetails && (
                                <div className="text-xs text-gray-500 mt-1 break-words">
                                  {order.productDetails.category} • {order.productDetails.gender}
                                </div>
                              )}
                            </div>
                          </div>
                          {order.productDetails && (
                            <div className="sr-only">
                              {order.productDetails.category} • {order.productDetails.gender}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap min-w-[100px]">
                          <div className="text-sm font-semibold text-gray-900">{totalQuantity}</div>
                          <div className="text-xs text-gray-500">Total items</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 min-w-[180px]">
                          <div>
                            {order.selectedColors && order.selectedColors.length > 0 ? (
                              <div className="mb-1">
                                <span className="text-xs font-medium text-gray-600">Colors: </span>
                                <span className="text-xs break-words">{order.selectedColors.join(', ')}</span>
                              </div>
                            ) : null}
                            {order.sizeQuantities ? (
                              <div className="text-xs">
                                {Object.entries(order.sizeQuantities).slice(0, 2).map(([color, colorQuantities]) => (
                                  <div key={color} className="mb-1 break-words">
                                    <span className="font-medium">{color}:</span>{' '}
                                    {Object.entries(colorQuantities).filter(([_, qty]) => qty > 0).map(([size, qty]) => `${size}×${qty}`).join(', ')}
                                  </div>
                                ))}
                                {Object.keys(order.sizeQuantities).length > 2 && (
                                  <div className="text-gray-400 text-[10px]">+{Object.keys(order.sizeQuantities).length - 2} more</div>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400 text-xs">N/A</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 min-w-[180px]">
                          <div>
                            <div className="text-xs mb-1">
                              <span className="font-medium">Type:</span> {order.printingType?.toUpperCase() || 'N/A'}
                            </div>
                            {order.paperSize && (
                              <div className="text-xs mb-1">
                                <span className="font-medium">Paper:</span> {order.paperSize}
                              </div>
                            )}
                            {order.printSize && (
                              <div className="text-xs mb-1 break-words">
                                <span className="font-medium">Size:</span> {order.printSize}
                              </div>
                            )}
                            {order.printingSurface && order.printingSurface.length > 0 && (
                              <div className="text-xs break-words">
                                <span className="font-medium">Surface:</span> {order.printingSurface.join(', ')}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap min-w-[140px]">
                          <div className="flex flex-col gap-1">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              order.paymentStatus === 'completed' 
                                ? 'bg-green-100 text-green-800' 
                                : order.paymentStatus === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {order.paymentStatus === 'completed' ? 'Paid' : order.paymentStatus || 'Pending'}
                            </span>
                            {order.paymentLink && (
                              <a
                                href={order.paymentLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:underline break-all"
                              >
                                View Link
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap min-w-[120px]">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 min-w-[140px]">
                          <div>{formatDate(order.submittedAt)}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 min-w-[200px]">
                          {order.notes ? (
                            <div className="break-words" title={order.notes}>
                              {order.notes.length > 60 ? `${order.notes.substring(0, 60)}...` : order.notes}
                            </div>
                          ) : (
                            <span className="text-gray-400 italic text-xs">No notes</span>
                          )}
                          {order.needsDesignAssistance && (
                            <div className="mt-1">
                              <span className="inline-flex px-1.5 py-0.5 text-[10px] font-semibold rounded bg-purple-100 text-purple-800">
                                Needs Design Help
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm min-w-[120px]">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="px-3 py-1.5 rounded bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 transition-colors"
                            >
                              View
                            </button>
                            <button
                              onClick={() => deleteOrder(order)}
                              className="px-3 py-1.5 rounded bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Page <span className="font-medium">{currentPage}</span> of{' '}
                    <span className="font-medium">{totalPages}</span>
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Order Details Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Order Details</h3>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Product Image Preview */}
                  {selectedOrder.productDetails && (
                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-3">Product Images</h4>
                      {(() => {
                        const pd = selectedOrder.productDetails!;
                        const colorImageUrl =
                          selectedOrderPreviewColor
                            ? pd.colors?.find(c => c.name === selectedOrderPreviewColor && c.imageUrl)?.imageUrl
                            : undefined;

                        const colorMatchedImages = selectedOrderPreviewColor
                          ? (pd.images || []).filter(img => img.color === selectedOrderPreviewColor)
                          : [];

                        const baseImages =
                          selectedOrderPreviewColor && colorMatchedImages.length > 0
                            ? colorMatchedImages
                            : (pd.images || []);

                        const previewImages = [
                          ...(colorImageUrl ? [{ url: colorImageUrl, alt: `${pd.name} - ${selectedOrderPreviewColor}` }] : []),
                          ...baseImages.map(img => ({ url: img.url, alt: img.alt || pd.name })),
                        ].filter((img, idx, arr) => arr.findIndex(x => x.url === img.url) === idx);

                        const safeIndex = Math.min(
                          selectedOrderPreviewImageIndex,
                          Math.max(0, previewImages.length - 1)
                        );
                        const activeImage = previewImages[safeIndex];

                        return (
                          <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <div className="grid grid-cols-1 md:grid-cols-2">
                              <div className="relative bg-gray-100">
                                <div className="relative aspect-square">
                                  {activeImage ? (
                                    <Image
                                      src={activeImage.url}
                                      alt={activeImage.alt || pd.name}
                                      fill
                                      className="object-contain bg-white"
                                      sizes="(max-width: 768px) 100vw, 50vw"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <span className="text-sm text-gray-500">No images saved for this product</span>
                                    </div>
                                  )}
                                </div>

                                {previewImages.length > 1 && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setSelectedOrderPreviewImageIndex((i) =>
                                          (i - 1 + previewImages.length) % previewImages.length
                                        )
                                      }
                                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow"
                                      aria-label="Previous image"
                                    >
                                      <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                      </svg>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setSelectedOrderPreviewImageIndex((i) => (i + 1) % previewImages.length)
                                      }
                                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow"
                                      aria-label="Next image"
                                    >
                                      <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                      </svg>
                                    </button>
                                  </>
                                )}
                              </div>

                              <div className="p-4">
                                <div className="text-sm font-medium text-gray-900 mb-2">Colours</div>
                                <div className="flex flex-wrap gap-2 mb-4">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedOrderPreviewColor('');
                                      setSelectedOrderPreviewImageIndex(0);
                                    }}
                                    className={`px-3 py-1.5 text-xs rounded-full border ${
                                      selectedOrderPreviewColor === ''
                                        ? 'border-purple-600 bg-purple-50 text-purple-700'
                                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                    }`}
                                  >
                                    All
                                  </button>
                                  {(pd.colors || []).map((c) => (
                                    <button
                                      type="button"
                                      key={c.name}
                                      onClick={() => {
                                        setSelectedOrderPreviewColor(c.name);
                                        setSelectedOrderPreviewImageIndex(0);
                                      }}
                                      className={`flex items-center gap-2 px-2 py-1.5 rounded-full border text-xs ${
                                        selectedOrderPreviewColor === c.name
                                          ? 'border-purple-600 bg-purple-50'
                                          : 'border-gray-300 hover:bg-gray-50'
                                      }`}
                                      aria-label={`Filter images by ${c.name}`}
                                      title={c.name}
                                    >
                                      <span className="w-4 h-4 rounded-full border border-gray-300" style={{ backgroundColor: c.hexCode }} />
                                      <span className="max-w-[140px] truncate text-gray-800">{c.name}</span>
                                    </button>
                                  ))}
                                </div>

                                {previewImages.length > 1 && (
                                  <>
                                    <div className="text-sm font-medium text-gray-900 mb-2">Images</div>
                                    <div className="flex gap-2 overflow-x-auto pb-2">
                                      {previewImages.map((img, idx) => (
                                        <button
                                          type="button"
                                          key={img.url}
                                          onClick={() => setSelectedOrderPreviewImageIndex(idx)}
                                          className={`relative w-16 h-16 rounded-lg overflow-hidden border ${
                                            idx === safeIndex
                                              ? 'border-purple-600'
                                              : 'border-gray-200 hover:border-gray-400'
                                          }`}
                                          aria-label={`Select image ${idx + 1}`}
                                        >
                                          <Image
                                            src={img.url}
                                            alt={img.alt || pd.name}
                                            fill
                                            className="object-cover"
                                            sizes="64px"
                                          />
                                        </button>
                                      ))}
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Customer Information */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">Customer Information</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Name:</span> {selectedOrder.firstName} {selectedOrder.lastName}
                      </div>
                      <div>
                        <span className="font-medium">Email:</span> {selectedOrder.email}
                      </div>
                      <div>
                        <span className="font-medium">Phone:</span> {selectedOrder.phone}
                      </div>
                      <div>
                        <span className="font-medium">Preferred Contact:</span> {selectedOrder.preferredContact}
                      </div>
                      <div>
                        <span className="font-medium">Company:</span> {selectedOrder.company || 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">Address:</span> {selectedOrder.address}, {selectedOrder.city}, {selectedOrder.province} {selectedOrder.postalCode}
                      </div>
                    </div>
                  </div>

                  {/* Order Details */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">Order Details</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Product:</span> {selectedOrder.productDetails ? selectedOrder.productDetails.name : selectedOrder.selectedProduct}
                      </div>
                      {selectedOrder.productDetails && (
                        <>
                          <div>
                            <span className="font-medium">Product Description:</span> {selectedOrder.productDetails.description}
                          </div>
                          <div>
                            <span className="font-medium">Category:</span> {selectedOrder.productDetails.category}
                          </div>
                          <div>
                            <span className="font-medium">Gender:</span> {selectedOrder.productDetails.gender}
                          </div>
                          <div>
                            <span className="font-medium">Base Price:</span> £{selectedOrder.productDetails.price}
                          </div>
                        </>
                      )}
                      <div>
                        <span className="font-medium">Total Quantity:</span> {Object.values(selectedOrder.sizeQuantities || {}).reduce((colorSum, colorQuantities) => {
                          return (
                            colorSum +
                            Object.values(colorQuantities).reduce((sizeSum, qty) => sizeSum + (Number(qty) || 0), 0)
                          );
                        }, 0)}
                      </div>
                      <div>
                        <span className="font-medium">Size Breakdown:</span>
                        {selectedOrder.sizeQuantities ? (
                          <div className="mt-1 space-y-2">
                            {Object.entries(selectedOrder.sizeQuantities).map(([color, colorQuantities]) => (
                              <div key={color} className="text-sm">
                                <span className="font-medium text-gray-700">{color}:</span>
                                <div className="ml-2">
                                  {Object.entries(colorQuantities).map(([size, qty]) => qty > 0 ? (
                                    <div key={size} className="text-gray-600">
                                      {size}: {qty} items
                                    </div>
                                  ) : null).filter(Boolean)}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          'N/A'
                        )}
                      </div>
                      <div>
                        <span className="font-medium">Colors:</span> {Array.isArray(selectedOrder.selectedColors) ? selectedOrder.selectedColors.join(', ') : selectedOrder.selectedColors}
                      </div>
                      <div>
                        <span className="font-medium">Printing Type:</span> {selectedOrder.printingType}
                      </div>
                      <div>
                        <span className="font-medium">Printing Surface:</span> {Array.isArray(selectedOrder.printingSurface) ? selectedOrder.printingSurface.join(', ') : selectedOrder.printingSurface}
                      </div>
                      <div>
                        <span className="font-medium">Design Location:</span> {Array.isArray(selectedOrder.designLocation) ? selectedOrder.designLocation.join(', ') : selectedOrder.designLocation}
                      </div>
                      <div>
                        <span className="font-medium">Paper Size:</span> {selectedOrder.paperSize || 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">Custom Print Size:</span> {selectedOrder.printSize || 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">Design Assistance:</span> {selectedOrder.needsDesignAssistance ? 'Yes' : 'No'}
                      </div>
                      <div>
                        <span className="font-medium">Design Files:</span> 
                        {selectedOrder.designFiles && selectedOrder.designFiles.length > 0 ? (
                          <div className="mt-1 space-y-2">
                            {selectedOrder.designFiles.map((file, index) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-gray-900 truncate">
                                    {file.name}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type}
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2 ml-3">
                                  <a
                                    href={file.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100"
                                  >
                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                    View
                                  </a>
                                  <a
                                    href={file.url}
                                    download={file.name}
                                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-600 bg-green-50 border border-green-200 rounded hover:bg-green-100"
                                  >
                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Download
                                  </a>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          'No files uploaded'
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">Customer Notes</h4>
                    {selectedOrder.notes ? (
                      <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded border">{selectedOrder.notes}</p>
                    ) : (
                      <p className="text-sm text-gray-500 italic bg-gray-50 p-3 rounded border">No additional notes provided</p>
                    )}
                  </div>

                  {/* Payment Status */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">Payment Status</h4>
                    <div className="bg-gray-50 p-4 rounded border">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm font-medium text-gray-600">Status:</span>
                          <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
                            selectedOrder.paymentStatus === 'completed' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {selectedOrder.paymentStatus === 'completed' ? 'Paid' : 'Pending'}
                          </span>
                        </div>
                        {selectedOrder.paymentId && (
                          <div>
                            <span className="text-sm font-medium text-gray-600">Payment ID:</span>
                            <span className="ml-2 text-sm text-gray-700 font-mono">{selectedOrder.paymentId}</span>
                          </div>
                        )}
                        {selectedOrder.paymentCompletedAt && (
                          <div>
                            <span className="text-sm font-medium text-gray-600">Paid At:</span>
                            <span className="ml-2 text-sm text-gray-700">
                              {formatDate(selectedOrder.paymentCompletedAt)}
                            </span>
                          </div>
                        )}
                        {selectedOrder.paymentLink && (
                          <div>
                            <span className="text-sm font-medium text-gray-600">Payment Link:</span>
                            <a 
                              href={selectedOrder.paymentLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="ml-2 text-sm text-blue-600 hover:underline"
                            >
                              View Link
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">Actions</h4>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => generateInvoice(selectedOrder)}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center space-x-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>Generate Invoice</span>
                      </button>
                      <button
                        onClick={() => deleteOrder(selectedOrder)}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                      >
                        Delete Order
                      </button>
                    </div>
                  </div>

                  {/* Status Update */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">Update Status</h4>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => updateOrderStatus(selectedOrder._id, 'pending')}
                        className={`px-3 py-1 text-xs rounded-full ${
                          selectedOrder.status === 'pending' 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-gray-100 text-gray-800 hover:bg-yellow-100 hover:text-yellow-800'
                        }`}
                      >
                        Pending
                      </button>
                      <button
                        onClick={() => updateOrderStatus(selectedOrder._id, 'in-progress')}
                        className={`px-3 py-1 text-xs rounded-full ${
                          selectedOrder.status === 'in-progress' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-gray-100 text-gray-800 hover:bg-blue-100 hover:text-blue-800'
                        }`}
                      >
                        In Progress
                      </button>
                      <button
                        onClick={() => updateOrderStatus(selectedOrder._id, 'completed')}
                        className={`px-3 py-1 text-xs rounded-full ${
                          selectedOrder.status === 'completed' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800 hover:bg-green-100 hover:text-green-800'
                        }`}
                      >
                        Completed
                      </button>
                      <button
                        onClick={() => updateOrderStatus(selectedOrder._id, 'cancelled')}
                        className={`px-3 py-1 text-xs rounded-full ${
                          selectedOrder.status === 'cancelled' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-gray-100 text-gray-800 hover:bg-red-100 hover:text-red-800'
                        }`}
                      >
                        Cancelled
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Invoice Modal */}
        {showInvoiceModal && invoiceData && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 xl:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Invoice Preview</h3>
                  <button
                    onClick={() => setShowInvoiceModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Invoice Header - Using existing layout */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-2xl font-bold text-indigo-600">MR SHIRT PERSONALISATION LTD</h2>
                      <p className="text-gray-600">Custom Clothing Solutions</p>
                      <p className="text-gray-600">Email: admin@mrshirtpersonalisation.co.uk</p>
                      <p className="text-gray-600">Phone: +447902870824</p>
                    </div>
                    <div className="text-right">
                      <h3 className="text-lg font-semibold text-gray-900">INVOICE</h3>
                      <p className="text-sm text-gray-600">Invoice #: {invoiceData.invoiceNumber}</p>
                      <p className="text-sm text-gray-600">Date: {invoiceData.invoiceDate}</p>
                      <p className="text-sm text-gray-600">Due: {invoiceData.dueDate}</p>
                    </div>
                  </div>

                  {/* Bill To */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-2">Bill To:</h4>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <p className="font-medium">{invoiceData.customer.name}</p>
                      {invoiceData.customer.company && <p>{invoiceData.customer.company}</p>}
                      <p>{invoiceData.customer.address.street}</p>
                      <p>{invoiceData.customer.address.city}, {invoiceData.customer.address.province} {invoiceData.customer.address.postalCode}</p>
                      <p>Email: {invoiceData.customer.email}</p>
                      <p>Phone: {invoiceData.customer.phone}</p>
                    </div>
                  </div>

                  {/* Product Details */}
                  {invoiceData.product && (
                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-2">Product Details:</h4>
                      <div className="bg-gray-50 p-4 rounded-md">
                        <p className="font-medium">{invoiceData.product.name}</p>
                        <p className="text-sm text-gray-600">{invoiceData.product.description}</p>
                        <p className="text-sm text-gray-600">Category: {invoiceData.product.category}</p>
                        <p className="text-sm text-gray-600">Gender: {invoiceData.product.gender}</p>
                      </div>
                    </div>
                  )}

                  {/* Invoice Items with Editable Pricing */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-2">Items:</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {invoiceData.items.map((item: any, index: number) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.description}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.quantity}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={item.unitPrice}
                                  onChange={(e) => {
                                    const newUnitPrice = parseFloat(e.target.value) || 0;
                                    const newTotal = newUnitPrice * item.quantity;
                                    const newSubtotal = newTotal;
                                    const newVatAmount = newSubtotal * 0.20;
                                    const newGrandTotal = newSubtotal + newVatAmount;
                                    
                                    setInvoiceData({
                                      ...invoiceData,
                                      items: invoiceData.items.map((itm: any, idx: number) => 
                                        idx === index ? { ...itm, unitPrice: newUnitPrice, total: newTotal } : itm
                                      ),
                                      pricing: {
                                        ...invoiceData.pricing,
                                        subtotal: newSubtotal,
                                        vatAmount: newVatAmount,
                                        total: newGrandTotal
                                      }
                                    });
                                  }}
                                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">£{item.total.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Pricing Summary */}
                  <div className="flex justify-end">
                    <div className="w-64">
                      <div className="flex justify-between py-2">
                        <span className="text-sm text-gray-600">Subtotal:</span>
                        <span className="text-sm font-medium">£{invoiceData.pricing.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-sm text-gray-600">VAT ({invoiceData.pricing.vatRate}%):</span>
                        <span className="text-sm font-medium">£{invoiceData.pricing.vatAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between py-2 border-t border-gray-200">
                        <span className="text-base font-semibold text-gray-900">Total:</span>
                        <span className="text-base font-semibold text-gray-900">£{invoiceData.pricing.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {invoiceData.notes && (
                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-2">Notes:</h4>
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded border">{invoiceData.notes}</p>
                    </div>
                  )}

                  {/* Payment Link Section */}
                  {paymentLink ? (
                    <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
                      <h4 className="text-sm font-medium text-green-800 mb-2">Payment Link Generated</h4>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={paymentLink}
                          readOnly
                          className="flex-1 px-3 py-2 text-sm border border-green-300 rounded-md bg-white"
                        />
                        <button
                          onClick={() => navigator.clipboard.writeText(paymentLink)}
                          className="px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                        >
                          Copy
                        </button>
                        <button
                          onClick={() => window.open(paymentLink, '_blank')}
                          className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          Open
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-4">
                      <button
                        onClick={generatePaymentLink}
                        disabled={generatingPaymentLink}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {generatingPaymentLink ? 'Generating...' : 'Generate Payment Link'}
                      </button>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => setShowInvoiceModal(false)}
                      className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          console.log('Generating invoice:', invoiceData);
                          
                          // Generate the PDF with payment link if available
                          const pdfData = {
                            ...invoiceData,
                            paymentLink: paymentLink
                          };
                          const pdfDoc = await generateCustomOrderInvoicePDF(pdfData);
                          
                          // Save invoice data to database
                          try {
                            if (!selectedOrder) return;
                            await fetch(`/api/custom-orders/${selectedOrder._id}`, {
                              method: 'PUT',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({
                                invoiceData: pdfData,
                                paymentLink: paymentLink
                              }),
                            });
                          } catch (error) {
                            console.error('Failed to save invoice data:', error);
                          }
                          
                          // Download the PDF
                          const fileName = `invoice-${invoiceData.invoiceNumber}.pdf`;
                          pdfDoc.save(fileName);
                          
                          // Close the modal
                          setShowInvoiceModal(false);
                        } catch (error) {
                          console.error('Error generating invoice:', error);
                          alert('Error generating invoice. Please try again.');
                        }
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Generate & Download
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
