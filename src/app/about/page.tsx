import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const AboutPage = () => (
  <>
    <Header />
    <section className="max-w-3xl mx-auto py-16 px-4">
      <div className="flex flex-col items-center mb-8">
        {/* Placeholder for an image */}
        <div className="w-40 h-40 bg-gray-200 rounded-full flex items-center justify-center mb-4">
          <span className="text-gray-400 text-2xl">Image Placeholder</span>
        </div>
        <h1 className="text-4xl font-bold mb-6 text-purple-700">About Us</h1>
      </div>
      <p className="text-lg mb-4 text-gray-700">
        Welcome to <strong>MR Shirt Personalisation</strong>! We are passionate about helping you create custom apparel that expresses your unique style, brand, or team spirit.
      </p>
      <p className="text-lg mb-4 text-gray-700">
        <strong>What does the "MR" stand for?</strong> It stands for <span className="font-semibold">Miguel</span> and <span className="font-semibold">Roshan</span> — the founders of MR Shirt Personalisation. Our journey began with a shared vision to make high-quality, personalised clothing accessible and fun for everyone.
      </p>
      <p className="text-lg mb-4 text-gray-700">
        With backgrounds in design, technology, and a love for creativity, Miguel and Roshan combined their skills to build a platform where anyone can design and order custom t-shirts, hoodies, jerseys, and more. We use the latest printing technologies to ensure your designs look vibrant and last wash after wash.
      </p>
      <p className="text-lg mb-4 text-gray-700">
        Whether you’re a business, a sports team, or just want something unique for yourself, we’re here to help you bring your ideas to life. Thank you for supporting our small business and being part of our story!
      </p>
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-2 text-purple-600">Our Founders</h2>
        <ul className="list-disc pl-6 text-gray-700">
          <li><strong>Miguel</strong> – Creative lead, designer, and co-founder</li>
          <li><strong>Roshan</strong> – Operations, technology, and co-founder</li>
        </ul>
      </div>
      <div className="mt-10 text-gray-600">
        <p>
          <strong>MR Shirt Personalisation</strong> – Where your ideas become reality.
        </p>
      </div>
      
      {/* Business Information Disclosure */}
      <div className="mt-12 p-6 bg-gray-50 rounded-lg">
        <h2 className="text-2xl font-semibold mb-4 text-gray-900">Business Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Company Details</h3>
            <ul className="space-y-1">
              <li><strong>Business Name:</strong> Mr SHIRT PERSONALISATION</li>
              <li><strong>Legal Structure:</strong> Sole Trader</li>
              <li><strong>Trading Address:</strong> 10 Barney Close, SE7 8SS, United Kingdom</li>
              <li><strong>Geographic Address:</strong> 10 Barney Close, SE7 8SS, United Kingdom</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Contact Information</h3>
            <ul className="space-y-1">
              <li><strong>Email:</strong> customer.service@mrshirtpersonalisation.com</li>
              <li><strong>Phone:</strong> 07954746514</li>
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