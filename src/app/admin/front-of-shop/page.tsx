'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { FaUpload, FaTrash, FaEye, FaEdit, FaSave, FaTimes } from 'react-icons/fa';
import HeroSection from '@/app/components/HeroSection';
import type { CarouselBackground as HeroCarouselBg } from '@/app/components/HeroSection';

interface CarouselBackground {
  id: string;
  slideId: number;
  title: string;
  subtitle: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  imageUrl?: string;
  bgGradient: string;
  textColor: string;
  buttonColor: string;
  buttonMarginTop?: number;
  isActive: boolean;
  order: number;
  createdAt: string;
}

const defaultEditForm = {
  title: '',
  subtitle: '',
  description: '',
  buttonText: '',
  buttonLink: '',
  bgGradient: '',
  textColor: '',
  buttonColor: '',
  order: 0,
  buttonMarginTop: 0,
};

export default function FrontOfShopPage() {
  const [backgrounds, setBackgrounds] = useState<CarouselBackground[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(defaultEditForm);
  const [selectedSlide, setSelectedSlide] = useState<number | null>(null);
  const [showSlideSelector, setShowSlideSelector] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [replacementImage, setReplacementImage] = useState<File | null>(null);
  const [replacementImagePreview, setReplacementImagePreview] = useState<string | null>(null);
  const [siteProductsEnabled, setSiteProductsEnabled] = useState(true);

  // Match homepage button labels (EXPLORE vs CUSTOM ORDERS)
  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch('/api/site-settings?key=productsEnabled');
        if (response.ok) {
          const data = await response.json();
          setSiteProductsEnabled(data.value !== false);
        }
      } catch {
        setSiteProductsEnabled(true);
      }
    };
    load();
  }, []);

  /** Value snapshot so any field change recomputes preview (not just object identity) */
  const editFormSnapshot = useMemo(() => JSON.stringify(editForm), [editForm]);

  /** Live preview data: active slides + unsaved edits while editing */
  const previewSlides: HeroCarouselBg[] = useMemo(() => {
    return backgrounds
      .filter((bg) => bg.isActive && bg.imageUrl)
      .sort((a, b) => a.order - b.order)
      .map((bg) => {
        const matchesEdit =
          editingId != null &&
          (bg.id === editingId || String(bg.id) === String(editingId));
        if (matchesEdit) {
          return {
            ...bg,
            title: editForm.title,
            subtitle: editForm.subtitle,
            description: editForm.description,
            buttonText: editForm.buttonText,
            buttonLink: editForm.buttonLink,
            bgGradient: editForm.bgGradient,
            textColor: editForm.textColor,
            buttonColor: editForm.buttonColor,
            buttonMarginTop: editForm.buttonMarginTop ?? 0,
            order: editForm.order,
            imageUrl: replacementImagePreview || bg.imageUrl,
          };
        }
        return {
          ...bg,
          buttonMarginTop:
            typeof bg.buttonMarginTop === 'number' ? bg.buttonMarginTop : 0,
        };
      });
  }, [backgrounds, editingId, editFormSnapshot, replacementImagePreview]);

  // Load backgrounds on component mount
  useEffect(() => {
    loadBackgrounds();
  }, []);

  const loadBackgrounds = async () => {
    try {
      console.log('📋 Loading backgrounds from admin API...');
      const response = await fetch('/api/admin/carousel-backgrounds');
      console.log('📋 Admin API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📋 Loaded backgrounds:', data);
        console.log('📋 Backgrounds count:', data.length);
        data.forEach((bg: any, index: number) => {
          console.log(`📋 Background ${index}:`, {
            id: bg.id,
            slideId: bg.slideId,
            title: bg.title,
            imageUrl: bg.imageUrl,
            isActive: bg.isActive,
            hasId: !!bg.id,
            hasSlideId: !!bg.slideId,
            buttonColor: bg.buttonColor,
            allFields: Object.keys(bg)
          });
        });
        setBackgrounds(data);
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to load backgrounds:', response.status, errorText);
      }
    } catch (error) {
      console.error('Error loading backgrounds:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (selectedSlide === null) {
      alert('Please select a slide first');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('image', file);
    formData.append('slideId', selectedSlide.toString());
    formData.append('title', `Slide ${selectedSlide} Background`);
    formData.append('subtitle', 'Custom Design');
    formData.append('description', 'Custom carousel background');
    formData.append('buttonText', 'EXPLORE');
    formData.append('buttonLink', '/products');
    formData.append('bgGradient', 'from-gray-800 to-gray-900');
    formData.append('textColor', 'text-white');
    formData.append('buttonColor', 'bg-white text-gray-900');

    try {
      const response = await fetch('/api/admin/carousel-backgrounds', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        await loadBackgrounds();
        alert('Background uploaded successfully!');
        setSelectedSlide(null);
        setShowSlideSelector(false);
      } else {
        alert('Error uploading background');
      }
    } catch (error) {
      console.error('Error uploading:', error);
      alert('Error uploading background');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    console.log('🗑️ Attempting to delete background with ID:', id);
    
    if (!id || id === 'undefined') {
      console.error('❌ Invalid ID provided for deletion:', id);
      alert('Error: Invalid background ID');
      return;
    }

    if (!confirm('Are you sure you want to delete this background?')) return;

    try {
      const response = await fetch(`/api/admin/carousel-backgrounds/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadBackgrounds();
        alert('Background deleted successfully!');
      } else {
        const errorData = await response.json();
        console.error('❌ Delete failed:', errorData);
        alert('Error deleting background');
      }
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Error deleting background');
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/carousel-backgrounds/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (response.ok) {
        await loadBackgrounds();
      } else {
        alert('Error updating background status');
      }
    } catch (error) {
      console.error('Error updating:', error);
      alert('Error updating background status');
    }
  };

  const handleEdit = (background: CarouselBackground) => {
    console.log('✏️ Editing background:', background);
    console.log('✏️ Button color from background:', background.buttonColor);
    console.log('✏️ Button color type:', typeof background.buttonColor);
    console.log('✏️ Button color length:', background.buttonColor?.length);
    setEditingId(background.id);
    setEditForm({
      title: background.title,
      subtitle: background.subtitle,
      description: background.description,
      buttonText: background.buttonText,
      buttonLink: background.buttonLink,
      bgGradient: background.bgGradient,
      textColor: background.textColor,
      buttonColor: background.buttonColor || 'bg-white text-gray-900',
      order: background.order ?? background.slideId ?? 0,
      buttonMarginTop:
        typeof background.buttonMarginTop === 'number'
          ? background.buttonMarginTop
          : 0,
    });
    setReplacementImage(null);
    setReplacementImagePreview(null);
    console.log('✏️ Edit form set with buttonColor:', background.buttonColor || 'bg-white text-gray-900');
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;

    console.log('💾 Saving edit with data:', editForm);
    console.log('💾 Button color being sent:', editForm.buttonColor);
    console.log('💾 Replacement image:', replacementImage);

    try {
      let response;
      
      // If there's a replacement image, use FormData
      if (replacementImage) {
        const formData = new FormData();
        formData.append('image', replacementImage);
        formData.append('title', editForm.title);
        formData.append('subtitle', editForm.subtitle);
        formData.append('description', editForm.description);
        formData.append('buttonText', editForm.buttonText);
        formData.append('buttonLink', editForm.buttonLink);
        formData.append('bgGradient', editForm.bgGradient);
        formData.append('textColor', editForm.textColor);
        formData.append('buttonColor', editForm.buttonColor);
        formData.append('order', String(editForm.order));
        formData.append('buttonMarginTop', String(editForm.buttonMarginTop ?? 0));

        response = await fetch(`/api/admin/carousel-backgrounds/${editingId}`, {
          method: 'PATCH',
          body: formData,
        });
      } else {
        // Explicit payload so buttonMarginTop is always sent (JSON.stringify drops undefined keys)
        const savePayload = {
          title: editForm.title,
          subtitle: editForm.subtitle,
          description: editForm.description,
          buttonText: editForm.buttonText,
          buttonLink: editForm.buttonLink,
          bgGradient: editForm.bgGradient,
          textColor: editForm.textColor,
          buttonColor: editForm.buttonColor,
          order: editForm.order,
          buttonMarginTop: Number(editForm.buttonMarginTop) || 0,
        };
        response = await fetch(`/api/admin/carousel-backgrounds/${editingId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(savePayload),
        });
      }

      if (response.ok) {
        await loadBackgrounds();
        setEditingId(null);
        setEditForm(defaultEditForm);
        setReplacementImage(null);
        setReplacementImagePreview(null);
        alert('Background updated successfully!');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Error updating background');
      }
    } catch (error) {
      console.error('Error updating:', error);
      alert('Error updating background');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm(defaultEditForm);
    setReplacementImage(null);
    setReplacementImagePreview(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReplacementImage(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setReplacementImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePreview = (imageUrl: string) => {
    setPreviewImage(imageUrl);
  };

  const closePreview = () => {
    setPreviewImage(null);
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Front of Shop (Homepage Carousel)</h1>
          <p className="text-gray-600 max-w-2xl">
            Manage the carousel on the <strong>homepage hero</strong> only. Upload images, set titles and buttons, reorder slides, and activate or deactivate each one. For the Our Work page carousel, use <strong>Our Work Carousel</strong> in the sidebar.
          </p>
        </div>
        <a href="/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
          View Homepage
        </a>
      </div>

      {/* Live preview — matches homepage hero (card, object-cover, CTA) */}
      <div className="mb-8 rounded-xl border border-gray-200 bg-gray-100 p-4 shadow-inner">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Live homepage carousel preview</h2>
            <p className="text-sm text-gray-600">
              Updates as you edit slides below. Uses the same layout as the public homepage (including products on/off:{' '}
              <span className="font-medium">{siteProductsEnabled ? 'products enabled' : 'custom orders only'}</span>).
            </p>
          </div>
        </div>
        <div className="overflow-hidden rounded-lg bg-white ring-1 ring-gray-200">
          <HeroSection
            previewMode
            previewSlides={previewSlides}
            previewProductsEnabled={siteProductsEnabled}
          />
        </div>
      </div>

      {/* Slide Selection and Upload Section */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Manage Carousel Slides</h2>
        
        {/* Slide Selection */}
        <div className="mb-6">
          <h3 className="text-md font-medium text-gray-900 mb-3">Select Slide to Edit</h3>
          <div className="grid grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((slideNumber) => {
              const slideData = backgrounds.find(bg => bg.slideId === slideNumber);
              return (
                <div
                  key={slideNumber}
                  className={`border-2 rounded-lg p-4 text-center cursor-pointer transition-all ${
                    selectedSlide === slideNumber
                      ? 'border-purple-500 bg-purple-50'
                      : slideData
                      ? 'border-green-200 bg-green-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                  onClick={() => {
                    setSelectedSlide(slideNumber);
                    setShowSlideSelector(true);
                  }}
                >
                  <div className="text-2xl font-bold text-gray-700 mb-2">Slide {slideNumber}</div>
                  {slideData ? (
                    <div className="text-sm text-green-600">
                      ✓ Configured
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">
                      Not configured
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Upload Section */}
        {selectedSlide && (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <h3 className="text-md font-medium text-gray-900 mb-4">Upload Background for Slide {selectedSlide}</h3>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="hidden"
              id="background-upload"
            />
            <label
              htmlFor="background-upload"
              className={`cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md ${
                isUploading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}
            >
              <FaUpload className="mr-2" />
              {isUploading ? 'Uploading...' : 'Choose Image'}
            </label>
            <p className="text-sm text-gray-500 mt-2">
              Recommended size: 1920x1080px or larger. Supported formats: JPG, PNG, WebP
            </p>
            <button
              onClick={() => {
                setSelectedSlide(null);
                setShowSlideSelector(false);
              }}
              className="mt-3 text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Backgrounds List */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Current Backgrounds</h2>
          <p className="text-sm text-gray-600 mt-1">
            {backgrounds.filter(bg => bg.isActive).length} active, {backgrounds.length} total
          </p>
          {backgrounds.filter(bg => bg.isActive).length === 0 && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start">
                <div className="text-amber-600 mr-2">⚠️</div>
                <div>
                  <h4 className="font-medium text-amber-900 text-sm">No Active Slides</h4>
                  <p className="text-xs text-amber-800 mt-1">
                    Activate at least one slide to display the carousel on your homepage.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {backgrounds.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <FaUpload className="mx-auto text-4xl mb-4 text-gray-300" />
            <p>No backgrounds uploaded yet. Upload your first background above.</p>
          </div>
        ) : (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {backgrounds.map((background) => (
                <div
                  key={background.id}
                  className={`border rounded-lg overflow-hidden ${
                    background.isActive ? 'border-green-500 bg-green-50' : 'border-gray-200'
                  }`}
                >
                  <div className="relative">
                    <img
                      src={background.imageUrl}
                      alt={background.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-2 right-2 flex gap-2">
                      <button
                        onClick={() => background.imageUrl && handlePreview(background.imageUrl)}
                        className="bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70"
                        title="Preview"
                        disabled={!background.imageUrl}
                      >
                        <FaEye className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(background.id, background.isActive)}
                        className={`p-2 rounded-full transition-all ${
                          background.isActive
                            ? 'bg-green-500 text-white hover:bg-green-600 shadow-lg'
                            : 'bg-gray-500 text-white hover:bg-gray-600'
                        }`}
                        title={background.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {background.isActive ? '✓' : '○'}
                      </button>
                    </div>
                    {background.isActive && (
                      <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
                        ACTIVE
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    {editingId === background.id ? (
                      <div className="space-y-3">
                        {/* Image Replacement Section */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Replace Banner Image
                          </label>
                          {replacementImagePreview ? (
                            <div className="mb-2">
                              <img
                                src={replacementImagePreview}
                                alt="Preview"
                                className="w-full h-32 object-cover rounded-md border border-gray-300"
                              />
                              <button
                                onClick={() => {
                                  setReplacementImage(null);
                                  setReplacementImagePreview(null);
                                }}
                                className="mt-2 text-sm text-red-600 hover:text-red-800"
                              >
                                Remove
                              </button>
                            </div>
                          ) : (
                            <div className="mb-2">
                              {background.imageUrl && (
                                <div className="mb-2">
                                  <p className="text-xs text-gray-500 mb-1">Current image:</p>
                                  <img
                                    src={background.imageUrl}
                                    alt="Current"
                                    className="w-full h-32 object-cover rounded-md border border-gray-300"
                                  />
                                </div>
                              )}
                            </div>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Leave empty to keep current image. Recommended size: 1920x1080px
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="text"
                            value={editForm.title}
                            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            placeholder="Main title"
                          />
                          <input
                            type="text"
                            value={editForm.subtitle}
                            onChange={(e) => setEditForm({ ...editForm, subtitle: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            placeholder="Subtitle"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Display order</label>
                          <input
                            type="number"
                            min={0}
                            value={editForm.order}
                            onChange={(e) => setEditForm({ ...editForm, order: parseInt(e.target.value, 10) || 0 })}
                            className="w-24 px-3 py-2 border border-gray-300 rounded-md text-sm"
                          />
                          <p className="text-xs text-gray-500 mt-1">Lower numbers appear first on Home and Our Work.</p>
                        </div>
                        <textarea
                          value={editForm.description}
                          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          placeholder="Description"
                          rows={2}
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="text"
                            value={editForm.buttonText}
                            onChange={(e) => setEditForm({ ...editForm, buttonText: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            placeholder="Button text"
                          />
                          <input
                            type="text"
                            value={editForm.buttonLink}
                            onChange={(e) => setEditForm({ ...editForm, buttonLink: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            placeholder="Button link"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          {/* Background Gradient Selector */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Background Gradient</label>
                            <select
                              value={editForm.bgGradient}
                              onChange={(e) => setEditForm({ ...editForm, bgGradient: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            >
                              <option value="from-gray-800 to-gray-900">Dark Gray</option>
                              <option value="from-blue-600 to-blue-800">Blue</option>
                              <option value="from-purple-600 to-purple-800">Purple</option>
                              <option value="from-red-600 to-red-800">Red</option>
                              <option value="from-green-600 to-green-800">Green</option>
                              <option value="from-orange-600 to-orange-800">Orange</option>
                              <option value="from-pink-600 to-pink-800">Pink</option>
                              <option value="from-indigo-600 to-indigo-800">Indigo</option>
                              <option value="from-teal-600 to-teal-800">Teal</option>
                              <option value="from-yellow-600 to-yellow-800">Yellow</option>
                              <option value="from-cyan-600 to-cyan-800">Cyan</option>
                              <option value="from-emerald-600 to-emerald-800">Emerald</option>
                              <option value="from-rose-600 to-rose-800">Rose</option>
                              <option value="from-violet-600 to-violet-800">Violet</option>
                              <option value="from-amber-600 to-amber-800">Amber</option>
                            </select>
                          </div>
                          
                          {/* Text Color Selector */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Text Color</label>
                            <select
                              value={editForm.textColor}
                              onChange={(e) => setEditForm({ ...editForm, textColor: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            >
                              <option value="text-white">White</option>
                              <option value="text-black">Black</option>
                              <option value="text-gray-100">Light Gray</option>
                              <option value="text-gray-200">Very Light Gray</option>
                              <option value="text-gray-300">Pale Gray</option>
                              <option value="text-gray-800">Dark Gray</option>
                              <option value="text-gray-900">Very Dark Gray</option>
                              <option value="text-blue-100">Light Blue</option>
                              <option value="text-blue-200">Pale Blue</option>
                              <option value="text-yellow-100">Light Yellow</option>
                              <option value="text-yellow-200">Pale Yellow</option>
                              <option value="text-pink-100">Light Pink</option>
                              <option value="text-pink-200">Pale Pink</option>
                              <option value="text-green-100">Light Green</option>
                              <option value="text-green-200">Pale Green</option>
                            </select>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Button vertical offset (px)
                          </label>
                          <span className="mb-2 flex flex-wrap items-center gap-3 text-sm text-gray-600">
                            <input
                              type="range"
                              min={0}
                              max={600}
                              step={4}
                              value={editForm.buttonMarginTop ?? 0}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  buttonMarginTop: parseInt(e.target.value, 10) || 0,
                                })
                              }
                              className="inline-block h-2 w-48 max-w-full cursor-pointer accent-purple-600"
                            />
                            <input
                              type="number"
                              min={0}
                              max={600}
                              value={editForm.buttonMarginTop ?? 0}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  buttonMarginTop: Math.min(
                                    600,
                                    Math.max(0, parseInt(e.target.value, 10) || 0)
                                  ),
                                })
                              }
                              className="w-20 rounded border border-gray-300 px-2 py-1 text-sm"
                            />
                            <span className="text-xs text-gray-500">Pushes the CTA below title/subtitle/description.</span>
                          </span>
                        </div>

                        {/* Button Color Selector */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Button Color 
                            <span className="text-xs text-gray-500 ml-2">
                              (Current: {editForm.buttonColor || 'none'})
                            </span>
                          </label>
                          <select
                            value={editForm.buttonColor || 'bg-white text-gray-900'}
                            onChange={(e) => setEditForm({ ...editForm, buttonColor: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          >
                            {/* Show current saved value if it doesn't match any predefined option */}
                            {editForm.buttonColor && !['bg-white text-gray-900', 'bg-black text-white', 'bg-blue-600 text-white', 'bg-purple-600 text-white', 'bg-red-600 text-white', 'bg-green-600 text-white', 'bg-orange-600 text-white', 'bg-pink-600 text-white', 'bg-indigo-600 text-white', 'bg-teal-600 text-white', 'bg-yellow-500 text-gray-900', 'bg-cyan-600 text-white', 'bg-emerald-600 text-white', 'bg-rose-600 text-white', 'bg-violet-600 text-white', 'bg-amber-500 text-gray-900', 'bg-gray-600 text-white', 'bg-gray-100 text-gray-900'].includes(editForm.buttonColor) && (
                              <option value={editForm.buttonColor}>Current: {editForm.buttonColor}</option>
                            )}
                            <option value="bg-white text-gray-900">White Button</option>
                            <option value="bg-black text-white">Black Button</option>
                            <option value="bg-blue-600 text-white">Blue Button</option>
                            <option value="bg-purple-600 text-white">Purple Button</option>
                            <option value="bg-red-600 text-white">Red Button</option>
                            <option value="bg-green-600 text-white">Green Button</option>
                            <option value="bg-orange-600 text-white">Orange Button</option>
                            <option value="bg-pink-600 text-white">Pink Button</option>
                            <option value="bg-indigo-600 text-white">Indigo Button</option>
                            <option value="bg-teal-600 text-white">Teal Button</option>
                            <option value="bg-yellow-500 text-gray-900">Yellow Button</option>
                            <option value="bg-cyan-600 text-white">Cyan Button</option>
                            <option value="bg-emerald-600 text-white">Emerald Button</option>
                            <option value="bg-rose-600 text-white">Rose Button</option>
                            <option value="bg-violet-600 text-white">Violet Button</option>
                            <option value="bg-amber-500 text-gray-900">Amber Button</option>
                            <option value="bg-gray-600 text-white">Gray Button</option>
                            <option value="bg-gray-100 text-gray-900">Light Gray Button</option>
                          </select>
                        </div>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveEdit}
                            className="flex items-center px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                          >
                            <FaSave className="mr-1" />
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="flex items-center px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                          >
                            <FaTimes className="mr-1" />
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="mb-2 flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded">
                            Slide {background.slideId}
                          </span>
                          <span className="text-xs text-gray-500">Order: {background.order ?? background.slideId}</span>
                        </div>
                        <h3 className="font-medium text-gray-900 mb-1">{background.title}</h3>
                        <p className="text-sm text-gray-700 font-medium mb-1">{background.subtitle}</p>
                        <p className="text-sm text-gray-600 mb-2">{background.description}</p>
                        <div className="text-xs text-gray-500 mb-3">
                          Button: "{background.buttonText}" → {background.buttonLink}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(background)}
                            className="flex items-center px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                          >
                            <FaEdit className="mr-1" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(background.id)}
                            className="flex items-center px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                          >
                            <FaTrash className="mr-1" />
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Image Preview</h3>
              <button
                onClick={closePreview}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <img
                src={previewImage}
                alt="Preview"
                className="max-w-full max-h-[70vh] object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
