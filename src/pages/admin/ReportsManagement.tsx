import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Eye, 
  Check, 
  X, 
  MessageSquare, 
  User, 
  Calendar,
  Filter,
  Search,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

interface Report {
  id: string;
  reason: string;
  description: string | null;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  created_at: string;
  reviewed_at: string | null;
  reporter: {
    username: string;
    id: string;
  };
  reviewed_by_user?: {
    username: string;
  } | null;
  question?: {
    id: string;
    title: string;
    content: string;
    user_id: string;
    users: {
      username: string;
    };
  } | null;
  answer?: {
    id: string;
    content: string;
    user_id: string;
    users: {
      username: string;
    };
    questions: {
      id: string;
      title: string;
    };
  } | null;
  reported_user?: {
    id: string;
    username: string;
  } | null;
}

export function ReportsManagement() {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'reviewed' | 'resolved' | 'dismissed'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [processingReportId, setProcessingReportId] = useState<string | null>(null);

  useEffect(() => {
    loadReports();
  }, [filter]);

  const loadReports = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('reports')
        .select(`
          *,
          reporter:reporter_id (id, username),
          reviewed_by_user:reviewed_by (username),
          question:question_id (
            id, title, content, user_id,
            users:user_id (username)
          ),
          answer:answer_id (
            id, content, user_id,
            users:user_id (username),
            questions:question_id (id, title)
          ),
          reported_user:reported_user_id (id, username)
        `)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateReportStatus = async (reportId: string, status: 'reviewed' | 'resolved' | 'dismissed') => {
    if (!user) return;

    try {
      setProcessingReportId(reportId);

      const { error } = await supabase.rpc('resolve_report', {
        report_id: reportId,
        admin_id: user.id,
        new_status: status
      });

      if (error) throw error;

      await loadReports();
    } catch (error) {
      console.error('Error updating report status:', error);
    } finally {
      setProcessingReportId(null);
    }
  };

  const deleteContent = async (report: Report) => {
    if (!user || !confirm('¿Estás seguro de que quieres eliminar este contenido? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      setProcessingReportId(report.id);

      if (report.question) {
        const { error } = await supabase
          .from('questions')
          .delete()
          .eq('id', report.question.id);

        if (error) throw error;
      } else if (report.answer) {
        const { error } = await supabase
          .from('answers')
          .delete()
          .eq('id', report.answer.id);

        if (error) throw error;
      }

      // Mark report as resolved
      await updateReportStatus(report.id, 'resolved');
    } catch (error) {
      console.error('Error deleting content:', error);
    } finally {
      setProcessingReportId(null);
    }
  };

  const filteredReports = reports.filter(report => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      report.reason.toLowerCase().includes(searchLower) ||
      report.reporter.username.toLowerCase().includes(searchLower) ||
      report.question?.title.toLowerCase().includes(searchLower) ||
      report.answer?.content.toLowerCase().includes(searchLower) ||
      report.reported_user?.username.toLowerCase().includes(searchLower)
    );
  });

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Hace menos de 1 hora';
    if (diffInHours < 24) return `Hace ${diffInHours} horas`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `Hace ${diffInDays} días`;
  };

  const getStatusBadge = (status: string) => {
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
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getReportTypeIcon = (report: Report) => {
    if (report.question) return MessageSquare;
    if (report.answer) return MessageSquare;
    if (report.reported_user) return User;
    return AlertTriangle;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando reportes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-gray-900 flex items-center">
            <AlertTriangle className="mr-3 h-8 w-8 text-primary-500" />
            Gestión de Reportes
          </h1>
          <p className="mt-2 text-gray-600">
            Revisa y modera el contenido reportado por la comunidad
          </p>
        </div>

        {/* Filters and Search */}
        <Card className="p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Buscar reportes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                {['all', 'pending', 'reviewed', 'resolved', 'dismissed'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilter(status as any)}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      filter === status
                        ? 'bg-white text-primary-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {status === 'all' ? 'Todos' : 
                     status === 'pending' ? 'Pendientes' :
                     status === 'reviewed' ? 'Revisados' :
                     status === 'resolved' ? 'Resueltos' : 'Descartados'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Reports List */}
        <div className="space-y-6">
          {filteredReports.length > 0 ? (
            filteredReports.map((report) => {
              const IconComponent = getReportTypeIcon(report);
              return (
                <Card key={report.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4">
                      <div className="bg-red-100 p-2 rounded-lg">
                        <IconComponent className="w-5 h-5 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {report.reason}
                          </h3>
                          {getStatusBadge(report.status)}
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center">
                            <User className="w-4 h-4 mr-1" />
                            <span>Reportado por {report.reporter.username}</span>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            <span>{formatTimeAgo(report.created_at)}</span>
                          </div>
                        </div>

                        {report.description && (
                          <p className="text-gray-700 mb-4">{report.description}</p>
                        )}

                        {/* Reported Content */}
                        <div className="bg-gray-50 p-4 rounded-lg mb-4">
                          {report.question && (
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium text-gray-900">Pregunta Reportada</h4>
                                <Link 
                                  to={`/question/${report.question.id}`}
                                  className="text-primary-600 hover:text-primary-700 flex items-center text-sm"
                                >
                                  <ExternalLink className="w-4 h-4 mr-1" />
                                  Ver pregunta
                                </Link>
                              </div>
                              <p className="font-medium text-gray-900 mb-1">{report.question.title}</p>
                              <p className="text-gray-600 text-sm line-clamp-3">{report.question.content}</p>
                              <p className="text-xs text-gray-500 mt-2">
                                Por {report.question.users.username}
                              </p>
                            </div>
                          )}

                          {report.answer && (
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium text-gray-900">Respuesta Reportada</h4>
                                <Link 
                                  to={`/question/${report.answer.questions.id}`}
                                  className="text-primary-600 hover:text-primary-700 flex items-center text-sm"
                                >
                                  <ExternalLink className="w-4 h-4 mr-1" />
                                  Ver respuesta
                                </Link>
                              </div>
                              <p className="text-gray-600 text-sm line-clamp-3">{report.answer.content}</p>
                              <p className="text-xs text-gray-500 mt-2">
                                Por {report.answer.users.username} en "{report.answer.questions.title}"
                              </p>
                            </div>
                          )}

                          {report.reported_user && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Usuario Reportado</h4>
                              <p className="text-gray-600">@{report.reported_user.username}</p>
                            </div>
                          )}
                        </div>

                        {report.reviewed_by_user && report.reviewed_at && (
                          <div className="text-sm text-gray-600">
                            Revisado por {report.reviewed_by_user.username} el {new Date(report.reviewed_at).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {report.status === 'pending' && (
                    <div className="flex items-center space-x-3 pt-4 border-t border-gray-200">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateReportStatus(report.id, 'reviewed')}
                        loading={processingReportId === report.id}
                        className="flex items-center"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Marcar como Revisado
                      </Button>

                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => deleteContent(report)}
                        loading={processingReportId === report.id}
                        className="flex items-center"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Eliminar Contenido
                      </Button>

                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => updateReportStatus(report.id, 'resolved')}
                        loading={processingReportId === report.id}
                        className="flex items-center"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Resolver
                      </Button>

                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => updateReportStatus(report.id, 'dismissed')}
                        loading={processingReportId === report.id}
                        className="flex items-center"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Descartar
                      </Button>
                    </div>
                  )}
                </Card>
              );
            })
          ) : (
            <Card className="p-12 text-center">
              <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No hay reportes
              </h3>
              <p className="text-gray-600">
                {filter === 'pending' 
                  ? 'No hay reportes pendientes de revisión.'
                  : `No hay reportes con estado "${filter}".`
                }
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}