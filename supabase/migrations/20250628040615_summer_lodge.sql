/*
  # Fix CASE statement missing ELSE clause

  1. Database Functions
    - Update functions that handle answer operations to include proper ELSE clauses
    - Fix any CASE statements in triggers and functions related to answers table
    
  2. Specific fixes
    - handle_answer_points function
    - handle_best_answer_points function
    - handle_vote_points function
    - handle_vote_deletion_points function
    - update_user_stats function
    
  3. Security
    - Maintain existing RLS policies
    - Ensure all functions handle edge cases properly
*/

-- Fix handle_answer_points function
CREATE OR REPLACE FUNCTION handle_answer_points()
RETURNS TRIGGER AS $$
BEGIN
  -- Award points for creating an answer
  UPDATE users 
  SET points = points + 10,
      reputation_score = reputation_score + 10
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fix handle_best_answer_points function
CREATE OR REPLACE FUNCTION handle_best_answer_points()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if is_best changed from false to true
  IF OLD.is_best = false AND NEW.is_best = true THEN
    -- Award points for best answer
    UPDATE users 
    SET points = points + 25,
        reputation_score = reputation_score + 25,
        best_answers = best_answers + 1
    WHERE id = NEW.user_id;
  ELSIF OLD.is_best = true AND NEW.is_best = false THEN
    -- Remove points if best answer status is removed
    UPDATE users 
    SET points = GREATEST(0, points - 25),
        reputation_score = GREATEST(0, reputation_score - 25),
        best_answers = GREATEST(0, best_answers - 1)
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fix handle_vote_points function
CREATE OR REPLACE FUNCTION handle_vote_points()
RETURNS TRIGGER AS $$
DECLARE
  answer_user_id uuid;
BEGIN
  -- Get the user who wrote the answer
  SELECT user_id INTO answer_user_id
  FROM answers
  WHERE id = NEW.answer_id;
  
  -- Award or deduct points based on vote type
  IF NEW.vote_type = 'up' THEN
    UPDATE users 
    SET points = points + 5,
        reputation_score = reputation_score + 5
    WHERE id = answer_user_id;
  ELSIF NEW.vote_type = 'down' THEN
    UPDATE users 
    SET points = GREATEST(0, points - 2),
        reputation_score = GREATEST(0, reputation_score - 2)
    WHERE id = answer_user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fix handle_vote_deletion_points function
CREATE OR REPLACE FUNCTION handle_vote_deletion_points()
RETURNS TRIGGER AS $$
DECLARE
  answer_user_id uuid;
BEGIN
  -- Get the user who wrote the answer
  SELECT user_id INTO answer_user_id
  FROM answers
  WHERE id = OLD.answer_id;
  
  -- Reverse the points based on the deleted vote type
  IF OLD.vote_type = 'up' THEN
    UPDATE users 
    SET points = GREATEST(0, points - 5),
        reputation_score = GREATEST(0, reputation_score - 5)
    WHERE id = answer_user_id;
  ELSIF OLD.vote_type = 'down' THEN
    UPDATE users 
    SET points = points + 2,
        reputation_score = reputation_score + 2
    WHERE id = answer_user_id;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Fix update_user_stats function
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'questions' THEN
    IF TG_OP = 'INSERT' THEN
      UPDATE users 
      SET questions_asked = questions_asked + 1
      WHERE id = NEW.user_id;
    ELSIF TG_OP = 'DELETE' THEN
      UPDATE users 
      SET questions_asked = GREATEST(0, questions_asked - 1)
      WHERE id = OLD.user_id;
    END IF;
  ELSIF TG_TABLE_NAME = 'answers' THEN
    IF TG_OP = 'INSERT' THEN
      UPDATE users 
      SET answers_given = answers_given + 1
      WHERE id = NEW.user_id;
    ELSIF TG_OP = 'DELETE' THEN
      UPDATE users 
      SET answers_given = GREATEST(0, answers_given - 1)
      WHERE id = OLD.user_id;
    END IF;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Fix update_answer_vote_count function
CREATE OR REPLACE FUNCTION update_answer_vote_count()
RETURNS TRIGGER AS $$
DECLARE
  upvote_count integer;
  downvote_count integer;
  answer_id_to_update uuid;
BEGIN
  -- Determine which answer to update
  IF TG_OP = 'DELETE' THEN
    answer_id_to_update := OLD.answer_id;
  ELSE
    answer_id_to_update := NEW.answer_id;
  END IF;
  
  -- Count current votes
  SELECT 
    COALESCE(SUM(CASE WHEN vote_type = 'up' THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN vote_type = 'down' THEN 1 ELSE 0 END), 0)
  INTO upvote_count, downvote_count
  FROM votes 
  WHERE answer_id = answer_id_to_update;
  
  -- Update answer vote counts
  UPDATE answers 
  SET 
    upvotes = upvote_count,
    downvotes = downvote_count,
    vote_count = upvote_count - downvote_count
  WHERE id = answer_id_to_update;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Fix update_question_answer_count function
CREATE OR REPLACE FUNCTION update_question_answer_count()
RETURNS TRIGGER AS $$
DECLARE
  question_id_to_update uuid;
  answer_count_value integer;
BEGIN
  -- Determine which question to update
  IF TG_OP = 'DELETE' THEN
    question_id_to_update := OLD.question_id;
  ELSE
    question_id_to_update := NEW.question_id;
  END IF;
  
  -- Count current answers for the question
  SELECT COUNT(*) INTO answer_count_value
  FROM answers 
  WHERE question_id = question_id_to_update;
  
  -- Update question answer count and is_answered status
  UPDATE questions 
  SET 
    answer_count = answer_count_value,
    is_answered = CASE WHEN answer_count_value > 0 THEN true ELSE false END
  WHERE id = question_id_to_update;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Fix update_category_count function
CREATE OR REPLACE FUNCTION update_category_count()
RETURNS TRIGGER AS $$
DECLARE
  category_id_to_update uuid;
  question_count_value integer;
BEGIN
  -- Handle category updates
  IF TG_OP = 'DELETE' THEN
    category_id_to_update := OLD.category_id;
  ELSE
    category_id_to_update := NEW.category_id;
  END IF;
  
  -- Only update if category_id is not null
  IF category_id_to_update IS NOT NULL THEN
    -- Count current questions for the category
    SELECT COUNT(*) INTO question_count_value
    FROM questions 
    WHERE category_id = category_id_to_update;
    
    -- Update category question count
    UPDATE categories 
    SET question_count = question_count_value
    WHERE id = category_id_to_update;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Fix mark_content_reported function
CREATE OR REPLACE FUNCTION mark_content_reported()
RETURNS TRIGGER AS $$
BEGIN
  -- Mark question as reported if question_id is provided
  IF NEW.question_id IS NOT NULL THEN
    UPDATE questions 
    SET is_reported = true 
    WHERE id = NEW.question_id;
  END IF;
  
  -- Mark answer as reported if answer_id is provided
  IF NEW.answer_id IS NOT NULL THEN
    UPDATE answers 
    SET is_reported = true 
    WHERE id = NEW.answer_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fix notification functions
CREATE OR REPLACE FUNCTION notify_new_answer()
RETURNS TRIGGER AS $$
DECLARE
  question_author_id uuid;
  question_title text;
BEGIN
  -- Get question author and title
  SELECT user_id, title INTO question_author_id, question_title
  FROM questions 
  WHERE id = NEW.question_id;
  
  -- Don't notify if the answer author is the same as question author
  IF question_author_id != NEW.user_id THEN
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      question_id,
      answer_id,
      from_user_id
    ) VALUES (
      question_author_id,
      'new_answer',
      'Nueva respuesta a tu pregunta',
      'Alguien ha respondido a tu pregunta: ' || question_title,
      NEW.question_id,
      NEW.id,
      NEW.user_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION notify_answer_vote()
RETURNS TRIGGER AS $$
DECLARE
  answer_author_id uuid;
  vote_type_text text;
BEGIN
  -- Get answer author
  SELECT user_id INTO answer_author_id
  FROM answers 
  WHERE id = NEW.answer_id;
  
  -- Don't notify if the voter is the same as answer author
  IF answer_author_id != NEW.user_id THEN
    -- Convert vote type to readable text
    vote_type_text := CASE 
      WHEN NEW.vote_type = 'up' THEN 'positivo'
      WHEN NEW.vote_type = 'down' THEN 'negativo'
      ELSE 'desconocido'
    END;
    
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      answer_id,
      from_user_id
    ) VALUES (
      answer_author_id,
      'answer_voted',
      'Voto en tu respuesta',
      'Tu respuesta recibió un voto ' || vote_type_text,
      NEW.answer_id,
      NEW.user_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION notify_best_answer()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify when is_best changes from false to true
  IF OLD.is_best = false AND NEW.is_best = true THEN
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      question_id,
      answer_id
    ) VALUES (
      NEW.user_id,
      'best_answer_selected',
      '¡Tu respuesta fue seleccionada como la mejor!',
      'Felicidades, tu respuesta ha sido marcada como la mejor respuesta.',
      NEW.question_id,
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
DECLARE
  recipient_id uuid;
BEGIN
  -- Get the recipient (the other participant in the conversation)
  SELECT 
    CASE 
      WHEN participant_1 = NEW.sender_id THEN participant_2
      WHEN participant_2 = NEW.sender_id THEN participant_1
      ELSE NULL
    END INTO recipient_id
  FROM conversations 
  WHERE id = NEW.conversation_id;
  
  -- Only create notification if we found a valid recipient
  IF recipient_id IS NOT NULL THEN
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      from_user_id
    ) VALUES (
      recipient_id,
      'new_message',
      'Nuevo mensaje',
      'Has recibido un nuevo mensaje',
      NEW.sender_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations 
  SET 
    last_message_id = NEW.id,
    last_message_at = NEW.created_at,
    updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;