-- Fix for increment_view_count function
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