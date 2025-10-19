/*
  # URGENT: Fix Infinite Recursion in Projects Table
  
  This migration removes the problematic circular dependency between
  projects and collaborators tables that causes infinite recursion.
  
  Run this immediately to fix project creation.
*/

-- Drop ALL existing policies on projects table
DROP POLICY IF EXISTS "Users can view own projects" ON projects;
DROP POLICY IF EXISTS "Users can create projects" ON projects;
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON projects;
DROP POLICY IF EXISTS "Collaborators can view shared projects" ON projects;
DROP POLICY IF EXISTS "projects_select_own" ON projects;
DROP POLICY IF EXISTS "projects_insert_own" ON projects;
DROP POLICY IF EXISTS "projects_update_own" ON projects;
DROP POLICY IF EXISTS "projects_delete_own" ON projects;

-- Create simple, non-recursive policies for projects
-- These only check direct ownership, no joins to other tables
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

-- Note: Collaborators viewing shared projects is disabled to prevent recursion
-- This can be implemented later using a SECURITY DEFINER function if needed
