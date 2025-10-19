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
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            title={showResults ? "Click to hide results" : "Click to show results"}
          >
            <CheckCircle className="w-4 h-4" />
            <span>AI Analyzed</span>
          </button>
        );

      case 'processing':
        return (
          <button
            disabled
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg cursor-not-allowed"
            title="Analysis in progress"
          >
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Analyzing...</span>
          </button>
        );

      case 'failed':
        return (
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
            title="Analysis failed - click to retry"
          >
            <AlertCircle className="w-4 h-4" />
            <span>Retry</span>
          </button>
        );

      default: // 'pending'
        return (
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors disabled:opacity-50"
            title="Analyze blueprint with AI"
          >
            <Brain className="w-4 h-4" />
            <span>{analyzing ? 'Analyzing...' : 'Analyze Blueprint'}</span>
          </button>
        );
    }
  };

  return (
    <div>
      {getStatusButton()}

      {/* Results preview (optional - can be expanded to show full analysis) */}
      {showResults && file.processing_status === 'completed' && file.ai_analysis_json && (
        <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg text-xs">
          <div className="font-medium text-green-900 mb-1">Analysis Results</div>
          <div className="text-green-700 space-y-1">
            <div>
              Rooms detected: {(file.ai_analysis_json as any).rooms?.length || 0}
            </div>
            <div>
              Total area: {(file.ai_analysis_json as any).totalSquareFootage || 0} sq ft
            </div>
            <div>
              Recommendations: {(file.ai_analysis_json as any).recommendations?.length || 0}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
