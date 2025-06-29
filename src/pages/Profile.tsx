import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  User, 
  Award, 
  BookOpen, 
  MessageCircle, 
  Calendar, 
  Edit,
  Star,
  TrendingUp,
  Target,
  Trophy,
  Medal,
  Crown,
  MapPin,
  Mail,
  Cake,
  Briefcase,
  School,
  Heart,
  Settings,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { QuestionCard } from '../components/questions/QuestionCard';
import { MessageButton } from '../components/messaging/MessageButton';
import { PointsDisplay } from '../components/ui/PointsDisplay';
import { LoadingSpinner, ErrorState, EmptyState, CardSkeleton } from '../components/ui/LoadingStates';
import { BackButton } from '../components/ui/BackButton';
import { supabase } from '../lib/supabase';
import { handleError } from '../utils/errorHandling';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar_url: string | null;
  bio: string | null;
  level: number;
  points: number;
  role: string;
  questions_asked: number;
  answers_given: number;
  best_answers: number;
  reputation_score: number;
  created_at: string;
  updated_at: string;
  location?: string | null;
  website?: string | null;
  education?: string | null;
  occupation?: string | null;
  interests?: string[] | null;
  full_name?: string | null;
}

interface UserBadge {
  id: string;
  badge_id: string;
  earned_at: string;
  badges: {
    name: string;
    description: string;
    icon: string;
    color: string;
    rarity: string;
  };
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
  image_url?: string | null;
  users: {
    username: string;
    level: number;
    avatar_url?: string | null;
  };
  categories: {
    name: string;
    color: string;
    icon: string | null;
  } | null;
}

interface Answer {
  id: string;
  content: string;
  vote_count: number;
  is_best: boolean;
  created_at: string;
  question: {
    id: string;
    title: string;
  };
}

// Helper function to validate UUID format
const isValidUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

export function Profile() {
  const { userId } = useParams<{ userId?: string }>();
  const { user: currentUser, userProfile: currentUserProfile } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [answersLoading, setAnswersLoading] = useState(true);
  const [badgesLoading, setBadgesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'questions' | 'answers' | 'badges'>('questions');

  // Validate userId and determine target user
  const getTargetUserId = (): string | null => {
    // If no userId in URL, use current user's ID
    if (!userId) {
      return currentUser?.id || null;
    }

    // Handle special routes like 'edit'
    if (userId === 'edit') {
      // Redirect to profile edit page (this should be a separate route)
      navigate('/profile/settings');
      return null;
    }

    // Validate UUID format
    if (!isValidUUID(userId)) {
      return null; // Invalid UUID will trigger "user not found" state
    }

    return userId;
  };

  const targetUserId = getTargetUserId();
  const isOwnProfile = !userId || userId === currentUser?.id;

  useEffect(() => {
    if (targetUserId) {
      loadProfile();
      loadBadges();
      loadQuestions();
      loadAnswers();
    } else if (userId && userId !== 'edit') {
      // Invalid UUID case
      setLoading(false);
    }
  }, [targetUserId]);

  const loadProfile = async () => {
    if (!targetUserId) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', targetUserId)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        setError('Usuario no encontrado');
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
      setError('Error al cargar el perfil');
      handleError(error, 'Profile.loadProfile');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const loadBadges = async () => {
    if (!targetUserId) return;

    try {
      setBadgesLoading(true);

      const { data, error } = await supabase
        .from('user_badges')
        .select(`
          *,
          badges (name, description, icon, color, rarity)
        `)
        .eq('user_id', targetUserId)
        .order('earned_at', { ascending: false });

      if (error) throw error;
      setBadges(data || []);
    } catch (error) {
      console.error('Error loading badges:', error);
      handleError(error, 'Profile.loadBadges');
    } finally {
      setBadgesLoading(false);
    }
  };

  const loadQuestions = async () => {
    if (!targetUserId) return;

    try {
      setQuestionsLoading(true);

      const { data, error } = await supabase
        .from('questions')
        .select(`
          id,
          title,
          content,
          tags,
          educational_level,
          is_answered,
          view_count,
          vote_count,
          answer_count,
          created_at,
          image_url,
          users:user_id (username, level, avatar_url),
          categories:category_id (name, color, icon)
        `)
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setQuestions(data || []);
    } catch (error) {
      console.error('Error loading questions:', error);
      handleError(error, 'Profile.loadQuestions');
    } finally {
      setQuestionsLoading(false);
    }
  };

  const loadAnswers = async () => {
    if (!targetUserId) return;

    try {
      setAnswersLoading(true);

      const { data, error } = await supabase
        .from('answers')
        .select(`
          id,
          content,
          vote_count,
          is_best,
          created_at,
          question:question_id (id, title)
        `)
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setAnswers(data || []);
    } catch (error) {
      console.error('Error loading answers:', error);
      handleError(error, 'Profile.loadAnswers');
    } finally {
      setAnswersLoading(false);
    }
  };

  const getNextLevelPoints = (currentPoints: number) => {
    const currentLevel = Math.floor(currentPoints / 100) + 1;
    return currentLevel * 100;
  };

  const getLevelProgress = (currentPoints: number) => {
    const currentLevelBase = Math.floor(currentPoints / 100) * 100;
    const pointsInCurrentLevel = currentPoints - currentLevelBase;
    return (pointsInCurrentLevel / 100) * 100;
  };

  const getRarityColor = (rarity: string) => {
    const colors = {
      common: 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600',
      uncommon: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700',
      rare: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700',
      epic: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700',
      legendary: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700'
    };
    return colors[rarity as keyof typeof colors] || colors.common;
  };

  const getRarityIcon = (rarity: string) => {
    const icons = {
      common: Medal,
      uncommon: Award,
      rare: Star,
      epic: Trophy,
      legendary: Crown
    };
    return icons[rarity as keyof typeof icons] || Medal;
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Sidebar Skeleton */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="p-6 text-center animate-pulse">
                <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-6"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mx-auto mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mx-auto mb-4"></div>
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </Card>
              
              <Card className="p-6 animate-pulse">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-4"></div>
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex justify-between">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Main Content Skeleton */}
            <div className="lg:col-span-2">
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
              <CardSkeleton count={3} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !targetUserId || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <ErrorState
          title="Usuario no encontrado"
          message={error || (userId && userId !== 'edit' 
            ? 'El perfil que buscas no existe o el ID de usuario no es válido.'
            : 'El perfil que buscas no existe.'
          )}
          action={
            <BackButton label="Volver" />
          }
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back button */}
        <div className="mb-4">
          <BackButton label="Atrás" />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Basic Info */}
            <Card className="p-6 text-center">
              <div className="relative mb-4">
                <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  {profile.avatar_url ? (
                    <img 
                      src={profile.avatar_url} 
                      alt={profile.username}
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-white" />
                  )}
                </div>
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                  <Badge variant="primary" className="px-3 py-1">
                    Nivel {profile.level}
                  </Badge>
                </div>
              </div>

              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {profile.full_name || profile.username}
              </h1>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                @{profile.username}
              </p>
              
              {profile.bio && (
                <p className="text-gray-600 dark:text-gray-400 mb-4">{profile.bio}</p>
              )}

              {/* Additional Profile Info */}
              <div className="space-y-2 text-left mb-4">
                {profile.location && (
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span>{profile.location}</span>
                  </div>
                )}
                
                {profile.education && (
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <School className="w-4 h-4 mr-2" />
                    <span>{profile.education}</span>
                  </div>
                )}
                
                {profile.occupation && (
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <Briefcase className="w-4 h-4 mr-2" />
                    <span>{profile.occupation}</span>
                  </div>
                )}
                
                {profile.website && (
                  <div className="flex items-center text-sm text-primary-600 dark:text-primary-400">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    <a href={profile.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {profile.website.replace(/^https?:\/\/(www\.)?/, '')}
                    </a>
                  </div>
                )}
                
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>Miembro desde {new Date(profile.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Interests */}
              {profile.interests && profile.interests.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-left">
                    Intereses
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.interests.map((interest, index) => (
                      <Badge key={index} variant="secondary" size="sm">
                        <Heart className="w-3 h-3 mr-1" />
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                {isOwnProfile ? (
                  <Link to="/profile/settings" className="flex-1">
                    <Button variant="outline" className="w-full">
                      <Settings className="w-4 h-4 mr-2" />
                      Editar Perfil
                    </Button>
                  </Link>
                ) : (
                  <MessageButton
                    targetUserId={profile.id}
                    targetUsername={profile.username}
                    className="flex-1"
                    variant="primary"
                  />
                )}
              </div>
            </Card>

            {/* Stats */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Estadísticas</h3>
              
              <PointsDisplay 
                points={profile.points} 
                level={profile.level} 
                showProgress={true}
                className="mb-6"
              />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <BookOpen className="w-5 h-5 text-blue-500 mr-2" />
                    <span className="text-gray-700 dark:text-gray-300">Preguntas</span>
                  </div>
                  <span className="font-semibold">{profile.questions_asked}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <MessageCircle className="w-5 h-5 text-green-500 mr-2" />
                    <span className="text-gray-700 dark:text-gray-300">Respuestas</span>
                  </div>
                  <span className="font-semibold">{profile.answers_given}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Star className="w-5 h-5 text-yellow-500 mr-2" />
                    <span className="text-gray-700 dark:text-gray-300">Mejores Respuestas</span>
                  </div>
                  <span className="font-semibold">{profile.best_answers}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <TrendingUp className="w-5 h-5 text-purple-500 mr-2" />
                    <span className="text-gray-700 dark:text-gray-300">Reputación</span>
                  </div>
                  <span className="font-semibold">{profile.reputation_score}</span>
                </div>
              </div>
            </Card>

            {/* Recent Badges */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Logros Recientes</h3>
              
              {badgesLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-3 animate-pulse">
                      <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : badges.length > 0 ? (
                <div className="space-y-3">
                  {badges.slice(0, 3).map((userBadge) => {
                    const IconComponent = getRarityIcon(userBadge.badges.rarity);
                    return (
                      <div key={userBadge.id} className="flex items-center space-x-3">
                        <div 
                          className={`p-2 rounded-lg border ${getRarityColor(userBadge.badges.rarity)}`}
                        >
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white">{userBadge.badges.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{userBadge.badges.description}</p>
                        </div>
                      </div>
                    );
                  })}
                  
                  {badges.length > 3 && (
                    <button
                      onClick={() => setActiveTab('badges')}
                      className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium"
                    >
                      Ver todos los logros ({badges.length})
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  Aún no hay logros desbloqueados
                </p>
              )}
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('questions')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'questions'
                    ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <BookOpen className="w-4 h-4 inline mr-2" />
                Preguntas ({profile.questions_asked})
              </button>
              <button
                onClick={() => setActiveTab('answers')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'answers'
                    ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <MessageCircle className="w-4 h-4 inline mr-2" />
                Respuestas ({profile.answers_given})
              </button>
              <button
                onClick={() => setActiveTab('badges')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'badges'
                    ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <Award className="w-4 h-4 inline mr-2" />
                Logros ({badges.length})
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'questions' && (
              <div className="space-y-4">
                {questionsLoading ? (
                  <CardSkeleton count={3} />
                ) : questions.length > 0 ? (
                  questions.map((question) => (
                    <QuestionCard key={question.id} question={question} />
                  ))
                ) : (
                  <EmptyState
                    icon={<BookOpen className="w-12 h-12 text-gray-400" />}
                    title="No hay preguntas aún"
                    description={isOwnProfile 
                      ? 'Haz tu primera pregunta para comenzar a participar en la comunidad.'
                      : 'Este usuario aún no ha hecho ninguna pregunta.'
                    }
                    action={isOwnProfile && (
                      <Link to="/ask">
                        <Button>
                          <BookOpen className="w-4 h-4 mr-2" />
                          Hacer una Pregunta
                        </Button>
                      </Link>
                    )}
                  />
                )}
              </div>
            )}

            {activeTab === 'answers' && (
              <div className="space-y-4">
                {answersLoading ? (
                  <CardSkeleton count={3} />
                ) : answers.length > 0 ? (
                  answers.map((answer) => (
                    <Card key={answer.id} className={`p-6 ${answer.is_best ? 'ring-2 ring-green-500 dark:ring-green-600 bg-green-50 dark:bg-green-900/20' : ''}`}>
                      {answer.is_best && (
                        <div className="flex items-center mb-4 text-green-700 dark:text-green-400">
                          <Award className="w-5 h-5 mr-2" />
                          <span className="font-semibold">Mejor Respuesta</span>
                        </div>
                      )}
                      
                      <Link 
                        to={`/question/${answer.question.id}`}
                        className="text-lg font-semibold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors mb-3 block"
                      >
                        {answer.question.title}
                      </Link>
                      
                      <div className="prose max-w-none mb-4">
                        <p className="text-gray-700 dark:text-gray-300 line-clamp-3">
                          {answer.content}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                          <Calendar className="w-4 h-4 mr-1" />
                          <span>{formatTimeAgo(answer.created_at)}</span>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center text-gray-600 dark:text-gray-400">
                            <TrendingUp className="w-4 h-4 mr-1" />
                            <span>{answer.vote_count} votos</span>
                          </div>
                          
                          <Link to={`/question/${answer.question.id}`} className="text-primary-600 dark:text-primary-400 hover:underline">
                            Ver pregunta
                          </Link>
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <EmptyState
                    icon={<MessageCircle className="w-12 h-12 text-gray-400" />}
                    title="No hay respuestas aún"
                    description={isOwnProfile 
                      ? 'Aún no has respondido ninguna pregunta. ¡Ayuda a otros estudiantes compartiendo tu conocimiento!'
                      : 'Este usuario aún no ha respondido ninguna pregunta.'
                    }
                    action={isOwnProfile && (
                      <Link to="/search?status=unanswered">
                        <Button>
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Buscar preguntas para responder
                        </Button>
                      </Link>
                    )}
                  />
                )}
              </div>
            )}

            {activeTab === 'badges' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {badgesLoading ? (
                  [...Array(6)].map((_, i) => (
                    <Card key={i} className="p-6 animate-pulse">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                        <div className="flex-1">
                          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                        </div>
                      </div>
                    </Card>
                  ))
                ) : badges.length > 0 ? (
                  badges.map((userBadge) => {
                    const IconComponent = getRarityIcon(userBadge.badges.rarity);
                    return (
                      <Card key={userBadge.id} className="p-6">
                        <div className="flex items-start space-x-4">
                          <div 
                            className={`p-3 rounded-lg border ${getRarityColor(userBadge.badges.rarity)}`}
                          >
                            <IconComponent className="w-8 h-8" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-semibold text-gray-900 dark:text-white">{userBadge.badges.name}</h4>
                              <Badge 
                                variant="secondary" 
                                size="sm"
                                className={getRarityColor(userBadge.badges.rarity)}
                              >
                                {userBadge.badges.rarity}
                              </Badge>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">{userBadge.badges.description}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                              Obtenido el {new Date(userBadge.earned_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </Card>
                    );
                  })
                ) : (
                  <div className="md:col-span-2">
                    <EmptyState
                      icon={<Award className="w-12 h-12 text-gray-400" />}
                      title="No hay logros aún"
                      description={isOwnProfile 
                        ? 'Participa en la comunidad para desbloquear logros.'
                        : 'Este usuario aún no ha desbloqueado ningún logro.'
                      }
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}