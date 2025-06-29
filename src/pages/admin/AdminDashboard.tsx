import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  AlertTriangle, 
  Users, 
  MessageSquare, 
  BookOpen, 
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Eye
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner, ErrorState } from '../../components/ui/LoadingStates';
import { supabase } from '../../lib/supabase';
import { handleError } from '../../utils/errorHandling';

interface AdminStats {
  totalUsers: number;
  totalQuestions: number;
  totalAnswers: number;
  pendingReports: number;
  reportedContent: number;
  activeUsers: number;
}

interface RecentActivity {
  id: string;
  type: 'question' | 'answer' | 'report' | 'user';
  title: string;
  description: string;
  created_at: string;
  status?: string;
}

export function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalQuestions: 0,
    totalAnswers: 0,
    pendingReports: 0,
    reportedContent: 0,
    activeUsers: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load stats with error handling for each query
      const statsPromises = [
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('questions').select('*', { count: 'exact', head: true }),
        supabase.from('answers').select('*', { count: 'exact', head: true }),
        supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('questions').select('*', { count: 'exact', head: true }).eq('is_reported', true),
        supabase.from('answers').select('*', { count: 'exact', head: true }).eq('is_reported', true)
      ];

      const results = await Promise.allSettled(statsPromises);
      
      const [
        totalUsersResult,
        totalQuestionsResult,
        totalAnswersResult,
        pendingReportsResult,
        reportedQuestionsResult,
        reportedAnswersResult
      ] = results;

      // Extract counts safely
      const totalUsers = totalUsersResult.status === 'fulfilled' ? totalUsersResult.value.count || 0 : 0;
      const totalQuestions = totalQuestionsResult.status === 'fulfilled' ? totalQuestionsResult.value.count || 0 : 0;
      const totalAnswers = totalAnswersResult.status === 'fulfilled' ? totalAnswersResult.value.count || 0 : 0;
      const pendingReports = pendingReportsResult.status === 'fulfilled' ? pendingReportsResult.value.count || 0 : 0;
      const reportedQuestions = reportedQuestionsResult.status === 'fulfilled' ? reportedQuestionsResult.value.count || 0 : 0;
      const reportedAnswers = reportedAnswersResult.status === 'fulfilled' ? reportedAnswersResult.value.count || 0 : 0;

      // Calculate active users (users who have activity in the last 30 days)
      let activeUsers = 0;
      try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const { count } = await supabase
          .from('questions')
          .select('user_id', { count: 'exact', head: true })
          .gte('created_at', thirtyDaysAgo.toISOString());

        activeUsers = count || 0;
      } catch (error) {
        console.warn('Could not calculate active users:', error);
      }

      setStats({
        totalUsers,
        totalQuestions,
        totalAnswers,
        pendingReports,
        reportedContent: reportedQuestions + reportedAnswers,
        activeUsers
      });

      // Load recent activity
      await loadRecentActivity();

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Error al cargar los datos del panel');
      handleError(error, 'AdminDashboard.loadDashboardData');
    } finally {
      setLoading(false);
    }
  };

  const loadRecentActivity = async () => {
    try {
      const activity: RecentActivity[] = [];

      // Load recent reports
      try {
        const { data: recentReports } = await supabase
          .from('reports')
          .select(`
            id,
            reason,
            status,
            created_at,
            questions:question_id (title),
            answers:answer_id (content),
            users:reporter_id (username)
          `)
          .order('created_at', { ascending: false })
          .limit(5);

        recentReports?.forEach(report => {
          activity.push({
            id: report.id,
            type: 'report',
            title: `Reporte: ${report.reason}`,
            description: report.questions?.title || 
                        (report.answers?.content?.substring(0, 50) + '...') || 
                        'Reporte de usuario',
            created_at: report.created_at,
            status: report.status
          });
        });
      } catch (error) {
        console.warn('Could not load recent reports:', error);
      }

      // Load recent questions
      try {
        const { data: recentQuestions } = await supabase
          .from('questions')
          .select('id, title, created_at, users:user_id (username)')
          .order('created_at', { ascending: false })
          .limit(3);

        recentQuestions?.forEach(question => {
          activity.push({
            id: question.id,
            type: 'question',
            title: 'Nueva pregunta',
            description: question.title,
            created_at: question.created_at
          });
        });
      } catch (error) {
        console.warn('Could not load recent questions:', error);
      }

      // Sort by date and take top 10
      activity.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setRecentActivity(activity.slice(0, 10));

    } catch (error) {
      console.error('Error loading recent activity:', error);
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

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'report': return AlertTriangle;
      case 'question': return MessageSquare;
      case 'answer': return MessageSquare;
      case 'user': return Users;
      default: return Clock;
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning">Pendiente</Badge>;
      case 'reviewed':
        return <Badge variant="info">Revisado</Badge>;
      case 'resolved':
        return <Badge variant="success">Resuelto</Badge>;
      case 'dismissed':
        return <Badge variant="secondary">Descartado</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-80 mb-2 animate-pulse"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-96 animate-pulse"></div>
          </div>
          
          {/* Stats Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="ml-4 flex-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2"></div>
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="p-6 animate-pulse">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-6"></div>
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                ))}
              </div>
            </Card>
            <Card className="p-6 animate-pulse">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-6"></div>
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ErrorState
            title="Error al cargar el panel de administración"
            message={error}
            onRetry={loadDashboardData}
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
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white flex items-center">
            <Shield className="mr-3 h-8 w-8 text-primary-500" />
            Panel de Administración
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Gestiona la comunidad, modera contenido y supervisa la actividad
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Usuarios Totales</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalUsers.toLocaleString()}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <MessageSquare className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Preguntas</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalQuestions.toLocaleString()}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Respuestas</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalAnswers.toLocaleString()}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-indigo-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Usuarios Activos</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeUsers.toLocaleString()}</p>
              </div>
            </div>
          </Card>

          <Card className={`p-6 ${stats.pendingReports > 0 ? 'ring-2 ring-red-200 dark:ring-red-800 bg-red-50 dark:bg-red-900/20' : ''}`}>
            <div className="flex items-center">
              <AlertTriangle className={`h-8 w-8 ${stats.pendingReports > 0 ? 'text-red-500' : 'text-yellow-500'}`} />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Reportes Pendientes</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pendingReports}</p>
              </div>
            </div>
          </Card>

          <Card className={`p-6 ${stats.reportedContent > 0 ? 'ring-2 ring-orange-200 dark:ring-orange-800 bg-orange-50 dark:bg-orange-900/20' : ''}`}>
            <div className="flex items-center">
              <XCircle className={`h-8 w-8 ${stats.reportedContent > 0 ? 'text-orange-500' : 'text-gray-500'}`} />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Contenido Reportado</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.reportedContent}</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quick Actions */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Acciones Rápidas</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button 
                variant="primary" 
                className="justify-start h-auto p-4"
                onClick={() => window.location.href = '/admin/reports'}
              >
                <AlertTriangle className="w-5 h-5 mr-3" />
                <div className="text-left">
                  <div className="font-medium">Gestionar Reportes</div>
                  <div className="text-sm opacity-75">{stats.pendingReports} pendientes</div>
                </div>
              </Button>

              <Button 
                variant="secondary" 
                className="justify-start h-auto p-4"
                onClick={() => window.location.href = '/admin/categories'}
              >
                <BookOpen className="w-5 h-5 mr-3" />
                <div className="text-left">
                  <div className="font-medium">Gestionar Categorías</div>
                  <div className="text-sm opacity-75">Agregar, editar, eliminar</div>
                </div>
              </Button>

              <Button 
                variant="accent" 
                className="justify-start h-auto p-4"
                onClick={() => window.location.href = '/admin/users'}
              >
                <Users className="w-5 h-5 mr-3" />
                <div className="text-left">
                  <div className="font-medium">Gestionar Usuarios</div>
                  <div className="text-sm opacity-75">Roles y permisos</div>
                </div>
              </Button>

              <Button 
                variant="outline" 
                className="justify-start h-auto p-4"
                onClick={() => window.location.href = '/admin/content'}
              >
                <Eye className="w-5 h-5 mr-3" />
                <div className="text-left">
                  <div className="font-medium">Revisar Contenido</div>
                  <div className="text-sm opacity-75">Moderar preguntas y respuestas</div>
                </div>
              </Button>
            </div>
          </Card>

          {/* Recent Activity */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Actividad Reciente</h2>
            <div className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity) => {
                  const IconComponent = getActivityIcon(activity.type);
                  return (
                    <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <IconComponent className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {activity.title}
                          </p>
                          {activity.status && getStatusBadge(activity.status)}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {activity.description}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {formatTimeAgo(activity.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No hay actividad reciente
                </p>
              )}
            </div>
          </Card>
        </div>

        {/* Alerts */}
        {(stats.pendingReports > 0 || stats.reportedContent > 0) && (
          <Card className="p-6 mt-8 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
            <div className="flex items-start">
              <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div className="ml-3">
                <h3 className="text-lg font-medium text-yellow-800 dark:text-yellow-200">
                  Atención Requerida
                </h3>
                <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                  <ul className="list-disc list-inside space-y-1">
                    {stats.pendingReports > 0 && (
                      <li>
                        Hay {stats.pendingReports} reporte{stats.pendingReports !== 1 ? 's' : ''} pendiente{stats.pendingReports !== 1 ? 's' : ''} de revisión
                      </li>
                    )}
                    {stats.reportedContent > 0 && (
                      <li>
                        {stats.reportedContent} elemento{stats.reportedContent !== 1 ? 's' : ''} de contenido ha{stats.reportedContent !== 1 ? 'n' : ''} sido reportado{stats.reportedContent !== 1 ? 's' : ''}
                      </li>
                    )}
                  </ul>
                </div>
                <div className="mt-4">
                  <Button 
                    variant="warning" 
                    size="sm"
                    onClick={() => window.location.href = '/admin/reports'}
                  >
                    Revisar Reportes
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}