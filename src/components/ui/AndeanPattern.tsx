import React from 'react';
import { motion } from 'framer-motion';

interface AndeanPatternProps {
  className?: string;
  variant?: 'chakana' | 'waves' | 'mountains' | 'textile';
  animate?: boolean;
}

export function AndeanPattern({ className = '', variant = 'chakana', animate = false }: AndeanPatternProps) {
  const patterns = {
    chakana: (
      <svg viewBox="0 0 100 100" className={`w-full h-full ${className}`}>
        <defs>
          <pattern id="chakana" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <rect width="20" height="20" fill="currentColor" opacity="0.05" />
            <path d="M10 2 L18 10 L10 18 L2 10 Z" fill="currentColor" opacity="0.1" />
            <rect x="8" y="8" width="4" height="4" fill="currentColor" opacity="0.15" />
          </pattern>
        </defs>
        <rect width="100" height="100" fill="url(#chakana)" />
      </svg>
    ),
    waves: (
      <svg viewBox="0 0 100 100" className={`w-full h-full ${className}`}>
        <defs>
          <pattern id="waves" x="0" y="0" width="40" height="20" patternUnits="userSpaceOnUse">
            <path d="M0 10 Q10 0 20 10 T40 10" stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0.1" />
            <path d="M0 15 Q10 5 20 15 T40 15" stroke="currentColor" strokeWidth="0.3" fill="none" opacity="0.08" />
          </pattern>
        </defs>
        <rect width="100" height="100" fill="url(#waves)" />
      </svg>
    ),
    mountains: (
      <svg viewBox="0 0 100 100" className={`w-full h-full ${className}`}>
        <defs>
          <pattern id="mountains" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
            <polygon points="0,30 15,5 30,30" fill="currentColor" opacity="0.06" />
            <polygon points="5,30 20,10 35,30" fill="currentColor" opacity="0.04" />
          </pattern>
        </defs>
        <rect width="100" height="100" fill="url(#mountains)" />
      </svg>
    ),
    textile: (
      <svg viewBox="0 0 100 100" className={`w-full h-full ${className}`}>
        <defs>
          <pattern id="textile" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
            <rect width="16" height="16" fill="currentColor" opacity="0.03" />
            <rect x="2" y="2" width="4" height="4" fill="currentColor" opacity="0.08" />
            <rect x="10" y="10" width="4" height="4" fill="currentColor" opacity="0.08" />
            <rect x="2" y="10" width="4" height="4" fill="currentColor" opacity="0.05" />
            <rect x="10" y="2" width="4" height="4" fill="currentColor" opacity="0.05" />
          </pattern>
        </defs>
        <rect width="100" height="100" fill="url(#textile)" />
      </svg>
    )
  };

  const PatternComponent = animate ? motion.div : 'div';

  return (
    <PatternComponent
      className={`absolute inset-0 pointer-events-none ${className}`}
      {...(animate && {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 2, ease: 'easeOut' }
      })}
    >
      {patterns[variant]}
    </PatternComponent>
  );
}