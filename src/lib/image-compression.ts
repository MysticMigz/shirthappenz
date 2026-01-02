import imageCompression from 'browser-image-compression';

export interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  quality?: number;
}

/**
 * Compresses an image file while maintaining quality
 * @param file - The image file to compress
 * @param options - Compression options
 * @returns Compressed file
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const defaultOptions: CompressionOptions = {
    maxSizeMB: 9, // Target 9MB to stay under 10MB limit
    maxWidthOrHeight: 1920, // Max dimension (maintains aspect ratio)
    useWebWorker: true,
    quality: 0.85, // 85% quality - good balance between quality and size
  };

  const compressionOptions = { ...defaultOptions, ...options };

  try {
    const compressedFile = await imageCompression(file, compressionOptions);
    
    // Log compression results
    const originalSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    const compressedSizeMB = (compressedFile.size / (1024 * 1024)).toFixed(2);
    const reduction = ((1 - compressedFile.size / file.size) * 100).toFixed(1);
    
    console.log(`Image compressed: ${originalSizeMB}MB → ${compressedSizeMB}MB (${reduction}% reduction)`);
    
    return compressedFile;
  } catch (error) {
    console.error('Error compressing image:', error);
    // If compression fails, return original file
    return file;
  }
}

/**
 * Compresses multiple image files
 * @param files - Array of image files to compress
 * @param options - Compression options
 * @returns Array of compressed files
 */
export async function compressImages(
  files: File[],
  options: CompressionOptions = {}
): Promise<File[]> {
  return Promise.all(files.map(file => compressImage(file, options)));
}

