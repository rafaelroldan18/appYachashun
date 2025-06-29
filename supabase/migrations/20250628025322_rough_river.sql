/*
  # Add image_url column to questions table

  1. Changes
    - Add `image_url` column to `questions` table to store optional question images
    - Column is nullable to maintain backward compatibility
*/

ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS image_url text;

COMMENT ON COLUMN questions.image_url IS 'Optional image URL for the question';