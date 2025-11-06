# Deployment Checklist

## ✅ Current Status
Your site is **mostly ready for deployment**, but you need to configure environment variables in your hosting platform.

## 🔧 Required Environment Variables

You need to set these environment variables in your hosting platform (Vercel, Netlify, Railway, etc.):

### Database
```bash
MONGODB_URI=your_mongodb_connection_string
```
- Get this from MongoDB Atlas or your MongoDB provider
- Format: `mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority`

### Authentication
```bash
NEXTAUTH_SECRET=your_random_secret_key_here
NEXTAUTH_URL=https://yourdomain.com
```
- Generate `NEXTAUTH_SECRET` using: `openssl rand -base64 32`
- Set `NEXTAUTH_URL` to your production domain (e.g., `https://mrshirtpersonalisation.co.uk`)

### Base URL
```bash
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
```
- Should match your production domain

### Stripe (Payment Processing)
```bash
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```
- Get these from your Stripe Dashboard
- Use **LIVE** keys for production (not test keys)
- Webhook secret is created when you set up webhooks in Stripe

### Cloudinary (Image Storage)
```bash
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```
- Get these from your Cloudinary dashboard

### Email Configuration
```bash
EMAIL_SERVER_HOST=smtp.your-email-provider.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your_email@domain.com
EMAIL_SERVER_PASSWORD=your_email_password
EMAIL_FROM=noreply@yourdomain.com
ADMIN_EMAIL=admin@yourdomain.com
```
- Configure based on your email provider (Gmail, SendGrid, AWS SES, etc.)

### Shipping (ShipEngine)
```bash
SHIPENGINE_API_KEY=your_shipengine_api_key
```
- Get from ShipEngine dashboard
- Use production API key (not TEST_ prefix)

## 📋 Pre-Deployment Steps

### 1. Build Test
Run locally to ensure everything builds:
```bash
npm run build
npm start
```

### 2. Database Setup
- Ensure your MongoDB database is accessible from production
- If using MongoDB Atlas, whitelist your hosting platform's IP addresses (or use 0.0.0.0/0 for all)
- Verify all collections and indexes are set up

### 3. Stripe Webhooks
- Set up webhook endpoint in Stripe Dashboard: `https://yourdomain.com/api/webhooks/stripe`
- Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

### 4. Domain Configuration
- Point your domain to your hosting platform
- Ensure SSL/HTTPS is enabled (most platforms do this automatically)

## 🚀 Deployment Platforms

### Vercel (Recommended for Next.js)
1. Connect your GitHub repository
2. Add all environment variables in Settings → Environment Variables
3. Set build command: `npm run build`
4. Set output directory: `.next`
5. Deploy!

### Netlify
1. Connect your GitHub repository
2. Build command: `npm run build`
3. Publish directory: `.next`
4. Add environment variables in Site settings → Environment variables

### Railway / Render
1. Connect your GitHub repository
2. Add environment variables in the dashboard
3. Deploy!

## ⚠️ Important Notes

1. **Never commit `.env.local` to Git** - it should be in `.gitignore`
2. **Use production API keys** - Don't use test/development keys in production
3. **Test in staging first** - Deploy to a staging environment before production
4. **Monitor logs** - Check for errors after deployment
5. **Database backups** - Ensure MongoDB backups are configured

## 🔍 Post-Deployment Checks

After deployment, verify:
- [ ] Site loads correctly
- [ ] User registration/login works
- [ ] Product pages load
- [ ] Shopping cart functions
- [ ] Payment processing works (test with small amount)
- [ ] Email notifications are sent
- [ ] Admin panel is accessible
- [ ] Image uploads work
- [ ] API routes respond correctly

## 🐛 Common Issues

### "MONGODB_URI not defined"
- Add `MONGODB_URI` to your hosting platform's environment variables

### "NEXTAUTH_SECRET not defined"
- Generate a secret and add it to environment variables

### Images not loading
- Check Cloudinary credentials are correct
- Verify image domains in `next.config.js`

### Payment not working
- Ensure Stripe keys are LIVE keys (not test)
- Check webhook endpoint is configured in Stripe

### Email not sending
- Verify email server credentials
- Check if your hosting platform allows SMTP connections
- Some platforms require using a service like SendGrid

## 📝 Additional Configuration

### Custom Domain
If using a custom domain:
1. Add domain in hosting platform settings
2. Update DNS records as instructed
3. Update `NEXTAUTH_URL` and `NEXT_PUBLIC_BASE_URL` to match

### Environment-Specific Settings
The code already handles:
- `NODE_ENV` - Automatically set by hosting platforms
- Secure cookies in production
- Test mode for ShipEngine based on environment

## 🎯 Quick Start Commands

```bash
# Test build locally
npm run build
npm start

# Check for TypeScript errors
npm run lint

# Verify environment variables (create .env.local for local testing)
# Copy this checklist and fill in your values
```

---

**Need Help?** Check your hosting platform's documentation for Next.js deployment guides.

