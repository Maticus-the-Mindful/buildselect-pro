/*
  # Catalog Connections Schema
  
  This migration creates the complete catalog connection system including:
  - Catalog connections table
  - Catalog mappings for field mapping
  - Catalog products for imported data
  - Ingest jobs for background processing
  - Media cache for optimized file handling
*/

-- Catalog connections table
CREATE TABLE catalog_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_type TEXT NOT NULL CHECK (provider_type IN ('ferguson_demo', 'csv', 'xlsx', 'shopify', 'bigcommerce', 'woocommerce', 'salsify', 'akeneo', 'sftp', 'api')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'testing', 'ready', 'error', 'disabled')),
  config_encrypted JSONB,
  price_mode TEXT CHECK (price_mode IN ('list_price', 'account_price', 'quote_required')),
  region TEXT,
  last_verified_at TIMESTAMP WITH TIME ZONE,
  last_full_sync_at TIMESTAMP WITH TIME ZONE,
  next_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Catalog mappings
CREATE TABLE catalog_mappings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  connection_id UUID REFERENCES catalog_connections(id) ON DELETE CASCADE,
  mapping_json JSONB NOT NULL DEFAULT '{}',
  category_crosswalk_json JSONB DEFAULT '{}',
  attribute_defaults_json JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Catalog products
CREATE TABLE catalog_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  connection_id UUID REFERENCES catalog_connections(id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  name TEXT NOT NULL,
  internal_category TEXT,
  attributes_json JSONB DEFAULT '{}',
  image_url TEXT,
  spec_pdf_url TEXT,
  price DECIMAL(10, 2),
  currency TEXT DEFAULT 'USD',
  availability TEXT,
  status TEXT CHECK (status IN ('active', 'discontinued', 'pending', 'hidden')),
  region TEXT,
  replaced_by TEXT,
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  snapshot_version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(connection_id, sku)
);

-- Ingest jobs
CREATE TABLE ingest_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  connection_id UUID REFERENCES catalog_connections(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('test', 'full', 'incremental')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  started_at TIMESTAMP WITH TIME ZONE,
  finished_at TIMESTAMP WITH TIME ZONE,
  counts_json JSONB DEFAULT '{"imported": 0, "skipped": 0, "errors": 0}',
  error_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Media cache
CREATE TABLE media_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES catalog_products(id) ON DELETE CASCADE,
  file_type TEXT CHECK (file_type IN ('image', 'pdf', 'spec')),
  source_url TEXT NOT NULL,
  cached_url TEXT,
  etag TEXT,
  last_checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_catalog_connections_user_id ON catalog_connections(user_id);
CREATE INDEX idx_catalog_products_connection_id ON catalog_products(connection_id);
CREATE INDEX idx_catalog_products_sku ON catalog_products(sku);
CREATE INDEX idx_ingest_jobs_connection_id ON ingest_jobs(connection_id);

-- Enable RLS
ALTER TABLE catalog_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingest_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage own catalog connections" ON catalog_connections
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own mappings" ON catalog_mappings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM catalog_connections 
      WHERE catalog_connections.id = catalog_mappings.connection_id 
      AND catalog_connections.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view own products" ON catalog_products
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM catalog_connections 
      WHERE catalog_connections.id = catalog_products.connection_id 
      AND catalog_connections.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view own jobs" ON ingest_jobs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM catalog_connections 
      WHERE catalog_connections.id = ingest_jobs.connection_id 
      AND catalog_connections.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own media cache" ON media_cache
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM catalog_products 
      JOIN catalog_connections ON catalog_connections.id = catalog_products.connection_id
      WHERE catalog_products.id = media_cache.product_id 
      AND catalog_connections.user_id = auth.uid()
    )
  );
