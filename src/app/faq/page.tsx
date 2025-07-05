import Header from '../components/Header';
import Footer from '../components/Footer';
import Link from 'next/link';

export default function FAQPage() {
  return (
    <>
      <Header />
      <main className="max-w-2xl mx-auto py-16 px-4 sm:px-6 lg:px-8 bg-blue-50 rounded-lg shadow-md mt-8 mb-12">
        <h1 className="text-2xl font-bold mb-6 text-gray-900">Frequently Asked Questions</h1>
        <div className="space-y-4 text-gray-800">
          <div>
            <span className="font-semibold">How long does it take to get a response?</span> We aim to reply to all queries within 24 hours (Mon-Fri).
          </div>
          <div>
            <span className="font-semibold">Can I visit your shop?</span> Please contact us to arrange a visit or consultation.
          </div>
          <div>
            <span className="font-semibold">Do you offer bulk discounts?</span> Yes! Let us know your requirements for a custom quote.
          </div>
          <div>
            <span className="font-semibold">What is your return policy?</span> We want you to be happy with your order!<br />
            <ul className="list-disc ml-6 mt-1">
              <li>Returns are accepted within 14 days of delivery for items that are faulty, damaged, or incorrect.</li>
              <li>Custom or personalised items cannot be returned unless there is a manufacturing defect or error on our part.</li>
              <li>If you have an issue, please contact us with your order number and photos of the problem so we can resolve it quickly.</li>
              <li>Refunds or replacements will be processed once we have received and inspected the returned item.</li>
              <li>Return shipping costs are covered if the item is faulty or incorrect; otherwise, the customer is responsible for return postage.</li>
            </ul>
          </div>
          <div>
            <span className="font-semibold">What printing methods do you offer?</span> We offer DTF and sublimation printing for a wide range of apparel and accessories.
          </div>
          <div>
            <span className="font-semibold">Can I provide my own design?</span> Absolutely! You can upload your own artwork or use our online designer to create something unique.
          </div>
          <div>
            <span className="font-semibold">Is there a minimum order quantity?</span> No minimums for most products. Bulk discounts are available for larger orders.
          </div>
          <div>
            <span className="font-semibold">How long does production take?</span> Standard turnaround is 3-5 working days. Rush options are available—contact us for details.
          </div>
          <div>
            <span className="font-semibold">Do you ship internationally?</span> We currently only ship within the UK.
          </div>
          <div>
            <span className="font-semibold">How do I care for my printed garments?</span> Wash inside out at 30°C, avoid bleach, and tumble dry low. Do not iron directly on the print.
          </div>
        </div>
        <div className="mt-8 text-sm text-gray-500">
          Looking for something else? <Link href="/contact" className="text-blue-600 underline">Contact us</Link>.
        </div>
      </main>
      <Footer />
    </>
  );
} 