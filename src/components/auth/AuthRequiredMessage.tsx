import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface AuthRequiredMessageProps {
  title?: string;
  message?: string;
  showLoginButton?: boolean;
  showRegisterButton?: boolean;
  className?: string;
}

export function AuthRequiredMessage({
  title = 'Inicia sesión para continuar',
  message = 'Necesitas una cuenta para poder realizar esta acción.',
  showLoginButton = true,
  showRegisterButton = true,
  className = '',
}: AuthRequiredMessageProps) {
  return (
    <Card className={`p-6 text-center ${className}`}>
      <AlertTriangle className="w-12 h-12 text-accent-500 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        {message}
      </p>
      {(showLoginButton || showRegisterButton) && (
        <div className="flex gap-4 justify-center">
          {showLoginButton && (
            <Link to="/login">
              <Button>Iniciar Sesión</Button>
            </Link>
          )}
          {showRegisterButton && (
            <Link to="/register">
              <Button variant="outline">Registrarse</Button>
            </Link>
          )}
        </div>
      )}
    </Card>
  );
}