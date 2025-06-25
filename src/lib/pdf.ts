import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';

interface SupplyOrderItem {
  supply: {
    name: string;
    unit: string;
    supplier: {
      name: string;
    };
  };
  quantity: number;
  priceAtOrder: number;
  notes?: string;
}

interface SupplyOrder {
  reference: string;
  items: SupplyOrderItem[];
  totalAmount: number;
  status: string;
  createdAt: string;
  orderedBy: string;
}

export const generateSupplyOrderPDF = (order: SupplyOrder) => {
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
  const itemsBySupplier: { [key: string]: SupplyOrderItem[] } = {};
  order.items.forEach(item => {
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
      item.quantity.toString(),
      item.supply.unit,
      `£${item.priceAtOrder.toFixed(2)}`,
      `£${(item.priceAtOrder * item.quantity).toFixed(2)}`,
      item.notes || ''
    ]);

    // Add table
    (doc as any).autoTable({
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

    yPosition = (doc as any).lastAutoTable.finalY + 20;

    // Add supplier subtotal
    const supplierTotal = items.reduce((total, item) => total + (item.priceAtOrder * item.quantity), 0);
    doc.setFontSize(12);
    doc.text(`Supplier Subtotal: £${supplierTotal.toFixed(2)}`, 20, yPosition);
    yPosition += 20;
  });

  // Add total
  doc.setFontSize(14);
  doc.text(`Total Order Amount: £${order.totalAmount.toFixed(2)}`, 20, yPosition);

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

  return doc;
}; 