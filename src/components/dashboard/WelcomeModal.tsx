import { X, Sparkles, FileText, ClipboardList, Package } from 'lucide-react';

interface WelcomeModalProps {
  onClose: () => void;
}

export function WelcomeModal({ onClose }: WelcomeModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg max-w-2xl w-full p-8 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:text-gray-300"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <img 
              src="/assets/logos/bsp_logo_transparent_BASIC_01.png" 
              alt="BuildSelect Pro" 
              className="h-16 w-auto"
            />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome to BuildSelect Pro!
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Transform house plans into ready-to-buy selection packages in minutes
          </p>
        </div>

        <div className="space-y-6 mb-8">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-xl font-bold text-blue-600">1</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Create a Project</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Start by creating a new project for your client. Add their information and project details.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Upload Plans (Optional)</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Upload PDF plans, floor plans, elevations, or any project documents for reference.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <ClipboardList className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Complete the Questionnaire</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Answer a few simple questions about categories, style preferences, finishes, and room list.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Generate & Review Selections</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Let our system generate product selections matched to your preferences. Review and download.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">What You Get</h3>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span>Curated product selections from top brands</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span>Professional selection books with images and specs</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span>Detailed quote sheets with pricing</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span>Room-by-room organization</span>
            </li>
          </ul>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium shadow-md"
        >
          Get Started
        </button>
      </div>
    </div>
  );
}
