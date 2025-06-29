import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Clock, HelpCircle, Users, Award, BookOpen, Search, ArrowRight, Filter, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { QuestionCard } from '../components/questions/QuestionCard';
import { FadeIn } from '../components/ui/FadeIn';
import { LoadingSpinner, ErrorState, EmptyState, CardSkeleton } from '../components/ui/LoadingStates';
import { QuickActions } from '../components/ui/QuickActions';
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
  question_count: number;
}

interface Stats {
  totalQuestions: number;
  totalAnswers: number;
  totalUsers: number;
  answeredToday: number;
}

export function Home() {
  const { user } = useAuth();
  const [featuredQuestions, setFeaturedQuestions] = useState<Question[]>([]);
  const [recentQuestions, setRecentQuestions] = useState<Question[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalQuestions: 0,
    totalAnswers: 0,
    totalUsers: 0,
    answeredToday: 0
  });
  const [loading, setLoading] = useState(true);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [recentLoading, setRecentLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unanswered' | 'answered'>('all');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAllFeatured, setShowAllFeatured] = useState(false);
  const [showAllRecent, setShowAllRecent] = useState(false);

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all data in parallel
      await Promise.all([
        loadFeaturedQuestions(),
        loadRecentQuestions(),
        loadCategories(),
        loadStats()
      ]);
    } catch (error) {
      console.error('Error loading home data:', error);
      setError('Error al cargar los datos');
      handleError(error, 'Home.loadData');
    } finally {
      setLoading(false);
    }
  };

  const loadFeaturedQuestions = async () => {
    try {
      setFeaturedLoading(true);

      let query = supabase
        .from('questions')
        .select(`
          *,
          users:user_id (username, level),
          categories:category_id (name, color, icon)
        `)
        .order('view_count', { ascending: false });

      if (filter === 'unanswered') {
        query = query.eq('is_answered', false);
      } else if (filter === 'answered') {
        query = query.eq('is_answered', true);
      }

      // Get more questions if showing all
      const limit = showAllFeatured ? 20 : 5;
      query = query.limit(limit);

      const { data, error } = await query;

      if (error) throw error;
      setFeaturedQuestions(data || []);
    } catch (error) {
      console.error('Error loading featured questions:', error);
      handleError(error, 'Home.loadFeaturedQuestions');
    } finally {
      setFeaturedLoading(false);
    }
  };

  const loadRecentQuestions = async () => {
    try {
      setRecentLoading(true);

      let query = supabase
        .from('questions')
        .select(`
          *,
          users:user_id (username, level),
          categories:category_id (name, color, icon)
        `)
        .order('created_at', { ascending: false });

      if (filter === 'unanswered') {
        query = query.eq('is_answered', false);
      } else if (filter === 'answered') {
        query = query.eq('is_answered', true);
      }

      // Get more questions if showing all
      const limit = showAllRecent ? 20 : 8;
      query = query.limit(limit);

      const { data, error } = await query;

      if (error) throw error;
      setRecentQuestions(data || []);
    } catch (error) {
      console.error('Error loading recent questions:', error);
      handleError(error, 'Home.loadRecentQuestions');
    } finally {
      setRecentLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      setCategoriesLoading(true);

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('question_count', { ascending: false })
        .limit(6);

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
      handleError(error, 'Home.loadCategories');
    } finally {
      setCategoriesLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const [
        { count: totalQuestions },
        { count: totalAnswers },
        { count: totalUsers }
      ] = await Promise.all([
        supabase.from('questions').select('*', { count: 'exact', head: true }),
        supabase.from('answers').select('*', { count: 'exact', head: true }),
        supabase.from('users').select('*', { count: 'exact', head: true })
      ]);

      // Get today's answered questions count
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: answeredToday } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .eq('is_answered', true)
        .gte('updated_at', today.toISOString());

      setStats({
        totalQuestions: totalQuestions || 0,
        totalAnswers: totalAnswers || 0,
        totalUsers: totalUsers || 0,
        answeredToday: answeredToday || 0
      });
    } catch (error) {
      console.error('Error loading stats:', error);
      handleError(error, 'Home.loadStats');
    }
  };

  const handleFilterChange = (newFilter: 'all' | 'unanswered' | 'answered') => {
    if (!user && newFilter !== 'all') {
      setShowAuthModal(true);
      return;
    }
    setFilter(newFilter);
  };

  const toggleShowAllFeatured = () => {
    setShowAllFeatured(!showAllFeatured);
    if (!showAllFeatured) {
      loadFeaturedQuestions();
    }
  };

  const toggleShowAllRecent = () => {
    setShowAllRecent(!showAllRecent);
    if (!showAllRecent) {
      loadRecentQuestions();
    }
  };

  if (loading && featuredLoading && recentLoading && categoriesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Cargando contenido..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <ErrorState
          title="Error al cargar la página"
          message={error}
          onRetry={loadData}
          showRetry={true}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 text-white py-20 overflow-hidden">
        <div className="absolute inset-0 bg-pattern-grid opacity-10"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <FadeIn delay={0.1}>
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="inline-flex items-center bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">Aprende colaborativamente</span>
              </motion.div>
            </FadeIn>

            <FadeIn delay={0.2}>
              <div className="flex justify-center mb-6">
                <img src="/2.png" alt="Yachashun Logo" className="h-32 w-32" />
              </div>
              <h1 className="text-4xl md:text-6xl font-display font-bold mb-6">
                Aprende{' '}
                <motion.span
                  className="bg-gradient-to-r from-accent-300 to-secondary-300 bg-clip-text text-transparent"
                  animate={{ 
                    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  Colaborativamente
                </motion.span>
              </h1>
            </FadeIn>

            <FadeIn delay={0.3}>
              <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto leading-relaxed">
                Únete a nuestra comunidad educativa donde estudiantes se ayudan mutuamente 
                a resolver dudas y construir conocimiento juntos.
              </p>
            </FadeIn>

            <FadeIn delay={0.4}>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {user ? (
                  <Link to="/ask">
                    <Button 
                      size="lg" 
                      variant="accent" 
                      className="text-lg px-8 py-4"
                    >
                      <HelpCircle className="mr-2 h-5 w-5" />
                      Hacer una Pregunta
                    </Button>
                  </Link>
                ) : (
                  <AuthRequiredButton
                    onClick={() => {}}
                    size="lg"
                    variant="accent"
                    className="text-lg px-8 py-4"
                    authMessage="Inicia sesión para hacer preguntas y participar en la comunidad"
                  >
                    <HelpCircle className="mr-2 h-5 w-5" />
                    Hacer una Pregunta
                  </AuthRequiredButton>
                )}
                <Link to="/categories">
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="text-lg px-8 py-4 border-white/30 text-white hover:bg-white/10 backdrop-blur-sm"
                  >
                    <Search className="mr-2 h-5 w-5" />
                    Explorar Categorías
                  </Button>
                </Link>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-12">
            {/* Filter Controls */}
            <FadeIn>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <div className="flex space-x-2">
                    {/* "Todas" filter is always available */}
                    <motion.button
                      onClick={() => setFilter('all')}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                        filter === 'all'
                          ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-glow'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      Todas
                    </motion.button>
                    
                    {/* "Sin responder" and "Respondidas" filters only for authenticated users */}
                    {user ? (
                      <>
                        <motion.button
                          onClick={() => setFilter('unanswered')}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                            filter === 'unanswered'
                              ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-glow'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                          }`}
                        >
                          Sin responder
                        </motion.button>
                        <motion.button
                          onClick={() => setFilter('answered')}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                            filter === 'answered'
                              ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-glow'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                          }`}
                        >
                          Respondidas
                        </motion.button>
                      </>
                    ) : (
                      <>
                        <motion.button
                          onClick={() => handleFilterChange('unanswered')}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                        >
                          Sin responder
                        </motion.button>
                        <motion.button
                          onClick={() => handleFilterChange('answered')}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                        >
                          Respondidas
                        </motion.button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </FadeIn>

            {/* Featured Questions */}
            <section>
              <FadeIn>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-white flex items-center">
                    <TrendingUp className="mr-3 h-6 w-6 text-primary-500" />
                    Preguntas Destacadas
                  </h2>
                  <Link to="/trending">
                    <Button
                      variant="ghost"
                      className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium flex items-center transition-colors duration-200"
                    >
                      Ver todas <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </FadeIn>
              
              {featuredLoading ? (
                <CardSkeleton count={3} />
              ) : featuredQuestions.length > 0 ? (
                <div className="space-y-6">
                  {featuredQuestions.map((question, index) => (
                    <FadeIn key={question.id} delay={index * 0.1}>
                      <QuestionCard 
                        question={question} 
                        showContent={true}
                        featured={true}
                      />
                    </FadeIn>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<TrendingUp className="w-12 h-12 text-gray-400" />}
                  title="No hay preguntas destacadas"
                  description={filter === 'all' ? 
                    'Aún no hay preguntas destacadas. ¡Sé el primero en hacer una pregunta!' :
                    `No hay preguntas ${filter === 'answered' ? 'respondidas' : 'sin responder'} destacadas.`
                  }
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
            </section>

            {/* Recent Questions */}
            <section>
              <FadeIn>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-white flex items-center">
                    <Clock className="mr-3 h-6 w-6 text-secondary-500" />
                    Preguntas Recientes
                  </h2>
                  <Link to="/recent">
                    <Button
                      variant="ghost"
                      className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium flex items-center transition-colors duration-200"
                    >
                      Ver todas <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </FadeIn>
              
              {recentLoading ? (
                <CardSkeleton count={4} />
              ) : recentQuestions.length > 0 ? (
                <div className="space-y-6">
                  {recentQuestions.map((question, index) => (
                    <FadeIn key={question.id} delay={index * 0.1}>
                      <QuestionCard question={question} />
                    </FadeIn>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<Clock className="w-12 h-12 text-gray-400" />}
                  title="No hay preguntas recientes"
                  description={filter === 'all' ? 
                    'Aún no hay preguntas recientes. ¡Sé el primero en hacer una pregunta!' :
                    `No hay preguntas ${filter === 'answered' ? 'respondidas' : 'sin responder'} recientes.`
                  }
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
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Categories */}
            <Card animated>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Categorías Populares</h3>
              {categoriesLoading ? (
                <div className="space-y-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-3 p-3 animate-pulse">
                      <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-1"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : categories.length > 0 ? (
                <div className="space-y-4">
                  {categories.map((category, index) => (
                    <FadeIn key={category.id} delay={index * 0.05}>
                      <motion.div whileHover={{ x: 4 }} transition={{ duration: 0.2 }}>
                        <Link
                          to={`/category/${category.id}`}
                          className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 group"
                        >
                          <div className="flex items-center space-x-3">
                            <div 
                              className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm shadow-soft"
                              style={{ backgroundColor: category.color }}
                            >
                              {category.icon || '📚'}
                            </div>
                            <span className="font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200">
                              {category.name}
                            </span>
                          </div>
                          <Badge variant="secondary" size="sm">
                            {category.question_count}
                          </Badge>
                        </Link>
                      </motion.div>
                    </FadeIn>
                  ))}
                  <div className="mt-6">
                    <Link to="/categories">
                      <Button variant="outline" className="w-full">
                        Ver todas las categorías
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <EmptyState
                  icon={<BookOpen className="w-8 h-8 text-gray-400" />}
                  title="No hay categorías"
                  description="Aún no se han creado categorías."
                  className="py-4"
                />
              )}
            </Card>

            {/* Quick Actions */}
            <QuickActions />

            {/* Tips */}
            <Card animated delay={0.2} className="bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 border-primary-200 dark:border-primary-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                <motion.span
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="mr-2"
                >
                  💡
                </motion.span>
                Consejo del día
              </h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                Para obtener mejores respuestas, incluye detalles específicos en tu pregunta 
                y explica qué has intentado hasta ahora.
              </p>
            </Card>
          </div>
        </div>
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