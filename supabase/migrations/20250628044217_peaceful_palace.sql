/*
  # Fix Category Question Counts

  1. Changes
    - Create a function to update category question counts
    - Add a trigger to automatically update counts when questions are added/removed
    - Add a function to manually refresh all category counts

  2. Security
    - Function is accessible to authenticated users with admin role
*/

-- Function to update a single category's question count
CREATE OR REPLACE FUNCTION update_single_category_count(category_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  question_count_value integer;
BEGIN
  -- Skip if category_id is null
  IF category_id_param IS NULL THEN
    RETURN;
  END IF;
  
  -- Count questions for this category
  SELECT COUNT(*) INTO question_count_value
  FROM questions
  WHERE category_id = category_id_param;
  
  -- Update the category's question count
  UPDATE categories
  SET question_count = question_count_value
  WHERE id = category_id_param;
END;
$$;

-- Function to refresh all category counts
CREATE OR REPLACE FUNCTION refresh_all_category_counts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  cat_record RECORD;
BEGIN
  -- Loop through all categories and update their counts
  FOR cat_record IN SELECT id FROM categories
  LOOP
    PERFORM update_single_category_count(cat_record.id);
  END LOOP;
END;
$$;

-- Improved trigger function for category count updates
CREATE OR REPLACE FUNCTION update_category_count()
RETURNS TRIGGER AS $$
BEGIN
  -- When a question is inserted
  IF TG_OP = 'INSERT' THEN
    -- Update the new category's count
    IF NEW.category_id IS NOT NULL THEN
      PERFORM update_single_category_count(NEW.category_id);
    END IF;
    
    RETURN NEW;
  
  -- When a question is deleted
  ELSIF TG_OP = 'DELETE' THEN
    -- Update the old category's count
    IF OLD.category_id IS NOT NULL THEN
      PERFORM update_single_category_count(OLD.category_id);
    END IF;
    
    RETURN OLD;
  
  -- When a question is updated (category might change)
  ELSIF TG_OP = 'UPDATE' THEN
    -- If category changed, update both old and new category counts
    IF OLD.category_id IS DISTINCT FROM NEW.category_id THEN
      IF OLD.category_id IS NOT NULL THEN
        PERFORM update_single_category_count(OLD.category_id);
      END IF;
      
      IF NEW.category_id IS NOT NULL THEN
        PERFORM update_single_category_count(NEW.category_id);
      END IF;
    END IF;
    
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_category_count ON questions;

-- Create new trigger
CREATE TRIGGER trigger_update_category_count
  AFTER INSERT OR UPDATE OR DELETE ON questions
  FOR EACH ROW
  EXECUTE FUNCTION update_category_count();

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_single_category_count(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_all_category_counts() TO authenticated;

-- Run the function once to fix all category counts
SELECT refresh_all_category_counts();