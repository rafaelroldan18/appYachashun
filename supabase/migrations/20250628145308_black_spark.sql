/*
  # Fix Public Access to User Profiles

  1. Changes
    - Ensure public access to user profiles for non-authenticated users
    - Update RLS policies for users, questions, answers, and related tables
    - Allow public access to view usernames and profile information

  2. Security
    - Only read access is granted to public users
    - Write operations still require authentication
    - Maintains existing security model while enabling public viewing
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
DROP POLICY IF EXISTS "Public can view questions" ON public.questions;

CREATE POLICY "Public can view questions" 
  ON public.questions
  FOR SELECT 
  TO public
  USING (true);

-- Ensure answers table has public access
DROP POLICY IF EXISTS "Anyone can view answers" ON public.answers;
DROP POLICY IF EXISTS "Public can view answers" ON public.answers;

CREATE POLICY "Public can view answers" 
  ON public.answers
  FOR SELECT 
  TO public
  USING (true);

-- Ensure categories table has public access
DROP POLICY IF EXISTS "Anyone can view categories" ON public.categories;
DROP POLICY IF EXISTS "Public can view categories" ON public.categories;

CREATE POLICY "Public can view categories" 
  ON public.categories
  FOR SELECT 
  TO public
  USING (true);

-- Ensure votes table has public access for reading
DROP POLICY IF EXISTS "Anyone can view all votes" ON public.votes;
DROP POLICY IF EXISTS "Public can view votes" ON public.votes;

CREATE POLICY "Public can view votes" 
  ON public.votes
  FOR SELECT 
  TO public
  USING (true);

-- Ensure badges table has public access
DROP POLICY IF EXISTS "Anyone can view badges" ON public.badges;
DROP POLICY IF EXISTS "Public can view badges" ON public.badges;

CREATE POLICY "Public can view badges" 
  ON public.badges
  FOR SELECT 
  TO public
  USING (true);

-- Ensure user_badges table has public access
DROP POLICY IF EXISTS "Anyone can view user badges" ON public.user_badges;
DROP POLICY IF EXISTS "Public can view user badges" ON public.user_badges;

CREATE POLICY "Public can view user badges" 
  ON public.user_badges
  FOR SELECT 
  TO public
  USING (true);