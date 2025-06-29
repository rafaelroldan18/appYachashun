import React, { useState } from 'react';
import { User } from 'lucide-react';
import { motion } from 'framer-motion';

interface AvatarProps {
  src?: string | null;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  fallbackIcon?: React.ReactNode;
  status?: 'online' | 'offline' | 'away' | 'busy';
  showStatus?: boolean;
  onClick?: () => void;
  showEditButton?: boolean;
  onEditClick?: () => void;
}

export function Avatar({
  src,
  alt,
  size = 'md',
  className = '',
  fallbackIcon,
  status,
  showStatus = false,
  onClick,
  showEditButton = false,
  onEditClick,
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
    '2xl': 'w-20 h-20',
  };

  const iconSizes = {
    xs: 12,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
    '2xl': 40,
  };

  const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-gray-400',
    away: 'bg-yellow-500',
    busy: 'bg-red-500',
  };

  const statusSizes = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-4 h-4',
    '2xl': 'w-5 h-5',
  };

  const Component = onClick ? motion.button : motion.div;

  return (
    <Component
      className={`relative inline-flex items-center justify-center ${sizeClasses[size]} rounded-full overflow-hidden ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
      onClick={onClick}
      whileHover={onClick ? { scale: 1.05 } : undefined}
      whileTap={onClick ? { scale: 0.95 } : undefined}
    >
      {src && !imageError ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
          {fallbackIcon || (
            <User 
              className="text-white" 
              size={Math.floor(iconSizes[size] * 0.6)} 
            />
          )}
        </div>
      )}

      {/* Status indicator */}
      {showStatus && status && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={`absolute -bottom-0.5 -right-0.5 ${statusSizes[size]} ${statusColors[status]} rounded-full border-2 border-white dark:border-gray-800`}
        />
      )}

      {/* Edit button */}
      {showEditButton && onEditClick && (
        <motion.button
          className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-40 flex items-center justify-center transition-all duration-200"
          onClick={(e) => {
            e.stopPropagation();
            onEditClick();
          }}
          whileHover={{ opacity: 1 }}
          initial={{ opacity: 0 }}
        >
          <div className="bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 p-1 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </div>
        </motion.button>
      )}
    </Component>
  );
}