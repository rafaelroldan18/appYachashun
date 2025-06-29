/*
  # Add full_name column to users table

  1. Changes
    - Add `full_name` column to `users` table to store user's full name
    - Column is nullable to maintain backward compatibility
*/

-- Add full_name column to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'full_name'
  ) THEN
    ALTER TABLE users ADD COLUMN full_name text;
  END IF;
END $$;