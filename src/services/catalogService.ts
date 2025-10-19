import { supabase } from '../lib/supabase';
import { CatalogConnection, CatalogMapping, CatalogProduct, IngestJob } from '../types/catalog';

export const catalogService = {
  async createConnection(data: Partial<CatalogConnection>) {
    const { data: connection, error } = await supabase
      .from('catalog_connections')
      .insert(data)
      .select()
      .single();
    
    if (error) throw error;
    return connection;
  },

  async updateConnection(id: string, data: Partial<CatalogConnection>) {
    const { data: connection, error } = await supabase
      .from('catalog_connections')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return connection;
  },

  async createMapping(data: Partial<CatalogMapping>) {
    const { data: mapping, error } = await supabase
      .from('catalog_mappings')
      .insert(data)
      .select()
      .single();
    
    if (error) throw error;
    return mapping;
  },

  async createIngestJob(data: Partial<IngestJob>) {
    const { data: job, error } = await supabase
      .from('ingest_jobs')
      .insert(data)
      .select()
      .single();
    
    if (error) throw error;
    return job;
  },

  async getJobStatus(jobId: string) {
    const { data, error } = await supabase
      .from('ingest_jobs')
      .select('*')
      .eq('id', jobId)
      .single();
    
    if (error) throw error;
    return data;
  },

  async importProducts(connectionId: string, products: any[]) {
    const formattedProducts = products.map(p => ({
      ...p,
      connection_id: connectionId,
    }));

    const { data, error } = await supabase
      .from('catalog_products')
      .upsert(formattedProducts, {
        onConflict: 'connection_id,sku',
      })
      .select();
    
    if (error) throw error;
    return data;
  },

  async getProducts(connectionId: string, limit = 50) {
    const { data, error } = await supabase
      .from('catalog_products')
      .select('*')
      .eq('connection_id', connectionId)
      .limit(limit);
    
    if (error) throw error;
    return data;
  },

  // Subscribe to job updates
  subscribeToJobUpdates(jobId: string, callback: (job: IngestJob) => void) {
    return supabase
      .channel(`ingest-job-${jobId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'ingest_jobs',
          filter: `id=eq.${jobId}`,
        },
        (payload) => {
          callback(payload.new as IngestJob);
        }
      )
      .subscribe();
  },
};
