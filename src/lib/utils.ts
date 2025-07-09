export function getImageUrl(path: string): string {
  if (!path) return '';
  // If it's an absolute URL or a data URL, return as is
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  // Fallback: just return the path as-is (for legacy local images)
  return path;
} 