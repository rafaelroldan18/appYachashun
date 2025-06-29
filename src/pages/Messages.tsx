import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { MessageCircle, Plus, Search, X, Send, Paperclip, Smile, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useConversations, useMessages } from '../hooks/useRealtime';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/ui/LoadingStates';
import { supabase } from '../lib/supabase';

interface NewConversationUser {
  id: string;
  username: string;
  avatar_url: string | null;
  level: number;
}

export function Messages() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { conversations, loading: conversationsLoading } = useConversations();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
    searchParams.get('conversation')
  );
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [searchUsers, setSearchUsers] = useState<NewConversationUser[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  const { messages, loading: messagesLoading, sendMessage } = useMessages(selectedConversationId);

  // Set initial conversation from URL params
  useEffect(() => {
    const conversationId = searchParams.get('conversation');
    if (conversationId) {
      setSelectedConversationId(conversationId);
    }
  }, [searchParams]);

  const filteredConversations = conversations.filter(conv =>
    conv.other_user?.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Ahora';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d`;
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversationId) return;

    try {
      await sendMessage(newMessage.trim());
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const searchUsersForNewConversation = async (query: string) => {
    if (!query.trim()) {
      setSearchUsers([]);
      return;
    }

    setSearchingUsers(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, avatar_url, level')
        .ilike('username', `%${query}%`)
        .neq('id', user?.id)
        .limit(10);

      if (error) throw error;
      setSearchUsers(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setSearchingUsers(false);
    }
  };

  const startNewConversation = async (otherUserId: string) => {
    try {
      const { data, error } = await supabase.rpc('get_or_create_conversation', {
        p_user1: user?.id,
        p_user2: otherUserId
      });

      if (error) throw error;

      setSelectedConversationId(data);
      setShowNewConversation(false);
      setSearchUsers([]);
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Verificando autenticación..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          {/* Back button */}
          <div className="mb-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/')}
              className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Volver al inicio
            </Button>
          </div>
          
          <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white flex items-center">
            <MessageCircle className="mr-3 h-8 w-8 text-primary-500" />
            Mensajes
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Conversa con otros estudiantes de la comunidad
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-large overflow-hidden h-[80vh]">
          <div className="flex h-full">
            {/* Conversations Sidebar */}
            <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 flex flex-col">
              {/* Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Conversaciones
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowNewConversation(true)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Buscar conversaciones..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Conversations List */}
              <div className="flex-1 overflow-y-auto">
                {conversationsLoading ? (
                  <div className="p-4 text-center">
                    <LoadingSpinner size="md" text="Cargando conversaciones..." />
                  </div>
                ) : filteredConversations.length > 0 ? (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredConversations.map((conversation) => (
                      <motion.div
                        key={conversation.id}
                        whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
                        className={`p-4 cursor-pointer transition-colors ${
                          selectedConversationId === conversation.id
                            ? 'bg-primary-50 dark:bg-primary-900/20'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                        onClick={() => setSelectedConversationId(conversation.id)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <Avatar
                              src={conversation.other_user?.avatar_url}
                              alt={conversation.other_user?.username || 'Usuario'}
                              size="md"
                            />
                            {conversation.unread_count > 0 && (
                              <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                                {conversation.unread_count}
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {conversation.other_user?.username}
                              </p>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {formatTimeAgo(conversation.last_message_at)}
                              </span>
                            </div>
                            
                            {conversation.last_message && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 truncate mt-1">
                                {conversation.last_message.content}
                              </p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={<MessageCircle className="w-12 h-12 text-gray-400" />}
                    title="No hay conversaciones"
                    description="Inicia una nueva conversación para comenzar a chatear."
                    action={
                      <Button onClick={() => setShowNewConversation(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Nueva conversación
                      </Button>
                    }
                    className="p-8"
                  />
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              {selectedConversationId ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    {(() => {
                      const conversation = conversations.find(c => c.id === selectedConversationId);
                      return conversation ? (
                        <div className="flex items-center space-x-3">
                          <Avatar
                            src={conversation.other_user?.avatar_url}
                            alt={conversation.other_user?.username || 'Usuario'}
                            size="sm"
                          />
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {conversation.other_user?.username}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              En línea hace 2 horas
                            </p>
                          </div>
                        </div>
                      ) : null;
                    })()}
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messagesLoading ? (
                      <div className="text-center">
                        <LoadingSpinner size="md" text="Cargando mensajes..." />
                      </div>
                    ) : messages.length > 0 ? (
                      messages.map((message) => (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${
                            message.sender_id === user?.id ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                            message.sender_id === user?.id
                              ? 'bg-primary-500 text-white'
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                          }`}>
                            <p className="text-sm">{message.content}</p>
                            <p className={`text-xs mt-1 ${
                              message.sender_id === user?.id
                                ? 'text-primary-100'
                                : 'text-gray-500 dark:text-gray-400'
                            }`}>
                              {formatTimeAgo(message.created_at)}
                            </p>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <EmptyState
                        icon={<MessageCircle className="w-8 h-8 text-gray-400" />}
                        title="No hay mensajes"
                        description="Envía el primer mensaje para comenzar la conversación."
                        className="py-8"
                      />
                    )}
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <Paperclip className="w-4 h-4" />
                      </Button>
                      
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Escribe un mensaje..."
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          <Smile className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <Button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="rounded-full"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </form>
                  </div>
                </>
              ) : (
                <EmptyState
                  icon={<MessageCircle className="w-16 h-16 text-gray-400" />}
                  title="Selecciona una conversación"
                  description="Elige una conversación para comenzar a chatear."
                  className="flex-1 flex items-center justify-center"
                />
              )}
            </div>
          </div>

          {/* New Conversation Modal */}
          <AnimatePresence>
            {showNewConversation && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/50 flex items-center justify-center p-4"
                onClick={() => setShowNewConversation(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl p-6"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Nueva conversación
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowNewConversation(false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Buscar usuarios..."
                      onChange={(e) => searchUsersForNewConversation(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div className="max-h-60 overflow-y-auto">
                    {searchingUsers ? (
                      <div className="text-center py-4">
                        <LoadingSpinner size="sm" />
                      </div>
                    ) : searchUsers.length > 0 ? (
                      <div className="space-y-2">
                        {searchUsers.map((user) => (
                          <motion.div
                            key={user.id}
                            whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
                            className="flex items-center space-x-3 p-3 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                            onClick={() => startNewConversation(user.id)}
                          >
                            <Avatar
                              src={user.avatar_url}
                              alt={user.username}
                              size="sm"
                            />
                            <div className="flex-1">
                              <p className="font-medium text-gray-900 dark:text-white">
                                {user.username}
                              </p>
                              <Badge variant="info" size="sm">
                                Nivel {user.level}
                              </Badge>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        Busca usuarios para iniciar una conversación
                      </div>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}