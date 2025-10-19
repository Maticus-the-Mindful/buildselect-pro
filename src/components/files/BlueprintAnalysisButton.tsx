import { useState, useEffect } from 'react';
import { Brain, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useBlueprintAnalysis } from '../../hooks/useBlueprintAnalysis';
import type { Database } from '../../lib/database.types';

type ProjectFile = Database['public']['Tables']['project_files']['Row'];

interface BlueprintAnalysisButtonProps {
  file: ProjectFile;
  onAnalysisComplete?: () => void;
}

/**
 * Button component for triggering AI analysis on blueprint files
 *
 * Shows different states:
 * - Pending: "Analyze Blueprint" button
 * - Processing: Loading spinner
 * - Completed: Checkmark with room count (auto-expanded)
 * - Failed: Error icon with retry button
 */
export function BlueprintAnalysisButton({ file, onAnalysisComplete }: BlueprintAnalysisButtonProps) {
  const { analyzeFile, analyzing } = useBlueprintAnalysis();
  const [showResults, setShowResults] = useState(false);

  // Automatically show results when analysis is completed
  useEffect(() => {
    if (file.processing_status === 'completed' && file.ai_analysis_json) {
      setShowResults(true);
    }
  }, [file.processing_status, file.ai_analysis_json]);

  // Don't show for images - only for actual blueprints
  if (file.file_type === 'image') {
    return null;
  }

  const handleAnalyze = async () => {
    try {
      const results = await analyzeFile(file.id, file.file_url, file.file_type);

      // Trigger parent component refresh to show updated status
      // The useEffect will automatically expand the results
      onAnalysisComplete?.();

      // Optional: Show toast notification
      console.log('Analysis complete:', results);
    } catch (error) {
      console.error('Analysis failed:', error);
      // Also refresh on error to show the failed status
      onAnalysisComplete?.();
    }
  };

  const getStatusButton = () => {
    switch (file.processing_status) {
      case 'completed':
        return (
          <button
            onClick={() => setShowResults(!showResults)}
            className="flex items-center gap-3 px-5 py-3 text-sm font-semibold text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors shadow-sm"
            title={showResults ? "Click to hide results" : "Click to show results"}
          >
            <CheckCircle className="w-6 h-6" />
            <span>AI Analyzed</span>
          </button>
        );

      case 'processing':
        return (
          <button
            disabled
            className="flex items-center gap-3 px-5 py-3 text-sm font-semibold text-blue-700 bg-blue-50 rounded-lg cursor-not-allowed shadow-sm"
            title="Analysis in progress"
          >
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Analyzing...</span>
          </button>
        );

      case 'failed':
        return (
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="flex items-center gap-3 px-5 py-3 text-sm font-semibold text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 shadow-sm"
            title="Analysis failed - click to retry"
          >
            <AlertCircle className="w-6 h-6" />
            <span>Retry</span>
          </button>
        );

      default: // 'pending'
        return (
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="flex items-center gap-3 px-5 py-3 text-sm font-semibold text-purple-700 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors disabled:opacity-50 shadow-sm"
            title="Analyze blueprint with AI"
          >
            <Brain className="w-6 h-6" />
            <span>{analyzing ? 'Analyzing...' : 'Analyze Blueprint'}</span>
          </button>
        );
    }
  };

  return (
    <div>
      {getStatusButton()}

      {/* Results preview - shows detailed room breakdown */}
      {showResults && file.processing_status === 'completed' && file.ai_analysis_json && (
        <div className="mt-3 p-4 bg-green-50 border-2 border-green-200 rounded-lg shadow-sm">
          <div className="font-semibold text-green-900 mb-3 text-base">Analysis Results</div>

          {/* Room breakdown */}
          {(file.ai_analysis_json as any).rooms && (file.ai_analysis_json as any).rooms.length > 0 && (
            <div className="mb-4">
              <div className="font-semibold text-green-800 mb-2 text-sm">
                Rooms ({(file.ai_analysis_json as any).rooms.length}):
              </div>
              <div className="space-y-2 pl-2">
                {(file.ai_analysis_json as any).rooms.map((room: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-start text-green-700 text-sm">
                    <span className="font-semibold">{room.name || `Room ${idx + 1}`}</span>
                    <span className="text-green-600 ml-3 font-medium">
                      {room.dimensions?.squareFootage
                        ? `${Math.round(room.dimensions.squareFootage)} sq ft`
                        : 'N/A'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary stats */}
          <div className="text-green-700 space-y-2 pt-3 border-t-2 border-green-200 text-sm">
            <div className="flex justify-between">
              <span className="font-medium">Total area:</span>
              <span className="font-semibold">
                {(file.ai_analysis_json as any).totalSquareFootage || 0} sq ft
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Recommendations:</span>
              <span className="font-semibold">
                {(file.ai_analysis_json as any).recommendations?.length || 0}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
