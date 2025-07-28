import Header from '../components/Header';
import Footer from '../components/Footer';
import Link from 'next/link';

export default function CookiePolicyPage() {
  return (
    <>
      <Header />
      <div className="min-h-[calc(100vh-160px)] bg-gradient-to-br from-purple-50 via-blue-50 to-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">Cookie Policy</h1>
          <p className="text-gray-600 mb-8 text-center">Last updated: {new Date().toLocaleDateString()}</p>
          
          <div className="bg-white rounded-lg shadow-lg p-8 space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. What Are Cookies?</h2>
              <p className="text-gray-700 mb-4">
                Cookies are small text files that are stored on your device when you visit our website. They help us provide you with a better experience by remembering your preferences and enabling certain features.
              </p>
              <p className="text-gray-700">
                We use cookies to improve your browsing experience, analyze website traffic, and provide personalized content.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Types of Cookies We Use</h2>
              
              <div className="space-y-6">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Essential Cookies</h3>
                  <p className="text-gray-700 mb-2">These cookies are necessary for the website to function properly.</p>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-2">Visitor ID Cookie</h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li><strong>Name:</strong> visitorId</li>
                      <li><strong>Purpose:</strong> Anonymous visitor tracking for analytics</li>
                      <li><strong>Duration:</strong> 1 year</li>
                      <li><strong>Type:</strong> First-party</li>
                    </ul>
                  </div>
                </div>

                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Functional Cookies</h3>
                  <p className="text-gray-700 mb-2">These cookies enable enhanced functionality and personalization.</p>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-2">Session Cookies</h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li><strong>Purpose:</strong> Maintain user login sessions</li>
                      <li><strong>Duration:</strong> Session (deleted when browser closes)</li>
                      <li><strong>Type:</strong> First-party</li>
                    </ul>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg mt-3">
                    <h4 className="font-semibold text-gray-800 mb-2">Shopping Cart Cookies</h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li><strong>Purpose:</strong> Store cart items and preferences</li>
                      <li><strong>Duration:</strong> 1 year</li>
                      <li><strong>Type:</strong> First-party</li>
                    </ul>
                  </div>
                </div>

                <div className="border-l-4 border-yellow-500 pl-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Analytics Cookies</h3>
                  <p className="text-gray-700 mb-2">These cookies help us understand how visitors interact with our website.</p>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-2">Website Analytics</h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li><strong>Purpose:</strong> Track page views, user behavior, and site performance</li>
                      <li><strong>Duration:</strong> 2 years</li>
                      <li><strong>Type:</strong> First-party</li>
                    </ul>
                  </div>
                </div>

                <div className="border-l-4 border-red-500 pl-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Third-Party Cookies</h3>
                  <p className="text-gray-700 mb-2">These cookies are set by third-party services we use.</p>
                  
                  <div className="space-y-3">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-800 mb-2">Stripe Payment Cookies</h4>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li><strong>Purpose:</strong> Secure payment processing</li>
                        <li><strong>Duration:</strong> Session to 1 year (varies by cookie)</li>
                        <li><strong>Provider:</strong> Stripe</li>
                        <li><strong>Privacy Policy:</strong> <a href="https://stripe.com/privacy" className="text-blue-600 underline">stripe.com/privacy</a></li>
                      </ul>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-800 mb-2">Cloudinary Cookies</h4>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li><strong>Purpose:</strong> Image optimization and delivery</li>
                        <li><strong>Duration:</strong> Session to 1 year</li>
                        <li><strong>Provider:</strong> Cloudinary</li>
                        <li><strong>Privacy Policy:</strong> <a href="https://cloudinary.com/privacy" className="text-blue-600 underline">cloudinary.com/privacy</a></li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Cookies</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Essential Functions</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>Maintain user login sessions</li>
                    <li>Store shopping cart items</li>
                    <li>Remember user preferences</li>
                    <li>Enable secure payment processing</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Analytics and Improvement</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>Track website usage and performance</li>
                    <li>Identify popular products and pages</li>
                    <li>Improve website functionality</li>
                    <li>Optimize user experience</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Security and Fraud Prevention</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>Prevent fraudulent transactions</li>
                    <li>Protect against unauthorized access</li>
                    <li>Ensure secure payment processing</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Managing Your Cookie Preferences</h2>
              <div className="space-y-4">
                <p className="text-gray-700">
                  You can control and manage cookies in several ways:
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">Browser Settings</h4>
                    <p className="text-blue-700 text-sm">Most browsers allow you to block or delete cookies through their settings menu.</p>
                  </div>
                  
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2">Cookie Consent</h4>
                    <p className="text-green-700 text-sm">You can withdraw consent for non-essential cookies at any time.</p>
                  </div>
                  
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <h4 className="font-semibold text-yellow-800 mb-2">Third-Party Opt-Out</h4>
                    <p className="text-yellow-700 text-sm">Visit third-party websites to opt out of their tracking.</p>
                  </div>
                  
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <h4 className="font-semibold text-purple-800 mb-2">Contact Us</h4>
                    <p className="text-purple-700 text-sm">Email us for help managing your cookie preferences.</p>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2">How to Disable Cookies</h4>
                  <div className="text-sm text-gray-700 space-y-2">
                    <p><strong>Chrome:</strong> Settings → Privacy and security → Cookies and other site data</p>
                    <p><strong>Firefox:</strong> Options → Privacy & Security → Cookies and Site Data</p>
                    <p><strong>Safari:</strong> Preferences → Privacy → Manage Website Data</p>
                    <p><strong>Edge:</strong> Settings → Cookies and site permissions → Cookies and site data</p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Impact of Disabling Cookies</h2>
              <div className="space-y-4">
                <p className="text-gray-700 mb-4">
                  Please note that disabling certain cookies may affect your experience on our website:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li><strong>Essential cookies:</strong> The website may not function properly</li>
                  <li><strong>Functional cookies:</strong> You may need to log in repeatedly and cart items may not be saved</li>
                  <li><strong>Analytics cookies:</strong> We won't be able to improve our services based on usage data</li>
                  <li><strong>Payment cookies:</strong> Payment processing may be affected</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Updates to This Policy</h2>
              <p className="text-gray-700">
                We may update this Cookie Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. We will notify you of any material changes by posting the updated policy on this page.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Contact Us</h2>
              <p className="text-gray-700 mb-4">
                If you have any questions about our use of cookies or this Cookie Policy, please contact us:
              </p>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700"><strong>Email:</strong> customer.service@mrshirtpersonalisation.com</p>
                <p className="text-gray-700"><strong>Address:</strong> 10 Barney Close, SE7 8SS, United Kingdom</p>
                <p className="text-gray-700"><strong>Phone:</strong> 07954746514</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Related Policies</h2>
              <p className="text-gray-700 mb-4">
                For more information about how we handle your personal data, please see our:
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/privacy" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Privacy Policy
                </Link>
                <Link href="/terms" className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                  Terms of Service
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