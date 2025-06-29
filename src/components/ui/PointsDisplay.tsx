import React from 'react';
import { Target, TrendingUp, Award } from 'lucide-react';
import { motion } from 'framer-motion';

interface PointsDisplayProps {
  points: number;
  level: number;
  className?: string;
  showProgress?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
}

export function PointsDisplay({ 
  points, 
  level, 
  className = '', 
  showProgress = false,
  variant = 'default'
}: PointsDisplayProps) {
  const getNextLevelPoints = (currentPoints: number) => {
    const currentLevel = Math.floor(currentPoints / 100) + 1;
    return currentLevel * 100;
  };

  const getLevelProgress = (currentPoints: number) => {
    const currentLevelBase = Math.floor(currentPoints / 100) * 100;
    const pointsInCurrentLevel = currentPoints - currentLevelBase;
    return (pointsInCurrentLevel / 100) * 100;
  };

  const pointsToNextLevel = getNextLevelPoints(points) - points;
  const progressPercentage = getLevelProgress(points);

  if (variant === 'compact') {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 p-1.5 rounded-full">
          <Target className="w-4 h-4" />
        </div>
        <div className="flex items-center space-x-1">
          <span className="font-medium text-gray-900 dark:text-white">{points.toLocaleString()}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">pts</span>
        </div>
        <div className="bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 px-2 py-0.5 rounded-full text-xs font-medium">
          Nivel {level}
        </div>
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className={`bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/10 dark:to-secondary-900/10 rounded-lg p-6 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <Award className="w-5 h-5 mr-2 text-primary-500" />
            Nivel y Puntos
          </h3>
          <div className="bg-primary-100 dark:bg-primary-900/30 px-3 py-1 rounded-full">
            <span className="text-sm font-medium text-primary-700 dark:text-primary-300">Nivel {level}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <span className="text-xl font-bold text-gray-900 dark:text-white">{points.toLocaleString()} pts</span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {pointsToNextLevel} para nivel {level + 1}
          </div>
        </div>

        <div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-2">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="bg-gradient-to-r from-primary-500 to-secondary-500 h-2.5 rounded-full"
            ></motion.div>
          </div>
          
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Nivel {level}</span>
            <span>Nivel {level + 1}</span>
          </div>
        </div>
        
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
            <div className="flex items-center space-x-2 mb-1">
              <TrendingUp className="w-4 h-4 text-secondary-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Respuestas</span>
            </div>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">+5 puntos</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
            <div className="flex items-center space-x-2 mb-1">
              <Award className="w-4 h-4 text-accent-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Mejor respuesta</span>
            </div>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">+15 puntos</p>
          </div>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className={`bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/10 dark:to-secondary-900/10 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Target className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          <span className="font-semibold text-gray-900 dark:text-white">{points.toLocaleString()} puntos</span>
        </div>
        <div className="flex items-center space-x-1 bg-primary-100 dark:bg-primary-900/30 px-3 py-1 rounded-full">
          <Award className="w-4 h-4 text-primary-600 dark:text-primary-400" />
          <span className="text-sm font-medium text-primary-700 dark:text-primary-300">Nivel {level}</span>
        </div>
      </div>

      {showProgress && (
        <div>
          <div className="flex items-center justify-between mb-2 text-sm text-gray-600 dark:text-gray-400">
            <span>Progreso al Nivel {level + 1}</span>
            <span>{pointsToNextLevel} puntos restantes</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="bg-gradient-to-r from-primary-500 to-secondary-500 h-2 rounded-full transition-all duration-300"
            ></motion.div>
          </div>
        </div>
      )}
    </div>
  );
}