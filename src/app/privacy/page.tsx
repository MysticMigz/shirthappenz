import Header from '../components/Header';
import Footer from '../components/Footer';
import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <>
      <Header />
      <div className="min-h-[calc(100vh-160px)] bg-gradient-to-br from-purple-50 via-blue-50 to-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">Privacy Policy</h1>
          <p className="text-gray-600 mb-8 text-center">Last updated: {new Date().toLocaleDateString()}</p>
          
          <div className="bg-white rounded-lg shadow-lg p-8 space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-700 mb-4">
                Mr SHIRT PERSONALISATION ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your personal information when you use our website and services.
              </p>
              <p className="text-gray-700">
                We are the data controller responsible for your personal data. Our contact details are:
              </p>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700"><strong>Address:</strong> 10 Barney Close, SE7 8SS, United Kingdom</p>
                <p className="text-gray-700"><strong>Email:</strong> customer.service@mrshirtpersonalisation.com</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Personal Data We Collect</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Account Information</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>First and last name</li>
                    <li>Email address</li>
                    <li>Password (encrypted)</li>
                    <li>Account creation date</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Order Information</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>Shipping address</li>
                    <li>Billing address</li>
                    <li>Phone number</li>
                    <li>Order history and preferences</li>
                    <li>Payment information (processed securely by Stripe)</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Contact Form Data</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>Name</li>
                    <li>Email address</li>
                    <li>Message content</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Technical Data</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>IP address</li>
                    <li>Browser type and version</li>
                    <li>Device information</li>
                    <li>Visitor ID (anonymous tracking)</li>
                    <li>Website usage data</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Personal Data</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Legal Basis for Processing</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li><strong>Contract:</strong> To fulfill orders and provide services</li>
                    <li><strong>Legitimate Interest:</strong> To improve our services and prevent fraud</li>
                    <li><strong>Consent:</strong> For marketing communications (where applicable)</li>
                    <li><strong>Legal Obligation:</strong> To comply with tax and accounting requirements</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Purposes of Processing</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>Process and fulfill your orders</li>
                    <li>Provide customer support</li>
                    <li>Send order confirmations and updates</li>
                    <li>Process payments securely</li>
                    <li>Improve our website and services</li>
                    <li>Prevent fraud and ensure security</li>
                    <li>Comply with legal obligations</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Data Retention</h2>
              <div className="space-y-4">
                <p className="text-gray-700">We retain your personal data for the following periods:</p>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  <li><strong>Account data:</strong> Until you delete your account or 7 years after last activity</li>
                  <li><strong>Order data:</strong> 7 years (for tax and accounting purposes)</li>
                  <li><strong>Contact form data:</strong> 2 years</li>
                  <li><strong>Payment data:</strong> Processed by Stripe - see their privacy policy</li>
                  <li><strong>Technical data:</strong> 2 years</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Third-Party Processors</h2>
              <div className="space-y-4">
                <p className="text-gray-700">We use the following third-party services:</p>
                <div className="space-y-3">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-800">Stripe</h4>
                    <p className="text-gray-700 text-sm">Payment processing - handles payment information securely</p>
                    <a href="https://stripe.com/privacy" className="text-blue-600 text-sm underline">View Stripe Privacy Policy</a>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-800">MongoDB</h4>
                    <p className="text-gray-700 text-sm">Database hosting - stores your account and order data</p>
                    <a href="https://www.mongodb.com/legal/privacy-policy" className="text-blue-600 text-sm underline">View MongoDB Privacy Policy</a>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-800">Cloudinary</h4>
                    <p className="text-gray-700 text-sm">Image storage - stores uploaded design files</p>
                    <a href="https://cloudinary.com/privacy" className="text-blue-600 text-sm underline">View Cloudinary Privacy Policy</a>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Your Rights</h2>
              <p className="text-gray-700 mb-4">Under UK GDPR, you have the following rights:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-800">Right of Access</h4>
                  <p className="text-blue-700 text-sm">Request a copy of your personal data</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-800">Right to Rectification</h4>
                  <p className="text-blue-700 text-sm">Correct inaccurate personal data</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-800">Right to Erasure</h4>
                  <p className="text-blue-700 text-sm">Request deletion of your personal data</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-800">Right to Portability</h4>
                  <p className="text-blue-700 text-sm">Receive your data in a structured format</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-800">Right to Object</h4>
                  <p className="text-blue-700 text-sm">Object to processing of your data</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-800">Right to Restriction</h4>
                  <p className="text-blue-700 text-sm">Limit how we process your data</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Exercising Your Rights</h2>
              <p className="text-gray-700 mb-4">
                To exercise any of your rights, please contact us at:
              </p>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700"><strong>Email:</strong> customer.service@mrshirtpersonalisation.com</p>
                <p className="text-gray-700"><strong>Address:</strong> 10 Barney Close, SE7 8SS, United Kingdom</p>
              </div>
              <p className="text-gray-700 mt-4">
                We will respond to your request within one month. If you're not satisfied with our response, you can contact the Information Commissioner's Office (ICO).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Data Security</h2>
              <p className="text-gray-700 mb-4">We implement appropriate security measures to protect your personal data:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>Encryption of data in transit and at rest</li>
                <li>Secure payment processing through Stripe (PCI DSS Level 1 compliant)</li>
                <li>No credit card data stored on our servers</li>
                <li>HTTPS with valid SSL certificates for all transactions</li>
                <li>Regular security updates and monitoring</li>
                <li>Limited access to personal data on a need-to-know basis</li>
                <li>Secure hosting and database management</li>
                <li>Webhook signature verification for payment confirmations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. International Transfers</h2>
              <p className="text-gray-700">
                Some of our third-party processors may transfer data outside the UK/EEA. We ensure appropriate safeguards are in place through standard contractual clauses and adequacy decisions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Cookies</h2>
              <p className="text-gray-700 mb-4">
                We use cookies to improve your experience. For detailed information about our use of cookies, please see our{' '}
                <Link href="/cookies" className="text-blue-600 underline">Cookie Policy</Link>.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Changes to This Policy</h2>
              <p className="text-gray-700">
                We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Contact Us</h2>
              <p className="text-gray-700">
                If you have any questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700"><strong>Email:</strong> customer.service@mrshirtpersonalisation.com</p>
                <p className="text-gray-700"><strong>Address:</strong> 10 Barney Close, SE7 8SS, United Kingdom</p>
                <p className="text-gray-700"><strong>Phone:</strong> 07954746514</p>
              </div>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
} 