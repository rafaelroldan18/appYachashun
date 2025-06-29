/*
  # Update Category Colors to Blue and Green

  1. Changes
    - Update existing category colors to use blue and green instead of orange
    - Set default colors for new categories to blue and green
    - Ensure consistent color scheme across the platform
*/

-- Update existing categories to use blue and green colors
UPDATE categories
SET color = CASE
  WHEN name ILIKE '%matemáticas%' THEN '#3B82F6' -- Blue
  WHEN name ILIKE '%ciencias%' THEN '#10B981'   -- Green
  WHEN name ILIKE '%historia%' THEN '#3B82F6'   -- Blue
  WHEN name ILIKE '%inglés%' THEN '#10B981'     -- Green
  WHEN name ILIKE '%literatura%' THEN '#3B82F6' -- Blue
  WHEN name ILIKE '%geografía%' THEN '#10B981'  -- Green
  WHEN name ILIKE '%filosofía%' THEN '#3B82F6'  -- Blue
  WHEN name ILIKE '%arte%' THEN '#10B981'       -- Green
  WHEN name ILIKE '%tecnología%' THEN '#3B82F6' -- Blue
  WHEN name ILIKE '%otros%' THEN '#10B981'      -- Green
  ELSE 
    CASE WHEN (id::text)::integer % 2 = 0 THEN '#3B82F6' ELSE '#10B981' END
  END;

-- Update default color for categories table
ALTER TABLE categories 
ALTER COLUMN color SET DEFAULT '#3B82F6';

-- Run the refresh function to update all category counts
SELECT refresh_all_category_counts();