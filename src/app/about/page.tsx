import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const AboutPage = () => (
  <>
    <Header />
    <section className="max-w-3xl mx-auto py-16 px-4">
      <div className="flex flex-col items-center mb-8">
        <h1 className="text-4xl font-bold mb-6 text-purple-700">About Us</h1>
      </div>
      <p className="text-lg mb-4 text-gray-700">
        Welcome to <strong>MR Shirt Personalisation</strong>! We're your premier destination for high-quality custom apparel that brings your vision to life. Whether you're building a brand, celebrating a team, or expressing your personal style, we transform your ideas into wearable art that stands out.
      </p>
      <p className="text-lg mb-4 text-gray-700">
        <strong>What does the &ldquo;MR&rdquo; stand for?</strong> It represents <strong>Mastery</strong> and <strong>Reliability</strong> – the two pillars that define everything we do. We believe that exceptional custom apparel should be accessible to everyone, from individual creators to large organizations, without compromising on quality or service.
      </p>
      <p className="text-lg mb-4 text-gray-700">
        Our expertise spans cutting-edge design technology, sustainable manufacturing practices, and customer-focused service delivery. We've built a comprehensive platform that makes custom apparel creation seamless – from initial concept to final product. Using state-of-the-art printing technologies and premium materials, we ensure your designs not only look stunning but maintain their vibrancy through countless washes.
      </p>
      <p className="text-lg mb-4 text-gray-700">
        From corporate branding and team uniforms to personal fashion statements and special events, we cater to diverse needs with the same level of dedication and excellence. Our commitment extends beyond just printing – we're your creative partners, helping you navigate the entire process from design consultation to delivery. Every project is an opportunity to exceed expectations and create something truly remarkable.
      </p>
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4 text-purple-600">Why Choose MR Shirt Personalisation?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-semibold text-purple-800 mb-2">🎨 Creative Excellence</h3>
            <p className="text-sm text-gray-700">Our design team works closely with you to bring your vision to life, offering professional guidance and creative solutions.</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-semibold text-purple-800 mb-2">⚡ Fast Turnaround</h3>
            <p className="text-sm text-gray-700">Efficient production processes ensure your custom apparel is ready when you need it, without compromising quality.</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-semibold text-purple-800 mb-2">🏆 Premium Quality</h3>
            <p className="text-sm text-gray-700">We use only the finest materials and latest printing technologies to ensure durability and vibrant, long-lasting designs.</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-semibold text-purple-800 mb-2">🤝 Personal Service</h3>
            <p className="text-sm text-gray-700">Every customer receives dedicated support throughout their journey, from initial consultation to final delivery.</p>
          </div>
        </div>
      </div>
      <div className="mt-10 text-center">
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-2">Ready to Create Something Amazing?</h3>
          <p className="mb-4">Join thousands of satisfied customers who have brought their visions to life with MR Shirt Personalisation.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="/design" className="bg-white text-purple-600 px-6 py-2 rounded-md font-medium hover:bg-gray-100 transition-colors">
              Start Designing
            </a>
            <a href="/contact" className="border-2 border-white text-white px-6 py-2 rounded-md font-medium hover:bg-white hover:text-purple-600 transition-colors">
              Get a Quote
            </a>
          </div>
        </div>
      </div>
      
      {/* Business Information Disclosure */}
      <div className="mt-12 p-6 bg-gray-50 rounded-lg">
        <h2 className="text-2xl font-semibold mb-4 text-gray-900">Business Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Company Details</h3>
            <ul className="space-y-1">
              <li><strong>Business Name:</strong> MR SHIRT PERSONALISATION LTD</li>
              <li><strong>Legal Structure:</strong> Limited Company (Ltd)</li>
              <li><strong>Trading Address:</strong> 10 Barney Close, SE7 8SS, United Kingdom</li>
              <li><strong>Geographic Address:</strong> 10 Barney Close, SE7 8SS, United Kingdom</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Contact Information</h3>
            <ul className="space-y-1">
              <li><strong>Email:</strong> customer.service@mrshirtpersonalisation.com</li>
              <li><strong>Phone:</strong> 07902870824</li>
              <li><strong>Instagram:</strong> @mr_shirt_personalisation</li>
              <li><strong>Business Hours:</strong> Mon-Fri 9:00am - 6:00pm</li>
            </ul>
          </div>
        </div>
        <div className="mt-4 text-xs text-gray-600">
          <p><strong>Note:</strong> This information is provided in compliance with the Companies Act 2006 and E-Commerce Regulations.</p>
        </div>
      </div>
    </section>
    <Footer />
  </>
);

export default AboutPage; 