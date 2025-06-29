import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from './Button';

interface BackButtonProps {
  label?: string;
  className?: string;
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost' | 'danger';
}

export function BackButton({ 
  label = 'Atrás', 
  className = '', 
  variant = 'ghost' 
}: BackButtonProps) {
  const navigate = useNavigate();
  
  const handleGoBack = () => {
    navigate(-1); // Navega a la página anterior en el historial
  };
  
  return (
    <Button 
      variant={variant} 
      size="sm" 
      onClick={handleGoBack}
      className={`text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 ${className}`}
    >
      <ArrowLeft className="w-5 h-5 mr-2" />
      {label}
    </Button>
  );
}