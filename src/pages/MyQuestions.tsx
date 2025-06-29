import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Filter, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { QuestionCard } from '../components/questions/QuestionCard';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/ui/LoadingStates';
import { supabase } from '../lib/supabase';
import { handleError, showSuccess, showLoading, dismissToast } from '../utils/errorHandling';

interface Question {
  id: string;
  title: string;
  content: string;
  tags: string[];
  educational_level: string;
  is_answered: boolean;
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
  };
  categories: {
    name: string;
    color: string;
    icon: string | null;
  } | null;
}

export function MyQuestions() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'answered' | 'unanswered'>('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user) {
      loadQuestions();
    }
  }, [user, filter]);

  const loadQuestions = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('questions')
        .select(`
          *,
          users:user_id (username, level, avatar_url),
          categories:category_id (name, color, icon)
        `)
        .eq('user_id', user.id);

      if (filter === 'answered') {
        query = query.eq('is_answered', true);
      } else if (filter === 'unanswered') {
        query = query.eq('is_answered', false);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      setQuestions(data || []);
    } catch (error) {
      console.error('Error loading questions:', error);
      setError('Error al cargar tus preguntas');
      handleError(error, 'MyQuestions.loadQuestions');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!user) return;

    setShowDeleteConfirm(id);
  };

  const confirmDelete = async () => {
    if (!showDeleteConfirm || !user) return;

    const toastId = showLoading('Eliminando pregunta...');
    setDeleting(true);

    try {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', showDeleteConfirm)
        .eq('user_id', user.id);

      if (error) throw error;

      dismissToast(toastId);
      showSuccess('Pregunta eliminada correctamente');
      
      // Update local state
      setQuestions(questions.filter(q => q.id !== showDeleteConfirm));
    } catch (error) {
      dismissToast(toastId);
      handleError(error, 'MyQuestions.confirmDelete');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(null);
    }
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
            <BookOpen className="mr-3 h-8 w-8 text-primary-500" />
            Mis Preguntas
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Gestiona las preguntas que has publicado en la plataforma
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <div className="flex space-x-2">
              {[
                { key: 'all', label: 'Todas' },
                { key: 'answered', label: 'Respondidas' },
                { key: 'unanswered', label: 'Sin responder' }
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

          <Link to="/ask">
            <Button>
              Hacer nueva pregunta
            </Button>
          </Link>
        </div>

        {/* Questions List */}
        {loading ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                <div className="space-y-2 mb-4">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
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
            title="Error al cargar tus preguntas"
            message={error}
            onRetry={loadQuestions}
            showRetry={true}
          />
        ) : questions.length > 0 ? (
          <div className="space-y-6">
            {questions.map((question) => (
              <QuestionCard 
                key={question.id} 
                question={question} 
                showContent={true}
                showActions={true}
                onDelete={handleDeleteQuestion}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<BookOpen className="w-16 h-16 text-gray-400" />}
            title="No has hecho preguntas aún"
            description="Cuando hagas preguntas, aparecerán aquí para que puedas gestionarlas."
            action={
              <Link to="/ask">
                <Button>
                  Hacer mi primera pregunta
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
              ¿Estás seguro de que deseas eliminar esta pregunta? Esta acción no se puede deshacer y se eliminarán todas las respuestas asociadas.
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