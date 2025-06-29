/*
  # Update Quechua to Kichwa

  1. Changes
    - Change "Quechua" to "Kichwa" in the categories table
    - Update the description to reflect Ecuadorian ancestral language
*/

-- Update the Quechua category to Kichwa
UPDATE categories 
SET 
  name = 'Kichwa',
  description = 'Idioma ancestral ecuatoriano'
WHERE name = 'Quechua';