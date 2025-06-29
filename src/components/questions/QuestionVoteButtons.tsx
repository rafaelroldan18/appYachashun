import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { showWarning } from '../../utils/errorHandling';

interface QuestionVoteButtonsProps {
  questionId: string;
  voteCount: number;
  userVote?: 'up' | 'down' | null;
  onVote: (questionId: string, voteType: 'up' | 'down') => Promise<void>;
  isVoting: boolean;
  vertical?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function QuestionVoteButtons({
  questionId,
  voteCount,
  userVote,
  onVote,
  isVoting,
  vertical = true,
  size = 'md',
  className = '',
}: QuestionVoteButtonsProps) {
  const { user } = useAuth();
  
  const handleVote = async (voteType: 'up' | 'down') => {
    if (!user) {
      showWarning('Debes iniciar sesión para votar');
      return;
    }
    
    await onVote(questionId, voteType);
  };
  
  const sizes = {
    sm: {
      button: 'p-1',
      icon: 'w-4 h-4',
      count: 'text-base',
    },
    md: {
      button: 'p-2',
      icon: 'w-5 h-5',
      count: 'text-lg',
    },
    lg: {
      button: 'p-3',
      icon: 'w-6 h-6',
      count: 'text-xl',
    },
  };
  
  const containerClass = vertical 
    ? 'flex flex-col items-center space-y-2' 
    : 'flex items-center space-x-2';
  
  return (
    <div className={`${containerClass} ${className}`}>
      <button
        onClick={() => handleVote('up')}
        disabled={isVoting}
        className={`${sizes[size].button} rounded-lg transition-colors ${
          userVote === 'up'
            ? 'bg-secondary-100 dark:bg-secondary-900/30 text-secondary-600 dark:text-secondary-400'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
        aria-label="Voto positivo"
      >
        <ArrowUp className={sizes[size].icon} />
      </button>
      
      <motion.span 
        className={`font-semibold ${sizes[size].count} text-gray-900 dark:text-white`}
        key={voteCount}
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 0.3 }}
      >
        {voteCount}
      </motion.span>
      
      <button
        onClick={() => handleVote('down')}
        disabled={isVoting}
        className={`${sizes[size].button} rounded-lg transition-colors ${
          userVote === 'down'
            ? 'bg-error-100 dark:bg-error-900/30 text-error-600 dark:text-error-400'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
        aria-label="Voto negativo"
      >
        <ArrowDown className={sizes[size].icon} />
      </button>
    </div>
  );
}