import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Package, AlertCircle, CheckCircle, RefreshCw, ExternalLink } from 'lucide-react';

interface CatalogStats {
  connection: any;
  totalProducts: number;
  withoutImages: number;
  healthScore: number;
  lastSync: string;
  status: 'healthy' | 'warning' | 'error' | 'disconnected';
}

export default function CatalogHealthWidget() {
  const [stats, setStats] = useState<CatalogStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCatalogStats();
  }, []);

  const fetchCatalogStats = async () => {
    try {
      const { data: connection } = await supabase
        .from('catalog_connections')
        .select('*')
        .eq('status', 'ready')
        .single();

      if (connection) {
        const { count: totalProducts } = await supabase
          .from('catalog_products')
          .select('*', { count: 'exact' })
          .eq('connection_id', connection.id);

        const { count: withoutImages } = await supabase
          .from('catalog_products')
          .select('*', { count: 'exact' })
          .eq('connection_id', connection.id)
          .is('image_url', null);

        const healthScore = totalProducts! > 0 
          ? Math.round(((totalProducts! - withoutImages!) / totalProducts!) * 100)
          : 0;

        const status = healthScore >= 80 ? 'healthy' : 
                      healthScore >= 60 ? 'warning' : 'error';

        setStats({
          connection,
          totalProducts: totalProducts || 0,
          withoutImages: withoutImages || 0,
          healthScore,
          lastSync: connection.last_full_sync_at || connection.created_at,
          status
        });
      } else {
        setStats({
          connection: null,
          totalProducts: 0,
          withoutImages: 0,
          healthScore: 0,
          lastSync: '',
          status: 'disconnected'
        });
      }
    } catch (error) {
      console.error('Failed to fetch catalog stats:', error);
      setStats({
        connection: null,
        totalProducts: 0,
        withoutImages: 0,
        healthScore: 0,
        lastSync: '',
        status: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const runSync = async () => {
    // Trigger edge function for sync
    console.log('Running sync...');
    // TODO: Implement actual sync trigger
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-4 h-4" />;
      case 'warning': 
      case 'error': return <AlertCircle className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/2"></div>
            <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!stats || stats.status === 'disconnected') {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
        <div className="text-center">
          <div className="w-12 h-12 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3">
            <Package className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Catalog Connected
          </h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
            Connect a catalog to start importing products and generating selections.
          </p>
          <button 
            onClick={() => window.location.href = '/catalogs/connect'}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Package className="w-4 h-4" />
            Connect Catalog
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${getStatusColor(stats.status)}`}>
            {getStatusIcon(stats.status)}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Catalog Health</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {stats.connection.provider_type === 'ferguson_demo' ? 'Ferguson Demo' : 'Custom Catalog'}
            </p>
          </div>
        </div>
        <button
          onClick={runSync}
          className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          title="Run sync"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-300">Active SKUs</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.totalProducts.toLocaleString()}
          </p>
        </div>
        
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-300">Health Score</p>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.healthScore}%
            </p>
            <div className={`p-1 rounded ${getStatusColor(stats.status)}`}>
              {getStatusIcon(stats.status)}
            </div>
          </div>
        </div>
      </div>

      {stats.withoutImages > 0 && (
        <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              {stats.withoutImages} products missing images
            </p>
          </div>
        </div>
      )}

      <div className="pt-4 border-t border-gray-100 dark:border-slate-700">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-300">
            Last sync: {new Date(stats.lastSync).toLocaleDateString()}
          </span>
          <button 
            onClick={() => window.location.href = '/catalogs/connect'}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1"
          >
            Manage
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
