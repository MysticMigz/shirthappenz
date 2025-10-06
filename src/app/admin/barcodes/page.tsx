"use client";

import { useEffect, useState } from "react";
import { generateBarcode } from "@/lib/utils";
import dynamic from "next/dynamic";
import React from "react";
import { saveAs } from "file-saver";
import jsPDF from 'jspdf';
// html2canvas will be imported dynamically to avoid SSR issues

const Barcode = dynamic(() => import("react-barcode"), { ssr: false });

interface Product {
  _id: string;
  name: string;
  colors: Array<{ name: string; hexCode: string }>;
  barcode?: string;
  barcodes?: Array<{ colorName: string; colorHex: string; value: string; size: string; sizeCode: string }>;
  sizes?: string[];
}

// Helper to join sizes as a string
function getSizesString(product: Product) {
  if (!product.sizes || product.sizes.length === 0) return '';
  return product.sizes.join(', ');
}

// Modal component for selecting color and size
function BarcodeModal({ product, colors, sizes, onClose, onGenerate }: { product: Product, colors: any[], sizes: string[], onClose: () => void, onGenerate: (color: any, size: string) => void }) {
  const [selectedColor, setSelectedColor] = useState(colors[0] || null);
  const [selectedSize, setSelectedSize] = useState(sizes[0] || "");
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 min-w-[320px]">
        <h2 className="text-lg font-bold mb-4">Generate Barcode for {product.name}</h2>
        <div className="mb-4">
          <label className="block mb-1 font-medium">Color</label>
          <select
            className="w-full border rounded px-2 py-1"
            value={selectedColor?.name || ""}
            onChange={e => setSelectedColor(colors.find(c => c.name === e.target.value))}
          >
            {colors.map(color => (
              <option key={color.name} value={color.name}>{color.name}</option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label className="block mb-1 font-medium">Size</label>
          <select
            className="w-full border rounded px-2 py-1"
            value={selectedSize}
            onChange={e => setSelectedSize(e.target.value)}
          >
            {sizes.map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>
        <div className="flex justify-end gap-2">
          <button className="px-3 py-1 bg-gray-200 rounded" onClick={onClose}>Cancel</button>
          <button
            className="px-3 py-1 bg-purple-600 text-white rounded"
            onClick={() => selectedColor && selectedSize && onGenerate(selectedColor, selectedSize)}
            disabled={!selectedColor || !selectedSize}
          >
            Generate
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BarcodesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);
  const [modalProduct, setModalProduct] = useState<Product | null>(null);
  const [modalColors, setModalColors] = useState<any[]>([]);
  const [modalSizes, setModalSizes] = useState<string[]>([]);
  const [filter, setFilter] = useState({ name: "", color: "", size: "" });
  const [filtered, setFiltered] = useState<Product[]>([]);
  // State for selected barcodes and their quantities
  const [selectedBarcodes, setSelectedBarcodes] = useState<{ [key: string]: { barcode: any, quantity: number } }>({});

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/products");
        if (!res.ok) throw new Error("Failed to fetch products");
        const data = await res.json();
        setProducts(data.products);
        setFiltered(data.products);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch products");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Filtering logic
  useEffect(() => {
    setFiltered(
      products.filter((product) => {
        const nameMatch = filter.name === "" || product.name.toLowerCase().includes(filter.name.toLowerCase());
        const colorMatch = filter.color === "" || (product.colors && product.colors.some(c => c.name.toLowerCase().includes(filter.color.toLowerCase())));
        const sizeMatch = filter.size === "" || (product.sizes && product.sizes.some(s => s.toLowerCase().includes(filter.size.toLowerCase())));
        return nameMatch && colorMatch && sizeMatch;
      })
    );
  }, [filter, products]);

  const handleGenerateBarcode = async (product: Product, color: { name: string; hexCode: string }, size: string) => {
    setUpdating(product._id + color.name + size);
    const newBarcode = generateBarcode(new Date(), color.name, product._id, size);
    // Get size code for saving
    const { SIZE_CODE_MAP } = await import('@/lib/utils');
    const sizeCode = SIZE_CODE_MAP[size] || '00';
    const payload = {
      barcodes: [
        ...(product.barcodes?.filter(b => !(b.colorName === color.name && b.size === size)) || []),
        { colorName: color.name, colorHex: color.hexCode, value: newBarcode, size, sizeCode }
      ]
    };
    console.log('Sending payload:', payload);
    try {
      const res = await fetch(`/api/admin/products/${product._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to update barcode");
      setProducts((prev) =>
        prev.map((p) =>
          p._id === product._id
            ? {
                ...p,
                barcodes: [
                  ...(p.barcodes?.filter(b => !(b.colorName === color.name && b.size === size)) || []),
                  { colorName: color.name, colorHex: color.hexCode, value: newBarcode, size, sizeCode }
                ]
              }
            : p
        )
      );
    } catch (err) {
      alert("Failed to update barcode");
    } finally {
      setUpdating(null);
    }
  };

  const openBarcodeModal = (product: Product) => {
    setModalProduct(product);
    setModalColors(product.colors);
    setModalSizes(product.sizes || []);
  };
  const closeBarcodeModal = () => {
    setModalProduct(null);
    setModalColors([]);
    setModalSizes([]);
  };
  const handleModalGenerate = (color: any, size: string) => {
    if (modalProduct) {
      handleGenerateBarcode(modalProduct, color, size);
      closeBarcodeModal();
    }
  };

  // Handle checkbox toggle
  const handleBarcodeSelect = (productId: string, barcode: any, checked: boolean) => {
    const key = `${productId}_${barcode.colorName}_${barcode.size}`;
    setSelectedBarcodes(prev => {
      const updated = { ...prev };
      if (checked) {
        updated[key] = { barcode, quantity: prev[key]?.quantity ?? 0 };
      } else {
        delete updated[key];
      }
      return updated;
    });
  };
  // Handle quantity change
  const handleQuantityChange = (productId: string, barcode: any, value: string) => {
    const key = `${productId}_${barcode.colorName}_${barcode.size}`;
    const qty = Math.max(0, parseInt(value) || 0);
    setSelectedBarcodes(prev => ({
      ...prev,
      [key]: { barcode, quantity: qty }
    }));
  };

  // Export selected barcodes as PDF labels (4x6 inch)
  const handleExportSelectedBarcodesPDF = async () => {
    const barcodesToExport: { barcode: any, quantity: number }[] = Object.values(selectedBarcodes).filter(b => b.quantity > 0);
    if (barcodesToExport.length === 0) return;
    // 4x6 inch = 101.6mm x 152.4mm
    const pageWidth = 101.6;
    const pageHeight = 152.4;
    const barcodeW = 30; // mm
    const barcodeH = 22; // mm
    const gap = 3; // mm
    const padding = 2; // mm padding inside each label
    const leftMargin = 4; // mm left margin for each label
    const pagePadding = 2; // mm padding on all sides (reduced to fit 3 columns)
    const usableWidth = pageWidth - 2 * pagePadding;
    const usableHeight = pageHeight - 2 * pagePadding;
    const cols = Math.floor((usableWidth + gap) / (barcodeW + gap));
    const rows = Math.floor((usableHeight + gap) / (barcodeH + gap));
    const perPage = cols * rows;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [pageWidth, pageHeight] });
    let labelIdx = 0;
    for (const { barcode, quantity } of barcodesToExport) {
      for (let q = 0; q < quantity; q++, labelIdx++) {
        const pageIdx = Math.floor(labelIdx / perPage);
        const idxOnPage = labelIdx % perPage;
        const col = idxOnPage % cols;
        const row = Math.floor(idxOnPage / cols);
        if (labelIdx > 0 && idxOnPage === 0) pdf.addPage([pageWidth, pageHeight], 'portrait');
        // Create a temporary div for rendering
        const tempDiv = document.createElement('div');
        tempDiv.style.marginLeft = `${leftMargin * 3}px`;
        tempDiv.innerHTML = `
          <div style=\"font-size:5px;font-weight:bold;max-width:180px;text-align:center;margin-bottom:4px;\">${barcode.productName} <span style=\\"color:${barcode.colorHex};font-weight:normal;\\">- ${barcode.colorName}</span> <span style=\\"font-weight:bold;\\">- ${barcode.size}</span></div>
          <div style=\"display:flex;justify-content:center;align-items:center;margin:2px 0;\">
            <svg id=\"barcode-svg-export-grid-${labelIdx}\" style=\"width:70px;height:18px;\"></svg>
          </div>
          <div style=\"font-size:7px;text-align:center;color:#b00;font-weight:bold;\">${barcode.value}</div>
        `;
        tempDiv.style.border = '0.5px solid #000';
        tempDiv.style.background = '#fff';
        tempDiv.style.padding = '6px 4px 4px 4px';
        tempDiv.style.width = '180px';
        tempDiv.style.height = '80px';
        tempDiv.style.boxSizing = 'border-box';
        document.body.appendChild(tempDiv);
        // Render barcode SVG
        // @ts-ignore
        await import('jsbarcode').then(jsbarcode => {
          jsbarcode.default(`#barcode-svg-export-grid-${labelIdx}`, barcode.value, {
            format: 'CODE128',
            width: 0.9,
            height: 15,
            displayValue: false,
            margin: 0
          });
        });
        // Convert to image
        const html2canvas = (await import('html2canvas')).default;
        const canvas = await html2canvas(tempDiv, { backgroundColor: '#fff', scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const marginLeft = 4; // mm
        const x = pagePadding + col * (barcodeW + gap);
        const y = pagePadding + row * (barcodeH + gap);
        pdf.addImage(imgData, 'PNG', x, y, barcodeW, barcodeH);
        document.body.removeChild(tempDiv);
      }
    }
    pdf.save('selected_barcodes_4x6_grid.pdf');
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Product Barcodes</h1>
      {/* Filter Bar */}
      <div className="flex flex-wrap gap-4 mb-6 items-end">
        <div>
          <label className="block text-xs font-medium mb-1">Product Name</label>
          <input
            type="text"
            className="border rounded px-2 py-1"
            value={filter.name}
            onChange={e => setFilter(f => ({ ...f, name: e.target.value }))}
            placeholder="Search name..."
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Color</label>
          <input
            type="text"
            className="border rounded px-2 py-1"
            value={filter.color}
            onChange={e => setFilter(f => ({ ...f, color: e.target.value }))}
            placeholder="Search color..."
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Size</label>
          <input
            type="text"
            className="border rounded px-2 py-1"
            value={filter.size}
            onChange={e => setFilter(f => ({ ...f, size: e.target.value }))}
            placeholder="Search size..."
          />
        </div>
      </div>
      {/* Export selected barcodes button (top right) */}
      <div className="flex justify-end items-center mb-6">
        <button
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          onClick={handleExportSelectedBarcodesPDF}
        >
          Export Selected Barcodes (PDF)
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border rounded-lg">
          <thead>
            <tr>
              <th className="px-4 py-2 border-b">Product</th>
              <th className="px-4 py-2 border-b">Barcode</th>
              <th className="px-4 py-2 border-b">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((product) => (
              <tr key={product._id}>
                <td className="px-4 py-2 border-b align-top">{product.name}</td>
                <td className="px-4 py-2 border-b align-top">
                  {product.colors.map((color) => (
                    <div key={color.name} className="mb-4">
                      {product.sizes && product.sizes.length > 0 ? (
                        product.sizes.map((size) => {
                          const barcodeObj = product.barcodes?.find(b => b.colorName === color.name && b.size === size);
                          const key = `${product._id}_${color.name}_${size}`;
                          return (
                            <div key={color.name + size} className="mb-2 flex items-center border-b last:border-b-0 pb-2 last:pb-0">
                              <input
                                type="checkbox"
                                className="mr-2"
                                checked={!!selectedBarcodes[key]}
                                onChange={e => handleBarcodeSelect(product._id, { ...barcodeObj, productName: product.name, colorName: color.name, size }, e.target.checked)}
                                disabled={!barcodeObj}
                              />
                              <input
                                type="number"
                                min={0}
                                className="w-14 mr-2 px-1 py-0.5 border rounded text-xs"
                                value={selectedBarcodes[key]?.quantity ?? 0}
                                onChange={e => handleQuantityChange(product._id, { ...barcodeObj, productName: product.name, colorName: color.name, size }, e.target.value)}
                                disabled={!selectedBarcodes[key]}
                              />
                              <div className="flex-1 flex flex-col">
                                <span className="font-semibold text-xs mb-1">{product.name} - <span style={{ color: color.hexCode }}>{color.name}</span> - {size}</span>
                                {barcodeObj ? (
                                  <>
                                    <Barcode value={barcodeObj.value} width={2} height={60} fontSize={14} />
                                    <span className="text-xs mt-1">{barcodeObj.value}</span>
                                    <span className="text-xs text-gray-700 mt-1">
                                      {product.name} | {color.name} | Size: {size}
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-gray-400 text-xs">No barcode for {color.name} - {size}</span>
                                )}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <span className="text-gray-400 text-xs">No sizes</span>
                      )}
                    </div>
                  ))}
                </td>
                <td className="px-4 py-2 border-b align-top">
                  <button
                    className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
                    onClick={() => openBarcodeModal(product)}
                  >
                    Generate Barcode
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modalProduct && (
        <BarcodeModal
          product={modalProduct}
          colors={modalColors}
          sizes={modalSizes}
          onClose={closeBarcodeModal}
          onGenerate={handleModalGenerate}
        />
      )}
    </div>
  );
} 