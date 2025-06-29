/*
  # Gamification System Functions

  1. Functions
    - `award_points` - Awards points to users for various actions
    - `check_and_award_badges` - Checks and awards badges based on user achievements
    - `calculate_user_level` - Calculates user level based on points
    - `update_user_stats_on_answer` - Updates user stats when answering
    - `update_user_stats_on_vote` - Updates user stats when receiving votes

  2. Triggers
    - Automatic point awarding on answers, best answers, and votes
    - Badge checking and awarding
    - Level updates
*/

-- Function to award points to a user
CREATE OR REPLACE FUNCTION award_points(user_id_param UUID, points_param INTEGER, reason_param TEXT)
RETURNS VOID AS $$
BEGIN
  -- Update user points
  UPDATE users 
  SET 
    points = points + points_param,
    level = calculate_user_level(points + points_param),
    updated_at = NOW()
  WHERE id = user_id_param;
  
  -- Check for new badges
  PERFORM check_and_award_badges(user_id_param);
END;
$$ LANGUAGE plpgsql;

-- Function to calculate user level based on points
CREATE OR REPLACE FUNCTION calculate_user_level(points_param INTEGER)
RETURNS INTEGER AS $$
BEGIN
  -- Level = points / 100 + 1 (minimum level 1)
  RETURN GREATEST(1, (points_param / 100) + 1);
END;
$$ LANGUAGE plpgsql;

-- Function to check and award badges
CREATE OR REPLACE FUNCTION check_and_award_badges(user_id_param UUID)
RETURNS VOID AS $$
DECLARE
  user_record RECORD;
  badge_record RECORD;
BEGIN
  -- Get user stats
  SELECT * INTO user_record FROM users WHERE id = user_id_param;
  
  -- Check for badges that the user doesn't already have
  FOR badge_record IN 
    SELECT b.* FROM badges b
    WHERE b.id NOT IN (
      SELECT badge_id FROM user_badges WHERE user_id = user_id_param
    )
  LOOP
    -- Check badge requirements
    CASE badge_record.name
      WHEN 'Primera Respuesta' THEN
        IF user_record.answers_given >= 1 THEN
          INSERT INTO user_badges (user_id, badge_id) VALUES (user_id_param, badge_record.id);
        END IF;
      
      WHEN 'Estudiante Activo' THEN
        IF user_record.points >= 100 THEN
          INSERT INTO user_badges (user_id, badge_id) VALUES (user_id_param, badge_record.id);
        END IF;
      
      WHEN 'Mentor' THEN
        IF user_record.best_answers >= 5 THEN
          INSERT INTO user_badges (user_id, badge_id) VALUES (user_id_param, badge_record.id);
        END IF;
      
      WHEN 'Experto' THEN
        IF user_record.points >= 500 THEN
          INSERT INTO user_badges (user_id, badge_id) VALUES (user_id_param, badge_record.id);
        END IF;
      
      WHEN 'Sabio' THEN
        IF user_record.points >= 1000 THEN
          INSERT INTO user_badges (user_id, badge_id) VALUES (user_id_param, badge_record.id);
        END IF;
      
      WHEN 'Colaborador' THEN
        IF user_record.answers_given >= 10 THEN
          INSERT INTO user_badges (user_id, badge_id) VALUES (user_id_param, badge_record.id);
        END IF;
      
      WHEN 'Preguntón' THEN
        IF user_record.questions_asked >= 10 THEN
          INSERT INTO user_badges (user_id, badge_id) VALUES (user_id_param, badge_record.id);
        END IF;
      
      WHEN 'Estrella' THEN
        IF user_record.best_answers >= 10 THEN
          INSERT INTO user_badges (user_id, badge_id) VALUES (user_id_param, badge_record.id);
        END IF;
    END CASE;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to handle answer creation points
CREATE OR REPLACE FUNCTION handle_answer_points()
RETURNS TRIGGER AS $$
BEGIN
  -- Award 5 points for answering
  PERFORM award_points(NEW.user_id, 5, 'Respuesta creada');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle best answer points
CREATE OR REPLACE FUNCTION handle_best_answer_points()
RETURNS TRIGGER AS $$
BEGIN
  -- If answer is marked as best, award 10 additional points
  IF NEW.is_best = true AND (OLD.is_best IS NULL OR OLD.is_best = false) THEN
    PERFORM award_points(NEW.user_id, 10, 'Mejor respuesta');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle vote points
CREATE OR REPLACE FUNCTION handle_vote_points()
RETURNS TRIGGER AS $$
DECLARE
  answer_user_id UUID;
BEGIN
  -- Get the user who wrote the answer
  SELECT user_id INTO answer_user_id FROM answers WHERE id = NEW.answer_id;
  
  -- Award 1 point for upvote, subtract 1 for downvote
  IF NEW.vote_type = 'up' THEN
    PERFORM award_points(answer_user_id, 1, 'Voto positivo recibido');
  ELSIF NEW.vote_type = 'down' THEN
    PERFORM award_points(answer_user_id, -1, 'Voto negativo recibido');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle vote deletion points
CREATE OR REPLACE FUNCTION handle_vote_deletion_points()
RETURNS TRIGGER AS $$
DECLARE
  answer_user_id UUID;
BEGIN
  -- Get the user who wrote the answer
  SELECT user_id INTO answer_user_id FROM answers WHERE id = OLD.answer_id;
  
  -- Reverse the points when vote is deleted
  IF OLD.vote_type = 'up' THEN
    PERFORM award_points(answer_user_id, -1, 'Voto positivo eliminado');
  ELSIF OLD.vote_type = 'down' THEN
    PERFORM award_points(answer_user_id, 1, 'Voto negativo eliminado');
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic point awarding
DROP TRIGGER IF EXISTS trigger_answer_points ON answers;
CREATE TRIGGER trigger_answer_points
  AFTER INSERT ON answers
  FOR EACH ROW
  EXECUTE FUNCTION handle_answer_points();

DROP TRIGGER IF EXISTS trigger_best_answer_points ON answers;
CREATE TRIGGER trigger_best_answer_points
  AFTER UPDATE ON answers
  FOR EACH ROW
  EXECUTE FUNCTION handle_best_answer_points();

DROP TRIGGER IF EXISTS trigger_vote_points ON votes;
CREATE TRIGGER trigger_vote_points
  AFTER INSERT ON votes
  FOR EACH ROW
  EXECUTE FUNCTION handle_vote_points();

DROP TRIGGER IF EXISTS trigger_vote_deletion_points ON votes;
CREATE TRIGGER trigger_vote_deletion_points
  AFTER DELETE ON votes
  FOR EACH ROW
  EXECUTE FUNCTION handle_vote_deletion_points();

-- Insert default badges
INSERT INTO badges (name, description, icon, color, points_required, rarity) VALUES
('Primera Respuesta', 'Respondiste tu primera pregunta', '🎯', '#10B981', 0, 'common'),
('Estudiante Activo', 'Alcanzaste 100 puntos', '📚', '#3B82F6', 100, 'common'),
('Colaborador', 'Respondiste 10 preguntas', '🤝', '#8B5CF6', 0, 'uncommon'),
('Mentor', 'Tienes 5 mejores respuestas', '👨‍🏫', '#F59E0B', 0, 'uncommon'),
('Preguntón', 'Hiciste 10 preguntas', '❓', '#EF4444', 0, 'uncommon'),
('Experto', 'Alcanzaste 500 puntos', '🎓', '#DC2626', 500, 'rare'),
('Estrella', 'Tienes 10 mejores respuestas', '⭐', '#7C3AED', 0, 'rare'),
('Sabio', 'Alcanzaste 1000 puntos', '🧙‍♂️', '#059669', 1000, 'legendary')
ON CONFLICT (name) DO NOTHING;