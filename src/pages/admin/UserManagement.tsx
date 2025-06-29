import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Shield, 
  UserPlus, 
  Edit, 
  Trash2, 
  AlertTriangle,
  Eye,
  CheckCircle,
  XCircle,
  Award,
  Calendar
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { LoadingSpinner, ErrorState } from '../../components/ui/LoadingStates';
import { supabase } from '../../lib/supabase';
import { handleError, showSuccess, showLoading, dismissToast } from '../../utils/errorHandling';

interface User {
  id: string;
  username: string;
  email: string;
  avatar_url: string | null;
  level: number;
  points: number;
  role: 'user' | 'moderator' | 'admin';
  questions_asked: number;
  answers_given: number;
  created_at: string;
}

export function UserManagement() {
  const { user: currentUser, userProfile } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'moderator' | 'admin'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newRole, setNewRole] = useState<'user' | 'moderator' | 'admin'>('user');

  const itemsPerPage = 10;

  // Check if current user is admin
  useEffect(() => {
    if (userProfile && userProfile.role !== 'admin') {
      setError('No tienes permisos para acceder a esta página');
    } else {
      loadUsers();
    }
  }, [userProfile, currentPage, roleFilter]);

  const loadUsers = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('users')
        .select('*', { count: 'exact' });

      // Apply role filter
      if (roleFilter !== 'all') {
        query = query.eq('role', roleFilter);
      }

      // Apply search filter if present
      if (searchTerm) {
        query = query.or(`username.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }

      // Apply pagination
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      
      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      
      setUsers(data || []);
      setTotalUsers(count || 0);
    } catch (error) {
      console.error('Error loading users:', error);
      setError('Error al cargar los usuarios');
      handleError(error, 'UserManagement.loadUsers');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadUsers();
  };

  const handleRoleChange = async () => {
    if (!selectedUser || !currentUser) return;

    const toastId = showLoading('Actualizando rol...');
    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', selectedUser.id);

      if (error) throw error;

      dismissToast(toastId);
      showSuccess(`Rol actualizado a ${newRole}`);
      
      // Update local state
      setUsers(users.map(u => 
        u.id === selectedUser.id ? { ...u, role: newRole } : u
      ));
      
      setShowEditModal(false);
    } catch (error) {
      dismissToast(toastId);
      handleError(error, 'UserManagement.handleRoleChange');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser || !currentUser) return;

    const toastId = showLoading('Desactivando usuario...');
    setSubmitting(true);

    try {
      // In a real implementation, you might want to:
      // 1. Set a "deactivated" flag on the user record
      // 2. Anonymize user data
      // 3. Revoke sessions
      
      // For this example, we'll just update the user record
      const { error } = await supabase
        .from('users')
        .update({ 
          username: `deleted_${Date.now()}`,
          email: `deleted_${Date.now()}@example.com`,
          avatar_url: null,
          bio: null
        })
        .eq('id', selectedUser.id);

      if (error) throw error;

      dismissToast(toastId);
      showSuccess('Usuario desactivado correctamente');
      
      // Update local state
      setUsers(users.filter(u => u.id !== selectedUser.id));
      
      setShowDeleteModal(false);
    } catch (error) {
      dismissToast(toastId);
      handleError(error, 'UserManagement.handleDeleteUser');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setShowEditModal(true);
  };

  const openDeleteModal = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const totalPages = Math.ceil(totalUsers / itemsPerPage);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="danger">Administrador</Badge>;
      case 'moderator':
        return <Badge variant="warning">Moderador</Badge>;
      default:
        return <Badge variant="secondary">Usuario</Badge>;
    }
  };

  if (error === 'No tienes permisos para acceder a esta página') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <ErrorState
          title="Acceso denegado"
          message="No tienes permisos para acceder a esta página"
          action={
            <Button onClick={() => window.location.href = '/'} variant="outline">
              Volver al inicio
            </Button>
          }
        />
      </div>
    );
  }

  if (loading && users.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96 mt-2 animate-pulse"></div>
          </div>
          
          <Card className="p-6 mb-6 animate-pulse">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </Card>
          
          <Card className="overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="p-6 animate-pulse">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                    </div>
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
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
            <Users className="mr-3 h-8 w-8 text-primary-500" />
            Gestión de Usuarios
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Administra los usuarios de la plataforma, asigna roles y gestiona permisos
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Buscar por nombre o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
            </form>
            
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="all">Todos los roles</option>
                <option value="user">Usuarios</option>
                <option value="moderator">Moderadores</option>
                <option value="admin">Administradores</option>
              </select>
              
              <Button
                type="button"
                onClick={loadUsers}
              >
                Filtrar
              </Button>
            </div>
          </div>
        </Card>

        {/* Users List */}
        {error ? (
          <ErrorState
            title="Error al cargar usuarios"
            message={error}
            onRetry={loadUsers}
            showRetry={true}
          />
        ) : (
          <Card className="overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {totalUsers} usuarios
              </h2>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center"
                onClick={() => {/* Open invite user modal */}}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Invitar usuario
              </Button>
            </div>
            
            {users.length > 0 ? (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {users.map((user) => (
                  <div key={user.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar
                          src={user.avatar_url}
                          alt={user.username}
                          size="md"
                        />
                        
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {user.username}
                          </h3>
                          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                            <span>{user.email}</span>
                            <span>•</span>
                            <span className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              {new Date(user.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="flex flex-col items-end">
                          {getRoleBadge(user.role)}
                          <div className="flex items-center mt-1 text-sm text-gray-600 dark:text-gray-400">
                            <Award className="w-3 h-3 mr-1" />
                            Nivel {user.level} • {user.points} pts
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(`/profile/${user.id}`, '_blank')}
                            className="text-gray-600 dark:text-gray-400"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(user)}
                            className="text-blue-600 dark:text-blue-400"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteModal(user)}
                            className="text-red-600 dark:text-red-400"
                            disabled={user.id === currentUser?.id}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                      <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-lg text-center">
                        <div className="font-medium text-gray-900 dark:text-white">{user.questions_asked}</div>
                        <div className="text-gray-600 dark:text-gray-400">Preguntas</div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-lg text-center">
                        <div className="font-medium text-gray-900 dark:text-white">{user.answers_given}</div>
                        <div className="text-gray-600 dark:text-gray-400">Respuestas</div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-lg text-center">
                        <div className="font-medium text-gray-900 dark:text-white">{user.points}</div>
                        <div className="text-gray-600 dark:text-gray-400">Puntos</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No se encontraron usuarios
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {searchTerm ? 'Intenta con otros términos de búsqueda' : 'No hay usuarios registrados'}
                </p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-center">
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
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
                          size="sm"
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
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Edit Role Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full p-6">
            <div className="flex items-center mb-6">
              <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Cambiar rol de usuario
              </h3>
            </div>
            
            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-4">
                <Avatar
                  src={selectedUser.avatar_url}
                  alt={selectedUser.username}
                  size="md"
                />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedUser.username}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{selectedUser.email}</p>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Rol actual
                </label>
                <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  {getRoleBadge(selectedUser.role)}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nuevo rol
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="user">Usuario</option>
                  <option value="moderator">Moderador</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowEditModal(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleRoleChange}
                loading={submitting}
                className="flex-1"
              >
                Guardar
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Delete User Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full p-6">
            <div className="flex items-center mb-4 text-red-600 dark:text-red-400">
              <AlertTriangle className="w-6 h-6 mr-2" />
              <h3 className="text-lg font-semibold">Desactivar usuario</h3>
            </div>
            
            <div className="flex items-center space-x-3 mb-4">
              <Avatar
                src={selectedUser.avatar_url}
                alt={selectedUser.username}
                size="md"
              />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{selectedUser.username}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{selectedUser.email}</p>
              </div>
            </div>
            
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              ¿Estás seguro de que deseas desactivar este usuario? Esta acción anonimizará sus datos personales pero mantendrá sus contribuciones.
            </p>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteUser}
                loading={submitting}
                className="flex-1"
              >
                Desactivar
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}