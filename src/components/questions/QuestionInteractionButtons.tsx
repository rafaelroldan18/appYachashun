import React from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Eye, TrendingUp } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { AuthRequiredButton } from '../ui/AuthRequiredButton';

interface QuestionInteractionButtonsProps {
  questionId: string;
  answerCount: number;
  viewCount: number;
  voteCount: number;
  className?: string;
}

export function QuestionInteractionButtons({
  questionId,
  answerCount,
  viewCount,
  voteCount,
  className = '',
}: QuestionInteractionButtonsProps) {
  const { user } = useAuth();
  
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {user ? (
        <Link to={`/question/${questionId}#answer-form`}>
          <Button variant="primary" size="sm">
            <MessageCircle className="w-4 h-4 mr-1" />
            Responder
          </Button>
        </Link>
      ) : (
        <AuthRequiredButton
          onClick={() => {}}
          variant="primary"
          size="sm"
          authMessage="Inicia sesión para responder a esta pregunta"
        >
          <MessageCircle className="w-4 h-4 mr-1" />
          Responder
        </AuthRequiredButton>
      )}
      
      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
        <Eye className="w-4 h-4 mr-1" />
        <span>{viewCount} vistas</span>
      </div>
      
      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
        <MessageCircle className="w-4 h-4 mr-1" />
        <span>{answerCount} respuestas</span>
      </div>
      
      {voteCount > 0 && (
        <div className="flex items-center text-sm text-green-600 dark:text-green-400">
          <TrendingUp className="w-4 h-4 mr-1" />
          <span>{voteCount} votos</span>
        </div>
      )}
    </div>
  );
}