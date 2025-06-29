import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  scale?: boolean;
}

export function AnimatedCard({ 
  children, 
  className = '', 
  hover = true, 
  delay = 0,
  direction = 'up',
  scale = false
}: AnimatedCardProps) {
  const directions = {
    up: { y: 24, x: 0 },
    down: { y: -24, x: 0 },
    left: { y: 0, x: 24 },
    right: { y: 0, x: -24 }
  };

  return (
    <motion.div
      initial={{ 
        opacity: 0, 
        ...directions[direction],
        ...(scale && { scale: 0.95 })
      }}
      animate={{ 
        opacity: 1, 
        y: 0, 
        x: 0,
        ...(scale && { scale: 1 })
      }}
      transition={{ 
        duration: 0.6, 
        delay,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      whileHover={hover ? { 
        y: -8, 
        transition: { duration: 0.2 } 
      } : undefined}
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-200 ${className}`}
    >
      {children}
    </motion.div>
  );
}