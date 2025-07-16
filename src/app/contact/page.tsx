'use client';

import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    window.location.href = `mailto:customerservice@mrshirtpersonalisation.co.uk?subject=Contact%20from%20${encodeURIComponent(form.name)}&body=${encodeURIComponent(form.message + '\n\nFrom: ' + form.email)}`;
    setSubmitted(true);
  };

  return (
    <>
      <Header />
      <div className="min-h-[calc(100vh-160px)] bg-gradient-to-br from-purple-50 via-blue-50 to-white py-12 px-4">
        <div className="w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24">
          {/* Left: Info & FAQ */}
          <section className="flex flex-col gap-12 justify-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Contact Information</h2>
              <p className="text-gray-600 mb-4">We're here to help! Reach out to us using the form or the details below.</p>
              <div className="text-gray-700 space-y-2 text-base">
                <div><span className="font-semibold">Email:</span> <a href="mailto:customerservice@mrshirtpersonalisation.co.uk" className="text-blue-600 underline">customerservice@mrshirtpersonalisation.co.uk</a></div>
                <div><span className="font-semibold">Phone:</span> <span>+44 1234 567890</span></div>
                <div><span className="font-semibold">Address:</span> <span>123 Design Street, Creative City, CC 12345, United Kingdom</span></div>
                <div><span className="font-semibold">Business Hours:</span> <span>Mon-Fri 9:00am - 6:00pm</span></div>
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2 mt-8">Find Us</h3>
              <div className="rounded-lg overflow-hidden border border-gray-200 bg-gray-100 h-48 flex items-center justify-center text-gray-400 text-base">
                {/* Map placeholder - replace with real map if desired */}
                <span>Map location coming soon</span>
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2 mt-8">Frequently Asked Questions</h3>
              <ul className="space-y-3 text-gray-700 text-base">
                <li><span className="font-semibold">How long does it take to get a response?</span> We aim to reply to all queries within 24 hours (Mon-Fri).</li>
                <li><span className="font-semibold">Can I visit your shop?</span> Please contact us to arrange a visit or consultation.</li>
                <li><span className="font-semibold">Do you offer bulk discounts?</span> Yes! Let us know your requirements for a custom quote.</li>
                <li><span className="font-semibold">What is your return policy?</span> Please see our <a href="/help/faqs" className="text-blue-600 underline">FAQs</a> for details.</li>
              </ul>
            </div>
          </section>
          {/* Right: Contact Form */}
          <section>
            <h1 className="text-5xl font-extrabold mb-4 text-gray-900 text-center md:text-left">Contact Us</h1>
            <p className="mb-10 text-gray-600 text-center md:text-left text-xl">
              Have a question or need help? Fill out the form below or email us at
              <a href="mailto:customerservice@mrshirtpersonalisation.co.uk" className="text-blue-600 underline ml-1">customerservice@mrshirtpersonalisation.co.uk</a>
            </p>
            <form onSubmit={handleSubmit} className="space-y-8">
              <div>
                <label htmlFor="name" className="block text-base font-semibold text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-5 py-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-400 transition-all bg-gray-50 hover:bg-white text-lg"
                  placeholder="Your Name"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-base font-semibold text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-5 py-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-400 transition-all bg-gray-50 hover:bg-white text-lg"
                  placeholder="you@email.com"
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-base font-semibold text-gray-700 mb-1">Message</label>
                <textarea
                  id="message"
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-5 py-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-400 transition-all bg-gray-50 hover:bg-white text-lg resize-none"
                  placeholder="How can we help you?"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-white text-black py-4 px-4 rounded-lg hover:bg-gradient-to-r hover:from-[var(--brand-red)] hover:to-[var(--brand-blue)] hover:bg-clip-text hover:text-transparent transition-all font-bold text-xl shadow-md hover:shadow-xl"
              >
                Send Message
              </button>
            </form>
            {submitted && (
              <div className="mt-8 text-green-600 font-semibold text-center text-xl">Thank you for your message! We will get back to you soon.</div>
            )}
          </section>
        </div>
      </div>
      <Footer />
    </>
  );
} 