import React from 'react';
import { Award, Medal, Star, Trophy, Crown } from 'lucide-react';

interface BadgeIconProps {
  rarity: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function BadgeIcon({ rarity, size = 'md', className = '' }: BadgeIconProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const getRarityIcon = (rarity: string) => {
    const icons = {
      common: Medal,
      uncommon: Award,
      rare: Star,
      epic: Trophy,
      legendary: Crown
    };
    return icons[rarity as keyof typeof icons] || Medal;
  };

  const getRarityColor = (rarity: string) => {
    const colors = {
      common: 'text-gray-600',
      uncommon: 'text-green-600',
      rare: 'text-blue-600',
      epic: 'text-purple-600',
      legendary: 'text-yellow-600'
    };
    return colors[rarity as keyof typeof colors] || 'text-gray-600';
  };

  const IconComponent = getRarityIcon(rarity);

  return (
    <IconComponent 
      className={`${sizeClasses[size]} ${getRarityColor(rarity)} ${className}`} 
    />
  );
}