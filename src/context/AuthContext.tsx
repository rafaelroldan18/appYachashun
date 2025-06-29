import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { handleError, showSuccess, showWarning, showLoading, dismissToast, ERROR_CODES, retryOperation } from '../utils/errorHandling';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar_url: string | null;
  bio: string | null;
  level: number;
  points: number;
  role: 'user' | 'admin' | 'moderator';
  questions_asked: number;
  answers_given: number;
  best_answers: number;
  reputation_score: number;
  interests: string[] | null;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
  signUp: (email: string, password: string, username: string) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<any>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  
  // Refs para evitar race conditions
  const mountedRef = useRef(true);
  const initializingRef = useRef(false);
  const profileLoadingRef = useRef(false);
  const logoutInProgressRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (initializingRef.current) return;
    
    initializingRef.current = true;
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      console.log('🔐 Initializing auth...');
      
      // Obtener sesión inicial con retry
      const { data: { session }, error } = await retryOperation(
        () => supabase.auth.getSession(),
        3,
        1000
      );

      if (error) {
        console.error('❌ Error getting initial session:', error);
        handleError(error, 'AuthContext.initializeAuth');
        return;
      }

      if (!mountedRef.current) return;

      console.log('📱 Initial session:', session?.user?.id ? 'Found' : 'None');
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await loadUserProfile(session.user.id, true);
      }
    } catch (error) {
      console.error('❌ Auth initialization failed:', error);
      handleError(error, 'AuthContext.initializeAuth');
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setInitialized(true);
        initializingRef.current = false;
      }
    }
  };

  useEffect(() => {
    if (!initialized) return;

    console.log('👂 Setting up auth state listener...');

    // Configurar listener de cambios de auth
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mountedRef.current) return;

      console.log('🔄 Auth state changed:', event, session?.user?.id || 'no user');

      // Manejar eventos específicos
      switch (event) {
        case 'SIGNED_IN':
          console.log('✅ User signed in');
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            await loadUserProfile(session.user.id);
            showSuccess('¡Bienvenido de vuelta!');
          }
          break;

        case 'SIGNED_OUT':
          console.log('👋 User signed out');
          
          // Limpiar estado inmediatamente
          setSession(null);
          setUser(null);
          setUserProfile(null);
          
          // Solo mostrar mensaje si no es un logout programático
          if (!logoutInProgressRef.current) {
            showSuccess('Sesión cerrada correctamente');
          }
          break;

        case 'TOKEN_REFRESHED':
          console.log('🔄 Token refreshed');
          setSession(session);
          setUser(session?.user ?? null);
          break;

        case 'USER_UPDATED':
          console.log('👤 User updated');
          setSession(session);
          setUser(session?.user ?? null);
          if (session?.user) {
            await loadUserProfile(session.user.id);
          }
          break;

        case 'PASSWORD_RECOVERY':
          console.log('🔑 Password recovery');
          break;

        default:
          console.log('🔄 Auth state change:', event);
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            await loadUserProfile(session.user.id);
          } else {
            setUserProfile(null);
          }
      }
    });

    return () => {
      console.log('🔇 Cleaning up auth listener');
      subscription.unsubscribe();
    };
  }, [initialized]);

  const loadUserProfile = async (userId: string, isInitial: boolean = false) => {
    if (profileLoadingRef.current && !isInitial) {
      console.log('⏳ Profile already loading, skipping...');
      return;
    }

    profileLoadingRef.current = true;

    try {
      console.log('👤 Loading user profile for:', userId);

      const { data, error } = await retryOperation(
        () => supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .maybeSingle(),
        3,
        1000
      );

      if (error) {
        // Si el perfil no existe, podría ser un usuario nuevo
        if (error.code === 'PGRST116') {
          console.log('👤 User profile not found, might be a new user');
          if (mountedRef.current) {
            setUserProfile(null);
          }
          return;
        }
        throw error;
      }

      if (!mountedRef.current) return;

      if (data) {
        console.log('✅ User profile loaded:', data.username);
        setUserProfile(data);
      } else {
        console.log('❌ No user profile found for user:', userId);
        setUserProfile(null);
      }
    } catch (error) {
      console.error('❌ Error loading user profile:', error);
      handleError(error, 'AuthContext.loadUserProfile', userId);
      
      if (mountedRef.current) {
        setUserProfile(null);
      }
    } finally {
      profileLoadingRef.current = false;
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    try {
      setLoading(true);
      console.log('📝 Signing up user:', email);

      // Verificar si el username ya existe
      const { data: existingUser } = await supabase
        .from('users')
        .select('username')
        .eq('username', username)
        .maybeSingle();

      if (existingUser) {
        throw new Error('El nombre de usuario ya está en uso');
      }

      // Crear usuario en auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
          },
        },
      });

      if (error) throw error;

      // Crear perfil de usuario
      if (data.user) {
        console.log('👤 Creating user profile for:', data.user.id);
        
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            username,
            email,
            level: 1,
            points: 0,
            role: 'user',
            questions_asked: 0,
            answers_given: 0,
            best_answers: 0,
            reputation_score: 0,
            interests: [],
          });

        if (profileError) {
          console.error('❌ Profile creation failed:', profileError);
          // Si falla la creación del perfil, limpiar el usuario de auth
          await supabase.auth.signOut();
          throw profileError;
        }

        // Crear preferencias de notificación por defecto
        await supabase
          .from('notification_preferences')
          .insert({ user_id: data.user.id })
          .then(() => console.log('✅ Default notification preferences created'))
          .catch(err => console.warn('⚠️ Could not create notification preferences:', err));

        showSuccess('¡Cuenta creada exitosamente! Bienvenido a Yachashun.');
      }

      return data;
    } catch (error) {
      console.error('❌ Sign up failed:', error);
      handleError(error, 'AuthContext.signUp');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log('🔐 Signing in user:', email);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      console.log('✅ Sign in successful');
      return data;
    } catch (error) {
      console.error('❌ Sign in failed:', error);
      handleError(error, 'AuthContext.signIn');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    // Prevenir múltiples llamadas simultáneas
    if (logoutInProgressRef.current) {
      console.log('⏳ Logout already in progress, skipping...');
      return;
    }

    const toastId = showLoading('Cerrando sesión...');
    logoutInProgressRef.current = true;

    try {
      console.log('👋 Starting sign out process...');

      // Limpiar estado local primero para UI responsiva
      setLoading(true);

      // Cerrar sesión en Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ Supabase signOut error:', error);
        // No lanzar error, continuar con limpieza local
      }

      // Limpiar estado local
      setUser(null);
      setUserProfile(null);
      setSession(null);

      // Limpiar localStorage de forma segura
      try {
        const keysToRemove = Object.keys(localStorage).filter(key => 
          key.includes('supabase') || key.startsWith('sb-')
        );
        keysToRemove.forEach(key => localStorage.removeItem(key));
      } catch (storageError) {
        console.warn('⚠️ Could not clear localStorage:', storageError);
      }

      dismissToast(toastId);
      showSuccess('¡Hasta luego! Sesión cerrada correctamente');
      
      console.log('✅ Sign out completed successfully');

      // Pequeño delay para que el usuario vea el mensaje
      setTimeout(() => {
        // Redirigir a la página principal
        window.location.href = '/';
      }, 1000);

    } catch (error) {
      dismissToast(toastId);
      console.error('❌ Sign out failed:', error);
      
      // Incluso si falla, limpiar estado local
      setUser(null);
      setUserProfile(null);
      setSession(null);
      
      handleError(error, 'AuthContext.signOut');
      
      // Forzar redirección en caso de error
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
      
    } finally {
      setLoading(false);
      logoutInProgressRef.current = false;
    }
  };

  const signInWithGoogle = async () => {
    try {
      console.log('🔐 Signing in with Google');

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Google sign in failed:', error);
      handleError(error, 'AuthContext.signInWithGoogle');
      throw error;
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) {
      showWarning('Debes iniciar sesión para actualizar tu perfil');
      return;
    }

    try {
      console.log('👤 Updating user profile:', user.id);

      const { error } = await supabase
        .from('users')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (error) throw error;

      // Actualizar estado local
      if (userProfile) {
        setUserProfile({ ...userProfile, ...updates });
      }

      showSuccess('Perfil actualizado correctamente');
      console.log('✅ Profile updated successfully');
    } catch (error) {
      console.error('❌ Profile update failed:', error);
      handleError(error, 'AuthContext.updateProfile', user.id);
      throw error;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      console.log('🔄 Refreshing user profile');
      await loadUserProfile(user.id);
    }
  };

  const value = {
    user,
    userProfile,
    session,
    loading,
    initialized,
    signUp,
    signIn,
    signOut,
    signInWithGoogle,
    updateProfile,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}