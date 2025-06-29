import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  TrendingUp, 
  Clock, 
  Filter, 
  ArrowLeft,
  HelpCircle,
  SortAsc,
  SortDesc
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { QuestionCard } from '../components/questions/QuestionCard';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/ui/LoadingStates';
import { AuthRequiredButton } from '../components/ui/AuthRequiredButton';
import { supabase } from '../lib/supabase';
import { handleError } from '../utils/errorHandling';

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
  users: {
    username: string;
    level: number;
    avatar_url?: string | null;
  } | null;
  categories: {
    name: string;
    color: string;
    icon: string | null;
  } | null;
}

export function AllQuestions() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unanswered' | 'answered'>('all');
  const [sort, setSort] = useState<'newest' | 'popular'>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const itemsPerPage = 10;
  const type = searchParams.get('type') as 'trending' | 'recent' || 'recent';
  const title = type === 'trending' ? 'Preguntas Destacadas' : 'Preguntas Recientes';
  const icon = type === 'trending' ? TrendingUp : Clock;

  useEffect(() => {
    loadQuestions();
  }, [type, filter, sort, currentPage]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('questions')
        .select(`
          *,
          users:user_id (username, level, avatar_url),
          categories:category_id (name, color, icon)
        `, { count: 'exact' });

      // Apply filter
      if (filter === 'unanswered') {
        query = query.eq('is_answered', false);
      } else if (filter === 'answered') {
        query = query.eq('is_answered', true);
      }

      // Apply sort based on type
      if (type === 'trending') {
        query = query.order('view_count', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      // Apply pagination
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;
      
      setQuestions(data || []);
      setTotalQuestions(count || 0);
    } catch (error) {
      console.error('Error loading questions:', error);
      setError('Error al cargar las preguntas');
      handleError(error, 'AllQuestions.loadQuestions');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilter: 'all' | 'unanswered' | 'answered') => {
    if (!user && newFilter !== 'all') {
      setShowAuthModal(true);
      return;
    }
    setFilter(newFilter);
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalQuestions / itemsPerPage);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Link to="/" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 mr-4">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white flex items-center">
              {React.createElement(icon, { className: "mr-3 h-8 w-8 text-primary-500" })}
              {title}
            </h1>
          </div>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {type === 'trending' 
              ? 'Las preguntas más populares y vistas por la comunidad'
              : 'Las preguntas más recientes publicadas por la comunidad'}
          </p>
          
          {/* Filters */}
          <Card className="p-4 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <div className="flex space-x-2">
                  {/* "Todas" filter is always available */}
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      filter === 'all'
                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-glow'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    Todas
                  </button>
                  
                  {/* "Sin responder" and "Respondidas" filters only for authenticated users */}
                  {user ? (
                    <>
                      <button
                        onClick={() => setFilter('unanswered')}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                          filter === 'unanswered'
                            ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-glow'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                      >
                        Sin responder
                      </button>
                      <button
                        onClick={() => setFilter('answered')}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                          filter === 'answered'
                            ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-glow'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                      >
                        Respondidas
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleFilterChange('unanswered')}
                        className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                      >
                        Sin responder
                      </button>
                      <button
                        onClick={() => handleFilterChange('answered')}
                        className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                      >
                        Respondidas
                      </button>
                    </>
                  )}
                </div>
              </div>
              
              {type === 'recent' && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Ordenar por:</span>
                  <button
                    onClick={() => setSort(sort === 'newest' ? 'popular' : 'newest')}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                  >
                    <span>{sort === 'newest' ? 'Más recientes' : 'Más populares'}</span>
                    {sort === 'newest' ? <SortDesc className="w-4 h-4" /> : <SortAsc className="w-4 h-4" />}
                  </button>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Questions List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" text="Cargando preguntas..." />
          </div>
        ) : error ? (
          <ErrorState
            title="Error al cargar las preguntas"
            message={error}
            onRetry={loadQuestions}
            showRetry={true}
          />
        ) : questions.length > 0 ? (
          <div className="space-y-6 mb-8">
            {questions.map((question) => (
              <QuestionCard 
                key={question.id} 
                question={question} 
                showContent={true}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={React.createElement(icon, { className: "w-16 h-16 text-gray-400" })}
            title={`No hay preguntas ${filter === 'all' ? '' : filter === 'answered' ? 'respondidas' : 'sin responder'}`}
            description="Sé el primero en hacer una pregunta en esta categoría."
            action={
              user ? (
                <Link to="/ask">
                  <Button>
                    <HelpCircle className="w-4 h-4 mr-2" />
                    Hacer una Pregunta
                  </Button>
                </Link>
              ) : (
                <AuthRequiredButton
                  onClick={() => {}}
                  authMessage="Inicia sesión para hacer preguntas y participar en la comunidad"
                >
                  <HelpCircle className="w-4 h-4 mr-2" />
                  Hacer una Pregunta
                </AuthRequiredButton>
              )
            }
          />
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2 mt-8">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            
            <div className="flex space-x-1">
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === currentPage ? "primary" : "outline"}
                    onClick={() => setCurrentPage(pageNum)}
                    className="w-10 h-10 p-0"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Siguiente
            </Button>
          </div>
        )}
      </div>

      {/* Auth Modal for Filter Options */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowAuthModal(false)}>
          <div className="max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <Card className="p-6 text-center">
              <div className="bg-primary-100 dark:bg-primary-900/30 rounded-full p-4 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Filter className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Filtros avanzados
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Inicia sesión para acceder a filtros avanzados y personalizar tu experiencia.
              </p>
              <div className="flex gap-4 justify-center">
                <Link to="/login">
                  <Button>Iniciar Sesión</Button>
                </Link>
                <Link to="/register">
                  <Button variant="outline">Registrarse</Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}