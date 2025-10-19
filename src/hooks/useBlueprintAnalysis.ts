import { useState, useCallback } from 'react';
import { blueprintAnalysisService, BlueprintAnalysisResult } from '../services/blueprintAnalysisService';

/**
 * React hook for managing blueprint AI analysis
 *
 * Usage:
 * ```tsx
 * const { analyzeFile, analyzing, results, error } = useBlueprintAnalysis();
 *
 * const handleAnalyze = async () => {
 *   const result = await analyzeFile(fileId, fileUrl, fileType);
 *   console.log('Analysis complete:', result);
 * };
 * ```
 */
export function useBlueprintAnalysis() {
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<BlueprintAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeFile = useCallback(
    async (fileId: string, fileUrl: string, fileType: string) => {
      setAnalyzing(true);
      setError(null);

      try {
        const result = await blueprintAnalysisService.analyzeBlueprint(
          fileId,
          fileUrl,
          fileType
        );
        setResults(result);
        return result;
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to analyze blueprint';
        setError(errorMessage);
        throw err;
      } finally {
        setAnalyzing(false);
      }
    },
    []
  );

  const analyzeProject = useCallback(async (projectId: string) => {
    setAnalyzing(true);
    setError(null);

    try {
      const results = await blueprintAnalysisService.analyzeProjectBlueprints(projectId);
      return results;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to analyze project blueprints';
      setError(errorMessage);
      throw err;
    } finally {
      setAnalyzing(false);
    }
  }, []);

  const getProjectAnalysis = useCallback(async (projectId: string) => {
    setAnalyzing(true);
    setError(null);

    try {
      const analysis = await blueprintAnalysisService.getProjectAnalysis(projectId);
      return analysis;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to get project analysis';
      setError(errorMessage);
      throw err;
    } finally {
      setAnalyzing(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults(null);
    setError(null);
  }, []);

  return {
    analyzeFile,
    analyzeProject,
    getProjectAnalysis,
    analyzing,
    results,
    error,
    clearResults,
  };
}
