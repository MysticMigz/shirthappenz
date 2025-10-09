'use client';

import React, { useState, useEffect } from 'react';
import { FaUpload, FaTrash, FaEye, FaEdit, FaSave, FaTimes } from 'react-icons/fa';

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
  isActive: boolean;
  order: number;
  createdAt: string;
}

export default function FrontOfShopPage() {
  const [backgrounds, setBackgrounds] = useState<CarouselBackground[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ 
    title: '', 
    subtitle: '', 
    description: '', 
    buttonText: '', 
    buttonLink: '',
    bgGradient: '',
    textColor: ''
  });
  const [selectedSlide, setSelectedSlide] = useState<number | null>(null);
  const [showSlideSelector, setShowSlideSelector] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

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
    setEditingId(background.id);
    setEditForm({
      title: background.title,
      subtitle: background.subtitle,
      description: background.description,
      buttonText: background.buttonText,
      buttonLink: background.buttonLink,
      bgGradient: background.bgGradient,
      textColor: background.textColor,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;

    try {
      const response = await fetch(`/api/admin/carousel-backgrounds/${editingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        await loadBackgrounds();
        setEditingId(null);
        setEditForm({ title: '', description: '' });
        alert('Background updated successfully!');
      } else {
        alert('Error updating background');
      }
    } catch (error) {
      console.error('Error updating:', error);
      alert('Error updating background');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({ 
      title: '', 
      subtitle: '', 
      description: '', 
      buttonText: '', 
      buttonLink: '',
      bgGradient: '',
      textColor: ''
    });
  };

  const handlePreview = (imageUrl: string) => {
    setPreviewImage(imageUrl);
  };

  const closePreview = () => {
    setPreviewImage(null);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Front of Shop Management</h1>
        <p className="text-gray-600">
          Manage carousel backgrounds for your homepage. Upload custom images to replace the default gradient backgrounds.
        </p>
      </div>

      {/* Slide Selection and Upload Section */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Manage Carousel Slides</h2>
        
        {/* Slide Selection */}
        <div className="mb-6">
          <h3 className="text-md font-medium text-gray-900 mb-3">Select Slide to Edit</h3>
          <div className="grid grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((slideNumber) => {
              console.log(`🎨 Checking slide ${slideNumber}:`, backgrounds.map(bg => ({
                slideId: bg.slideId,
                title: bg.title,
                isActive: bg.isActive
              })));
              const slideData = backgrounds.find(bg => bg.slideId === slideNumber);
              console.log(`🎨 Found slide data for ${slideNumber}:`, slideData);
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
                        onClick={() => handlePreview(background.imageUrl)}
                        className="bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70"
                        title="Preview"
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
                          <input
                            type="text"
                            value={editForm.bgGradient}
                            onChange={(e) => setEditForm({ ...editForm, bgGradient: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            placeholder="Background gradient (e.g., from-blue-500 to-indigo-600)"
                          />
                          <input
                            type="text"
                            value={editForm.textColor}
                            onChange={(e) => setEditForm({ ...editForm, textColor: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            placeholder="Text color (e.g., text-white)"
                          />
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
                        <div className="mb-2">
                          <span className="text-xs font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded">
                            Slide {background.slideId}
                          </span>
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
