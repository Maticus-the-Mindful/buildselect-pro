/*
  # Subscription Infrastructure

  Implements payment-ready infrastructure without enforcing payments during beta:

  1. User subscription tiers (beta_tester, free, paid)
  2. Grace period tracking for beta testers
  3. Subscription plans and pricing
  4. Payment history tracking
  5. Feature access control

  This allows:
  - Beta testers to use app freely now
  - Smooth transition to paid later
  - Preserve all beta tester data
  - Track who gets grandfathered pricing
*/

-- Create enum for subscription tiers
CREATE TYPE subscription_tier AS ENUM (
  'beta_tester',    -- Beta testers - free forever or special pricing
  'free',           -- Free tier (limited features)
  'basic',          -- Basic paid tier
  'professional',   -- Professional paid tier
  'enterprise'      -- Enterprise paid tier
);

-- Create enum for subscription status
CREATE TYPE subscription_status AS ENUM (
  'active',         -- Currently active subscription
  'trialing',       -- In trial period
  'grace_period',   -- Past due but still has access (grace period)
  'past_due',       -- Payment failed, limited access
  'canceled',       -- Canceled but still has access until period end
  'expired',        -- Subscription expired, no access
  'lifetime'        -- Lifetime access (beta testers can get this)
);

-- Subscription plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  tier subscription_tier NOT NULL,
  description TEXT,

  -- Pricing
  price_monthly DECIMAL(10, 2),
  price_yearly DECIMAL(10, 2),

  -- Feature limits
  max_projects INTEGER,
  max_files_per_project INTEGER,
  max_storage_gb INTEGER,
  max_ai_analyses_per_month INTEGER,

  -- Features
  features JSONB DEFAULT '[]'::jsonb,

  -- Stripe integration
  stripe_price_id_monthly TEXT,
  stripe_price_id_yearly TEXT,
  stripe_product_id TEXT,

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Subscription details
  tier subscription_tier NOT NULL DEFAULT 'free',
  status subscription_status NOT NULL DEFAULT 'active',
  plan_id UUID REFERENCES subscription_plans(id),

  -- Beta tester tracking
  is_beta_tester BOOLEAN DEFAULT false,
  beta_tester_joined_at TIMESTAMP WITH TIME ZONE,
  beta_tester_notes TEXT,

  -- Billing cycle
  billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'yearly', 'lifetime')),
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,

  -- Grace period (for beta tester transition)
  grace_period_ends_at TIMESTAMP WITH TIME ZONE,

  -- Stripe integration
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,

  -- Usage tracking
  projects_count INTEGER DEFAULT 0,
  storage_used_gb DECIMAL(10, 2) DEFAULT 0,
  ai_analyses_this_month INTEGER DEFAULT 0,
  ai_analyses_reset_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  canceled_at TIMESTAMP WITH TIME ZONE,

  UNIQUE(user_id)
);

-- Payment history table
CREATE TABLE IF NOT EXISTS payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE SET NULL,

  -- Payment details
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT NOT NULL, -- 'succeeded', 'pending', 'failed', 'refunded'

  -- Stripe details
  stripe_payment_intent_id TEXT,
  stripe_invoice_id TEXT,
  stripe_charge_id TEXT,

  -- Metadata
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feature flags table (for gradual rollout of paid features)
CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key TEXT UNIQUE NOT NULL,
  feature_name TEXT NOT NULL,
  description TEXT,

  -- Access control
  required_tier subscription_tier,
  is_beta_feature BOOLEAN DEFAULT false,
  beta_testers_have_access BOOLEAN DEFAULT true,

  -- Rollout control
  is_enabled BOOLEAN DEFAULT true,
  enabled_for_users UUID[] DEFAULT ARRAY[]::UUID[],

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default subscription plans
INSERT INTO subscription_plans (name, tier, description, price_monthly, price_yearly, max_projects, max_files_per_project, max_storage_gb, max_ai_analyses_per_month, features) VALUES
(
  'Beta Tester',
  'beta_tester',
  'Special access for beta testers - unlimited features during beta period',
  0.00,
  0.00,
  NULL, -- unlimited
  NULL, -- unlimited
  NULL, -- unlimited
  NULL, -- unlimited
  '["unlimited_projects", "unlimited_storage", "unlimited_ai_analyses", "priority_support", "early_access"]'::jsonb
),
(
  'Free',
  'free',
  'Perfect for trying out BuildSelect Pro',
  0.00,
  0.00,
  1,
  10,
  1,
  5,
  '["basic_catalog_search", "basic_file_upload", "community_support"]'::jsonb
),
(
  'Basic',
  'basic',
  'Great for small contractors and individual builders',
  29.00,
  290.00, -- ~17% discount
  5,
  50,
  10,
  25,
  '["unlimited_catalog_search", "advanced_file_upload", "ai_blueprint_analysis", "email_support", "export_reports"]'::jsonb
),
(
  'Professional',
  'professional',
  'Perfect for growing businesses and design firms',
  79.00,
  790.00, -- ~17% discount
  25,
  200,
  50,
  100,
  '["all_basic_features", "team_collaboration", "custom_catalogs", "priority_ai_analysis", "advanced_reporting", "api_access", "priority_support"]'::jsonb
),
(
  'Enterprise',
  'enterprise',
  'For large organizations with custom needs',
  NULL, -- Custom pricing
  NULL,
  NULL, -- unlimited
  NULL, -- unlimited
  NULL, -- unlimited
  NULL, -- unlimited
  '["all_professional_features", "white_label", "dedicated_support", "custom_integrations", "sla", "training", "custom_contract"]'::jsonb
);

-- Insert default feature flags
INSERT INTO feature_flags (feature_key, feature_name, description, required_tier, beta_testers_have_access) VALUES
('ai_blueprint_analysis', 'AI Blueprint Analysis', 'Analyze blueprints with AI to extract room data', 'basic', true),
('multi_page_blueprint_analysis', 'Multi-Page Blueprint Analysis', 'Analyze blueprints with multiple pages', 'basic', true),
('catalog_connections', 'Catalog Connections', 'Connect to external product catalogs', 'basic', true),
('team_collaboration', 'Team Collaboration', 'Invite team members to projects', 'professional', true),
('custom_catalogs', 'Custom Catalogs', 'Upload and manage custom product catalogs', 'professional', true),
('api_access', 'API Access', 'Access BuildSelect Pro via API', 'professional', true),
('white_label', 'White Label', 'Custom branding and white label options', 'enterprise', true),
('priority_support', 'Priority Support', 'Get priority customer support', 'professional', true);

-- Create indexes
CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_tier ON user_subscriptions(tier);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX idx_user_subscriptions_stripe_customer ON user_subscriptions(stripe_customer_id);
CREATE INDEX idx_payment_history_user_id ON payment_history(user_id);
CREATE INDEX idx_payment_history_created_at ON payment_history(created_at DESC);
CREATE INDEX idx_feature_flags_key ON feature_flags(feature_key);

-- Enable RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Subscription plans: Public read access
CREATE POLICY "Anyone can view active subscription plans"
ON subscription_plans FOR SELECT
TO public
USING (is_active = true);

-- User subscriptions: Users can view their own subscription
CREATE POLICY "Users can view own subscription"
ON user_subscriptions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Payment history: Users can view their own payment history
CREATE POLICY "Users can view own payment history"
ON payment_history FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Feature flags: Anyone can view enabled features
CREATE POLICY "Anyone can view enabled feature flags"
ON feature_flags FOR SELECT
TO public
USING (is_enabled = true);

-- Function to check if user has access to a feature
CREATE OR REPLACE FUNCTION has_feature_access(
  user_id_param UUID,
  feature_key_param TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  user_tier subscription_tier;
  user_is_beta BOOLEAN;
  feature_required_tier subscription_tier;
  feature_beta_access BOOLEAN;
  tier_hierarchy TEXT[] := ARRAY['free', 'basic', 'professional', 'enterprise'];
  user_tier_index INTEGER;
  required_tier_index INTEGER;
BEGIN
  -- Get user subscription details
  SELECT tier, is_beta_tester INTO user_tier, user_is_beta
  FROM user_subscriptions
  WHERE user_id = user_id_param;

  -- If no subscription found, default to free tier
  IF user_tier IS NULL THEN
    user_tier := 'free';
    user_is_beta := false;
  END IF;

  -- Beta testers get special treatment
  IF user_tier = 'beta_tester' THEN
    RETURN true;
  END IF;

  -- Get feature requirements
  SELECT required_tier, beta_testers_have_access INTO feature_required_tier, feature_beta_access
  FROM feature_flags
  WHERE feature_key = feature_key_param AND is_enabled = true;

  -- If feature not found or not enabled, deny access
  IF feature_required_tier IS NULL THEN
    RETURN false;
  END IF;

  -- Check if beta tester has access
  IF user_is_beta AND feature_beta_access THEN
    RETURN true;
  END IF;

  -- Check tier hierarchy
  user_tier_index := array_position(tier_hierarchy, user_tier::TEXT);
  required_tier_index := array_position(tier_hierarchy, feature_required_tier::TEXT);

  RETURN user_tier_index >= required_tier_index;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create default subscription for new users
CREATE OR REPLACE FUNCTION create_default_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_subscriptions (user_id, tier, status)
  VALUES (NEW.id, 'free', 'active');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create subscription on user signup
CREATE TRIGGER on_auth_user_created_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_default_subscription();

-- Function to reset monthly AI analysis counter
CREATE OR REPLACE FUNCTION reset_monthly_ai_analyses()
RETURNS void AS $$
BEGIN
  UPDATE user_subscriptions
  SET
    ai_analyses_this_month = 0,
    ai_analyses_reset_at = NOW()
  WHERE ai_analyses_reset_at < NOW() - INTERVAL '1 month';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON TABLE subscription_plans IS 'Available subscription plans and pricing';
COMMENT ON TABLE user_subscriptions IS 'User subscription status and usage tracking';
COMMENT ON TABLE payment_history IS 'Payment transaction history';
COMMENT ON TABLE feature_flags IS 'Feature access control and rollout management';
COMMENT ON FUNCTION has_feature_access IS 'Check if user has access to a specific feature based on their subscription tier';
COMMENT ON FUNCTION create_default_subscription IS 'Automatically create free subscription for new users';
COMMENT ON FUNCTION reset_monthly_ai_analyses IS 'Reset monthly AI analysis counter for all users';
