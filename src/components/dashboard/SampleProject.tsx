import { FileText, Eye, ArrowRight } from 'lucide-react';

interface SampleProjectProps {
  onOpenSample: () => void;
}

export function SampleProject({ onOpenSample }: SampleProjectProps) {
  return (
    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl p-6 border-2 border-indigo-200 dark:border-indigo-800">
      <div className="flex items-start gap-4">
        {/* Sample plan preview placeholder */}
        <div className="flex-shrink-0 w-24 h-32 bg-white dark:bg-slate-800 rounded-lg shadow-md flex flex-col items-center justify-center border border-gray-200 dark:border-slate-700 relative overflow-hidden">
          <FileText className="w-10 h-10 text-indigo-600 dark:text-indigo-400 mb-2" />
          <div className="absolute bottom-1 text-xs font-mono text-gray-400 dark:text-gray-500 bg-white/90 dark:bg-slate-900/90 px-1 rounded text-center w-full">
            [sample-plan]
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                Try a Sample Project
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Explore BuildSelect Pro with a pre-loaded floor plan and see how it works before creating your own project.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
              3 bed / 2 bath
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
              1,850 sq ft
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
              Modern style
            </span>
          </div>

          <button
            onClick={onOpenSample}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg font-medium"
          >
            <Eye className="w-4 h-4" />
            Open Sample Plan
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

