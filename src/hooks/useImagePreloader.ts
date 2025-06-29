import { useEffect, useState } from 'react';

interface PreloadOptions {
  priority?: boolean;
  crossOrigin?: 'anonymous' | 'use-credentials';
}

export function useImagePreloader(
  urls: string[],
  options: PreloadOptions = {}
) {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (urls.length === 0) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadedImages(new Set());
    setFailedImages(new Set());

    const promises = urls.map((url) => {
      return new Promise<{ url: string; success: boolean }>((resolve) => {
        const img = new Image();
        
        if (options.crossOrigin) {
          img.crossOrigin = options.crossOrigin;
        }

        img.onload = () => {
          setLoadedImages(prev => new Set(prev).add(url));
          resolve({ url, success: true });
        };

        img.onerror = () => {
          setFailedImages(prev => new Set(prev).add(url));
          resolve({ url, success: false });
        };

        img.src = url;
      });
    });

    Promise.allSettled(promises).then(() => {
      setIsLoading(false);
    });
  }, [urls, options.crossOrigin]);

  return {
    loadedImages,
    failedImages,
    isLoading,
    progress: urls.length > 0 ? (loadedImages.size + failedImages.size) / urls.length : 1,
  };
}

// Hook for preloading critical images
export function useCriticalImagePreloader(urls: string[]) {
  useEffect(() => {
    // Create link elements for critical image preloading
    const links = urls.map(url => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = url;
      document.head.appendChild(link);
      return link;
    });

    // Cleanup
    return () => {
      links.forEach(link => {
        if (link.parentNode) {
          link.parentNode.removeChild(link);
        }
      });
    };
  }, [urls]);
}

// Hook for lazy loading images with intersection observer
export function useLazyImageLoader(threshold = 0.1, rootMargin = '50px') {
  const [isInView, setIsInView] = useState(false);
  const [ref, setRef] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!ref) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(ref);

    return () => observer.disconnect();
  }, [ref, threshold, rootMargin]);

  return { ref: setRef, isInView };
}