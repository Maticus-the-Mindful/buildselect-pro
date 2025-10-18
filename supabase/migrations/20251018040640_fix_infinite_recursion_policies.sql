/*
  # Fix Infinite Recursion in RLS Policies

  1. Changes
    - Drop the problematic "Project owners can manage collaborators" policy
    - Create separate, specific policies for INSERT, UPDATE, and DELETE on collaborators
    - This prevents circular dependency between projects and collaborators tables

  2. Security
    - Maintains same security model: project owners can manage collaborators
    - Removes infinite recursion by avoiding SELECT checks during INSERT operations
*/

-- Drop the problematic policy
DROP POLICY IF EXISTS "Project owners can manage collaborators" ON collaborators;

-- Create specific policies for each operation
CREATE POLICY "Project owners can insert collaborators"
  ON collaborators
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = collaborators.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Project owners can delete collaborators"
  ON collaborators
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = collaborators.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Project owners can update collaborators"
  ON collaborators
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = collaborators.project_id
      AND projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = collaborators.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Also add a policy for project owners to read their collaborators
CREATE POLICY "Project owners can read collaborators"
  ON collaborators
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = collaborators.project_id
      AND projects.user_id = auth.uid()
    )
  );
