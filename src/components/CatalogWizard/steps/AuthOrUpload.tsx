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
  const [apiConfig, setApiConfig] = useState({
    api_key: '',
    api_secret: '',
    store_url: '',
  });

  const parseFile = async (file: File): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      if (file.type === 'text/csv') {
        Papa.parse(file, {
          complete: (results) => {
            if (results.meta.fields) {
              resolve(results.meta.fields);
            } else {
              reject(new Error('No columns found in CSV'));
            }
          },
          error: (error) => reject(error),
          header: true,
          preview: 1,
        });
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
          
          if (jsonData.length > 0) {
            resolve(jsonData[0] as string[]);
          } else {
            reject(new Error('No data found in Excel file'));
          }
        };
        reader.readAsArrayBuffer(file);
      }
    });
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const uploadedFile = acceptedFiles[0];
    setFile(uploadedFile);
    setError('');

    try {
      const columns = await parseFile(uploadedFile);
      updateWizardData({ 
        file: uploadedFile,
        detected_columns: columns 
      });
    } catch (err) {
      setError('Failed to parse file. Please check the format.');
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

  const handleContinue = async () => {
    setIsLoading(true);
    setError('');

    try {
      if (['csv', 'xlsx'].includes(wizardData.provider_type)) {
        if (!file) {
          setError('Please upload a file');
          return;
        }

        // Upload to Supabase Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { data, error: uploadError } = await supabase.storage
          .from('catalog-files')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        updateWizardData({ 
          config: { 
            file_url: data.path,
            file_name: file.name,
          }
        });
      } else if (wizardData.provider_type === 'ferguson_demo') {
        // Demo catalog - no auth needed
        updateWizardData({ 
          config: { 
            demo: true 
          }
        });
      } else {
        // API provider - test connection would go here
        updateWizardData({ config: apiConfig });
      }

      handleNext();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const isFileProvider = ['csv', 'xlsx'].includes(wizardData.provider_type);
  const isDemoProvider = wizardData.provider_type === 'ferguson_demo';

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
          disabled={isFileProvider ? !file : false}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
