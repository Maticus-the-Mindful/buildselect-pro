import { FileText, Eye, ArrowRight } from 'lucide-react';

interface SampleProjectProps {
  onOpenSample: () => void;
}

export function SampleProject({ onOpenSample }: SampleProjectProps) {
  return (
    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl p-4 sm:p-6 border-2 border-indigo-200 dark:border-indigo-800">
      <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
        {/* Sample plan preview placeholder */}
        <div className="flex-shrink-0 w-20 h-28 sm:w-24 sm:h-32 bg-white dark:bg-slate-800 rounded-lg shadow-md flex flex-col items-center justify-center border border-gray-200 dark:border-slate-700 relative overflow-hidden mx-auto sm:mx-0">
          <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-600 dark:text-indigo-400 mb-2" />
          <div className="absolute bottom-1 text-xs font-mono text-gray-400 dark:text-gray-500 bg-white/90 dark:bg-slate-900/90 px-1 rounded text-center w-full">
            [sample-plan]
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 w-full">
          <div className="mb-3">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Try a Sample Project
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
              Explore BuildSelect Pro with a pre-loaded floor plan and see how it works before creating your own project.
            </p>
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
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg font-medium text-sm sm:text-base"
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

