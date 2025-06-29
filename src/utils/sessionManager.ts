// Utilidades para manejo de sesión y estado de autenticación

import { supabase, getSessionSafely, refreshSessionSafely } from '../lib/supabase';
import { handleError, showSuccess, showWarning, ERROR_CODES } from './errorHandling';

export interface SessionInfo {
  isValid: boolean;
  expiresAt: number | null;
  needsRefresh: boolean;
  user: any;
}

// Verificar el estado de la sesión actual
export async function checkSessionStatus(): Promise<SessionInfo> {
  try {
    const session = await getSessionSafely();
    
    if (!session) {
      return {
        isValid: false,
        expiresAt: null,
        needsRefresh: false,
        user: null,
      };
    }

    const now = Date.now() / 1000;
    const expiresAt = session.expires_at || 0;
    const refreshThreshold = 300; // 5 minutos antes de expirar

    return {
      isValid: true,
      expiresAt: expiresAt * 1000,
      needsRefresh: (expiresAt - now) < refreshThreshold,
      user: session.user,
    };
  } catch (error) {
    console.error('Error checking session status:', error);
    return {
      isValid: false,
      expiresAt: null,
      needsRefresh: false,
      user: null,
    };
  }
}

// Refrescar la sesión si es necesario
export async function ensureValidSession(): Promise<boolean> {
  try {
    const sessionInfo = await checkSessionStatus();
    
    if (!sessionInfo.isValid) {
      console.log('❌ Session is invalid');
      return false;
    }

    if (sessionInfo.needsRefresh) {
      console.log('🔄 Session needs refresh, refreshing...');
      const refreshedSession = await refreshSessionSafely();
      
      if (!refreshedSession) {
        console.log('❌ Failed to refresh session');
        return false;
      }
      
      console.log('✅ Session refreshed successfully');
    }

    return true;
  } catch (error) {
    console.error('Error ensuring valid session:', error);
    handleError(error, 'sessionManager.ensureValidSession');
    return false;
  }
}

// Limpiar datos de sesión del localStorage de forma segura
export function clearSessionData() {
  try {
    console.log('🧹 Clearing session data from localStorage...');
    
    // Lista de claves específicas de Supabase
    const supabaseKeys = [
      'supabase.auth.token',
      'sb-auth-token',
    ];

    // Agregar claves dinámicas basadas en la URL de Supabase
    if (import.meta.env.VITE_SUPABASE_URL) {
      const urlParts = import.meta.env.VITE_SUPABASE_URL.split('//')[1]?.split('.')[0];
      if (urlParts) {
        supabaseKeys.push(`sb-${urlParts}-auth-token`);
      }
    }

    // Remover claves específicas
    supabaseKeys.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn(`Could not remove ${key}:`, error);
      }
    });

    // Remover todas las claves que empiecen con 'sb-'
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-') && key.includes('auth')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Could not clear sb- keys:', error);
    }

    console.log('✅ Session data cleared successfully');
  } catch (error) {
    console.warn('⚠️ Warning: Could not clear session data:', error);
  }
}

// Función para logout seguro y completo
export async function performSafeLogout(): Promise<void> {
  try {
    console.log('👋 Performing comprehensive logout...');
    
    // 1. Cerrar sesión en Supabase
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.warn('⚠️ Supabase signOut warning:', error);
        // No lanzar error, continuar con limpieza
      }
    } catch (error) {
      console.warn('⚠️ Supabase signOut failed:', error);
      // Continuar con limpieza local
    }
    
    // 2. Limpiar datos locales
    clearSessionData();
    
    // 3. Limpiar cualquier estado en memoria (esto se maneja en AuthContext)
    
    // 4. Mostrar confirmación
    showSuccess('¡Hasta luego! Sesión cerrada correctamente');
    
    // 5. Redirigir después de un breve delay
    setTimeout(() => {
      window.location.href = '/';
    }, 1500);
    
    console.log('✅ Safe logout completed');
  } catch (error) {
    console.error('❌ Error during safe logout:', error);
    
    // Forzar limpieza local aunque falle el logout remoto
    clearSessionData();
    showWarning('Sesión cerrada localmente. Redirigiendo...');
    
    setTimeout(() => {
      window.location.href = '/';
    }, 2000);
  }
}

// Configurar interceptor para requests automáticos
export function setupSessionInterceptor() {
  // Interceptar requests de Supabase para asegurar sesión válida
  const originalRequest = supabase.rest.request;
  
  supabase.rest.request = async function(options: any) {
    // Verificar sesión antes de hacer request
    const isValid = await ensureValidSession();
    
    if (!isValid && options.headers?.Authorization) {
      // Si la sesión no es válida y se requiere auth, fallar
      throw new Error('Session expired');
    }
    
    return originalRequest.call(this, options);
  };
}

// Monitorear cambios de conectividad
export function setupConnectivityMonitor() {
  const handleOnline = async () => {
    console.log('🌐 Network back online, checking session...');
    await ensureValidSession();
  };

  const handleOffline = () => {
    console.log('📴 Network offline');
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

// Configurar heartbeat para mantener sesión activa
export function setupSessionHeartbeat(intervalMinutes: number = 15) {
  const interval = setInterval(async () => {
    const sessionInfo = await checkSessionStatus();
    
    if (sessionInfo.isValid) {
      console.log('💓 Session heartbeat - session is valid');
      
      if (sessionInfo.needsRefresh) {
        await ensureValidSession();
      }
    } else {
      console.log('💔 Session heartbeat - session is invalid');
      clearInterval(interval);
    }
  }, intervalMinutes * 60 * 1000);

  return () => clearInterval(interval);
}

// Verificar si el usuario tiene permisos para una acción
export function hasPermission(
  userRole: string | undefined,
  requiredRole: 'user' | 'moderator' | 'admin'
): boolean {
  if (!userRole) return false;
  
  const roleHierarchy = {
    user: 1,
    moderator: 2,
    admin: 3,
  };
  
  const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0;
  const requiredLevel = roleHierarchy[requiredRole];
  
  return userLevel >= requiredLevel;
}

// Función para debug de sesión (solo en desarrollo)
export function debugSession() {
  if (import.meta.env.PROD) return;
  
  console.group('🔍 Session Debug Info');
  
  getSessionSafely().then(session => {
    console.log('Current session:', session);
    console.log('User:', session?.user);
    console.log('Expires at:', session?.expires_at ? new Date(session.expires_at * 1000) : 'N/A');
    console.log('Access token:', session?.access_token ? 'Present' : 'Missing');
    console.log('Refresh token:', session?.refresh_token ? 'Present' : 'Missing');
  });
  
  console.log('LocalStorage keys:', Object.keys(localStorage).filter(k => k.includes('supabase') || k.includes('sb-')));
  console.groupEnd();
}

// Función para confirmar logout con el usuario
export function confirmLogout(): Promise<boolean> {
  return new Promise((resolve) => {
    const confirmed = window.confirm(
      '¿Estás seguro de que quieres cerrar sesión?\n\nSe cerrará tu sesión actual y serás redirigido a la página principal.'
    );
    resolve(confirmed);
  });
}