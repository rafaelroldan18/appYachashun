-- Create answer_ratings table
CREATE TABLE IF NOT EXISTS answer_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  answer_id uuid NOT NULL REFERENCES answers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(answer_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_answer_ratings_answer_id ON answer_ratings(answer_id);
CREATE INDEX IF NOT EXISTS idx_answer_ratings_user_id ON answer_ratings(user_id);

-- Enable RLS
ALTER TABLE answer_ratings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for answer_ratings
CREATE POLICY "Public can view answer ratings"
  ON answer_ratings
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can create answer ratings"
  ON answer_ratings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own answer ratings"
  ON answer_ratings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own answer ratings"
  ON answer_ratings
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to update answer rating statistics
CREATE OR REPLACE FUNCTION update_answer_rating_stats()
RETURNS TRIGGER AS $$
DECLARE
  avg_rating numeric;
  rating_count integer;
  answer_id_to_update uuid;
BEGIN
  -- Determine which answer to update
  IF TG_OP = 'DELETE' THEN
    answer_id_to_update := OLD.answer_id;
  ELSE
    answer_id_to_update := NEW.answer_id;
  END IF;
  
  -- Calculate average rating and count
  SELECT 
    COALESCE(AVG(rating), 0),
    COUNT(*)
  INTO 
    avg_rating,
    rating_count
  FROM answer_ratings
  WHERE answer_id = answer_id_to_update;
  
  -- Update answer with rating statistics
  -- Note: We're not actually storing this in the answers table
  -- but we could add columns for this if needed
  
  -- Award points based on rating
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.rating != OLD.rating) THEN
    -- Get the user who wrote the answer
    DECLARE
      answer_user_id uuid;
    BEGIN
      SELECT user_id INTO answer_user_id
      FROM answers
      WHERE id = answer_id_to_update;
      
      -- Award points based on rating (1-5 points)
      IF TG_OP = 'INSERT' THEN
        UPDATE users 
        SET points = points + NEW.rating,
            reputation_score = reputation_score + NEW.rating
        WHERE id = answer_user_id;
      ELSIF TG_OP = 'UPDATE' THEN
        -- Adjust points based on rating change
        UPDATE users 
        SET points = points - OLD.rating + NEW.rating,
            reputation_score = reputation_score - OLD.rating + NEW.rating
        WHERE id = answer_user_id;
      END IF;
    END;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating answer rating statistics
DROP TRIGGER IF EXISTS trigger_update_answer_rating_stats ON answer_ratings;
CREATE TRIGGER trigger_update_answer_rating_stats
  AFTER INSERT OR UPDATE OR DELETE ON answer_ratings
  FOR EACH ROW EXECUTE FUNCTION update_answer_rating_stats();

-- Function to notify about new ratings
CREATE OR REPLACE FUNCTION notify_answer_rating()
RETURNS TRIGGER AS $$
DECLARE
  answer_author_id uuid;
  question_id uuid;
  question_title text;
BEGIN
  -- Get answer author and question info
  SELECT a.user_id, a.question_id, q.title
  INTO answer_author_id, question_id, question_title
  FROM answers a
  JOIN questions q ON q.id = a.question_id
  WHERE a.id = NEW.answer_id;
  
  -- Don't notify if the rater is the same as answer author
  IF answer_author_id != NEW.user_id AND NEW.rating >= 4 THEN
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      question_id,
      answer_id,
      from_user_id
    ) VALUES (
      answer_author_id,
      'answer_voted',
      'Tu respuesta recibió una buena calificación',
      'Alguien calificó tu respuesta con ' || NEW.rating || ' estrellas en: ' || question_title,
      question_id,
      NEW.answer_id,
      NEW.user_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for answer rating notification
DROP TRIGGER IF EXISTS trigger_notify_answer_rating ON answer_ratings;
CREATE TRIGGER trigger_notify_answer_rating
  AFTER INSERT OR UPDATE ON answer_ratings
  FOR EACH ROW EXECUTE FUNCTION notify_answer_rating();