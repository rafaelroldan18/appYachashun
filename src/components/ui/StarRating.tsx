import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { motion } from 'framer-motion';

interface StarRatingProps {
  initialRating?: number;
  onRate: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
  maxStars?: number;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
  showValue?: boolean;
}

export function StarRating({
  initialRating = 0,
  onRate,
  size = 'md',
  maxStars = 5,
  disabled = false,
  readOnly = false,
  className = '',
  showValue = false,
}: StarRatingProps) {
  const [rating, setRating] = useState(initialRating);
  const [hoverRating, setHoverRating] = useState(0);
  
  // Update internal rating when initialRating prop changes
  useEffect(() => {
    setRating(initialRating);
  }, [initialRating]);
  
  const handleClick = (value: number) => {
    if (disabled || readOnly) return;
    
    // If clicking the same star, toggle between that rating and 0
    const newRating = rating === value ? 0 : value;
    setRating(newRating);
    onRate(newRating);
  };
  
  const handleMouseEnter = (value: number) => {
    if (disabled || readOnly) return;
    setHoverRating(value);
  };
  
  const handleMouseLeave = () => {
    if (disabled || readOnly) return;
    setHoverRating(0);
  };
  
  const starSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };
  
  const containerSizes = {
    sm: 'gap-1',
    md: 'gap-1.5',
    lg: 'gap-2',
  };
  
  const displayRating = hoverRating || rating;
  
  return (
    <div className={`flex items-center ${containerSizes[size]} ${className}`}>
      {Array.from({ length: maxStars }).map((_, index) => {
        const starValue = index + 1;
        const isFilled = starValue <= displayRating;
        
        return (
          <motion.button
            key={index}
            type="button"
            onClick={() => handleClick(starValue)}
            onMouseEnter={() => handleMouseEnter(starValue)}
            onMouseLeave={handleMouseLeave}
            whileHover={{ scale: disabled || readOnly ? 1 : 1.2 }}
            whileTap={{ scale: disabled || readOnly ? 1 : 0.9 }}
            disabled={disabled || readOnly}
            className={`focus:outline-none ${disabled ? 'cursor-not-allowed opacity-60' : readOnly ? 'cursor-default' : 'cursor-pointer'}`}
            aria-label={`${starValue} ${starValue === 1 ? 'estrella' : 'estrellas'}`}
          >
            <Star 
              className={`${starSizes[size]} ${
                isFilled 
                  ? 'fill-yellow-400 text-yellow-400' 
                  : 'fill-transparent text-gray-300 dark:text-gray-600'
              } transition-colors duration-100`}
            />
          </motion.button>
        );
      })}
      
      {showValue && rating > 0 && (
        <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          {rating}
        </span>
      )}
    </div>
  );
}