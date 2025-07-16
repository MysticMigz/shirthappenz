'use client';

import { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { FaUsers, FaUserPlus, FaChartPie, FaShoppingBag } from 'react-icons/fa';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface CustomerData {
  summary: {
    totalCustomers: number;
    newCustomers: number;
    uniqueCustomers: number;
    repeatCustomers: number;
    repeatRate: number;
    averageOrderValue: number;
    averageOrdersPerCustomer: number;
  };
  spendingTiers: {
    low: number;
    medium: number;
    high: number;
  };
  dailyNewCustomers: Array<{
    date: string;
    count: number;
  }>;
  uniqueVisitors: number;
  guestOrders: number;
  registeredOrders: number;
  visitorToRegistered: number;
  ltvBuckets: {
    [key: string]: number;
  };
  ordersPerCustomerBuckets: {
    [key: string]: number;
  };
  topCustomers: Array<{
    userId: string;
    total: number;
  }>;
  geoCounts: {
    [key: string]: number;
  };
}

export default function CustomerInsightsPage() {
  const [filterType, setFilterType] = useState<'day' | 'week' | 'month' | 'year'>('week');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomerData();
  }, [filterType, selectedDate]);

  const fetchCustomerData = async () => {
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
      const response = await fetch(`/api/admin/analytics/customers?filterType=${filterType}&startDate=${startDate}&endDate=${endDate}`);
      if (!response.ok) throw new Error('Failed to fetch customer data');
      const data = await response.json();
      setCustomerData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch customer data');
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

  if (!customerData) return null;

  const newCustomersChartData = {
    labels: customerData.dailyNewCustomers.map(d => d.date),
    datasets: [
      {
        label: 'New Customers',
        data: customerData.dailyNewCustomers.map(d => d.count),
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        fill: true,
      },
    ],
  };

  const spendingTiersChartData = {
    labels: ['Low Spenders (£0-50)', 'Medium Spenders (£51-200)', 'High Spenders (£200+)'],
    datasets: [
      {
        data: [
          customerData.spendingTiers.low,
          customerData.spendingTiers.medium,
          customerData.spendingTiers.high,
        ],
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
        ],
      },
    ],
  };

  // Pie chart: Unique Visitors vs. Registered Customers
  const uniqueVsRegisteredChartData = {
    labels: ['Unique Visitors', 'Registered Customers'],
    datasets: [
      {
        data: [customerData.uniqueVisitors, customerData.summary.totalCustomers],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)', // blue
          'rgba(239, 68, 68, 0.8)', // red
        ],
      },
    ],
  };

  // Pie chart: Guest Orders vs. Registered Orders
  const guestVsRegisteredOrdersChartData = {
    labels: ['Guest Orders', 'Registered Orders'],
    datasets: [
      {
        data: [customerData.guestOrders, customerData.registeredOrders],
        backgroundColor: [
          'rgba(245, 158, 11, 0.8)', // orange
          'rgba(59, 130, 246, 0.8)', // blue
        ],
      },
    ],
  };

  // Pie chart: Visitor-to-Registered Conversion
  const visitorConversionChartData = {
    labels: ['Converted to Registered', 'Not Converted'],
    datasets: [
      {
        data: [customerData.visitorToRegistered, customerData.uniqueVisitors - customerData.visitorToRegistered],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)', // green
          'rgba(156, 163, 175, 0.8)', // gray
        ],
      },
    ],
  };

  // Pie chart: LTV Distribution
  const ltvChartData = {
    labels: Object.keys(customerData.ltvBuckets),
    datasets: [
      {
        data: Object.values(customerData.ltvBuckets),
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
        ],
      },
    ],
  };

  // Pie chart: Orders per Customer
  const ordersPerCustomerChartData = {
    labels: Object.keys(customerData.ordersPerCustomerBuckets),
    datasets: [
      {
        data: Object.values(customerData.ordersPerCustomerBuckets),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(16, 185, 129, 0.8)',
        ],
      },
    ],
  };

  // Pie chart: Top 5 Customers by Revenue
  const topCustomersChartData = {
    labels: customerData.topCustomers.map(c => c.userId),
    datasets: [
      {
        data: customerData.topCustomers.map(c => c.total),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(147, 51, 234, 0.8)',
        ],
      },
    ],
  };

  // Pie chart: Repeat vs. New Customers
  const repeatVsNewChartData = {
    labels: ['Repeat Customers', 'New Customers'],
    datasets: [
      {
        data: [customerData.summary.repeatCustomers, customerData.summary.uniqueCustomers - customerData.summary.repeatCustomers],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
      },
    ],
  };

  // Pie chart: Geographic Distribution (top 5 cities)
  const geoEntries = Object.entries(customerData.geoCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const geoChartData = {
    labels: geoEntries.map(([city]) => city),
    datasets: [
      {
        data: geoEntries.map(([, count]) => count),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(147, 51, 234, 0.8)',
        ],
      },
    ],
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Customer Insights</h1>
        <p className="mt-2 text-gray-600">Analyze customer behavior and demographics</p>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Total Customers</h2>
            <FaUsers className="text-blue-500 text-xl" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {customerData.summary.totalCustomers}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {customerData.summary.newCustomers} new in this period
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Repeat Rate</h2>
            <FaUserPlus className="text-green-500 text-xl" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {customerData.summary.repeatRate.toFixed(1)}%
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {customerData.summary.repeatCustomers} repeat customers
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Avg Order Value</h2>
            <FaChartPie className="text-purple-500 text-xl" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {formatCurrency(customerData.summary.averageOrderValue)}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Per customer order
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Orders/Customer</h2>
            <FaShoppingBag className="text-orange-500 text-xl" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {customerData.summary.averageOrdersPerCustomer.toFixed(1)}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Average orders per customer
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* New Customers Trend */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">New Customers Trend</h2>
          <div className="h-80">
            <Line
              data={newCustomersChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      stepSize: 1,
                    },
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

        {/* Customer Spending Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Spending Distribution</h2>
          <div className="h-80">
            <Doughnut
              data={spendingTiersChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Unique Visitors vs Registered Customers */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Unique Visitors vs Registered Customers</h2>
          <div className="h-80">
            <Doughnut
              data={uniqueVsRegisteredChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Guest Orders vs Registered Orders */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Guest Orders vs Registered Orders</h2>
          <div className="h-80">
            <Doughnut
              data={guestVsRegisteredOrdersChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Visitor-to-Registered Conversion */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Visitor-to-Registered Conversion</h2>
          <div className="h-80">
            <Doughnut
              data={visitorConversionChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                  },
                },
              }}
            />
          </div>
        </div>

        {/* LTV Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Lifetime Value (LTV) Distribution</h2>
          <div className="h-80">
            <Doughnut
              data={ltvChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Orders per Customer */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Orders per Customer</h2>
          <div className="h-80">
            <Doughnut
              data={ordersPerCustomerChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Top 5 Customers by Revenue */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top 5 Customers by Revenue</h2>
          <div className="h-80">
            <Doughnut
              data={topCustomersChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Repeat vs New Customers */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Repeat vs New Customers</h2>
          <div className="h-80">
            <Doughnut
              data={repeatVsNewChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Geographic Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Cities (Orders)</h2>
          <div className="h-80">
            <Doughnut
              data={geoChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                  },
                },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 