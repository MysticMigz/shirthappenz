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
      const existingKeys = new Set((data.settings || []).map((s: SiteSetting) => s.key));

      const booleanDefaults = [
        { key: 'productsEnabled', value: true, description: 'Enable or disable the products section for customers' },
        { key: 'registrationEnabled', value: true, description: 'Enable or disable customer account registration' },
        { key: 'promoBannersEnabled', value: true, description: 'Enable or disable animated promotional banners at the top of the site' },
        { key: 'checkoutEnabled', value: true, description: 'Enable or disable customer checkout' },
      ];

      let created = false;
      for (const setting of booleanDefaults) {
        if (!existingKeys.has(setting.key)) {
          await initializeSetting(setting.key, setting.value, setting.description);
          created = true;
        }
      }

      if (!existingKeys.has('dtfA4UnitPrice')) {
        await initializeSetting('dtfA4UnitPrice', 10, 'DTF unit price for A4 print size');
        created = true;
      }
      if (!existingKeys.has('dtfA3UnitPrice')) {
        await initializeSetting('dtfA3UnitPrice', 12.5, 'DTF unit price for A3 print size');
        created = true;
      }

      if (created) {
        const refreshed = await fetch('/api/admin/site-settings');
        if (refreshed.ok) {
          const refreshedData = await refreshed.json();
          setSettings(refreshedData.settings || []);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const SETTING_DESCRIPTIONS: Record<string, string> = {
    productsEnabled: 'Enable or disable the products section for customers',
    registrationEnabled: 'Enable or disable customer account registration',
    promoBannersEnabled: 'Enable or disable animated promotional banners at the top of the site',
    checkoutEnabled: 'Enable or disable customer checkout',
  };

  const initializeSetting = async (key: string, value: boolean | number, description: string) => {
    try {
      await fetch('/api/admin/site-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value, description })
      });
    } catch (err) {
      console.error(`Error initializing ${key} setting:`, err);
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
          description: SETTING_DESCRIPTIONS[key] || ''
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

      setSuccess(`Setting updated successfully. This feature is now ${value ? 'enabled' : 'disabled'}.`);
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

  const getNumberSettingValue = (key: string, fallback: number) => {
    const setting = settings.find(s => s.key === key);
    if (!setting) return fallback;
    const val = Number(setting.value);
    return Number.isFinite(val) ? val : fallback;
  };

  const updateNumberSetting = async (key: string, value: number, description: string) => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/admin/site-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value, description })
      });

      if (!response.ok) {
        throw new Error('Failed to update setting');
      }

      const data = await response.json();
      setSettings(prev => {
        const existing = prev.find(s => s.key === key);
        if (existing) {
          return prev.map(s => s.key === key ? { ...s, value } : s);
        }
        return [...prev, data.setting];
      });

      setSuccess('DTF pricing updated successfully.');
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(null), 5000);
    } finally {
      setSaving(false);
    }
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
  const registrationEnabled = getSettingValue('registrationEnabled');
  const promoBannersEnabled = getSettingValue('promoBannersEnabled');
  const checkoutEnabled = getSettingValue('checkoutEnabled');
  const dtfA4UnitPrice = getNumberSettingValue('dtfA4UnitPrice', 10);
  const dtfA3UnitPrice = getNumberSettingValue('dtfA3UnitPrice', 12.5);

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

          {/* Registration Toggle */}
          <div className="mb-8 p-6 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Customer Registration
                </h2>
                <p className="text-gray-600 text-sm">
                  Control whether new customers can create an account. Existing users can still log in when this is disabled.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between mt-6 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Registration Enabled</p>
                <p className="text-sm text-gray-500 mt-1">
                  {registrationEnabled
                    ? 'Customers can currently create new accounts'
                    : 'New account registration is currently disabled'}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={registrationEnabled}
                  onChange={(e) => updateSetting('registrationEnabled', e.target.checked)}
                  disabled={saving}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
          </div>

          {/* Promo Banners Toggle */}
          <div className="mb-8 p-6 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Animated Banners
                </h2>
                <p className="text-gray-600 text-sm">
                  Control the scrolling discount banner and the voucher announcement bar at the top of the site.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between mt-6 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Top Banners Enabled</p>
                <p className="text-sm text-gray-500 mt-1">
                  {promoBannersEnabled
                    ? 'Promotional banners are currently visible'
                    : 'Promotional banners are currently hidden'}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={promoBannersEnabled}
                  onChange={(e) => updateSetting('promoBannersEnabled', e.target.checked)}
                  disabled={saving}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
          </div>

          {/* Checkout Toggle */}
          <div className="mb-8 p-6 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Checkout
                </h2>
                <p className="text-gray-600 text-sm">
                  Control whether customers can complete purchases. Cart browsing can still work when checkout is disabled.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between mt-6 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Checkout Enabled</p>
                <p className="text-sm text-gray-500 mt-1">
                  {checkoutEnabled
                    ? 'Customers can currently complete checkout'
                    : 'Checkout is currently disabled for customers'}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={checkoutEnabled}
                  onChange={(e) => updateSetting('checkoutEnabled', e.target.checked)}
                  disabled={saving}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            {!checkoutEnabled && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Checkout is currently disabled. Customers will not be able to place product orders.
                </p>
              </div>
            )}
          </div>

          {/* DTF Pricing */}
          <div className="mb-8 p-6 border border-gray-200 rounded-lg">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">DTF Print Pricing</h2>
              <p className="text-gray-600 text-sm">
                These prices are used on the Custom Orders page and in custom order invoice generation.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">A4 unit price (£)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={dtfA4UnitPrice}
                  disabled={saving}
                  onBlur={(e) => {
                    const val = Number(e.target.value);
                    if (!Number.isFinite(val)) return;
                    updateNumberSetting('dtfA4UnitPrice', val, 'DTF unit price for A4 print size');
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-xs text-gray-500 mt-1">Used for A4 print size.</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">A3 unit price (£)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={dtfA3UnitPrice}
                  disabled={saving}
                  onBlur={(e) => {
                    const val = Number(e.target.value);
                    if (!Number.isFinite(val)) return;
                    updateNumberSetting('dtfA3UnitPrice', val, 'DTF unit price for A3 print size');
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-xs text-gray-500 mt-1">Used for A3 print size.</p>
              </div>
            </div>

            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                Current: <strong>A4</strong> £{dtfA4UnitPrice.toFixed(2)} • <strong>A3</strong> £{dtfA3UnitPrice.toFixed(2)}
              </p>
              <p className="text-xs text-blue-600 mt-1">Tip: change a value, then click/tap out of the field to save.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

