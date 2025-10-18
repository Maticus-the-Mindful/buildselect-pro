/*
  # Comprehensive RLS Fix for Signup Process
  
  The issue is that during signup, the user authentication state might not be fully established
  when trying to create the profile. We need to ensure the policies work correctly.
*/

-- First, let's check if we need to disable RLS temporarily or fix the policies
-- Let's try a different approach - create a function that handles profile creation

-- Create a function to handle profile creation during signup
CREATE OR REPLACE FUNCTION create_user_profile(
  user_id UUID,
  user_email TEXT,
  full_name TEXT,
  company_name TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert profile
  INSERT INTO profiles (id, email, full_name, company_name, role)
  VALUES (user_id, user_email, full_name, company_name, 'requester');
  
  -- Insert default subscription
  INSERT INTO subscriptions (user_id, tier, status, project_limit, projects_used)
  VALUES (user_id, 'free', 'trial', 3, 0);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_user_profile TO authenticated;

-- Now let's also ensure the basic policies are correct
-- Drop all existing policies and recreate them
DROP POLICY IF EXISTS "Allow profile creation for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Allow subscription creation for authenticated users" ON subscriptions;

-- Create simple, working policies
CREATE POLICY "profiles_select_policy" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_insert_policy" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_policy" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "subscriptions_select_policy" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "subscriptions_insert_policy" ON subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "subscriptions_update_policy" ON subscriptions
  FOR UPDATE USING (auth.uid() = user_id);
