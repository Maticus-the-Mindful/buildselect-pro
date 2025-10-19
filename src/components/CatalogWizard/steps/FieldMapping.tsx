import React, { useState, useEffect } from 'react';
import { useWizard } from '../../../contexts/CatalogWizardContext';
import { ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import { catalogService } from '../../../services/catalogService';
import { supabase } from '../../../lib/supabase';

const STANDARD_FIELDS = [
  { key: 'sku', label: 'SKU', required: true },
  { key: 'name', label: 'Product Name', required: true },
  { key: 'internal_category', label: 'Category', required: true },
  { key: 'price', label: 'Price', required: true },
  { key: 'brand', label: 'Brand', required: false },
  { key: 'model', label: 'Model', required: false },
  { key: 'currency', label: 'Currency', required: false },
  { key: 'availability', label: 'Availability', required: false },
  { key: 'status', label: 'Status', required: false },
  { key: 'image_url', label: 'Image URL', required: false },
  { key: 'spec_pdf_url', label: 'Spec PDF URL', required: false },
];

export default function FieldMapping() {
  const { wizardData, updateWizardData, handleBack, isLoading, setIsLoading } = useWizard();
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [autoMapped, setAutoMapped] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    // Auto-map fields based on column names
    if (wizardData.detected_columns) {
      const autoMapping: Record<string, string> = {};
      let mapped = 0;

      STANDARD_FIELDS.forEach(field => {
        const matchedColumn = wizardData.detected_columns?.find(col => {
          const colLower = col.toLowerCase();
          const fieldLower = field.key.toLowerCase();

          // Special handling for internal_category - match both "category" and "internal_category"
          if (field.key === 'internal_category') {
            return colLower.includes('category');
          }

          return colLower.includes(fieldLower) ||
                 (field.label.toLowerCase().split(' ').some(word => colLower.includes(word)));
        });

        if (matchedColumn) {
          autoMapping[field.key] = matchedColumn;
          mapped++;
        }
      });

      setMapping(autoMapping);
      setAutoMapped(mapped);
    }
  }, [wizardData.detected_columns]);

  const handleMappingChange = (standardField: string, sourceColumn: string) => {
    setMapping(prev => ({
      ...prev,
      [standardField]: sourceColumn,
    }));
  };

  const handleContinue = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create catalog connection
      const connection = await catalogService.createConnection({
        user_id: user.id,
        provider_type: wizardData.provider_type as any,
        status: 'pending',
        config_encrypted: wizardData.config,
        price_mode: wizardData.price_mode,
        region: wizardData.region,
      });

      // Create field mapping
      await catalogService.createMapping({
        connection_id: connection.id,
        mapping_json: mapping,
        category_crosswalk_json: wizardData.category_crosswalk || {},
        attribute_defaults_json: wizardData.attribute_defaults || {},
      });

      // Create initial test ingest job
      await catalogService.createIngestJob({
        connection_id: connection.id,
        type: 'test',
        status: 'pending',
      });

      // Redirect to dashboard
      window.location.href = '/';
    } catch (err: any) {
      console.error('Error creating catalog connection:', err);
      setError(err.message || 'Failed to create catalog connection. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isValid = STANDARD_FIELDS
    .filter(f => f.required)
    .every(f => mapping[f.key]);

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-2">Field Mapping</h2>
      <p className="text-gray-600 mb-4">
        Map your catalog fields to our standard fields.
      </p>
      
      {autoMapped > 0 && (
        <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center">
          <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
          <p className="text-sm text-green-800">
            We auto-mapped {autoMapped} of {STANDARD_FIELDS.length} fields. Review and confirm.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {STANDARD_FIELDS.map(field => (
          <div key={field.key} className="flex items-center space-x-4">
            <div className="w-1/3">
              <label className="block text-sm font-medium text-gray-700">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
            </div>
            
            <ArrowRight className="w-4 h-4 text-gray-400" />
            
            <div className="flex-1">
              <select
                value={mapping[field.key] || ''}
                onChange={(e) => handleMappingChange(field.key, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select column...</option>
                {wizardData.detected_columns?.map(col => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>
            
            {mapping[field.key] && (
              <CheckCircle className="w-5 h-5 text-green-500" />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="flex justify-between mt-8">
        <button
          onClick={handleBack}
          disabled={isLoading}
          className="px-6 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50"
        >
          Back
        </button>
        <button
          onClick={handleContinue}
          disabled={!isValid || isLoading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Creating Connection...' : 'Complete Setup'}
        </button>
      </div>
    </div>
  );
}
