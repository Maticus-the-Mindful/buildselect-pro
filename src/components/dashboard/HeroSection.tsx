import { Play, Upload, FolderPlus, Database } from 'lucide-react';

interface HeroSectionProps {
  onCreateProject: () => void;
  onUploadPlan?: () => void;
  onWatchDemo?: () => void;
  onConnectCatalog?: () => void;
}

export function HeroSection({ onCreateProject, onUploadPlan, onWatchDemo, onConnectCatalog }: HeroSectionProps) {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-900 rounded-xl md:rounded-2xl p-4 sm:p-6 md:p-12 mb-6 md:mb-8 border border-blue-100 dark:border-slate-700">
      <div className="grid md:grid-cols-2 gap-6 md:gap-8 items-center">
        {/* Left Column - Content */}
        <div className="space-y-6">
          <div className="space-y-2 md:space-y-3">
            <div className="flex items-center gap-3 mb-2">
              <img 
                src="/assets/logos/bsp_logo_transparent_BASIC_01.png" 
                alt="BuildSelect Pro" 
                className="h-12 sm:h-16 w-auto"
              />
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
              Turn plans into selections in minutes
            </h1>
            <p className="text-base md:text-lg text-gray-600 dark:text-gray-300">
              Upload a PDF, choose a catalog, and get an editable selections book and quote you can send today.
            </p>
          </div>

          {/* Primary CTAs */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={onCreateProject}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-5 py-2.5 sm:px-6 sm:py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl font-medium text-sm sm:text-base"
            >
              <FolderPlus className="w-4 h-4 sm:w-5 sm:h-5" />
              Create First Project
            </button>
            
            <button
              onClick={onUploadPlan}
              className="flex items-center justify-center gap-2 bg-white dark:bg-slate-700 text-gray-900 dark:text-white px-5 py-2.5 sm:px-6 sm:py-3 rounded-lg border-2 border-gray-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 transition-all font-medium text-sm sm:text-base"
            >
              <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
              Upload Plan PDF
            </button>
          </div>

          {/* Secondary CTA */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={onConnectCatalog}
              className="flex items-center justify-center gap-2 bg-green-600 text-white px-5 py-2.5 sm:px-6 sm:py-3 rounded-lg hover:bg-green-700 transition-all font-medium text-sm sm:text-base"
            >
              <Database className="w-4 h-4 sm:w-5 sm:h-5" />
              Connect a Catalog
            </button>
          </div>

          <button
            onClick={onWatchDemo}
            className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors text-sm sm:text-base"
          >
            <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Watch 60-second Demo
          </button>
        </div>

        {/* Right Column - Video Placeholder */}
        <div className="relative">
          <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-700 dark:to-slate-800 rounded-xl border-2 border-gray-300 dark:border-slate-600 flex items-center justify-center overflow-hidden shadow-xl">
            {/* Placeholder for video/GIF */}
            <div className="text-center p-8">
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Play className="w-10 h-10 text-white" />
              </div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                60-Second Workflow Demo
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Upload plan → Selections book → Quote sheet
              </p>
            </div>
            
            {/* Optional: Animated placeholder effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

