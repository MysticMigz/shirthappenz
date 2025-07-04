import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export async function sendEmail({ to, subject, text, html }: EmailOptions) {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: Number(process.env.EMAIL_SERVER_PORT),
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
    secure: false,
    requireTLS: true,
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    text,
    html,
  });
}

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: Number(process.env.EMAIL_SERVER_PORT),
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
  secure: true,
});

export async function sendLowStockAlert(productName: string, size: string, currentStock: number) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.error('Admin email not configured');
    return;
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: adminEmail,
      subject: `⚠️ Low Stock Alert: ${productName}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Low Stock Alert</h2>
          <p style="font-size: 16px; color: #374151;">
            The following product is running low on stock:
          </p>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-size: 18px; color: #111827;"><strong>${productName}</strong></p>
            <p style="margin: 10px 0; color: #374151;">
              Size: <strong>${size}</strong><br>
              Current Stock: <strong>${currentStock}</strong>
            </p>
          </div>
          <p style="color: #4b5563; font-size: 14px;">
            Please review and restock if necessary.
          </p>
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to send low stock alert:', error);
  }
}

export async function sendPasswordResetEmail(email: string, resetToken: string) {
  try {
    const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}`;

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Reset Your Password',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2>Reset Your Password</h2>
          <p>Click the button below to reset your password:</p>
          <a href="${resetUrl}" style="display: inline-block; background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
            Reset Password
          </a>
          <p style="color: #666; font-size: 14px;">
            If you didn't request this, please ignore this email.
            The link will expire in 1 hour.
          </p>
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    throw error;
  }
}

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  size: string;
  customization?: {
    name?: string;
    number?: string;
    isCustomized: boolean;
  };
}

interface ShippingDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postcode: string;
  shippingMethod: string;
  shippingCost: number;
}

export async function sendOrderConfirmationEmail(
  orderReference: string,
  items: OrderItem[],
  shippingDetails: ShippingDetails,
  total: number
) {
  try {
    const itemsList = items.map(item => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.name}${item.customization?.isCustomized ? 
          `<br><span style="font-size: 14px; color: #6b7280;">Customization: ${item.customization.name || ''} ${item.customization.number || ''}</span>` 
          : ''}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">Size: ${item.size}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">£${(item.price * item.quantity).toFixed(2)}</td>
      </tr>
    `).join('');

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: shippingDetails.email,
      subject: `Order Confirmation - ${orderReference}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1f2937;">Order Confirmation</h2>
          <p style="font-size: 16px; color: #374151;">
            Thank you for your order, ${shippingDetails.firstName}!
          </p>
          <p style="font-size: 16px; color: #374151;">
            Order Reference: <strong>${orderReference}</strong>
          </p>
          
          <div style="margin: 24px 0;">
            <h3 style="color: #1f2937;">Order Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background-color: #f3f4f6;">
                  <th style="padding: 12px; text-align: left;">Item</th>
                  <th style="padding: 12px; text-align: left;">Size</th>
                  <th style="padding: 12px; text-align: left;">Qty</th>
                  <th style="padding: 12px; text-align: left;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemsList}
              </tbody>
            </table>
          </div>

          <div style="margin: 24px 0; padding: 16px; background-color: #f3f4f6; border-radius: 8px;">
            <h3 style="color: #1f2937; margin-bottom: 12px;">Shipping Details</h3>
            <p style="margin: 4px 0; color: #374151;">
              ${shippingDetails.firstName} ${shippingDetails.lastName}<br>
              ${shippingDetails.address}<br>
              ${shippingDetails.city}<br>
              ${shippingDetails.postcode}<br>
              Phone: ${shippingDetails.phone}
            </p>
            <p style="margin: 12px 0 4px; color: #374151;">
              Shipping Method: ${shippingDetails.shippingMethod}
            </p>
          </div>

          <div style="margin: 24px 0;">
            <table style="width: 100%;">
              <tr>
                <td style="padding: 8px 0;">Subtotal:</td>
                <td style="text-align: right;">£${(total - shippingDetails.shippingCost).toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;">Shipping:</td>
                <td style="text-align: right;">£${shippingDetails.shippingCost.toFixed(2)}</td>
              </tr>
              <tr style="font-weight: bold;">
                <td style="padding: 8px 0; border-top: 2px solid #e5e7eb;">Total:</td>
                <td style="text-align: right; border-top: 2px solid #e5e7eb;">£${total.toFixed(2)}</td>
              </tr>
            </table>
          </div>

          <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
            We'll send you another email when your payment is confirmed and your order is being processed.
          </p>
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to send order confirmation email:', error);
  }
}

export async function sendPaymentConfirmationEmail(
  orderReference: string,
  email: string,
  firstName: string
) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `Payment Confirmed - Order ${orderReference}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1f2937;">Payment Confirmed</h2>
          <p style="font-size: 16px; color: #374151;">
            Hi ${firstName},
          </p>
          <p style="font-size: 16px; color: #374151;">
            Great news! We've received your payment for order <strong>${orderReference}</strong>.
          </p>
          <p style="font-size: 16px; color: #374151;">
            We're now processing your order and will send you another email when it's on its way.
          </p>
          <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
            Thank you for shopping with us!
          </p>
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to send payment confirmation email:', error);
  }
} 