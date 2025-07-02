'use client';

import { useState, useEffect } from 'react';
import { FaUsers, FaShoppingCart, FaChartLine, FaExclamationTriangle } from 'react-icons/fa';

export default function AnalyticsPage() {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="mt-2 text-gray-600">View and analyze your business metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Customer Analytics */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Customer Analytics</h2>
            <FaUsers className="text-purple-600 text-xl" />
          </div>
          <div className="space-y-4">
            <a 
              href="/admin/analytics/customers"
              className="block p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <h3 className="font-medium text-purple-900">Customer Insights</h3>
              <p className="text-sm text-purple-700 mt-1">
                View detailed customer behavior and demographics
              </p>
            </a>
          </div>
        </div>

        {/* Sales Analytics */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Sales Analytics</h2>
            <FaShoppingCart className="text-blue-600 text-xl" />
          </div>
          <div className="space-y-4">
            <a 
              href="/admin/analytics/sales"
              className="block p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <h3 className="font-medium text-blue-900">Revenue Trends</h3>
              <p className="text-sm text-blue-700 mt-1">
                Track your sales performance and revenue metrics
              </p>
            </a>
          </div>
        </div>

        {/* Performance Analytics */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Performance</h2>
            <FaChartLine className="text-green-600 text-xl" />
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-medium text-green-900">Site Performance</h3>
              <p className="text-sm text-green-700 mt-1">
                Coming soon: Monitor website performance and user experience metrics
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Analytics Sections */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Alerts and Notifications */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Alerts</h2>
            <FaExclamationTriangle className="text-yellow-600 text-xl" />
          </div>
          <div className="p-4 bg-yellow-50 rounded-lg">
            <h3 className="font-medium text-yellow-900">System Alerts</h3>
            <p className="text-sm text-yellow-700 mt-1">
              Coming soon: View important system notifications and alerts
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 