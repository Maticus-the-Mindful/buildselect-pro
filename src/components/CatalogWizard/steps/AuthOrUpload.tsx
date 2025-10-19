import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, AlertCircle } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useWizard } from '../../../contexts/CatalogWizardContext';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export default function AuthOrUpload() {
  const { wizardData, updateWizardData, handleNext, handleBack, setIsLoading } = useWizard();
  const [error, setError] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [apiConfig, setApiConfig] = useState({
    api_key: '',
    api_secret: '',
    store_url: '',
  });

  const parseFile = async (file: File): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        Papa.parse(file, {
          complete: (results) => {
            if (results.errors && results.errors.length > 0) {
              reject(new Error(`CSV parsing error: ${results.errors[0].message}`));
              return;
            }
            if (results.meta.fields && results.meta.fields.length > 0) {
              resolve(results.meta.fields);
            } else {
              reject(new Error('No column headers found in CSV file. Please ensure the first row contains column names.'));
            }
          },
          error: (error) => reject(new Error(`Failed to read CSV file: ${error.message}`)),
          header: true,
          preview: 1,
        });
      } else {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('Failed to read Excel file. The file may be corrupted.'));
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });

            if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
              reject(new Error('No sheets found in Excel file.'));
              return;
            }

            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

            if (jsonData.length > 0 && Array.isArray(jsonData[0]) && jsonData[0].length > 0) {
              resolve(jsonData[0] as string[]);
            } else {
              reject(new Error('No column headers found in Excel file. Please ensure the first row contains column names.'));
            }
          } catch (err: any) {
            reject(new Error(`Failed to parse Excel file: ${err.message}`));
          }
        };
        reader.readAsArrayBuffer(file);
      }
    });
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const uploadedFile = acceptedFiles[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setError('');

    try {
      const columns = await parseFile(uploadedFile);

      if (!columns || columns.length === 0) {
        throw new Error('No columns found in file. Please ensure your file has headers.');
      }

      updateWizardData({
        file: uploadedFile,
        detected_columns: columns
      });
    } catch (err: any) {
      console.error('File parsing error:', err);
      setFile(null);
      setError(err.message || 'Failed to parse file. Please check the format and try again.');
    }
  }, [updateWizardData]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxSize: 250 * 1024 * 1024, // 250MB
    multiple: false,
  });

  const testApiConnection = async (provider: string, config: any): Promise<boolean> => {
    // TODO: Implement actual API connection tests for each provider
    // For now, just validate that credentials are present
    // In production, you would make actual API calls to verify credentials

    switch (provider) {
      case 'shopify':
        // Would test Shopify API with: GET /admin/api/2024-01/shop.json
        if (!config.api_key || !config.store_url) return false;
        break;
      case 'bigcommerce':
        // Would test BigCommerce API with: GET /stores/{store_hash}/v3/catalog/summary
        if (!config.api_key || !config.store_url) return false;
        break;
      case 'woocommerce':
        // Would test WooCommerce API with: GET /wp-json/wc/v3/products
        if (!config.api_key || !config.api_secret || !config.store_url) return false;
        break;
      case 'salsify':
        // Would test Salsify API with: GET /v1/organizations
        if (!config.api_key) return false;
        break;
      case 'api':
        // Custom API - just validate credentials are present
        if (!config.api_key || !config.store_url) return false;
        break;
    }

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return true;
  };

  const handleContinue = async () => {
    setIsLoading(true);
    setError('');

    try {
      if (['csv', 'xlsx'].includes(wizardData.provider_type)) {
        if (!file) {
          setError('Please upload a file');
          setIsLoading(false);
          return;
        }

        // Get current user for file path
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // Show upload progress
        setUploadProgress(10);

        // Upload to Supabase Storage with user ID in path
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        setUploadProgress(30);

        const { data, error: uploadError } = await supabase.storage
          .from('catalog-files')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        setUploadProgress(100);

        updateWizardData({
          config: {
            file_url: data.path,
            file_name: file.name,
          }
        });
      } else if (wizardData.provider_type === 'ferguson_demo') {
        // Demo catalog - no auth needed, use standard field names
        const standardFields = ['sku', 'name', 'internal_category', 'price', 'brand', 'model', 'currency', 'availability', 'status', 'image_url', 'spec_pdf_url'];
        updateWizardData({
          config: {
            demo: true
          },
          detected_columns: standardFields
        });
      } else {
        // API provider - test connection and use standard field names
        const isValid = await testApiConnection(wizardData.provider_type, apiConfig);

        if (!isValid) {
          throw new Error('Invalid API credentials. Please check and try again.');
        }

        const standardFields = ['sku', 'name', 'internal_category', 'price', 'brand', 'model', 'currency', 'availability', 'status', 'image_url', 'spec_pdf_url'];
        updateWizardData({
          config: apiConfig,
          detected_columns: standardFields
        });
      }

      handleNext();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setUploadProgress(0);
    } finally {
      setIsLoading(false);
    }
  };

  const isFileProvider = ['csv', 'xlsx'].includes(wizardData.provider_type);
  const isDemoProvider = wizardData.provider_type === 'ferguson_demo';
  const isApiProvider = ['shopify', 'bigcommerce', 'woocommerce', 'salsify', 'api'].includes(wizardData.provider_type);

  // Validate API credentials
  const isApiValid = !isApiProvider || (apiConfig.api_key && apiConfig.store_url);
  const canContinue = isFileProvider ? !!file : isApiProvider ? isApiValid : true;

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-2">
        {isDemoProvider ? 'Ferguson Demo Catalog' : isFileProvider ? 'Upload Your Catalog' : 'Connect Your Store'}
      </h2>
      <p className="text-gray-600 mb-8">
        {isDemoProvider 
          ? 'The demo catalog will be automatically configured with sample data.'
          : isFileProvider 
          ? 'Use our template. Most users finish this in under five minutes.'
          : 'Enter your API credentials to connect your catalog.'}
      </p>

      {isDemoProvider ? (
        <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-900">
          The Ferguson demo catalog includes:
          </p>
          <ul className="mt-3 space-y-1 text-sm text-blue-800">
            <li>• 5,000+ plumbing and electrical SKUs</li>
            <li>• Pre-configured field mappings</li>
            <li>• Sample images and spec sheets</li>
            <li>• Realistic pricing and availability</li>
          </ul>
        </div>
      ) : isFileProvider ? (
        <>
          <div 
            {...getRootProps()} 
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            {file ? (
              <div>
                <p className="font-medium text-gray-900">{file.name}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                {wizardData.detected_columns && (
                  <p className="text-sm text-green-600 mt-2">
                    ✓ Detected {wizardData.detected_columns.length} columns
                  </p>
                )}
              </div>
            ) : (
              <div>
                <p className="font-medium text-gray-700">
                  Drop your catalog file here, or click to browse
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Supports CSV, XLS, XLSX up to 250MB
                </p>
              </div>
            )}
          </div>
          
          <div className="mt-4">
            <button className="text-sm text-blue-600 hover:text-blue-700">
              Download template file →
            </button>
          </div>

          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Uploading...</span>
                <span className="text-sm font-medium">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Key
            </label>
            <input
              type="text"
              value={apiConfig.api_key}
              onChange={(e) => setApiConfig({ ...apiConfig, api_key: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your API key"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Secret
            </label>
            <input
              type="password"
              value={apiConfig.api_secret}
              onChange={(e) => setApiConfig({ ...apiConfig, api_secret: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your API secret"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Store URL
            </label>
            <input
              type="url"
              value={apiConfig.store_url}
              onChange={(e) => setApiConfig({ ...apiConfig, store_url: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://your-store.com"
            />
          </div>
          
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600">
              🔒 Encrypted at rest. You can revoke access any time.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="flex justify-between mt-8">
        <button
          onClick={handleBack}
          className="px-6 py-2 text-gray-600 hover:text-gray-900"
        >
          Back
        </button>
        <button
          onClick={handleContinue}
          disabled={!canContinue || isLoading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Verifying...' : 'Continue'}
        </button>
      </div>
    </div>
  );
}
