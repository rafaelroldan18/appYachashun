/*
  # Add interests column to users table

  1. Changes
    - Add `interests` column to `users` table as TEXT[] (array of strings)
    - Column is nullable to allow existing users without interests
    - Set default value to empty array

  2. Security
    - No RLS changes needed as existing policies cover the new column
*/

-- Add interests column to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'interests'
  ) THEN
    ALTER TABLE users ADD COLUMN interests text[] DEFAULT '{}';
  END IF;
END $$;