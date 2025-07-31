import nodemailer from 'nodemailer';
import { generateCustomerInvoicePDF } from './pdf';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
}

export async function sendEmail({ to, subject, html, attachments }: EmailOptions) {
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
    html,
    attachments,
  });
}

export async function sendLowStockAlert(productName: string, size: string, currentStock: number) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.error('Admin email not configured');
    return;
  }

  try {
    await sendEmail({
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

export async function sendPasswordResetEmail(email: string, resetToken: string, resetUrl: string) {
  try {
    await sendEmail({
      to: email,
      subject: 'Reset Your Password | Mr Shirt Personalisation',
      html: `
        <div style="font-family: Arial, sans-serif; background: #f9fafb; padding: 0; margin: 0;">
          <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px #e5e7eb;">
            <div style="padding: 32px 32px 0 32px; text-align: center;">
              <a href="https://mrshirtpersonalisation.co.uk" target="_blank" rel="noopener noreferrer">
                <img src="https://res.cloudinary.com/dfjgvffou/image/upload/v1753210261/logo_yqmosx.png" alt="Mr Shirt Personalisation Logo" style="max-width: 180px; margin: 0 auto 24px auto; display: block;" />
              </a>
              <h1 style="font-size: 28px; font-weight: bold; color: #1f2937; margin-bottom: 8px;">Reset Your Password</h1>
              <p style="color: #4b5563; font-size: 16px; margin-bottom: 0;">A password reset was requested for your Mr Shirt Personalisation account.</p>
            </div>
            <div style="padding: 0 32px 32px 32px;">
              <p style="font-size: 16px; color: #374151;">Click the button below to reset your password. This link will expire in 1 hour.</p>
              <div style="margin: 32px 0; text-align: center;">
                <a href="${resetUrl}" style="display: inline-block; background: #6366f1; color: #fff; padding: 14px 36px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 18px;">Reset Password</a>
              </div>
              <p style="color: #6b7280; font-size: 14px;">If you did not request this, you can safely ignore this email.</p>
            </div>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    throw error;
  }
}

interface ShippingDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  addressLine2?: string;
  city: string;
  county?: string;
  postcode: string;
  country?: string;
  shippingMethod: string;
  shippingCost: number;
}

interface OrderItem {
  name: string;
  size: string;
  quantity: number;
  price: number;
  customization?: { 
    isCustomized: boolean; 
    name?: string; 
    number?: string;
    frontImage?: string;
    backImage?: string;
  };
}

export async function sendOrderConfirmationEmail(
  orderReference: string,
  items: OrderItem[],
  shippingDetails: ShippingDetails,
  total: number,
  vat?: number,
  createdAt?: string,
  status?: string,
  voucherCode?: string,
  voucherDiscount?: number,
  voucherType?: string,
  voucherValue?: number
) {
  try {
    console.log('[Email] sendOrderConfirmationEmail called for:', shippingDetails.email);
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = shippingDetails.shippingCost;
    const vatIncluded = typeof vat === 'number' ? vat : Number(((subtotal + shipping) * 0.2).toFixed(2));
    const orderStatus = status || 'confirmed';
    const orderDate = createdAt ? new Date(createdAt).toLocaleDateString() : new Date().toLocaleDateString();

    // Generate invoice PDF
    let invoiceAttachment = null;
    try {
      const orderData = {
        _id: orderReference,
        reference: orderReference,
        status: orderStatus,
        total: total,
        vat: vatIncluded,
        items: items,
        shippingDetails: {
          ...shippingDetails,
          county: shippingDetails.county || '',
          country: shippingDetails.country || 'United Kingdom'
        },
        voucherCode: voucherCode,
        voucherDiscount: voucherDiscount,
        voucherType: voucherType,
        voucherValue: voucherValue,
        createdAt: createdAt || new Date().toISOString()
      };

                   const pdfDoc = await generateCustomerInvoicePDF(orderData);
      const pdfBuffer = pdfDoc.output('arraybuffer');
      invoiceAttachment = {
        filename: `Invoice-${orderReference}.pdf`,
        content: Buffer.from(pdfBuffer),
        contentType: 'application/pdf'
      };
      console.log('[Email] Invoice PDF generated successfully');
    } catch (error) {
      console.error('[Email] Failed to generate invoice PDF:', error);
    }
    const itemsList = items.map(item => {
      let customizationInfo = '';
      let imageInfo = '';
      
      if (item.customization?.isCustomized) {
        if (item.customization.name || item.customization.number) {
          customizationInfo = `<div style='color: #6b7280; font-size: 13px;'>Customization: ${item.customization.name || ''} ${item.customization.number || ''}</div>`;
        }
        
        // Add image URLs if they exist
        if (item.customization.frontImage || item.customization.backImage) {
          imageInfo = '<div style="margin-top: 8px; padding: 8px; background-color: #f3f4f6; border-radius: 4px;">';
          if (item.customization.frontImage) {
            imageInfo += `<div style="margin-bottom: 4px;"><strong style="color: #374151; font-size: 12px;">Front Image:</strong><br><a href="${item.customization.frontImage}" target="_blank" style="color: #3b82f6; font-size: 11px; word-break: break-all;">${item.customization.frontImage}</a></div>`;
          }
          if (item.customization.backImage) {
            imageInfo += `<div><strong style="color: #374151; font-size: 12px;">Back Image:</strong><br><a href="${item.customization.backImage}" target="_blank" style="color: #3b82f6; font-size: 11px; word-break: break-all;">${item.customization.backImage}</a></div>`;
          }
          imageInfo += '</div>';
        }
      }
      
      return `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
            <div style='font-weight: bold;'>${item.name}</div>
            <div style='color: #6b7280; font-size: 13px;'>Size: ${item.size}</div>
            <div style='color: #6b7280; font-size: 13px;'>Quantity: ${item.quantity}</div>
            ${customizationInfo}
            ${imageInfo}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold;">£${(item.price * item.quantity).toFixed(2)}</td>
        </tr>
      `;
    }).join('');

    await sendEmail({
      to: shippingDetails.email,
      subject: `Order Confirmation - ${orderReference} | Mr Shirt Personalisation`,
      html: `
        <div style="font-family: Arial, sans-serif; background: #f9fafb; padding: 0; margin: 0;">
          <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px #e5e7eb;">
            <div style="padding: 32px 32px 0 32px; text-align: center;">
              <a href="https://mrshirtpersonalisation.co.uk" target="_blank" rel="noopener noreferrer">
                <img src="https://res.cloudinary.com/dfjgvffou/image/upload/v1753210261/logo_yqmosx.png" alt="Mr Shirt Personalisation Logo" style="max-width: 180px; margin: 0 auto 24px auto; display: block;" />
              </a>
              <h1 style="font-size: 28px; font-weight: bold; color: #1f2937; margin-bottom: 8px;">Thank You for Your Order!</h1>
              <p style="color: #4b5563; font-size: 16px; margin-bottom: 0;">Your order has been <b>${orderStatus}</b></p>
            </div>
            <div style="padding: 0 32px 32px 32px;">
              <h2 style="font-size: 20px; font-weight: 600; color: #1f2937; margin-bottom: 16px;">Order Details</h2>
              <table style="width: 100%; margin-bottom: 24px;">
                <tr>
                  <td style="color: #6b7280;">Order Reference:</td>
                  <td style="font-weight: 500; text-align: right;">${orderReference}</td>
                </tr>
                <tr>
                  <td style="color: #6b7280;">Order Date:</td>
                  <td style="font-weight: 500; text-align: right;">${orderDate}</td>
                </tr>
                <tr>
                  <td style="color: #6b7280;">Status:</td>
                  <td style="font-weight: 500; text-align: right; text-transform: capitalize;">${orderStatus}</td>
                </tr>
                <tr>
                  <td style="color: #6b7280;">Total Amount:</td>
                  <td style="font-weight: 500; text-align: right;">£${total.toFixed(2)}</td>
                </tr>
              </table>
              <h3 style="font-size: 16px; font-weight: 600; color: #1f2937; margin-bottom: 12px;">Shipping Details</h3>
              <table style="width: 100%; margin-bottom: 24px;">
                <tr>
                  <td style="color: #6b7280;">Name:</td>
                  <td style="font-weight: 500; text-align: right;">${shippingDetails.firstName} ${shippingDetails.lastName}</td>
                </tr>
                <tr>
                  <td style="color: #6b7280;">Email:</td>
                  <td style="font-weight: 500; text-align: right;">${shippingDetails.email}</td>
                </tr>
                <tr>
                  <td style="color: #6b7280;">Phone:</td>
                  <td style="font-weight: 500; text-align: right;">${shippingDetails.phone}</td>
                </tr>
                <tr>
                  <td style="color: #6b7280;">Address:</td>
                  <td style="font-weight: 500; text-align: right;">${shippingDetails.address}, ${shippingDetails.city}, ${shippingDetails.county || ''}, ${shippingDetails.postcode}, ${shippingDetails.country}</td>
                </tr>
                <tr>
                  <td style="color: #6b7280;">Shipping Method:</td>
                  <td style="font-weight: 500; text-align: right;">${shippingDetails.shippingMethod}</td>
                </tr>
                <tr>
                  <td style="color: #6b7280;">Shipping Cost:</td>
                  <td style="font-weight: 500; text-align: right;">£${shippingDetails.shippingCost.toFixed(2)}</td>
                </tr>
              </table>
              <h3 style="font-size: 16px; font-weight: 600; color: #1f2937; margin-bottom: 12px;">Items</h3>
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                <tbody>
                  ${itemsList}
                </tbody>
              </table>
              <div style="margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 16px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span style="color: #6b7280;">Subtotal</span>
                  <span style="font-weight: 500;">£${subtotal.toFixed(2)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span style="color: #6b7280;">Shipping (${shippingDetails.shippingMethod})</span>
                  <span style="font-weight: 500;">£${shipping.toFixed(2)}</span>
                </div>
                ${voucherCode && voucherDiscount ? `
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span style="color: #8b5cf6; font-weight: 500;">Discount (${voucherCode})</span>
                  <span style="color: #8b5cf6; font-weight: 500;">-£${(voucherDiscount / 100).toFixed(2)}</span>
                </div>
                ` : ''}
                <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; margin-top: 16px;">
                  <span>Total</span>
                  <span>£${total.toFixed(2)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-top: 8px; font-size: 13px; color: #6b7280; font-style: italic;">
                  <span>Includes VAT (20%)</span>
                  <span>£${vatIncluded.toFixed(2)}</span>
                </div>
              </div>
              <div style="margin-top: 32px; text-align: center;">
                <p style="color: #6b7280; font-size: 14px; margin-bottom: 16px;">
                  📎 Your invoice is attached to this email for your records.
                </p>
                <a href="https://shirthappenz.com/orders" style="display: inline-block; background: #6366f1; color: #fff; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: 600;">View All Orders</a>
              </div>
            </div>
          </div>
        </div>
      `,
      attachments: invoiceAttachment ? [invoiceAttachment] : undefined,
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
    await sendEmail({
      to: email,
      subject: `Payment Confirmed - Order ${orderReference}`,
      html: `
        <div style="font-family: Arial, sans-serif; background: #f9fafb; padding: 0; margin: 0;">
          <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px #e5e7eb;">
            <div style="padding: 32px 32px 0 32px; text-align: center;">
              <a href="https://mrshirtpersonalisation.co.uk" target="_blank" rel="noopener noreferrer">
                <img src="https://res.cloudinary.com/dfjgvffou/image/upload/v1753210261/logo_yqmosx.png" alt="Mr Shirt Personalisation Logo" style="max-width: 180px; margin: 0 auto 24px auto; display: block;" />
              </a>
              <h2 style="color: #1f2937;">Payment Confirmed</h2>
            </div>
            <div style="padding: 0 32px 32px 32px;">
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
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to send payment confirmation email:', error);
  }
}

export async function sendOrderShippedEmail(
  orderReference: string,
  shippingDetails: ShippingDetails & { trackingNumber?: string; courier?: string; estimatedDelivery?: string },
  items: OrderItem[],
  shippedAt?: Date
) {
  try {
    const itemsList = items.map(item => {
      let customizationInfo = '';
      let imageInfo = '';
      
      if (item.customization?.isCustomized) {
        if (item.customization.name || item.customization.number) {
          customizationInfo = `<div style='color: #6b7280; font-size: 13px;'>Customization: ${item.customization.name || ''} ${item.customization.number || ''}</div>`;
        }
        
        // Add image URLs if they exist
        if (item.customization.frontImage || item.customization.backImage) {
          imageInfo = '<div style="margin-top: 8px; padding: 8px; background-color: #f3f4f6; border-radius: 4px;">';
          if (item.customization.frontImage) {
            imageInfo += `<div style="margin-bottom: 4px;"><strong style="color: #374151; font-size: 12px;">Front Image:</strong><br><a href="${item.customization.frontImage}" target="_blank" style="color: #3b82f6; font-size: 11px; word-break: break-all;">${item.customization.frontImage}</a></div>`;
          }
          if (item.customization.backImage) {
            imageInfo += `<div><strong style="color: #374151; font-size: 12px;">Back Image:</strong><br><a href="${item.customization.backImage}" target="_blank" style="color: #3b82f6; font-size: 11px; word-break: break-all;">${item.customization.backImage}</a></div>`;
          }
          imageInfo += '</div>';
        }
      }
      
      return `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
            <div style='font-weight: bold;'>${item.name}</div>
            <div style='color: #6b7280; font-size: 13px;'>Size: ${item.size}</div>
            <div style='color: #6b7280; font-size: 13px;'>Quantity: ${item.quantity}</div>
            ${customizationInfo}
            ${imageInfo}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold;">£${(item.price * item.quantity).toFixed(2)}</td>
        </tr>
      `;
    }).join('');
    await sendEmail({
      to: shippingDetails.email,
      subject: `Your Order Has Shipped! - ${orderReference} | Mr Shirt Personalisation`,
      html: `
        <div style="font-family: Arial, sans-serif; background: #f9fafb; padding: 0; margin: 0;">
          <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px #e5e7eb;">
            <div style="padding: 32px 32px 0 32px; text-align: center;">
              <a href="https://mrshirtpersonalisation.co.uk" target="_blank" rel="noopener noreferrer">
                <img src="https://res.cloudinary.com/dfjgvffou/image/upload/v1753210261/logo_yqmosx.png" alt="Mr Shirt Personalisation Logo" style="max-width: 180px; margin: 0 auto 24px auto; display: block;" />
              </a>
              <h1 style="font-size: 28px; font-weight: bold; color: #1f2937; margin-bottom: 8px;">Your Order Has Shipped!</h1>
              <p style="color: #4b5563; font-size: 16px; margin-bottom: 0;">Order <b>${orderReference}</b> is on its way.</p>
            </div>
            <div style="padding: 0 32px 32px 32px;">
              <h2 style="font-size: 20px; font-weight: 600; color: #1f2937; margin-bottom: 16px;">Shipping Details</h2>
              <table style="width: 100%; margin-bottom: 24px;">
                <tr>
                  <td style="color: #6b7280;">Courier:</td>
                  <td style="font-weight: 500; text-align: right;">${shippingDetails.courier || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="color: #6b7280;">Tracking Number:</td>
                  <td style="font-weight: 500; text-align: right;">${shippingDetails.trackingNumber || 'N/A'}</td>
                </tr>
                ${shippingDetails.estimatedDelivery ? `<tr><td style='color: #6b7280;'>Estimated Delivery:</td><td style='font-weight: 500; text-align: right;'>${shippingDetails.estimatedDelivery}</td></tr>` : ''}
                <tr>
                  <td style="color: #6b7280;">Shipped At:</td>
                  <td style="font-weight: 500; text-align: right;">${shippedAt ? new Date(shippedAt).toLocaleString() : 'N/A'}</td>
                </tr>
              </table>
              <h3 style="font-size: 16px; font-weight: 600; color: #1f2937; margin-bottom: 12px;">Items in Your Order</h3>
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                <tbody>
                  ${itemsList}
                </tbody>
              </table>
              <div style="margin-top: 32px; text-align: center;">
                <a href="https://shirthappenz.com/orders" style="display: inline-block; background: #6366f1; color: #fff; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: 600;">View Your Order Status</a>
              </div>
            </div>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to send order shipped email:', error);
  }
}

export async function sendOrderCancellationEmail(
  orderReference: string,
  shippingDetails: ShippingDetails,
  items: OrderItem[],
  total: number,
  reason: string,
  notes?: string,
  voucherCode?: string,
  voucherDiscount?: number,
  voucherType?: string,
  voucherValue?: number
) {
  try {
    const itemsList = items.map(item => {
      let customizationInfo = '';
      let imageInfo = '';
      
      if (item.customization?.isCustomized) {
        if (item.customization.name || item.customization.number) {
          customizationInfo = ` | Custom: ${item.customization.name || ''} ${item.customization.number || ''}`;
        }
        
        // Add image URLs if they exist
        if (item.customization.frontImage || item.customization.backImage) {
          imageInfo = '<div style="margin-top: 8px; padding: 8px; background-color: #f3f4f6; border-radius: 4px;">';
          if (item.customization.frontImage) {
            imageInfo += `<div style="margin-bottom: 4px;"><strong style="color: #374151; font-size: 12px;">Front Image:</strong><br><a href="${item.customization.frontImage}" target="_blank" style="color: #3b82f6; font-size: 11px; word-break: break-all;">${item.customization.frontImage}</a></div>`;
          }
          if (item.customization.backImage) {
            imageInfo += `<div><strong style="color: #374151; font-size: 12px;">Back Image:</strong><br><a href="${item.customization.backImage}" target="_blank" style="color: #3b82f6; font-size: 11px; word-break: break-all;">${item.customization.backImage}</a></div>`;
          }
          imageInfo += '</div>';
        }
      }
      
      return `
        <div style="border-bottom: 1px solid #e5e7eb; padding: 12px 0;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div style="flex: 1;">
              <p style="margin: 0; font-weight: 600; color: #111827;">${item.name}</p>
              <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 14px;">
                Size: ${item.size} | Qty: ${item.quantity}
                ${customizationInfo}
              </p>
              ${imageInfo}
            </div>
            <p style="margin: 0; font-weight: 600; color: #111827;">£${item.price.toFixed(2)}</p>
          </div>
        </div>
      `;
    }).join('');

    await sendEmail({
      to: shippingDetails.email,
      subject: `Order Cancelled - ${orderReference} | Mr Shirt Personalisation`,
      html: `
        <div style="font-family: Arial, sans-serif; background: #f9fafb; padding: 0; margin: 0;">
          <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px #e5e7eb;">
            <div style="padding: 32px 32px 0 32px; text-align: center;">
              <a href="https://mrshirtpersonalisation.co.uk" target="_blank" rel="noopener noreferrer">
                <img src="https://res.cloudinary.com/dfjgvffou/image/upload/v1753210261/logo_yqmosx.png" alt="Mr Shirt Personalisation Logo" style="max-width: 180px; margin: 0 auto 24px auto; display: block;" />
              </a>
              <h1 style="font-size: 28px; font-weight: bold; color: #dc2626; margin-bottom: 8px;">Order Cancelled</h1>
              <p style="color: #4b5563; font-size: 16px; margin-bottom: 0;">Your order has been successfully cancelled.</p>
            </div>
            <div style="padding: 0 32px 32px 32px;">
              <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h2 style="color: #dc2626; margin: 0 0 12px 0; font-size: 18px;">Order Details</h2>
                <p style="margin: 0 0 8px 0; color: #374151;"><strong>Order Reference:</strong> ${orderReference}</p>
                <p style="margin: 0 0 8px 0; color: #374151;"><strong>Cancellation Reason:</strong> ${reason}</p>
                ${notes ? `<p style="margin: 0 0 8px 0; color: #374151;"><strong>Additional Notes:</strong> ${notes}</p>` : ''}
                <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 14px;">Cancelled on ${new Date().toLocaleDateString('en-GB')}</p>
              </div>
              
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="margin: 0 0 16px 0; color: #111827; font-size: 16px;">Cancelled Items</h3>
                ${itemsList}
                <div style="border-top: 2px solid #e5e7eb; padding-top: 12px; margin-top: 12px;">
                  ${voucherCode && voucherDiscount ? `
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <p style="margin: 0; color: #8b5cf6; font-weight: 500;">Discount (${voucherCode})</p>
                    <p style="margin: 0; color: #8b5cf6; font-weight: 500;">-£${(voucherDiscount / 100).toFixed(2)}</p>
                  </div>
                  ` : ''}
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <p style="margin: 0; font-weight: 600; color: #111827;">Total</p>
                    <p style="margin: 0; font-weight: 600; color: #111827;">£${total.toFixed(2)}</p>
                  </div>
                </div>
              </div>
              
              <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="margin: 0 0 12px 0; color: #0369a1; font-size: 16px;">Refund Information</h3>
                <p style="margin: 0; color: #374151; font-size: 14px;">
                  A full refund will be processed within 5-10 working days. The refund will be credited to your original payment method.
                </p>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
                If you have any questions about this cancellation, please contact us at customer.service@mrshirtpersonalisation.com
              </p>
            </div>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to send order cancellation email:', error);
    throw error;
  }
}

export async function sendRefundConfirmationEmail(
  orderReference: string,
  shippingDetails: ShippingDetails,
  items: OrderItem[],
  refundAmount: number,
  reason: string,
  notes?: string,
  voucherCode?: string,
  voucherDiscount?: number,
  voucherType?: string,
  voucherValue?: number
) {
  try {
    const itemsList = items.map(item => {
      let customizationInfo = '';
      let imageInfo = '';
      
      if (item.customization?.isCustomized) {
        if (item.customization.name || item.customization.number) {
          customizationInfo = ` | Custom: ${item.customization.name || ''} ${item.customization.number || ''}`;
        }
        
        // Add image URLs if they exist
        if (item.customization.frontImage || item.customization.backImage) {
          imageInfo = '<div style="margin-top: 8px; padding: 8px; background-color: #f3f4f6; border-radius: 4px;">';
          if (item.customization.frontImage) {
            imageInfo += `<div style="margin-bottom: 4px;"><strong style="color: #374151; font-size: 12px;">Front Image:</strong><br><a href="${item.customization.frontImage}" target="_blank" style="color: #3b82f6; font-size: 11px; word-break: break-all;">${item.customization.frontImage}</a></div>`;
          }
          if (item.customization.backImage) {
            imageInfo += `<div><strong style="color: #374151; font-size: 12px;">Back Image:</strong><br><a href="${item.customization.backImage}" target="_blank" style="color: #3b82f6; font-size: 11px; word-break: break-all;">${item.customization.backImage}</a></div>`;
          }
          imageInfo += '</div>';
        }
      }
      
      return `
        <div style="border-bottom: 1px solid #e5e7eb; padding: 12px 0;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div style="flex: 1;">
              <p style="margin: 0; font-weight: 600; color: #111827;">${item.name}</p>
              <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 14px;">
                Size: ${item.size} | Qty: ${item.quantity}
                ${customizationInfo}
              </p>
              ${imageInfo}
            </div>
            <p style="margin: 0; font-weight: 600; color: #111827;">£${item.price.toFixed(2)}</p>
          </div>
        </div>
      `;
    }).join('');

    await sendEmail({
      to: shippingDetails.email,
      subject: `Refund Processed - ${orderReference} | Mr Shirt Personalisation`,
      html: `
        <div style="font-family: Arial, sans-serif; background: #f9fafb; padding: 0; margin: 0;">
          <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px #e5e7eb;">
            <div style="padding: 32px 32px 0 32px; text-align: center;">
              <a href="https://mrshirtpersonalisation.co.uk" target="_blank" rel="noopener noreferrer">
                <img src="https://res.cloudinary.com/dfjgvffou/image/upload/v1753210261/logo_yqmosx.png" alt="Mr Shirt Personalisation Logo" style="max-width: 180px; margin: 0 auto 24px auto; display: block;" />
              </a>
              <h1 style="font-size: 28px; font-weight: bold; color: #059669; margin-bottom: 8px;">Refund Processed</h1>
              <p style="color: #4b5563; font-size: 16px; margin-bottom: 0;">Your refund has been successfully processed.</p>
            </div>
            <div style="padding: 0 32px 32px 32px;">
              <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h2 style="color: #059669; margin: 0 0 12px 0; font-size: 18px;">Refund Details</h2>
                <p style="margin: 0 0 8px 0; color: #374151;"><strong>Order Reference:</strong> ${orderReference}</p>
                <p style="margin: 0 0 8px 0; color: #374151;"><strong>Refund Amount:</strong> £${refundAmount.toFixed(2)}</p>
                <p style="margin: 0 0 8px 0; color: #374151;"><strong>Reason:</strong> ${reason}</p>
                ${notes ? `<p style="margin: 0 0 8px 0; color: #374151;"><strong>Notes:</strong> ${notes}</p>` : ''}
                <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 14px;">Refunded on ${new Date().toLocaleDateString('en-GB')}</p>
              </div>
              
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="margin: 0 0 16px 0; color: #111827; font-size: 16px;">Refunded Items</h3>
                ${itemsList}
                <div style="border-top: 2px solid #e5e7eb; padding-top: 12px; margin-top: 12px;">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <p style="margin: 0; font-weight: 600; color: #111827;">Refund Amount</p>
                    <p style="margin: 0; font-weight: 600; color: #059669;">£${refundAmount.toFixed(2)}</p>
                  </div>
                </div>
              </div>
              
              <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="margin: 0 0 12px 0; color: #0369a1; font-size: 16px;">Refund Timeline</h3>
                <p style="margin: 0; color: #374151; font-size: 14px;">
                  The refund will appear in your account within 5-10 working days, depending on your bank or card issuer.
                </p>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
                If you have any questions about this refund, please contact us at customer.service@mrshirtpersonalisation.com
              </p>
            </div>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to send refund confirmation email:', error);
    throw error;
  }
}

export async function sendRegistrationConfirmationEmail(email: string, firstName: string) {
  try {
    await sendEmail({
      to: email,
      subject: 'Welcome to Mr Shirt Personalisation! Your Registration is Successful',
      html: `
        <div style="font-family: Arial, sans-serif; background: #f9fafb; padding: 0; margin: 0;">
          <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px #e5e7eb;">
            <div style="padding: 32px 32px 0 32px; text-align: center;">
              <a href="https://mrshirtpersonalisation.co.uk" target="_blank" rel="noopener noreferrer">
                <img src="https://res.cloudinary.com/dfjgvffou/image/upload/v1753210261/logo_yqmosx.png" alt="Mr Shirt Personalisation Logo" style="max-width: 180px; margin: 0 auto 24px auto; display: block;" />
              </a>
              <h1 style="font-size: 28px; font-weight: bold; color: #1f2937; margin-bottom: 8px;">Welcome to Mr Shirt Personalisation!</h1>
              <p style="color: #4b5563; font-size: 16px; margin-bottom: 0;">Hi ${firstName}, your registration was successful.</p>
            </div>
            <div style="padding: 0 32px 32px 32px;">
              <p style="font-size: 16px; color: #374151;">We're excited to have you on board. You can now log in and start customizing your apparel!</p>
              <div style="margin-top: 32px; text-align: center;">
                <a href="https://shirthappenz.com/auth/login" style="display: inline-block; background: #6366f1; color: #fff; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: 600;">Log In to Your Account</a>
              </div>
            </div>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to send registration confirmation email:', error);
  }
} 