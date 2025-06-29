import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { showWarning } from '../utils/errorHandling';

interface UseAuthGuardOptions {
  requireAuth?: boolean;
  requireRole?: 'admin' | 'moderator';
  redirectTo?: string;
  onUnauthorized?: () => void;
}

export function useAuthGuard({
  requireAuth = true,
  requireRole,
  redirectTo = '/login',
  onUnauthorized,
}: UseAuthGuardOptions = {}) {
  const { user, userProfile, loading, initialized } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // No hacer nada si aún está cargando o no se ha inicializado
    if (loading || !initialized) return;

    // Verificar autenticación
    if (requireAuth && !user) {
      console.log('🚫 Auth guard: User not authenticated, redirecting to', redirectTo);
      showWarning('Debes iniciar sesión para acceder a esta página');
      navigate(redirectTo, { state: { from: location }, replace: true });
      onUnauthorized?.();
      return;
    }

    // Verificar rol
    if (requireRole && user && (!userProfile || (userProfile.role !== requireRole && userProfile.role !== 'admin'))) {
      console.log('🚫 Auth guard: Insufficient role', { required: requireRole, current: userProfile?.role });
      showWarning('No tienes permisos para acceder a esta página');
      navigate('/', { replace: true });
      onUnauthorized?.();
      return;
    }
  }, [user, userProfile, loading, initialized, requireAuth, requireRole, redirectTo, navigate, location, onUnauthorized]);

  return {
    isAuthenticated: !!user,
    hasRequiredRole: !requireRole || (userProfile?.role === requireRole || userProfile?.role === 'admin'),
    isAuthorized: (!requireAuth || !!user) && (!requireRole || (userProfile?.role === requireRole || userProfile?.role === 'admin')),
    loading: loading || !initialized,
    user,
    userProfile,
  };
}

// Hook para verificar permisos específicos
export function usePermissions() {
  const { user, userProfile } = useAuth();

  const can = {
    // Permisos de administración
    accessAdmin: userProfile?.role === 'admin',
    manageUsers: userProfile?.role === 'admin',
    manageReports: userProfile?.role === 'admin' || userProfile?.role === 'moderator',
    manageCategories: userProfile?.role === 'admin',
    
    // Permisos de contenido
    createQuestion: !!user,
    createAnswer: !!user,
    voteAnswer: !!user,
    reportContent: !!user,
    sendMessage: !!user,
    
    // Permisos de edición
    editOwnQuestion: (questionUserId: string) => user?.id === questionUserId,
    editOwnAnswer: (answerUserId: string) => user?.id === answerUserId,
    deleteOwnQuestion: (questionUserId: string) => user?.id === questionUserId,
    deleteOwnAnswer: (answerUserId: string) => user?.id === answerUserId,
    markBestAnswer: (questionUserId: string) => user?.id === questionUserId,
    
    // Permisos de moderación
    moderateContent: userProfile?.role === 'admin' || userProfile?.role === 'moderator',
    deleteAnyContent: userProfile?.role === 'admin',
    banUser: userProfile?.role === 'admin',
  };

  return { can, user, userProfile };
}

// Hook para verificar si el usuario es el propietario de un recurso
export function useOwnership() {
  const { user } = useAuth();

  const isOwner = {
    question: (questionUserId: string) => user?.id === questionUserId,
    answer: (answerUserId: string) => user?.id === answerUserId,
    profile: (profileUserId: string) => user?.id === profileUserId,
    conversation: (participant1: string, participant2: string) => 
      user?.id === participant1 || user?.id === participant2,
  };

  return { isOwner, userId: user?.id };
}