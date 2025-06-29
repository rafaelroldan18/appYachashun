import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Medal, 
  Award, 
  TrendingUp, 
  Users, 
  Star,
  Crown,
  Target,
  ArrowLeft
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/ui/LoadingStates';
import { supabase } from '../lib/supabase';
import { handleError } from '../utils/errorHandling';

interface LeaderboardUser {
  id: string;
  username: string;
  avatar_url: string | null;
  level: number;
  points: number;
  questions_asked: number;
  answers_given: number;
  best_answers: number;
  reputation_score: number;
}

export function Leaderboard() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<'all' | 'month' | 'week'>('all');
  const navigate = useNavigate();

  useEffect(() => {
    loadLeaderboard();
  }, [timeframe]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('users')
        .select('id, username, avatar_url, level, points, questions_asked, answers_given, best_answers, reputation_score')
        .order('points', { ascending: false })
        .limit(50);

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      setError('Error al cargar el ranking');
      handleError(error, 'Leaderboard.loadLeaderboard');
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (position: number) => {
    if (position === 1) return <Crown className="w-6 h-6 text-yellow-500" />;
    if (position === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (position === 3) return <Award className="w-6 h-6 text-amber-600" />;
    return <span className="w-6 h-6 flex items-center justify-center text-gray-600 dark:text-gray-400 font-bold">#{position}</span>;
  };

  const getRankBadgeColor = (position: number) => {
    if (position === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
    if (position === 2) return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
    if (position === 3) return 'bg-gradient-to-r from-amber-400 to-amber-600 text-white';
    if (position <= 10) return 'bg-gradient-to-r from-primary-500 to-accent-500 text-white';
    return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-80 mx-auto mb-4 animate-pulse"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-96 mx-auto animate-pulse"></div>
          </div>
          
          {/* Podium Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="p-6 text-center animate-pulse">
                <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-4"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24 mx-auto mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 mx-auto mb-2"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20 mx-auto"></div>
              </Card>
            ))}
          </div>

          {/* List Skeleton */}
          <Card className="overflow-hidden">
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="p-6 animate-pulse">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
                    </div>
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <ErrorState
            title="Error al cargar el ranking"
            message={error}
            onRetry={loadLeaderboard}
            showRetry={true}
          />
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <EmptyState
            icon={<Trophy className="w-16 h-16 text-gray-400" />}
            title="No hay usuarios en el ranking"
            description="Aún no hay usuarios registrados en la plataforma."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
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
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-display font-bold text-gray-900 dark:text-white mb-4 flex items-center justify-center">
            <Trophy className="mr-3 h-10 w-10 text-yellow-500" />
            Ranking de la Comunidad
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Descubre a los estudiantes más activos y colaborativos de nuestra comunidad educativa
          </p>
        </div>

        {/* Timeframe Filter */}
        <div className="flex justify-center mb-8">
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
            {[
              { key: 'all', label: 'Todo el tiempo' },
              { key: 'month', label: 'Este mes' },
              { key: 'week', label: 'Esta semana' }
            ].map((option) => (
              <button
                key={option.key}
                onClick={() => setTimeframe(option.key as any)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  timeframe === option.key
                    ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Top 3 Podium */}
        {users.length >= 3 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {/* Second Place */}
            <div className="md:order-1 order-2">
              <Card className="p-6 text-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border-2 border-gray-300 dark:border-gray-600">
                <div className="relative mb-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center mx-auto mb-2">
                    {users[1].avatar_url ? (
                      <img 
                        src={users[1].avatar_url} 
                        alt={users[1].username}
                        className="w-20 h-20 rounded-full object-cover"
                      />
                    ) : (
                      <Users className="w-10 h-10 text-white" />
                    )}
                  </div>
                  <div className="absolute -top-2 -right-2">
                    <Medal className="w-8 h-8 text-gray-400" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{users[1].username}</h3>
                <Badge variant="secondary" className="mb-3">Nivel {users[1].level}</Badge>
                <p className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-2">{users[1].points.toLocaleString()} pts</p>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Respuestas:</span>
                    <span>{users[1].answers_given}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mejores:</span>
                    <span>{users[1].best_answers}</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* First Place */}
            <div className="md:order-2 order-1">
              <Card className="p-6 text-center bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-2 border-yellow-400 transform md:scale-110">
                <div className="relative mb-4">
                  <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-2">
                    {users[0].avatar_url ? (
                      <img 
                        src={users[0].avatar_url} 
                        alt={users[0].username}
                        className="w-24 h-24 rounded-full object-cover"
                      />
                    ) : (
                      <Users className="w-12 h-12 text-white" />
                    )}
                  </div>
                  <div className="absolute -top-2 -right-2">
                    <Crown className="w-10 h-10 text-yellow-500" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{users[0].username}</h3>
                <Badge variant="warning" className="mb-3">Nivel {users[0].level}</Badge>
                <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mb-2">{users[0].points.toLocaleString()} pts</p>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Respuestas:</span>
                    <span>{users[0].answers_given}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mejores:</span>
                    <span>{users[0].best_answers}</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Third Place */}
            <div className="md:order-3 order-3">
              <Card className="p-6 text-center bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-2 border-amber-400">
                <div className="relative mb-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-2">
                    {users[2].avatar_url ? (
                      <img 
                        src={users[2].avatar_url} 
                        alt={users[2].username}
                        className="w-20 h-20 rounded-full object-cover"
                      />
                    ) : (
                      <Users className="w-10 h-10 text-white" />
                    )}
                  </div>
                  <div className="absolute -top-2 -right-2">
                    <Award className="w-8 h-8 text-amber-600" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{users[2].username}</h3>
                <Badge variant="warning" className="mb-3">Nivel {users[2].level}</Badge>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mb-2">{users[2].points.toLocaleString()} pts</p>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Respuestas:</span>
                    <span>{users[2].answers_given}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mejores:</span>
                    <span>{users[2].best_answers}</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Full Leaderboard */}
        <Card className="overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Ranking Completo</h2>
          </div>
          
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {users.map((user, index) => {
              const position = index + 1;
              return (
                <div key={user.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex items-center space-x-4">
                    {/* Rank */}
                    <div className="flex-shrink-0">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getRankBadgeColor(position)}`}>
                        {position <= 3 ? getRankIcon(position) : (
                          <span className="font-bold">#{position}</span>
                        )}
                      </div>
                    </div>

                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center">
                        {user.avatar_url ? (
                          <img 
                            src={user.avatar_url} 
                            alt={user.username}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <Users className="w-6 h-6 text-white" />
                        )}
                      </div>
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <Link 
                          to={`/profile/${user.id}`}
                          className="text-lg font-semibold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                        >
                          {user.username}
                        </Link>
                        <Badge variant="primary" size="sm">
                          Nivel {user.level}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center">
                          <Target className="w-4 h-4 mr-1" />
                          <span>{user.points.toLocaleString()} puntos</span>
                        </div>
                        <div className="flex items-center">
                          <TrendingUp className="w-4 h-4 mr-1" />
                          <span>{user.answers_given} respuestas</span>
                        </div>
                        <div className="flex items-center">
                          <Star className="w-4 h-4 mr-1" />
                          <span>{user.best_answers} mejores</span>
                        </div>
                      </div>
                    </div>

                    {/* Points Display */}
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                        {user.points.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">puntos</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Stats Summary */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6 text-center">
            <Users className="w-8 h-8 text-primary-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{users.length}</div>
            <div className="text-gray-600 dark:text-gray-400">Usuarios Activos</div>
          </Card>
          
          <Card className="p-6 text-center">
            <Target className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {users.reduce((sum, user) => sum + user.points, 0).toLocaleString()}
            </div>
            <div className="text-gray-600 dark:text-gray-400">Puntos Totales</div>
          </Card>
          
          <Card className="p-6 text-center">
            <TrendingUp className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {users.reduce((sum, user) => sum + user.answers_given, 0).toLocaleString()}
            </div>
            <div className="text-gray-600 dark:text-gray-400">Respuestas Dadas</div>
          </Card>
          
          <Card className="p-6 text-center">
            <Star className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {users.reduce((sum, user) => sum + user.best_answers, 0).toLocaleString()}
            </div>
            <div className="text-gray-600 dark:text-gray-400">Mejores Respuestas</div>
          </Card>
        </div>
      </div>
    </div>
  );
}