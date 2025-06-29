import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, Search, Award, LogIn, UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Button } from './Button';
import { Card } from './Card';
import { FadeIn } from './FadeIn';

interface QuickActionsProps {
  className?: string;
  title?: string;
  animated?: boolean;
  delay?: number;
}

export function QuickActions({ 
  className = '', 
  title = 'Acciones Rápidas',
  animated = true,
  delay = 0.1
}: QuickActionsProps) {
  const { user } = useAuth();
  
  // Different actions based on authentication status
  const authenticatedActions = [
    { to: '/ask', icon: HelpCircle, label: 'Hacer una Pregunta', variant: 'primary' as const },
    { to: '/search?status=unanswered', icon: Search, label: 'Preguntas sin Responder', variant: 'outline' as const },
    { to: '/leaderboard', icon: Award, label: 'Ver Ranking', variant: 'outline' as const }
  ];
  
  const unauthenticatedActions = [
    { to: '/login', icon: LogIn, label: 'Iniciar Sesión', variant: 'primary' as const },
    { to: '/register', icon: UserPlus, label: 'Registrarse', variant: 'outline' as const },
    { to: '/leaderboard', icon: Award, label: 'Ver Ranking', variant: 'outline' as const }
  ];
  
  const actions = user ? authenticatedActions : unauthenticatedActions;

  return (
    <Card animated={animated} delay={delay} className={className}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">{title}</h3>
      <div className="space-y-3">
        {actions.map((action, index) => (
          <FadeIn key={action.to} delay={index * 0.05}>
            <Link to={action.to}>
              <Button variant={action.variant} className="w-full justify-start">
                <action.icon className="mr-2 h-4 w-4" />
                {action.label}
              </Button>
            </Link>
          </FadeIn>
        ))}
      </div>
    </Card>
  );
}