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
    </section>
    <Footer />
  </>
);

export default AboutPage; 