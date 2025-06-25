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
      yPosition += 10;

      // Create table
      const tableData = items.map(item => [
        item.supply.name,
        `${item.quantity}`,
        item.supply.unit,
        `£${item.priceAtOrder.toFixed(2)}`,
        `£${(item.priceAtOrder * item.quantity).toFixed(2)}`,
        item.notes || ''
      ]);

      // Add table
      autoTable(doc, {
        startY: yPosition,
        head: [['Item', 'Quantity', 'Unit', 'Price/Unit', 'Subtotal', 'Notes']],
        body: tableData,
        margin: { left: 20 },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 20 },
          2: { cellWidth: 20 },
          3: { cellWidth: 25 },
          4: { cellWidth: 25 },
          5: { cellWidth: 40 }
        }
      });

      // Get the final Y position after the table
      const finalY = (doc as any).lastAutoTable.finalY;
      yPosition = finalY + 20;

      // Add supplier subtotal
      const supplierTotal = items.reduce((total, item) => total + (item.priceAtOrder * item.quantity), 0);
      doc.setFontSize(12);
      doc.text(`Supplier Subtotal: £${supplierTotal.toFixed(2)}`, 20, yPosition);
      yPosition += 20;
    });

    // Add total
    doc.setFontSize(14);
    doc.text(`Total Order Amount: £${order.totalAmount.toFixed(2)}`, 20, yPosition);

    // Add order notes if any
    if (order.notes) {
      yPosition += 20;
      doc.setFontSize(12);
      doc.text('Order Notes:', 20, yPosition);
      yPosition += 7;
      doc.text(order.notes, 20, yPosition);
    }

    // Add footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
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