import Header from '../components/Header';
import Footer from '../components/Footer';
import Link from 'next/link';

export default function TermsOfServicePage() {
  return (
    <>
      <Header />
      <div className="min-h-[calc(100vh-160px)] bg-gradient-to-br from-purple-50 via-blue-50 to-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">Terms of Service</h1>
          <p className="text-gray-600 mb-8 text-center">Last updated: {new Date().toLocaleDateString()}</p>
          
          <div className="bg-white rounded-lg shadow-lg p-8 space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-700 mb-4">
                These Terms of Service ("Terms") govern your use of the Mr SHIRT PERSONALISATION website and services. By accessing or using our website, you agree to be bound by these Terms.
              </p>
              <p className="text-gray-700">
                <strong>Company Details:</strong> Mr SHIRT PERSONALISATION, 10 Barney Close, SE7 8SS, United Kingdom
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Definitions</h2>
              <div className="space-y-3">
                <p className="text-gray-700"><strong>"Service"</strong> refers to our website and custom printing services.</p>
                <p className="text-gray-700"><strong>"User"</strong> refers to anyone who accesses or uses our Service.</p>
                <p className="text-gray-700"><strong>"Order"</strong> refers to a request for custom printing services.</p>
                <p className="text-gray-700"><strong>"Design"</strong> refers to any artwork, text, or image submitted for printing.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Account Registration</h2>
              <div className="space-y-4">
                <p className="text-gray-700">To use certain features of our Service, you must create an account. You agree to:</p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li>Provide accurate, current, and complete information</li>
                  <li>Maintain and update your account information</li>
                  <li>Keep your password secure and confidential</li>
                  <li>Accept responsibility for all activities under your account</li>
                  <li>Notify us immediately of any unauthorized use</li>
                </ul>
                <p className="text-gray-700">
                  We reserve the right to terminate accounts that violate these Terms or are inactive for extended periods.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Orders and Payment</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Order Process</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>All orders are subject to acceptance and availability</li>
                    <li>Prices are in GBP and include VAT where applicable</li>
                    <li>Payment is required at the time of order placement</li>
                    <li>Orders are processed in the order received</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Payment Terms</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>We accept payment through Stripe (credit/debit cards)</li>
                    <li>All payments are processed securely</li>
                    <li>Prices may change without notice</li>
                    <li>Refunds are processed according to our return policy</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Payment Security</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>We use Stripe, a PCI DSS Level 1 compliant payment processor</li>
                    <li>No credit card data is stored on our servers</li>
                    <li>All payment information is encrypted and processed securely</li>
                    <li>Our website uses HTTPS with valid SSL certificates</li>
                    <li>Payment processing is handled entirely by Stripe's secure infrastructure</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Order Confirmation</h3>
                  <p className="text-gray-700">
                    You will receive an email confirmation upon successful order placement. This confirmation serves as proof of your order and agreement to these Terms.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Design and Content Guidelines</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Acceptable Content</h3>
                  <p className="text-gray-700 mb-2">You may only submit designs that:</p>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>You own or have permission to use</li>
                    <li>Do not infringe on intellectual property rights</li>
                    <li>Are not offensive, defamatory, or illegal</li>
                    <li>Meet our technical specifications</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Prohibited Content</h3>
                  <p className="text-gray-700 mb-2">We reserve the right to reject designs containing:</p>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>Copyrighted material without permission</li>
                    <li>Offensive, discriminatory, or hate speech</li>
                    <li>Violent or inappropriate imagery</li>
                    <li>Personal information of others</li>
                    <li>Content that promotes illegal activities</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Design Specifications</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>High-resolution images (300 DPI minimum)</li>
                    <li>Supported formats: PNG, JPG, PDF, SVG</li>
                    <li>Maximum file size: 10MB</li>
                    <li>Clear, readable text and graphics</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Production and Delivery</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Production Times</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>Standard orders: 3-5 working days</li>
                    <li>Rush orders: 1-2 working days (additional fee)</li>
                    <li>Bulk orders: 5-7 working days</li>
                    <li>Times may vary during peak periods</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Shipping and Delivery</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>UK delivery: 2-3 working days</li>
                    <li>International delivery: 5-10 working days</li>
                    <li>Tracking information provided via email</li>
                    <li>Delivery to address provided at checkout</li>
                    <li>Signature may be required for high-value orders</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Shipping Costs</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>Shipping costs are calculated at checkout based on weight and destination</li>
                    <li>Free shipping available on orders over £50 (UK only)</li>
                    <li>International shipping costs vary by country</li>
                    <li>Express delivery available at additional cost</li>
                    <li>Shipping costs are non-refundable unless goods are defective</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Delivery Timeframes</h3>
                  <p className="text-gray-700 mb-2">
                    Estimated delivery times are provided at checkout. These are estimates only and may vary due to:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>Production delays during peak periods</li>
                    <li>Customization complexity</li>
                    <li>Shipping carrier delays</li>
                    <li>Weather or other external factors</li>
                    <li>Incorrect or incomplete delivery addresses</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Lost or Damaged Goods</h3>
                  <p className="text-gray-700 mb-2">
                    We are responsible for goods until they arrive with the customer. In the event of lost or damaged goods:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>Contact us immediately (within 48 hours of expected delivery)</li>
                    <li>Provide order number and photos of damage (if applicable)</li>
                    <li>We will investigate with the shipping carrier</li>
                    <li>Replacement or full refund provided for lost/damaged items</li>
                    <li>We cover all costs for lost or damaged goods</li>
                    <li>Shipping costs refunded for lost items</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Delivery Issues</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>Failed delivery attempts will be returned to us</li>
                    <li>Additional shipping costs may apply for re-delivery</li>
                    <li>Incorrect addresses may result in additional charges</li>
                    <li>We reserve the right to refuse delivery to certain addresses</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Quality Assurance</h3>
                  <p className="text-gray-700">
                    We inspect all products before shipping. If you receive a defective item, please contact us within 14 days with photos for replacement or refund.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Cancellations, Returns and Refunds</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Right to Cancel</h3>
                  <p className="text-gray-700 mb-2">
                    Under the Consumer Contracts Regulations, you have the right to cancel your order within 14 days of receiving your goods, without giving any reason.
                  </p>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>You may cancel your order at any time before we begin production</li>
                    <li>Once production has started, cancellation may not be possible for custom items</li>
                    <li>To cancel, contact us by email or phone within 14 days of delivery</li>
                    <li>You must return the goods within 14 days of notifying us of cancellation</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Return Policy</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>Returns accepted within 14 days of delivery</li>
                    <li>Items must be unused and in original condition</li>
                    <li>Custom/personalized items cannot be returned unless defective</li>
                    <li>You are responsible for return shipping costs unless the item is defective</li>
                    <li>Return address: 10 Barney Close, SE7 8SS, United Kingdom</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Refund Process</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>Full refunds issued within 14 days of receiving returned goods</li>
                    <li>Original payment method will be credited</li>
                    <li>No processing fees deducted for valid returns</li>
                    <li>Refunds include original shipping costs for cancelled orders</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Exceptions</h3>
                  <p className="text-gray-700 mb-2">
                    The right to cancel does not apply to:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>Custom-made items that have been personalized to your specifications</li>
                    <li>Items that have been used or damaged after delivery</li>
                    <li>Items that cannot be returned for hygiene reasons</li>
                    <li>Items that have been sealed and opened after delivery</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Intellectual Property</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Your Rights</h3>
                  <p className="text-gray-700">
                    You retain ownership of designs you submit. You grant us a limited license to use your designs solely for the purpose of fulfilling your order.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Our Rights</h3>
                  <p className="text-gray-700">
                    Our website, content, and branding are protected by copyright and other intellectual property laws. You may not copy, reproduce, or distribute our content without permission.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Third-Party Rights</h3>
                  <p className="text-gray-700">
                    You are responsible for ensuring your designs do not infringe on third-party intellectual property rights. We are not liable for any infringement claims.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Privacy and Data Protection</h2>
              <p className="text-gray-700 mb-4">
                Your privacy is important to us. Our collection and use of personal information is governed by our{' '}
                <Link href="/privacy" className="text-blue-600 underline">Privacy Policy</Link>.
              </p>
              <p className="text-gray-700">
                By using our Service, you consent to our collection and use of your personal data as described in our Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Limitation of Liability</h2>
              <div className="space-y-4">
                <p className="text-gray-700">
                  To the maximum extent permitted by law, Mr SHIRT PERSONALISATION shall not be liable for:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  <li>Indirect, incidental, or consequential damages</li>
                  <li>Loss of profits, data, or business opportunities</li>
                  <li>Damages exceeding the amount paid for the specific order</li>
                  <li>Issues arising from user-provided designs or content</li>
                </ul>
                <p className="text-gray-700">
                  This limitation does not affect your statutory rights as a consumer.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Disclaimers</h2>
              <div className="space-y-4">
                <p className="text-gray-700">
                  Our Service is provided "as is" without warranties of any kind. We do not guarantee:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  <li>Uninterrupted or error-free service</li>
                  <li>Compatibility with all devices or browsers</li>
                  <li>Accuracy of product descriptions or images</li>
                  <li>Availability of specific products or services</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Termination</h2>
              <div className="space-y-4">
                <p className="text-gray-700">
                  We may terminate or suspend your account and access to our Service at any time, with or without notice, for conduct that we believe violates these Terms or is harmful to other users or our business.
                </p>
                <p className="text-gray-700">
                  You may terminate your account at any time by contacting us. Upon termination, your right to use the Service will cease immediately.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Governing Law</h2>
              <p className="text-gray-700">
                These Terms are governed by and construed in accordance with the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Changes to Terms</h2>
              <p className="text-gray-700">
                We reserve the right to modify these Terms at any time. Changes will be effective immediately upon posting. Your continued use of the Service after changes constitutes acceptance of the new Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">15. Contact Information</h2>
              <p className="text-gray-700 mb-4">
                If you have any questions about these Terms, please contact us:
              </p>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700"><strong>Email:</strong> customer.service@mrshirtpersonalisation.com</p>
                <p className="text-gray-700"><strong>Address:</strong> 10 Barney Close, SE7 8SS, United Kingdom</p>
                <p className="text-gray-700"><strong>Phone:</strong> 07954746514</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">16. Related Policies</h2>
              <p className="text-gray-700 mb-4">
                Please also review our related policies:
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/privacy" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Privacy Policy
                </Link>
                <Link href="/cookies" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  Cookie Policy
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
} 