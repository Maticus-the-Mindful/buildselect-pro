/*
  # Fix Profile Creation RLS Policy
  
  The issue is that the RLS policy is preventing profile creation during signup.
  We need to allow authenticated users to create their own profile.
*/

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create a new policy that allows profile creation for authenticated users
CREATE POLICY "Allow profile creation for authenticated users" ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Drop and recreate the view policy to ensure it's correct
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles 
  FOR SELECT 
  USING (auth.uid() = id);

-- Drop and recreate the update policy to ensure it's correct
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

-- Also fix subscriptions table policies
-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert own subscription" ON subscriptions;

-- Create new policy for subscription creation
CREATE POLICY "Allow subscription creation for authenticated users" ON subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
