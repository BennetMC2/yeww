/**
 * Image compression utilities for reducing storage size
 */

interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  outputFormat?: 'image/jpeg' | 'image/png' | 'image/webp';
}

const DEFAULT_OPTIONS: CompressOptions = {
  maxWidth: 1200,
  maxHeight: 1200,
  quality: 0.8,
  outputFormat: 'image/jpeg',
};

/**
 * Compress an image file and return base64 data URL
 */
export function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<{ data: string; mediaType: string }> {
  const opts = { ...DEFAULT_OPTIONS, ...options } as Required<CompressOptions>;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        try {
          const result = compressImageElement(img, opts);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Compress an image from a base64 data URL
 */
export function compressBase64Image(
  dataUrl: string,
  options: CompressOptions = {}
): Promise<{ data: string; mediaType: string }> {
  const opts = { ...DEFAULT_OPTIONS, ...options } as Required<CompressOptions>;

  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      try {
        const result = compressImageElement(img, opts);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = dataUrl;
  });
}

/**
 * Core compression logic using canvas
 */
function compressImageElement(
  img: HTMLImageElement,
  opts: Required<CompressOptions>
): { data: string; mediaType: string } {
  // Calculate new dimensions maintaining aspect ratio
  let { width, height } = img;

  if (width > opts.maxWidth) {
    height = (height * opts.maxWidth) / width;
    width = opts.maxWidth;
  }

  if (height > opts.maxHeight) {
    width = (width * opts.maxHeight) / height;
    height = opts.maxHeight;
  }

  // Create canvas and draw resized image
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Use better quality interpolation
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);

  // Convert to compressed format
  const data = canvas.toDataURL(opts.outputFormat, opts.quality);

  return {
    data,
    mediaType: opts.outputFormat,
  };
}

/**
 * Get estimated size of base64 string in bytes
 */
export function getBase64Size(base64: string): number {
  // Remove data URL prefix if present
  const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
  // Base64 encodes 3 bytes into 4 characters
  return Math.ceil((base64Data.length * 3) / 4);
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
