'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { FaUpload, FaTrash, FaEye, FaEdit, FaSave, FaTimes } from 'react-icons/fa';
import Link from 'next/link';

interface OurWorkSlide {
  id: string;
  imageUrl: string;
  title?: string;
  subtitle?: string;
  order: number;
  isActive: boolean;
  createdAt?: string;
}

const defaultEditForm = {
  title: '',
  subtitle: '',
  order: 0
};

export default function OurWorkCarouselPage() {
  const [slides, setSlides] = useState<OurWorkSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(defaultEditForm);
  const [replacementImage, setReplacementImage] = useState<File | null>(null);
  const [replacementPreview, setReplacementPreview] = useState<string | null>(null);

  // Add new slide
  const [addTitle, setAddTitle] = useState('');
  const [addSubtitle, setAddSubtitle] = useState('');
  const [addOrder, setAddOrder] = useState(0);
  const [addImage, setAddImage] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Carousel preview state (matches public page)
  const [previewIndex, setPreviewIndex] = useState(0);
  const activeSlides = slides.filter((s) => s.isActive).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const goTo = useCallback((index: number) => {
    if (activeSlides.length === 0) return;
    setPreviewIndex((index + activeSlides.length) % activeSlides.length);
  }, [activeSlides.length]);
  const next = useCallback(() => goTo(previewIndex + 1), [previewIndex, goTo]);
  const prev = useCallback(() => goTo(previewIndex - 1), [previewIndex, goTo]);

  const loadSlides = async () => {
    try {
      const res = await fetch('/api/admin/our-work-slides');
      if (res.ok) {
        const data = await res.json();
        setSlides(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSlides();
  }, []);

  const handleAddSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addImage) {
      alert('Please choose an image.');
      return;
    }
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', addImage);
      formData.append('title', addTitle);
      formData.append('subtitle', addSubtitle);
      formData.append('order', String(addOrder));
      const res = await fetch('/api/admin/our-work-slides', { method: 'POST', body: formData });
      if (res.ok) {
        await loadSlides();
        setAddTitle('');
        setAddSubtitle('');
        setAddOrder(slides.length);
        setAddImage(null);
      } else {
        const err = await res.json();
        alert(err.error || 'Upload failed');
      }
    } catch (e) {
      alert('Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleEdit = (slide: OurWorkSlide) => {
    setEditingId(slide.id);
    setEditForm({
      title: slide.title || '',
      subtitle: slide.subtitle || '',
      order: slide.order ?? 0
    });
    setReplacementImage(null);
    setReplacementPreview(null);
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    try {
      let res: Response;
      if (replacementImage) {
        const formData = new FormData();
        formData.append('image', replacementImage);
        formData.append('title', editForm.title);
        formData.append('subtitle', editForm.subtitle);
        formData.append('order', String(editForm.order));
        res = await fetch(`/api/admin/our-work-slides/${editingId}`, { method: 'PATCH', body: formData });
      } else {
        res = await fetch(`/api/admin/our-work-slides/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editForm)
        });
      }
      if (res.ok) {
        await loadSlides();
        setEditingId(null);
        setEditForm(defaultEditForm);
        setReplacementImage(null);
        setReplacementPreview(null);
      } else {
        const err = await res.json();
        alert(err.error || 'Update failed');
      }
    } catch (e) {
      alert('Update failed');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm(defaultEditForm);
    setReplacementImage(null);
    setReplacementPreview(null);
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    try {
      const res = await fetch(`/api/admin/our-work-slides/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !current })
      });
      if (res.ok) await loadSlides();
      else alert('Update failed');
    } catch (e) {
      alert('Update failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this slide?')) return;
    try {
      const res = await fetch(`/api/admin/our-work-slides/${id}`, { method: 'DELETE' });
      if (res.ok) await loadSlides();
      else alert('Delete failed');
    } catch (e) {
      alert('Delete failed');
    }
  };

  const activeCount = slides.filter(s => s.isActive).length;

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Our Work Carousel</h1>
          <p className="text-gray-600 max-w-2xl">
            Manage the slides on the <strong>Our Work</strong> page only. This is separate from the homepage hero carousel.
          </p>
        </div>
        <Link
          href="/our-work"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-3 py-2 text-sm font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-md hover:bg-purple-100"
        >
          View Our Work page
        </Link>
      </div>

      {/* Add new slide */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Add slide</h2>
        <form onSubmit={handleAddSlide} className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Image *</label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              required
              onChange={(e) => setAddImage(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-purple-50 file:text-purple-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={addTitle}
              onChange={(e) => setAddTitle(e.target.value)}
              className="w-48 px-3 py-2 border border-gray-300 rounded-md text-sm"
              placeholder="Optional"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
            <input
              type="text"
              value={addSubtitle}
              onChange={(e) => setAddSubtitle(e.target.value)}
              className="w-48 px-3 py-2 border border-gray-300 rounded-md text-sm"
              placeholder="Optional"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
            <input
              type="number"
              min={0}
              value={addOrder}
              onChange={(e) => setAddOrder(parseInt(e.target.value, 10) || 0)}
              className="w-20 px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={isUploading || !addImage}
            className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? 'Uploading…' : 'Add slide'}
          </button>
        </form>
        <p className="text-xs text-gray-500 mt-2">Recommended: 1920×1080 or larger. JPG, PNG, WebP. Max 10MB.</p>
      </div>

      {/* Carousel preview (matches public Our Work page) */}
      {!loading && activeSlides.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Preview (as on Customer Creations page)</h2>
          <p className="text-sm text-gray-600 mb-4">Same width and aspect ratio as the live page.</p>
          <div className="relative w-full max-w-2xl mx-auto">
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl shadow-2xl bg-gray-100">
              {activeSlides.map((slide, index) => {
                const isActive = index === previewIndex % activeSlides.length;
                return (
                  <div
                    key={slide.id}
                    className={`absolute inset-0 transition-opacity duration-300 ${
                      isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                    }`}
                  >
                    <Image
                      src={slide.imageUrl}
                      alt={slide.title || `Slide ${index + 1}`}
                      fill
                      className="object-contain"
                      sizes="672px"
                    />
                    {(slide.title || slide.subtitle) && (
                      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-white text-sm">
                        {slide.title && <p className="font-semibold">{slide.title}</p>}
                        {slide.subtitle && <p className="opacity-90 mt-0.5">{slide.subtitle}</p>}
                      </div>
                    )}
                  </div>
                );
              })}
              {activeSlides.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={prev}
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/90 shadow flex items-center justify-center text-gray-800 hover:bg-white"
                    aria-label="Previous"
                  >
                    <span className="text-lg">‹</span>
                  </button>
                  <button
                    type="button"
                    onClick={next}
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/90 shadow flex items-center justify-center text-gray-800 hover:bg-white"
                    aria-label="Next"
                  >
                    <span className="text-lg">›</span>
                  </button>
                </>
              )}
            </div>
            {activeSlides.length > 1 && (
              <div className="flex justify-center gap-1.5 mt-3">
                {activeSlides.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setPreviewIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === previewIndex % activeSlides.length ? 'bg-purple-600 scale-125' : 'bg-gray-300'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* List */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Slides</h2>
          <p className="text-sm text-gray-600 mt-1">{activeCount} active, {slides.length} total</p>
          {activeCount === 0 && slides.length > 0 && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
              Activate at least one slide to show the carousel on the Our Work page.
            </div>
          )}
        </div>

        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading…</div>
        ) : slides.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <FaUpload className="mx-auto text-4xl mb-4 text-gray-300" />
            <p>No slides yet. Add one above.</p>
          </div>
        ) : (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {slides.map((slide) => (
              <div
                key={slide.id}
                className={`border rounded-lg overflow-hidden ${slide.isActive ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}
              >
                <div className="relative aspect-video w-full max-w-md mx-auto bg-gray-100">
                  <Image
                    src={slide.imageUrl}
                    alt={slide.title || 'Slide'}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  <div className="absolute top-2 right-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPreviewImage(slide.imageUrl)}
                      className="bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                      title="Preview"
                    >
                      <FaEye className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleActive(slide.id, slide.isActive)}
                      className={`p-2 rounded-full ${slide.isActive ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}`}
                      title={slide.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {slide.isActive ? '✓' : '○'}
                    </button>
                  </div>
                  {slide.isActive && (
                    <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
                      ACTIVE
                    </div>
                  )}
                </div>
                <div className="p-4">
                  {editingId === slide.id ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Replace image</label>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            setReplacementImage(f || null);
                            if (f) {
                              const r = new FileReader();
                              r.onloadend = () => setReplacementPreview(r.result as string);
                              r.readAsDataURL(f);
                            } else setReplacementPreview(null);
                          }}
                          className="block w-full text-sm text-gray-500"
                        />
                        {replacementPreview && (
                          <div className="mt-2 relative aspect-video w-full max-w-xs rounded border overflow-hidden bg-gray-100">
                            <img src={replacementPreview} alt="New" className="w-full h-full object-contain" />
                          </div>
                        )}
                      </div>
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        placeholder="Title"
                      />
                      <input
                        type="text"
                        value={editForm.subtitle}
                        onChange={(e) => setEditForm((f) => ({ ...f, subtitle: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        placeholder="Subtitle"
                      />
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                        <input
                          type="number"
                          min={0}
                          value={editForm.order}
                          onChange={(e) => setEditForm((f) => ({ ...f, order: parseInt(e.target.value, 10) || 0 }))}
                          className="w-20 px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button type="button" onClick={handleSaveEdit} className="flex items-center px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700">
                          <FaSave className="mr-1" /> Save
                        </button>
                        <button type="button" onClick={handleCancelEdit} className="flex items-center px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700">
                          <FaTimes className="mr-1" /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs text-gray-500 mb-1">Order: {slide.order}</p>
                      <h3 className="font-medium text-gray-900">{slide.title || '—'}</h3>
                      <p className="text-sm text-gray-600">{slide.subtitle || '—'}</p>
                      <div className="flex gap-2 mt-3">
                        <button type="button" onClick={() => handleEdit(slide)} className="flex items-center px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                          <FaEdit className="mr-1" /> Edit
                        </button>
                        <button type="button" onClick={() => handleDelete(slide.id)} className="flex items-center px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700">
                          <FaTrash className="mr-1" /> Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {previewImage && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4" onClick={() => setPreviewImage(null)}>
          <div className="relative w-full max-w-2xl max-h-[90vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <img src={previewImage} alt="Preview" className="max-w-full max-h-[90vh] object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}
