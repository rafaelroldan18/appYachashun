import React, { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button';
import { MessageCenter } from './MessageCenter';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

interface MessageButtonProps {
  targetUserId: string;
  targetUsername: string;
  className?: string;
  variant?: 'primary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export function MessageButton({
  targetUserId,
  targetUsername,
  className = '',
  variant = 'outline',
  size = 'sm'
}: MessageButtonProps) {
  const { user } = useAuth();
  const [showMessageCenter, setShowMessageCenter] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Don't show message button for own profile
  if (!user || user.id === targetUserId) {
    return null;
  }

  const handleStartConversation = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_or_create_conversation', {
        p_user1: user.id,
        p_user2: targetUserId
      });

      if (error) throw error;

      setConversationId(data);
      setShowMessageCenter(true);
    } catch (error) {
      console.error('Error creating conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Button
          variant={variant}
          size={size}
          onClick={handleStartConversation}
          loading={loading}
          className={`flex items-center ${className}`}
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          Enviar mensaje
        </Button>
      </motion.div>

      {showMessageCenter && (
        <MessageCenter
          isOpen={showMessageCenter}
          onClose={() => setShowMessageCenter(false)}
          initialConversationId={conversationId || undefined}
        />
      )}
    </>
  );
}