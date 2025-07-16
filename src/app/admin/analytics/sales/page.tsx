'use client';

import { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { FaChartLine, FaChartBar, FaChartPie } from 'react-icons/fa';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

interface SalesData {
  revenueData: Array<{ date: string; amount: number }>;
  productData: Array<{ name: string; quantity: number }>;
  categoryData?: Array<{ category: string; quantity: number; revenue: number }>;
  repeatVsNewData?: {
    new: { orders: number; revenue: number };
    repeat: { orders: number; revenue: number };
  };
  summary: {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
  };
}

export default function SalesAnalyticsPage() {
  const [filterType, setFilterType] = useState<'day' | 'week' | 'month' | 'year'>('week');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [salesData, setSalesData] = useState<SalesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSalesData();
  }, [filterType, selectedDate]);

  const fetchSalesData = async () => {
    try {
      setLoading(true);
      let startDate: string = '', endDate: string = '';
      if (filterType === 'day') {
        startDate = format(selectedDate, 'yyyy-MM-dd');
        endDate = startDate;
      } else if (filterType === 'week') {
        startDate = format(startOfWeek(selectedDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
        endDate = format(endOfWeek(selectedDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      } else if (filterType === 'month') {
        startDate = format(startOfMonth(selectedDate), 'yyyy-MM-dd');
        endDate = format(endOfMonth(selectedDate), 'yyyy-MM-dd');
      } else if (filterType === 'year') {
        startDate = format(new Date(selectedDate.getFullYear(), 0, 1), 'yyyy-MM-dd');
        endDate = format(new Date(selectedDate.getFullYear(), 11, 31), 'yyyy-MM-dd');
      }
      const response = await fetch(`/api/admin/analytics/sales?filterType=${filterType}&startDate=${startDate}&endDate=${endDate}`);
      if (!response.ok) throw new Error('Failed to fetch sales data');
      const data = await response.json();
      setSalesData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sales data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  if (!salesData) return null;

  const revenueChartData = {
    labels: salesData.revenueData.map(d => d.date),
    datasets: [
      {
        label: 'Daily Revenue',
        data: salesData.revenueData.map(d => d.amount),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
      },
    ],
  };

  const productChartData = {
    labels: salesData.productData.slice(0, 5).map(d => d.name),
    datasets: [
      {
        label: 'Units Sold',
        data: salesData.productData.slice(0, 5).map(d => d.quantity),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(147, 51, 234, 0.8)',
          'rgba(236, 72, 153, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(16, 185, 129, 0.8)',
        ],
      },
    ],
  };

  // Pie chart for sales by category (revenue)
  const categoryChartData = salesData.categoryData && salesData.categoryData.length > 0 ? {
    labels: salesData.categoryData.map(d => d.category),
    datasets: [
      {
        label: 'Revenue by Category',
        data: salesData.categoryData.map(d => d.revenue),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)', // blue
          'rgba(147, 51, 234, 0.8)', // purple
          'rgba(236, 72, 153, 0.8)', // pink
          'rgba(245, 158, 11, 0.8)', // orange
          'rgba(16, 185, 129, 0.8)', // green
          'rgba(239, 68, 68, 0.8)', // red
          'rgba(34, 197, 94, 0.8)', // emerald
        ],
      },
    ],
  } : null;

  // Pie charts for repeat vs. new customers
  const repeatVsNewOrderChartData = salesData.repeatVsNewData ? {
    labels: ['New Customers', 'Repeat Customers'],
    datasets: [
      {
        label: 'Orders',
        data: [salesData.repeatVsNewData.new.orders, salesData.repeatVsNewData.repeat.orders],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)', // blue
          'rgba(245, 158, 11, 0.8)', // orange
        ],
      },
    ],
  } : null;

  const repeatVsNewRevenueChartData = salesData.repeatVsNewData ? {
    labels: ['New Customers', 'Repeat Customers'],
    datasets: [
      {
        label: 'Revenue',
        data: [salesData.repeatVsNewData.new.revenue, salesData.repeatVsNewData.repeat.revenue],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)', // blue
          'rgba(245, 158, 11, 0.8)', // orange
        ],
      },
    ],
  } : null;

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Sales Analytics</h1>
        <p className="mt-2 text-gray-600">Track your sales performance and revenue metrics</p>
      </div>

      {/* Filter UI */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center gap-4">
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value as 'day' | 'week' | 'month' | 'year')}
          className="border rounded-md px-3 py-2 text-sm"
        >
          <option value="day">Day</option>
          <option value="week">Week</option>
          <option value="month">Month</option>
          <option value="year">Year</option>
        </select>
        <input
          type="date"
          value={format(selectedDate, 'yyyy-MM-dd')}
          onChange={e => setSelectedDate(new Date(e.target.value))}
          className="border rounded-md px-3 py-2 text-sm"
        />
        {filterType === 'week' && (
          <span className="text-gray-500 text-sm">Week of {format(startOfWeek(selectedDate, { weekStartsOn: 1 }), 'dd MMM yyyy')}</span>
        )}
        {filterType === 'month' && (
          <span className="text-gray-500 text-sm">{format(selectedDate, 'MMMM yyyy')}</span>
        )}
        {filterType === 'year' && (
          <span className="text-gray-500 text-sm">{selectedDate.getFullYear()}</span>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Total Revenue</h2>
            <FaChartLine className="text-blue-500 text-xl" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {formatCurrency(salesData.summary.totalRevenue)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Total Orders</h2>
            <FaChartBar className="text-purple-500 text-xl" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {salesData.summary.totalOrders}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Average Order Value</h2>
            <FaChartPie className="text-pink-500 text-xl" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {formatCurrency(salesData.summary.averageOrderValue)}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Trend */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h2>
          <div className="h-80">
            <Line
              data={revenueChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: (value) => formatCurrency(value as number),
                    },
                  },
                },
                plugins: {
                  legend: {
                    display: false,
                  },
                  tooltip: {
                    callbacks: {
                      label: (context) => formatCurrency(context.parsed.y),
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Products</h2>
          <div className="h-80">
            <Bar
              data={productChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                  },
                },
                plugins: {
                  legend: {
                    display: false,
                  },
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* Sales by Category Pie Chart */}
      {categoryChartData && (
        <div className="bg-white rounded-lg shadow p-6 mt-8 max-w-xl mx-auto">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FaChartPie className="text-pink-500 mr-2" /> Sales by Category
          </h2>
          <div className="h-80">
            <Doughnut
              data={categoryChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                  },
                  tooltip: {
                    callbacks: {
                      label: (context) => `${context.label}: ${formatCurrency(context.parsed)}`,
                    },
                  },
                },
              }}
            />
          </div>
        </div>
      )}

      {/* Repeat vs. New Customers Pie Charts */}
      {(repeatVsNewOrderChartData || repeatVsNewRevenueChartData) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8 max-w-4xl mx-auto">
          {repeatVsNewOrderChartData && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FaChartPie className="text-blue-500 mr-2" /> Orders: New vs. Repeat Customers
              </h2>
              <div className="h-80">
                <Doughnut
                  data={repeatVsNewOrderChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'bottom' },
                      tooltip: {
                        callbacks: {
                          label: (context) => `${context.label}: ${context.parsed}`,
                        },
                      },
                    },
                  }}
                />
              </div>
            </div>
          )}
          {repeatVsNewRevenueChartData && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FaChartPie className="text-orange-500 mr-2" /> Revenue: New vs. Repeat Customers
              </h2>
              <div className="h-80">
                <Doughnut
                  data={repeatVsNewRevenueChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'bottom' },
                      tooltip: {
                        callbacks: {
                          label: (context) => `${context.label}: ${formatCurrency(context.parsed)}`,
                        },
                      },
                    },
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sales Growth Over Time Line Chart */}
      <div className="bg-white rounded-lg shadow p-6 mt-8 max-w-3xl mx-auto">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FaChartLine className="text-green-500 mr-2" /> Sales Growth Over Time
        </h2>
        <div className="h-80">
          {revenueChartData && revenueChartData.labels.length > 0 ? (
            <Line
              data={revenueChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: (value) => formatCurrency(value as number),
                    },
                  },
                },
                plugins: {
                  legend: {
                    display: false,
                  },
                  tooltip: {
                    callbacks: {
                      label: (context) => formatCurrency(context.parsed.y),
                    },
                  },
                },
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <FaChartLine className="text-4xl mb-2" />
              <span>No sales data available for this period.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 