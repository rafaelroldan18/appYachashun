/*
  # Complete Yachashun Database Schema

  This migration creates the complete database schema for the Yachashun educational platform.

  ## Tables Created:
  1. **users** - Extended user profiles with gamification data
  2. **questions** - Student questions with categorization
  3. **answers** - Responses to questions with voting system
  4. **votes** - Individual vote records for answers
  5. **badges** - Achievement system definitions
  6. **user_badges** - User achievement records
  7. **reports** - Content moderation system
  8. **categories** - Subject categories for questions

  ## Security:
  - Row Level Security (RLS) enabled on all tables
  - Policies for authenticated users to manage their own data
  - Admin role support for moderation

  ## Features:
  - Gamification with points and levels
  - Achievement system with badges
  - Content reporting and moderation
  - Comprehensive Q&A system with voting
*/

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('user', 'admin', 'moderator');
CREATE TYPE vote_type AS ENUM ('up', 'down');
CREATE TYPE educational_level AS ENUM ('primaria', 'secundaria', 'universidad', 'otro');
CREATE TYPE report_status AS ENUM ('pending', 'reviewed', 'resolved', 'dismissed');

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name varchar(100) UNIQUE NOT NULL,
  description text,
  icon varchar(50),
  color varchar(20) DEFAULT '#3B82F6',
  question_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Extended users table (profile data)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username varchar(50) UNIQUE NOT NULL,
  email varchar(255) UNIQUE NOT NULL,
  avatar_url varchar(500),
  bio text,
  level integer DEFAULT 1,
  points integer DEFAULT 0,
  role user_role DEFAULT 'user',
  questions_asked integer DEFAULT 0,
  answers_given integer DEFAULT 0,
  best_answers integer DEFAULT 0,
  reputation_score integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT username_length CHECK (char_length(username) >= 3),
  CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_]+$')
);

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  title varchar(255) NOT NULL,
  content text NOT NULL,
  tags text[] DEFAULT '{}',
  educational_level educational_level DEFAULT 'secundaria',
  is_answered boolean DEFAULT false,
  best_answer_id uuid,
  view_count integer DEFAULT 0,
  vote_count integer DEFAULT 0,
  answer_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT title_length CHECK (char_length(title) >= 10),
  CONSTRAINT content_length CHECK (char_length(content) >= 20)
);

-- Answers table
CREATE TABLE IF NOT EXISTS answers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id uuid REFERENCES questions(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  vote_count integer DEFAULT 0,
  upvotes integer DEFAULT 0,
  downvotes integer DEFAULT 0,
  is_best boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT content_length CHECK (char_length(content) >= 10)
);

-- Votes table
CREATE TABLE IF NOT EXISTS votes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  answer_id uuid REFERENCES answers(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  vote_type vote_type NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(answer_id, user_id)
);

-- Badges table
CREATE TABLE IF NOT EXISTS badges (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name varchar(100) UNIQUE NOT NULL,
  description text NOT NULL,
  icon varchar(100),
  color varchar(20) DEFAULT '#F59E0B',
  requirements jsonb,
  points_required integer DEFAULT 0,
  rarity varchar(20) DEFAULT 'common',
  created_at timestamptz DEFAULT now()
);

-- User badges table
CREATE TABLE IF NOT EXISTS user_badges (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  badge_id uuid REFERENCES badges(id) ON DELETE CASCADE NOT NULL,
  earned_at timestamptz DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Reports table for content moderation
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  reported_user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  question_id uuid REFERENCES questions(id) ON DELETE CASCADE,
  answer_id uuid REFERENCES answers(id) ON DELETE CASCADE,
  reason varchar(100) NOT NULL,
  description text,
  status report_status DEFAULT 'pending',
  reviewed_by uuid REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_report CHECK (
    (question_id IS NOT NULL AND answer_id IS NULL) OR
    (question_id IS NULL AND answer_id IS NOT NULL) OR
    (reported_user_id IS NOT NULL)
  )
);

-- Add foreign key constraint for best_answer_id after answers table is created
ALTER TABLE questions ADD CONSTRAINT fk_best_answer 
  FOREIGN KEY (best_answer_id) REFERENCES answers(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_points ON users(points DESC);
CREATE INDEX IF NOT EXISTS idx_questions_user_id ON questions(user_id);
CREATE INDEX IF NOT EXISTS idx_questions_category_id ON questions(category_id);
CREATE INDEX IF NOT EXISTS idx_questions_created_at ON questions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_questions_is_answered ON questions(is_answered);
CREATE INDEX IF NOT EXISTS idx_questions_tags ON questions USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_answers_question_id ON answers(question_id);
CREATE INDEX IF NOT EXISTS idx_answers_user_id ON answers(user_id);
CREATE INDEX IF NOT EXISTS idx_answers_vote_count ON answers(vote_count DESC);
CREATE INDEX IF NOT EXISTS idx_votes_answer_id ON votes(answer_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view all profiles" ON users
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- RLS Policies for questions table
CREATE POLICY "Anyone can view questions" ON questions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create questions" ON questions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own questions" ON questions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own questions" ON questions
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for answers table
CREATE POLICY "Anyone can view answers" ON answers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create answers" ON answers
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own answers" ON answers
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own answers" ON answers
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for votes table
CREATE POLICY "Users can view all votes" ON votes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create votes" ON votes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own votes" ON votes
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own votes" ON votes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for badges table
CREATE POLICY "Anyone can view badges" ON badges
  FOR SELECT TO authenticated USING (true);

-- RLS Policies for user_badges table
CREATE POLICY "Anyone can view user badges" ON user_badges
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "System can award badges" ON user_badges
  FOR INSERT TO authenticated WITH CHECK (true);

-- RLS Policies for reports table
CREATE POLICY "Users can view own reports" ON reports
  FOR SELECT TO authenticated USING (auth.uid() = reporter_id);

CREATE POLICY "Users can create reports" ON reports
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);

-- RLS Policies for categories table
CREATE POLICY "Anyone can view categories" ON categories
  FOR SELECT TO authenticated USING (true);

-- Insert default categories
INSERT INTO categories (name, description, icon, color) VALUES
  ('Matemáticas', 'Álgebra, geometría, cálculo y más', '📊', '#3B82F6'),
  ('Ciencias', 'Física, química, biología', '🔬', '#10B981'),
  ('Historia', 'Historia mundial, nacional y regional', '📚', '#F59E0B'),
  ('Inglés', 'Gramática, vocabulario, conversación', '🇺🇸', '#8B5CF6'),
  ('Literatura', 'Análisis literario, poesía, narrativa', '📖', '#EC4899'),
  ('Geografía', 'Geografía física y humana', '🌍', '#6366F1'),
  ('Filosofía', 'Pensamiento crítico y reflexión', '🤔', '#84CC16'),
  ('Arte', 'Historia del arte, técnicas artísticas', '🎨', '#F97316'),
  ('Tecnología', 'Informática, programación, digital', '💻', '#06B6D4'),
  ('Otros', 'Otras materias y temas diversos', '📝', '#6B7280')
ON CONFLICT (name) DO NOTHING;

-- Insert default badges
INSERT INTO badges (name, description, icon, color, points_required, rarity) VALUES
  ('Primer Paso', 'Hiciste tu primera pregunta', '🌱', '#10B981', 0, 'common'),
  ('Colaborador', 'Diste tu primera respuesta', '🤝', '#3B82F6', 10, 'common'),
  ('Explorador', 'Visitaste 10 preguntas diferentes', '🗺️', '#F59E0B', 25, 'common'),
  ('Estudiante Activo', 'Acumulaste 100 puntos', '📚', '#8B5CF6', 100, 'uncommon'),
  ('Mentor', 'Recibiste 5 votos positivos', '👨‍🏫', '#EC4899', 150, 'uncommon'),
  ('Sabio', 'Obtuviste 3 mejores respuestas', '🧙‍♂️', '#6366F1', 300, 'rare'),
  ('Maestro', 'Acumulaste 1000 puntos', '🏆', '#F97316', 1000, 'epic'),
  ('Leyenda', 'Eres referente en la comunidad', '⭐', '#FCD34D', 5000, 'legendary')
ON CONFLICT (name) DO NOTHING;

-- Functions for updating counters and gamification

-- Function to update question answer count
CREATE OR REPLACE FUNCTION update_question_answer_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE questions 
    SET answer_count = answer_count + 1
    WHERE id = NEW.question_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE questions 
    SET answer_count = answer_count - 1
    WHERE id = OLD.question_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update answer vote count
CREATE OR REPLACE FUNCTION update_answer_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE answers 
    SET 
      vote_count = vote_count + CASE WHEN NEW.vote_type = 'up' THEN 1 ELSE -1 END,
      upvotes = upvotes + CASE WHEN NEW.vote_type = 'up' THEN 1 ELSE 0 END,
      downvotes = downvotes + CASE WHEN NEW.vote_type = 'down' THEN 1 ELSE 0 END
    WHERE id = NEW.answer_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE answers 
    SET 
      vote_count = vote_count - CASE WHEN OLD.vote_type = 'up' THEN 1 ELSE -1 END,
      upvotes = upvotes - CASE WHEN OLD.vote_type = 'up' THEN 1 ELSE 0 END,
      downvotes = downvotes - CASE WHEN OLD.vote_type = 'down' THEN 1 ELSE 0 END
    WHERE id = OLD.answer_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user statistics
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF TG_TABLE_NAME = 'questions' THEN
      UPDATE users 
      SET 
        questions_asked = questions_asked + 1,
        points = points + 5
      WHERE id = NEW.user_id;
    ELSIF TG_TABLE_NAME = 'answers' THEN
      UPDATE users 
      SET 
        answers_given = answers_given + 1,
        points = points + 10
      WHERE id = NEW.user_id;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update category question count
CREATE OR REPLACE FUNCTION update_category_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE categories 
    SET question_count = question_count + 1
    WHERE id = NEW.category_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE categories 
    SET question_count = question_count - 1
    WHERE id = OLD.category_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
CREATE TRIGGER trigger_update_question_answer_count
  AFTER INSERT OR DELETE ON answers
  FOR EACH ROW EXECUTE FUNCTION update_question_answer_count();

CREATE TRIGGER trigger_update_answer_vote_count
  AFTER INSERT OR DELETE ON votes
  FOR EACH ROW EXECUTE FUNCTION update_answer_vote_count();

CREATE TRIGGER trigger_update_user_stats_questions
  AFTER INSERT ON questions
  FOR EACH ROW EXECUTE FUNCTION update_user_stats();

CREATE TRIGGER trigger_update_user_stats_answers
  AFTER INSERT ON answers
  FOR EACH ROW EXECUTE FUNCTION update_user_stats();

CREATE TRIGGER trigger_update_category_count
  AFTER INSERT OR DELETE ON questions
  FOR EACH ROW EXECUTE FUNCTION update_category_count();