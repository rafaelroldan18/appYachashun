import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials not found. Please set up your environment variables.');
  console.error('Required variables: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY');
}

// Configuración del cliente Supabase con opciones optimizadas
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    // Configuración de autenticación
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    // Configurar storage personalizado si es necesario
    storage: {
      getItem: (key: string) => {
        try {
          return localStorage.getItem(key);
        } catch (error) {
          console.warn('Error accessing localStorage:', error);
          return null;
        }
      },
      setItem: (key: string, value: string) => {
        try {
          localStorage.setItem(key, value);
        } catch (error) {
          console.warn('Error setting localStorage:', error);
        }
      },
      removeItem: (key: string) => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.warn('Error removing from localStorage:', error);
        }
      },
    },
  },
  // Configuración de realtime
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  // Configuración global
  global: {
    headers: {
      'X-Client-Info': 'yachashun-web',
    },
    fetch: (url, options = {}) => {
      // Add timeout and better error handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      return fetch(url, {
        ...options,
        signal: controller.signal,
      }).finally(() => {
        clearTimeout(timeoutId);
      });
    },
  },
});

// Función para verificar la conexión
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase credentials missing');
      return false;
    }

    // Test connection with a simple query
    const { data, error } = await supabase
      .from('categories')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('Supabase connection test failed:', error);
      return false;
    }
    
    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('Supabase connection check failed:', error);
    return false;
  }
}

// Función para obtener el estado de la sesión de forma segura
export async function getSessionSafely() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Error getting session:', error);
      return null;
    }
    return session;
  } catch (error) {
    console.error('Failed to get session:', error);
    return null;
  }
}

// Función para refrescar la sesión de forma segura
export async function refreshSessionSafely() {
  try {
    const { data: { session }, error } = await supabase.auth.refreshSession();
    if (error) {
      console.error('Error refreshing session:', error);
      return null;
    }
    return session;
  } catch (error) {
    console.error('Failed to refresh session:', error);
    return null;
  }
}

// Enhanced error handling for Supabase operations
export function handleSupabaseError(error: any, context: string = '') {
  console.error(`Supabase error${context ? ` in ${context}` : ''}:`, error);
  
  if (error?.message?.includes('Failed to fetch')) {
    throw new Error('Error de conexión. Verifica tu conexión a internet y que Supabase esté configurado correctamente.');
  }
  
  if (error?.code === 'PGRST116') {
    throw new Error('No se encontraron datos.');
  }
  
  if (error?.code === '42P01') {
    throw new Error('Error de base de datos: tabla no encontrada.');
  }
  
  throw new Error(error?.message || 'Error desconocido en la base de datos.');
}

// Database types based on the schema
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
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
        };
        Insert: {
          id: string;
          username: string;
          email: string;
          avatar_url?: string | null;
          bio?: string | null;
          level?: number;
          points?: number;
          role?: 'user' | 'admin' | 'moderator';
          questions_asked?: number;
          answers_given?: number;
          best_answers?: number;
          reputation_score?: number;
          interests?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          username?: string;
          avatar_url?: string | null;
          bio?: string | null;
          level?: number;
          points?: number;
          role?: 'user' | 'admin' | 'moderator';
          questions_asked?: number;
          answers_given?: number;
          best_answers?: number;
          reputation_score?: number;
          interests?: string[] | null;
          updated_at?: string;
        };
      };
      questions: {
        Row: {
          id: string;
          user_id: string;
          category_id: string | null;
          title: string;
          content: string;
          tags: string[];
          educational_level: 'primaria' | 'secundaria' | 'universidad' | 'otro';
          is_answered: boolean;
          best_answer_id: string | null;
          view_count: number;
          vote_count: number;
          answer_count: number;
          created_at: string;
          updated_at: string;
          is_reported: boolean;
          image_url: string | null;
        };
        Insert: {
          user_id: string;
          category_id?: string | null;
          title: string;
          content: string;
          tags?: string[];
          educational_level?: 'primaria' | 'secundaria' | 'universidad' | 'otro';
          is_answered?: boolean;
          best_answer_id?: string | null;
          view_count?: number;
          vote_count?: number;
          answer_count?: number;
          created_at?: string;
          updated_at?: string;
          is_reported?: boolean;
          image_url?: string | null;
        };
        Update: {
          category_id?: string | null;
          title?: string;
          content?: string;
          tags?: string[];
          educational_level?: 'primaria' | 'secundaria' | 'universidad' | 'otro';
          is_answered?: boolean;
          best_answer_id?: string | null;
          view_count?: number;
          vote_count?: number;
          answer_count?: number;
          updated_at?: string;
          is_reported?: boolean;
          image_url?: string | null;
        };
      };
      answers: {
        Row: {
          id: string;
          question_id: string;
          user_id: string;
          content: string;
          vote_count: number;
          upvotes: number;
          downvotes: number;
          is_best: boolean;
          created_at: string;
          updated_at: string;
          is_reported: boolean;
          image_url: string | null;
        };
        Insert: {
          question_id: string;
          user_id: string;
          content: string;
          vote_count?: number;
          upvotes?: number;
          downvotes?: number;
          is_best?: boolean;
          created_at?: string;
          updated_at?: string;
          is_reported?: boolean;
          image_url?: string | null;
        };
        Update: {
          content?: string;
          vote_count?: number;
          upvotes?: number;
          downvotes?: number;
          is_best?: boolean;
          updated_at?: string;
          is_reported?: boolean;
          image_url?: string | null;
        };
      };
      votes: {
        Row: {
          id: string;
          answer_id: string;
          user_id: string;
          vote_type: 'up' | 'down';
          created_at: string;
        };
        Insert: {
          answer_id: string;
          user_id: string;
          vote_type: 'up' | 'down';
          created_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          icon: string | null;
          color: string;
          question_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          name: string;
          description?: string | null;
          icon?: string | null;
          color?: string;
          question_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          description?: string | null;
          icon?: string | null;
          color?: string;
          question_count?: number;
          updated_at?: string;
        };
      };
      badges: {
        Row: {
          id: string;
          name: string;
          description: string;
          icon: string | null;
          color: string;
          requirements: any;
          points_required: number;
          rarity: string;
          created_at: string;
        };
      };
      user_badges: {
        Row: {
          id: string;
          user_id: string;
          badge_id: string;
          earned_at: string;
        };
        Insert: {
          user_id: string;
          badge_id: string;
          earned_at?: string;
        };
      };
      reports: {
        Row: {
          id: string;
          reporter_id: string;
          reported_user_id: string | null;
          question_id: string | null;
          answer_id: string | null;
          reason: string;
          description: string | null;
          status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
        };
        Insert: {
          reporter_id: string;
          reported_user_id?: string | null;
          question_id?: string | null;
          answer_id?: string | null;
          reason: string;
          description?: string | null;
          status?: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          message: string;
          data: any;
          read: boolean;
          question_id: string | null;
          answer_id: string | null;
          from_user_id: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          type: string;
          title: string;
          message: string;
          data?: any;
          read?: boolean;
          question_id?: string | null;
          answer_id?: string | null;
          from_user_id?: string | null;
          created_at?: string;
        };
        Update: {
          read?: boolean;
        };
      };
      conversations: {
        Row: {
          id: string;
          participant_1: string;
          participant_2: string;
          last_message_id: string | null;
          last_message_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          participant_1: string;
          participant_2: string;
          last_message_id?: string | null;
          last_message_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          last_message_id?: string | null;
          last_message_at?: string;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          type: string;
          metadata: any;
          read: boolean;
          read_at: string | null;
          edited: boolean;
          edited_at: string | null;
          created_at: string;
        };
        Insert: {
          conversation_id: string;
          sender_id: string;
          content: string;
          type?: string;
          metadata?: any;
          read?: boolean;
          read_at?: string | null;
          edited?: boolean;
          edited_at?: string | null;
          created_at?: string;
        };
        Update: {
          content?: string;
          read?: boolean;
          read_at?: string | null;
          edited?: boolean;
          edited_at?: string | null;
        };
      };
    };
  };
};