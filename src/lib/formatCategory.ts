const CATEGORY_DISPLAY_MAP: Record<string, string> = {
  tshirts: 'T-Shirts',
  't-shirts': 'T-Shirts',
  hoodies: 'Hoodies',
  sweatshirts: 'Sweatshirts',
  jerseys: 'Jerseys',
  accessories: 'Accessories',
  tanktops: 'Tank Tops',
  'tank tops': 'Tank Tops',
  longsleeve: 'Long Sleeve Shirts',
  'long sleeve shirts': 'Long Sleeve Shirts',
  'longsleeve shirts': 'Long Sleeve Shirts',
  sweatpants: 'Sweatpants',
  crewneck: 'Crewneck',
  kids: 'Kids',
  men: 'Men',
  women: 'Women',
  unisex: 'Unisex'
};

export function formatCategory(category?: string) {
  if (!category) return 'Uncategorized';
  const key = category.toLowerCase();
  if (CATEGORY_DISPLAY_MAP[key]) return CATEGORY_DISPLAY_MAP[key];
  return category
    .split(/[\s-]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

