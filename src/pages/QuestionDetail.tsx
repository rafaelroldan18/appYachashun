import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowUp, 
  Check, 
  MessageCircle, 
  Calendar, 
  User, 
  Eye, 
  Tag, 
  BookOpen,
  Award,
  AlertTriangle,
  Edit,
  Trash2,
  Flag,
  Image as ImageIcon,
  Share2,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { ReportModal } from '../components/reports/ReportModal';
import { AnswerForm } from '../components/answers/AnswerForm';
import { AnswerCard } from '../components/answers/AnswerCard';
import { LoadingSpinner, ErrorState, EmptyState, CardSkeleton } from '../components/ui/LoadingStates';
import { AuthRequiredMessage } from '../components/auth/AuthRequiredMessage';
import { QuestionActionButtons } from '../components/questions/QuestionActionButtons';
import { QuestionVoteButtons } from '../components/questions/QuestionVoteButtons';
import { ImageViewer } from '../components/ui/ImageViewer';
import { BackButton } from '../components/ui/BackButton';
import { supabase } from '../lib/supabase';
import { handleError, showSuccess, showLoading, dismissToast, showWarning } from '../utils/errorHandling';

interface Question {
  id: string;
  title: string;
  content: string;
  tags: string[];
  educational_level: string;
  is_answered: boolean;
  best_answer_id: string | null;
  view_count: number;
  vote_count: number;
  answer_count: number;
  created_at: string;
  user_id: string;
  image_url: string | null;
  users: {
    username: string;
    level: number;
    avatar_url: string | null;
    full_name: string | null;
  } | null;
  categories: {
    name: string;
    color: string;
    icon: string | null;
  } | null;
  user_vote?: {
    vote_type: 'up' | 'down';
  } | null;
}

interface Answer {
  id: string;
  content: string;
  vote_count: number;
  upvotes: number;
  downvotes: number;
  is_best: boolean;
  created_at: string;
  user_id: string;
  image_url: string | null;
  users: {
    username: string;
    level: number;
    avatar_url: string | null;
    full_name: string | null;
  } | null;
  user_vote?: {
    vote_type: 'up' | 'down';
  } | null;
  user_rating?: {
    rating: number;
  } | null;
  rating?: number | null;
  rating_count?: number | null;
}

export function QuestionDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { can } = usePermissions();
  const navigate = useNavigate();
  const answersRef = useRef<HTMLDivElement>(null);
  
  const [question, setQuestion] = useState<Question | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [answersLoading, setAnswersLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [votingAnswerId, setVotingAnswerId] = useState<string | null>(null);
  const [votingQuestion, setVotingQuestion] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [reportModal, setReportModal] = useState<{
    isOpen: boolean;
    type: 'question' | 'answer';
    id: string;
    title?: string;
    content?: string;
  }>({
    isOpen: false,
    type: 'question',
    id: '',
  });

  useEffect(() => {
    if (id) {
      loadQuestion();
      loadAnswers();
      incrementViewCount();
    } else {
      setError('ID de pregunta no válido');
      setLoading(false);
    }
  }, [id]);

  const loadQuestion = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('questions')
        .select(`
          *,
          users:user_id (username, level, avatar_url, full_name),
          categories:category_id (name, color, icon),
          question_votes:question_votes!question_votes_question_id_fkey (vote_type, user_id)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        setError('Pregunta no encontrada');
        return;
      }
      
      // Process user vote for the question
      const processedQuestion = {
        ...data,
        user_vote: user ? data.question_votes?.find((vote: any) => vote.user_id === user.id) : null
      };
      
      setQuestion(processedQuestion);
    } catch (error) {
      console.error('Error loading question:', error);
      setError('Error al cargar la pregunta');
      handleError(error, 'QuestionDetail.loadQuestion');
    } finally {
      setLoading(false);
    }
  };

  const loadAnswers = async () => {
    if (!id) return;

    try {
      setAnswersLoading(true);

      // First, get the answers with votes
      const { data: answersData, error: answersError } = await supabase
        .from('answers')
        .select(`
          *,
          users:user_id (username, level, avatar_url, full_name),
          votes!votes_answer_id_fkey (vote_type, user_id)
        `)
        .eq('question_id', id);

      if (answersError) throw answersError;

      // Then, get the ratings separately
      const { data: ratingsData, error: ratingsError } = await supabase
        .from('answer_ratings')
        .select('*')
        .in('answer_id', answersData.map(a => a.id));

      if (ratingsError) throw ratingsError;

      // Process and combine the data
      const processedAnswers = answersData.map(answer => {
        // Get ratings for this answer
        const answerRatings = ratingsData.filter(r => r.answer_id === answer.id);
        const ratingSum = answerRatings.reduce((sum, r) => sum + r.rating, 0);
        const ratingCount = answerRatings.length;
        const avgRating = ratingCount > 0 ? ratingSum / ratingCount : null;
        
        // Get user's rating for this answer
        const userRating = user ? answerRatings.find(r => r.user_id === user.id) : null;

        return {
          ...answer,
          rating_count: ratingCount,
          rating: avgRating,
          user_vote: user ? answer.votes?.find((vote: any) => vote.user_id === user.id) : null,
          user_rating: userRating ? { rating: userRating.rating } : null
        };
      });

      // Sort answers: best first, then by vote count
      processedAnswers.sort((a, b) => {
        // Best answers first
        if (a.is_best && !b.is_best) return -1;
        if (!a.is_best && b.is_best) return 1;
        
        // Then by vote count (highest first)
        return b.vote_count - a.vote_count;
      });

      setAnswers(processedAnswers);
    } catch (error) {
      console.error('Error loading answers:', error);
      handleError(error, 'QuestionDetail.loadAnswers');
    } finally {
      setAnswersLoading(false);
    }
  };

  const incrementViewCount = async () => {
    if (!id) return;

    try {
      await supabase.rpc('increment_view_count', { question_id: id });
    } catch (error) {
      console.error('Error incrementing view count:', error);
    }
  };

  const handleAnswerSubmitted = async () => {
    await loadAnswers();
    await loadQuestion(); // Refresh to update answer count
    
    // Scroll to the new answer
    setTimeout(() => {
      if (answersRef.current) {
        answersRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const voteAnswer = async (answerId: string, voteType: 'up') => {
    if (!user) {
      showWarning('Debes iniciar sesión para votar');
      return;
    }

    setVotingAnswerId(answerId);

    try {
      const answer = answers.find(a => a.id === answerId);
      const existingVote = answer?.user_vote;

      if (existingVote) {
        // Remove vote if already voted
        await supabase
          .from('votes')
          .delete()
          .eq('answer_id', answerId)
          .eq('user_id', user.id);
        
        showSuccess('Voto eliminado');
      } else {
        // Create new vote
        await supabase
          .from('votes')
          .insert({
            answer_id: answerId,
            user_id: user.id,
            vote_type: voteType,
          });
        
        showSuccess('Voto positivo registrado');
      }

      await loadAnswers();
    } catch (error) {
      handleError(error, 'QuestionDetail.voteAnswer');
    } finally {
      setVotingAnswerId(null);
    }
  };

  const voteQuestion = async (questionId: string, voteType: 'up' | 'down') => {
    if (!user) {
      showWarning('Debes iniciar sesión para votar');
      return;
    }

    setVotingQuestion(true);

    try {
      const existingVote = question?.user_vote;

      if (existingVote) {
        if (existingVote.vote_type === voteType) {
          // Remove vote
          await supabase
            .from('question_votes')
            .delete()
            .eq('question_id', questionId)
            .eq('user_id', user.id);
          
          showSuccess('Voto eliminado');
        } else {
          // Update vote
          await supabase
            .from('question_votes')
            .update({ vote_type: voteType })
            .eq('question_id', questionId)
            .eq('user_id', user.id);
          
          showSuccess(voteType === 'up' ? 'Voto positivo registrado' : 'Voto negativo registrado');
        }
      } else {
        // Create new vote
        await supabase
          .from('question_votes')
          .insert({
            question_id: questionId,
            user_id: user.id,
            vote_type: voteType,
          });
        
        showSuccess(voteType === 'up' ? 'Voto positivo registrado' : 'Voto negativo registrado');
      }

      await loadQuestion();
    } catch (error) {
      handleError(error, 'QuestionDetail.voteQuestion');
    } finally {
      setVotingQuestion(false);
    }
  };

  const markAsBestAnswer = async (answerId: string) => {
    if (!question || !user) {
      showWarning('Debes iniciar sesión para marcar la mejor respuesta');
      return;
    }
    
    if (user.id !== question.user_id) {
      showWarning('Solo el autor de la pregunta puede marcar la mejor respuesta');
      return;
    }

    const toastId = showLoading('Marcando como mejor respuesta...');

    try {
      // Update question to set best answer
      await supabase
        .from('questions')
        .update({ 
          best_answer_id: answerId,
          is_answered: true 
        })
        .eq('id', id);

      // Update all answers to remove best status
      await supabase
        .from('answers')
        .update({ is_best: false })
        .eq('question_id', id);

      // Mark the selected answer as best
      await supabase
        .from('answers')
        .update({ is_best: true })
        .eq('id', answerId);

      dismissToast(toastId);
      showSuccess('¡Mejor respuesta seleccionada!');
      await loadQuestion();
      await loadAnswers();
    } catch (error) {
      dismissToast(toastId);
      handleError(error, 'QuestionDetail.markAsBestAnswer');
    }
  };

  const handleDeleteQuestion = () => {
    if (!question) return;
    
    if (!can.deleteQuestion(question.user_id)) {
      showWarning('No tienes permiso para eliminar esta pregunta');
      return;
    }
    
    setShowDeleteConfirm(true);
  };

  const confirmDeleteQuestion = async () => {
    if (!question || !id) return;

    const toastId = showLoading('Eliminando pregunta...');
    setDeleting(true);

    try {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      dismissToast(toastId);
      showSuccess('Pregunta eliminada correctamente');
      navigate('/');
    } catch (error) {
      dismissToast(toastId);
      handleError(error, 'QuestionDetail.confirmDeleteQuestion');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const openReportModal = (type: 'question' | 'answer', targetId: string, title?: string, content?: string) => {
    if (!user) {
      showWarning('Debes iniciar sesión para reportar contenido');
      return;
    }
    
    setReportModal({
      isOpen: true,
      type,
      id: targetId,
      title,
      content,
    });
  };

  const shareQuestion = () => {
    if (navigator.share) {
      navigator.share({
        title: question?.title || 'Pregunta en Yachashun',
        text: `Mira esta pregunta en Yachashun: ${question?.title}`,
        url: window.location.href,
      }).catch(err => {
        console.error('Error al compartir:', err);
        copyToClipboard();
      });
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    showSuccess('Enlace copiado al portapapeles');
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Hace menos de 1 hora';
    if (diffInHours < 24) return `Hace ${diffInHours} horas`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `Hace ${diffInDays} días`;
  };

  const getEducationalLevelLabel = (level: string) => {
    const labels = {
      primaria: 'Primaria',
      secundaria: 'Secundaria',
      universidad: 'Universidad',
      otro: 'Otro'
    };
    return labels[level as keyof typeof labels] || level;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="p-8 mb-8 animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-40"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
            </div>
            <div className="space-y-2 mb-6">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            </div>
            <div className="flex flex-wrap gap-2 mb-6">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
            </div>
          </Card>
          
          <div className="mb-8">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-6"></div>
            <CardSkeleton count={3} />
          </div>
        </div>
      </div>
    );
  }

  if (error || !question) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <ErrorState
          title="Pregunta no encontrada"
          message={error || "La pregunta que buscas no existe o ha sido eliminada."}
          onRetry={() => {
            setError(null);
            loadQuestion();
          }}
          showRetry={!!error}
          action={
            <BackButton label="Volver" />
          }
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back button */}
        <div className="mb-4">
          <BackButton label="Atrás" />
        </div>
        
        {/* Question Card */}
        <Card className="p-8 mb-8">
          <div className="flex gap-4">
            {/* Vote Controls */}
            <QuestionVoteButtons
              questionId={question.id}
              voteCount={question.vote_count}
              userVote={question.user_vote?.vote_type}
              onVote={voteQuestion}
              isVoting={votingQuestion}
            />

            {/* Question Content */}
            <div className="flex-1">
              <div className="flex justify-between items-start mb-6">
                <div className="flex-1">
                  <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white mb-4">
                    {question.title}
                  </h1>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-6">
                    <div className="flex items-center space-x-2">
                      <Avatar
                        src={question.users?.avatar_url || null}
                        alt={question.users?.username || 'Usuario'}
                        size="sm"
                      />
                      <div>
                        <Link 
                          to={`/profile/${question.user_id}`}
                          className="font-medium text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                        >
                          {question.users?.full_name || question.users?.username || 'Usuario desconocido'}
                        </Link>
                        <Badge variant="info" size="sm" className="ml-1">
                          Nivel {question.users?.level || 1}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      <span>{formatTimeAgo(question.created_at)}</span>
                    </div>
                    <div className="flex items-center">
                      <Eye className="w-4 h-4 mr-1" />
                      <span>{question.view_count} vistas</span>
                    </div>
                    <div className="flex items-center">
                      <MessageCircle className="w-4 h-4 mr-1" />
                      <span>{question.answer_count} respuestas</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {question.categories && (
                      <Badge 
                        variant="primary" 
                        className="flex items-center"
                        style={{ 
                          backgroundColor: question.categories.color + '20',
                          color: question.categories.color,
                          borderColor: question.categories.color + '40'
                        }}
                      >
                        {question.categories.icon && <span className="mr-1">{question.categories.icon}</span>}
                        {question.categories.name}
                      </Badge>
                    )}
                    <Badge variant="secondary">
                      <BookOpen className="w-3 h-3 mr-1" />
                      {getEducationalLevelLabel(question.educational_level)}
                    </Badge>
                    {question.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" size="sm">
                        <Tag className="w-3 h-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  {question.is_answered && (
                    <Badge variant="success" className="flex-shrink-0">
                      <Check className="w-4 h-4 mr-1" />
                      Respondida
                    </Badge>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={shareQuestion}
                    className="text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                  
                  {user && user.id !== question.user_id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openReportModal('question', question.id, question.title, question.content)}
                      className="text-gray-500 dark:text-gray-400 hover:text-error-600 dark:hover:text-error-400"
                    >
                      <Flag className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="prose max-w-none mb-6 dark:prose-invert">
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {question.content}
                </p>
              </div>

              {/* Question Image */}
              {question.image_url && (
                <div className="mb-6">
                  <ImageViewer
                    src={question.image_url}
                    alt="Imagen de la pregunta"
                  />
                </div>
              )}

              {/* Question Actions */}
              <QuestionActionButtons
                questionId={question.id}
                questionUserId={question.user_id}
                onReportClick={() => openReportModal('question', question.id, question.title, question.content)}
                onDeleteClick={handleDeleteQuestion}
                className="pt-4 border-t border-gray-200 dark:border-gray-700"
              />
            </div>
          </div>
        </Card>

        {/* Answers Section */}
        <div className="mb-8" ref={answersRef}>
          <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-white mb-6">
            {answersLoading ? 'Cargando respuestas...' : 
             answers.length > 0 ? `${answers.length} Respuestas` : 'Sin respuestas aún'}
          </h2>

          {answersLoading ? (
            <CardSkeleton count={3} />
          ) : answers.length > 0 ? (
            <div className="space-y-6">
              {answers.map((answer) => (
                <AnswerCard
                  key={answer.id}
                  answer={answer}
                  questionId={question.id}
                  questionUserId={question.user_id}
                  onVote={voteAnswer}
                  onMarkBest={markAsBestAnswer}
                  onReportClick={(answerId, content) => openReportModal('answer', answerId, undefined, content)}
                  isVoting={votingAnswerId === answer.id}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<MessageCircle className="w-12 h-12 text-gray-400" />}
              title="No hay respuestas aún"
              description="Sé el primero en ayudar respondiendo esta pregunta."
            />
          )}
        </div>

        {/* Answer Form */}
        {user ? (
          <AnswerForm 
            questionId={question.id}
            userId={user.id}
            onAnswerSubmitted={handleAnswerSubmitted}
          />
        ) : (
          <AuthRequiredMessage
            title="Inicia sesión para responder"
            message="Necesitas una cuenta para poder responder preguntas y ayudar a otros estudiantes."
          />
        )}

        {/* Report Modal */}
        <ReportModal
          isOpen={reportModal.isOpen}
          onClose={() => setReportModal({ ...reportModal, isOpen: false })}
          targetType={reportModal.type}
          targetId={reportModal.id}
          targetTitle={reportModal.title}
          targetContent={reportModal.content}
        />

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="max-w-md w-full p-6">
              <div className="flex items-center mb-4 text-error-600 dark:text-error-400">
                <AlertTriangle className="w-6 h-6 mr-2" />
                <h3 className="text-lg font-semibold">Confirmar eliminación</h3>
              </div>
              
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                ¿Estás seguro de que deseas eliminar esta pregunta? Esta acción no se puede deshacer y se eliminarán todas las respuestas asociadas.
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
                  onClick={confirmDeleteQuestion}
                  loading={deleting}
                  className="flex-1"
                >
                  Eliminar
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}