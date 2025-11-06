'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface SiteSetting {
  _id: string;
  key: string;
  value: boolean | string | number;
  description?: string;
  updatedBy: string;
  updatedAt: string;
}

export default function SiteSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [settings, setSettings] = useState<SiteSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/site-settings');
      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }
      const data = await response.json();
      setSettings(data.settings || []);
      
      // If productsEnabled doesn't exist, create it with default value
      if (!data.settings || !data.settings.find((s: SiteSetting) => s.key === 'productsEnabled')) {
        await initializeProductsEnabled();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const initializeProductsEnabled = async () => {
    try {
      const response = await fetch('/api/admin/site-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'productsEnabled',
          value: true,
          description: 'Enable or disable the products section for customers'
        })
      });
      if (response.ok) {
        await fetchSettings();
      }
    } catch (err) {
      console.error('Error initializing productsEnabled setting:', err);
    }
  };

  const updateSetting = async (key: string, value: boolean) => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/admin/site-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key,
          value,
          description: key === 'productsEnabled' 
            ? 'Enable or disable the products section for customers'
            : ''
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update setting');
      }

      const data = await response.json();
      
      // Update local state
      setSettings(prev => {
        const existing = prev.find(s => s.key === key);
        if (existing) {
          return prev.map(s => s.key === key ? { ...s, value } : s);
        } else {
          return [...prev, data.setting];
        }
      });

      setSuccess(`Setting updated successfully! Products are now ${value ? 'enabled' : 'disabled'} for customers.`);
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  const getSettingValue = (key: string): boolean => {
    const setting = settings.find(s => s.key === key);
    if (!setting) return true; // Default to enabled
    return setting.value as boolean;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading site settings...</p>
          </div>
        </div>
      </div>
    );
  }

  const productsEnabled = getSettingValue('productsEnabled');

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Site Settings</h1>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
              {success}
            </div>
          )}

          {/* Products Section Toggle */}
          <div className="mb-8 p-6 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Products Section
                </h2>
                <p className="text-gray-600 text-sm">
                  Control whether the products section and product pages are visible to customers.
                  When disabled, customers will not be able to access the products page or view individual products.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between mt-6 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">
                  Products Enabled
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {productsEnabled 
                    ? 'Products are currently visible to customers'
                    : 'Products are currently hidden from customers'
                  }
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={productsEnabled}
                  onChange={(e) => updateSetting('productsEnabled', e.target.checked)}
                  disabled={saving}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            {!productsEnabled && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Products are currently disabled. Customers will see a "Coming Soon" message when trying to access product pages.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

