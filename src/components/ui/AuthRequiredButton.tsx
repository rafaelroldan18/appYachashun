import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from './Button';
import { Card } from './Card';
import { AlertTriangle } from 'lucide-react';

interface AuthRequiredButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  loading?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  title?: string;
  authMessage?: string;
}

export function AuthRequiredButton({
  onClick,
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  loading = false,
  disabled = false,
  type = 'button',
  title,
  authMessage = 'Debes iniciar sesión para realizar esta acción',
}: AuthRequiredButtonProps) {
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const handleClick = () => {
    if (user) {
      onClick();
    } else {
      setShowAuthModal(true);
    }
  };
  
  return (
    <>
      <Button
        type={type}
        variant={variant}
        size={size}
        onClick={handleClick}
        loading={loading}
        disabled={disabled}
        className={className}
        title={title}
      >
        {children}
      </Button>
      
      <AnimatePresence>
        {showAuthModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowAuthModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="p-6 text-center">
                <AlertTriangle className="w-12 h-12 text-accent-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Inicia sesión para continuar
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {authMessage}
                </p>
                <div className="flex gap-4 justify-center">
                  <Link to="/login">
                    <Button>Iniciar Sesión</Button>
                  </Link>
                  <Link to="/register">
                    <Button variant="outline">Registrarse</Button>
                  </Link>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}