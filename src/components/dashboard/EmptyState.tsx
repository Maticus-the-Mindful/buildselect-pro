import { useState, useCallback } from 'react';
import { Upload, FileText, FolderPlus, Database } from 'lucide-react';
import { ChecklistProgress } from './ChecklistProgress';

interface EmptyStateProps {
  onCreateProject: () => void;
  onUseDemoCatalog?: () => void;
}

export function EmptyState({ onCreateProject, onUseDemoCatalog }: EmptyStateProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [useFergusonDemo, setUseFergusonDemo] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const pdfFiles = files.filter(file => file.type === 'application/pdf');
    
    if (pdfFiles.length > 0) {
      // Handle PDF upload
      console.log('PDF files dropped:', pdfFiles);
      // You can add upload logic here
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      console.log('PDF file selected:', files[0]);
      // Handle file upload
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Main Empty State Card */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-600 p-6 sm:p-8 md:p-12">
        <div className="max-w-2xl mx-auto">
          {/* Icon */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <FolderPlus className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600 dark:text-blue-400" />
          </div>

          {/* Heading */}
          <h3 className="text-xl sm:text-2xl font-bold text-center text-gray-900 dark:text-white mb-2 sm:mb-3">
            No Projects Yet
          </h3>
          <p className="text-center text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-6 sm:mb-8 max-w-md mx-auto">
            Create your first project to start generating product selections and quotes
          </p>

          {/* Drag & Drop Zone */}
          <div
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-xl p-8 mb-6 transition-all ${
              isDragging
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50'
            }`}
          >
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="hidden"
              id="pdf-upload"
            />
            
            <label
              htmlFor="pdf-upload"
              className="cursor-pointer flex flex-col items-center"
            >
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                isDragging
                  ? 'bg-blue-100 dark:bg-blue-800'
                  : 'bg-gray-200 dark:bg-slate-600'
              }`}>
                <Upload className={`w-8 h-8 ${
                  isDragging
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-400 dark:text-gray-500'
                }`} />
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                {isDragging ? 'Drop your PDF here' : 'Drag & drop your floor plan PDF'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                or click to browse files
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <FileText className="w-4 h-4" />
                <span>PDF files only • Max 10MB</span>
              </div>
            </label>
          </div>

          {/* Ferguson Demo Toggle */}
          <div className="flex items-center justify-center gap-3 mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
            <Database className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <label className="flex items-center gap-3 cursor-pointer">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Use Ferguson Demo Catalog
              </span>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={useFergusonDemo}
                  onChange={(e) => {
                    setUseFergusonDemo(e.target.checked);
                    if (e.target.checked && onUseDemoCatalog) {
                      onUseDemoCatalog();
                    }
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 dark:bg-slate-600 rounded-full peer peer-checked:bg-blue-600 transition-colors"></div>
                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
              </div>
            </label>
          </div>

          {/* Primary CTA */}
          <button
            onClick={onCreateProject}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2.5 sm:py-3 px-5 sm:px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl font-medium text-base sm:text-lg mb-3 sm:mb-4"
          >
            Create Your First Project
          </button>

          <p className="text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            Or start with a template from the section below
          </p>
        </div>
      </div>

      {/* Progress Checklist */}
      <ChecklistProgress />
    </div>
  );
}

