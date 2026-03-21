'use client';

import {
  useState,
  useEffect,
  type ChangeEvent,
  type ChangeEventHandler,
  type FormEvent,
} from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Header from '@/app/components/Header';
import { FaPhone, FaWhatsapp } from 'react-icons/fa';

/** Fixed add-on price for jersey back name/number printing (per garment × quantity) */
const JERSEY_BACK_PRINT_PRICE_GBP = 15;

interface Product {
  _id: string;
  name: string;
  price: number;
  basePrice?: number;
  images: Array<{ url: string; alt: string; color?: string }>;
  colors: Array<{ name: string; hexCode: string; imageUrl?: string }>;
  sizes: string[];
  category: string;
}

interface CustomOrderForm {
  // Contact Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  preferredContact: 'email' | 'phone';
  company: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  
  // Customization Information
  /** Standard catalog order vs jersey-only personalisation flow */
  orderCategory: 'standard' | 'jersey_personalisation';
  /** When jersey_personalisation: who supplies the jersey */
  jerseySupply: '' | 'provide_own' | 'purchase_through_us';
  /** Back print only: letters, numbers, or both — £15 for the print add-on */
  jerseyPrintOption: '' | 'letters_only' | 'numbers_only' | 'both';
  jerseyBackName: string;
  jerseyBackNumber: string;
  /** Colour of vinyl / letters & numbers on the back */
  jerseyPrintColour: string;
  selectedProduct: string;
  quantity: number;
  sizeQuantities: { [color: string]: { [size: string]: number } };
  selectedColors: string[];
  printingType: 'dtf';
  printingSurface: string[];
  designLocation: string[];
  printSize: string;
  paperSize: 'A4' | 'A3';
  designFiles: File[];
  needsDesignAssistance: boolean;
  notes: string;
}

function getInitialFormData(): CustomOrderForm {
  return {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    preferredContact: 'email',
    company: '',
    address: '',
    city: '',
    province: '',
    postalCode: '',
    orderCategory: 'standard',
    jerseySupply: '',
    jerseyPrintOption: '',
    jerseyBackName: '',
    jerseyBackNumber: '',
    jerseyPrintColour: '',
    selectedProduct: '',
    quantity: 1,
    sizeQuantities: {},
    selectedColors: [],
    printingType: 'dtf',
    printingSurface: [],
    designLocation: [],
    printSize: '',
    paperSize: 'A4',
    designFiles: [],
    needsDesignAssistance: false,
    notes: '',
  };
}

type ActiveCustomOrderForm = 'dtf' | 'jersey' | null;

type ContactInputChange = ChangeEventHandler<
  HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
>;

function ContactInformationSection({
  formData,
  handleInputChange,
  variant = 'dtf',
}: {
  formData: CustomOrderForm;
  handleInputChange: ContactInputChange;
  variant?: 'dtf' | 'jersey';
}) {
  const ring =
    variant === 'jersey'
      ? 'focus:ring-emerald-500 focus:border-emerald-500/30'
      : 'focus:ring-purple-500 focus:border-transparent';
  const inputClass = `w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 ${ring}`;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">Contact Information</h2>
      <p className="text-gray-600 mb-6">
        Please introduce yourself. We will contact you within 2 working days to arrange all the details to create the
        perfect customization for you.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
            First Name *
          </label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            required
            value={formData.firstName}
            onChange={handleInputChange}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
            Last Name *
          </label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            required
            value={formData.lastName}
            onChange={handleInputChange}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            value={formData.email}
            onChange={handleInputChange}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
            Phone *
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            required
            value={formData.phone}
            onChange={handleInputChange}
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Contact Method</label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="preferredContact"
                value="email"
                checked={formData.preferredContact === 'email'}
                onChange={handleInputChange}
                className="mr-2"
              />
              Email
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="preferredContact"
                value="phone"
                checked={formData.preferredContact === 'phone'}
                onChange={handleInputChange}
                className="mr-2"
              />
              Phone
            </label>
          </div>
        </div>

        <div>
          <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
            Company
          </label>
          <input
            type="text"
            id="company"
            name="company"
            value={formData.company}
            onChange={handleInputChange}
            className={inputClass}
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
            Address *
          </label>
          <input
            type="text"
            id="address"
            name="address"
            required
            value={formData.address}
            onChange={handleInputChange}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
            City *
          </label>
          <input
            type="text"
            id="city"
            name="city"
            required
            value={formData.city}
            onChange={handleInputChange}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="province" className="block text-sm font-medium text-gray-700 mb-2">
            Province *
          </label>
          <input
            type="text"
            id="province"
            name="province"
            required
            value={formData.province}
            onChange={handleInputChange}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-2">
            Postal Code *
          </label>
          <input
            type="text"
            id="postalCode"
            name="postalCode"
            required
            value={formData.postalCode}
            onChange={handleInputChange}
            className={inputClass}
          />
        </div>
      </div>
    </div>
  );
}

export default function CustomOrdersPage() {
  const router = useRouter();
  /** DTF custom order catalogue (excludes jersey-only rows) */
  const [dtfProducts, setDtfProducts] = useState<Product[]>([]);
  /** Jersey custom order catalogue (admin-uploaded jersey form products only) */
  const [jerseyProducts, setJerseyProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
  const [previewColor, setPreviewColor] = useState<string>('');
  const [previewImageIndex, setPreviewImageIndex] = useState<number>(0);

  /** null = show DTF vs Jersey chooser; set when user picks a form */
  const [activeForm, setActiveForm] = useState<ActiveCustomOrderForm>(null);

  const [formData, setFormData] = useState<CustomOrderForm>(() => getInitialFormData());

  const [selectedProductData, setSelectedProductData] = useState<Product | null>(null);
  const [dtfUnitPrices, setDtfUnitPrices] = useState<{ a4: number; a3: number } | null>(null);

  const catalogProducts = activeForm === 'jersey' ? jerseyProducts : dtfProducts;

  const openPreview = (product: Product) => {
    setPreviewProduct(product);
    setPreviewColor('');
    setPreviewImageIndex(0);
  };

  const closePreview = () => {
    setPreviewProduct(null);
    setPreviewColor('');
    setPreviewImageIndex(0);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const fetchDtfPrices = async () => {
      try {
        const [a4Res, a3Res] = await Promise.all([
          fetch('/api/site-settings?key=dtfA4UnitPrice'),
          fetch('/api/site-settings?key=dtfA3UnitPrice'),
        ]);
        const a4Data = a4Res.ok ? await a4Res.json() : null;
        const a3Data = a3Res.ok ? await a3Res.json() : null;
        const a4 = Number(a4Data?.value);
        const a3 = Number(a3Data?.value);
        if (!Number.isFinite(a4) || !Number.isFinite(a3)) {
          setDtfUnitPrices(null);
          return;
        }
        setDtfUnitPrices({ a4, a3 });
      } catch {
        setDtfUnitPrices(null);
      }
    };
    fetchDtfPrices();
  }, []);

  // Auto-dismiss success messages after 5 seconds
  useEffect(() => {
    if (message && message.type === 'success') {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const startDtfForm = () => {
    setFormData({
      ...getInitialFormData(),
      orderCategory: 'standard',
      jerseySupply: '',
      jerseyPrintOption: '',
      jerseyBackName: '',
      jerseyBackNumber: '',
      jerseyPrintColour: '',
    });
    setSelectedProductData(null);
    setActiveForm('dtf');
  };

  const startJerseyForm = () => {
    setFormData({
      ...getInitialFormData(),
      orderCategory: 'jersey_personalisation',
      jerseySupply: '',
      jerseyPrintOption: '',
      jerseyBackName: '',
      jerseyBackNumber: '',
      jerseyPrintColour: '',
      printingSurface: ['back'],
      designLocation: ['center'],
    });
    setSelectedProductData(null);
    setActiveForm('jersey');
  };

  const backToFormChooser = () => {
    setFormData(getInitialFormData());
    setSelectedProductData(null);
    setActiveForm(null);
    setMessage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const fetchProducts = async () => {
    try {
      const [dtfRes, jerseyRes] = await Promise.all([
        fetch('/api/products?customizable=true'),
        fetch('/api/products?customizable=true&jerseyCustomOrderOnly=true'),
      ]);
      if (dtfRes.ok) {
        const data = await dtfRes.json();
        setDtfProducts(data.products || []);
      }
      if (jerseyRes.ok) {
        const data = await jerseyRes.json();
        setJerseyProducts(data.products || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    if (name === 'jerseySupply') {
      setFormData((prev) => ({
        ...prev,
        jerseySupply: value as 'provide_own' | 'purchase_through_us',
      }));
      return;
    }

    if (name === 'jerseyPrintOption') {
      setFormData((prev) => ({
        ...prev,
        jerseyPrintOption: value as CustomOrderForm['jerseyPrintOption'],
      }));
      return;
    }
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'file') {
      const file = (e.target as HTMLInputElement).files?.[0] || null;
      setFormData(prev => ({ ...prev, [name]: file }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleProductChange = (productId: string) => {
    const product = catalogProducts.find((p) => p._id === productId);
    setSelectedProductData(product || null);
    
    // Initialize size quantities (will be set when colors are selected)
    const initialSizeQuantities: { [color: string]: { [size: string]: number } } = {};
    
    setFormData(prev => ({
      ...prev,
      selectedProduct: productId,
      selectedColors: [],
      sizeQuantities: initialSizeQuantities
    }));
  };

  const handleSizeQuantityChange = (color: string, size: string, quantity: number) => {
    setFormData(prev => ({
      ...prev,
      sizeQuantities: {
        ...prev.sizeQuantities,
        [color]: {
          ...prev.sizeQuantities[color],
          [size]: quantity
        }
      }
    }));
  };

  const handleColorChange = (colorName: string, checked: boolean) => {
    setFormData(prev => {
      const newSelectedColors = checked 
        ? [...prev.selectedColors, colorName]
        : prev.selectedColors.filter(color => color !== colorName);
      
      // Initialize size quantities for new colors
      const newSizeQuantities = { ...prev.sizeQuantities };
      if (checked && selectedProductData?.sizes) {
        newSizeQuantities[colorName] = {};
        selectedProductData.sizes.forEach(size => {
          newSizeQuantities[colorName][size] = 0;
        });
      } else if (!checked) {
        delete newSizeQuantities[colorName];
      }
      
      return {
        ...prev,
        selectedColors: newSelectedColors,
        sizeQuantities: newSizeQuantities
      };
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    if (formData.orderCategory === 'jersey_personalisation') {
      if (!formData.jerseySupply || (formData.jerseySupply !== 'provide_own' && formData.jerseySupply !== 'purchase_through_us')) {
        setMessage({
          type: 'error',
          text: 'Please choose whether you will provide the jersey or would like to purchase one through us.',
        });
        setSubmitting(false);
        return;
      }
      const opt = formData.jerseyPrintOption;
      if (!opt || !['letters_only', 'numbers_only', 'both'].includes(opt)) {
        setMessage({
          type: 'error',
          text: 'Please choose whether you want letters only, numbers only, or both on the back.',
        });
        setSubmitting(false);
        return;
      }
      if (!formData.jerseyPrintColour.trim()) {
        setMessage({
          type: 'error',
          text: 'Please enter the colour for the letters and/or numbers.',
        });
        setSubmitting(false);
        return;
      }
      if ((opt === 'letters_only' || opt === 'both') && !formData.jerseyBackName.trim()) {
        setMessage({
          type: 'error',
          text: 'Please enter the name for the back letters.',
        });
        setSubmitting(false);
        return;
      }
      if ((opt === 'numbers_only' || opt === 'both') && !formData.jerseyBackNumber.trim()) {
        setMessage({
          type: 'error',
          text: 'Please enter the shirt number.',
        });
        setSubmitting(false);
        return;
      }
    }

    try {
      const formDataToSend = new FormData();

      const payload: CustomOrderForm & { jerseyBackPrintPriceGbp?: number } = {
        ...formData,
        ...(formData.orderCategory === 'jersey_personalisation'
          ? {
              printingSurface: ['back'],
              designLocation: ['center'],
              jerseyBackPrintPriceGbp: JERSEY_BACK_PRINT_PRICE_GBP,
              needsDesignAssistance: false,
            }
          : {}),
      };

      // Add all form fields
      Object.entries(payload).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          if (key === 'designFiles' && Array.isArray(value)) {
            // Handle multiple files
            value.forEach((file, index) => {
              formDataToSend.append(`designFile_${index}`, file);
            });
            formDataToSend.append('designFileCount', value.length.toString());
          } else if (key === 'printingSurface' && Array.isArray(value)) {
            // Handle array fields by joining with comma
            formDataToSend.append(key, value.join(','));
          } else if (key === 'designLocation' && Array.isArray(value)) {
            // Handle array fields by joining with comma
            formDataToSend.append(key, value.join(','));
          } else if (key === 'sizeQuantities' && typeof value === 'object') {
            // Handle size quantities object
            formDataToSend.append(key, JSON.stringify(value));
          } else if (key === 'selectedColors' && Array.isArray(value)) {
            // Handle array fields by joining with comma
            formDataToSend.append(key, value.join(','));
          } else {
            formDataToSend.append(key, value.toString());
          }
        }
      });

      const response = await fetch('/api/custom-orders', {
        method: 'POST',
        body: formDataToSend,
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Custom order submitted successfully! We will contact you within 2 working days.' });
        
        // Scroll to top of page
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        setFormData(getInitialFormData());
        setSelectedProductData(null);
        setActiveForm(null);
      } else {
        const error = await response.json();
        setMessage({
          type: 'error',
          text: error.error || error.message || 'Failed to submit custom order. Please try again.',
        });
      }
    } catch (error) {
      console.error('Error submitting custom order:', error);
      setMessage({ type: 'error', text: 'Failed to submit custom order. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Product Preview Modal */}
        {previewProduct && (() => {
          const colorImageUrl =
            previewColor
              ? previewProduct.colors?.find((c) => c.name === previewColor && c.imageUrl)?.imageUrl
              : undefined;

          const colorMatchedImages = previewColor
            ? (previewProduct.images || []).filter((img) => img.color === previewColor)
            : [];

          const baseImages = previewColor && colorMatchedImages.length > 0
            ? colorMatchedImages
            : (previewProduct.images || []);

          const previewImages = [
            ...(colorImageUrl ? [{ url: colorImageUrl, alt: `${previewProduct.name} - ${previewColor}` }] : []),
            ...baseImages.map((img) => ({ url: img.url, alt: img.alt || previewProduct.name }))
          ].filter((img, idx, arr) => arr.findIndex((x) => x.url === img.url) === idx);

          const safeIndex = Math.min(previewImageIndex, Math.max(0, previewImages.length - 1));
          const activeImage = previewImages[safeIndex];

          return (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
              role="dialog"
              aria-modal="true"
              aria-label="Product preview"
              onClick={closePreview}
            >
              <div
                className="w-full max-w-3xl bg-white rounded-xl shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 whitespace-normal break-words leading-snug">
                      {previewProduct.name}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {previewProduct.colors?.length || 0} colours • {previewProduct.images?.length || 0} images
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        handleProductChange(previewProduct._id);
                        closePreview();
                        const el = document.getElementById('selectedProduct');
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }}
                      className="px-3 py-2 text-sm font-medium bg-purple-600 text-white rounded-md hover:bg-purple-700"
                    >
                      Select
                    </button>
                    <button
                      type="button"
                      onClick={closePreview}
                      className="p-2 rounded-md hover:bg-gray-100"
                      aria-label="Close preview"
                    >
                      <svg className="w-5 h-5 text-gray-700" viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                  <div className="relative bg-gray-100">
                    <div className="relative aspect-square">
                      {activeImage ? (
                        <Image
                          src={activeImage.url}
                          alt={activeImage.alt || previewProduct.name}
                          fill
                          className="object-contain bg-white"
                          sizes="(max-width: 768px) 100vw, 50vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-sm text-gray-500">No images available</span>
                        </div>
                      )}
                    </div>

                    {previewImages.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() => setPreviewImageIndex((i) => (i - 1 + previewImages.length) % previewImages.length)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow"
                          aria-label="Previous image"
                        >
                          <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewImageIndex((i) => (i + 1) % previewImages.length)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow"
                          aria-label="Next image"
                        >
                          <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>

                  <div className="p-4">
                    <div className="mb-4">
                      {(() => {
                        const hasDiscount =
                          typeof previewProduct.basePrice === 'number' &&
                          typeof previewProduct.price === 'number' &&
                          previewProduct.basePrice > previewProduct.price;

                        return hasDiscount ? (
                          <div className="flex items-end gap-2">
                            <span className="text-sm text-gray-400 line-through">£{previewProduct.basePrice!.toFixed(2)}</span>
                            <span className="text-2xl font-bold text-green-700">£{previewProduct.price.toFixed(2)}</span>
                          </div>
                        ) : (
                          <div className="text-2xl font-bold text-gray-900">£{previewProduct.price.toFixed(2)}</div>
                        );
                      })()}
                      <p className="text-xs text-gray-500 mt-1">Tap a colour to filter images.</p>
                    </div>

                    <div className="mb-5">
                      <div className="text-sm font-medium text-gray-900 mb-2">Colours</div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewColor('');
                            setPreviewImageIndex(0);
                          }}
                          className={`px-3 py-1.5 text-xs rounded-full border ${
                            previewColor === '' ? 'border-purple-600 bg-purple-50 text-purple-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          All
                        </button>
                        {(previewProduct.colors || []).map((c) => (
                          <button
                            type="button"
                            key={c.name}
                            onClick={() => {
                              setPreviewColor(c.name);
                              setPreviewImageIndex(0);
                            }}
                            className={`flex items-center gap-2 px-2 py-1.5 rounded-full border text-xs ${
                              previewColor === c.name ? 'border-purple-600 bg-purple-50' : 'border-gray-300 hover:bg-gray-50'
                            }`}
                            aria-label={`Filter by ${c.name}`}
                            title={c.name}
                          >
                            <span className="w-4 h-4 rounded-full border border-gray-300" style={{ backgroundColor: c.hexCode }} />
                            <span className="max-w-[120px] truncate text-gray-800">{c.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {previewImages.length > 1 && (
                      <div>
                        <div className="text-sm font-medium text-gray-900 mb-2">Images</div>
                        <div className="flex gap-2 overflow-x-auto pb-2">
                          {previewImages.map((img, idx) => (
                            <button
                              type="button"
                              key={img.url}
                              onClick={() => setPreviewImageIndex(idx)}
                              className={`relative w-16 h-16 rounded-lg overflow-hidden border ${
                                idx === safeIndex ? 'border-purple-600' : 'border-gray-200 hover:border-gray-400'
                              }`}
                              aria-label={`Select image ${idx + 1}`}
                            >
                              <Image src={img.url} alt={img.alt || previewProduct.name} fill className="object-cover" sizes="64px" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Custom Orders</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-4">
            Tell us about your idea. We will contact you within 2 working days to arrange all the details 
            to create the perfect customization for you.
          </p>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 max-w-2xl mx-auto rounded">
            <p className="text-sm text-yellow-800">
              <strong>Delivery Timeframe:</strong> Custom orders typically take 1-2 weeks to complete, depending on order size. Large orders may require additional time.
            </p>
          </div>
        </div>

        {/* Sticky form switcher — both options always visible; click to open or switch */}
        <div className="sticky top-20 z-30 -mx-4 px-4 py-3 mb-6 border-b border-gray-200/80 bg-gray-50/95 backdrop-blur-sm shadow-sm sm:mx-0 sm:rounded-xl sm:border sm:border-gray-200 sm:top-24">
          <p className="text-center text-xs font-medium text-gray-500 mb-2 sm:hidden">Choose order type</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch sm:justify-center sm:gap-4 max-w-4xl mx-auto">
            <button
              type="button"
              onClick={startDtfForm}
              aria-pressed={activeForm === 'dtf'}
              className={`flex flex-1 flex-col rounded-xl border-2 p-3 text-left transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 sm:min-h-[88px] sm:max-w-md ${
                activeForm === 'dtf'
                  ? 'border-purple-500 bg-purple-50 shadow-md ring-2 ring-purple-400/40 focus:ring-purple-500'
                  : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50/50 focus:ring-purple-500'
              }`}
            >
              <span className="text-[10px] font-semibold uppercase tracking-wide text-purple-600">Catalog &amp; DTF</span>
              <span className="text-base font-bold text-gray-900">DTF custom order</span>
              <span className="mt-1 text-xs text-gray-600 line-clamp-2 sm:line-clamp-none">
                Garments from our range — t-shirts, hoodies, workwear &amp; DTF print details.
              </span>
            </button>
            <button
              type="button"
              onClick={startJerseyForm}
              aria-pressed={activeForm === 'jersey'}
              className={`flex flex-1 flex-col rounded-xl border-2 p-3 text-left transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 sm:min-h-[88px] sm:max-w-md ${
                activeForm === 'jersey'
                  ? 'border-emerald-500 bg-emerald-50 shadow-md ring-2 ring-emerald-400/40 focus:ring-emerald-500'
                  : 'border-gray-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/50 focus:ring-emerald-500'
              }`}
            >
              <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">Sports kits</span>
              <span className="text-base font-bold text-gray-900">Jersey personalisation</span>
              <span className="mt-1 text-xs text-gray-600 line-clamp-2 sm:line-clamp-none">
                Back print only — name, number &amp; colour (£15/item). Letters and/or numbers. You supply the shirt or we can source it.
              </span>
            </button>
          </div>
          {!activeForm && (
            <p className="text-center text-sm text-gray-600 mt-3 max-w-xl mx-auto">
              Select <strong>DTF</strong> or <strong>Jersey</strong> above to load the right form. You can switch any time — your current entries will be cleared when you switch.
            </p>
          )}
          {activeForm && (
            <div className="flex justify-center mt-3">
              <button
                type="button"
                onClick={backToFormChooser}
                className="text-sm text-gray-500 hover:text-gray-800 underline underline-offset-2"
              >
                Clear form and hide options
              </button>
            </div>
          )}
        </div>

        {/* Pricing Information — DTF form only */}
        {activeForm === 'dtf' && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">DTF Printing Pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">A4 Size (210 x 297mm)</h3>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Per item</span>
                <span className="font-medium text-lg">
                  {dtfUnitPrices ? `£${dtfUnitPrices.a4.toFixed(2)} per item` : 'Not configured'}
                </span>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">A3 Size (297 x 420mm)</h3>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Per item</span>
                <span className="font-medium text-lg">
                  {dtfUnitPrices ? `£${dtfUnitPrices.a3.toFixed(2)} per item` : 'Not configured'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-amber-50 border-l-4 border-amber-500 rounded-lg">
            <h4 className="font-semibold text-amber-900 mb-2">Bulk orders</h4>
            <p className="text-sm text-amber-800">
              Need larger quantities? Please <strong>send us an email</strong> or use our <strong>contact form</strong> so we can provide a tailored quote and discuss your requirements.
            </p>
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Additional Information</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Prices include DTF printing and heat pressing</li>
              <li>• Setup fees may apply for complex designs</li>
              <li>• Rush orders (under 5 days) may incur additional charges</li>
              <li>• Design assistance available for an additional fee</li>
              <li>• Free shipping on orders over £100</li>
            </ul>
          </div>
        </div>
        )}

        {/* Jersey intro — Jersey form only */}
        {activeForm === 'jersey' && (
          <div className="bg-white rounded-lg shadow-sm border border-emerald-100 p-6 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Jersey back printing</h2>
            <p className="text-gray-600">
              <strong>Back only</strong> — choose letters only, numbers only, or both. Add the name, number, and vinyl colour. Back print add-on is <strong>£{JERSEY_BACK_PRINT_PRICE_GBP} per garment</strong> (plus your jersey). Tell us if you&apos;ll supply the shirt or want us to supply it in the form below.
            </p>
          </div>
        )}

        {/* Customizable Products Preview — after a form is chosen */}
        {activeForm && catalogProducts.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">
                {activeForm === 'jersey' ? 'Jersey catalogue' : 'Customizable Products'}
              </h2>
              <p className="text-gray-600 mt-2">
                {activeForm === 'jersey'
                  ? 'Pick a jersey style from our catalogue, then enter your back name, number, and print colour in the form.'
                  : 'Click a product image to preview available colours and photos.'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {catalogProducts.map((product) => {
                const hasDiscount =
                  typeof product.basePrice === 'number' &&
                  typeof product.price === 'number' &&
                  product.basePrice > product.price;

                const coverImage =
                  product.images?.[0] ||
                  (product.colors?.find((c) => c.imageUrl)?.imageUrl
                    ? { url: product.colors.find((c) => c.imageUrl)!.imageUrl!, alt: product.name }
                    : null);

                return (
                  <div
                    key={product._id}
                    className="rounded-lg border border-gray-200 overflow-hidden bg-white hover:shadow-md transition-shadow"
                  >
                    <button
                      type="button"
                      onClick={() => openPreview(product)}
                      className="w-full text-left"
                      aria-label={`Preview ${product.name}`}
                    >
                      <div className="relative aspect-square bg-white">
                        {coverImage ? (
                          <Image
                            src={coverImage.url}
                            alt={coverImage.alt || product.name}
                            fill
                            className="object-contain p-3"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                            <div className="text-gray-500 text-sm font-medium px-4 text-center">
                              No image available
                            </div>
                          </div>
                        )}
                        <div className="absolute bottom-3 left-3 bg-black/60 text-white text-xs px-2 py-1 rounded">
                          Click to preview
                        </div>
                      </div>
                    </button>

                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-gray-900 whitespace-normal break-words leading-snug">
                            {product.name}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1">
                            {product.colors?.length || 0} colours • {product.sizes?.length || 0} sizes
                          </p>
                        </div>
                        <div className="text-right whitespace-nowrap">
                          {hasDiscount ? (
                            <div className="flex flex-col items-end">
                              <span className="text-xs text-gray-400 line-through">
                                £{product.basePrice!.toFixed(2)}
                              </span>
                              <span className="text-base font-bold text-green-700">
                                £{product.price.toFixed(2)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-base font-bold text-gray-900">
                              £{product.price.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {(product.colors || []).slice(0, 10).map((c) => (
                          <span
                            key={c.name}
                            className="w-4 h-4 rounded-full border border-gray-300"
                            style={{ backgroundColor: c.hexCode }}
                            title={c.name}
                            aria-label={c.name}
                          />
                        ))}
                        {(product.colors?.length || 0) > 10 && (
                          <span className="text-xs text-gray-500 ml-1">+{product.colors.length - 10}</span>
                        )}
                      </div>

                      <div className="mt-4 flex gap-2">
                        <button
                          type="button"
                          onClick={() => openPreview(product)}
                          className="flex-1 px-3 py-2 text-sm font-medium border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                          Preview
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleProductChange(product._id);
                            const el = document.getElementById('selectedProduct');
                            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }}
                          className="flex-1 px-3 py-2 text-sm font-medium bg-purple-600 text-white rounded-md hover:bg-purple-700"
                        >
                          Select
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeForm && catalogProducts.length === 0 && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-900">
            <p className="font-medium">
              {activeForm === 'jersey'
                ? 'No jersey catalogue products are available yet.'
                : 'No DTF catalogue products are available yet.'}
            </p>
            <p className="mt-2 text-sm text-amber-800">
              {activeForm === 'jersey'
                ? 'We’re still adding jersey options. Please contact us by phone or email, or try again soon.'
                : 'Please contact us if you need help placing a custom order.'}
            </p>
          </div>
        )}

        {/* Message Display */}
        {message && (
          <div className={`mb-6 p-6 rounded-lg shadow-lg border-2 ${
            message.type === 'success' 
              ? 'bg-green-50 border-green-300 text-green-800' 
              : 'bg-red-50 border-red-300 text-red-800'
          }`}>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {message.type === 'success' ? (
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <h3 className={`text-lg font-medium ${
                  message.type === 'success' ? 'text-green-800' : 'text-red-800'
                }`}>
                  {message.type === 'success' ? 'Order Submitted Successfully!' : 'Submission Failed'}
                </h3>
                <p className={`mt-1 text-sm ${
                  message.type === 'success' ? 'text-green-700' : 'text-red-700'
                }`}>
                  {message.text}
                </p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setMessage(null)}
                  className={`inline-flex rounded-md p-1.5 ${
                    message.type === 'success' 
                      ? 'text-green-500 hover:bg-green-100' 
                      : 'text-red-500 hover:bg-red-100'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    message.type === 'success' ? 'focus:ring-green-600' : 'focus:ring-red-600'
                  }`}
                >
                  <span className="sr-only">Dismiss</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeForm && (
        <>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Contact first for DTF; for Jersey this block is at the bottom of the form */}
          {activeForm !== 'jersey' && (
            <ContactInformationSection formData={formData} handleInputChange={handleInputChange} variant="dtf" />
          )}

          {/* Customization Information Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Customization Information</h2>
            <p className="text-gray-600 mb-6">
              {activeForm === 'jersey'
                ? 'Choose your jersey, then tell us the back name, number, and colour. DTF options below are hidden — this order is back printing only.'
                : 'Now, tell us more about your design, the more the better'}
            </p>

            {/* Jersey form only: who supplies the jersey */}
            {activeForm === 'jersey' && (
              <div className="mb-8 rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Who supplies the jersey?</h3>
                <p className="text-sm text-gray-600 mb-4">Choose one option — we&apos;ll confirm details when we contact you.</p>
                <div className="space-y-3">
                  <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:border-emerald-300">
                    <input
                      type="radio"
                      name="jerseySupply"
                      value="provide_own"
                      checked={formData.jerseySupply === 'provide_own'}
                      onChange={handleInputChange}
                      className="mt-1 h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>
                      <span className="font-medium text-gray-900">I will provide the jersey</span>
                      <span className="mt-1 block text-sm text-gray-600">
                        You&apos;ll send or bring your own jersey(s) for us to personalise.
                      </span>
                    </span>
                  </label>
                  <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:border-emerald-300">
                    <input
                      type="radio"
                      name="jerseySupply"
                      value="purchase_through_us"
                      checked={formData.jerseySupply === 'purchase_through_us'}
                      onChange={handleInputChange}
                      className="mt-1 h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>
                      <span className="font-medium text-gray-900">I want to buy a jersey through you</span>
                      <span className="mt-1 block text-sm text-gray-600">
                        We&apos;ll help you choose and supply the garment(s), then add your personalisation.
                      </span>
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* Jersey: back printing only — name / number / colour */}
            {activeForm === 'jersey' && (
              <div className="mb-8 rounded-xl border-2 border-emerald-300 bg-white p-6 shadow-sm">
                <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2 border-b border-emerald-100 pb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Back printing</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      <strong>Back printing only.</strong> Choose letters only, numbers only, or both. The add-on is{' '}
                      <strong>£{JERSEY_BACK_PRINT_PRICE_GBP} per garment</strong> (multiplied by your quantities below — plus jersey cost).
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-800">
                    £{JERSEY_BACK_PRINT_PRICE_GBP} / item
                  </span>
                </div>

                <p className="text-sm font-medium text-gray-900 mb-3">What do you need on the back? *</p>
                <div className="space-y-3 mb-6">
                  <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-3 hover:bg-emerald-50/50">
                    <input
                      type="radio"
                      name="jerseyPrintOption"
                      value="letters_only"
                      checked={formData.jerseyPrintOption === 'letters_only'}
                      onChange={handleInputChange}
                      className="mt-1 h-4 w-4 text-emerald-600"
                    />
                    <span>
                      <span className="font-medium text-gray-900">Letters only</span>
                      <span className="block text-sm text-gray-600">Name or wording on the back only</span>
                    </span>
                  </label>
                  <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-3 hover:bg-emerald-50/50">
                    <input
                      type="radio"
                      name="jerseyPrintOption"
                      value="numbers_only"
                      checked={formData.jerseyPrintOption === 'numbers_only'}
                      onChange={handleInputChange}
                      className="mt-1 h-4 w-4 text-emerald-600"
                    />
                    <span>
                      <span className="font-medium text-gray-900">Numbers only</span>
                      <span className="block text-sm text-gray-600">Shirt number on the back only</span>
                    </span>
                  </label>
                  <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-3 hover:bg-emerald-50/50">
                    <input
                      type="radio"
                      name="jerseyPrintOption"
                      value="both"
                      checked={formData.jerseyPrintOption === 'both'}
                      onChange={handleInputChange}
                      className="mt-1 h-4 w-4 text-emerald-600"
                    />
                    <span>
                      <span className="font-medium text-gray-900">Name and number</span>
                      <span className="block text-sm text-gray-600">Name and number together on the back</span>
                    </span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(formData.jerseyPrintOption === 'letters_only' || formData.jerseyPrintOption === 'both') && (
                    <div className="md:col-span-2">
                      <label htmlFor="jerseyBackName" className="block text-sm font-medium text-gray-700 mb-2">
                        Name (back letters) *
                      </label>
                      <input
                        id="jerseyBackName"
                        name="jerseyBackName"
                        type="text"
                        value={formData.jerseyBackName}
                        onChange={handleInputChange}
                        placeholder="e.g. SMITH"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  )}
                  {(formData.jerseyPrintOption === 'numbers_only' || formData.jerseyPrintOption === 'both') && (
                    <div className="md:col-span-2">
                      <label htmlFor="jerseyBackNumber" className="block text-sm font-medium text-gray-700 mb-2">
                        Number *
                      </label>
                      <input
                        id="jerseyBackNumber"
                        name="jerseyBackNumber"
                        type="text"
                        value={formData.jerseyBackNumber}
                        onChange={handleInputChange}
                        placeholder="e.g. 10"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  )}
                  <div className="md:col-span-2">
                    <label htmlFor="jerseyPrintColour" className="block text-sm font-medium text-gray-700 mb-2">
                      Colour (letters &amp; numbers) *
                    </label>
                    <input
                      id="jerseyPrintColour"
                      name="jerseyPrintColour"
                      type="text"
                      value={formData.jerseyPrintColour}
                      onChange={handleInputChange}
                      placeholder="e.g. White vinyl, gold, navy"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Colour of the vinyl / print for the back.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Product Selection */}
            <div className="mb-6">
              <label htmlFor="selectedProduct" className="block text-sm font-medium text-gray-700 mb-2">
                Select Product *
              </label>
              <select
                id="selectedProduct"
                name="selectedProduct"
                required={catalogProducts.length > 0}
                disabled={catalogProducts.length === 0}
                value={formData.selectedProduct}
                onChange={(e) => handleProductChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Choose a product...</option>
                {catalogProducts.map((product) => (
                  <option key={product._id} value={product._id}>
                    {product.name} - £{product.price}
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Product Display */}
            {selectedProductData && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  {selectedProductData.images[0] && (
                    <Image
                      src={selectedProductData.images[0].url}
                      alt={selectedProductData.images[0].alt}
                      width={80}
                      height={80}
                      className="rounded-lg object-cover"
                    />
                  )}
                  <div>
                    <h3 className="font-medium text-gray-900">{selectedProductData.name}</h3>
                    <p className="text-sm text-gray-600">£{selectedProductData.price}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Color Selection */}
            {selectedProductData && selectedProductData.colors.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Product Colors (Select all that apply)
                </label>
                <div className="flex flex-wrap gap-3">
                  {selectedProductData.colors.map((color) => (
                    <label key={color.name} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="selectedColors"
                        value={color.name}
                        checked={formData.selectedColors.includes(color.name)}
                        onChange={(e) => handleColorChange(color.name, e.target.checked)}
                        className="sr-only"
                      />
                      <div
                        className={`w-10 h-10 rounded-full border-2 ${
                          formData.selectedColors.includes(color.name)
                            ? 'border-purple-500 ring-2 ring-purple-200'
                            : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color.hexCode }}
                        title={color.name}
                      />
                      <span className="text-sm text-gray-700">{color.name}</span>
                    </label>
                  ))}
                </div>
                {formData.selectedColors.length === 0 && (
                  <p className="text-sm text-red-600 mt-2">Please select at least one color</p>
                )}
              </div>
            )}

            {/* Size Quantities */}
            {/* Quantity by Color and Size */}
            {selectedProductData && selectedProductData.sizes.length > 0 && formData.selectedColors.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity by Color and Size
                </label>
                <div className="space-y-6">
                  {formData.selectedColors.map((color) => (
                    <div key={color} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-3">
                        <div 
                          className="w-6 h-6 rounded-full border-2 border-gray-300"
                          style={{ backgroundColor: selectedProductData.colors.find(c => c.name === color)?.hexCode || '#000000' }}
                        />
                        <h4 className="font-medium text-gray-900">{color}</h4>
                      </div>
                      <div className="space-y-3">
                        {selectedProductData.sizes.sort((a, b) => {
                          const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
                          return sizeOrder.indexOf(a) - sizeOrder.indexOf(b);
                        }).map((size) => (
                          <div key={`${color}-${size}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <span className="font-medium text-gray-900">{size}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                type="button"
                                onClick={() => {
                                  const currentQty = formData.sizeQuantities[color]?.[size] || 0;
                                  if (currentQty > 0) {
                                    handleSizeQuantityChange(color, size, currentQty - 1);
                                  }
                                }}
                                className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-md hover:bg-gray-50"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min="0"
                                value={formData.sizeQuantities[color]?.[size] || 0}
                                onChange={(e) => handleSizeQuantityChange(color, size, parseInt(e.target.value) || 0)}
                                className="w-16 px-2 py-1 text-center border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const currentQty = formData.sizeQuantities[color]?.[size] || 0;
                                  handleSizeQuantityChange(color, size, currentQty + 1);
                                }}
                                className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-md hover:bg-gray-50"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 p-2 bg-blue-50 rounded">
                        <p className="text-sm text-blue-800">
                          <strong>{color} Total:</strong> {Object.values(formData.sizeQuantities[color] || {}).reduce((sum, qty) => sum + qty, 0)} items
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Total Quantity:</strong> {Object.values(formData.sizeQuantities).reduce((colorSum, colorQuantities) => {
                      return colorSum + Object.values(colorQuantities).reduce((sizeSum, qty) => sizeSum + qty, 0);
                    }, 0)} items
                  </p>
                  <p className="text-xs text-blue-600 mt-1">No minimum order quantity.</p>
                </div>
                {activeForm === 'jersey' && (
                  <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                    <p className="text-sm font-medium text-emerald-900">
                      Back print add-on: £{JERSEY_BACK_PRINT_PRICE_GBP} ×{' '}
                      {Object.values(formData.sizeQuantities).reduce((colorSum, colorQuantities) => {
                        return (
                          colorSum +
                          Object.values(colorQuantities).reduce((sizeSum, qty) => sizeSum + (Number(qty) || 0), 0)
                        );
                      }, 0)}{' '}
                      garment(s) = £
                      {(
                        JERSEY_BACK_PRINT_PRICE_GBP *
                        Object.values(formData.sizeQuantities).reduce((colorSum, colorQuantities) => {
                          return (
                            colorSum +
                            Object.values(colorQuantities).reduce((sizeSum, qty) => sizeSum + (Number(qty) || 0), 0)
                          );
                        }, 0)
                      ).toFixed(2)}{' '}
                      <span className="text-xs font-normal text-emerald-800">(plus garment cost — we&apos;ll confirm)</span>
                    </p>
                  </div>
                )}
              </div>
            )}


            {activeForm !== 'jersey' && (
            <>
            {/* Printing Type */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Type of Printing
              </label>
              <div className="space-y-3">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="printingType"
                    value="dtf"
                    checked={formData.printingType === 'dtf'}
                    onChange={handleInputChange}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium text-gray-900">DTF (Direct to Film) Printing</div>
                    <div className="text-sm text-gray-600">
                      DTF printing uses a special film that is printed with your design and then heat-pressed onto the garment. This method provides vibrant colors, excellent durability, and works on both light and dark fabrics.
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Care Instructions */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">DTF Care Instructions</h4>
              <p className="text-sm text-blue-800">
                DTF prints are durable and long-lasting. For best results, wash garments inside out in cold water (30°C or below) 
                and avoid using fabric softeners. Tumble dry on low heat or air dry. Do not iron directly on the print.
              </p>
            </div>

            {/* Printing Surface */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Printing Surface (Select all that apply)
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="printingSurface"
                    value="front"
                    checked={formData.printingSurface.includes('front')}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (e.target.checked) {
                        setFormData(prev => ({
                          ...prev,
                          printingSurface: [...prev.printingSurface, value]
                        }));
                      } else {
                        setFormData(prev => ({
                          ...prev,
                          printingSurface: prev.printingSurface.filter(surface => surface !== value)
                        }));
                      }
                    }}
                    className="mr-2 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm font-medium text-gray-900">Front</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="printingSurface"
                    value="back"
                    checked={formData.printingSurface.includes('back')}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (e.target.checked) {
                        setFormData(prev => ({
                          ...prev,
                          printingSurface: [...prev.printingSurface, value]
                        }));
                      } else {
                        setFormData(prev => ({
                          ...prev,
                          printingSurface: prev.printingSurface.filter(surface => surface !== value)
                        }));
                      }
                    }}
                    className="mr-2 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm font-medium text-gray-900">Back</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="printingSurface"
                    value="sleeve"
                    checked={formData.printingSurface.includes('sleeve')}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (e.target.checked) {
                        setFormData(prev => ({
                          ...prev,
                          printingSurface: [...prev.printingSurface, value]
                        }));
                      } else {
                        setFormData(prev => ({
                          ...prev,
                          printingSurface: prev.printingSurface.filter(surface => surface !== value)
                        }));
                      }
                    }}
                    className="mr-2 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm font-medium text-gray-900">Sleeve</span>
                </label>
              </div>
              {formData.printingSurface.length === 0 && (
                <p className="text-sm text-red-600 mt-1">Please select at least one printing surface</p>
              )}
            </div>

            {/* Design Location */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Design Location (Select all that apply)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { value: 'top-left', label: 'Top Left Corner' },
                  { value: 'top-center', label: 'Top Center' },
                  { value: 'top-right', label: 'Top Right Corner' },
                  { value: 'center-left', label: 'Center Left' },
                  { value: 'center', label: 'Center' },
                  { value: 'center-right', label: 'Center Right' },
                  { value: 'bottom-left', label: 'Bottom Left Corner' },
                  { value: 'bottom-center', label: 'Bottom Center' },
                  { value: 'bottom-right', label: 'Bottom Right Corner' }
                ].map((option) => (
                  <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="designLocation"
                      value={option.value}
                      checked={formData.designLocation.includes(option.value)}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (e.target.checked) {
                          setFormData(prev => ({
                            ...prev,
                            designLocation: [...prev.designLocation, value]
                          }));
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            designLocation: prev.designLocation.filter(location => location !== value)
                          }));
                        }
                      }}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
              {formData.designLocation.length === 0 && (
                <p className="text-sm text-red-600 mt-1">Please select at least one design location</p>
              )}
            </div>

            {/* Paper Size Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Paper Size
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center space-x-3 cursor-pointer border border-gray-300 rounded-lg p-4 hover:bg-gray-50">
                  <input
                    type="radio"
                    name="paperSize"
                    value="A4"
                    checked={formData.paperSize === 'A4'}
                    onChange={handleInputChange}
                    className="text-purple-600 focus:ring-purple-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900">A4 (210 x 297mm)</div>
                    <div className="text-sm text-gray-600">Standard size - £10 per item</div>
                  </div>
                </label>
                
                <label className="flex items-center space-x-3 cursor-pointer border border-gray-300 rounded-lg p-4 hover:bg-gray-50">
                  <input
                    type="radio"
                    name="paperSize"
                    value="A3"
                    checked={formData.paperSize === 'A3'}
                    onChange={handleInputChange}
                    className="text-purple-600 focus:ring-purple-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900">A3 (297 x 420mm)</div>
                    <div className="text-sm text-gray-600">Large size - £12.50 per item</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Print Size */}
            <div className="mb-6">
              <label htmlFor="printSize" className="block text-sm font-medium text-gray-700 mb-2">
                Custom Print Size (Optional)
              </label>
              <input
                type="text"
                id="printSize"
                name="printSize"
                value={formData.printSize}
                onChange={handleInputChange}
                placeholder="e.g., 10cm x 15cm (if different from paper size)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-1">
                Specify custom dimensions if your design is smaller than the selected paper size
              </p>
            </div>
            </>
            )}

            {activeForm === 'jersey' && (
              <div className="mb-6 rounded-lg border border-emerald-100 bg-emerald-50/50 p-4">
                <p className="text-sm text-emerald-900">
                  <strong>Printing:</strong> Back only (fixed). Surface and placement are set automatically — no DTF paper options apply to this jersey order.
                </p>
              </div>
            )}

            {/* File Upload */}
            <div className="mb-6">
              <label htmlFor="designFiles" className="block text-sm font-medium text-gray-700 mb-2">
                {activeForm === 'jersey' ? 'Upload reference files (optional)' : 'Upload Your Design Files *'}
              </label>
              <input
                type="file"
                id="designFiles"
                name="designFiles"
                required={activeForm !== 'jersey'}
                multiple
                accept=".jpg,.jpeg,.png,.pdf,.ai,.eps,.svg"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  setFormData(prev => ({ ...prev, designFiles: files }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-1">
                Maximum file size 20MB per file | Recommended quality: 300DPI | You can upload multiple files
              </p>
              
              {/* Display selected files */}
              {formData.designFiles.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">Selected Files:</p>
                  <div className="space-y-1">
                    {formData.designFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                        <span className="text-sm text-gray-700">{file.name}</span>
                        <span className="text-xs text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Design Assistance — not offered on Jersey back-printing flow */}
            {activeForm !== 'jersey' && (
              <div className="mb-6">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="needsDesignAssistance"
                    checked={formData.needsDesignAssistance}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Will you need design assistance? This service will have an additional fee.
                  </span>
                </label>
              </div>
            )}

            {/* Notes */}
            <div className="mb-6">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={4}
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="We want to create the perfect product for you, give us as much detail as possible."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Jersey: contact details at bottom (after customization, before Need Help) */}
          {activeForm === 'jersey' && (
            <ContactInformationSection formData={formData} handleInputChange={handleInputChange} variant="jersey" />
          )}

          {/* Need help — business contact (inside form, before submit) */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Need Help?</h3>
            <p className="text-gray-600 mb-8">
              We will be more than happy to assist you to fill this form. Please contact one of our customer service agents.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <h4 className="font-medium text-gray-900 mb-3">Customer Service</h4>
                <p className="text-sm text-gray-600 break-words px-4">customer.service@mrshirtpersonalisation.co.uk</p>
              </div>
              <div className="text-center">
                <h4 className="font-medium text-gray-900 mb-3">Sales</h4>
                <p className="text-sm text-gray-600 break-words px-4">customer.service@mrshirtpersonalisation.co.uk</p>
              </div>
              <div className="text-center">
                <h4 className="font-medium text-gray-900 mb-3">Phone</h4>
                <p className="text-sm text-gray-600 mb-3">07902 870 824</p>
                <div className="flex justify-center gap-4">
                  <a
                    href="https://wa.me/447902870824"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 transition-colors"
                    aria-label="Contact us on WhatsApp"
                  >
                    <FaWhatsapp className="w-6 h-6" />
                  </a>
                  <a
                    href="tel:07902870824"
                    className="inline-flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
                    aria-label="Call us"
                  >
                    <FaPhone className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={submitting || catalogProducts.length === 0}
              className={`px-8 py-3 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                activeForm === 'jersey'
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500'
                  : 'bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500'
              }`}
            >
              {submitting
                ? 'Submitting...'
                : activeForm === 'jersey'
                  ? 'Submit jersey personalisation request'
                  : 'Submit DTF custom order'}
            </button>
          </div>
        </form>
        </>
        )}
        </div>
      </div>
    </div>
  );
}
