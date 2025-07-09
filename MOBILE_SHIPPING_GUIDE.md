# 📱 Mobile Shipping Station Guide

## Overview
This guide explains how to set up and use the mobile shipping system for scanning barcodes and marking orders as shipped with Royal Mail, Evri, and other couriers.

## 🚀 Quick Setup

### 1. Run Database Updates
First, update your existing orders with the new shipping fields:

```bash
# Update production fields
node scripts/update-orders-production.js

# Update shipping fields
node scripts/update-orders-shipping.js
```

### 2. Access the Shipping Station
Navigate to `/admin/shipping` in your browser on your mobile device.

## 📱 Mobile Usage

### Method 1: Direct Mobile Access
1. **Open your browser** on your phone
2. **Navigate to** `https://yourdomain.com/admin/shipping`
3. **Login** with your admin credentials
4. **Start scanning** orders

### Method 2: Add to Home Screen (PWA)
1. **Open** the shipping page on your phone
2. **Add to Home Screen** (iOS: Share button → Add to Home Screen, Android: Menu → Add to Home Screen)
3. **Use like a native app**

## 🔍 How to Use

### Scanning Orders
1. **Click "Scan Barcode"** button
2. **Point camera** at the order reference barcode
3. **Select courier** (Royal Mail, Evri, etc.)
4. **Enter tracking number** (or scan it)
5. **Add notes** (optional)
6. **Click "Mark as Shipped"**

### Manual Entry
1. **Search** for order by reference or customer name
2. **Click** on the order to select it
3. **Fill in** tracking details
4. **Mark as shipped**

## 🏷️ Barcode Types Supported

### Order Reference Barcodes
- **Format**: `SH-YYMMDD-XXXX` (e.g., `SH-241201-0001`)
- **Purpose**: Identify the order to ship
- **Location**: Printed on order labels/packaging

### Tracking Number Barcodes
- **Royal Mail**: Various formats (e.g., `RM123456789GB`)
- **Evri**: Various formats (e.g., `EVRI123456789`)
- **DPD**: Various formats
- **Other couriers**: Standard tracking formats

## 🎯 Workflow

### Step 1: Prepare Orders
1. **Print order labels** with reference barcodes
2. **Package orders** and attach labels
3. **Move to "Ready to Ship"** in production dashboard

### Step 2: Shipping Process
1. **Scan order reference** barcode
2. **Select courier** from the list
3. **Scan tracking number** barcode (or enter manually)
4. **Add any notes** (special handling, etc.)
5. **Mark as shipped**

### Step 3: Confirmation
- **Order status** automatically updates to "shipped"
- **Production status** updates to "completed"
- **Tracking information** is saved
- **Customer notification** can be sent (if implemented)

## 📊 Supported Couriers

| Courier | Color | Tracking Format |
|---------|-------|-----------------|
| Royal Mail | Red | RM + 9 digits + GB |
| Evri | Purple | Various formats |
| DPD | Yellow | Various formats |
| DHL | Orange | Various formats |
| FedEx | Blue | Various formats |
| UPS | Brown | Various formats |

## 🔧 Technical Implementation

### Barcode Scanner
The system includes a basic barcode scanner component that:
- **Uses device camera** for scanning
- **Supports manual entry** as fallback
- **Works on mobile browsers**
- **Handles common barcode formats**

### API Endpoints
- `POST /api/admin/orders/[id]/ship` - Mark order as shipped
- **Required fields**: `trackingNumber`, `courier`
- **Optional fields**: `notes`, `estimatedDelivery`

### Database Fields
```javascript
shippingDetails: {
  trackingNumber: String,
  courier: String,
  estimatedDelivery: String,
  shippedAt: Date
}
```

## 🛠️ Advanced Setup

### For Better Barcode Scanning
Consider integrating these libraries for improved scanning:

```bash
# Install barcode scanning library
npm install quagga
# or
npm install @zxing/library
```

### Custom Barcode Scanner Implementation
```javascript
// Example with QuaggaJS
import Quagga from 'quagga';

Quagga.init({
  inputStream: {
    name: "Live",
    type: "LiveStream",
    target: "#interactive",
    constraints: {
      facingMode: "environment"
    },
  },
  decoder: {
    readers: ["code_128_reader", "ean_reader", "ean_8_reader", "code_39_reader"]
  }
}, function(err) {
  if (err) {
    console.log(err);
    return;
  }
  Quagga.start();
});

Quagga.onDetected(function(result) {
  const code = result.codeResult.code;
  onScan(code);
});
```

## 📱 Mobile Optimization Tips

### 1. Responsive Design
- **Touch-friendly buttons** (minimum 44px)
- **Large input fields** for easy typing
- **Clear visual hierarchy**

### 2. Performance
- **Optimize images** for mobile
- **Minimize network requests**
- **Use local storage** for offline capability

### 3. User Experience
- **Haptic feedback** for successful scans
- **Audio confirmation** for actions
- **Clear error messages**

## 🔒 Security Considerations

### Authentication
- **Admin-only access** required
- **Session management** for mobile
- **Secure API endpoints**

### Data Protection
- **HTTPS required** for production
- **Input validation** on all fields
- **Rate limiting** on API calls

## 🚨 Troubleshooting

### Common Issues

**Camera not working:**
- Check browser permissions
- Try refreshing the page
- Use manual entry as fallback

**Barcode not scanning:**
- Ensure good lighting
- Hold steady for 2-3 seconds
- Try different angles

**Orders not showing:**
- Check production status is "ready_to_ship"
- Verify admin permissions
- Clear browser cache

### Support
For technical issues:
1. Check browser console for errors
2. Verify database connection
3. Test API endpoints directly
4. Check network connectivity

## 📈 Future Enhancements

### Planned Features
- **Offline mode** for poor connectivity
- **Batch shipping** for multiple orders
- **Voice commands** for hands-free operation
- **Integration** with courier APIs
- **Automatic tracking** updates

### Customization
- **Custom courier logos**
- **Branded shipping labels**
- **Custom barcode formats**
- **Multi-language support**

---

## 🎉 Quick Start Checklist

- [ ] Run database update scripts
- [ ] Test on mobile device
- [ ] Print order reference barcodes
- [ ] Train staff on workflow
- [ ] Set up courier accounts
- [ ] Test with sample orders
- [ ] Go live with real orders

**Happy Shipping! 🚚📦** 