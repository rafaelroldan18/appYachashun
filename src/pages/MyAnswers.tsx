import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageCircle, Filter, AlertTriangle, Star, Award, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/ui/LoadingStates';
import { supabase } from '../lib/supabase';
import { handleError, showSuccess, showLoading, dismissToast } from '../utils/errorHandling';

interface Answer {
  id: string;
  content: string;
  vote_count: number;
  is_best: boolean;
  created_at: string;
  updated_at: string;
  question: {
    id: string;
    title: string;
    user_id: string;
  };
}

export function MyAnswers() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'best' | 'voted'>('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user) {
      loadAnswers();
    }
  }, [user, filter]);

  const loadAnswers = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('answers')
        .select(`
          id,
          content,
          vote_count,
          is_best,
          created_at,
          updated_at,
          question:question_id (id, title, user_id)
        `)
        .eq('user_id', user.id);

      if (filter === 'best') {
        query = query.eq('is_best', true);
      } else if (filter === 'voted') {
        query = query.gt('vote_count', 0);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      setAnswers(data || []);
    } catch (error) {
      console.error('Error loading answers:', error);
      setError('Error al cargar tus respuestas');
      handleError(error, 'MyAnswers.loadAnswers');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAnswer = async (id: string) => {
    if (!user) return;

    setShowDeleteConfirm(id);
  };

  const confirmDelete = async () => {
    if (!showDeleteConfirm || !user) return;

    const toastId = showLoading('Eliminando respuesta...');
    setDeleting(true);

    try {
      const { error } = await supabase
        .from('answers')
        .delete()
        .eq('id', showDeleteConfirm)
        .eq('user_id', user.id);

      if (error) throw error;

      dismissToast(toastId);
      showSuccess('Respuesta eliminada correctamente');
      
      // Update local state
      setAnswers(answers.filter(a => a.id !== showDeleteConfirm));
    } catch (error) {
      dismissToast(toastId);
      handleError(error, 'MyAnswers.confirmDelete');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(null);
    }
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

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Verificando autenticación..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          {/* Back button */}
          <div className="mb-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/')}
              className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Volver al inicio
            </Button>
          </div>
          
          <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white flex items-center">
            <MessageCircle className="mr-3 h-8 w-8 text-primary-500" />
            Mis Respuestas
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Gestiona las respuestas que has dado a preguntas de la comunidad
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <div className="flex space-x-2">
              {[
                { key: 'all', label: 'Todas' },
                { key: 'best', label: 'Mejores respuestas' },
                { key: 'voted', label: 'Con votos' }
              ].map((filterOption) => (
                <button
                  key={filterOption.key}
                  onClick={() => setFilter(filterOption.key as any)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    filter === filterOption.key
                      ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-glow'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {filterOption.label}
                </button>
              ))}
            </div>
          </div>

          <Link to="/search?status=unanswered">
            <Button>
              Buscar preguntas para responder
            </Button>
          </Link>
        </div>

        {/* Answers List */}
        {loading ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                <div className="space-y-2 mb-4">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                </div>
                <div className="flex justify-between">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                </div>
              </Card>
            ))}
          </div>
        ) : error ? (
          <ErrorState
            title="Error al cargar tus respuestas"
            message={error}
            onRetry={loadAnswers}
            showRetry={true}
          />
        ) : answers.length > 0 ? (
          <div className="space-y-6">
            {answers.map((answer) => (
              <Card key={answer.id} className={`p-6 ${answer.is_best ? 'ring-2 ring-green-500 dark:ring-green-600 bg-green-50 dark:bg-green-900/20' : ''}`}>
                {answer.is_best && (
                  <div className="flex items-center mb-4 text-green-700 dark:text-green-400">
                    <Award className="w-5 h-5 mr-2" />
                    <span className="font-semibold">Mejor Respuesta</span>
                  </div>
                )}
                
                <Link 
                  to={`/question/${answer.question.id}`}
                  className="text-xl font-semibold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors mb-3 block"
                >
                  {answer.question.title}
                </Link>
                
                <div className="prose max-w-none mb-4 dark:prose-invert">
                  <p className="text-gray-700 dark:text-gray-300 line-clamp-3">
                    {answer.content}
                  </p>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                    <span>{formatTimeAgo(answer.created_at)}</span>
                    
                    {answer.vote_count > 0 && (
                      <div className="flex items-center text-green-600 dark:text-green-400">
                        <Star className="w-4 h-4 mr-1" />
                        <span>{answer.vote_count} votos</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    <Link to={`/edit-answer/${answer.id}`}>
                      <Button variant="outline" size="sm">
                        Editar
                      </Button>
                    </Link>
                    <Button 
                      variant="danger" 
                      size="sm"
                      onClick={() => handleDeleteAnswer(answer.id)}
                    >
                      Eliminar
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<MessageCircle className="w-16 h-16 text-gray-400" />}
            title="No has respondido a ninguna pregunta aún"
            description="Cuando respondas a preguntas, aparecerán aquí para que puedas gestionarlas."
            action={
              <Link to="/search?status=unanswered">
                <Button>
                  Buscar preguntas para responder
                </Button>
              </Link>
            }
          />
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full p-6">
            <div className="flex items-center mb-4 text-red-600 dark:text-red-400">
              <AlertTriangle className="w-6 h-6 mr-2" />
              <h3 className="text-lg font-semibold">Confirmar eliminación</h3>
            </div>
            
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              ¿Estás seguro de que deseas eliminar esta respuesta? Esta acción no se puede deshacer.
            </p>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={confirmDelete}
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
  );
}