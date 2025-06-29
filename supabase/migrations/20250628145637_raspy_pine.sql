/*
  # Question Voting System

  1. New Tables
    - `question_votes` - For storing votes on questions (similar to answer votes)

  2. Schema Updates
    - Add triggers to update question vote counts
    - Add functions to handle question vote points
    - Add notification system for question votes

  3. Security
    - Enable RLS on question_votes table
    - Add policies for users to vote on questions
    - Ensure public can view question votes

  4. Triggers
    - Auto-update question vote counts
    - Award points to question authors
    - Create notifications for question votes
*/

-- Create question_votes table
CREATE TABLE IF NOT EXISTS question_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vote_type vote_type NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(question_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_question_votes_question_id ON question_votes(question_id);
CREATE INDEX IF NOT EXISTS idx_question_votes_user_id ON question_votes(user_id);

-- Enable RLS
ALTER TABLE question_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for question_votes
CREATE POLICY "Public can view question votes"
  ON question_votes
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can create question votes"
  ON question_votes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own question votes"
  ON question_votes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own question votes"
  ON question_votes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to update question vote count
CREATE OR REPLACE FUNCTION update_question_vote_count()
RETURNS TRIGGER AS $$
DECLARE
  upvote_count integer;
  downvote_count integer;
  question_id_to_update uuid;
BEGIN
  -- Determine which question to update
  IF TG_OP = 'DELETE' THEN
    question_id_to_update := OLD.question_id;
  ELSE
    question_id_to_update := NEW.question_id;
  END IF;
  
  -- Count current votes
  SELECT 
    COALESCE(SUM(CASE WHEN vote_type = 'up' THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN vote_type = 'down' THEN 1 ELSE 0 END), 0)
  INTO upvote_count, downvote_count
  FROM question_votes 
  WHERE question_id = question_id_to_update;
  
  -- Update question vote count
  UPDATE questions 
  SET vote_count = upvote_count - downvote_count
  WHERE id = question_id_to_update;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating question vote count
DROP TRIGGER IF EXISTS trigger_update_question_vote_count ON question_votes;
CREATE TRIGGER trigger_update_question_vote_count
  AFTER INSERT OR DELETE ON question_votes
  FOR EACH ROW EXECUTE FUNCTION update_question_vote_count();

-- Function to handle question vote points
CREATE OR REPLACE FUNCTION handle_question_vote_points()
RETURNS TRIGGER AS $$
DECLARE
  question_user_id uuid;
BEGIN
  -- Get the user who wrote the question
  SELECT user_id INTO question_user_id
  FROM questions
  WHERE id = NEW.question_id;
  
  -- Award or deduct points based on vote type
  IF NEW.vote_type = 'up' THEN
    UPDATE users 
    SET points = points + 2,
        reputation_score = reputation_score + 2
    WHERE id = question_user_id;
  ELSIF NEW.vote_type = 'down' THEN
    UPDATE users 
    SET points = GREATEST(0, points - 1),
        reputation_score = GREATEST(0, reputation_score - 1)
    WHERE id = question_user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for question vote points
DROP TRIGGER IF EXISTS trigger_question_vote_points ON question_votes;
CREATE TRIGGER trigger_question_vote_points
  AFTER INSERT ON question_votes
  FOR EACH ROW EXECUTE FUNCTION handle_question_vote_points();

-- Function to handle question vote deletion points
CREATE OR REPLACE FUNCTION handle_question_vote_deletion_points()
RETURNS TRIGGER AS $$
DECLARE
  question_user_id uuid;
BEGIN
  -- Get the user who wrote the question
  SELECT user_id INTO question_user_id
  FROM questions
  WHERE id = OLD.question_id;
  
  -- Reverse the points based on the deleted vote type
  IF OLD.vote_type = 'up' THEN
    UPDATE users 
    SET points = GREATEST(0, points - 2),
        reputation_score = GREATEST(0, reputation_score - 2)
    WHERE id = question_user_id;
  ELSIF OLD.vote_type = 'down' THEN
    UPDATE users 
    SET points = points + 1,
        reputation_score = reputation_score + 1
    WHERE id = question_user_id;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for question vote deletion points
DROP TRIGGER IF EXISTS trigger_question_vote_deletion_points ON question_votes;
CREATE TRIGGER trigger_question_vote_deletion_points
  AFTER DELETE ON question_votes
  FOR EACH ROW EXECUTE FUNCTION handle_question_vote_deletion_points();

-- Function to notify question vote
CREATE OR REPLACE FUNCTION notify_question_vote()
RETURNS TRIGGER AS $$
DECLARE
  question_author_id uuid;
  question_title text;
BEGIN
  -- Get question author and title
  SELECT user_id, title INTO question_author_id, question_title
  FROM questions 
  WHERE id = NEW.question_id;
  
  -- Don't notify if the voter is the same as question author
  IF question_author_id != NEW.user_id AND NEW.vote_type = 'up' THEN
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      question_id,
      from_user_id
    ) VALUES (
      question_author_id,
      'question_voted',
      'Tu pregunta recibió un voto positivo',
      'Alguien votó positivamente tu pregunta: ' || question_title,
      NEW.question_id,
      NEW.user_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for question vote notification
DROP TRIGGER IF EXISTS trigger_notify_question_vote ON question_votes;
CREATE TRIGGER trigger_notify_question_vote
  AFTER INSERT ON question_votes
  FOR EACH ROW EXECUTE FUNCTION notify_question_vote();