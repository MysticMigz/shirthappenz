export function getImageUrl(path: string): string {
  if (!path) return '';
  
  // If it's an absolute URL or a data URL, return as is
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  
  // If it's a local path starting with /uploads/
  if (path.startsWith('/uploads/')) {
    // For local development
    if (process.env.NODE_ENV === 'development') {
      return path;
    }
    // For production
    return `${process.env.NEXT_PUBLIC_BASE_URL || ''}${path}`;
  }
  
  // If it's a relative path that looks like a timestamp-prefixed filename
  if (/^\d{13}-.*/.test(path)) {
    return `/uploads/${path}`;
  }
  
  // For other local paths, assume they're in the public directory
  return `/${path.replace(/^\//, '')}`;
} 