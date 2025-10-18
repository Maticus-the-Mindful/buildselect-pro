import { Shield, Clock, TrendingUp } from 'lucide-react';

export function TrustMetrics() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-slate-700">
      {/* Privacy Statement */}
      <div className="flex items-start gap-2 sm:gap-3 mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
        <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs sm:text-sm font-medium text-blue-900 dark:text-blue-100">
            Your data stays private
          </p>
          <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5 sm:mt-1">
            We only use your files to generate outputs. Nothing is stored or shared.
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-center sm:text-left">
            <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">3 min</p>
            <p className="text-xs text-gray-600 dark:text-gray-300">Avg setup</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
          </div>
          <div className="text-center sm:text-left">
            <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">4-6 hrs</p>
            <p className="text-xs text-gray-600 dark:text-gray-300">Time saved</p>
          </div>
        </div>
      </div>
    </div>
  );
}

