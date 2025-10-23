/*
  # Subscription Helper Functions

  Additional helper functions for subscription management
*/

-- Function to increment AI analysis count
CREATE OR REPLACE FUNCTION increment_ai_analysis_count(
  user_id_param UUID
) RETURNS void AS $$
BEGIN
  UPDATE user_subscriptions
  SET
    ai_analyses_this_month = ai_analyses_this_month + 1,
    updated_at = NOW()
  WHERE user_id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment project count
CREATE OR REPLACE FUNCTION increment_project_count(
  user_id_param UUID
) RETURNS void AS $$
BEGIN
  UPDATE user_subscriptions
  SET
    projects_count = projects_count + 1,
    updated_at = NOW()
  WHERE user_id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement project count
CREATE OR REPLACE FUNCTION decrement_project_count(
  user_id_param UUID
) RETURNS void AS $$
BEGIN
  UPDATE user_subscriptions
  SET
    projects_count = GREATEST(0, projects_count - 1),
    updated_at = NOW()
  WHERE user_id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update storage usage
CREATE OR REPLACE FUNCTION update_storage_usage(
  user_id_param UUID,
  storage_gb DECIMAL
) RETURNS void AS $$
BEGIN
  UPDATE user_subscriptions
  SET
    storage_used_gb = storage_gb,
    updated_at = NOW()
  WHERE user_id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to increment project count when project is created
CREATE OR REPLACE FUNCTION on_project_created()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM increment_project_count(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_project_created_increment_count
  AFTER INSERT ON projects
  FOR EACH ROW EXECUTE FUNCTION on_project_created();

-- Trigger to decrement project count when project is deleted
CREATE OR REPLACE FUNCTION on_project_deleted()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM decrement_project_count(OLD.user_id);
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_project_deleted_decrement_count
  AFTER DELETE ON projects
  FOR EACH ROW EXECUTE FUNCTION on_project_deleted();

-- Insert payment enforcement feature flag (disabled by default for beta)
INSERT INTO feature_flags (feature_key, feature_name, description, required_tier, is_enabled, beta_testers_have_access)
VALUES (
  'payment_enforcement',
  'Payment Enforcement',
  'Controls whether payment is required to use the app',
  'free',
  false, -- DISABLED during beta
  true
) ON CONFLICT (feature_key) DO NOTHING;

COMMENT ON FUNCTION increment_ai_analysis_count IS 'Increment the AI analysis counter for a user';
COMMENT ON FUNCTION increment_project_count IS 'Increment the project counter for a user';
COMMENT ON FUNCTION decrement_project_count IS 'Decrement the project counter for a user';
COMMENT ON FUNCTION update_storage_usage IS 'Update the storage usage for a user';
