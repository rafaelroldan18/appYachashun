import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Search as SearchIcon, 
  Filter, 
  SortAsc, 
  SortDesc, 
  X, 
  ChevronDown,
  BookOpen,
  MessageCircle,
  Clock,
  TrendingUp
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { QuestionCard } from '../components/questions/QuestionCard';
import { LoadingSpinner, ErrorState, EmptyState, CardSkeleton } from '../components/ui/LoadingStates';
import { BackButton } from '../components/ui/BackButton';
import { supabase } from '../lib/supabase';
import { searchSchema, type SearchFormData } from '../utils/validation';
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
  } | null;
  categories: {
    name: string;
    color: string;
    icon: string | null;
  } | null;
}

interface Category {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string;
}

interface SearchFilters {
  query: string;
  category: string;
  educational_level: string;
  status: 'all' | 'answered' | 'unanswered';
  sort_by: 'relevance' | 'date' | 'votes' | 'answers';
  sort_order: 'asc' | 'desc';
}

export function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  const itemsPerPage = 10;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SearchFormData>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      query: searchParams.get('q') || '',
      category: searchParams.get('category') || '',
      educational_level: searchParams.get('level') || '',
      sort_by: (searchParams.get('sort') as any) || 'relevance',
    },
  });

  const [filters, setFilters] = useState<SearchFilters>({
    query: searchParams.get('q') || '',
    category: searchParams.get('category') || '',
    educational_level: searchParams.get('level') || '',
    status: (searchParams.get('status') as any) || 'all',
    sort_by: (searchParams.get('sort') as any) || 'relevance',
    sort_order: (searchParams.get('order') as any) || 'desc',
  });

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    // Only search if there are actual search criteria
    if (filters.query || filters.category || filters.educational_level || filters.status !== 'all') {
      setHasSearched(true);
      performSearch();
    } else {
      setHasSearched(false);
      setQuestions([]);
      setTotalResults(0);
    }
  }, [filters, currentPage]);

  const loadCategories = async () => {
    try {
      setCategoriesLoading(true);
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('question_count', { ascending: false });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
      handleError(error, 'Search.loadCategories');
    } finally {
      setCategoriesLoading(false);
    }
  };

  const performSearch = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('questions')
        .select(`
          *,
          users:user_id (username, level),
          categories:category_id (name, color, icon)
        `, { count: 'exact' });

      // Apply text search
      if (filters.query) {
        query = query.or(`title.ilike.%${filters.query}%,content.ilike.%${filters.query}%,tags.cs.{${filters.query}}`);
      }

      // Apply category filter
      if (filters.category) {
        query = query.eq('category_id', filters.category);
      }

      // Apply educational level filter
      if (filters.educational_level) {
        query = query.eq('educational_level', filters.educational_level);
      }

      // Apply status filter
      if (filters.status === 'answered') {
        query = query.eq('is_answered', true);
      } else if (filters.status === 'unanswered') {
        query = query.eq('is_answered', false);
      }

      // Apply sorting
      switch (filters.sort_by) {
        case 'date':
          query = query.order('created_at', { ascending: filters.sort_order === 'asc' });
          break;
        case 'votes':
          query = query.order('vote_count', { ascending: filters.sort_order === 'asc' });
          break;
        case 'answers':
          query = query.order('answer_count', { ascending: filters.sort_order === 'asc' });
          break;
        default: // relevance
          query = query.order('view_count', { ascending: false })
                      .order('vote_count', { ascending: false });
          break;
      }

      // Apply pagination
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      setQuestions(data || []);
      setTotalResults(count || 0);
    } catch (error) {
      console.error('Error performing search:', error);
      setError('Error al realizar la búsqueda');
      handleError(error, 'Search.performSearch');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (data: SearchFormData) => {
    const newFilters = {
      ...filters,
      query: data.query || '',
      category: data.category || '',
      educational_level: data.educational_level || '',
      sort_by: data.sort_by || 'relevance',
    };

    setFilters(newFilters);
    setCurrentPage(1);
    updateURL(newFilters);
  };

  const updateFilters = (newFilters: Partial<SearchFilters>) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);
    setCurrentPage(1);
    updateURL(updated);
  };

  const updateURL = (filters: SearchFilters) => {
    const params = new URLSearchParams();
    
    if (filters.query) params.set('q', filters.query);
    if (filters.category) params.set('category', filters.category);
    if (filters.educational_level) params.set('level', filters.educational_level);
    if (filters.status !== 'all') params.set('status', filters.status);
    if (filters.sort_by !== 'relevance') params.set('sort', filters.sort_by);
    if (filters.sort_order !== 'desc') params.set('order', filters.sort_order);

    setSearchParams(params);
  };

  const clearFilters = () => {
    const clearedFilters = {
      query: '',
      category: '',
      educational_level: '',
      status: 'all' as const,
      sort_by: 'relevance' as const,
      sort_order: 'desc' as const,
    };
    
    setFilters(clearedFilters);
    setCurrentPage(1);
    setValue('query', '');
    setValue('category', '');
    setValue('educational_level', '');
    setValue('sort_by', 'relevance');
    setSearchParams(new URLSearchParams());
    setHasSearched(false);
  };

  const totalPages = Math.ceil(totalResults / itemsPerPage);

  const getEducationalLevelLabel = (level: string) => {
    const labels = {
      primaria: 'Primaria',
      secundaria: 'Secundaria',
      universidad: 'Universidad',
      otro: 'Otro'
    };
    return labels[level as keyof typeof labels] || level;
  };

  const getSortLabel = (sortBy: string) => {
    const labels = {
      relevance: 'Relevancia',
      date: 'Fecha',
      votes: 'Votos',
      answers: 'Respuestas'
    };
    return labels[sortBy as keyof typeof labels] || sortBy;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          {/* Back button */}
          <div className="mb-4">
            <BackButton label="Atrás" />
          </div>
          
          <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <SearchIcon className="mr-3 h-8 w-8 text-primary-500" />
            Buscar Preguntas
          </h1>
          
          {/* Search Form */}
          <Card className="p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      {...register('query')}
                      type="text"
                      placeholder="Buscar por título, contenido o etiquetas..."
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  {errors.query && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.query.message}</p>
                  )}
                </div>
                
                <Button type="submit" loading={loading} className="px-8">
                  Buscar
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filtros
                  <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                </Button>
              </div>

              {/* Advanced Filters */}
              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Categoría
                    </label>
                    {categoriesLoading ? (
                      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    ) : (
                      <select
                        {...register('category')}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      >
                        <option value="">Todas las categorías</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nivel Educativo
                    </label>
                    <select
                      {...register('educational_level')}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Todos los niveles</option>
                      <option value="primaria">Primaria</option>
                      <option value="secundaria">Secundaria</option>
                      <option value="universidad">Universidad</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Estado
                    </label>
                    <select
                      value={filters.status}
                      onChange={(e) => updateFilters({ status: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="all">Todas</option>
                      <option value="answered">Respondidas</option>
                      <option value="unanswered">Sin responder</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Ordenar por
                    </label>
                    <select
                      {...register('sort_by')}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="relevance">Relevancia</option>
                      <option value="date">Fecha</option>
                      <option value="votes">Votos</option>
                      <option value="answers">Respuestas</option>
                    </select>
                  </div>
                </div>
              )}
            </form>
          </Card>
        </div>

        {/* Active Filters */}
        {(filters.query || filters.category || filters.educational_level || filters.status !== 'all') && (
          <div className="mb-6">
            <div className="flex items-center flex-wrap gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filtros activos:</span>
              
              {filters.query && (
                <Badge variant="primary" className="flex items-center">
                  <SearchIcon className="w-3 h-3 mr-1" />
                  "{filters.query}"
                  <button
                    onClick={() => updateFilters({ query: '' })}
                    className="ml-2 hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}

              {filters.category && (
                <Badge variant="secondary" className="flex items-center">
                  <BookOpen className="w-3 h-3 mr-1" />
                  {categories.find(c => c.id === filters.category)?.name}
                  <button
                    onClick={() => updateFilters({ category: '' })}
                    className="ml-2 hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}

              {filters.educational_level && (
                <Badge variant="info" className="flex items-center">
                  {getEducationalLevelLabel(filters.educational_level)}
                  <button
                    onClick={() => updateFilters({ educational_level: '' })}
                    className="ml-2 hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}

              {filters.status !== 'all' && (
                <Badge variant="warning" className="flex items-center">
                  <MessageCircle className="w-3 h-3 mr-1" />
                  {filters.status === 'answered' ? 'Respondidas' : 'Sin responder'}
                  <button
                    onClick={() => updateFilters({ status: 'all' })}
                    className="ml-2 hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-red-600 hover:text-red-700"
              >
                <X className="w-4 h-4 mr-1" />
                Limpiar filtros
              </Button>
            </div>
          </div>
        )}

        {/* Results Header */}
        {hasSearched && (
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {loading ? 'Buscando...' : 
                 totalResults > 0 ? (
                  <>
                    {totalResults.toLocaleString()} resultado{totalResults !== 1 ? 's' : ''} encontrado{totalResults !== 1 ? 's' : ''}
                  </>
                ) : (
                  'No se encontraron resultados'
                )}
              </h2>
              
              {loading && (
                <LoadingSpinner size="sm" />
              )}
            </div>

            {totalResults > 0 && !loading && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Ordenado por:</span>
                <Badge variant="outline" className="flex items-center">
                  {filters.sort_by === 'date' && <Clock className="w-3 h-3 mr-1" />}
                  {filters.sort_by === 'votes' && <TrendingUp className="w-3 h-3 mr-1" />}
                  {filters.sort_by === 'answers' && <MessageCircle className="w-3 h-3 mr-1" />}
                  {getSortLabel(filters.sort_by)}
                  <button
                    onClick={() => updateFilters({ 
                      sort_order: filters.sort_order === 'asc' ? 'desc' : 'asc' 
                    })}
                    className="ml-2 hover:text-primary-600"
                  >
                    {filters.sort_order === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />}
                  </button>
                </Badge>
              </div>
            )}
          </div>
        )}

        {/* Results */}
        {error ? (
          <ErrorState
            title="Error en la búsqueda"
            message={error}
            onRetry={() => {
              setError(null);
              if (hasSearched) performSearch();
            }}
            showRetry={true}
          />
        ) : !hasSearched ? (
          <EmptyState
            icon={<SearchIcon className="w-16 h-16 text-gray-400" />}
            title="Busca preguntas en la comunidad"
            description="Usa el formulario de arriba para buscar preguntas por título, contenido, categoría o etiquetas."
            action={
              <Button onClick={() => setValue('query', 'matemáticas')}>
                Buscar "matemáticas"
              </Button>
            }
          />
        ) : loading ? (
          <CardSkeleton count={5} />
        ) : questions.length > 0 ? (
          <>
            <div className="space-y-4 mb-8">
              {questions.map((question) => (
                <QuestionCard key={question.id} question={question} showContent={true} />
              ))}
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
          </>
        ) : (
          <EmptyState
            icon={<SearchIcon className="w-16 h-16 text-gray-400" />}
            title="No se encontraron resultados"
            description="Intenta ajustar tus filtros de búsqueda o usar términos diferentes."
            action={
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Sugerencias:</p>
                  <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                    <li>• Verifica la ortografía de las palabras</li>
                    <li>• Usa términos más generales</li>
                    <li>• Prueba con diferentes categorías</li>
                    <li>• Elimina algunos filtros</li>
                  </ul>
                </div>
                <Button onClick={clearFilters} variant="outline">
                  Limpiar todos los filtros
                </Button>
              </div>
            }
          />
        )}
      </div>
    </div>
  );
}