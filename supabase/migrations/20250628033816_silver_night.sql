/*
  # Ensure Row Level Security Policies

  1. Security
    - Enable RLS on all tables
    - Create policies for questions, answers, reports, and other entities
    - Ensure proper access control based on user roles and ownership

  2. Policies
    - Global read access for public content
    - Write access only for authenticated users
    - Update/delete access only for content owners or admins/moderators
*/

-- Make sure RLS is enabled on all tables
ALTER TABLE IF EXISTS public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Questions Policies
DO $$ 
BEGIN
  -- Drop existing policies to avoid conflicts
  DROP POLICY IF EXISTS "Anyone can view questions" ON public.questions;
  DROP POLICY IF EXISTS "Users can create questions" ON public.questions;
  DROP POLICY IF EXISTS "Users can update own questions" ON public.questions;
  DROP POLICY IF EXISTS "Users can delete own questions" ON public.questions;
  DROP POLICY IF EXISTS "Admins can update any question" ON public.questions;
  DROP POLICY IF EXISTS "Admins can delete any question" ON public.questions;
  DROP POLICY IF EXISTS "Moderators can update any question" ON public.questions;
  
  -- Create policies
  CREATE POLICY "Anyone can view questions" 
    ON public.questions FOR SELECT 
    USING (true);
  
  CREATE POLICY "Users can create questions" 
    ON public.questions FOR INSERT 
    TO authenticated 
    WITH CHECK (auth.uid() = user_id);
  
  CREATE POLICY "Users can update own questions" 
    ON public.questions FOR UPDATE 
    TO authenticated 
    USING (auth.uid() = user_id);
  
  CREATE POLICY "Users can delete own questions" 
    ON public.questions FOR DELETE 
    TO authenticated 
    USING (auth.uid() = user_id);
  
  CREATE POLICY "Admins can update any question" 
    ON public.questions FOR UPDATE 
    TO authenticated 
    USING (
      EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role = 'admin'
      )
    );
  
  CREATE POLICY "Admins can delete any question" 
    ON public.questions FOR DELETE 
    TO authenticated 
    USING (
      EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role = 'admin'
      )
    );
  
  CREATE POLICY "Moderators can update any question" 
    ON public.questions FOR UPDATE 
    TO authenticated 
    USING (
      EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role = 'moderator'
      )
    );
END $$;

-- Answers Policies
DO $$ 
BEGIN
  -- Drop existing policies to avoid conflicts
  DROP POLICY IF EXISTS "Anyone can view answers" ON public.answers;
  DROP POLICY IF EXISTS "Users can create answers" ON public.answers;
  DROP POLICY IF EXISTS "Users can update own answers" ON public.answers;
  DROP POLICY IF EXISTS "Users can delete own answers" ON public.answers;
  DROP POLICY IF EXISTS "Admins can update any answer" ON public.answers;
  DROP POLICY IF EXISTS "Admins can delete any answer" ON public.answers;
  DROP POLICY IF EXISTS "Moderators can update any answer" ON public.answers;
  
  -- Create policies
  CREATE POLICY "Anyone can view answers" 
    ON public.answers FOR SELECT 
    USING (true);
  
  CREATE POLICY "Users can create answers" 
    ON public.answers FOR INSERT 
    TO authenticated 
    WITH CHECK (auth.uid() = user_id);
  
  CREATE POLICY "Users can update own answers" 
    ON public.answers FOR UPDATE 
    TO authenticated 
    USING (auth.uid() = user_id);
  
  CREATE POLICY "Users can delete own answers" 
    ON public.answers FOR DELETE 
    TO authenticated 
    USING (auth.uid() = user_id);
  
  CREATE POLICY "Admins can update any answer" 
    ON public.answers FOR UPDATE 
    TO authenticated 
    USING (
      EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role = 'admin'
      )
    );
  
  CREATE POLICY "Admins can delete any answer" 
    ON public.answers FOR DELETE 
    TO authenticated 
    USING (
      EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role = 'admin'
      )
    );
  
  CREATE POLICY "Moderators can update any answer" 
    ON public.answers FOR UPDATE 
    TO authenticated 
    USING (
      EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role = 'moderator'
      )
    );
END $$;

-- Reports Policies
DO $$ 
BEGIN
  -- Drop existing policies to avoid conflicts
  DROP POLICY IF EXISTS "Admins can view all reports" ON public.reports;
  DROP POLICY IF EXISTS "Users can view own reports" ON public.reports;
  DROP POLICY IF EXISTS "Users can create reports" ON public.reports;
  DROP POLICY IF EXISTS "Admins can update reports" ON public.reports;
  DROP POLICY IF EXISTS "Moderators can view all reports" ON public.reports;
  DROP POLICY IF EXISTS "Moderators can update reports" ON public.reports;
  
  -- Create policies
  CREATE POLICY "Admins can view all reports" 
    ON public.reports FOR SELECT 
    TO authenticated 
    USING (
      EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role = 'admin'
      )
    );
  
  CREATE POLICY "Moderators can view all reports" 
    ON public.reports FOR SELECT 
    TO authenticated 
    USING (
      EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role = 'moderator'
      )
    );
  
  CREATE POLICY "Users can view own reports" 
    ON public.reports FOR SELECT 
    TO authenticated 
    USING (auth.uid() = reporter_id);
  
  CREATE POLICY "Users can create reports" 
    ON public.reports FOR INSERT 
    TO authenticated 
    WITH CHECK (auth.uid() = reporter_id);
  
  CREATE POLICY "Admins can update reports" 
    ON public.reports FOR UPDATE 
    TO authenticated 
    USING (
      EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role = 'admin'
      )
    );
  
  CREATE POLICY "Moderators can update reports" 
    ON public.reports FOR UPDATE 
    TO authenticated 
    USING (
      EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role = 'moderator'
      )
    );
END $$;

-- Categories Policies
DO $$ 
BEGIN
  -- Drop existing policies to avoid conflicts
  DROP POLICY IF EXISTS "Anyone can view categories" ON public.categories;
  DROP POLICY IF EXISTS "Admins can create categories" ON public.categories;
  DROP POLICY IF EXISTS "Admins can update categories" ON public.categories;
  DROP POLICY IF EXISTS "Admins can delete categories" ON public.categories;
  
  -- Create policies
  CREATE POLICY "Anyone can view categories" 
    ON public.categories FOR SELECT 
    USING (true);
  
  CREATE POLICY "Admins can create categories" 
    ON public.categories FOR INSERT 
    TO authenticated 
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role = 'admin'
      )
    );
  
  CREATE POLICY "Admins can update categories" 
    ON public.categories FOR UPDATE 
    TO authenticated 
    USING (
      EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role = 'admin'
      )
    );
  
  CREATE POLICY "Admins can delete categories" 
    ON public.categories FOR DELETE 
    TO authenticated 
    USING (
      EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role = 'admin'
      )
    );
END $$;

-- Votes Policies
DO $$ 
BEGIN
  -- Drop existing policies to avoid conflicts
  DROP POLICY IF EXISTS "Anyone can view all votes" ON public.votes;
  DROP POLICY IF EXISTS "Users can create votes" ON public.votes;
  DROP POLICY IF EXISTS "Users can update own votes" ON public.votes;
  DROP POLICY IF EXISTS "Users can delete own votes" ON public.votes;
  
  -- Create policies
  CREATE POLICY "Anyone can view all votes" 
    ON public.votes FOR SELECT 
    USING (true);
  
  CREATE POLICY "Users can create votes" 
    ON public.votes FOR INSERT 
    TO authenticated 
    WITH CHECK (auth.uid() = user_id);
  
  CREATE POLICY "Users can update own votes" 
    ON public.votes FOR UPDATE 
    TO authenticated 
    USING (auth.uid() = user_id);
  
  CREATE POLICY "Users can delete own votes" 
    ON public.votes FOR DELETE 
    TO authenticated 
    USING (auth.uid() = user_id);
END $$;

-- Users Policies
DO $$ 
BEGIN
  -- Drop existing policies to avoid conflicts
  DROP POLICY IF EXISTS "Users can view all profiles" ON public.users;
  DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
  DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
  DROP POLICY IF EXISTS "Admins can update any profile" ON public.users;
  
  -- Create policies
  CREATE POLICY "Users can view all profiles" 
    ON public.users FOR SELECT 
    TO authenticated 
    USING (true);
  
  CREATE POLICY "Users can insert own profile" 
    ON public.users FOR INSERT 
    TO authenticated 
    WITH CHECK (auth.uid() = id);
  
  CREATE POLICY "Users can update own profile" 
    ON public.users FOR UPDATE 
    TO authenticated 
    USING (auth.uid() = id);
  
  CREATE POLICY "Admins can update any profile" 
    ON public.users FOR UPDATE 
    TO authenticated 
    USING (
      EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role = 'admin'
      )
    );
END $$;

-- Create helper function to check if user is admin or moderator
CREATE OR REPLACE FUNCTION public.is_admin_or_moderator()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND (users.role = 'admin' OR users.role = 'moderator')
  );
$$;

-- Create helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  );
$$;