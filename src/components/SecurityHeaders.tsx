'use client';

import Head from 'next/head';

interface SecurityHeadersProps {
  title?: string;
  description?: string;
}

export default function SecurityHeaders({ 
  title = 'Mr SHIRT PERSONALISATION', 
  description = 'Custom apparel and personalised clothing' 
}: SecurityHeadersProps) {
  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      
      {/* Security Meta Tags */}
      <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
      <meta httpEquiv="X-Frame-Options" content="DENY" />
      <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
      <meta name="referrer" content="origin-when-cross-origin" />
      
      {/* Prevent MIME type sniffing */}
      <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
      
      {/* Disable automatic downloads */}
      <meta httpEquiv="X-Download-Options" content="noopen" />
      
      {/* Prevent clickjacking */}
      <meta httpEquiv="X-Frame-Options" content="DENY" />
      
      {/* XSS Protection */}
      <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
      
      {/* Content Security Policy */}
      <meta httpEquiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://www.paypal.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://api.stripe.com https://www.paypal.com; frame-src https://js.stripe.com https://www.paypal.com; object-src 'none'; base-uri 'self'; form-action 'self';" />
      
      {/* Feature Policy */}
      <meta httpEquiv="Feature-Policy" content="camera 'none'; microphone 'none'; geolocation 'none'" />
      
      {/* Permissions Policy */}
      <meta httpEquiv="Permissions-Policy" content="camera=(), microphone=(), geolocation=()" />
      
      {/* Viewport settings */}
      <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
      
      {/* Prevent indexing of sensitive pages */}
      <meta name="robots" content="noindex, nofollow" />
      
      {/* DNS Prefetch for external domains */}
      <link rel="dns-prefetch" href="//js.stripe.com" />
      <link rel="dns-prefetch" href="//www.paypal.com" />
      <link rel="dns-prefetch" href="//res.cloudinary.com" />
      
      {/* Preconnect to external domains */}
      <link rel="preconnect" href="https://js.stripe.com" />
      <link rel="preconnect" href="https://www.paypal.com" />
      <link rel="preconnect" href="https://res.cloudinary.com" />
    </Head>
  );
} 