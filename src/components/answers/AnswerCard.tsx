import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowUp, 
  Check, 
  User, 
  Calendar, 
  Flag, 
  Award,
  Edit,
  Trash2,
  MessageCircle,
  AlertTriangle,
  Image as ImageIcon
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { ImageViewer } from '../ui/ImageViewer';
import { StarRating } from '../ui/StarRating';
import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import { supabase } from '../../lib/supabase';
import { handleError, showSuccess, showWarning } from '../../utils/errorHandling';

interface AnswerCardProps {
  answer: {
    id: string;
    content: string;
    vote_count: number;
    upvotes: number;
    downvotes: number;
    is_best: boolean;
    created_at: string;
    user_id: string;
    image_url?: string | null;
    rating?: number | null;
    rating_count?: number | null;
    users: {
      username: string;
      level: number;
      avatar_url: string | null;
      full_name?: string | null;
    } | null;
    user_vote?: {
      vote_type: 'up' | 'down';
    } | null;
    user_rating?: {
      rating: number;
    } | null;
  };
  questionId: string;
  questionUserId: string;
  onVote: (answerId: string, voteType: 'up') => Promise<void>;
  onMarkBest: (answerId: string) => Promise<void>;
  onReportClick: (answerId: string, content: string) => void;
  isVoting: boolean;
}

export function AnswerCard({ 
  answer, 
  questionId,
  questionUserId,
  onVote, 
  onMarkBest,
  onReportClick,
  isVoting
}: AnswerCardProps) {
  const { user } = useAuth();
  const { can } = usePermissions();
  const [showFullContent, setShowFullContent] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [localRating, setLocalRating] = useState<number>(answer.user_rating?.rating || 0);
  const [localRatingCount, setLocalRatingCount] = useState<number>(answer.rating_count || 0);
  const [localAvgRating, setLocalAvgRating] = useState<number | null>(answer.rating || null);
  
  const isLongContent = answer.content.length > 500;
  const displayContent = showFullContent ? answer.content : answer.content.substring(0, 500);
  
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Hace menos de 1 hora';
    if (diffInHours < 24) return `Hace ${diffInHours} horas`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `Hace ${diffInDays} días`;
  };

  const handleVote = async () => {
    if (!user) {
      showWarning('Debes iniciar sesión para votar');
      return;
    }
    
    await onVote(answer.id, 'up');
  };

  const handleMarkBest = async () => {
    if (!user) {
      showWarning('Debes iniciar sesión para marcar la mejor respuesta');
      return;
    }
    
    if (user.id !== questionUserId) {
      showWarning('Solo el autor de la pregunta puede marcar la mejor respuesta');
      return;
    }
    
    await onMarkBest(answer.id);
  };

  const handleDeleteAnswer = async () => {
    if (!can.deleteAnswer(answer.user_id)) {
      return;
    }
    
    setShowDeleteConfirm(true);
  };

  const confirmDeleteAnswer = async () => {
    if (!user) return;
    
    setDeleting(true);
    
    try {
      const { error } = await supabase
        .from('answers')
        .delete()
        .eq('id', answer.id);
        
      if (error) throw error;
      
      showSuccess('Respuesta eliminada correctamente');
      
      // Redirect to question page or reload
      window.location.reload();
    } catch (error) {
      handleError(error, 'AnswerCard.confirmDeleteAnswer');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleRating = async (rating: number) => {
    if (!user) {
      showWarning('Debes iniciar sesión para calificar respuestas');
      return;
    }

    setSubmittingRating(true);

    try {
      // Check if user already rated this answer
      const { data: existingRating } = await supabase
        .from('answer_ratings')
        .select('*')
        .eq('answer_id', answer.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingRating) {
        // Update existing rating
        const { error } = await supabase
          .from('answer_ratings')
          .update({ rating })
          .eq('id', existingRating.id);

        if (error) throw error;
        showSuccess('Calificación actualizada');
      } else {
        // Create new rating
        const { error } = await supabase
          .from('answer_ratings')
          .insert({
            answer_id: answer.id,
            user_id: user.id,
            rating
          });

        if (error) throw error;
        showSuccess('Calificación enviada');
      }

      // Update local state to reflect the new rating
      setLocalRating(rating);
      
      // Calculate new average rating and count
      let newCount = localRatingCount;
      let newTotal = (localAvgRating || 0) * localRatingCount;
      
      if (!existingRating) {
        // If this is a new rating, increment the count
        newCount += 1;
        newTotal += rating;
      } else {
        // If updating an existing rating, adjust the total
        newTotal = newTotal - existingRating.rating + rating;
      }
      
      const newAvg = newCount > 0 ? newTotal / newCount : 0;
      
      setLocalRatingCount(newCount);
      setLocalAvgRating(newAvg);
      
    } catch (error) {
      handleError(error, 'AnswerCard.handleRating');
    } finally {
      setSubmittingRating(false);
    }
  };

  return (
    <Card className={`p-6 ${answer.is_best ? 'ring-2 ring-secondary-500 dark:ring-secondary-600 bg-secondary-50 dark:bg-secondary-900/20' : ''}`}>
      {answer.is_best && (
        <div className="flex items-center mb-4 text-secondary-700 dark:text-secondary-400">
          <Award className="w-5 h-5 mr-2" />
          <span className="font-semibold">Mejor Respuesta</span>
        </div>
      )}

      <div className="flex gap-4">
        {/* Vote Controls */}
        <div className="flex flex-col items-center space-y-2">
          <button
            onClick={handleVote}
            disabled={isVoting}
            className={`p-2 rounded-lg transition-colors ${
              answer.user_vote?.vote_type === 'up'
                ? 'bg-secondary-100 dark:bg-secondary-900/30 text-secondary-600 dark:text-secondary-400'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            } disabled:opacity-50`}
            aria-label="Voto positivo"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
          
          <motion.span 
            className="font-semibold text-lg text-gray-900 dark:text-white"
            key={answer.vote_count}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.3 }}
          >
            {answer.vote_count}
          </motion.span>

          {/* Best Answer Button - Only visible to question author */}
          {user && user.id === questionUserId && !answer.is_best && (
            <button
              onClick={handleMarkBest}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-secondary-100 dark:hover:bg-secondary-900/30 hover:text-secondary-600 dark:hover:text-secondary-400 transition-colors mt-2"
              title="Marcar como mejor respuesta"
            >
              <Check className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Answer Content */}
        <div className="flex-1">
          <div className="mb-4">
            <div className="flex items-center space-x-3 mb-3">
              <Avatar
                src={answer.users?.avatar_url || null}
                alt={answer.users?.username || 'Usuario'}
                size="sm"
              />
              <div>
                <Link 
                  to={`/profile/${answer.user_id}`}
                  className="font-medium text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  {answer.users?.full_name || answer.users?.username || 'Usuario desconocido'}
                </Link>
                <div className="flex items-center space-x-2">
                  <Badge variant="info" size="sm">
                    Nivel {answer.users?.level || 1}
                  </Badge>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatTimeAgo(answer.created_at)}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="prose max-w-none dark:prose-invert">
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {displayContent}
                {isLongContent && !showFullContent && '...'}
              </p>
            </div>
            
            {/* Answer Image */}
            {answer.image_url && (
              <div className="mt-4">
                <ImageViewer
                  src={answer.image_url}
                  alt="Imagen de la respuesta"
                />
              </div>
            )}
            
            {isLongContent && (
              <button
                onClick={() => setShowFullContent(!showFullContent)}
                className="mt-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium"
              >
                {showFullContent ? 'Ver menos' : 'Ver más'}
              </button>
            )}

            {/* Star Rating */}
            <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400 mr-2">
                    Calificar respuesta:
                  </span>
                  <StarRating 
                    initialRating={localRating}
                    onRate={handleRating}
                    disabled={submittingRating}
                    size="md"
                  />
                </div>
                {localAvgRating !== null && localRatingCount > 0 && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">{localAvgRating.toFixed(1)}</span>/5 
                    <span className="ml-1">({localRatingCount} {localRatingCount === 1 ? 'calificación' : 'calificaciones'})</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {answer.upvotes > 0 && (
                <span className="text-xs text-secondary-600 dark:text-secondary-400">
                  {answer.upvotes} votos positivos
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {can.editAnswer(answer.user_id) && (
                <Link to={`/edit-answer/${answer.id}`}>
                  <Button variant="ghost" size="sm" className="text-gray-500 dark:text-gray-400">
                    <Edit className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                </Link>
              )}
              
              {can.deleteAnswer(answer.user_id) && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleDeleteAnswer}
                  className="text-gray-500 dark:text-gray-400"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Eliminar
                </Button>
              )}
              
              {user && user.id !== answer.user_id && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onReportClick(answer.id, answer.content)}
                  className="text-gray-500 dark:text-gray-400"
                >
                  <Flag className="w-4 h-4 mr-1" />
                  Reportar
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-500 dark:text-gray-400"
                onClick={() => {
                  const url = `${window.location.origin}/question/${questionId}#answer-${answer.id}`;
                  navigator.clipboard.writeText(url);
                  showSuccess('Enlace copiado al portapapeles');
                }}
              >
                <MessageCircle className="w-4 h-4 mr-1" />
                Citar
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full p-6">
            <div className="flex items-center mb-4 text-error-600 dark:text-error-400">
              <AlertTriangle className="w-6 h-6 mr-2" />
              <h3 className="text-lg font-semibold">Confirmar eliminación</h3>
            </div>
            
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              ¿Estás seguro de que deseas eliminar esta respuesta? Esta acción no se puede deshacer.
            </p>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={confirmDeleteAnswer}
                loading={deleting}
                className="flex-1"
              >
                Eliminar
              </Button>
            </div>
          </Card>
        </div>
      )}
    </Card>
  );
}