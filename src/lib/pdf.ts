import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

interface Supply {
  _id: string;
  name: string;
  description?: string;
  image?: string;
  price: number;
  unit: string;
  category: string;
  minimumOrderQuantity: number;
  supplier: {
    name: string;
    contactInfo?: string;
    website?: string;
  };
}

interface OrderItem {
  supply: Supply;
  quantity: number;
  priceAtOrder: number;
  notes?: string;
}

interface SupplyOrder {
  _id: string;
  reference: string;
  items: OrderItem[];
  status: 'draft' | 'pending' | 'ordered' | 'received' | 'cancelled';
  totalAmount: number;
  orderedBy: string;
  orderedAt?: Date;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface CustomerOrderItem {
  name: string;
  size: string;
  quantity: number;
  price: number;
  color?: string;
  image?: string;
  baseProductName?: string;
  baseProductImage?: string;
  customization?: {
    name?: string;
    number?: string;
    isCustomized?: boolean;
    frontImage?: string;
    backImage?: string;
  };
}

interface CustomerShippingDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  addressLine2?: string;
  city: string;
  county: string;
  postcode: string;
  country: string;
  shippingMethod: string;
  shippingCost: number;
}

interface CustomerOrder {
  _id: string;
  reference: string;
  status: string;
  total: number;
  vat: number;
  items: CustomerOrderItem[];
  shippingDetails: CustomerShippingDetails;
  voucherCode?: string;
  voucherDiscount?: number;
  voucherType?: string;
  voucherValue?: number;
  createdAt: string;
}

export const generateSupplyOrderPDF = (order: SupplyOrder) => {
  try {
    console.log('Generating PDF for order:', JSON.stringify(order, null, 2));

    if (!order || !order.items || !Array.isArray(order.items)) {
      throw new Error('Invalid order data structure');
    }

    // Create new PDF document
    const doc = new jsPDF();
    
    // Add company logo/header
    doc.setFontSize(20);
    doc.text('ShirtHappenz', 20, 20);
    
    // Add order details
    doc.setFontSize(12);
    doc.text(`Order Reference: ${order.reference}`, 20, 35);
    doc.text(`Date: ${format(new Date(order.createdAt), 'dd/MM/yyyy')}`, 20, 42);
    doc.text(`Status: ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}`, 20, 49);
    doc.text(`Ordered By: ${order.orderedBy}`, 20, 56);

    // Group items by supplier
    const itemsBySupplier: { [key: string]: OrderItem[] } = {};
    order.items.forEach(item => {
      if (!item.supply || !item.supply.supplier || !item.supply.supplier.name) {
        console.error('Invalid item structure:', item);
        throw new Error('Invalid item structure - missing supplier information');
      }
      const supplierName = item.supply.supplier.name;
      if (!itemsBySupplier[supplierName]) {
        itemsBySupplier[supplierName] = [];
      }
      itemsBySupplier[supplierName].push(item);
    });

    let yPosition = 70;

    // Create tables for each supplier
    Object.entries(itemsBySupplier).forEach(([supplierName, items]) => {
      // Add supplier header
      doc.setFontSize(14);
      doc.text(`Supplier: ${supplierName}`, 20, yPosition);
      yPosition += 10; // Increased spacing after supplier name

      // Add supplier website if available with proper wrapping
      const supplierWebsite = items[0].supply.supplier.website;
      if (supplierWebsite) {
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 255); // Blue color for the link
        
        // Split long website URL if needed
        const maxWidth = doc.internal.pageSize.width - 40; // 20px margin on each side
        const websiteText = `Website: ${supplierWebsite}`;
        const splitWebsite = doc.splitTextToSize(websiteText, maxWidth);
        
        doc.text(splitWebsite, 20, yPosition);
        // Add clickable link that matches the text width
        doc.link(20, yPosition - 5, doc.getTextWidth(splitWebsite[0]), 8, { 
          url: supplierWebsite.startsWith('http') ? supplierWebsite : `https://${supplierWebsite}` 
        });
        
        doc.setTextColor(0, 0, 0); // Reset to black
        yPosition += 15; // Increased spacing after website link
      }

      // Create table
      const tableData = items.map(item => {
        const website = item.supply.supplier.website;
        return [
          item.supply.name,
          `${item.quantity}`,
          item.supply.unit,
          `£${item.priceAtOrder.toFixed(2)}`,
          `£${(item.priceAtOrder * item.quantity).toFixed(2)}`,
          website ? 'View Product' : '', // Removed emoji to fix formatting
          item.notes || ''
        ];
      });

      // Add table
      autoTable(doc, {
        startY: yPosition + 5, // Added extra spacing before table
        head: [['Item', 'Qty', 'Unit', 'Price', 'Subtotal', 'Link', 'Notes']],
        body: tableData,
        margin: { left: 20, right: 20 },
        columnStyles: {
          0: { cellWidth: 70, fontStyle: 'normal', fontSize: 9 }, // Product name
          1: { cellWidth: 12, halign: 'center' }, // Quantity
          2: { cellWidth: 12, halign: 'center' }, // Unit
          3: { cellWidth: 18, halign: 'right' }, // Price
          4: { cellWidth: 18, halign: 'right' }, // Subtotal
          5: { cellWidth: 25, halign: 'center', textColor: [0, 0, 255], fontStyle: 'normal' }, // Link
          6: { cellWidth: 25, fontSize: 8 } // Notes
        },
        styles: {
          fontSize: 10,
          cellPadding: 3,
          overflow: 'linebreak',
          lineWidth: 0.1,
          minCellHeight: 10
        },
        headStyles: {
          fillColor: [41, 128, 185],
          fontSize: 10,
          fontStyle: 'bold',
          halign: 'center',
          textColor: [255, 255, 255]
        },
        didDrawCell: function(data) {
          // Add clickable links in the Link column
          if (data.column.index === 5 && data.cell.text[0]) {
            const item = items[data.row.index];
            if (item && item.supply.supplier.website) {
              const website = item.supply.supplier.website;
              const url = website.startsWith('http') ? website : `https://${website}`;
              doc.link(
                data.cell.x, 
                data.cell.y, 
                data.cell.width, 
                data.cell.height, 
                { url }
              );
            }
          }
        },
        willDrawCell: function(data) {
          // Set text color for the link column
          if (data.column.index === 5 && data.cell.text[0]) {
            doc.setTextColor(0, 0, 255); // Blue for links
          } else {
            doc.setTextColor(0, 0, 0); // Black for other text
          }
        }
      });

      // Get the final Y position after the table
      const finalY = (doc as any).lastAutoTable.finalY;
      yPosition = finalY + 10; // Reduced spacing

      // Add supplier subtotal with less spacing
      const supplierTotal = items.reduce((total, item) => total + (item.priceAtOrder * item.quantity), 0);
      doc.setFontSize(10);
      doc.text(`Supplier Subtotal: £${supplierTotal.toFixed(2)}`, 20, yPosition);
      yPosition += 15; // Reduced spacing
    });

    // Add total with less spacing
    doc.setFontSize(12);
    doc.text(`Total Order Amount: £${order.totalAmount.toFixed(2)}`, 20, yPosition);

    // Add order notes if any with optimized spacing
    if (order.notes) {
      yPosition += 15;
      doc.setFontSize(10);
      doc.text('Order Notes:', 20, yPosition);
      yPosition += 5;
      
      // Split long notes into multiple lines
      const splitNotes = doc.splitTextToSize(order.notes, doc.internal.pageSize.width - 40);
      doc.text(splitNotes, 20, yPosition);
    }

    // Add footer with adjusted positioning
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 8,
        { align: 'center' }
      );
    }

    console.log('PDF generation completed successfully');
    return doc;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}; 

export const generateCustomerInvoicePDF = async (order: CustomerOrder) => {
  try {
    console.log('Generating customer invoice PDF for order:', order.reference);

    if (!order || !order.items || !Array.isArray(order.items)) {
      throw new Error('Invalid order data structure');
    }

    // Create new PDF document
    const doc = new jsPDF();
    
    // Add company logo
    const logoUrl = 'https://res.cloudinary.com/dfjgvffou/image/upload/v1753210261/logo_yqmosx.png';
    try {
      // Fetch logo image from URL
      const response = await fetch(logoUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch logo: ${response.status}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      const dataUrl = `data:image/png;base64,${base64}`;
      
      // Add logo to PDF (positioned at top left)
      doc.addImage(dataUrl, 'PNG', 20, 15, 40, 20);
      
      // Add company name next to logo
      doc.setFontSize(18);
      doc.setTextColor(99, 102, 241); // Indigo color
      doc.text('MR SHIRT PERSONALISATION', 70, 30);
    } catch (logoError) {
      console.warn('Failed to load logo, using text only:', logoError);
      // Fallback to text only if logo fails to load
      doc.setFontSize(18);
      doc.setTextColor(99, 102, 241); // Indigo color
      doc.text('MR SHIRT PERSONALISATION', 20, 30);
    }
    
    // Add company details
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128); // Gray color
    doc.text('https://mrshirtpersonalisation.co.uk', 20, 45);
    doc.text('customer.service@mrshirtpersonalisation.com', 20, 50);
    
    // Add invoice title
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.text('INVOICE', 20, 75);
    
    // Add invoice details on the right
    doc.setFontSize(10);
    doc.text(`Invoice Number: ${order.reference}`, 120, 25);
    doc.text(`Date: ${format(new Date(order.createdAt), 'dd/MM/yyyy')}`, 120, 30);
    doc.text(`Status: ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}`, 120, 35);
    
    // Add customer details
    doc.setFontSize(12);
    doc.text('Bill To:', 20, 90);
    doc.setFontSize(10);
    doc.text(`${order.shippingDetails.firstName} ${order.shippingDetails.lastName}`, 20, 100);
    doc.text(order.shippingDetails.email, 20, 105);
    doc.text(order.shippingDetails.phone, 20, 110);
    doc.text(order.shippingDetails.address, 20, 115);
    if (order.shippingDetails.addressLine2) {
      doc.text(order.shippingDetails.addressLine2, 20, 120);
    }
    doc.text(`${order.shippingDetails.city}, ${order.shippingDetails.county}`, 20, 125);
    doc.text(order.shippingDetails.postcode, 20, 130);
    doc.text(order.shippingDetails.country, 20, 135);
    
    // Add shipping details
    doc.setFontSize(12);
    doc.text('Ship To:', 120, 90);
    doc.setFontSize(10);
    doc.text(`${order.shippingDetails.firstName} ${order.shippingDetails.lastName}`, 120, 100);
    doc.text(order.shippingDetails.address, 120, 105);
    if (order.shippingDetails.addressLine2) {
      doc.text(order.shippingDetails.addressLine2, 120, 110);
    }
    doc.text(`${order.shippingDetails.city}, ${order.shippingDetails.county}`, 120, 115);
    doc.text(order.shippingDetails.postcode, 120, 120);
    doc.text(order.shippingDetails.country, 120, 125);
    doc.text(`Shipping: ${order.shippingDetails.shippingMethod}`, 120, 135);

    let yPosition = 150;

    // Create items table
    const tableData = order.items.map(item => {
      let itemName = item.name;
      if (item.baseProductName) {
        itemName += ` (${item.baseProductName})`;
      }
      if (item.customization?.isCustomized) {
        itemName += ' - Customized';
        if (item.customization.name || item.customization.number) {
          itemName += ` (${item.customization.name || ''} ${item.customization.number || ''})`;
        }
      }
      
      return [
        itemName,
        item.size,
        item.quantity.toString(),
        `£${item.price.toFixed(2)}`,
        `£${(item.price * item.quantity).toFixed(2)}`
      ];
    });

    // Add table
    autoTable(doc, {
      startY: yPosition,
      head: [['Item', 'Size', 'Qty', 'Price', 'Subtotal']],
      body: tableData,
      margin: { left: 20, right: 20 },
      columnStyles: {
        0: { cellWidth: 80, fontStyle: 'normal', fontSize: 9 }, // Item name
        1: { cellWidth: 25, halign: 'center', fontSize: 9 }, // Size
        2: { cellWidth: 20, halign: 'center', fontSize: 9 }, // Quantity
        3: { cellWidth: 25, halign: 'right', fontSize: 9 }, // Price
        4: { cellWidth: 25, halign: 'right', fontSize: 9 } // Subtotal
      },
      styles: {
        fontSize: 9,
        cellPadding: 3,
        overflow: 'linebreak',
        lineWidth: 0.1,
        minCellHeight: 8
      },
      headStyles: {
        fillColor: [99, 102, 241], // Indigo color
        fontSize: 10,
        fontStyle: 'bold',
        halign: 'center',
        textColor: [255, 255, 255]
      }
    });

    // Get the final Y position after the table
    const finalY = (doc as any).lastAutoTable.finalY;
    yPosition = finalY + 15;

    // Calculate totals
    const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = order.shippingDetails.shippingCost;
    const discount = order.voucherDiscount ? order.voucherDiscount / 100 : 0;
    const total = order.total;

    // Add totals section
    doc.setFontSize(10);
    doc.text('Subtotal:', 140, yPosition);
    doc.text(`£${subtotal.toFixed(2)}`, 170, yPosition);
    yPosition += 8;

    doc.text('Shipping:', 140, yPosition);
    doc.text(`£${shipping.toFixed(2)}`, 170, yPosition);
    yPosition += 8;

    if (order.voucherCode && discount > 0) {
      doc.setTextColor(139, 92, 246); // Purple for discount
      doc.text(`Discount (${order.voucherCode}):`, 140, yPosition);
      doc.text(`-£${discount.toFixed(2)}`, 170, yPosition);
      doc.setTextColor(0, 0, 0); // Reset to black
      yPosition += 8;
    }

    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Total:', 140, yPosition);
    doc.text(`£${total.toFixed(2)}`, 170, yPosition);
    doc.setFont(undefined, 'normal');
    yPosition += 8;

    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128); // Gray color
    doc.text('Includes VAT (20%):', 140, yPosition);
    doc.text(`£${order.vat.toFixed(2)}`, 170, yPosition);

    // Add footer
    yPosition += 20;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text('Thank you for your business!', 20, yPosition);
    yPosition += 8;
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.text('For any questions, please contact us at customer.service@mrshirtpersonalisation.com', 20, yPosition);

    // Add page numbers
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 8,
        { align: 'center' }
      );
    }

    console.log('Customer invoice PDF generation completed successfully');
    return doc;
  } catch (error) {
    console.error('Error generating customer invoice PDF:', error);
    throw error;
  }
}; 