import React, { useState } from 'react';
import { useWizard } from '../../../contexts/CatalogWizardContext';
import { Package, FileText, Table, ShoppingBag, Store, Database, Cloud, Key } from 'lucide-react';

const CATALOG_SOURCES = [
  {
    id: 'ferguson_demo',
    name: 'Ferguson Demo Set',
    description: 'Pre-configured catalog with 5,000+ items for testing',
    icon: Package,
  },
  {
    id: 'csv',
    name: 'CSV Upload',
    description: 'Works for 100 to 50,000 SKUs',
    icon: FileText,
  },
  {
    id: 'xlsx',
    name: 'Excel Upload',
    description: 'Import from .xlsx or .xls files',
    icon: Table,
  },
  {
    id: 'shopify',
    name: 'Shopify',
    description: 'Connect your Shopify store catalog',
    icon: ShoppingBag,
  },
  {
    id: 'bigcommerce',
    name: 'BigCommerce',
    description: 'Sync with BigCommerce products',
    icon: Store,
  },
  {
    id: 'woocommerce',
    name: 'WooCommerce',
    description: 'Import from WordPress WooCommerce',
    icon: Database,
  },
  {
    id: 'salsify',
    name: 'Salsify',
    description: 'Connect to Salsify PIM',
    icon: Cloud,
  },
  {
    id: 'api',
    name: 'Custom API',
    description: 'Connect via REST API',
    icon: Key,
  },
];

export default function SourceSelection() {
  const { wizardData, updateWizardData, handleNext } = useWizard();
  const [selected, setSelected] = useState(wizardData.provider_type || '');

  const handleContinue = () => {
    if (selected) {
      updateWizardData({ provider_type: selected });
      
      // Skip auth step for demo
      if (selected === 'ferguson_demo') {
        handleNext(); // Skip to field mapping
      }
      handleNext();
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">Connect a catalog</h2>
        <p className="text-gray-600">
          Pick a source, map a few fields, and bring your products into BuildSelect Pro.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        {CATALOG_SOURCES.map((source) => {
          const Icon = source.icon;
          return (
            <button
              key={source.id}
              onClick={() => setSelected(source.id)}
              className={`p-4 border-2 rounded-lg text-left transition-all ${
                selected === source.id
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className="w-6 h-6 text-gray-700 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm mb-1 truncate">{source.name}</h3>
                  <p className="text-xs text-gray-600 line-clamp-2">{source.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex justify-between">
        <div className="flex gap-3">
          <button 
            className="px-6 py-2 text-gray-600 hover:text-gray-900"
            onClick={() => window.open('/docs/catalog-sources', '_blank')}
          >
            Learn more
          </button>
          <button 
            className="px-6 py-2 text-gray-600 hover:text-gray-900"
            onClick={() => window.location.href = '/'}
          >
            Cancel
          </button>
        </div>
        <button
          onClick={handleContinue}
          disabled={!selected}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
