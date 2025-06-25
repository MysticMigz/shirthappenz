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