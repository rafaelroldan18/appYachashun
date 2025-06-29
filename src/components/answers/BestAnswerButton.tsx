import React from 'react';
import { Check, Award } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { showWarning } from '../../utils/errorHandling';

interface BestAnswerButtonProps {
  questionUserId: string;
  answerId: string;
  isBest: boolean;
  onMarkBest: (answerId: string) => Promise<void>;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function BestAnswerButton({
  questionUserId,
  answerId,
  isBest,
  onMarkBest,
  size = 'md',
  className = '',
}: BestAnswerButtonProps) {
  const { user } = useAuth();
  
  const handleMarkBest = async () => {
    if (!user) {
      showWarning('Debes iniciar sesión para marcar la mejor respuesta');
      return;
    }
    
    if (user.id !== questionUserId) {
      showWarning('Solo el autor de la pregunta puede marcar la mejor respuesta');
      return;
    }
    
    await onMarkBest(answerId);
  };
  
  // If already best answer, show award icon
  if (isBest) {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className={`p-2 rounded-lg bg-secondary-100 dark:bg-secondary-900/30 text-secondary-600 dark:text-secondary-400 ${className}`}
        title="Mejor respuesta"
      >
        <Award className={size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5'} />
      </motion.div>
    );
  }
  
  // Only show button to question author
  if (user?.id !== questionUserId) {
    return null;
  }
  
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={handleMarkBest}
      className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-secondary-100 dark:hover:bg-secondary-900/30 hover:text-secondary-600 dark:hover:text-secondary-400 transition-colors ${className}`}
      title="Marcar como mejor respuesta"
    >
      <Check className={size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5'} />
    </motion.button>
  );
}