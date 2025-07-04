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
}

export default function CustomerInsightsPage() {
  const [filterType, setFilterType] = useState<'day' | 'week' | 'month'>('week');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomerData();
  }, [filterType, selectedDate]);

  const fetchCustomerData = async () => {
    try {
      setLoading(true);
      let startDate: string, endDate: string;
      if (filterType === 'day') {
        startDate = format(selectedDate, 'yyyy-MM-dd');
        endDate = startDate;
      } else if (filterType === 'week') {
        startDate = format(startOfWeek(selectedDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
        endDate = format(endOfWeek(selectedDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      } else {
        startDate = format(startOfMonth(selectedDate), 'yyyy-MM-dd');
        endDate = format(endOfMonth(selectedDate), 'yyyy-MM-dd');
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
          onChange={e => setFilterType(e.target.value as 'day' | 'week' | 'month')}
          className="border rounded-md px-3 py-2 text-sm"
        >
          <option value="day">Day</option>
          <option value="week">Week</option>
          <option value="month">Month</option>
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
      </div>

      {/* Time Period Selector */}
      <div className="mb-8">
        <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
          {['week', 'month', 'year'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p as 'week' | 'month' | 'year')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                period === p
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
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
      </div>
    </div>
  );
} 