/*
  # Sistema de Notificaciones en Tiempo Real y Mensajería

  1. Nuevas Tablas
    - `notifications` - Sistema de notificaciones para usuarios
    - `conversations` - Conversaciones privadas entre usuarios
    - `messages` - Mensajes dentro de conversaciones
    - `notification_preferences` - Preferencias de notificación por usuario

  2. Tipos Enum
    - `notification_type` - Tipos de notificaciones
    - `message_type` - Tipos de mensajes

  3. Seguridad
    - RLS habilitado en todas las tablas
    - Políticas para usuarios autenticados
    - Funciones para gestión de notificaciones

  4. Triggers
    - Auto-creación de notificaciones
    - Actualización de timestamps
    - Marcado de mensajes como leídos
*/

-- Crear tipos enum para notificaciones
DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM (
    'new_answer',
    'answer_voted',
    'question_answered',
    'best_answer_selected',
    'new_message',
    'mention',
    'badge_earned',
    'level_up',
    'question_voted'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Crear tipos enum para mensajes
DO $$ BEGIN
  CREATE TYPE message_type AS ENUM (
    'text',
    'image',
    'file',
    'system'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Tabla de preferencias de notificación
CREATE TABLE IF NOT EXISTS notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email_notifications boolean DEFAULT true,
  push_notifications boolean DEFAULT true,
  new_answers boolean DEFAULT true,
  votes boolean DEFAULT true,
  messages boolean DEFAULT true,
  mentions boolean DEFAULT true,
  badges boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(user_id)
);

-- Tabla de notificaciones
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title varchar(255) NOT NULL,
  message text NOT NULL,
  data jsonb DEFAULT '{}',
  read boolean DEFAULT false,
  question_id uuid REFERENCES questions(id) ON DELETE CASCADE,
  answer_id uuid REFERENCES answers(id) ON DELETE CASCADE,
  from_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Tabla de conversaciones
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1 uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  participant_2 uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_message_id uuid,
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Asegurar que no haya conversaciones duplicadas
  CONSTRAINT unique_participants CHECK (participant_1 < participant_2),
  UNIQUE(participant_1, participant_2)
);

-- Tabla de mensajes
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content text NOT NULL,
  type message_type DEFAULT 'text',
  metadata jsonb DEFAULT '{}',
  read boolean DEFAULT false,
  read_at timestamptz,
  edited boolean DEFAULT false,
  edited_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

CREATE INDEX IF NOT EXISTS idx_conversations_participants ON conversations(participant_1, participant_2);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_read ON messages(read);

-- Habilitar RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Políticas para notification_preferences
CREATE POLICY "Users can view own notification preferences"
  ON notification_preferences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notification preferences"
  ON notification_preferences
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification preferences"
  ON notification_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Políticas para notifications
CREATE POLICY "Users can view own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Políticas para conversations
CREATE POLICY "Users can view own conversations"
  ON conversations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

CREATE POLICY "Users can create conversations"
  ON conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = participant_1 OR auth.uid() = participant_2);

CREATE POLICY "Users can update own conversations"
  ON conversations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

-- Políticas para messages
CREATE POLICY "Users can view messages in their conversations"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE id = conversation_id 
      AND (participant_1 = auth.uid() OR participant_2 = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in their conversations"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE id = conversation_id 
      AND (participant_1 = auth.uid() OR participant_2 = auth.uid())
    )
  );

CREATE POLICY "Users can update own messages"
  ON messages
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = sender_id);

-- Función para crear notificación
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id uuid,
  p_type notification_type,
  p_title varchar(255),
  p_message text,
  p_data jsonb DEFAULT '{}',
  p_question_id uuid DEFAULT NULL,
  p_answer_id uuid DEFAULT NULL,
  p_from_user_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_id uuid;
  user_preferences record;
BEGIN
  -- Verificar preferencias del usuario
  SELECT * INTO user_preferences 
  FROM notification_preferences 
  WHERE user_id = p_user_id;
  
  -- Si no tiene preferencias, crear con valores por defecto
  IF NOT FOUND THEN
    INSERT INTO notification_preferences (user_id) VALUES (p_user_id);
    SELECT * INTO user_preferences 
    FROM notification_preferences 
    WHERE user_id = p_user_id;
  END IF;
  
  -- Verificar si el usuario quiere este tipo de notificación
  IF (p_type = 'new_answer' AND NOT user_preferences.new_answers) OR
     (p_type IN ('answer_voted', 'question_voted') AND NOT user_preferences.votes) OR
     (p_type = 'new_message' AND NOT user_preferences.messages) OR
     (p_type = 'mention' AND NOT user_preferences.mentions) OR
     (p_type IN ('badge_earned', 'level_up') AND NOT user_preferences.badges) THEN
    RETURN NULL;
  END IF;
  
  -- Crear la notificación
  INSERT INTO notifications (
    user_id, type, title, message, data, question_id, answer_id, from_user_id
  ) VALUES (
    p_user_id, p_type, p_title, p_message, p_data, p_question_id, p_answer_id, p_from_user_id
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- Función para obtener o crear conversación
CREATE OR REPLACE FUNCTION get_or_create_conversation(
  p_user1 uuid,
  p_user2 uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  conversation_id uuid;
  participant1 uuid;
  participant2 uuid;
BEGIN
  -- Asegurar orden consistente de participantes
  IF p_user1 < p_user2 THEN
    participant1 := p_user1;
    participant2 := p_user2;
  ELSE
    participant1 := p_user2;
    participant2 := p_user1;
  END IF;
  
  -- Buscar conversación existente
  SELECT id INTO conversation_id
  FROM conversations
  WHERE participant_1 = participant1 AND participant_2 = participant2;
  
  -- Si no existe, crear nueva
  IF NOT FOUND THEN
    INSERT INTO conversations (participant_1, participant_2)
    VALUES (participant1, participant2)
    RETURNING id INTO conversation_id;
  END IF;
  
  RETURN conversation_id;
END;
$$;

-- Función para marcar mensajes como leídos
CREATE OR REPLACE FUNCTION mark_messages_as_read(
  p_conversation_id uuid,
  p_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE messages 
  SET read = true, read_at = now()
  WHERE conversation_id = p_conversation_id 
    AND sender_id != p_user_id 
    AND read = false;
END;
$$;

-- Trigger para actualizar last_message en conversaciones
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE conversations
  SET 
    last_message_id = NEW.id,
    last_message_at = NEW.created_at,
    updated_at = now()
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_conversation_last_message ON messages;
CREATE TRIGGER trigger_update_conversation_last_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();

-- Trigger para crear notificación de nueva respuesta
CREATE OR REPLACE FUNCTION notify_new_answer()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  question_owner uuid;
  question_title varchar(255);
  answerer_username varchar(50);
BEGIN
  -- Obtener información de la pregunta y el usuario que responde
  SELECT q.user_id, q.title, u.username
  INTO question_owner, question_title, answerer_username
  FROM questions q
  JOIN users u ON u.id = NEW.user_id
  WHERE q.id = NEW.question_id;
  
  -- No notificar si el usuario responde su propia pregunta
  IF question_owner != NEW.user_id THEN
    PERFORM create_notification(
      question_owner,
      'new_answer',
      'Nueva respuesta a tu pregunta',
      answerer_username || ' ha respondido a tu pregunta: ' || question_title,
      jsonb_build_object('answer_id', NEW.id, 'question_id', NEW.question_id),
      NEW.question_id,
      NEW.id,
      NEW.user_id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_new_answer ON answers;
CREATE TRIGGER trigger_notify_new_answer
  AFTER INSERT ON answers
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_answer();

-- Trigger para crear notificación de voto en respuesta
CREATE OR REPLACE FUNCTION notify_answer_vote()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  answer_owner uuid;
  voter_username varchar(50);
  question_title varchar(255);
BEGIN
  -- Obtener información del propietario de la respuesta y el votante
  SELECT a.user_id, u.username, q.title
  INTO answer_owner, voter_username, question_title
  FROM answers a
  JOIN users u ON u.id = NEW.user_id
  JOIN questions q ON q.id = a.question_id
  WHERE a.id = NEW.answer_id;
  
  -- No notificar si el usuario vota su propia respuesta
  IF answer_owner != NEW.user_id AND NEW.vote_type = 'up' THEN
    PERFORM create_notification(
      answer_owner,
      'answer_voted',
      'Tu respuesta recibió un voto positivo',
      voter_username || ' votó positivamente tu respuesta en: ' || question_title,
      jsonb_build_object('answer_id', NEW.answer_id, 'vote_type', NEW.vote_type),
      NULL,
      NEW.answer_id,
      NEW.user_id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_answer_vote ON votes;
CREATE TRIGGER trigger_notify_answer_vote
  AFTER INSERT ON votes
  FOR EACH ROW
  EXECUTE FUNCTION notify_answer_vote();

-- Trigger para crear notificación de mejor respuesta
CREATE OR REPLACE FUNCTION notify_best_answer()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  answer_owner uuid;
  question_title varchar(255);
BEGIN
  -- Solo procesar cuando se marca como mejor respuesta
  IF NEW.is_best = true AND (OLD.is_best IS NULL OR OLD.is_best = false) THEN
    -- Obtener información del propietario de la respuesta
    SELECT a.user_id, q.title
    INTO answer_owner, question_title
    FROM answers a
    JOIN questions q ON q.id = a.question_id
    WHERE a.id = NEW.id;
    
    PERFORM create_notification(
      answer_owner,
      'best_answer_selected',
      '¡Tu respuesta fue seleccionada como la mejor!',
      'Tu respuesta en "' || question_title || '" fue marcada como la mejor respuesta.',
      jsonb_build_object('answer_id', NEW.id, 'question_id', NEW.question_id),
      NEW.question_id,
      NEW.id,
      NULL
    );
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_best_answer ON answers;
CREATE TRIGGER trigger_notify_best_answer
  AFTER UPDATE ON answers
  FOR EACH ROW
  EXECUTE FUNCTION notify_best_answer();

-- Trigger para crear notificación de nuevo mensaje
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  recipient_id uuid;
  sender_username varchar(50);
BEGIN
  -- Obtener el destinatario del mensaje
  SELECT 
    CASE 
      WHEN c.participant_1 = NEW.sender_id THEN c.participant_2
      ELSE c.participant_1
    END,
    u.username
  INTO recipient_id, sender_username
  FROM conversations c
  JOIN users u ON u.id = NEW.sender_id
  WHERE c.id = NEW.conversation_id;
  
  -- Crear notificación para el destinatario
  PERFORM create_notification(
    recipient_id,
    'new_message',
    'Nuevo mensaje de ' || sender_username,
    LEFT(NEW.content, 100) || CASE WHEN LENGTH(NEW.content) > 100 THEN '...' ELSE '' END,
    jsonb_build_object('conversation_id', NEW.conversation_id, 'message_id', NEW.id),
    NULL,
    NULL,
    NEW.sender_id
  );
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_new_message ON messages;
CREATE TRIGGER trigger_notify_new_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_message();

-- Función para limpiar notificaciones antiguas (ejecutar periódicamente)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Eliminar notificaciones leídas de más de 30 días
  DELETE FROM notifications 
  WHERE read = true 
    AND created_at < now() - interval '30 days';
  
  -- Eliminar notificaciones no leídas de más de 90 días
  DELETE FROM notifications 
  WHERE read = false 
    AND created_at < now() - interval '90 days';
END;
$$;

-- Habilitar realtime para las tablas
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;