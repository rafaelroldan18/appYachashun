/*
  # Add image_url column to answers table

  1. Changes
    - Add `image_url` column to `answers` table to store optional answer images
    - Column is nullable to maintain backward compatibility
*/

-- Add image_url column to answers table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'answers' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE answers ADD COLUMN image_url text;
  END IF;
END $$;

-- Add comment to the column
COMMENT ON COLUMN answers.image_url IS 'Optional image URL for the answer';

-- Update the answers type in the Database interface
-- This is a comment for documentation purposes only
-- The actual type update needs to be done in the TypeScript code