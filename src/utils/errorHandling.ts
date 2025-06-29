import toast from 'react-hot-toast';

// Error codes enum
export enum ERROR_CODES {
  NETWORK_ERROR = 'NETWORK_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  AUTH_ERROR = 'AUTH_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  PERMISSION_ERROR = 'PERMISSION_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  SUPABASE_CONNECTION_ERROR = 'SUPABASE_CONNECTION_ERROR',
  FORM_VALIDATION_ERROR = 'FORM_VALIDATION_ERROR',
  FILE_UPLOAD_ERROR = 'FILE_UPLOAD_ERROR'
}

// Error logging and handling utilities
export class ErrorLogger {
  private static instance: ErrorLogger;
  private errors: Array<{
    timestamp: Date;
    message: string;
    stack?: string;
    context?: string;
    details?: any;
  }> = [];

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  log(message: string, stack?: string, context?: string, details?: any) {
    const timestamp = new Date();
    const error = {
      timestamp,
      message,
      stack,
      context,
      details
    };
    
    this.errors.push(error);
    
    // Keep only last 100 errors to prevent memory leaks
    if (this.errors.length > 100) {
      this.errors = this.errors.slice(-100);
    }

    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('Error logged:', error);
    }
  }

  getErrors() {
    return [...this.errors];
  }

  clearErrors() {
    this.errors = [];
  }
}

// Error types
export enum ErrorType {
  NETWORK = 'NETWORK',
  DATABASE = 'DATABASE',
  AUTHENTICATION = 'AUTHENTICATION',
  VALIDATION = 'VALIDATION',
  PERMISSION = 'PERMISSION',
  NOT_FOUND = 'NOT_FOUND',
  UNKNOWN = 'UNKNOWN'
}

export interface AppError {
  type: ErrorType;
  message: string;
  details?: any;
  context?: string;
  timestamp: Date;
  code?: ERROR_CODES;
}

// Create error function
export function createError(
  message: string,
  code: ERROR_CODES,
  type?: ErrorType,
  context?: string,
  details?: any
): AppError {
  return {
    type: type || ErrorType.UNKNOWN,
    message,
    code,
    context,
    details,
    timestamp: new Date()
  };
}

// Error classification
export function classifyError(error: any): ErrorType {
  if (!error) return ErrorType.UNKNOWN;
  
  const message = error.message?.toLowerCase() || '';
  
  if (message.includes('fetch') || message.includes('network') || message.includes('conexión')) {
    return ErrorType.NETWORK;
  }
  
  if (message.includes('auth') || message.includes('unauthorized') || message.includes('forbidden')) {
    return ErrorType.AUTHENTICATION;
  }
  
  if (message.includes('not found') || message.includes('404')) {
    return ErrorType.NOT_FOUND;
  }
  
  if (message.includes('validation') || message.includes('invalid')) {
    return ErrorType.VALIDATION;
  }
  
  if (message.includes('permission') || message.includes('access denied')) {
    return ErrorType.PERMISSION;
  }
  
  if (error.code || message.includes('database') || message.includes('sql')) {
    return ErrorType.DATABASE;
  }
  
  return ErrorType.UNKNOWN;
}

// User-friendly error messages
export function getUserFriendlyMessage(error: any, context?: string): string {
  const errorType = classifyError(error);
  
  switch (errorType) {
    case ErrorType.NETWORK:
      return 'Error de conexión. Verifica tu conexión a internet e intenta nuevamente.';
    
    case ErrorType.DATABASE:
      return 'Error en la base de datos. Intenta nuevamente en unos momentos.';
    
    case ErrorType.AUTHENTICATION:
      return 'Error de autenticación. Por favor, inicia sesión nuevamente.';
    
    case ErrorType.VALIDATION:
      return 'Los datos ingresados no son válidos. Verifica la información.';
    
    case ErrorType.PERMISSION:
      return 'No tienes permisos para realizar esta acción.';
    
    case ErrorType.NOT_FOUND:
      return 'El recurso solicitado no fue encontrado.';
    
    default:
      if (context) {
        return `Error en ${context}. Intenta nuevamente.`;
      }
      return 'Ha ocurrido un error inesperado. Intenta nuevamente.';
  }
}

// Main error handler
export function handleError(error: any, context?: string): never {
  const logger = ErrorLogger.getInstance();
  const userMessage = getUserFriendlyMessage(error, context);
  
  // Log the error
  logger.log(
    userMessage,
    error?.stack,
    context,
    {
      originalError: error?.message,
      code: error?.code,
      type: classifyError(error)
    }
  );
  
  // Throw user-friendly error
  const appError = new Error(userMessage);
  appError.name = 'AppError';
  throw appError;
}

// Async error wrapper
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context?: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    handleError(error, context);
  }
}

// Network status checker
export function checkNetworkStatus(): boolean {
  return navigator.onLine;
}

// Retry mechanism
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        break;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  
  throw lastError;
}

// Supabase specific error handling
export function handleSupabaseError(error: any, context?: string): never {
  if (error?.message?.includes('Failed to fetch')) {
    const networkError = new Error('Error de conexión. Verifica tu conexión a internet y que Supabase esté configurado correctamente.');
    handleError(networkError, context);
  }
  
  if (error?.code === 'PGRST116') {
    const notFoundError = new Error('No se encontraron datos.');
    handleError(notFoundError, context);
  }
  
  if (error?.code === '42P01') {
    const dbError = new Error('Error de base de datos: tabla no encontrada.');
    handleError(dbError, context);
  }
  
  handleError(error, context);
}

// Toast utility functions
export function showSuccess(message: string): string {
  return toast.success(message);
}

export function showLoading(message: string): string {
  return toast.loading(message);
}

export function dismissToast(toastId: string): void {
  toast.dismiss(toastId);
}

export function showError(message: string): string {
  return toast.error(message);
}

export function showWarning(message: string): string {
  return toast(message, {
    icon: '⚠️',
    style: {
      background: '#FEF3C7',
      color: '#92400E',
      border: '1px solid #F59E0B'
    }
  });
}

export function showInfo(message: string): string {
  return toast(message, {
    icon: 'ℹ️',
    style: {
      background: '#DBEAFE',
      color: '#1E40AF',
      border: '1px solid #3B82F6'
    }
  });
}