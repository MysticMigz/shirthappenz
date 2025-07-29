/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'm.media-amazon.com',
      'images-na.ssl-images-amazon.com',
      'media.amazon.com',
      'i.imgur.com',
      'imgur.com',
      'cloudinary.com',
      'res.cloudinary.com',
      'images.unsplash.com',
      'upload.wikimedia.org'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**'
      }
    ]
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(png|jpg|jpeg|gif|svg)$/i,
      type: 'asset/resource'
    });
    return config;
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://www.paypal.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob: https://res.cloudinary.com https://m.media-amazon.com https://images-na.ssl-images-amazon.com https://media.amazon.com https://i.imgur.com https://imgur.com https://cloudinary.com https://images.unsplash.com https://upload.wikimedia.org; connect-src 'self' https://api.stripe.com https://www.paypal.com https://www.google-analytics.com; frame-src https://js.stripe.com https://www.paypal.com; object-src 'none'; base-uri 'self'; form-action 'self';"
          }
        ]
      }
    ];
  }
}

module.exports = nextConfig 