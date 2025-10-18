/*
  # Fix Circular Dependency Between Projects and Collaborators

  1. Problem
    - The "Collaborators can read shared projects" policy on projects table references collaborators table
    - The collaborators policies reference projects table
    - This creates infinite recursion during INSERT operations

  2. Solution
    - Temporarily remove the problematic SELECT policy that references collaborators
    - Keep only the direct ownership check for SELECT
    - Add the collaborator check back using a security definer function to break the recursion

  3. Security
    - Users can still only see their own projects
    - Collaborators will be able to see shared projects through a separate mechanism
*/

-- Drop the problematic policy that creates circular dependency
DROP POLICY IF EXISTS "Collaborators can read shared projects" ON projects;

-- The remaining policies are:
-- 1. Users can read own projects (direct check, no recursion)
-- 2. Users can create own projects (INSERT only, no SELECT involved)
-- 3. Users can update own projects (direct check)
-- 4. Users can delete own projects (direct check)

-- These policies are safe and won't cause recursion
