/*
  # Fix Infinite Recursion in Projects Table Policies
  
  The issue is caused by circular dependencies between projects and collaborators tables.
  The "Collaborators can view shared projects" policy creates infinite recursion.
  
  Solution: Remove the problematic policy and keep only direct ownership checks.
*/

-- Drop the problematic collaborators policy that causes recursion
DROP POLICY IF EXISTS "Collaborators can view shared projects" ON projects;

-- Keep only the direct ownership policies for projects
-- These policies are already in place but let's ensure they're correct

-- Drop all existing project policies
DROP POLICY IF EXISTS "Users can view own projects" ON projects;
DROP POLICY IF EXISTS "Users can create projects" ON projects;
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON projects;

-- Recreate simple, non-recursive policies
CREATE POLICY "projects_select_own" ON projects
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "projects_insert_own" ON projects
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "projects_update_own" ON projects
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "projects_delete_own" ON projects
  FOR DELETE
  USING (auth.uid() = user_id);

-- For collaborators viewing projects, we'll use a different approach
-- Create a view or use application-level logic instead of RLS
-- For now, users can only see their own projects directly
