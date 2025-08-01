# Mr SHIRT PERSONALISATION - Custom Apparel E-commerce

A modern Next.js e-commerce platform for custom apparel and personalized clothing with DTF printing capabilities.

## 🚀 Features

- **Custom Design Tool**: Interactive design interface for apparel customization
- **DTF Printing Support**: Optimized file uploads for Direct-to-Film printing
- **Payment Processing**: Stripe integration for secure payments
- **Order Management**: Complete admin dashboard for order tracking
- **Email Notifications**: Automated order confirmations with PDF invoices
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **SEO Optimized**: Built-in SEO features and meta tags

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Database**: MongoDB with Mongoose
- **Payment**: Stripe
- **Authentication**: NextAuth.js
- **File Storage**: Cloudinary
- **Email**: Nodemailer
- **PDF Generation**: jsPDF

## 📋 Prerequisites

- Node.js 18+ 
- MongoDB database
- Stripe account
- Cloudinary account
- SMTP email service

## 🔧 Environment Variables

Create `.env.local` for development:

```bash
# Database
MONGODB_URI=your_mongodb_connection_string

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# NextAuth
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# Email (SMTP)
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your_email@gmail.com
EMAIL_SERVER_PASSWORD=your_app_password
EMAIL_FROM=your_email@gmail.com
ADMIN_EMAIL=admin@yourdomain.com

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd shirthappenz
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your values
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)**

## 📦 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run cleanup-temp-orders` - Clean up temporary orders

## 🌐 Deployment

### Vercel (Recommended)

1. **Connect your repository to Vercel**
2. **Add environment variables** in Vercel dashboard
3. **Deploy automatically** on push to main branch

### Other Platforms

- **Netlify**: Use `npm run build` and `npm run start`
- **Railway**: Automatic deployment from GitHub
- **DigitalOcean App Platform**: Container deployment

## 🔒 Security Features

- Content Security Policy (CSP)
- XSS Protection
- CSRF Protection
- Rate Limiting
- Input Validation
- Secure Headers

## 📱 PWA Features

- Service Worker support
- Offline capabilities
- App-like experience
- Push notifications (configurable)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, email support@mrshirtpersonalisation.co.uk or create an issue in the repository.
