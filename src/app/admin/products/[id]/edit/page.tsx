'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FaUpload, FaTrash, FaLink, FaPlus } from 'react-icons/fa';
import dynamic from 'next/dynamic';
import { generateBarcode } from '@/lib/utils';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import ProductImageOverlay from '@/app/components/ProductImageOverlay';
// html2canvas will be imported dynamically to avoid SSR issues

interface ProductFormData {
  name: string;
  description: string;
  productDetails?: string;
  price: number;
  category: string;
  gender: string;
  images: Array<{ url: string; alt: string; color?: string }>;
  sizes: string[];
  colors: Array<{ name: string; hexCode: string; imageUrl?: string; stock?: { [size: string]: number } }>;
  featured: boolean;
  customizable: boolean;
  jerseyCustomOrderOnly?: boolean;
  basePrice: number;
  stock: { [size: string]: number };
  barcode?: string;
  barcodes?: Array<{ colorName: string; colorHex: string; value: string; size: string; sizeCode: string }>;
  mockupImage?: { url: string; alt: string };
  designImage?: { url: string; alt: string; position?: { x: number; y: number }; scale?: number; rotation?: number };
  mockupDesignCombinations?: Array<{
    mockupImage: { url: string; alt: string };
    designImage: { url: string; alt: string; position?: { x: number; y: number }; scale?: number; rotation?: number };
    name?: string;
    order?: number;
  }>;
}

// Dynamically import react-barcode to avoid SSR issues
const Barcode = dynamic(() => import('react-barcode'), { ssr: false });

export default function EditProduct({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mockupFileInputRef = useRef<HTMLInputElement>(null);
  const designFileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedImages, setUploadedImages] = useState<Array<{ file: File; preview: string; color?: string }>>([]);
  const [urlImages, setUrlImages] = useState<Array<{ url: string; alt: string; color?: string }>>([]);
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [imageColor, setImageColor] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [colorImageUploads, setColorImageUploads] = useState<Record<number, { file: File; preview: string } | null>>({});
  const [mockupImage, setMockupImage] = useState<{ file: File | null; preview: string | null; url?: string; alt?: string }>({ file: null, preview: null });
  const [designImage, setDesignImage] = useState<{ file: File | null; preview: string | null; url?: string; alt?: string }>({ file: null, preview: null });
  const [mockupImageUrl, setMockupImageUrl] = useState('');
  const [mockupImageAlt, setMockupImageAlt] = useState('');
  const [designImageUrl, setDesignImageUrl] = useState('');
  const [designImageAlt, setDesignImageAlt] = useState('');
  const [designPosition, setDesignPosition] = useState({ x: 0, y: 0 });
  const [designScale, setDesignScale] = useState(100);
  const [designRotation, setDesignRotation] = useState(0);
  // Multiple mockup/design combinations
  const [combinations, setCombinations] = useState<Array<{
    id: string;
    mockupImage: { file: File | null; preview: string | null; url?: string; alt?: string };
    designImage: { file: File | null; preview: string | null; url?: string; alt?: string };
    mockupImageUrl: string;
    mockupImageAlt: string;
    designImageUrl: string;
    designImageAlt: string;
    designPosition: { x: number; y: number };
    designScale: number;
    designRotation: number;
    name: string;
    order: number;
  }>>([]);
  const [presets, setPresets] = useState<Array<{ _id: string; name: string; description?: string; position: { x: number; y: number }; scale: number; rotation: number }>>([]);
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [showSavePresetModal, setShowSavePresetModal] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [presetDescription, setPresetDescription] = useState('');
  const [presetLoading, setPresetLoading] = useState(false);
  const [showFullPreview, setShowFullPreview] = useState(false);
  const [previousMockups, setPreviousMockups] = useState<Array<{ url: string; alt: string; productName: string; category: string }>>([]);
  const [showMockupSelector, setShowMockupSelector] = useState(false);
  const [loadingMockups, setLoadingMockups] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    productDetails: '',
    price: 0,
    category: '',
    gender: '',
    images: [],
    sizes: [],
    colors: [],
    featured: false,
    customizable: true,
    jerseyCustomOrderOnly: false,
    basePrice: 0,
    stock: {}
  });

  // Cleanup previews on unmount
  useEffect(() => {
    return () => {
      uploadedImages.forEach(image => URL.revokeObjectURL(image.preview));
      Object.values(colorImageUploads).forEach(imageData => {
        if (imageData) URL.revokeObjectURL(imageData.preview);
      });
      if (mockupImage.preview) URL.revokeObjectURL(mockupImage.preview);
      if (designImage.preview) URL.revokeObjectURL(designImage.preview);
      combinations.forEach(combo => {
        if (combo.mockupImage.preview) URL.revokeObjectURL(combo.mockupImage.preview);
        if (combo.designImage.preview) URL.revokeObjectURL(combo.designImage.preview);
      });
    };
  }, [uploadedImages, colorImageUploads, mockupImage.preview, designImage.preview, combinations]);

  // Redirect if not admin
  useEffect(() => {
    if (status === 'unauthenticated' || (status === 'authenticated' && !session?.user?.isAdmin)) {
      router.push('/auth/signin');
    }
  }, [session, status, router]);

  // Fetch presets on mount
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.isAdmin) {
      fetchPresets();
      fetchPreviousMockups();
    }
  }, [status, session]);

  const fetchPresets = async () => {
    try {
      const response = await fetch('/api/admin/design-presets');
      if (response.ok) {
        const data = await response.json();
        setPresets(data.presets || []);
      }
    } catch (error) {
      console.error('Error fetching presets:', error);
    }
  };

  const fetchPreviousMockups = async () => {
    setLoadingMockups(true);
    try {
      const response = await fetch('/api/admin/mockups');
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 [Mockups] Fetched mockups:', data.mockups?.length || 0);
        if (data.mockups && data.mockups.length > 0) {
          console.log('🔍 [Mockups] First mockup URL:', data.mockups[0].url);
        }
        setPreviousMockups(data.mockups || []);
      } else {
        console.error('❌ [Mockups] Failed to fetch:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('❌ [Mockups] Error fetching previous mockups:', error);
    } finally {
      setLoadingMockups(false);
    }
  };

  const handleSelectMockup = (mockup: { url: string; alt: string }) => {
    setMockupImageUrl(mockup.url);
    setMockupImageAlt(mockup.alt);
    setMockupImage({ file: null, preview: null, url: mockup.url, alt: mockup.alt });
    setShowMockupSelector(false);
  };

  const handleLoadPreset = () => {
    if (!selectedPreset) return;
    const preset = presets.find(p => p._id === selectedPreset);
    if (preset) {
      setDesignPosition(preset.position);
      setDesignScale(preset.scale);
      setDesignRotation(preset.rotation);
    }
  };

  const handleSavePreset = async () => {
    if (!presetName.trim()) {
      alert('Please enter a preset name');
      return;
    }

    setPresetLoading(true);
    try {
      const response = await fetch('/api/admin/design-presets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: presetName.trim(),
          description: presetDescription.trim(),
          position: designPosition,
          scale: designScale,
          rotation: designRotation
        })
      });

      if (response.ok) {
        const data = await response.json();
        setPresets([...presets, data.preset]);
        setPresetName('');
        setPresetDescription('');
        setShowSavePresetModal(false);
        alert('Preset saved successfully!');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to save preset');
      }
    } catch (error) {
      console.error('Error saving preset:', error);
      alert('Failed to save preset');
    } finally {
      setPresetLoading(false);
    }
  };

  const handleDeletePreset = async (presetId: string) => {
    if (!confirm('Are you sure you want to delete this preset?')) return;

    try {
      const response = await fetch(`/api/admin/design-presets/${presetId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setPresets(presets.filter(p => p._id !== presetId));
        if (selectedPreset === presetId) {
          setSelectedPreset('');
        }
        alert('Preset deleted successfully!');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to delete preset');
      }
    } catch (error) {
      console.error('Error deleting preset:', error);
      alert('Failed to delete preset');
    }
  };

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`/api/admin/products/${params.id}`);
        if (!response.ok) throw new Error('Failed to fetch product');
        
        const product = await response.json();
        setFormData({
          ...product,
          jerseyCustomOrderOnly: product.jerseyCustomOrderOnly === true,
        });
        
        // Set mockup and design images if they exist
        if (product.mockupImage) {
          setMockupImage({ file: null, preview: null, url: product.mockupImage.url, alt: product.mockupImage.alt });
          setMockupImageUrl(product.mockupImage.url);
          setMockupImageAlt(product.mockupImage.alt || '');
        }
        if (product.designImage) {
          setDesignImage({ file: null, preview: null, url: product.designImage.url, alt: product.designImage.alt });
          setDesignImageUrl(product.designImage.url);
          setDesignImageAlt(product.designImage.alt || '');
          // Set position, scale, and rotation if they exist
          if (product.designImage.position) {
            setDesignPosition(product.designImage.position);
          }
          if (product.designImage.scale !== undefined) {
            setDesignScale(product.designImage.scale);
          }
          if (product.designImage.rotation !== undefined) {
            setDesignRotation(product.designImage.rotation);
          }
        }
        
        // Load mockup/design combinations if they exist
        if (product.mockupDesignCombinations && Array.isArray(product.mockupDesignCombinations) && product.mockupDesignCombinations.length > 0) {
          console.log('Loading combinations:', product.mockupDesignCombinations);
          const loadedCombinations = product.mockupDesignCombinations.map((combo: any, index: number) => {
            const mockupUrl = combo.mockupImage?.url || '';
            const designUrl = combo.designImage?.url || '';
            
            return {
              id: `combo-${Date.now()}-${index}`, // Use timestamp to ensure unique IDs
              mockupImage: { 
                file: null, 
                preview: null, 
                url: mockupUrl, 
                alt: combo.mockupImage?.alt 
              },
              designImage: { 
                file: null, 
                preview: null, 
                url: designUrl, 
                alt: combo.designImage?.alt 
              },
              mockupImageUrl: mockupUrl,
              mockupImageAlt: combo.mockupImage?.alt || '',
              designImageUrl: designUrl,
              designImageAlt: combo.designImage?.alt || '',
              designPosition: combo.designImage?.position || { x: 0, y: 0 },
              designScale: combo.designImage?.scale !== undefined ? combo.designImage.scale : 100,
              designRotation: combo.designImage?.rotation !== undefined ? combo.designImage.rotation : 0,
              name: combo.name || `Design ${index + 1}`,
              order: combo.order !== undefined ? combo.order : index
            };
          });
          console.log('Loaded combinations:', loadedCombinations);
          setCombinations(loadedCombinations);
        } else {
          console.log('No combinations found or invalid format:', product.mockupDesignCombinations);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch product');
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.isAdmin) {
      fetchProduct();
    }
  }, [session, params.id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => {
      if (name === 'customizable' && !checked) {
        return { ...prev, customizable: false, jerseyCustomOrderOnly: false };
      }
      return { ...prev, [name]: checked };
    });
  };

  const handleColorChange = (index: number, field: 'name' | 'hexCode' | 'imageUrl', value: string) => {
    setFormData(prev => ({
      ...prev,
      colors: prev.colors.map((color, i) => 
        i === index ? { ...color, [field]: value } : color
      )
    }));
  };

  const handleColorStockChange = (colorIndex: number, size: string, value: string) => {
    const quantity = Math.max(0, parseInt(value) || 0);
    
    setFormData(prev => ({
      ...prev,
      colors: prev.colors.map((color, i) => 
        i === colorIndex 
          ? { 
              ...color, 
              stock: { 
                ...color.stock, 
                [size]: quantity 
              } 
            } 
          : color
      )
    }));
  };

  const addColor = () => {
    setFormData(prev => ({
      ...prev,
      colors: [...prev.colors, { name: '', hexCode: '#000000', imageUrl: '', stock: {} }]
    }));
  };

  const removeColor = (index: number) => {
    setFormData(prev => ({
      ...prev,
      colors: prev.colors.filter((_, i) => i !== index)
    }));
  };

  const handleSizeChange = (size: string) => {
    setFormData(prev => {
      const newSizes = prev.sizes.includes(size)
        ? prev.sizes.filter(s => s !== size)
        : [...prev.sizes, size].sort();

      // Initialize or remove stock for the size
      const newStock = { ...prev.stock };
      if (newSizes.includes(size) && !newStock[size]) {
        newStock[size] = 0;
      } else if (!newSizes.includes(size)) {
        delete newStock[size];
      }

      return {
        ...prev,
        sizes: newSizes,
        stock: newStock
      };
    });
  };

  const handleStockChange = (size: string, value: string) => {
    // Convert to number and handle invalid input
    const quantity = Math.max(0, parseInt(value) || 0);
    
    setFormData(prev => ({
      ...prev,
      stock: {
        ...prev.stock,
        [size]: quantity
      }
    }));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newImages = Array.from(e.target.files).map(file => ({
        file,
        preview: URL.createObjectURL(file),
        color: '' // Default to no specific color
      }));
      setUploadedImages(prev => [...prev, ...newImages]);
    }
  };

  const handleImageRemove = (index: number, isExisting: boolean = false) => {
    if (isExisting) {
      setFormData(prev => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index)
      }));
    } else {
      setUploadedImages(prev => {
        URL.revokeObjectURL(prev[index].preview);
        return prev.filter((_, i) => i !== index);
      });
    }
  };

  const handleImageColorChange = (index: number, color: string, type: 'existing' | 'uploaded' | 'url') => {
    if (type === 'existing') {
      setFormData(prev => ({
        ...prev,
        images: prev.images.map((img, i) => 
          i === index ? { ...img, color } : img
        )
      }));
    } else if (type === 'uploaded') {
      setUploadedImages(prev => prev.map((img, i) => 
        i === index ? { ...img, color } : img
      ));
    } else {
      setUrlImages(prev => prev.map((img, i) => 
        i === index ? { ...img, color } : img
      ));
    }
  };

  const handleUrlImageAdd = () => {
    if (imageUrl.trim() && imageAlt.trim()) {
      setUrlImages(prev => [...prev, { 
        url: imageUrl.trim(), 
        alt: imageAlt.trim(), 
        color: imageColor.trim() 
      }]);
      setImageUrl('');
      setImageAlt('');
      setImageColor('');
      setShowUrlInput(false);
    }
  };

  const handleUrlImageRemove = (index: number) => {
    setUrlImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleColorImageSelect = (colorIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const preview = URL.createObjectURL(file);
      setColorImageUploads(prev => ({
        ...prev,
        [colorIndex]: { file, preview }
      }));
    }
  };

  const handleColorImageRemove = (colorIndex: number) => {
    setColorImageUploads(prev => {
      if (prev[colorIndex]) {
        URL.revokeObjectURL(prev[colorIndex]!.preview);
      }
      const newUploads = { ...prev };
      delete newUploads[colorIndex];
      return newUploads;
    });
  };

  const handleMockupImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Clear existing preview/URL when selecting new file
      if (mockupImage.preview) URL.revokeObjectURL(mockupImage.preview);
      setMockupImage({
        file,
        preview: URL.createObjectURL(file),
        alt: mockupImageAlt || ''
      });
      // Clear URL input when uploading new file
      setMockupImageUrl('');
    }
  };

  const handleDesignImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Clear existing preview/URL when selecting new file
      if (designImage.preview) URL.revokeObjectURL(designImage.preview);
      setDesignImage({
        file,
        preview: URL.createObjectURL(file),
        alt: designImageAlt || ''
      });
      // Clear URL input when uploading new file
      setDesignImageUrl('');
    }
  };

  const handleMockupImageRemove = () => {
    if (mockupImage.preview) URL.revokeObjectURL(mockupImage.preview);
    setMockupImage({ file: null, preview: null, url: undefined, alt: undefined });
    setMockupImageUrl('');
    setMockupImageAlt('');
    // Reset file input to allow re-uploading
    if (mockupFileInputRef.current) {
      mockupFileInputRef.current.value = '';
    }
  };

  const handleDesignImageRemove = () => {
    if (designImage.preview) URL.revokeObjectURL(designImage.preview);
    setDesignImage({ file: null, preview: null, url: undefined, alt: undefined });
    setDesignImageUrl('');
    setDesignImageAlt('');
    // Reset file input to allow re-uploading
    if (designFileInputRef.current) {
      designFileInputRef.current.value = '';
    }
  };

  // Combination management handlers
  const addCombination = () => {
    const newCombo = {
      id: `combo-${Date.now()}`,
      mockupImage: { file: null, preview: null },
      designImage: { file: null, preview: null },
      mockupImageUrl: '',
      mockupImageAlt: '',
      designImageUrl: '',
      designImageAlt: '',
      designPosition: { x: 0, y: 0 },
      designScale: 100,
      designRotation: 0,
      name: `Design ${combinations.length + 1}`,
      order: combinations.length
    };
    setCombinations([...combinations, newCombo]);
  };

  const removeCombination = (id: string) => {
    const combo = combinations.find(c => c.id === id);
    if (combo) {
      if (combo.mockupImage.preview) URL.revokeObjectURL(combo.mockupImage.preview);
      if (combo.designImage.preview) URL.revokeObjectURL(combo.designImage.preview);
    }
    setCombinations(combinations.filter(c => c.id !== id).map((c, idx) => ({ ...c, order: idx })));
  };

  const updateCombination = (id: string, updates: Partial<typeof combinations[0]>) => {
    setCombinations(combinations.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // First, upload all new images
      const uploadedImageUrls = await Promise.all(
        uploadedImages.map(async (image) => {
          const formData = new FormData();
          formData.append('file', image.file);

          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            throw new Error('Failed to upload image');
          }

          const data = await response.json();
          return {
            url: data.url, // Use Cloudinary URL as-is
            alt: image.file.name,
            color: image.color || undefined
          };
        })
      );

      // Upload color-specific images
      const colorImageUrls = await Promise.all(
        Object.entries(colorImageUploads).map(async ([colorIndex, imageData]) => {
          if (!imageData) return null;
          
          const uploadFormData = new FormData();
          uploadFormData.append('file', imageData.file);

          const response = await fetch('/api/upload', {
            method: 'POST',
            body: uploadFormData,
          });

          if (!response.ok) {
            throw new Error('Failed to upload color image');
          }

          const data = await response.json();
          const colorIndexNum = parseInt(colorIndex);
          const colorName = formData.colors[colorIndexNum]?.name;
          
          return {
            url: data.url,
            alt: `${colorName || 'Color'} variant`,
            color: colorName
          };
        })
      );

      // Filter out null values
      const validColorImageUrls = colorImageUrls.filter(Boolean);

      // Upload mockup image if new file is selected
      let mockupImageData = formData.mockupImage;
      if (mockupImage.file) {
        const mockupFormData = new FormData();
        mockupFormData.append('file', mockupImage.file);
        const mockupResponse = await fetch('/api/upload', {
          method: 'POST',
          body: mockupFormData,
        });
        if (mockupResponse.ok) {
          const mockupData = await mockupResponse.json();
          mockupImageData = {
            url: mockupData.url,
            alt: mockupImageAlt || 'Product mockup'
          };
        }
      } else if (mockupImageUrl) {
        mockupImageData = {
          url: mockupImageUrl,
          alt: mockupImageAlt || 'Product mockup'
        };
      }

      // Upload design image if new file is selected
      let designImageData = formData.designImage;
      if (designImage.file) {
        const designFormData = new FormData();
        designFormData.append('file', designImage.file);
        const designResponse = await fetch('/api/upload', {
          method: 'POST',
          body: designFormData,
        });
        if (designResponse.ok) {
          const designData = await designResponse.json();
          designImageData = {
            url: designData.url,
            alt: designImageAlt || 'Product design',
            position: designPosition,
            scale: designScale,
            rotation: designRotation
          };
        }
      } else if (designImageUrl || designImage.url) {
        designImageData = {
          url: designImageUrl || designImage.url || '',
          alt: designImageAlt || designImage.alt || 'Product design',
          position: designPosition,
          scale: designScale,
          rotation: designRotation
        };
      } else if (formData.designImage) {
        // Keep existing design image but update transformations
        designImageData = {
          ...formData.designImage,
          position: designPosition,
          scale: designScale,
          rotation: designRotation
        };
      }

      // Upload all combination images
      const uploadedCombinations = await Promise.all(
        combinations.map(async (combo) => {
          let comboMockupImage = null;
          let comboDesignImage = null;

          // Handle mockup image - prioritize file upload, then URL, then existing URL
          if (combo.mockupImage.file) {
            // Upload new file
            const mockupFormData = new FormData();
            mockupFormData.append('file', combo.mockupImage.file);
            const response = await fetch('/api/upload', { method: 'POST', body: mockupFormData });
            if (response.ok) {
              const data = await response.json();
              comboMockupImage = { 
                url: data.url, 
                alt: combo.mockupImageAlt || combo.mockupImage.alt || 'Mockup' 
              };
            } else {
              console.error('Failed to upload mockup image for combination:', combo.name);
            }
          } else if (combo.mockupImageUrl) {
            // Use URL from input field
            comboMockupImage = { 
              url: combo.mockupImageUrl, 
              alt: combo.mockupImageAlt || combo.mockupImage.alt || 'Mockup' 
            };
          } else if (combo.mockupImage.url) {
            // Use existing URL (from loaded product)
            comboMockupImage = { 
              url: combo.mockupImage.url, 
              alt: combo.mockupImageAlt || combo.mockupImage.alt || 'Mockup' 
            };
          }

          // Handle design image - prioritize file upload, then URL, then existing URL
          if (combo.designImage.file) {
            // Upload new file
            const designFormData = new FormData();
            designFormData.append('file', combo.designImage.file);
            const response = await fetch('/api/upload', { method: 'POST', body: designFormData });
            if (response.ok) {
              const data = await response.json();
              comboDesignImage = {
                url: data.url,
                alt: combo.designImageAlt || combo.designImage.alt || 'Design',
                position: combo.designPosition,
                scale: combo.designScale,
                rotation: combo.designRotation
              };
            } else {
              console.error('Failed to upload design image for combination:', combo.name);
            }
          } else if (combo.designImageUrl) {
            // Use URL from input field
            comboDesignImage = {
              url: combo.designImageUrl,
              alt: combo.designImageAlt || combo.designImage.alt || 'Design',
              position: combo.designPosition,
              scale: combo.designScale,
              rotation: combo.designRotation
            };
          } else if (combo.designImage.url) {
            // Use existing URL (from loaded product)
            comboDesignImage = {
              url: combo.designImage.url,
              alt: combo.designImageAlt || combo.designImage.alt || 'Design',
              position: combo.designPosition,
              scale: combo.designScale,
              rotation: combo.designRotation
            };
          }

          // Only include if both images exist
          if (comboMockupImage && comboDesignImage) {
            const combination = {
              mockupImage: comboMockupImage,
              designImage: comboDesignImage,
              name: combo.name || `Design ${combo.order + 1}`,
              order: combo.order !== undefined ? combo.order : 0
            };
            console.log('✅ Valid combination:', combination);
            return combination;
          }
          console.warn('⚠️ Skipping combination - missing images:', {
            name: combo.name,
            hasMockup: !!comboMockupImage,
            hasDesign: !!comboDesignImage,
            mockupFile: !!combo.mockupImage.file,
            mockupUrl: combo.mockupImageUrl,
            mockupExistingUrl: combo.mockupImage.url,
            designFile: !!combo.designImage.file,
            designUrl: combo.designImageUrl,
            designExistingUrl: combo.designImage.url
          });
          return null;
        })
      );

      // Filter out null combinations
      const validCombinations = uploadedCombinations.filter(Boolean);
      
      console.log('📦 Saving combinations:', validCombinations);
      console.log('📊 Total combinations to save:', validCombinations.length);
      console.log('🔍 Combination details:', validCombinations.map(c => ({
        name: c.name,
        hasMockup: !!c.mockupImage?.url,
        hasDesign: !!c.designImage?.url,
        mockupUrl: c.mockupImage?.url,
        designUrl: c.designImage?.url
      })));

      // Combine existing, uploaded, URL, and color-specific images
      const productData = {
        ...formData,
        images: [...formData.images, ...uploadedImageUrls, ...urlImages, ...validColorImageUrls],
        stock: formData.stock,
        price: Number(formData.price),
        basePrice: Number(formData.basePrice),
        category: formData.category ? formData.category.toLowerCase() : '',
        gender: formData.gender ? formData.gender.toLowerCase() : '',
        jerseyCustomOrderOnly: !!(formData.customizable && formData.jerseyCustomOrderOnly),
        mockupImage: mockupImageData,
        designImage: designImageData,
        mockupDesignCombinations: validCombinations, // Always include, even if empty array
      };
      
      console.log('💾 Product data being sent to API:', {
        hasCombinations: productData.mockupDesignCombinations?.length > 0,
        combinationsCount: productData.mockupDesignCombinations?.length || 0,
        firstCombination: productData.mockupDesignCombinations?.[0]
      });

      const response = await fetch(`/api/admin/products/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(productData)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update product');
      }

      router.push('/admin/products');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update product');
    } finally {
      setLoading(false);
    }
  };

  // Barcode export handler
  const barcodeRef = useRef<HTMLDivElement>(null);
  const handleExportBarcode = async () => {
    if (!barcodeRef.current) return;
    try {
      const dataUrl = await toPng(barcodeRef.current);
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${formData.name || 'barcode'}.png`;
      link.click();
    } catch (err) {
      alert('Failed to export barcode.');
    }
  };

  // Export all barcodes as printable PDF labels
  const handleExportAllBarcodesPDF = async () => {
    if (!formData.barcodes || formData.barcodes.length === 0) return;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [50, 30] }); // 50x30mm label size
    for (let i = 0; i < formData.barcodes.length; i++) {
      const barcode = formData.barcodes[i];
      // Create a temporary div for rendering
      const tempDiv = document.createElement('div');
      tempDiv.style.width = '180px';
      tempDiv.style.height = '100px';
      tempDiv.style.display = 'flex';
      tempDiv.style.flexDirection = 'column';
      tempDiv.style.alignItems = 'center';
      tempDiv.style.justifyContent = 'center';
      tempDiv.style.background = 'white';
      tempDiv.innerHTML = `
        <div style="font-size:12px;font-weight:bold;margin-bottom:2px;text-align:center;">${formData.name}</div>
        <div style="font-size:10px;margin-bottom:2px;">${barcode.colorName} - ${barcode.size}</div>
        <svg id="barcode-svg-${i}"></svg>
        <div style="font-size:10px;margin-top:2px;">${barcode.value}</div>
      `;
      document.body.appendChild(tempDiv);
      // Render barcode SVG
      // @ts-ignore
      await import('jsbarcode').then(jsbarcode => {
        jsbarcode.default(`#barcode-svg-${i}`, barcode.value, {
          format: 'CODE128',
          width: 2,
          height: 40,
          displayValue: false,
          margin: 0
        });
      });
      // Convert to image
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(tempDiv, { backgroundColor: '#fff', scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      if (i > 0) pdf.addPage([50, 30], 'portrait');
      pdf.addImage(imgData, 'PNG', 0, 0, 50, 30);
      document.body.removeChild(tempDiv);
    }
    pdf.save(`${formData.name.replace(/\s+/g, '_')}_barcodes.pdf`);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!session?.user?.isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
            <button
              onClick={() => router.push('/admin/products')}
              className="text-gray-600 hover:text-gray-900"
            >
              Back to Products
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label htmlFor="productDetails" className="block text-sm font-medium text-gray-700 mb-1">
                  Product Details
                </label>
                <textarea
                  name="productDetails"
                  value={formData.productDetails || ''}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Enter product details that will be displayed in the accordion (e.g., material, care instructions, specifications)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  This information will be displayed in the collapsible "Product Details" section on the product page.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price (£)
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Base Price for Customization (£)
                  </label>
                  <input
                    type="number"
                    name="basePrice"
                    value={formData.basePrice}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gender
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a gender</option>
                  <option value="men">Men</option>
                  <option value="women">Women</option>
                  <option value="unisex">Unisex</option>
                  <option value="kids">Kids</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a category</option>
                  <option value="tshirts">T-Shirts</option>
                  <option value="poloshirts">Polo Shirts</option>
                  <option value="jerseys">Jerseys</option>
                  <option value="tanktops">Tank Tops</option>
                  <option value="longsleeve">Long Sleeve Shirts</option>
                  <option value="hoodies">Hoodies</option>
                  <option value="sweatshirts">Sweatshirts</option>
                  <option value="sweatpants">Sweatpants</option>
                  <option value="accessories">Accessories</option>
                  <option value="shortsleeve">Short Sleeve</option>
                  <option value="crewneck">Crewneck</option>
                </select>
              </div>
            </div>

            {/* Options */}
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="featured"
                  checked={formData.featured}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Featured Product
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="customizable"
                  checked={formData.customizable}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Customizable Product
                </label>
              </div>

              {formData.customizable && (
                <label className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
                  <input
                    type="checkbox"
                    name="jerseyCustomOrderOnly"
                    checked={!!formData.jerseyCustomOrderOnly}
                    onChange={handleCheckboxChange}
                    className="mt-0.5 h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                  />
                  <span>
                    <span className="block text-sm font-medium text-gray-900">Jersey custom order form only</span>
                    <span className="mt-0.5 block text-xs text-gray-600">
                      If checked, this product appears only on the <strong>Jersey personalisation</strong> custom order form, not the DTF form.
                    </span>
                  </span>
                </label>
              )}
            </div>

            {/* Sizes and Stock */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700 required-field">
                Sizes and Stock
              </label>
              {formData.gender === 'kids' ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {['0–3M', '3–6M', '6–12M', '1–2Y', '2–3Y', '3–4Y', '5–6Y', '7–8Y', '9–10Y', '11–12Y', '13–14Y'].map((size) => (
                    <div 
                      key={size} 
                      className={`p-4 rounded-lg border ${
                        formData.sizes.includes(size) 
                          ? 'border-purple-300 bg-purple-50' 
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <label className="inline-flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.sizes.includes(size)}
                            onChange={() => handleSizeChange(size)}
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          <span className="ml-2 font-medium">{size}</span>
                        </label>
                      </div>
                      {formData.sizes.includes(size) && (
                        <div className="mt-2">
                          <div className="flex items-center">
                            <input
                              type="number"
                              value={formData.stock[size] || 0}
                              onChange={(e) => handleStockChange(size, e.target.value)}
                              min="0"
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                              placeholder="Quantity"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'].map((size) => (
                    <div 
                      key={size} 
                      className={`p-4 rounded-lg border ${
                        formData.sizes.includes(size) 
                          ? 'border-purple-300 bg-purple-50' 
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <label className="inline-flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.sizes.includes(size)}
                            onChange={() => handleSizeChange(size)}
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          <span className="ml-2 font-medium">{size}</span>
                        </label>
                      </div>
                      {formData.sizes.includes(size) && (
                        <div className="mt-2">
                          <div className="flex items-center">
                            <input
                              type="number"
                              value={formData.stock[size] || 0}
                              onChange={(e) => handleStockChange(size, e.target.value)}
                              min="0"
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                              placeholder="Quantity"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Colors */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Available Colors
                </label>
                <button
                  type="button"
                  onClick={addColor}
                  className="text-sm text-purple-600 hover:text-purple-700"
                >
                  + Add Color
                </button>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <h4 className="text-sm font-medium text-blue-900 mb-1">🎨 Color Selection & Stock Management</h4>
                <p className="text-xs text-blue-700">
                  When customers view this product, they'll be able to click on color dots to see different images. 
                  You can also manage stock levels separately for each color variant:
                </p>
                <ul className="text-xs text-blue-700 mt-1 ml-4 list-disc">
                  <li>Use the color dropdowns on existing and new images</li>
                  <li>Add direct image URLs for each color</li>
                  <li>Upload images directly for each color variant</li>
                  <li>Set individual stock levels for each color and size combination</li>
                </ul>
              </div>
              <div className="space-y-4">
                {formData.colors.map((color, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={color.name}
                        onChange={(e) => handleColorChange(index, 'name', e.target.value)}
                        placeholder="Color name (e.g., Red, Blue, Navy)"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <input
                        type="color"
                        value={color.hexCode}
                        onChange={(e) => handleColorChange(index, 'hexCode', e.target.value)}
                        className="h-10 w-20 rounded border border-gray-300"
                        title="Select color"
                      />
                      <button
                        type="button"
                        onClick={() => removeColor(index)}
                        className="text-red-600 hover:text-red-700 px-2 py-1"
                        title="Remove color"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Color-Specific Image URL (Optional)
                        </label>
                        <input
                          type="url"
                          value={color.imageUrl || ''}
                          onChange={(e) => handleColorChange(index, 'imageUrl', e.target.value)}
                          placeholder="https://example.com/red-shirt.jpg"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Direct image URL for this specific color variant
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Or Upload Color Image
                        </label>
                        <div className="flex items-center space-x-3">
                          {colorImageUploads[index] ? (
                            <div className="flex items-center space-x-2">
                              <div className="w-16 h-16 relative rounded-lg overflow-hidden border border-gray-200">
                                <Image
                                  src={colorImageUploads[index]!.preview}
                                  alt={`${color.name} preview`}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => handleColorImageRemove(index)}
                                className="text-red-600 hover:text-red-700 text-sm"
                              >
                                Remove
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <input
                                type="file"
                                id={`color-image-${index}`}
                                accept="image/*"
                                onChange={(e) => handleColorImageSelect(index, e)}
                                className="hidden"
                              />
                              <label
                                htmlFor={`color-image-${index}`}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 cursor-pointer text-sm"
                              >
                                Upload Image
                              </label>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Upload an image specifically for this color variant
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Stock Levels for {color.name || 'this color'}
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {formData.sizes.map((size) => (
                            <div key={size} className="flex flex-col">
                              <label className="text-xs text-gray-600 mb-1">{size}</label>
                              <input
                                type="number"
                                value={color.stock?.[size] || 0}
                                onChange={(e) => handleColorStockChange(index, size, e.target.value)}
                                min="0"
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 focus:border-transparent"
                                placeholder="0"
                              />
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Set stock levels for each size of this color variant
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mockup and Design Images Section - PRIMARY METHOD */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Product Mockup & Design Images <span className="text-green-600 font-semibold">(Primary Method - Recommended)</span>
              </label>
              <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-semibold text-green-900 mb-2 flex items-center gap-2">
                  <span>⭐</span> Primary Product Display Method
                </h4>
                <p className="text-xs text-green-800 mb-2">
                  <strong>This is the preferred way to display products.</strong> Upload a base mockup image (the product template) and a design image that will be overlaid on top of it.
                  The design image will be displayed on top of the mockup to show how the product will look. These images will be used for product cards and detail pages.
                </p>
                <p className="text-xs text-green-700 font-medium">
                  💡 Tip: You can adjust the position, size, and rotation of the design image using the controls below. Legacy images (below) are optional and only used as a fallback.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Mockup Image */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Mockup Image (Base Template)
                  </label>
                  {mockupImage.preview ? (
                    <div className="relative">
                      <div className="aspect-square relative rounded-lg overflow-hidden border border-gray-200">
                        <Image
                          src={mockupImage.preview}
                          alt="Mockup preview"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleMockupImageRemove}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                      >
                        <FaTrash size={12} />
                      </button>
                    </div>
                  ) : mockupImage.url ? (
                    <div className="relative">
                      <div className="aspect-square relative rounded-lg overflow-hidden border border-gray-200">
                        <Image
                          src={mockupImage.url}
                          alt={mockupImage.alt || "Mockup"}
                          fill
                          className="object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/images/logo.jpg';
                          }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleMockupImageRemove}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                      >
                        <FaTrash size={12} />
                      </button>
                    </div>
                  ) : null}
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (mockupFileInputRef.current) {
                          mockupFileInputRef.current.value = ''; // Reset to allow selecting same file again
                          mockupFileInputRef.current.click();
                        }
                      }}
                      className="w-full flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-purple-500 transition-colors"
                    >
                      <div className="text-center">
                        <FaUpload className="mx-auto h-6 w-6 text-gray-400 mb-2" />
                        <span className="block text-sm font-medium text-gray-600">
                          {(mockupImage.preview || mockupImage.url || mockupImageUrl) ? 'Replace Mockup' : 'Upload Mockup'}
                        </span>
                      </div>
                    </button>
                    <input
                      type="file"
                      ref={mockupFileInputRef}
                      onChange={handleMockupImageSelect}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setShowMockupSelector(true);
                        if (previousMockups.length === 0) {
                          fetchPreviousMockups();
                        }
                      }}
                      className="w-full flex items-center justify-center border-2 border-dashed border-blue-300 rounded-lg p-3 hover:border-blue-500 transition-colors bg-blue-50"
                    >
                      <div className="text-center">
                        <FaLink className="mx-auto h-5 w-5 text-blue-400 mb-1" />
                        <span className="block text-xs font-medium text-blue-600">
                          Select from Previous Mockups
                        </span>
                      </div>
                    </button>
                    <div className="text-xs text-gray-500">Or enter URL:</div>
                    <input
                      type="url"
                      value={mockupImageUrl}
                      onChange={(e) => setMockupImageUrl(e.target.value)}
                      placeholder="https://example.com/mockup.jpg"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                    <input
                      type="text"
                      value={mockupImageAlt}
                      onChange={(e) => setMockupImageAlt(e.target.value)}
                      placeholder="Mockup alt text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                </div>

                {/* Design Image */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Design Image (Overlay)
                  </label>
                  {designImage.preview ? (
                    <div className="relative">
                      <div className="aspect-square relative rounded-lg overflow-hidden border border-gray-200">
                        <Image
                          src={designImage.preview}
                          alt="Design preview"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleDesignImageRemove}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                      >
                        <FaTrash size={12} />
                      </button>
                    </div>
                  ) : designImage.url ? (
                    <div className="relative">
                      <div className="aspect-square relative rounded-lg overflow-hidden border border-gray-200">
                        <Image
                          src={designImage.url}
                          alt={designImage.alt || "Design"}
                          fill
                          className="object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/images/logo.jpg';
                          }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleDesignImageRemove}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                      >
                        <FaTrash size={12} />
                      </button>
                    </div>
                  ) : null}
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (designFileInputRef.current) {
                          designFileInputRef.current.value = ''; // Reset to allow selecting same file again
                          designFileInputRef.current.click();
                        }
                      }}
                      className="w-full flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-purple-500 transition-colors"
                    >
                      <div className="text-center">
                        <FaUpload className="mx-auto h-6 w-6 text-gray-400 mb-2" />
                        <span className="block text-sm font-medium text-gray-600">
                          {(designImage.preview || designImage.url || designImageUrl) ? 'Replace Design' : 'Upload Design'}
                        </span>
                      </div>
                    </button>
                    <input
                      type="file"
                      ref={designFileInputRef}
                      onChange={handleDesignImageSelect}
                      accept="image/*"
                      className="hidden"
                    />
                    <div className="text-xs text-gray-500">Or enter URL:</div>
                    <input
                      type="url"
                      value={designImageUrl}
                      onChange={(e) => setDesignImageUrl(e.target.value)}
                      placeholder="https://example.com/design.jpg"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                    <input
                      type="text"
                      value={designImageAlt}
                      onChange={(e) => setDesignImageAlt(e.target.value)}
                      placeholder="Design alt text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Live Preview Section */}
            {(mockupImage.preview || mockupImage.url || mockupImageUrl || designImage.preview || designImage.url || designImageUrl || formData.name) && (
              <div className="space-y-4 border-t pt-6">
                <label className="block text-sm font-medium text-gray-700">
                  Live Preview - Product Card
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  This is how your product will appear on the frontend with the mockup and design images overlapping.
                </p>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                  <p className="text-xs text-green-800 font-medium">
                    💾 <strong>Save Note:</strong> The positioning, size, and rotation settings you adjust below will be automatically saved when you click "Save Changes" at the bottom of the form. This preview shows exactly how it will appear to customers.
                  </p>
                </div>
                <div className="max-w-sm mx-auto">
                  <p className="text-xs text-gray-500 mb-2 text-center">
                    👆 Click the preview card to view at full scale
                  </p>
                  <div 
                    className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden cursor-pointer hover:shadow-xl transition-shadow"
                    onClick={() => setShowFullPreview(true)}
                  >
                    <div 
                      className="relative bg-gray-100"
                      style={{
                        aspectRatio: '1/1',
                        width: '100%',
                        position: 'relative',
                        overflow: 'hidden',
                        isolation: 'isolate' // Isolate this container from transforms
                      }}
                    >
                      {(() => {
                        // Priority 1: Check if there are combinations - show first one
                        const sortedCombinations = [...combinations].sort((a, b) => (a.order || 0) - (b.order || 0));
                        const firstCombo = sortedCombinations.find(combo => 
                          (combo.mockupImage.preview || combo.mockupImage.url || combo.mockupImageUrl) && 
                          (combo.designImage.preview || combo.designImage.url || combo.designImageUrl)
                        );

                        if (firstCombo) {
                          return (
                            <ProductImageOverlay
                              key={`preview-combo-${firstCombo.id}`}
                              mockupImage={
                                firstCombo.mockupImage.preview 
                                  ? { url: firstCombo.mockupImage.preview, alt: firstCombo.mockupImageAlt || 'Mockup preview' }
                                  : firstCombo.mockupImage.url
                                  ? { url: firstCombo.mockupImage.url, alt: firstCombo.mockupImage.alt || firstCombo.mockupImageAlt || 'Mockup' }
                                  : firstCombo.mockupImageUrl 
                                  ? { url: firstCombo.mockupImageUrl, alt: firstCombo.mockupImageAlt || 'Mockup' }
                                  : undefined
                              }
                              designImage={
                                firstCombo.designImage.preview 
                                  ? { 
                                      url: firstCombo.designImage.preview, 
                                      alt: firstCombo.designImageAlt || 'Design preview',
                                      position: firstCombo.designPosition,
                                      scale: firstCombo.designScale,
                                      rotation: firstCombo.designRotation
                                    }
                                  : firstCombo.designImage.url
                                  ? { 
                                      url: firstCombo.designImage.url, 
                                      alt: firstCombo.designImage.alt || firstCombo.designImageAlt || 'Design',
                                      position: firstCombo.designPosition,
                                      scale: firstCombo.designScale,
                                      rotation: firstCombo.designRotation
                                    }
                                  : firstCombo.designImageUrl 
                                  ? { 
                                      url: firstCombo.designImageUrl, 
                                      alt: firstCombo.designImageAlt || 'Design',
                                      position: firstCombo.designPosition,
                                      scale: firstCombo.designScale,
                                      rotation: firstCombo.designRotation
                                    }
                                  : undefined
                              }
                              className="w-full h-full"
                            />
                          );
                        }

                        // Priority 2: Fall back to single mockup/design
                        if (mockupImage.preview || mockupImage.url || mockupImageUrl || designImage.preview || designImage.url || designImageUrl) {
                          return (
                            <ProductImageOverlay
                              key={`preview-${mockupImage.preview || mockupImage.url || mockupImageUrl || 'no-mockup'}-${designImage.preview || designImage.url || designImageUrl || 'no-design'}`}
                              mockupImage={
                                mockupImage.preview 
                                  ? { url: mockupImage.preview, alt: mockupImageAlt || 'Mockup preview' }
                                  : mockupImage.url
                                  ? { url: mockupImage.url, alt: mockupImage.alt || mockupImageAlt || 'Mockup' }
                                  : mockupImageUrl 
                                  ? { url: mockupImageUrl, alt: mockupImageAlt || 'Mockup' }
                                  : undefined
                              }
                              designImage={
                                designImage.preview 
                                  ? { 
                                      url: designImage.preview, 
                                      alt: designImageAlt || 'Design preview',
                                      position: designPosition,
                                      scale: designScale,
                                      rotation: designRotation
                                    }
                                  : designImage.url
                                  ? { 
                                      url: designImage.url, 
                                      alt: designImage.alt || designImageAlt || 'Design',
                                      position: designPosition,
                                      scale: designScale,
                                      rotation: designRotation
                                    }
                                  : designImageUrl 
                                  ? { 
                                      url: designImageUrl, 
                                      alt: designImageAlt || 'Design',
                                      position: designPosition,
                                      scale: designScale,
                                      rotation: designRotation
                                    }
                                  : undefined
                              }
                              className="w-full h-full"
                            />
                          );
                        }

                        // Fallback placeholder
                        return (
                          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                            <div className="bg-gradient-to-r from-purple-600 via-blue-500 to-orange-400 text-white brand-text text-sm px-3 py-1 rounded-lg">
                              MR SHIRT PERSONALISATION LTD
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-lg text-gray-900 mb-1">
                        {formData.name || 'Product Name'}
                      </h3>
                      <p className="text-sm text-gray-500 mb-2">
                        {formData.category || 'Category'}
                      </p>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {formData.description || 'Product description will appear here...'}
                      </p>
                      {formData.colors.length > 0 && (
                        <div className="flex items-center mb-3">
                          <span className="text-xs text-gray-500 mr-2">Colors:</span>
                          <div className="flex space-x-1">
                            {formData.colors.slice(0, 5).map((color, index) => (
                              <div
                                key={index}
                                className="w-4 h-4 rounded-full border border-gray-300"
                                style={{ backgroundColor: color.hexCode }}
                                title={color.name}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        {formData.price && formData.basePrice && formData.basePrice > formData.price ? (
                          <div className="flex flex-col items-start gap-1">
                            <span className="text-xs text-red-600 line-through tracking-tight">
                              RRP: £{formData.basePrice.toFixed(2)}
                            </span>
                            <span className="text-xl font-bold text-green-700 leading-tight">
                              £{formData.price.toFixed(2)}
                            </span>
                          </div>
                        ) : formData.price ? (
                          <span className="text-lg font-bold text-purple-600">
                            £{formData.price.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-lg font-bold text-purple-600">£0.00</span>
                        )}
                        <span className="text-sm text-purple-600">View Details →</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Design Image Position & Scale Controls */}
            {(designImage.preview || designImage.url || designImageUrl) && (
              <div className="space-y-4 border-t pt-6">
                <label className="block text-sm font-medium text-gray-700">
                  Design Image Position & Size (Design Only)
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Adjust the position, size, and rotation of the <strong>design image only</strong>. The mockup image remains unchanged.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-xs text-blue-800">
                    💡 <strong>Tip:</strong> Adjust the sliders below and watch the live preview update in real-time. These settings will be saved automatically when you click "Save Changes" at the bottom of the page.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Position X */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Horizontal Position: {designPosition.x}%
                    </label>
                    <input
                      type="range"
                      min="-50"
                      max="50"
                      value={designPosition.x}
                      onChange={(e) => setDesignPosition({ ...designPosition, x: parseInt(e.target.value) })}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Left</span>
                      <span>Center</span>
                      <span>Right</span>
                    </div>
                  </div>

                  {/* Position Y */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vertical Position: {designPosition.y}%
                    </label>
                    <input
                      type="range"
                      min="-50"
                      max="50"
                      value={designPosition.y}
                      onChange={(e) => setDesignPosition({ ...designPosition, y: parseInt(e.target.value) })}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Top</span>
                      <span>Center</span>
                      <span>Bottom</span>
                    </div>
                  </div>

                  {/* Scale */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Size: {designScale}%
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="200"
                      value={designScale}
                      onChange={(e) => setDesignScale(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>10%</span>
                      <span>100%</span>
                      <span>200%</span>
                    </div>
                  </div>

                  {/* Rotation */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rotation: {designRotation}°
                    </label>
                    <input
                      type="range"
                      min="-180"
                      max="180"
                      value={designRotation}
                      onChange={(e) => setDesignRotation(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>-180°</span>
                      <span>0°</span>
                      <span>180°</span>
                    </div>
                  </div>
                </div>

                {/* Preset Management */}
                <div className="border-t pt-4 mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Design Presets
                  </label>
                  <p className="text-xs text-gray-500 mb-3">
                    Save your current settings as a preset to reuse for future products, or load an existing preset.
                  </p>
                  
                  <div className="space-y-3">
                    {/* Load Preset */}
                    <div className="flex gap-2">
                      <select
                        value={selectedPreset}
                        onChange={(e) => setSelectedPreset(e.target.value)}
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select a preset to load...</option>
                        {presets.map(preset => (
                          <option key={preset._id} value={preset._id}>
                            {preset.name} {preset.description ? `- ${preset.description}` : ''}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={handleLoadPreset}
                        disabled={!selectedPreset}
                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Load
                      </button>
                    </div>

                    {/* Save Preset Button */}
                    <button
                      type="button"
                      onClick={() => setShowSavePresetModal(true)}
                      className="w-full px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                    >
                      <FaPlus className="h-4 w-4" />
                      Save Current Settings as Preset
                    </button>

                    {/* Preset List with Delete */}
                    {presets.length > 0 && (
                      <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                        <p className="text-xs font-medium text-gray-700 mb-2">Saved Presets:</p>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {presets.map(preset => (
                            <div key={preset._id} className="flex items-center justify-between text-xs">
                              <span className="text-gray-600">
                                {preset.name}
                                {preset.description && <span className="text-gray-400 ml-1">({preset.description})</span>}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleDeletePreset(preset._id)}
                                className="text-red-600 hover:text-red-800 ml-2"
                                title="Delete preset"
                              >
                                <FaTrash className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Reset Button */}
                <div className="flex justify-end mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setDesignPosition({ x: 0, y: 0 });
                      setDesignScale(100);
                      setDesignRotation(0);
                    }}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Reset to Default
                  </button>
                </div>
              </div>
            )}

            {/* Save Preset Modal */}
            {showSavePresetModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Save Design Preset</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Preset Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={presetName}
                        onChange={(e) => setPresetName(e.target.value)}
                        placeholder="e.g., Centered Large Design"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        maxLength={100}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description (Optional)
                      </label>
                      <textarea
                        value={presetDescription}
                        onChange={(e) => setPresetDescription(e.target.value)}
                        placeholder="e.g., For large logos centered on t-shirts"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                        maxLength={500}
                      />
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-xs text-blue-800">
                        <strong>Current Settings:</strong><br />
                        Position: X={designPosition.x}%, Y={designPosition.y}%<br />
                        Scale: {designScale}%<br />
                        Rotation: {designRotation}°
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setShowSavePresetModal(false);
                        setPresetName('');
                        setPresetDescription('');
                      }}
                      className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSavePreset}
                      disabled={presetLoading || !presetName.trim()}
                      className="flex-1 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {presetLoading ? 'Saving...' : 'Save Preset'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Mockup Selector Modal */}
            {showMockupSelector && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Select Previous Mockup</h3>
                    <button
                      type="button"
                      onClick={() => setShowMockupSelector(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {loadingMockups ? (
                    <div className="flex justify-center items-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                    </div>
                  ) : previousMockups.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <p>No previous mockups found.</p>
                      <p className="text-sm mt-2">Upload a mockup to see it here in the future.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {previousMockups.map((mockup, index) => {
                        console.log('🖼️ [Mockup] Rendering mockup:', index, mockup.url, mockup.productName);
                        return (
                          <button
                            key={`${mockup.url}-${index}`}
                            type="button"
                            onClick={() => handleSelectMockup(mockup)}
                            className="group relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-purple-500 transition-all hover:shadow-lg bg-white"
                          >
                            <img
                              src={mockup.url}
                              alt={mockup.alt || mockup.productName}
                              className="w-full h-full object-cover relative z-0"
                              style={{ display: 'block' }}
                              loading="lazy"
                              onLoad={() => {
                                console.log('✅ [Mockup] Image loaded successfully:', mockup.url);
                              }}
                              onError={(e) => {
                                console.error('❌ [Mockup] Image failed to load:', {
                                  url: mockup.url,
                                  productName: mockup.productName,
                                  error: e
                                });
                                const target = e.target as HTMLImageElement;
                                target.src = '/images/logo.png';
                              }}
                            />
                            <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-40 transition-opacity flex items-center justify-center z-10 pointer-events-none">
                              <span className="text-white opacity-0 group-hover:opacity-100 text-sm font-medium transition-opacity">
                                Select
                              </span>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent p-2 z-10 pointer-events-none">
                              <p className="text-white text-xs truncate font-medium">{mockup.productName}</p>
                              <p className="text-white/80 text-xs truncate">{mockup.category}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <div className="mt-6 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setShowMockupSelector(false)}
                      className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Full Scale Preview Modal */}
            {showFullPreview && (
              <div 
                className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
                onClick={() => setShowFullPreview(false)}
              >
                <div 
                  className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
                    <h3 className="text-lg font-semibold text-gray-900">Full Scale Preview - Product Card</h3>
                    <button
                      type="button"
                      onClick={() => setShowFullPreview(false)}
                      className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                      aria-label="Close preview"
                    >
                      ×
                    </button>
                  </div>
                  <div className="p-6">
                    <div className="max-w-2xl mx-auto">
                      <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                        <div 
                          className="relative bg-gray-100"
                          style={{
                            aspectRatio: '1/1',
                            width: '100%',
                            position: 'relative',
                            overflow: 'hidden',
                            isolation: 'isolate'
                          }}
                        >
                          {(() => {
                            // Priority 1: Check if there are combinations - show first one
                            const sortedCombinations = [...combinations].sort((a, b) => (a.order || 0) - (b.order || 0));
                            const firstCombo = sortedCombinations.find(combo => 
                              (combo.mockupImage.preview || combo.mockupImage.url || combo.mockupImageUrl) && 
                              (combo.designImage.preview || combo.designImage.url || combo.designImageUrl)
                            );

                            if (firstCombo) {
                              return (
                                <ProductImageOverlay
                                  key={`full-preview-combo-${firstCombo.id}`}
                                  mockupImage={
                                    firstCombo.mockupImage.preview 
                                      ? { url: firstCombo.mockupImage.preview, alt: firstCombo.mockupImageAlt || 'Mockup preview' }
                                      : firstCombo.mockupImage.url
                                      ? { url: firstCombo.mockupImage.url, alt: firstCombo.mockupImage.alt || firstCombo.mockupImageAlt || 'Mockup' }
                                      : firstCombo.mockupImageUrl 
                                      ? { url: firstCombo.mockupImageUrl, alt: firstCombo.mockupImageAlt || 'Mockup' }
                                      : undefined
                                  }
                                  designImage={
                                    firstCombo.designImage.preview 
                                      ? { 
                                          url: firstCombo.designImage.preview, 
                                          alt: firstCombo.designImageAlt || 'Design preview',
                                          position: firstCombo.designPosition,
                                          scale: firstCombo.designScale,
                                          rotation: firstCombo.designRotation
                                        }
                                      : firstCombo.designImage.url
                                      ? { 
                                          url: firstCombo.designImage.url, 
                                          alt: firstCombo.designImage.alt || firstCombo.designImageAlt || 'Design',
                                          position: firstCombo.designPosition,
                                          scale: firstCombo.designScale,
                                          rotation: firstCombo.designRotation
                                        }
                                      : firstCombo.designImageUrl 
                                      ? { 
                                          url: firstCombo.designImageUrl, 
                                          alt: firstCombo.designImageAlt || 'Design',
                                          position: firstCombo.designPosition,
                                          scale: firstCombo.designScale,
                                          rotation: firstCombo.designRotation
                                        }
                                      : undefined
                                  }
                                  className="w-full h-full"
                                />
                              );
                            }

                            // Priority 2: Fall back to single mockup/design
                            if (mockupImage.preview || mockupImage.url || mockupImageUrl || designImage.preview || designImage.url || designImageUrl) {
                              return (
                                <ProductImageOverlay
                                  key={`full-preview-${mockupImage.preview || mockupImage.url || mockupImageUrl || 'no-mockup'}-${designImage.preview || designImage.url || designImageUrl || 'no-design'}`}
                                  mockupImage={
                                    mockupImage.preview 
                                      ? { url: mockupImage.preview, alt: mockupImageAlt || 'Mockup preview' }
                                      : mockupImage.url
                                      ? { url: mockupImage.url, alt: mockupImage.alt || mockupImageAlt || 'Mockup' }
                                      : mockupImageUrl 
                                      ? { url: mockupImageUrl, alt: mockupImageAlt || 'Mockup' }
                                      : undefined
                                  }
                                  designImage={
                                    designImage.preview 
                                      ? { 
                                          url: designImage.preview, 
                                          alt: designImageAlt || 'Design preview',
                                          position: designPosition,
                                          scale: designScale,
                                          rotation: designRotation
                                        }
                                      : designImage.url
                                      ? { 
                                          url: designImage.url, 
                                          alt: designImage.alt || designImageAlt || 'Design',
                                          position: designPosition,
                                          scale: designScale,
                                          rotation: designRotation
                                        }
                                      : designImageUrl 
                                      ? { 
                                          url: designImageUrl, 
                                          alt: designImageAlt || 'Design',
                                          position: designPosition,
                                          scale: designScale,
                                          rotation: designRotation
                                        }
                                      : undefined
                                  }
                                  className="w-full h-full"
                                />
                              );
                            }

                            // Fallback placeholder
                            return (
                              <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                <div className="bg-gradient-to-r from-purple-600 via-blue-500 to-orange-400 text-white brand-text text-sm px-3 py-1 rounded-lg">
                                  MR SHIRT PERSONALISATION LTD
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Multiple Mockup/Design Combinations Section */}
            <div className="space-y-4 border-t pt-6 mt-6">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Multiple Design Combinations (Carousel Slides)
                  </label>
                  <p className="text-xs text-gray-500">
                    Create multiple mockup/design combinations that will appear as slides in the product carousel.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addCombination}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <FaPlus className="h-4 w-4" />
                  Add Combination
                </button>
              </div>

              {combinations.length === 0 ? (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                  <p className="text-sm text-gray-500 mb-2">No combinations added yet.</p>
                  <p className="text-xs text-gray-400">Click "Add Combination" to create your first design slide.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {combinations.map((combo, index) => (
                    <div key={combo.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                      <div className="flex items-center justify-between mb-4">
                        <input
                          type="text"
                          value={combo.name}
                          onChange={(e) => updateCombination(combo.id, { name: e.target.value })}
                          placeholder="Combination name (e.g., Front Design, Back Design)"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <button
                          type="button"
                          onClick={() => removeCombination(combo.id)}
                          className="ml-2 text-red-600 hover:text-red-700 px-3 py-2"
                          title="Remove combination"
                        >
                          <FaTrash className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Mockup Image */}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-2">Mockup Image</label>
                          {combo.mockupImage.preview || combo.mockupImage.url || combo.mockupImageUrl ? (
                            <div className="relative mb-2">
                              <div className="aspect-square relative rounded-lg overflow-hidden border border-gray-200">
                                <Image
                                  src={combo.mockupImage.preview || combo.mockupImage.url || combo.mockupImageUrl}
                                  alt={combo.mockupImageAlt || 'Mockup'}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  if (combo.mockupImage.preview) URL.revokeObjectURL(combo.mockupImage.preview);
                                  updateCombination(combo.id, {
                                    mockupImage: { file: null, preview: null, url: undefined, alt: undefined },
                                    mockupImageUrl: '',
                                    mockupImageAlt: ''
                                  });
                                }}
                                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                              >
                                <FaTrash size={10} />
                              </button>
                            </div>
                          ) : null}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                const file = e.target.files[0];
                                if (combo.mockupImage.preview) URL.revokeObjectURL(combo.mockupImage.preview);
                                updateCombination(combo.id, {
                                  mockupImage: { file, preview: URL.createObjectURL(file) },
                                  mockupImageUrl: ''
                                });
                              }
                            }}
                            className="hidden"
                            id={`mockup-${combo.id}`}
                          />
                          <label
                            htmlFor={`mockup-${combo.id}`}
                            className="block w-full text-center border-2 border-dashed border-gray-300 rounded-lg p-3 hover:border-purple-500 cursor-pointer text-sm"
                          >
                            <FaUpload className="mx-auto h-4 w-4 text-gray-400 mb-1" />
                            {combo.mockupImage.preview || combo.mockupImage.url || combo.mockupImageUrl ? 'Replace' : 'Upload'} Mockup
                          </label>
                          <input
                            type="url"
                            value={combo.mockupImageUrl}
                            onChange={(e) => updateCombination(combo.id, { mockupImageUrl: e.target.value })}
                            placeholder="Or enter mockup URL"
                            className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                          />
                          <input
                            type="text"
                            value={combo.mockupImageAlt}
                            onChange={(e) => updateCombination(combo.id, { mockupImageAlt: e.target.value })}
                            placeholder="Mockup alt text"
                            className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                          />
                        </div>

                        {/* Design Image */}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-2">Design Image</label>
                          {combo.designImage.preview || combo.designImage.url || combo.designImageUrl ? (
                            <div className="relative mb-2">
                              <div className="aspect-square relative rounded-lg overflow-hidden border border-gray-200">
                                <Image
                                  src={combo.designImage.preview || combo.designImage.url || combo.designImageUrl}
                                  alt={combo.designImageAlt || 'Design'}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  if (combo.designImage.preview) URL.revokeObjectURL(combo.designImage.preview);
                                  updateCombination(combo.id, {
                                    designImage: { file: null, preview: null, url: undefined, alt: undefined },
                                    designImageUrl: '',
                                    designImageAlt: ''
                                  });
                                }}
                                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                              >
                                <FaTrash size={10} />
                              </button>
                            </div>
                          ) : null}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                const file = e.target.files[0];
                                if (combo.designImage.preview) URL.revokeObjectURL(combo.designImage.preview);
                                updateCombination(combo.id, {
                                  designImage: { file, preview: URL.createObjectURL(file) },
                                  designImageUrl: ''
                                });
                              }
                            }}
                            className="hidden"
                            id={`design-${combo.id}`}
                          />
                          <label
                            htmlFor={`design-${combo.id}`}
                            className="block w-full text-center border-2 border-dashed border-gray-300 rounded-lg p-3 hover:border-purple-500 cursor-pointer text-sm"
                          >
                            <FaUpload className="mx-auto h-4 w-4 text-gray-400 mb-1" />
                            {combo.designImage.preview || combo.designImage.url || combo.designImageUrl ? 'Replace' : 'Upload'} Design
                          </label>
                          <input
                            type="url"
                            value={combo.designImageUrl}
                            onChange={(e) => updateCombination(combo.id, { designImageUrl: e.target.value })}
                            placeholder="Or enter design URL"
                            className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                          />
                          <input
                            type="text"
                            value={combo.designImageAlt}
                            onChange={(e) => updateCombination(combo.id, { designImageAlt: e.target.value })}
                            placeholder="Design alt text"
                            className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                          />
                        </div>
                      </div>

                      {/* Live Preview - Centered and above controls */}
                      {(combo.mockupImage.preview || combo.mockupImage.url || combo.mockupImageUrl) && 
                       (combo.designImage.preview || combo.designImage.url || combo.designImageUrl) && (
                        <div className="mt-4 border-t pt-4 mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                            Preview
                          </label>
                          <div className="flex justify-center">
                            <div className="relative bg-gray-100 rounded-lg overflow-hidden border border-gray-200" style={{ aspectRatio: '1/1', maxWidth: '400px', width: '100%' }}>
                              <ProductImageOverlay
                                mockupImage={
                                  combo.mockupImage.preview 
                                    ? { 
                                        url: combo.mockupImage.preview, 
                                        alt: combo.mockupImageAlt || combo.mockupImage.alt || 'Mockup preview'
                                      }
                                    : combo.mockupImage.url
                                    ? { 
                                        url: combo.mockupImage.url, 
                                        alt: combo.mockupImageAlt || combo.mockupImage.alt || 'Mockup'
                                      }
                                    : combo.mockupImageUrl
                                    ? { 
                                        url: combo.mockupImageUrl, 
                                        alt: combo.mockupImageAlt || 'Mockup'
                                      }
                                    : undefined
                                }
                                designImage={
                                  combo.designImage.preview 
                                    ? { 
                                        url: combo.designImage.preview, 
                                        alt: combo.designImageAlt || combo.designImage.alt || 'Design preview',
                                        position: combo.designPosition,
                                        scale: combo.designScale,
                                        rotation: combo.designRotation
                                      }
                                    : combo.designImage.url
                                    ? { 
                                        url: combo.designImage.url, 
                                        alt: combo.designImageAlt || combo.designImage.alt || 'Design',
                                        position: combo.designPosition,
                                        scale: combo.designScale,
                                        rotation: combo.designRotation
                                      }
                                    : combo.designImageUrl
                                    ? { 
                                        url: combo.designImageUrl, 
                                        alt: combo.designImageAlt || 'Design',
                                        position: combo.designPosition,
                                        scale: combo.designScale,
                                        rotation: combo.designRotation
                                      }
                                    : undefined
                                }
                                className="w-full h-full"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Quick position controls */}
                      {(combo.designImage.preview || combo.designImage.url || combo.designImageUrl) && (
                        <div className="mt-2 space-y-2 border-t pt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-3">
                            Design Image Position & Size (for this combination)
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs text-gray-600">X: {combo.designPosition.x}</label>
                              <input
                                type="range"
                                min="-50"
                                max="50"
                                value={combo.designPosition.x}
                                onChange={(e) => updateCombination(combo.id, {
                                  designPosition: { ...combo.designPosition, x: parseInt(e.target.value) }
                                })}
                                className="w-full"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-600">Y: {combo.designPosition.y}</label>
                              <input
                                type="range"
                                min="-50"
                                max="50"
                                value={combo.designPosition.y}
                                onChange={(e) => updateCombination(combo.id, {
                                  designPosition: { ...combo.designPosition, y: parseInt(e.target.value) }
                                })}
                                className="w-full"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-xs text-gray-600">Scale: {combo.designScale}%</label>
                            <input
                              type="range"
                              min="10"
                              max="200"
                              value={combo.designScale}
                              onChange={(e) => updateCombination(combo.id, { designScale: parseInt(e.target.value) })}
                              className="w-full"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-600">Rotation: {combo.designRotation}°</label>
                            <input
                              type="range"
                              min="-180"
                              max="180"
                              value={combo.designRotation}
                              onChange={(e) => updateCombination(combo.id, { designRotation: parseInt(e.target.value) })}
                              className="w-full"
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            Adjust position, scale, and rotation above to see changes in the preview above.
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Image Upload Section */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Product Images (Legacy - Optional)</label>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                <p className="text-xs text-yellow-800 font-medium mb-1">
                  ⚠️ Legacy System - Optional
                </p>
                <p className="text-xs text-yellow-700">
                  These images are only used as a fallback if mockup/design images are not provided. 
                  <strong> The mockup and design images above are the primary/preferred method</strong> and will be used for product cards and detail pages when available.
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Existing Images */}
                {formData.images.map((image, index) => (
                  <div key={`existing-${index}`} className="relative group">
                    <div className="aspect-square relative rounded-lg overflow-hidden border border-gray-200">
                      <Image
                        src={image.url}
                        alt={image.alt}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleImageRemove(index, true)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <FaTrash size={12} />
                    </button>
                    <div className="absolute bottom-2 left-2 right-2">
                      <select
                        value={image.color || ''}
                        onChange={(e) => handleImageColorChange(index, e.target.value, 'existing')}
                        className="w-full text-xs bg-white/90 backdrop-blur-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-purple-500"
                      >
                        <option value="">No color</option>
                        {formData.colors.map((color, colorIndex) => (
                          <option key={colorIndex} value={color.name}>
                            {color.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
                
                {/* New Uploaded Images */}
                {uploadedImages.map((image, index) => (
                  <div key={`new-${index}`} className="relative group">
                    <div className="aspect-square relative rounded-lg overflow-hidden border border-gray-200">
                      <Image
                        src={image.preview}
                        alt={`Preview ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleImageRemove(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <FaTrash size={12} />
                    </button>
                    <div className="absolute bottom-2 left-2 right-2">
                      <select
                        value={image.color || ''}
                        onChange={(e) => handleImageColorChange(index, e.target.value, 'uploaded')}
                        className="w-full text-xs bg-white/90 backdrop-blur-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-purple-500"
                      >
                        <option value="">No color</option>
                        {formData.colors.map((color, colorIndex) => (
                          <option key={colorIndex} value={color.name}>
                            {color.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}

                {/* URL Images */}
                {urlImages.map((image, index) => (
                  <div key={`url-${index}`} className="relative group">
                    <div className="aspect-square relative rounded-lg overflow-hidden border border-gray-200">
                      <Image
                        src={image.url}
                        alt={image.alt}
                        fill
                        className="object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/images/logo.jpg';
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleUrlImageRemove(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <FaTrash size={12} />
                    </button>
                    <div className="absolute bottom-2 left-2 right-2">
                      <select
                        value={image.color || ''}
                        onChange={(e) => handleImageColorChange(index, e.target.value, 'url')}
                        className="w-full text-xs bg-white/90 backdrop-blur-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-purple-500"
                      >
                        <option value="">No color</option>
                        {formData.colors.map((color, colorIndex) => (
                          <option key={colorIndex} value={color.name}>
                            {color.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}

                {/* Add Image Buttons */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 transition-colors"
                >
                  <div className="text-center">
                    <FaUpload className="mx-auto h-8 w-8 text-gray-400" />
                    <span className="mt-2 block text-sm font-medium text-gray-600">Upload Image</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setShowUrlInput(true)}
                  className="aspect-square flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 transition-colors"
                >
                  <div className="text-center">
                    <FaLink className="mx-auto h-8 w-8 text-gray-400" />
                    <span className="mt-2 block text-sm font-medium text-gray-600">Add URL</span>
                  </div>
                </button>
              </div>
              
              {/* URL Input Modal */}
              {showUrlInput && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-lg p-6 max-w-md w-full">
                    <h3 className="text-lg font-semibold mb-4">Add Image URL</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Image URL
                        </label>
                        <input
                          type="url"
                          value={imageUrl}
                          onChange={(e) => setImageUrl(e.target.value)}
                          placeholder="https://example.com/image.jpg"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Alt Text
                        </label>
                        <input
                          type="text"
                          value={imageAlt}
                          onChange={(e) => setImageAlt(e.target.value)}
                          placeholder="Product image description"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Color (Optional)
                        </label>
                        <select
                          value={imageColor}
                          onChange={(e) => setImageColor(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="">No specific color</option>
                          {formData.colors.map((color, index) => (
                            <option key={index} value={color.name}>
                              {color.name}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                          Associate this image with a specific color
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-3 mt-6">
                      <button
                        type="button"
                        onClick={() => {
                          setShowUrlInput(false);
                          setImageUrl('');
                          setImageAlt('');
                          setImageColor('');
                        }}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleUrlImageAdd}
                        disabled={!imageUrl.trim() || !imageAlt.trim()}
                        className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
                      >
                        Add Image
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageSelect}
                accept="image/*"
                multiple
                className="hidden"
              />
              <div className="text-xs text-gray-500 space-y-1">
                <p>Upload product images (PNG, JPG up to 5MB) or add image URLs</p>
                <p className="text-purple-600 font-medium">💡 Tip: Use the color dropdowns to associate images with specific colors for the color selection feature!</p>
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-6 border-t">
              <button
                type="button"
                onClick={() => router.push('/admin/products')}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Save Changes
              </button>
            </div>
          </form>

          {/* Barcode Section */}
          <div className="mt-10 bg-gray-50 rounded-lg p-6 border border-gray-200">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Product Barcodes</h2>
            {formData.barcodes && formData.barcodes.length > 0 ? (
              <div className="space-y-4">
               <button
                 onClick={handleExportAllBarcodesPDF}
                 className="mb-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
               >
                 Export All Barcodes for Printing (PDF)
               </button>
                {formData.barcodes.map((barcode, idx) => (
                  <div key={barcode.value + barcode.colorName + barcode.size + idx} className="flex items-center gap-4 bg-white p-4 rounded shadow">
                    <Barcode
                      value={barcode.value}
                      format="CODE128"
                      width={2}
                      height={60}
                      displayValue={true}
                      fontSize={14}
                    />
                    <div>
                      <div className="font-semibold text-xs mb-1">{formData.name} - <span style={{ color: barcode.colorHex }}>{barcode.colorName}</span> - {barcode.size}</div>
                      <div className="text-xs text-gray-700">{barcode.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500">No barcodes assigned. Use the Barcodes tab to generate them.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 