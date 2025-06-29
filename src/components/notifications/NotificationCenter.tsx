import React, { useState } from 'react';
import { Bell, Check, CheckCheck, X, MessageCircle, Award, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useNotifications } from '../../hooks/useRealtime';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { Avatar } from '../ui/Avatar';

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, requestPermission } = useNotifications();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_answer':
      case 'question_answered':
        return MessageCircle;
      case 'answer_voted':
      case 'question_voted':
        return TrendingUp;
      case 'best_answer_selected':
      case 'badge_earned':
      case 'level_up':
        return Award;
      case 'new_message':
        return MessageCircle;
      default:
        return Bell;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'new_answer':
      case 'question_answered':
        return 'text-blue-500';
      case 'answer_voted':
      case 'question_voted':
        return 'text-green-500';
      case 'best_answer_selected':
      case 'badge_earned':
      case 'level_up':
        return 'text-yellow-500';
      case 'new_message':
        return 'text-purple-500';
      default:
        return 'text-gray-500';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Ahora';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes}m`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Hace ${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `Hace ${diffInDays}d`;
  };

  const handleNotificationClick = async (notification: any) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    setIsOpen(false);
  };

  const getNotificationLink = (notification: any) => {
    if (notification.question_id) {
      return `/question/${notification.question_id}`;
    }
    if (notification.data?.conversation_id) {
      return `/messages?conversation=${notification.data.conversation_id}`;
    }
    return '#';
  };

  React.useEffect(() => {
    requestPermission();
  }, []);

  return (
    <div className="relative">
      {/* Notification Bell */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
      >
        <Bell className="h-6 w-6" />
        
        {/* Unread count badge */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Notification Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-xl shadow-large border border-gray-200 dark:border-gray-700 z-50 max-h-[80vh] overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Notificaciones
                  </h3>
                  <div className="flex items-center space-x-2">
                    {unreadCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={markAllAsRead}
                        className="text-primary-600 hover:text-primary-700"
                      >
                        <CheckCheck className="w-4 h-4 mr-1" />
                        Marcar todas
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsOpen(false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Notifications List */}
              <div className="max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Cargando notificaciones...</p>
                  </div>
                ) : notifications.length > 0 ? (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {notifications.map((notification) => {
                      const IconComponent = getNotificationIcon(notification.type);
                      const iconColor = getNotificationColor(notification.type);
                      const link = getNotificationLink(notification);

                      return (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer ${
                            !notification.read ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                          }`}
                        >
                          <Link
                            to={link}
                            onClick={() => handleNotificationClick(notification)}
                            className="block"
                          >
                            <div className="flex items-start space-x-3">
                              {/* Icon */}
                              <div className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-700 ${iconColor}`}>
                                <IconComponent className="w-4 h-4" />
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <p className={`text-sm font-medium ${
                                      !notification.read 
                                        ? 'text-gray-900 dark:text-white' 
                                        : 'text-gray-700 dark:text-gray-300'
                                    }`}>
                                      {notification.title}
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                      {notification.message}
                                    </p>
                                    
                                    {/* From user */}
                                    {notification.from_user && (
                                      <div className="flex items-center mt-2">
                                        <Avatar
                                          src={notification.from_user.avatar_url}
                                          alt={notification.from_user.username}
                                          size="xs"
                                        />
                                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                                          {notification.from_user.username}
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex flex-col items-end space-y-1 ml-2">
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      {formatTimeAgo(notification.created_at)}
                                    </span>
                                    {!notification.read && (
                                      <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Link>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      No hay notificaciones
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Te notificaremos cuando tengas nuevas respuestas, votos o mensajes.
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <Link
                    to="/notifications"
                    onClick={() => setIsOpen(false)}
                    className="block text-center text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Ver todas las notificaciones
                  </Link>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}