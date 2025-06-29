// Image optimization utilities

export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png' | 'auto';
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  position?: 'center' | 'top' | 'bottom' | 'left' | 'right';
  blur?: number;
  sharpen?: boolean;
  grayscale?: boolean;
}

// Generate optimized image URL for different services
export function getOptimizedImageUrl(
  originalUrl: string,
  options: ImageOptimizationOptions = {}
): string {
  const {
    width,
    height,
    quality = 80,
    format = 'auto',
    fit = 'cover',
    position = 'center',
    blur,
    sharpen,
    grayscale,
  } = options;

  // Pexels optimization
  if (originalUrl.includes('pexels.com')) {
    const url = new URL(originalUrl);
    
    if (width) url.searchParams.set('w', width.toString());
    if (height) url.searchParams.set('h', height.toString());
    
    url.searchParams.set('auto', 'compress');
    url.searchParams.set('cs', 'tinysrgb');
    url.searchParams.set('fit', fit);
    
    if (format !== 'auto') {
      url.searchParams.set('fm', format);
    }
    
    return url.toString();
  }

  // Unsplash optimization
  if (originalUrl.includes('unsplash.com')) {
    const url = new URL(originalUrl);
    
    if (width || height) {
      const params = [];
      if (width) params.push(`w_${width}`);
      if (height) params.push(`h_${height}`);
      if (fit !== 'cover') params.push(`c_${fit}`);
      if (quality !== 80) params.push(`q_${quality}`);
      if (format !== 'auto') params.push(`f_${format}`);
      if (grayscale) params.push('e_grayscale');
      if (blur) params.push(`e_blur:${blur}`);
      if (sharpen) params.push('e_sharpen');
      
      url.searchParams.set('auto', 'format,compress');
      url.searchParams.set('fit', fit);
      url.searchParams.set('w', width?.toString() || '');
      url.searchParams.set('h', height?.toString() || '');
    }
    
    return url.toString();
  }

  // For other URLs, return as-is (could be extended for other services)
  return originalUrl;
}

// Generate responsive image srcSet
export function generateSrcSet(
  originalUrl: string,
  baseWidth: number,
  options: Omit<ImageOptimizationOptions, 'width'> = {}
): string {
  const densities = [1, 1.5, 2, 3];
  
  return densities
    .map(density => {
      const width = Math.round(baseWidth * density);
      const optimizedUrl = getOptimizedImageUrl(originalUrl, {
        ...options,
        width,
      });
      return `${optimizedUrl} ${density}x`;
    })
    .join(', ');
}

// Generate responsive sizes attribute
export function generateSizes(breakpoints: { [key: string]: string }): string {
  const entries = Object.entries(breakpoints);
  
  if (entries.length === 0) return '100vw';
  
  const mediaQueries = entries
    .slice(0, -1)
    .map(([breakpoint, size]) => `(max-width: ${breakpoint}) ${size}`)
    .join(', ');
  
  const defaultSize = entries[entries.length - 1][1];
  
  return mediaQueries ? `${mediaQueries}, ${defaultSize}` : defaultSize;
}

// Common responsive breakpoints
export const RESPONSIVE_BREAKPOINTS = {
  mobile: { maxWidth: '640px', size: '100vw' },
  tablet: { maxWidth: '1024px', size: '50vw' },
  desktop: { maxWidth: '1280px', size: '33vw' },
  default: '25vw',
};

// Preload critical images
export function preloadImage(url: string, options: ImageOptimizationOptions = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => resolve();
    img.onerror = reject;
    
    img.src = getOptimizedImageUrl(url, options);
  });
}

// Batch preload images
export async function preloadImages(
  urls: string[],
  options: ImageOptimizationOptions = {}
): Promise<void> {
  const promises = urls.map(url => preloadImage(url, options));
  await Promise.allSettled(promises);
}

// Calculate optimal image dimensions based on container
export function calculateOptimalDimensions(
  containerWidth: number,
  containerHeight: number,
  devicePixelRatio = window.devicePixelRatio || 1
): { width: number; height: number } {
  return {
    width: Math.round(containerWidth * devicePixelRatio),
    height: Math.round(containerHeight * devicePixelRatio),
  };
}

// Image format detection and fallback
export function getSupportedImageFormat(): 'webp' | 'jpeg' {
  // Check WebP support
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  
  try {
    const webpSupported = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    return webpSupported ? 'webp' : 'jpeg';
  } catch {
    return 'jpeg';
  }
}

// Compress image file (for uploads)
export function compressImage(
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1080,
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        'image/jpeg',
        quality
      );
    };
    
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}