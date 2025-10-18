/*
  # Add unique constraint to questionnaires table

  1. Changes
    - Add unique constraint on `project_id` column in questionnaires table
    - This ensures only one questionnaire exists per project
    - Enables proper upsert behavior when updating questionnaires

  2. Notes
    - The constraint will prevent duplicate questionnaire entries
    - Existing duplicates will need to be cleaned up first
*/

-- First, delete duplicate questionnaires, keeping only the most recent one for each project
DELETE FROM questionnaires
WHERE id NOT IN (
  SELECT DISTINCT ON (project_id) id
  FROM questionnaires
  ORDER BY project_id, completed_at DESC NULLS LAST, created_at DESC
);

-- Add unique constraint on project_id
ALTER TABLE questionnaires 
ADD CONSTRAINT questionnaires_project_id_unique UNIQUE (project_id);