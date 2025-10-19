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
      <h2 className="text-2xl font-semibold mb-2">Connect a catalog</h2>
      <p className="text-gray-600 mb-8">
        Pick a source, map a few fields, and bring your products into BuildSelect Pro.
      </p>

      <div className="grid grid-cols-2 gap-4 mb-8">
        {CATALOG_SOURCES.map((source) => {
          const Icon = source.icon;
          return (
            <button
              key={source.id}
              onClick={() => setSelected(source.id)}
              className={`p-6 border-2 rounded-lg text-left transition-all ${
                selected === source.id
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Icon className="w-8 h-8 mb-3 text-gray-700" />
              <h3 className="font-semibold mb-1">{source.name}</h3>
              <p className="text-sm text-gray-600">{source.description}</p>
            </button>
          );
        })}
      </div>

      <div className="flex justify-between">
        <button 
          className="px-6 py-2 text-gray-600 hover:text-gray-900"
          onClick={() => window.open('/docs/catalog-sources', '_blank')}
        >
          Learn more
        </button>
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
