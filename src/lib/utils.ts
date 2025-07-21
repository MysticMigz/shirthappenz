export function getImageUrl(path: string): string {
  if (!path) return '';
  // If it's an absolute URL or a data URL, return as is
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  // Fallback: just return the path as-is (for legacy local images)
  return path;
}

// Color code mapping for barcodes
export const COLOR_CODE_MAP: Record<string, string> = {
  black: '01',
  white: '02',
  blue: '03',
  green: '04',
  red: '05',
  yellow: '06',
  orange: '07',
  purple: '08',
  pink: '09',
  grey: '10',
  gray: '10',
  brown: '11',
  navy: '12',
  // Add more as needed
};

// Size code mapping for barcodes
export const SIZE_CODE_MAP: Record<string, string> = {
  'XS': '01',
  'S': '02',
  'M': '03',
  'L': '04',
  'XL': '05',
  'XXL': '06',
  '3XL': '07',
  '4XL': '08',
  '5XL': '09',
  '0-3M': '10',
  '3-6M': '11',
  '6-12M': '12',
  '12-18M': '13',
  '18-24M': '14',
  '2T': '15',
  '3T': '16',
  '4T': '17',
  '5T': '18',
  'YXS': '19',
  'YS': '20',
  'YM': '21',
  'YL': '22',
  'YXL': '23',
  '6': '24',
  '7': '25',
  '8': '26',
  '10': '27',
  '12': '28',
  '14': '29',
  '16': '30',
  '1–2Y': '31',
  '2–3Y': '32',
  '3–4Y': '33',
  '5–6Y': '34',
  '7–8Y': '35',
  '9–10Y': '36',
  '11–12Y': '37',
  '13–14Y': '38',
  // Add more as needed
};

/**
 * Generates a 6-digit code from a string (e.g., product name or _id) using a simple hash.
 */
export function getProductCode(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) & 0xffffffff;
  }
  // Ensure positive and pad to 6 digits
  const code = Math.abs(hash % 1000000).toString().padStart(6, '0');
  return code;
}

/**
 * Generates a barcode string: YYMMDDCCSSXXXXXX, where CC is the color code, SS is the size code, and XXXXXX is a unique product code.
 * @param date Date object (defaults to today)
 * @param colorName Color name (case-insensitive)
 * @param productIdOrName Product _id or name for uniqueness
 * @param size Product size (optional)
 */
export function generateBarcode(date: Date = new Date(), colorName: string, productIdOrName?: string, size?: string): string {
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const colorCode = COLOR_CODE_MAP[colorName.toLowerCase()] || '00';
  const sizeCode = size ? (SIZE_CODE_MAP[size] || '00') : '00';
  const productCode = productIdOrName ? getProductCode(productIdOrName) : '000000';
  return `${yy}${mm}${dd}${colorCode}${sizeCode}${productCode}`;
} 