import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner } from '../ui/LoadingStates';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  requireModerator?: boolean;
  fallback?: React.ReactNode;
}

/**
 * Component to protect routes based on authentication and role requirements
 */
export function AuthGuard({ 
  children, 
  requireAuth = true,
  requireAdmin = false,
  requireModerator = false,
  fallback
}: AuthGuardProps) {
  const { user, userProfile, loading } = useAuth();
  const location = useLocation();
  
  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Verificando autenticación..." />
      </div>
    );
  }
  
  // Check if authentication is required
  if (requireAuth && !user) {
    return (
      <Navigate 
        to="/login" 
        state={{ from: location.pathname }} 
        replace 
      />
    );
  }
  
  // Check role requirements
  if (user && userProfile) {
    const isAdmin = userProfile.role === 'admin';
    const isModerator = userProfile.role === 'moderator' || isAdmin;
    
    if (requireAdmin && !isAdmin) {
      return fallback || (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center max-w-md p-8">
            <div className="bg-error-100 dark:bg-error-900/20 rounded-full p-4 w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-error-600 dark:text-error-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Acceso Denegado</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              No tienes permisos de administrador para acceder a esta página.
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
    
    if (requireModerator && !isModerator) {
      return fallback || (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center max-w-md p-8">
            <div className="bg-error-100 dark:bg-error-900/20 rounded-full p-4 w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-error-600 dark:text-error-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Acceso Denegado</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              No tienes permisos de moderador para acceder a esta página.
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
  }
  
  // All checks passed, render children
  return <>{children}</>;
}