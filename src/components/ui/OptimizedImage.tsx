import React, { useState, useRef, useEffect } from 'react';
import { ImageOff, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  fallback?: string;
  lazy?: boolean;
  sizes?: string;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

export function OptimizedImage({
  src,
  alt,
  className = '',
  width,
  height,
  quality = 80,
  placeholder = 'blur',
  fallback,
  lazy = true,
  sizes,
  priority = false,
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(!lazy || priority);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || priority || isInView) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observerRef.current?.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    if (imgRef.current) {
      observerRef.current.observe(imgRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [lazy, priority, isInView]);

  // Generate optimized image URL
  const getOptimizedSrc = (originalSrc: string) => {
    // For Pexels images, add optimization parameters
    if (originalSrc.includes('pexels.com')) {
      const url = new URL(originalSrc);
      if (width) url.searchParams.set('w', width.toString());
      if (height) url.searchParams.set('h', height.toString());
      url.searchParams.set('auto', 'compress');
      url.searchParams.set('cs', 'tinysrgb');
      url.searchParams.set('dpr', '2');
      return url.toString();
    }

    // For Supabase Storage images
    if (originalSrc.includes('supabase.co') && originalSrc.includes('storage/v1')) {
      // Supabase doesn't support image transformations via URL parameters
      // Just return the original URL
      return originalSrc;
    }

    // For other images, return as-is (could be extended for other services)
    return originalSrc;
  };

  // Generate srcSet for responsive images
  const generateSrcSet = (originalSrc: string) => {
    if (!originalSrc.includes('pexels.com') || !width) return undefined;

    const sizes = [1, 1.5, 2, 3];
    return sizes
      .map(scale => {
        const scaledWidth = Math.round(width * scale);
        const url = new URL(originalSrc);
        url.searchParams.set('w', scaledWidth.toString());
        if (height) url.searchParams.set('h', Math.round(height * scale).toString());
        url.searchParams.set('auto', 'compress');
        url.searchParams.set('cs', 'tinysrgb');
        url.searchParams.set('dpr', '1');
        return `${url.toString()} ${scale}x`;
      })
      .join(', ');
  };

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  };

  const optimizedSrc = getOptimizedSrc(src);
  const srcSet = generateSrcSet(src);

  return (
    <div 
      ref={imgRef}
      className={`relative overflow-hidden ${className}`}
      style={{ width, height }}
    >
      {/* Placeholder */}
      {(isLoading || !isInView) && placeholder === 'blur' && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 animate-pulse">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
        </div>
      )}

      {/* Loading indicator */}
      {isLoading && isInView && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800"
        >
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
        </motion.div>
      )}

      {/* Error state */}
      {hasError && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-400"
        >
          <ImageOff className="w-8 h-8 mb-2" />
          <span className="text-sm">Error al cargar imagen</span>
        </motion.div>
      )}

      {/* Actual image */}
      {isInView && (
        <motion.img
          initial={{ opacity: 0 }}
          animate={{ opacity: isLoading ? 0 : 1 }}
          transition={{ duration: 0.3 }}
          src={optimizedSrc}
          srcSet={srcSet}
          sizes={sizes}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
    </div>
  );
}