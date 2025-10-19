export interface CatalogConnection {
  id: string;
  user_id: string;
  provider_type: 'ferguson_demo' | 'csv' | 'xlsx' | 'shopify' | 'bigcommerce' | 'woocommerce' | 'salsify' | 'akeneo' | 'sftp' | 'api';
  status: 'pending' | 'testing' | 'ready' | 'error' | 'disabled';
  config_encrypted?: any;
  price_mode?: 'list_price' | 'account_price' | 'quote_required';
  region?: string;
  last_verified_at?: string;
  last_full_sync_at?: string;
  next_sync_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CatalogMapping {
  id: string;
  connection_id: string;
  mapping_json: Record<string, string>;
  category_crosswalk_json: Record<string, string>;
  attribute_defaults_json: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CatalogProduct {
  id: string;
  connection_id: string;
  sku: string;
  brand?: string;
  model?: string;
  name: string;
  internal_category?: string;
  attributes_json: Record<string, any>;
  image_url?: string;
  spec_pdf_url?: string;
  price?: number;
  currency: string;
  availability?: string;
  status: 'active' | 'discontinued' | 'pending' | 'hidden';
  region?: string;
  replaced_by?: string;
  last_seen_at: string;
  snapshot_version: number;
  created_at: string;
  updated_at: string;
}

export interface IngestJob {
  id: string;
  connection_id: string;
  type: 'test' | 'full' | 'incremental';
  status: 'pending' | 'running' | 'completed' | 'failed';
  started_at?: string;
  finished_at?: string;
  counts_json: {
    imported: number;
    skipped: number;
    errors: number;
  };
  error_text?: string;
  created_at: string;
}

export interface MediaCache {
  id: string;
  product_id: string;
  file_type: 'image' | 'pdf' | 'spec';
  source_url: string;
  cached_url?: string;
  etag?: string;
  last_checked_at: string;
  created_at: string;
}
