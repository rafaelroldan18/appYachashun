/*
  # Add increment_view_count function

  1. New Functions
    - `increment_view_count(question_id uuid)` - Increments the view count for a specific question

  2. Security
    - Function is accessible to authenticated users
    - Only updates the view_count field of the specified question
*/

CREATE OR REPLACE FUNCTION public.increment_view_count(question_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.questions
  SET view_count = view_count + 1
  WHERE id = question_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.increment_view_count(uuid) TO authenticated;