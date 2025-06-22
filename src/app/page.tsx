import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Header/Navigation */}
      <header className="nav-container">
        <nav className="container-custom py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2 hover-lift">
              <Image 
                src="https://img.icons8.com/color/96/t-shirt.png" 
                alt="ShirtHappenz Logo" 
                width={48} 
                height={48} 
                className="hover:opacity-90 transition-opacity"
                priority
              />
              <span className="text-2xl font-bold text-[var(--color-primary)]">ShirtHappenz</span>
            </Link>
            <div className="hidden md:flex space-x-8">
              <Link href="/custom-designs" className="nav-link">Custom Designs</Link>
              <Link href="/jersey-printing" className="nav-link">Jersey Printing</Link>
              <Link href="/about" className="nav-link">About</Link>
              <Link href="/contact" className="nav-link">Contact</Link>
            </div>
            {/* Mobile Menu Button */}
            <button className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="hero-section section-padding">
        <div className="hero-content container-custom">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="animate-slide-up">
              <h1 className="hero-title mb-6">
                Custom Designs That Make You 
                <span className="text-gradient block mt-2">Stand Out</span>
              </h1>
              <p className="hero-description mb-8">Professional jersey and shirt printing services with your unique style in mind.</p>
              <div className="flex flex-wrap gap-4">
                <Link href="/custom-designs" className="btn glass hover-lift">
                  Start Designing
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
                <Link href="/jersey-printing" className="btn btn-outline hover-lift">
                  Jersey Printing
                </Link>
              </div>
            </div>
            <div className="relative h-[400px] animate-fade-in">
              <div className="absolute inset-0 flex items-center justify-center">
                <Image
                  src="https://img.icons8.com/clouds/400/t-shirt.png"
                  alt="Custom T-Shirt Design"
                  width={400}
                  height={400}
                  className="object-contain hover-scale"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <h2 className="section-title">Our Services</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="service-card animate-fade-in">
              <div className="flex items-start space-x-4">
                <div className="feature-icon shrink-0">
                  <Image 
                    src="https://img.icons8.com/color/48/design.png"
                    alt="Custom Design Icon"
                    width={24}
                    height={24}
                  />
                </div>
                <div>
                  <h3 className="heading-3 mb-4">Custom Designs</h3>
                  <p className="text-[var(--color-text-secondary)] mb-6">Create your perfect shirt with our easy-to-use design tools. Upload your own artwork or use our templates.</p>
                  <Link href="/custom-designs" className="btn btn-primary">Create Design</Link>
                </div>
              </div>
            </div>
            <div className="service-card animate-fade-in">
              <div className="flex items-start space-x-4">
                <div className="feature-icon shrink-0 bg-[var(--color-secondary)]">
                  <Image 
                    src="https://img.icons8.com/color/48/jersey.png"
                    alt="Jersey Printing Icon"
                    width={24}
                    height={24}
                  />
                </div>
                <div>
                  <h3 className="heading-3 mb-4">Jersey Printing</h3>
                  <p className="text-[var(--color-text-secondary)] mb-6">Professional name and number printing for sports teams and individuals. High-quality materials that last.</p>
                  <Link href="/jersey-printing" className="btn btn-secondary">Start Printing</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section-padding bg-[var(--color-background-alt)] pattern-dots">
        <div className="container-custom">
          <h2 className="section-title">Why Choose ShirtHappenz?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="feature-card animate-fade-in hover-lift">
              <div className="feature-icon mx-auto mb-4">
                <Image 
                  src="https://img.icons8.com/color/48/guarantee.png"
                  alt="Quality Icon"
                  width={24}
                  height={24}
                />
              </div>
              <h3 className="text-xl font-bold mb-2 text-center">Quality Materials</h3>
              <p className="text-[var(--color-text-secondary)] text-center">Premium fabrics and printing techniques that ensure long-lasting results.</p>
            </div>
            <div className="feature-card animate-fade-in hover-lift">
              <div className="feature-icon mx-auto mb-4 bg-[var(--color-secondary)]">
                <Image 
                  src="https://img.icons8.com/color/48/delivery-time.png"
                  alt="Fast Delivery Icon"
                  width={24}
                  height={24}
                />
              </div>
              <h3 className="text-xl font-bold mb-2 text-center">Fast Turnaround</h3>
              <p className="text-[var(--color-text-secondary)] text-center">Quick processing and shipping to get your custom designs to you faster.</p>
            </div>
            <div className="feature-card animate-fade-in hover-lift">
              <div className="feature-icon mx-auto mb-4 bg-[var(--color-accent)]">
                <Image 
                  src="https://img.icons8.com/color/48/design-tool.png"
                  alt="Design Tools Icon"
                  width={24}
                  height={24}
                />
              </div>
              <h3 className="text-xl font-bold mb-2 text-center">Custom Design Tools</h3>
              <p className="text-[var(--color-text-secondary)] text-center">Easy-to-use design interface to bring your ideas to life.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container-custom">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Image 
                  src="https://img.icons8.com/color/96/t-shirt.png" 
                  alt="ShirtHappenz Logo" 
                  width={40} 
                  height={40} 
                  className="hover-lift"
                />
                <span className="text-xl font-bold text-white">ShirtHappenz</span>
              </div>
              <p className="text-white/80">Making your custom shirt dreams come true.</p>
            </div>
            <div>
              <h4 className="footer-title">Quick Links</h4>
              <ul className="space-y-2">
                <li><Link href="/custom-designs" className="footer-link">Custom Designs</Link></li>
                <li><Link href="/jersey-printing" className="footer-link">Jersey Printing</Link></li>
                <li><Link href="/about" className="footer-link">About Us</Link></li>
                <li><Link href="/contact" className="footer-link">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="footer-title">Services</h4>
              <ul className="space-y-2">
                <li><Link href="/custom-designs" className="footer-link">Team Uniforms</Link></li>
                <li><Link href="/jersey-printing" className="footer-link">Name Printing</Link></li>
                <li><Link href="/custom-designs" className="footer-link">Custom Graphics</Link></li>
                <li><Link href="/bulk-orders" className="footer-link">Bulk Orders</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="footer-title">Contact Us</h4>
              <ul className="space-y-2 text-white/80">
                <li className="flex items-center space-x-2">
                  <Image 
                    src="https://img.icons8.com/color/48/mail.png"
                    alt="Email Icon"
                    width={20}
                    height={20}
                  />
                  <span>info@shirthappenz.com</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Image 
                    src="https://img.icons8.com/color/48/phone.png"
                    alt="Phone Icon"
                    width={20}
                    height={20}
                  />
                  <span>(555) 123-4567</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Image 
                    src="https://img.icons8.com/color/48/marker.png"
                    alt="Location Icon"
                    width={20}
                    height={20}
                  />
                  <span>123 Print Street</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 mt-12 pt-8 text-center">
            <p className="text-white/60">&copy; {new Date().getFullYear()} ShirtHappenz. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
