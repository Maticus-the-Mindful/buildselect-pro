/*
  # BuildSelect Pro - Complete Database Schema
  # Construction Project Management System
  
  This is the complete, production-ready database schema for BuildSelect Pro.
  All RLS policies, functions, and triggers are included.
  
  Tables:
  - profiles: User profiles with roles and company info
  - subscriptions: User subscription management with Stripe integration
  - catalogs: Product catalogs from suppliers
  - products: Individual products within catalogs
  - projects: Construction projects
  - project_files: Files attached to projects (floor plans, etc.)
  - questionnaires: Project requirement questionnaires
  - selections: Product selections for projects
  - generated_packages: Generated selection books and quotes
  - collaborators: Project collaboration and sharing
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- PROFILES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  company_name TEXT,
  role TEXT NOT NULL DEFAULT 'requester' CHECK (role IN ('requester', 'reviewer', 'supplier', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- SUBSCRIPTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'basic', 'pro', 'enterprise')),
  status TEXT NOT NULL DEFAULT 'trial' CHECK (status IN ('active', 'cancelled', 'expired', 'trial')),
  current_period_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  current_period_end TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '30 days',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  project_limit INTEGER DEFAULT 1,
  projects_used INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- CATALOGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS catalogs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  supplier_name TEXT NOT NULL,
  supplier_contact JSONB,
  is_public BOOLEAN DEFAULT false,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- PRODUCTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  catalog_id UUID NOT NULL REFERENCES catalogs(id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('plumbing', 'lighting', 'appliances', 'hvac', 'electrical', 'hardware')),
  subcategory TEXT,
  description TEXT,
  price DECIMAL(10,2),
  image_url TEXT,
  additional_images JSONB,
  finish_options JSONB,
  specifications JSONB,
  purchase_url TEXT,
  spec_sheet_url TEXT,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(catalog_id, sku)
);

-- =============================================
-- PROJECTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  client_name TEXT,
  client_email TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'questionnaire', 'generating', 'review', 'approved', 'exported')),
  catalog_id UUID REFERENCES catalogs(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- PROJECT_FILES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS project_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('pdf', 'image')),
  file_url TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  page_type TEXT CHECK (page_type IN ('floor_plan', 'elevation', 'mep', 'rcp', 'other')),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- QUESTIONNAIRES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS questionnaires (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  categories_selected JSONB NOT NULL DEFAULT '[]',
  energy_type TEXT CHECK (energy_type IN ('electric', 'gas', 'hybrid', 'solar')),
  fuel_preferences JSONB,
  style TEXT,
  finish_colors JSONB,
  preferred_brands JSONB,
  room_list JSONB NOT NULL DEFAULT '[]',
  category_budgets JSONB,
  constraints JSONB,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id)
);

-- =============================================
-- SELECTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS selections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  room_name TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  finish TEXT,
  notes TEXT,
  is_locked BOOLEAN DEFAULT false,
  unit_price DECIMAL(10,2),
  extended_price DECIMAL(10,2),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- GENERATED_PACKAGES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS generated_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  selection_book_url TEXT,
  quote_sheet_url TEXT,
  total_amount DECIMAL(12,2),
  version INTEGER DEFAULT 1,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- COLLABORATORS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS collaborators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('reviewer', 'editor', 'viewer')),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(project_id, user_id)
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_tier ON subscriptions(tier);
CREATE INDEX IF NOT EXISTS idx_catalogs_created_by ON catalogs(created_by);
CREATE INDEX IF NOT EXISTS idx_catalogs_is_public ON catalogs(is_public);
CREATE INDEX IF NOT EXISTS idx_catalogs_supplier_name ON catalogs(supplier_name);
CREATE INDEX IF NOT EXISTS idx_products_catalog_id ON products(catalog_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_is_available ON products(is_available);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_catalog_id ON projects(catalog_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at);
CREATE INDEX IF NOT EXISTS idx_project_files_project_id ON project_files(project_id);
CREATE INDEX IF NOT EXISTS idx_project_files_file_type ON project_files(file_type);
CREATE INDEX IF NOT EXISTS idx_project_files_page_type ON project_files(page_type);
CREATE INDEX IF NOT EXISTS idx_questionnaires_project_id ON questionnaires(project_id);
CREATE INDEX IF NOT EXISTS idx_questionnaires_completed_at ON questionnaires(completed_at);
CREATE INDEX IF NOT EXISTS idx_selections_project_id ON selections(project_id);
CREATE INDEX IF NOT EXISTS idx_selections_product_id ON selections(product_id);
CREATE INDEX IF NOT EXISTS idx_selections_room_name ON selections(room_name);
CREATE INDEX IF NOT EXISTS idx_selections_is_locked ON selections(is_locked);
CREATE INDEX IF NOT EXISTS idx_generated_packages_project_id ON generated_packages(project_id);
CREATE INDEX IF NOT EXISTS idx_generated_packages_version ON generated_packages(version);
CREATE INDEX IF NOT EXISTS idx_collaborators_project_id ON collaborators(project_id);
CREATE INDEX IF NOT EXISTS idx_collaborators_user_id ON collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_collaborators_role ON collaborators(role);

-- =============================================
-- TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DO $$ 
BEGIN
  DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
  CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
  DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
  CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
  DROP TRIGGER IF EXISTS update_catalogs_updated_at ON catalogs;
  CREATE TRIGGER update_catalogs_updated_at BEFORE UPDATE ON catalogs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
  DROP TRIGGER IF EXISTS update_products_updated_at ON products;
  CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
  DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
  CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
  DROP TRIGGER IF EXISTS update_selections_updated_at ON selections;
  CREATE TRIGGER update_selections_updated_at BEFORE UPDATE ON selections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
END $$;

-- =============================================
-- HELPER FUNCTION FOR PROFILE CREATION
-- =============================================
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
  INSERT INTO profiles (id, email, full_name, company_name, role)
  VALUES (user_id, user_email, full_name, company_name, 'requester')
  ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO subscriptions (user_id, tier, status, project_limit, projects_used)
  VALUES (user_id, 'free', 'trial', 3, 0)
  ON CONFLICT DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION create_user_profile TO authenticated;

-- =============================================
-- SUBSCRIPTION HELPER FUNCTIONS
-- =============================================
CREATE OR REPLACE FUNCTION get_user_subscription_limits(user_uuid UUID)
RETURNS TABLE(project_limit INTEGER, projects_used INTEGER, tier TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT s.project_limit, s.projects_used, s.tier
  FROM subscriptions s
  WHERE s.user_id = user_uuid
  AND s.status = 'active'
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION can_create_project(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  limits RECORD;
BEGIN
  SELECT * INTO limits FROM get_user_subscription_limits(user_uuid);
  
  IF limits IS NULL THEN
    RETURN (SELECT COUNT(*) FROM projects WHERE user_id = user_uuid) < 1;
  END IF;
  
  RETURN limits.projects_used < limits.project_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_projects_used()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE subscriptions 
    SET projects_used = projects_used + 1 
    WHERE user_id = NEW.user_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE subscriptions 
    SET projects_used = GREATEST(projects_used - 1, 0) 
    WHERE user_id = OLD.user_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  DROP TRIGGER IF EXISTS update_projects_used_trigger ON projects;
  CREATE TRIGGER update_projects_used_trigger
    AFTER INSERT OR DELETE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_projects_used();
END $$;

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE questionnaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaborators ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES
-- =============================================

-- Profiles policies
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;

CREATE POLICY "profiles_select_policy" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_policy" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_policy" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Subscriptions policies
DROP POLICY IF EXISTS "subscriptions_select_policy" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_insert_policy" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_update_policy" ON subscriptions;

CREATE POLICY "subscriptions_select_policy" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "subscriptions_insert_policy" ON subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "subscriptions_update_policy" ON subscriptions FOR UPDATE USING (auth.uid() = user_id);

-- Catalogs policies
DROP POLICY IF EXISTS "Public catalogs are viewable by all" ON catalogs;
DROP POLICY IF EXISTS "Users can view own catalogs" ON catalogs;
DROP POLICY IF EXISTS "Users can create catalogs" ON catalogs;
DROP POLICY IF EXISTS "Users can update own catalogs" ON catalogs;
DROP POLICY IF EXISTS "Users can delete own catalogs" ON catalogs;

CREATE POLICY "Public catalogs are viewable by all" ON catalogs FOR SELECT USING (is_public = true);
CREATE POLICY "Users can view own catalogs" ON catalogs FOR SELECT USING (auth.uid() = created_by);
CREATE POLICY "Users can create catalogs" ON catalogs FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update own catalogs" ON catalogs FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete own catalogs" ON catalogs FOR DELETE USING (auth.uid() = created_by);

-- Products policies
DROP POLICY IF EXISTS "Products are viewable if catalog is public or owned" ON products;
DROP POLICY IF EXISTS "Users can manage products in own catalogs" ON products;

CREATE POLICY "Products are viewable if catalog is public or owned" ON products FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM catalogs 
    WHERE catalogs.id = products.catalog_id 
    AND (catalogs.is_public = true OR catalogs.created_by = auth.uid())
  )
);
CREATE POLICY "Users can manage products in own catalogs" ON products FOR ALL USING (
  EXISTS (
    SELECT 1 FROM catalogs 
    WHERE catalogs.id = products.catalog_id 
    AND catalogs.created_by = auth.uid()
  )
);

-- Projects policies (non-recursive, direct ownership only)
DROP POLICY IF EXISTS "projects_select_own" ON projects;
DROP POLICY IF EXISTS "projects_insert_own" ON projects;
DROP POLICY IF EXISTS "projects_update_own" ON projects;
DROP POLICY IF EXISTS "projects_delete_own" ON projects;

CREATE POLICY "projects_select_own" ON projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "projects_insert_own" ON projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "projects_update_own" ON projects FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "projects_delete_own" ON projects FOR DELETE USING (auth.uid() = user_id);

-- Project files policies
DROP POLICY IF EXISTS "Users can manage files in own projects" ON project_files;

CREATE POLICY "Users can manage files in own projects" ON project_files FOR ALL USING (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_files.project_id 
    AND projects.user_id = auth.uid()
  )
);

-- Questionnaires policies
DROP POLICY IF EXISTS "Users can manage questionnaires in own projects" ON questionnaires;

CREATE POLICY "Users can manage questionnaires in own projects" ON questionnaires FOR ALL USING (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = questionnaires.project_id 
    AND projects.user_id = auth.uid()
  )
);

-- Selections policies
DROP POLICY IF EXISTS "Users can manage selections in own projects" ON selections;

CREATE POLICY "Users can manage selections in own projects" ON selections FOR ALL USING (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = selections.project_id 
    AND projects.user_id = auth.uid()
  )
);

-- Generated packages policies
DROP POLICY IF EXISTS "Users can manage packages in own projects" ON generated_packages;

CREATE POLICY "Users can manage packages in own projects" ON generated_packages FOR ALL USING (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = generated_packages.project_id 
    AND projects.user_id = auth.uid()
  )
);

-- Collaborators policies
DROP POLICY IF EXISTS "Project owners can manage collaborators" ON collaborators;

CREATE POLICY "Project owners can manage collaborators" ON collaborators FOR ALL USING (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = collaborators.project_id 
    AND projects.user_id = auth.uid()
  )
);
