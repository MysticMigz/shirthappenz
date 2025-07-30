import Header from '../components/Header';
import Footer from '../components/Footer';
import Link from 'next/link';
import { FaEnvelope, FaPhone, FaQuestionCircle, FaLightbulb, FaVideo } from 'react-icons/fa';
import Image from 'next/image';

export default function HelpPage() {
  return (
    <>
      <Header />
      <main className="max-w-4xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="bg-blue-50 rounded-lg shadow-md p-8 mb-12">
          <h1 className="text-3xl font-bold mb-4 text-gray-900 flex items-center gap-2">
            <FaQuestionCircle className="text-blue-400" /> Help & Support
          </h1>
          <p className="mb-6 text-gray-800 text-lg">
            Need assistance? We're here to help! Whether you have questions about your order, need design advice, or want to learn more about our services, you can find answers and support below.
          </p>
          <ul className="list-disc ml-6 mb-6 text-gray-800 space-y-2">
            <li>
              <Link href="/faq" className="text-blue-600 underline font-semibold">Read our Frequently Asked Questions (FAQ)</Link> for quick answers to common queries.
            </li>
            <li>
              <Link href="/contact" className="text-blue-600 underline font-semibold">Contact us</Link> for personalised support or to discuss your order.
            </li>
            <li>
              Explore our <Link href="/help/quick-tips" className="text-blue-600 underline font-semibold">Quick Tips</Link> and <Link href="/help/video-guide" className="text-blue-600 underline font-semibold">Video Guide</Link> for design and ordering help.
            </li>
          </ul>
          <div className="mt-8 text-sm text-gray-500">
            Still need help? <Link href="/contact" className="text-blue-600 underline">Reach out to our team</Link> and we'll get back to you as soon as possible.
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center my-12">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="mx-4 text-gray-400 font-semibold">Popular Topics</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        {/* Popular Topics Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="bg-white rounded-lg shadow p-6 flex flex-col gap-2 border border-blue-100">
            <h2 className="text-lg font-semibold mb-2 flex items-center gap-2"><FaLightbulb className="text-yellow-400" /> Quick Tips</h2>
            <p className="text-gray-700 mb-2">Get the most out of your custom apparel order with our expert tips on design, sizing, and care.</p>
            <Link href="/help/quick-tips" className="text-blue-600 underline font-medium">See Quick Tips</Link>
          </div>
          <div className="bg-white rounded-lg shadow p-6 flex flex-col gap-2 border border-blue-100">
            <h2 className="text-lg font-semibold mb-2 flex items-center gap-2"><FaVideo className="text-blue-400" /> Video Guide</h2>
            <p className="text-gray-700 mb-2">Watch our step-by-step video guide to learn how to design and order your perfect t-shirt.</p>
            <Link href="/help/video-guide" className="text-blue-600 underline font-medium">Watch Video Guide</Link>
          </div>
        </div>

        {/* Contact Card */}
        <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg shadow p-8 flex flex-col md:flex-row items-center gap-8 mb-12 border border-blue-200">
          <div className="flex-1">
            <h2 className="text-xl font-bold mb-2 text-gray-900 flex items-center gap-2"><FaEnvelope className="text-purple-500" /> Contact Support</h2>
            <p className="text-gray-700 mb-2">Can't find what you need? Our team is ready to help with any questions or issues.</p>
            <ul className="text-gray-700 mb-2">
              <li><FaEnvelope className="inline mr-2 text-purple-400" /> Email: <a href="mailto:customer.service@mrshirtpersonalisation.com" className="text-blue-600 underline">customer.service@mrshirtpersonalisation.com</a></li>
              <li><FaPhone className="inline mr-2 text-purple-400" /> Phone: <a href="tel:07954746514" className="text-blue-600 underline">07954746514</a></li>
              <li className="text-sm text-gray-600">MR SHIRT PERSONALISATION LTD</li>
            </ul>
            <Link href="/contact" className="inline-block mt-4 px-6 py-2 bg-white text-black rounded-lg font-semibold shadow hover:bg-gradient-to-r hover:from-[var(--brand-red)] hover:to-[var(--brand-blue)] hover:bg-clip-text hover:text-transparent transition">Contact Us</Link>
          </div>
          <div className="flex-shrink-0">
            <Image src="/images/logo.png" alt="Mr SHIRT PERSONALISATION Logo" width={120} height={60} className="h-20 w-auto" />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
} 