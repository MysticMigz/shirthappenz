'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import { 
  FaEnvelope, 
  FaPhone, 
  FaPalette, 
  FaTshirt, 
  FaStar,
  FaCheckCircle,
  FaArrowRight,
  FaDownload,
  FaUpload,
  FaEye,
  FaClock,
  FaShieldAlt,
  FaImage,
  FaTimes,
  FaCloudUploadAlt,
  FaPaperclip
} from 'react-icons/fa';

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  name: string;
  size: string;
}

export default function CustomDesignPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    designType: '',
    quantity: '',
    description: '',
    timeline: '',
    budget: ''
  });

  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateFile = (file: File): boolean => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    
    if (file.size > maxSize) {
      setUploadError('File size must be less than 10MB');
      return false;
    }
    
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Please upload only JPG, PNG, GIF, or WebP images');
      return false;
    }
    
    setUploadError('');
    return true;
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;
    
    const newImages: UploadedImage[] = [];
    
    Array.from(files).forEach(file => {
      if (validateFile(file)) {
        const id = Math.random().toString(36).substr(2, 9);
        const preview = URL.createObjectURL(file);
        const size = (file.size / 1024 / 1024).toFixed(2);
        
        newImages.push({
          id,
          file,
          preview,
          name: file.name,
          size: `${size} MB`
        });
      }
    });
    
    setUploadedImages(prev => [...prev, ...newImages]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const removeImage = (id: string) => {
    setUploadedImages(prev => {
      const imageToRemove = prev.find(img => img.id === id);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.preview);
      }
      return prev.filter(img => img.id !== id);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let body = `
Name: ${formData.name}
Email: ${formData.email}
Phone: ${formData.phone}

Design Type: ${formData.designType}
Quantity: ${formData.quantity}
Timeline: ${formData.timeline}
Budget: ${formData.budget}

Description:
${formData.description}

---
This request was submitted through the custom design page.
    `;

    if (uploadedImages.length > 0) {
      body += `\n\nUploaded Images: ${uploadedImages.length} file(s)`;
      uploadedImages.forEach((img, index) => {
        body += `\n- ${img.name} (${img.size})`;
      });
      body += '\n\nNote: Images have been uploaded and will be sent separately if needed.';
    }

    const subject = encodeURIComponent('Custom Design Quote Request');
    const encodedBody = encodeURIComponent(body);

    window.location.href = `mailto:customer.service@mrshirtpersonalisation.com?subject=${subject}&body=${encodedBody}`;
  };

  return (
    <>
      <Header />
      
      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Custom Design Services
              </h1>
              <p className="text-xl md:text-2xl mb-8 opacity-90">
                Let us bring your vision to life with professional custom apparel design
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a 
                  href="mailto:customer.service@mrshirtpersonalisation.com"
                  className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors"
                >
                  <FaEnvelope className="mr-2" />
                  Get Quote Now
                </a>
                <Link 
                  href="/products"
                  className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white rounded-lg font-bold text-lg hover:bg-white hover:text-blue-600 transition-colors"
                >
                  Browse Products
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Services Overview */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Professional Design Services
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                From concept to completion, our design team works closely with you to create 
                custom apparel that perfectly represents your brand or vision.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaPalette className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Custom Design</h3>
                <p className="text-gray-600">
                  Professional graphic design services for logos, artwork, and custom graphics 
                  tailored to your specific needs and brand guidelines.
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaTshirt className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Apparel Consultation</h3>
                <p className="text-gray-600">
                  Expert advice on fabric selection, sizing, printing techniques, and 
                  design placement for optimal results.
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaStar className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Quality Assurance</h3>
                <p className="text-gray-600">
                  Comprehensive quality checks and revisions to ensure your design 
                  meets the highest standards before production.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Design Process */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Our Design Process
              </h2>
              <p className="text-xl text-gray-600">
                Simple, transparent, and collaborative approach to bringing your ideas to life
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                  1
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Consultation</h3>
                <p className="text-gray-600 text-sm">
                  Initial discussion about your vision, requirements, and project scope
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                  2
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Design</h3>
                <p className="text-gray-600 text-sm">
                  Our designers create concepts and mockups based on your specifications
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                  3
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Review</h3>
                <p className="text-gray-600 text-sm">
                  You review designs and provide feedback for revisions if needed
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-orange-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                  4
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Production</h3>
                <p className="text-gray-600 text-sm">
                  Final design approval and production of your custom apparel
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Quote Request Form */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-lg shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white p-8">
                  <h2 className="text-3xl font-bold mb-4">Request a Custom Design Quote</h2>
                  <p className="text-xl opacity-90">
                    Tell us about your project and we'll provide a detailed quote within 24 hours
                  </p>
                </div>

                <div className="p-8">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Your full name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="your.email@example.com"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Your phone number"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Design Type *
                        </label>
                        <select
                          name="designType"
                          value={formData.designType}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select design type</option>
                          <option value="Logo Design">Logo Design</option>
                          <option value="Custom Artwork">Custom Artwork</option>
                          <option value="Text/Lettering">Text/Lettering</option>
                          <option value="Photo Manipulation">Photo Manipulation</option>
                          <option value="Vector Graphics">Vector Graphics</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Quantity *
                        </label>
                        <input
                          type="text"
                          name="quantity"
                          value={formData.quantity}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="e.g., 50 t-shirts"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Timeline
                        </label>
                        <select
                          name="timeline"
                          value={formData.timeline}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select timeline</option>
                          <option value="Rush (1-2 weeks)">Rush (1-2 weeks)</option>
                          <option value="Standard (2-4 weeks)">Standard (2-4 weeks)</option>
                          <option value="Flexible (4+ weeks)">Flexible (4+ weeks)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Budget Range
                        </label>
                        <select
                          name="budget"
                          value={formData.budget}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select budget range</option>
                          <option value="Under £500">Under £500</option>
                          <option value="£500 - £1,000">£500 - £1,000</option>
                          <option value="£1,000 - £2,500">£1,000 - £2,500</option>
                          <option value="£2,500 - £5,000">£2,500 - £5,000</option>
                          <option value="Over £5,000">Over £5,000</option>
                        </select>
                      </div>
                    </div>

                    {/* Image Upload Section */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Attach Reference Images (Optional)
                      </label>
                      <div className="flex items-center space-x-4">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                          <FaPaperclip className="mr-2" />
                          Attach Files
                        </button>
                        <span className="text-sm text-gray-500">
                          JPG, PNG, GIF, WebP up to 10MB each
                        </span>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e.target.files)}
                        className="hidden"
                      />
                      
                      {uploadError && (
                        <p className="text-red-600 text-sm mt-2">{uploadError}</p>
                      )}
                    </div>

                    {/* Uploaded Images Preview */}
                    {uploadedImages.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-3">
                          Uploaded Images ({uploadedImages.length})
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {uploadedImages.map((image) => (
                            <div key={image.id} className="relative group">
                              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                                <Image
                                  src={image.preview}
                                  alt={image.name}
                                  width={200}
                                  height={200}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => removeImage(image.id)}
                                className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <FaTimes className="w-3 h-3" />
                              </button>
                              <div className="mt-2">
                                <p className="text-xs text-gray-600 truncate">{image.name}</p>
                                <p className="text-xs text-gray-500">{image.size}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Project Description *
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        required
                        rows={6}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Please describe your project in detail, including any specific requirements, colors, styles, or references..."
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                      <button
                        type="submit"
                        className="flex-1 bg-gradient-to-r from-blue-600 to-purple-700 text-white py-4 px-8 rounded-lg font-bold text-lg hover:from-blue-700 hover:to-purple-800 transition-all duration-300 flex items-center justify-center"
                      >
                        <FaEnvelope className="mr-2" />
                        Send Quote Request
                      </button>
                      
                      <a
                        href="mailto:customer.service@mrshirtpersonalisation.com"
                        className="flex-1 bg-gray-100 text-gray-700 py-4 px-8 rounded-lg font-bold text-lg hover:bg-gray-200 transition-colors flex items-center justify-center"
                      >
                        <FaArrowRight className="mr-2" />
                        Direct Email
                      </a>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Why Choose Our Design Services?
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaClock className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Fast Turnaround</h3>
                <p className="text-gray-600 text-sm">
                  Quick response times and efficient design process
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaCheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Quality Guarantee</h3>
                <p className="text-gray-600 text-sm">
                  Professional designs that meet your exact specifications
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaShieldAlt className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Secure & Confidential</h3>
                <p className="text-gray-600 text-sm">
                  Your designs and information are kept completely secure
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaStar className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Expert Team</h3>
                <p className="text-gray-600 text-sm">
                  Experienced designers with years of industry expertise
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Information */}
        <section className="py-16 bg-gray-900 text-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-8">
                Ready to Start Your Project?
              </h2>
              <p className="text-xl mb-8 opacity-90">
                Contact us today to discuss your custom design needs
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
                    <FaEnvelope className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">Email Us</h3>
                  <a 
                    href="mailto:customer.service@mrshirtpersonalisation.com"
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    customer.service@mrshirtpersonalisation.com
                  </a>
                </div>

                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mb-4">
                    <FaPhone className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">Call Us</h3>
                  <a 
                    href="tel:07954746514"
                    className="text-green-400 hover:text-green-300 transition-colors"
                  >
                    07954746514
                  </a>
                </div>

                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mb-4">
                    <FaClock className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">Response Time</h3>
                  <p className="text-purple-400">
                    Within 24 hours
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
