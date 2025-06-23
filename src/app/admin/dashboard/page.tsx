'use client';

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Dashboard</h1>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="text-sm font-medium text-gray-500">Total Products</div>
          <div className="mt-2 text-3xl font-semibold text-gray-900">24</div>
          <div className="mt-1 text-sm text-green-600">↑ 12% from last month</div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="text-sm font-medium text-gray-500">Total Orders</div>
          <div className="mt-2 text-3xl font-semibold text-gray-900">156</div>
          <div className="mt-1 text-sm text-green-600">↑ 8% from last month</div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="text-sm font-medium text-gray-500">Total Revenue</div>
          <div className="mt-2 text-3xl font-semibold text-gray-900">£4,320</div>
          <div className="mt-1 text-sm text-green-600">↑ 15% from last month</div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="text-sm font-medium text-gray-500">Active Customers</div>
          <div className="mt-2 text-3xl font-semibold text-gray-900">89</div>
          <div className="mt-1 text-sm text-green-600">↑ 5% from last month</div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="text-sm font-medium text-gray-900">New Order #1234</p>
              <p className="text-sm text-gray-500">2 T-shirts, 1 Hoodie</p>
            </div>
            <span className="text-sm text-gray-500">2 minutes ago</span>
          </div>
          
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="text-sm font-medium text-gray-900">Product Updated</p>
              <p className="text-sm text-gray-500">Classic Black Hoodie - Stock: 25</p>
            </div>
            <span className="text-sm text-gray-500">1 hour ago</span>
          </div>
          
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="text-sm font-medium text-gray-900">New Customer</p>
              <p className="text-sm text-gray-500">John Doe registered</p>
            </div>
            <span className="text-sm text-gray-500">3 hours ago</span>
          </div>
          
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-gray-900">New Review</p>
              <p className="text-sm text-gray-500">5★ review for Classic White T-Shirt</p>
            </div>
            <span className="text-sm text-gray-500">5 hours ago</span>
          </div>
        </div>
      </div>
    </div>
  );
} 