import React from 'react';
import { Link } from 'react-router-dom';
import { Edit, Trash2, Flag, Share2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import { showSuccess } from '../../utils/errorHandling';

interface QuestionActionButtonsProps {
  questionId: string;
  questionUserId: string;
  onReportClick?: () => void;
  onDeleteClick?: () => void;
  className?: string;
}

export function QuestionActionButtons({
  questionId,
  questionUserId,
  onReportClick,
  onDeleteClick,
  className = '',
}: QuestionActionButtonsProps) {
  const { user } = useAuth();
  const { can } = usePermissions();

  const shareQuestion = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Pregunta en Yachashun',
        text: 'Mira esta pregunta en Yachashun',
        url: `${window.location.origin}/question/${questionId}`,
      }).catch(err => {
        console.error('Error al compartir:', err);
        copyToClipboard();
      });
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    const url = `${window.location.origin}/question/${questionId}`;
    navigator.clipboard.writeText(url);
    showSuccess('Enlace copiado al portapapeles');
  };

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {can.editQuestion(questionUserId) && (
        <Link to={`/edit-question/${questionId}`}>
          <Button variant="outline" size="sm">
            <Edit className="w-4 h-4 mr-1" />
            Editar
          </Button>
        </Link>
      )}
      
      {can.deleteQuestion(questionUserId) && (
        <Button 
          variant="danger" 
          size="sm"
          onClick={onDeleteClick}
        >
          <Trash2 className="w-4 h-4 mr-1" />
          Eliminar
        </Button>
      )}
      
      <Button
        variant="ghost"
        size="sm"
        onClick={shareQuestion}
        className="text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
      >
        <Share2 className="w-4 h-4 mr-1" />
        Compartir
      </Button>
      
      {user && user.id !== questionUserId && onReportClick && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onReportClick}
          className="text-gray-500 dark:text-gray-400 hover:text-error-600 dark:hover:text-error-400"
        >
          <Flag className="w-4 h-4 mr-1" />
          Reportar
        </Button>
      )}
    </div>
  );
}