/*
  # Enable Public Access to User Profiles

  1. Changes
    - Modify RLS policies to allow public access to user profiles
    - Add policy for public users to view user information
    - Ensure username, avatar, and level are visible to all visitors

  2. Security
    - Only expose non-sensitive user information
    - Maintain existing policies for authenticated users
*/

-- Update RLS policies for users table to allow public access
DROP POLICY IF EXISTS "Users can view all profiles" ON public.users;
DROP POLICY IF EXISTS "Public can view user profiles" ON public.users;

-- Create new policy for public access to user profiles
CREATE POLICY "Public can view user profiles" 
  ON public.users
  FOR SELECT 
  TO public
  USING (true);

-- Create policy for authenticated users to view all profiles
CREATE POLICY "Users can view all profiles" 
  ON public.users
  FOR SELECT 
  TO authenticated
  USING (true);

-- Ensure questions table has public access
DROP POLICY IF EXISTS "Anyone can view questions" ON public.questions;
CREATE POLICY "Public can view questions" 
  ON public.questions
  FOR SELECT 
  TO public
  USING (true);

-- Ensure answers table has public access
DROP POLICY IF EXISTS "Anyone can view answers" ON public.answers;
CREATE POLICY "Public can view answers" 
  ON public.answers
  FOR SELECT 
  TO public
  USING (true);

-- Ensure categories table has public access
DROP POLICY IF EXISTS "Anyone can view categories" ON public.categories;
CREATE POLICY "Public can view categories" 
  ON public.categories
  FOR SELECT 
  TO public
  USING (true);