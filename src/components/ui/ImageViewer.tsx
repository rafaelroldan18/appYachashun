import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut, Download, RotateCw, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './Button';

interface ImageViewerProps {
  src: string;
  alt: string;
  className?: string;
  showZoomOnHover?: boolean;
}

export function ImageViewer({ 
  src, 
  alt, 
  className = '',
  showZoomOnHover = true
}: ImageViewerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const openLightbox = () => {
    setIsOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setIsOpen(false);
    document.body.style.overflow = 'unset';
    // Reset zoom and position when closing
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setRotation(0);
  };

  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.5, 5));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.5, 0.5));
  };

  const rotate = () => {
    setRotation(prev => prev + 90);
  };

  const downloadImage = async () => {
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = alt || 'image';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <>
      {/* Thumbnail image that opens the lightbox */}
      <div 
        className={`relative cursor-pointer overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}
        onClick={openLightbox}
      >
        <img 
          src={src} 
          alt={alt} 
          className="w-full h-auto object-contain max-h-96"
          loading="lazy"
        />
        
        <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs flex items-center">
          <ImageIcon className="w-3 h-3 mr-1" />
          Ver imagen
        </div>
        
        {showZoomOnHover && (
          <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors duration-300 flex items-center justify-center opacity-0 hover:opacity-100">
            <div className="bg-black/60 text-white p-2 rounded-full">
              <ZoomIn className="w-6 h-6" />
            </div>
          </div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={!isDragging ? closeLightbox : undefined}
          >
            {/* Close button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={closeLightbox}
              className="absolute top-4 right-4 text-white hover:bg-white/20 z-10"
            >
              <X className="w-6 h-6" />
            </Button>

            {/* Toolbar */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 bg-black/60 p-2 rounded-lg">
              <Button
                variant="ghost"
                size="sm"
                onClick={zoomIn}
                className="text-white hover:bg-white/20"
              >
                <ZoomIn className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={zoomOut}
                className="text-white hover:bg-white/20"
              >
                <ZoomOut className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={rotate}
                className="text-white hover:bg-white/20"
              >
                <RotateCw className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={downloadImage}
                className="text-white hover:bg-white/20"
              >
                <Download className="w-5 h-5" />
              </Button>
            </div>

            {/* Image */}
            <motion.div
              drag
              dragMomentum={false}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              dragConstraints={{ left: -1000, right: 1000, top: -1000, bottom: 1000 }}
              style={{ 
                scale, 
                rotate: rotation,
                x: position.x,
                y: position.y,
                cursor: isDragging ? 'grabbing' : 'grab'
              }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-full max-h-[90vh] select-none"
            >
              <img
                src={src}
                alt={alt}
                className="max-w-full max-h-[90vh] object-contain pointer-events-none"
                draggable="false"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}