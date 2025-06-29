import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Filter, 
  SortAsc, 
  SortDesc, 
  ArrowLeft,
  MessageCircle,
  Clock,
  TrendingUp
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { QuestionCard } from '../components/questions/QuestionCard';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/ui/LoadingStates';
import { BackButton } from '../components/ui/BackButton';
import { supabase } from '../lib/supabase';
import { handleError } from '../utils/errorHandling';

interface Category {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string;
  question_count: number;
}

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
    avatar_url: string | null;
  } | null;
  categories: {
    name: string;
    color: string;
    icon: string | null;
  } | null;
}

export function CategoryDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [category, setCategory] = useState<Category | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'answered' | 'unanswered'>('all');
  const [sort, setSort] = useState<'newest' | 'popular'>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    if (id) {
      loadCategory();
      loadQuestions();
    } else {
      setError('ID de categoría no válido');
      setLoading(false);
    }
  }, [id, filter, sort, currentPage]);

  const loadCategory = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      if (!data) {
        setError('Categoría no encontrada');
        return;
      }
      
      // Update question count to ensure it's accurate
      const { count } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', id);
      
      // If the count is different, update it
      if (count !== data.question_count) {
        const { error: updateError } = await supabase
          .from('categories')
          .update({ question_count: count || 0 })
          .eq('id', id);
        
        if (updateError) {
          console.warn('Error updating category question count:', updateError);
        }
        
        setCategory({
          ...data,
          question_count: count || 0
        });
      } else {
        setCategory(data);
      }
    } catch (error) {
      console.error('Error loading category:', error);
      setError('Error al cargar la categoría');
      handleError(error, 'CategoryDetail.loadCategory');
    } finally {
      setLoading(false);
    }
  };

  const loadQuestions = async () => {
    if (!id) return;

    try {
      setLoading(true);

      let query = supabase
        .from('questions')
        .select(`
          *,
          users:user_id (username, level, avatar_url),
          categories:category_id (name, color, icon)
        `, { count: 'exact' })
        .eq('category_id', id);

      // Apply filter
      if (filter === 'answered') {
        query = query.eq('is_answered', true);
      } else if (filter === 'unanswered') {
        query = query.eq('is_answered', false);
      }

      // Apply sorting
      if (sort === 'newest') {
        query = query.order('created_at', { ascending: false });
      } else if (sort === 'popular') {
        query = query.order('vote_count', { ascending: false });
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
      handleError(error, 'CategoryDetail.loadQuestions');
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(totalQuestions / itemsPerPage);

  if (loading && !category) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <LoadingSpinner size="lg" text="Cargando categoría..." />
        </div>
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ErrorState
            title="Categoría no encontrada"
            message={error || "La categoría que buscas no existe o ha sido eliminada."}
            action={
              <BackButton label="Volver a categorías" />
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Category Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <BackButton label="Volver a categorías" />
          </div>
          
          <div className="flex items-center">
            <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white flex items-center">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white mr-3"
                style={{ backgroundColor: category.color }}
              >
                {category.icon || <BookOpen className="w-6 h-6" />}
              </div>
              {category.name}
            </h1>
          </div>
          
          {category.description && (
            <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-3xl">
              {category.description}
            </p>
          )}
          
          <div className="flex flex-wrap items-center gap-4">
            <Badge variant="primary" size="md">
              <TrendingUp className="w-4 h-4 mr-1" />
              {category.question_count} preguntas
            </Badge>
            
            <Link to={`/ask?category=${category.id}`}>
              <Button>
                <MessageCircle className="w-4 h-4 mr-2" />
                Hacer pregunta en esta categoría
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
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
                    onClick={() => {
                      setFilter(filterOption.key as any);
                      setCurrentPage(1);
                    }}
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
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">Ordenar por:</span>
              <div className="flex space-x-2">
                {[
                  { key: 'newest', label: 'Más recientes', icon: Clock },
                  { key: 'popular', label: 'Más populares', icon: TrendingUp }
                ].map((sortOption) => {
                  const Icon = sortOption.icon;
                  return (
                    <button
                      key={sortOption.key}
                      onClick={() => {
                        setSort(sortOption.key as any);
                        setCurrentPage(1);
                      }}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center ${
                        sort === sortOption.key
                          ? 'bg-gradient-to-r from-secondary-500 to-secondary-600 text-white shadow-glow-secondary'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {sortOption.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>

        {/* Questions List */}
        <div className="mb-8">
          {loading && questions.length === 0 ? (
            <div className="space-y-4">
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
          ) : questions.length > 0 ? (
            <div className="space-y-4">
              {questions.map((question) => (
                <QuestionCard key={question.id} question={question} showContent={true} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<BookOpen className="w-16 h-16 text-gray-400" />}
              title="No hay preguntas en esta categoría"
              description={filter === 'all' 
                ? 'Sé el primero en hacer una pregunta en esta categoría.' 
                : `No hay preguntas ${filter === 'answered' ? 'respondidas' : 'sin responder'} en esta categoría.`
              }
              action={
                <Link to={`/ask?category=${category.id}`}>
                  <Button>
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Hacer una pregunta
                  </Button>
                </Link>
              }
            />
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2">
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
    </div>
  );
}