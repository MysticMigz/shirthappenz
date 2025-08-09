"use client";

import { useEffect, useState } from "react";
import { FaEye, FaEyeSlash, FaSave, FaUndo, FaSort, FaEdit, FaCheck, FaTimes, FaInfoCircle } from "react-icons/fa";

interface CategoryVisibility {
  _id: string;
  category: string;
  isVisible: boolean;
  displayName: string;
  description: string;
  sortOrder: number;
  genderVisibility: {
    men: boolean;
    women: boolean;
    unisex: boolean;
    kids: boolean;
  };
  updatedBy: string;
  updatedAt: string;
}

interface CategoryDisplay {
  key: string;
  label: string;
  icon: string;
  defaultVisible: boolean;
}

export default function CategoryVisibilityPage() {
  const [categories, setCategories] = useState<CategoryVisibility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<CategoryVisibility>>({});
  const [showPreview, setShowPreview] = useState(false);

  // Default category definitions
  const defaultCategories: CategoryDisplay[] = [
    { key: 'tshirts', label: 'T-Shirts', icon: '👕', defaultVisible: true },
    { key: 'jerseys', label: 'Jerseys', icon: '🏈', defaultVisible: true },
    { key: 'tanktops', label: 'Tank Tops', icon: '🎽', defaultVisible: true },
    { key: 'longsleeve', label: 'Long Sleeve', icon: '👔', defaultVisible: true },
    { key: 'hoodies', label: 'Hoodies', icon: '🧥', defaultVisible: true },
    { key: 'sweatshirts', label: 'Sweatshirts', icon: '🧶', defaultVisible: true },
    { key: 'sweatpants', label: 'Sweatpants', icon: '👖', defaultVisible: true },
    { key: 'accessories', label: 'Accessories', icon: '👜', defaultVisible: true },
    { key: 'shortsleeve', label: 'Short Sleeve', icon: '👚', defaultVisible: true },
  ];

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/category-visibility');
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      const data = await response.json();
      
      // Merge with default categories to ensure all are present
      const mergedCategories = defaultCategories.map(defaultCat => {
        const existing = data.categories.find((cat: CategoryVisibility) => cat.category === defaultCat.key);
        if (existing) {
          return existing;
        } else {
          // Create default entry for missing categories
          return {
            _id: `temp-${defaultCat.key}`,
            category: defaultCat.key,
            isVisible: defaultCat.defaultVisible,
            displayName: defaultCat.label,
            description: '',
            sortOrder: defaultCategories.findIndex(c => c.key === defaultCat.key),
            genderVisibility: {
              men: true,
              women: true,
              unisex: true,
              kids: true
            },
            updatedBy: 'System',
            updatedAt: new Date().toISOString()
          };
        }
      });
      
      setCategories(mergedCategories);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVisibility = async (categoryKey: string) => {
    try {
      const category = categories.find(cat => cat.category === categoryKey);
      if (!category) return;

      const updatedCategory = { ...category, isVisible: !category.isVisible };
      
      const response = await fetch('/api/admin/category-visibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCategory)
      });

      if (!response.ok) {
        throw new Error('Failed to update category');
      }

      setCategories(categories.map(cat => 
        cat.category === categoryKey ? updatedCategory : cat
      ));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleToggleGenderVisibility = async (categoryKey: string, gender: string) => {
    try {
      const category = categories.find(cat => cat.category === categoryKey);
      if (!category) return;

      const updatedGenderVisibility = {
        ...category.genderVisibility,
        [gender]: !category.genderVisibility[gender as keyof typeof category.genderVisibility]
      };

      const updatedCategory = { 
        ...category, 
        genderVisibility: updatedGenderVisibility 
      };
      
      const response = await fetch('/api/admin/category-visibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCategory)
      });

      if (!response.ok) {
        throw new Error('Failed to update category');
      }

      setCategories(categories.map(cat => 
        cat.category === categoryKey ? updatedCategory : cat
      ));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const startEditing = (category: CategoryVisibility) => {
    setEditingCategory(category.category);
    setEditForm({
      displayName: category.displayName,
      description: category.description,
      sortOrder: category.sortOrder
    });
  };

  const cancelEditing = () => {
    setEditingCategory(null);
    setEditForm({});
  };

  const saveEdit = async (categoryKey: string) => {
    try {
      const category = categories.find(cat => cat.category === categoryKey);
      if (!category) return;

      const updatedCategory = { ...category, ...editForm };
      
      const response = await fetch('/api/admin/category-visibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCategory)
      });

      if (!response.ok) {
        throw new Error('Failed to update category');
      }

      setCategories(categories.map(cat => 
        cat.category === categoryKey ? updatedCategory : cat
      ));
      setEditingCategory(null);
      setEditForm({});
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSortOrderChange = async (categoryKey: string, newSortOrder: number) => {
    try {
      const category = categories.find(cat => cat.category === categoryKey);
      if (!category) return;

      const updatedCategory = { ...category, sortOrder: newSortOrder };
      
      const response = await fetch('/api/admin/category-visibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCategory)
      });

      if (!response.ok) {
        throw new Error('Failed to update category');
      }

      setCategories(categories.map(cat => 
        cat.category === categoryKey ? updatedCategory : cat
      ));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const saveAllChanges = async () => {
    try {
      setSaving(true);
      
      // Filter out temporary IDs and prepare updates
      const updates = categories
        .filter(cat => !cat._id.startsWith('temp-'))
        .map(cat => ({
          category: cat.category,
          isVisible: cat.isVisible,
          displayName: cat.displayName,
          description: cat.description,
          sortOrder: cat.sortOrder,
          genderVisibility: cat.genderVisibility
        }));

      const response = await fetch('/api/admin/category-visibility', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates })
      });

      if (!response.ok) {
        throw new Error('Failed to save changes');
      }

      // Refresh categories to get updated data
      await fetchCategories();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const getCategoryIcon = (categoryKey: string) => {
    const defaultCat = defaultCategories.find(cat => cat.key === categoryKey);
    return defaultCat?.icon || '📦';
  };

  const getGenderLabel = (gender: string) => {
    const labels: Record<string, string> = {
      men: 'Men',
      women: 'Women',
      unisex: 'Unisex',
      kids: 'Kids'
    };
    return labels[gender] || gender;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading category settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Category Visibility Management</h1>
          <p className="text-gray-600">
            Control which product categories are visible on the store and customize their display settings.
          </p>
        </div>

        {/* Action Bar */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              {showPreview ? <FaEyeSlash /> : <FaEye />}
              {showPreview ? 'Hide Preview' : 'Show Store Preview'}
            </button>
            <span className="text-sm text-gray-500">
              {categories.filter(cat => cat.isVisible).length} of {categories.length} categories visible
            </span>
          </div>
          
          <button
            onClick={saveAllChanges}
            disabled={saving}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            <FaSave />
            {saving ? 'Saving...' : 'Save All Changes'}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-red-800">
              <FaInfoCircle />
              <span className="font-medium">Error:</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Categories Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {categories
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((category) => (
            <div key={category.category} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Category Header */}
              <div className={`p-4 ${category.isVisible ? 'bg-green-50 border-b border-green-200' : 'bg-gray-50 border-b border-gray-200'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getCategoryIcon(category.category)}</span>
                    <div>
                      <h3 className="font-semibold text-gray-900">{category.displayName}</h3>
                      <p className="text-sm text-gray-500">{category.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleVisibility(category.category)}
                      className={`p-2 rounded-lg transition-colors ${
                        category.isVisible 
                          ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-300'
                      }`}
                      title={category.isVisible ? 'Hide category' : 'Show category'}
                    >
                      {category.isVisible ? <FaEye /> : <FaEyeSlash />}
                    </button>
                    <button
                      onClick={() => startEditing(category)}
                      className="p-2 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                      title="Edit category"
                    >
                      <FaEdit />
                    </button>
                  </div>
                </div>

                {/* Visibility Status */}
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    category.isVisible 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {category.isVisible ? 'Visible on Store' : 'Hidden from Store'}
                  </span>
                  <span className="text-xs text-gray-500">
                    Updated by {category.updatedBy}
                  </span>
                </div>
              </div>

              {/* Category Content */}
              <div className="p-4">
                {/* Description */}
                {editingCategory === category.category ? (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={editForm.displayName || ''}
                      onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                ) : (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">
                      {category.description || 'No description available'}
                    </p>
                  </div>
                )}

                {/* Sort Order */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort Order
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={category.sortOrder}
                      onChange={(e) => handleSortOrderChange(category.category, parseInt(e.target.value) || 0)}
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      min="0"
                    />
                    <FaSort className="text-gray-400" />
                  </div>
                </div>

                {/* Gender Visibility */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender Visibility
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(category.genderVisibility).map(([gender, isVisible]) => (
                      <button
                        key={gender}
                        onClick={() => handleToggleGenderVisibility(category.category, gender)}
                        className={`p-2 rounded-lg text-xs font-medium transition-colors ${
                          isVisible 
                            ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {getGenderLabel(gender)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Edit Actions */}
                {editingCategory === category.category && (
                  <div className="flex gap-2 pt-3 border-t border-gray-200">
                    <button
                      onClick={() => saveEdit(category.category)}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 flex items-center gap-1"
                    >
                      <FaCheck />
                      Save
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 flex items-center gap-1"
                    >
                      <FaTimes />
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Store Preview */}
        {showPreview && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Store Preview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories
                .filter(cat => cat.isVisible)
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((category) => (
                <div key={category.category} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getCategoryIcon(category.category)}</span>
                    <div>
                      <h3 className="font-medium text-gray-900">{category.displayName}</h3>
                      <p className="text-sm text-gray-500">
                        Visible for: {Object.entries(category.genderVisibility)
                          .filter(([_, visible]) => visible)
                          .map(([gender, _]) => getGenderLabel(gender))
                          .join(', ')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <FaInfoCircle />
            How to Use
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <h3 className="font-medium mb-2">Visibility Controls</h3>
              <ul className="space-y-1">
                <li>• Use the eye icon to show/hide categories from the store</li>
                <li>• Hidden categories won't appear to customers</li>
                <li>• Changes take effect immediately on the store</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-2">Gender Targeting</h3>
              <ul className="space-y-1">
                <li>• Control which genders can see each category</li>
                <li>• Useful for gender-specific product lines</li>
                <li>• Unisex categories can be visible to all</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
