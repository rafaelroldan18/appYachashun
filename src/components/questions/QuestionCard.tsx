import React from 'react';
import { Link } from 'react-router-dom';
import { 
  MessageCircle, 
  Eye, 
  Calendar, 
  User, 
  Tag, 
  BookOpen,
  Check,
  TrendingUp,
  Image as ImageIcon,
  Edit,
  Trash2
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';

interface QuestionCardProps {
  question: {
    id: string;
    title: string;
    content: string;
    tags: string[];
    educational_level: string;
    is_answered: boolean;
    view_count: number;
    vote_count: number;
    answer_count: number;
    created_at: string;
    user_id?: string;
    image_url?: string | null;
    users: {
      username: string;
      level: number;
      avatar_url?: string | null;
      full_name?: string | null;
    } | null;
    categories: {
      name: string;
      color: string;
      icon: string | null;
    } | null;
  };
  showContent?: boolean;
  featured?: boolean;
  showActions?: boolean;
  onDelete?: (id: string) => void;
}

export function QuestionCard({ 
  question, 
  showContent = false, 
  featured = false,
  showActions = false,
  onDelete
}: QuestionCardProps) {
  const { user } = useAuth();
  const { can } = usePermissions();
  const isOwner = user?.id === question.user_id;

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Hace menos de 1 hora';
    if (diffInHours < 24) return `Hace ${diffInHours} horas`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `Hace ${diffInDays} días`;
  };

  const getEducationalLevelLabel = (level: string) => {
    const labels = {
      primaria: 'Primaria',
      secundaria: 'Secundaria',
      universidad: 'Universidad',
      otro: 'Otro'
    };
    return labels[level as keyof typeof labels] || level;
  };

  return (
    <Card 
      hover 
      className={`p-6 transition-all duration-200 ${
        featured ? 'ring-2 ring-primary-200 dark:ring-primary-800 bg-gradient-to-r from-primary-50 to-white dark:from-primary-900/20 dark:to-gray-800' : ''
      }`}
    >
      {featured && (
        <div className="flex items-center mb-3 text-primary-600 dark:text-primary-400">
          <TrendingUp className="w-4 h-4 mr-2" />
          <span className="text-sm font-medium">Pregunta Destacada</span>
        </div>
      )}

      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <Link 
            to={`/question/${question.id}`}
            className="text-xl font-semibold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors line-clamp-2"
          >
            {question.title}
          </Link>
          
          {showContent && (
            <div className="mt-3">
              <p className="text-gray-600 dark:text-gray-400 line-clamp-3 leading-relaxed">
                {question.content.substring(0, 200)}
                {question.content.length > 200 && '...'}
              </p>
              
              {/* Question Image */}
              {question.image_url && (
                <div className="mt-3">
                  <div className="relative inline-block">
                    <img
                      src={question.image_url}
                      alt="Imagen de la pregunta"
                      className="max-w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                      loading="lazy"
                    />
                    <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs flex items-center">
                      <ImageIcon className="w-3 h-3 mr-1" />
                      Ver imagen
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {question.is_answered && (
          <Badge variant="success" className="ml-4 flex-shrink-0">
            <Check className="w-3 h-3 mr-1" />
            Respondida
          </Badge>
        )}
      </div>
      
      {/* Tags and Category */}
      <div className="flex flex-wrap gap-2 mb-4">
        {question.categories && (
          <Badge 
            variant="primary" 
            className="flex items-center"
            style={{ 
              backgroundColor: question.categories.color + '20',
              color: question.categories.color,
              borderColor: question.categories.color + '40'
            }}
          >
            {question.categories.icon && <span className="mr-1">{question.categories.icon}</span>}
            {question.categories.name}
          </Badge>
        )}
        
        <Badge variant="secondary" size="sm">
          <BookOpen className="w-3 h-3 mr-1" />
          {getEducationalLevelLabel(question.educational_level)}
        </Badge>
        
        {question.tags.slice(0, 3).map((tag) => (
          <Badge key={tag} variant="secondary" size="sm">
            <Tag className="w-3 h-3 mr-1" />
            {tag}
          </Badge>
        ))}
        
        {question.tags.length > 3 && (
          <Badge variant="secondary" size="sm">
            +{question.tags.length - 3} más
          </Badge>
        )}
      </div>
      
      {/* Stats and Meta */}
      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            {question.users?.avatar_url ? (
              <Avatar
                src={question.users.avatar_url}
                alt={question.users.username}
                size="xs"
              />
            ) : (
              <User className="w-4 h-4" />
            )}
            <span>por {question.users?.full_name || question.users?.username || 'Usuario'}</span>
            {question.users?.level && (
              <Badge variant="info" size="sm">
                Nivel {question.users.level}
              </Badge>
            )}
          </div>
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-1" />
            <span>{formatTimeAgo(question.created_at)}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <Eye className="w-4 h-4 mr-1" />
            <span>{question.view_count}</span>
          </div>
          <div className="flex items-center">
            <MessageCircle className="w-4 h-4 mr-1" />
            <span>{question.answer_count}</span>
          </div>
          {question.vote_count > 0 && (
            <div className="flex items-center text-green-600 dark:text-green-400">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span>{question.vote_count}</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      {showActions && can.editQuestion(question.user_id || '') && (
        <div className="flex gap-2 pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
          <Link to={`/edit-question/${question.id}`}>
            <Button variant="outline" size="sm">
              <Edit className="w-4 h-4 mr-1" />
              Editar
            </Button>
          </Link>
          {onDelete && can.deleteQuestion(question.user_id || '') && (
            <Button 
              variant="danger" 
              size="sm"
              onClick={() => onDelete(question.id)}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Eliminar
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}