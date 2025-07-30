import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Link from 'next/link';
import { 
  FaLightbulb, 
  FaRuler, 
  FaPalette, 
  FaShoppingCart, 
  FaTshirt, 
  FaCog,
  FaCheckCircle,
  FaExclamationTriangle,
  FaArrowLeft,
  FaDownload,
  FaUpload,
  FaEye
} from 'react-icons/fa';

export default function QuickTipsPage() {
  return (
    <>
      <Header />
      <main className="max-w-4xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        {/* Back Navigation */}
        <div className="mb-8">
          <Link 
            href="/help" 
            className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
          >
            <FaArrowLeft className="mr-2" />
            Back to Help & Support
          </Link>
        </div>

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow-md p-8 mb-12">
          <h1 className="text-3xl font-bold mb-4 text-gray-900 flex items-center gap-3">
            <FaLightbulb className="text-yellow-500" />
            Quick Tips & Design Guide
          </h1>
          <p className="text-gray-700 text-lg">
            Get the most out of your custom apparel with our expert tips on design, sizing, ordering, and care. 
            Whether you're a first-time customer or a design pro, these tips will help you create the perfect custom garment.
          </p>
        </div>

        {/* Design Tips Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 flex items-center gap-3">
            <FaPalette className="text-purple-500" />
            Design Tips
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <FaCheckCircle className="text-green-500" />
                Image Quality
              </h3>
              <ul className="text-gray-700 space-y-2 text-sm">
                <li>• Use high-resolution images (300 DPI or higher)</li>
                <li>• PNG format with transparent background works best</li>
                <li>• Avoid low-quality or pixelated images</li>
                <li>• Vector graphics (SVG) are ideal for logos</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <FaUpload className="text-blue-500" />
                Upload Guidelines
              </h3>
              <ul className="text-gray-700 space-y-2 text-sm">
                <li>• Maximum file size: 10MB</li>
                <li>• Supported formats: PNG, JPG, JPEG, SVG</li>
                <li>• Ensure images are clear and well-lit</li>
                <li>• Test your design on both front and back</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <FaEye className="text-purple-500" />
                Design Preview
              </h3>
              <ul className="text-gray-700 space-y-2 text-sm">
                <li>• Always preview your design before ordering</li>
                <li>• Check how it looks on different sizes</li>
                <li>• Consider the fabric color and texture</li>
                <li>• Test readability from a distance</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <FaExclamationTriangle className="text-orange-500" />
                Common Mistakes
              </h3>
              <ul className="text-gray-700 space-y-2 text-sm">
                <li>• Avoid images that are too small or blurry</li>
                <li>• Don't use copyrighted material without permission</li>
                <li>• Avoid designs that are too close to edges</li>
                <li>• Test text readability on colored backgrounds</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Sizing Guide Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 flex items-center gap-3">
            <FaRuler className="text-blue-500" />
            Sizing Guide
          </h2>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Adult Sizes</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="font-medium">XS</span>
                    <span className="text-gray-600">Chest: 32-34" | Waist: 26-28"</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="font-medium">S</span>
                    <span className="text-gray-600">Chest: 34-36" | Waist: 28-30"</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="font-medium">M</span>
                    <span className="text-gray-600">Chest: 36-38" | Waist: 30-32"</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="font-medium">L</span>
                    <span className="text-gray-600">Chest: 38-40" | Waist: 32-34"</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="font-medium">XL</span>
                    <span className="text-gray-600">Chest: 40-42" | Waist: 34-36"</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="font-medium">XXL</span>
                    <span className="text-gray-600">Chest: 42-44" | Waist: 36-38"</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="font-medium">3XL</span>
                    <span className="text-gray-600">Chest: 44-46" | Waist: 38-40"</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Kids Sizes</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="font-medium">0-3M</span>
                    <span className="text-gray-600">Age: 0-3 months</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="font-medium">3-6M</span>
                    <span className="text-gray-600">Age: 3-6 months</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="font-medium">6-12M</span>
                    <span className="text-gray-600">Age: 6-12 months</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="font-medium">1-2Y</span>
                    <span className="text-gray-600">Age: 1-2 years</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="font-medium">2-3Y</span>
                    <span className="text-gray-600">Age: 2-3 years</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="font-medium">3-4Y</span>
                    <span className="text-gray-600">Age: 3-4 years</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="font-medium">5-6Y</span>
                    <span className="text-gray-600">Age: 5-6 years</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="font-medium">7-8Y</span>
                    <span className="text-gray-600">Age: 7-8 years</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="font-medium">9-10Y</span>
                    <span className="text-gray-600">Age: 9-10 years</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="font-medium">11-12Y</span>
                    <span className="text-gray-600">Age: 11-12 years</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="font-medium">13-14Y</span>
                    <span className="text-gray-600">Age: 13-14 years</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Sizing Tips:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Measure your chest at the widest point for the most accurate fit</li>
                <li>• Our sizes run true to standard UK sizing</li>
                <li>• When in doubt, size up for a more comfortable fit</li>
                <li>• Kids sizes are based on age ranges and may vary by child</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Ordering Tips Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 flex items-center gap-3">
            <FaShoppingCart className="text-green-500" />
            Ordering Tips
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Before You Order</h3>
              <ul className="text-gray-700 space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <FaCheckCircle className="text-green-500 mt-1 flex-shrink-0" />
                  <span>Double-check your design preview</span>
                </li>
                <li className="flex items-start gap-2">
                  <FaCheckCircle className="text-green-500 mt-1 flex-shrink-0" />
                  <span>Verify all sizing and quantity selections</span>
                </li>
                <li className="flex items-start gap-2">
                  <FaCheckCircle className="text-green-500 mt-1 flex-shrink-0" />
                  <span>Review shipping address and contact details</span>
                </li>
                <li className="flex items-start gap-2">
                  <FaCheckCircle className="text-green-500 mt-1 flex-shrink-0" />
                  <span>Choose the right paper size (A4 £6, A3 £10)</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">After You Order</h3>
              <ul className="text-gray-700 space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <FaCheckCircle className="text-green-500 mt-1 flex-shrink-0" />
                  <span>Save your order confirmation email</span>
                </li>
                <li className="flex items-start gap-2">
                  <FaCheckCircle className="text-green-500 mt-1 flex-shrink-0" />
                  <span>Track your order status in your account</span>
                </li>
                <li className="flex items-start gap-2">
                  <FaCheckCircle className="text-green-500 mt-1 flex-shrink-0" />
                  <span>Contact us if you need to make changes</span>
                </li>
                <li className="flex items-start gap-2">
                  <FaCheckCircle className="text-green-500 mt-1 flex-shrink-0" />
                  <span>Allow 3-5 business days for production</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Care Instructions Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 flex items-center gap-3">
            <FaCog className="text-blue-500" />
            Care Instructions
          </h2>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Washing</h3>
                <ul className="text-gray-700 space-y-2 text-sm">
                  <li>• Turn garment inside out before washing</li>
                  <li>• Use cold water (30°C or below)</li>
                  <li>• Wash with similar colors</li>
                  <li>• Avoid bleach and harsh detergents</li>
                  <li>• Use gentle cycle for best results</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Drying & Ironing</h3>
                <ul className="text-gray-700 space-y-2 text-sm">
                  <li>• Tumble dry on low heat or air dry</li>
                  <li>• Avoid high heat to prevent design damage</li>
                  <li>• Iron on low heat if needed</li>
                  <li>• Iron on the reverse side of the design</li>
                  <li>• Store in a cool, dry place</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
              <h4 className="font-semibold text-yellow-900 mb-2">Important Care Notes:</h4>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• DTF prints are durable but proper care extends their life</li>
                <li>• Avoid excessive stretching of the printed area</li>
                <li>• Don't use fabric softeners on printed areas</li>
                <li>• If you notice any issues, contact us immediately</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Paper Size Information */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 flex items-center gap-3">
            <FaDownload className="text-purple-500" />
            Paper Size Options
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
              <h3 className="text-lg font-semibold mb-3 text-gray-900">A4 Size (£6.00)</h3>
              <ul className="text-gray-700 space-y-2 text-sm">
                <li>• Dimensions: 210mm x 297mm</li>
                <li>• Perfect for standard designs</li>
                <li>• Most popular choice</li>
                <li>• Great for logos and text</li>
                <li>• Cost-effective option</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
              <h3 className="text-lg font-semibold mb-3 text-gray-900">A3 Size (£10.00)</h3>
              <ul className="text-gray-700 space-y-2 text-sm">
                <li>• Dimensions: 297mm x 420mm</li>
                <li>• 40% more print area than A4</li>
                <li>• Ideal for complex designs</li>
                <li>• Better for detailed artwork</li>
                <li>• Premium printing option</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Contact CTA */}
        <section className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">Need More Help?</h2>
          <p className="text-gray-700 mb-6">
            Can't find what you're looking for? Our design experts are here to help you create the perfect custom garment.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link 
              href="/contact" 
              className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Contact Our Team
            </Link>
            <Link 
              href="/design" 
              className="inline-flex items-center justify-center px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
            >
              Start Designing
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
} 