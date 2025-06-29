import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PageLoading } from '../ui/LoadingStates';
import { AuthRequiredMessage } from './AuthRequiredMessage';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireRole?: 'admin' | 'moderator';
  redirectTo?: string;
  showAuthMessage?: boolean;
}

export function ProtectedRoute({ 
  children, 
  requireAuth = true, 
  requireRole,
  redirectTo = '/login',
  showAuthMessage = false
}: ProtectedRouteProps) {
  const { user, userProfile, loading, initialized } = useAuth();
  const location = useLocation();

  // Mostrar loading mientras se inicializa la autenticación
  if (!initialized || loading) {
    return <PageLoading message="Verificando autenticación..." />;
  }

  // Verificar si se requiere autenticación
  if (requireAuth && !user) {
    console.log('🚫 Access denied: User not authenticated');
    
    if (showAuthMessage) {
      return <AuthRequiredMessage />;
    }
    
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Verificar si se requiere un rol específico
  if (requireRole && (!userProfile || (userProfile.role !== requireRole && userProfile.role !== 'admin'))) {
    console.log('🚫 Access denied: Insufficient role', { required: requireRole, current: userProfile?.role });
    
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="bg-red-100 dark:bg-red-900/20 rounded-full p-4 w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Acceso Denegado</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            No tienes permisos suficientes para acceder a esta página.
          </p>
          <button
            onClick={() => window.history.back()}
            className="bg-primary-500 text-white px-6 py-2 rounded-lg hover:bg-primary-600 transition-colors"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  // Si el usuario está autenticado pero no tiene perfil, mostrar mensaje de carga
  if (user && !userProfile && requireAuth) {
    return <PageLoading message="Cargando perfil de usuario..." />;
  }

  return <>{children}</>;
}