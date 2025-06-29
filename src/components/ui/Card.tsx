import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  delay?: number;
}

export function Card({ 
  children, 
  className = '', 
  hover = false, 
  padding = 'md',
  animated = false,
  delay = 0
}: CardProps) {
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const baseClasses = `bg-white dark:bg-gray-800 rounded-xl shadow-soft border border-gray-200 dark:border-gray-700 transition-all duration-200 ${paddingClasses[padding]} ${className}`;

  if (animated) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay }}
        whileHover={hover ? { 
          y: -8, 
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          transition: { duration: 0.2 } 
        } : undefined}
        className={baseClasses}
      >
        {children}
      </motion.div>
    );
  }

  const hoverClasses = hover ? 'hover:shadow-medium hover:-translate-y-1 transition-all duration-200' : '';

  return (
    <div className={`${baseClasses} ${hoverClasses}`}>
      {children}
    </div>
  );
}