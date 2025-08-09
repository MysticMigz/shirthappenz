import Link from 'next/link';

const FeaturesSection = () => {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        {/* Main intro */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Online T-shirt printing for everyone!
          </h2>
          <div className="max-w-4xl mx-auto">
            <p className="text-lg text-gray-600 mb-6">
              If you would like a personalised t-shirt or hoodie created online and have it arrive within 
              a couple of days, you&apos;ve found the right company. We use DTF (Direct-to-Film) printing technology to 
              achieve this. Our printed t shirts are created and dispatched within just a few days.
            </p>
            <p className="text-lg text-gray-600">
              Our t-shirt printing service is for all, from corporations, brand owners, groups and individuals.
            </p>
          </div>
        </div>

        {/* Video tutorial section */}
        <div className="text-center mb-16">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            Watch How Easy it is to Design Your Own T-shirt!
          </h3>
          <div className="max-w-2xl mx-auto">
            <div className="aspect-video bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <div className="text-center text-white">
                <svg className="w-20 h-20 mx-auto mb-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                <p className="text-lg font-semibold">Tutorial Video Coming Soon</p>
                <p className="text-sm opacity-80">Learn how to design your custom t-shirt</p>
              </div>
            </div>
          </div>
        </div>

        {/* Key features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <div className="text-center">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Fast Turnaround</h4>
            <p className="text-gray-600">3-5 working days from order to delivery</p>
          </div>

          <div className="text-center">
            <div className="bg-gradient-to-r from-green-600 to-teal-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">No Minimum Order</h4>
            <p className="text-gray-600">Order just one or thousands - we print them all</p>
          </div>

          <div className="text-center">
            <div className="bg-gradient-to-r from-orange-500 to-red-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Latest Technology</h4>
            <p className="text-gray-600">DTF (Direct-to-Film) printing technology</p>
          </div>

          <div className="text-center">
            <div className="bg-gradient-to-r from-pink-600 to-purple-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Easy Design Tool</h4>
            <p className="text-gray-600">Upload images, add text, customize instantly</p>
          </div>
        </div>

        {/* Printing services section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Why use Mr Shirt Personalisation for your garment printing?</h3>
            <div className="space-y-4">
              <div>
                <h4 className="text-lg font-semibold text-purple-600 mb-2">History and Mission</h4>
                <p className="text-gray-600">
                  Here at Mr Shirt Personalisation we have years of experience in the print industry. We use both 
                  traditional and modern printing equipment, making us experts when it comes to print.
                </p>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-purple-600 mb-2">Online Excellence</h4>
                <p className="text-gray-600">
                  We&apos;ve created an online platform that makes designing and ordering custom apparel 
                  simple and enjoyable. Our constantly evolving website listens to our clients&apos; needs.
                </p>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-purple-600 mb-2">Best Rates</h4>
                <p className="text-gray-600">
                  With our experienced team and efficient processes, we can produce high-quality 
                  t-shirt printing services at the best rates in the industry.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Printing Technologies</h3>
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors">
                <h4 className="text-lg font-semibold text-purple-600 mb-2">DTF (Direct-to-Film)</h4>
                <p className="text-gray-600">
                  Our advanced DTF printing technology delivers vibrant, durable transfers that work 
                  on various fabrics and colors. Perfect for both small and large orders with 
                  excellent color reproduction and durability.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA section */}
        <div className="text-center bg-gradient-to-r from-[var(--brand-red)] to-[var(--brand-blue)] rounded-lg p-8 text-white">
          <h3 className="text-2xl font-bold mb-4">Ready to Create Your Custom Design?</h3>
          <p className="text-lg mb-6 opacity-90">
            Start designing today and receive your custom t-shirt within days!
          </p>
          <div className="space-x-4">
            <Link
              href="/design"
              className="inline-block bg-white text-black px-8 py-3 rounded-lg font-bold hover:bg-gradient-to-r hover:from-[var(--brand-red)] hover:to-[var(--brand-blue)] hover:bg-clip-text hover:text-transparent transition-colors"
            >
              Start Designing
            </Link>
            <Link
              href="/products"
              className="inline-block border-2 border-white text-white px-8 py-3 rounded-lg font-bold hover:bg-white hover:text-black transition-colors"
            >
              Browse Products
            </Link>
          </div>
        </div>

        {/* Services Section with Enhanced Styling */}
        <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 mb-8">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Our Premium Service
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Experience the future of custom apparel with our advanced DTF (Direct-to-Film) printing technology
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 p-8 border border-gray-100">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                {/* Icon Section */}
                <div className="flex-shrink-0">
                  <div className="bg-gradient-to-r from-purple-500 to-blue-600 w-16 h-16 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                </div>

                {/* Content Section */}
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">DTF (Direct-to-Film) Printing</h3>
                  <p className="text-gray-600 text-lg leading-relaxed mb-6">
                    Our advanced DTF printing technology delivers vibrant, durable transfers that work on various fabrics and colors. 
                    Perfect for both small and large orders with excellent color reproduction and durability.
                  </p>
                  
                  {/* Features Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <div className="flex items-center justify-center md:justify-start gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-700">Vibrant Colors</span>
                    </div>
                    <div className="flex items-center justify-center md:justify-start gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-700">Durable Transfers</span>
                    </div>
                    <div className="flex items-center justify-center md:justify-start gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-700">All Fabric Types</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection; 