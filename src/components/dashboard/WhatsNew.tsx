import { Sparkles, ExternalLink } from 'lucide-react';

interface Release {
  version: string;
  date: string;
  highlights: string[];
}

export function WhatsNew() {
  const latestRelease: Release = {
    version: 'v1.0.0',
    date: 'January 2025',
    highlights: [
      'Dark mode support across entire app',
      'Password visibility toggle for better security',
      'Improved mobile responsive design',
      'Enhanced project workflow'
    ]
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-slate-700">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
            What's New
          </h3>
        </div>
        <span className="text-xs font-semibold px-2 sm:px-2.5 py-0.5 sm:py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full">
          {latestRelease.version}
        </span>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
        {latestRelease.date}
      </p>

      <ul className="space-y-2 mb-4">
        {latestRelease.highlights.map((highlight, index) => (
          <li key={index} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
            <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
            {highlight}
          </li>
        ))}
      </ul>

      <button className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors">
        View Full Changelog
        <ExternalLink className="w-4 h-4" />
      </button>
    </div>
  );
}

