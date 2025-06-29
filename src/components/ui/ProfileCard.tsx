import React from 'react';
import { Link } from 'react-router-dom';
import { User, Calendar, MapPin, ExternalLink, Mail, Award } from 'lucide-react';
import { Card } from './Card';
import { Badge } from './Badge';
import { Avatar } from './Avatar';
import { Button } from './Button';
import { PointsDisplay } from './PointsDisplay';
import { MessageButton } from '../messaging/MessageButton';

interface ProfileCardProps {
  profile: {
    id: string;
    username: string;
    avatar_url: string | null;
    bio: string | null;
    level: number;
    points: number;
    role: string;
    created_at: string;
    location?: string | null;
    website?: string | null;
    education?: string | null;
    occupation?: string | null;
    full_name?: string | null;
  };
  isOwnProfile?: boolean;
  className?: string;
  variant?: 'full' | 'compact';
}

export function ProfileCard({ 
  profile, 
  isOwnProfile = false, 
  className = '',
  variant = 'full'
}: ProfileCardProps) {
  if (variant === 'compact') {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="flex items-center space-x-3">
          <Avatar
            src={profile.avatar_url}
            alt={profile.username}
            size="md"
          />
          <div className="flex-1 min-w-0">
            <Link 
              to={`/profile/${profile.id}`}
              className="text-base font-semibold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              {profile.full_name || profile.username}
            </Link>
            <div className="flex items-center space-x-2">
              <Badge variant="primary" size="sm">
                Nivel {profile.level}
              </Badge>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {profile.points.toLocaleString()} pts
              </span>
            </div>
          </div>
          
          {!isOwnProfile && (
            <MessageButton
              targetUserId={profile.id}
              targetUsername={profile.username}
              size="sm"
              variant="ghost"
            />
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
        <div className="flex-shrink-0">
          <Avatar
            src={profile.avatar_url}
            alt={profile.username}
            size="xl"
          />
        </div>
        
        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {profile.full_name || profile.username}
            </h2>
            <Badge variant={profile.role === 'admin' ? 'danger' : 'primary'} className="mt-1 sm:mt-0">
              {profile.role === 'admin' ? 'Administrador' : 
               profile.role === 'moderator' ? 'Moderador' : 'Usuario'}
            </Badge>
          </div>
          
          {profile.bio && (
            <p className="text-gray-600 dark:text-gray-400 mb-3">
              {profile.bio}
            </p>
          )}
          
          <div className="flex flex-wrap gap-y-2 gap-x-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              <span>Miembro desde {new Date(profile.created_at).toLocaleDateString()}</span>
            </div>
            
            {profile.location && (
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-1" />
                <span>{profile.location}</span>
              </div>
            )}
            
            {profile.website && (
              <div className="flex items-center text-primary-600 dark:text-primary-400">
                <ExternalLink className="w-4 h-4 mr-1" />
                <a href={profile.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                  {profile.website.replace(/^https?:\/\/(www\.)?/, '')}
                </a>
              </div>
            )}
          </div>
          
          <PointsDisplay 
            points={profile.points} 
            level={profile.level} 
            variant="compact"
            className="mb-4"
          />
          
          <div className="flex flex-col sm:flex-row gap-2">
            {isOwnProfile ? (
              <Link to="/profile/settings" className="flex-1">
                <Button variant="outline" className="w-full">
                  Editar Perfil
                </Button>
              </Link>
            ) : (
              <MessageButton
                targetUserId={profile.id}
                targetUsername={profile.username}
                className="flex-1"
              />
            )}
            
            <Link to={`/profile/${profile.id}`} className="flex-1">
              <Button variant={isOwnProfile ? 'primary' : 'outline'} className="w-full">
                {isOwnProfile ? 'Ver mi perfil' : 'Ver perfil completo'}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
}