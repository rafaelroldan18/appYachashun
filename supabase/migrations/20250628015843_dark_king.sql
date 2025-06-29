/*
  # Admin Panel and Reports System

  1. New Tables
    - `reports` - For content and user reporting system
      - `id` (uuid, primary key)
      - `reporter_id` (uuid, references users)
      - `reported_user_id` (uuid, references users, nullable)
      - `question_id` (uuid, references questions, nullable)
      - `answer_id` (uuid, references answers, nullable)
      - `reason` (varchar, required)
      - `description` (text, optional)
      - `status` (enum: pending, reviewed, resolved, dismissed)
      - `reviewed_by` (uuid, references users, nullable)
      - `reviewed_at` (timestamptz, nullable)
      - `created_at` (timestamptz)

  2. Schema Updates
    - Add `is_reported` flag to questions and answers tables
    - Create report_status enum type

  3. Security
    - Enable RLS on reports table
    - Add policies for users and admins
    - Create admin helper functions

  4. Triggers
    - Auto-mark content as reported when reports are created
*/

-- Create report status enum if it doesn't exist
DO $$ BEGIN
  CREATE TYPE report_status AS ENUM ('pending', 'reviewed', 'resolved', 'dismissed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Drop existing reports table if it exists to avoid conflicts
DROP TABLE IF EXISTS reports CASCADE;

-- Create reports table
CREATE TABLE reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reported_user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  question_id uuid REFERENCES questions(id) ON DELETE CASCADE,
  answer_id uuid REFERENCES answers(id) ON DELETE CASCADE,
  reason varchar(100) NOT NULL,
  description text,
  status report_status DEFAULT 'pending',
  reviewed_by uuid REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  
  -- Ensure at least one target is specified
  CONSTRAINT valid_report CHECK (
    (question_id IS NOT NULL AND answer_id IS NULL) OR
    (question_id IS NULL AND answer_id IS NOT NULL) OR
    (reported_user_id IS NOT NULL)
  )
);

-- Add indexes for reports
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_reporter_id ON reports(reporter_id);
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);

-- Enable RLS
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Reports policies
CREATE POLICY "Users can create reports"
  ON reports
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view own reports"
  ON reports
  FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_id);

CREATE POLICY "Admins can view all reports"
  ON reports
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update reports"
  ON reports
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE id = user_id 
    AND role = 'admin'
  );
END;
$$;

-- Function to handle report resolution
CREATE OR REPLACE FUNCTION resolve_report(
  report_id uuid,
  admin_id uuid,
  new_status report_status,
  action_taken text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is admin
  IF NOT is_admin(admin_id) THEN
    RAISE EXCEPTION 'Only admins can resolve reports';
  END IF;

  -- Update report
  UPDATE reports 
  SET 
    status = new_status,
    reviewed_by = admin_id,
    reviewed_at = now()
  WHERE id = report_id;
END;
$$;

-- Add is_reported flag to questions if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'questions' AND column_name = 'is_reported'
  ) THEN
    ALTER TABLE questions ADD COLUMN is_reported boolean DEFAULT false;
  END IF;
END $$;

-- Add is_reported flag to answers if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'answers' AND column_name = 'is_reported'
  ) THEN
    ALTER TABLE answers ADD COLUMN is_reported boolean DEFAULT false;
  END IF;
END $$;

-- Function to mark content as reported
CREATE OR REPLACE FUNCTION mark_content_reported()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Mark question as reported if report is for a question
  IF NEW.question_id IS NOT NULL THEN
    UPDATE questions 
    SET is_reported = true 
    WHERE id = NEW.question_id;
  END IF;

  -- Mark answer as reported if report is for an answer
  IF NEW.answer_id IS NOT NULL THEN
    UPDATE answers 
    SET is_reported = true 
    WHERE id = NEW.answer_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for marking content as reported
DROP TRIGGER IF EXISTS trigger_mark_content_reported ON reports;
CREATE TRIGGER trigger_mark_content_reported
  AFTER INSERT ON reports
  FOR EACH ROW
  EXECUTE FUNCTION mark_content_reported();