import React from 'react';
import { Toaster } from 'react-hot-toast';
import { useTheme } from '../../context/ThemeContext';

export function ToastProvider() {
  const { theme } = useTheme();

  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      containerClassName=""
      containerStyle={{}}
      toastOptions={{
        // Define default options
        className: '',
        duration: 4000,
        style: {
          background: theme === 'dark' ? '#374151' : '#ffffff',
          color: theme === 'dark' ? '#f9fafb' : '#111827',
          border: theme === 'dark' ? '1px solid #4b5563' : '1px solid #e5e7eb',
          borderRadius: '12px',
          fontSize: '14px',
          fontWeight: '500',
          padding: '12px 16px',
          boxShadow: theme === 'dark' 
            ? '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)'
            : '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        },

        // Styling for different types
        success: {
          style: {
            background: theme === 'dark' ? '#065f46' : '#ecfdf5',
            color: theme === 'dark' ? '#a7f3d0' : '#065f46',
            border: theme === 'dark' ? '1px solid #047857' : '1px solid #a7f3d0',
          },
          iconTheme: {
            primary: '#10b981',
            secondary: theme === 'dark' ? '#065f46' : '#ecfdf5',
          },
        },

        error: {
          style: {
            background: theme === 'dark' ? '#7f1d1d' : '#fef2f2',
            color: theme === 'dark' ? '#fca5a5' : '#7f1d1d',
            border: theme === 'dark' ? '1px solid #dc2626' : '1px solid #fca5a5',
          },
          iconTheme: {
            primary: '#ef4444',
            secondary: theme === 'dark' ? '#7f1d1d' : '#fef2f2',
          },
        },

        loading: {
          style: {
            background: theme === 'dark' ? '#1e40af' : '#eff6ff',
            color: theme === 'dark' ? '#93c5fd' : '#1e40af',
            border: theme === 'dark' ? '1px solid #2563eb' : '1px solid #93c5fd',
          },
        },
      }}
    />
  );
}

// Custom toast components for specific use cases
export function SuccessToast({ message }: { message: string }) {
  return (
    <div className="flex items-center space-x-2">
      <div className="flex-shrink-0">
        <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      </div>
      <span>{message}</span>
    </div>
  );
}

export function ErrorToast({ message }: { message: string }) {
  return (
    <div className="flex items-center space-x-2">
      <div className="flex-shrink-0">
        <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      </div>
      <span>{message}</span>
    </div>
  );
}

export function WarningToast({ message }: { message: string }) {
  return (
    <div className="flex items-center space-x-2">
      <div className="flex-shrink-0">
        <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      </div>
      <span>{message}</span>
    </div>
  );
}

export function InfoToast({ message }: { message: string }) {
  return (
    <div className="flex items-center space-x-2">
      <div className="flex-shrink-0">
        <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      </div>
      <span>{message}</span>
    </div>
  );
}