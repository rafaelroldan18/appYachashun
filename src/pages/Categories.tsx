import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Search, TrendingUp, Clock, Users, MessageCircle } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { LoadingSpinner, ErrorState, EmptyState, CardSkeleton } from '../components/ui/LoadingStates';
import { supabase } from '../lib/supabase';
import { handleError } from '../utils/errorHandling';

interface Category {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string;
  question_count: number;
  created_at: string;
}

interface RecentQuestion {
  id: string;
  title: string;
  created_at: string;
  answer_count: number;
  is_answered: boolean;
}

export function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [recentQuestions, setRecentQuestions] = useState<{ [key: string]: RecentQuestion[] }>({});
  const [loading, setLoading] = useState(true);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryStats, setCategoryStats] = useState<{[key: string]: {totalAnswers: number}}>({});

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load categories with question count
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('question_count', { ascending: false });

      if (error) throw error;
      
      // Ensure we have the latest question counts
      const updatedCategories = await updateCategoryCounts(data || []);
      setCategories(updatedCategories);

      // Load recent questions for each category
      if (updatedCategories && updatedCategories.length > 0) {
        await loadRecentQuestions(updatedCategories);
        await loadCategoryStats(updatedCategories);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      setError('Error al cargar las categorías');
      handleError(error, 'Categories.loadCategories');
    } finally {
      setLoading(false);
    }
  };

  // Function to update category question counts
  const updateCategoryCounts = async (categoriesData: Category[]): Promise<Category[]> => {
    try {
      // For each category, get the actual count of questions
      const updatedCategories = await Promise.all(
        categoriesData.map(async (category) => {
          const { count, error } = await supabase
            .from('questions')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', category.id);
          
          if (error) {
            console.warn(`Error getting count for category ${category.id}:`, error);
            return category;
          }
          
          // Update the question_count if it's different
          if (count !== category.question_count) {
            const { error: updateError } = await supabase
              .from('categories')
              .update({ question_count: count || 0 })
              .eq('id', category.id);
            
            if (updateError) {
              console.warn(`Error updating count for category ${category.id}:`, updateError);
            }
            
            return { ...category, question_count: count || 0 };
          }
          
          return category;
        })
      );
      
      return updatedCategories;
    } catch (error) {
      console.error('Error updating category counts:', error);
      return categoriesData;
    }
  };

  // Function to load total answers for each category
  const loadCategoryStats = async (categoriesData: Category[]) => {
    try {
      const statsPromises = categoriesData.map(async (category) => {
        try {
          // Get all questions for this category
          const { data: questions, error: questionsError } = await supabase
            .from('questions')
            .select('id')
            .eq('category_id', category.id);
            
          if (questionsError) throw questionsError;
          
          if (!questions || questions.length === 0) {
            return { categoryId: category.id, totalAnswers: 0 };
          }
          
          // Get total answers for these questions
          const questionIds = questions.map(q => q.id);
          const { count, error: answersError } = await supabase
            .from('answers')
            .select('*', { count: 'exact', head: true })
            .in('question_id', questionIds);
            
          if (answersError) throw answersError;
          
          return { categoryId: category.id, totalAnswers: count || 0 };
        } catch (error) {
          console.warn(`Failed to load stats for category ${category.id}:`, error);
          return { categoryId: category.id, totalAnswers: 0 };
        }
      });
      
      const statsResults = await Promise.allSettled(statsPromises);
      const statsMap = statsResults.reduce((acc, result) => {
        if (result.status === 'fulfilled') {
          const { categoryId, totalAnswers } = result.value;
          acc[categoryId] = { totalAnswers };
        }
        return acc;
      }, {} as { [key: string]: {totalAnswers: number} });
      
      setCategoryStats(statsMap);
    } catch (error) {
      console.error('Error loading category stats:', error);
    }
  };

  const loadRecentQuestions = async (categoriesData: Category[]) => {
    try {
      setQuestionsLoading(true);

      const questionsPromises = categoriesData.map(async (category) => {
        try {
          const { data, error } = await supabase
            .from('questions')
            .select('id, title, created_at, answer_count, is_answered')
            .eq('category_id', category.id)
            .order('created_at', { ascending: false })
            .limit(3);

          if (error) throw error;
          return { categoryId: category.id, questions: data || [] };
        } catch (error) {
          console.warn(`Failed to load questions for category ${category.id}:`, error);
          return { categoryId: category.id, questions: [] };
        }
      });

      const questionsResults = await Promise.allSettled(questionsPromises);
      const questionsMap = questionsResults.reduce((acc, result) => {
        if (result.status === 'fulfilled') {
          const { categoryId, questions } = result.value;
          acc[categoryId] = questions;
        }
        return acc;
      }, {} as { [key: string]: RecentQuestion[] });

      setRecentQuestions(questionsMap);
    } catch (error) {
      console.error('Error loading recent questions:', error);
      // Don't set error state for questions, just log it
    } finally {
      setQuestionsLoading(false);
    }
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Hace menos de 1 hora';
    if (diffInHours < 24) return `Hace ${diffInHours} horas`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `Hace ${diffInDays} días`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-64 mx-auto mb-4 animate-pulse"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-96 mx-auto animate-pulse"></div>
          </div>
          <div className="max-w-md mx-auto mb-8">
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
          <CardSkeleton count={6} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ErrorState
            title="Error al cargar categorías"
            message={error}
            onRetry={loadCategories}
            showRetry={true}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-display font-bold text-gray-900 dark:text-white mb-4 flex items-center justify-center">
            <BookOpen className="mr-3 h-10 w-10 text-primary-500" />
            Categorías de Estudio
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Explora las diferentes materias y encuentra preguntas específicas para tu área de estudio
          </p>
        </div>

        {/* Search */}
        <div className="max-w-md mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Buscar categorías..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        {/* Categories Grid */}
        {filteredCategories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCategories.map((category) => (
              <Card key={category.id} hover className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl"
                      style={{ backgroundColor: category.color }}
                    >
                      {category.icon || '📚'}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {category.name}
                      </h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="primary" size="sm">
                          {category.question_count} preguntas
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {category.description && (
                  <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {category.description}
                  </p>
                )}

                {/* Recent Questions */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    Preguntas Recientes
                  </h4>
                  
                  {questionsLoading ? (
                    <div className="space-y-2">
                      {[...Array(2)].map((_, i) => (
                        <div key={i} className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg animate-pulse">
                          <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded mb-1"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-2/3"></div>
                        </div>
                      ))}
                    </div>
                  ) : recentQuestions[category.id]?.length > 0 ? (
                    <div className="space-y-2">
                      {recentQuestions[category.id].slice(0, 2).map((question) => (
                        <Link
                          key={question.id}
                          to={`/question/${question.id}`}
                          className="block p-2 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                        >
                          <p className="text-sm text-gray-900 dark:text-white line-clamp-1 mb-1">
                            {question.title}
                          </p>
                          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                            <span>{formatTimeAgo(question.created_at)}</span>
                            <div className="flex items-center space-x-2">
                              {question.is_answered && (
                                <Badge variant="success" size="sm">Respondida</Badge>
                              )}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                      No hay preguntas recientes
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <Link to={`/category/${category.id}`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      <Search className="w-4 h-4 mr-2" />
                      Explorar
                    </Button>
                  </Link>
                  <Link to={`/ask?category=${category.id}`}>
                    <Button variant="primary" size="sm">
                      Preguntar
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        ) : searchTerm ? (
          <EmptyState
            icon={<Search className="w-16 h-16 text-gray-400" />}
            title="No se encontraron categorías"
            description="Intenta con un término de búsqueda diferente."
            action={
              <Button onClick={() => setSearchTerm('')} variant="outline">
                Limpiar búsqueda
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={<BookOpen className="w-16 h-16 text-gray-400" />}
            title="No hay categorías disponibles"
            description="Aún no se han creado categorías en la plataforma."
          />
        )}

        {/* Stats */}
        {categories.length > 0 && (
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 text-center">
              <BookOpen className="w-8 h-8 text-primary-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {categories.length}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Categorías Disponibles</div>
            </Card>
            
            <Card className="p-6 text-center">
              <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {categories.reduce((sum, cat) => sum + cat.question_count, 0).toLocaleString()}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Preguntas Totales</div>
            </Card>
            
            <Card className="p-6 text-center">
              <MessageCircle className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {Object.values(categoryStats).reduce((sum, stat) => sum + stat.totalAnswers, 0).toLocaleString()}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Respuestas Totales</div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}