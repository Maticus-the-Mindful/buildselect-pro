import { supabase } from '../lib/supabase';
import { anthropic } from '../lib/anthropic';
import {
  fetchPdfAndConvert,
  convertImageToBase64,
  type PdfPageImage,
} from '../utils/pdfToImage';

/**
 * Blueprint Analysis Service
 *
 * This service provides AI-powered analysis of blueprint files to extract:
 * - Room dimensions and layout
 * - Room types (kitchen, bathroom, etc.)
 * - MEP (Mechanical, Electrical, Plumbing) requirements
 * - Product recommendations based on blueprint specifications
 *
 * Supports: PDF, DWG, DXF, DWF, RVT, IFC formats
 */

export interface BlueprintAnalysisResult {
  rooms: RoomData[];
  totalSquareFootage: number;
  floorCount: number;
  recommendations: ProductRecommendation[];
  extractedText?: string;
  metadata: {
    fileType: string;
    processingTime: number;
    confidence: number;
  };
}

export interface RoomData {
  id: string;
  name: string;
  type: 'kitchen' | 'bathroom' | 'bedroom' | 'living_room' | 'dining_room' | 'office' | 'other';
  dimensions: {
    length: number;
    width: number;
    height?: number;
    squareFootage: number;
  };
  confidence: number; // 0-1 score indicating measurement certainty
  features: string[];
  requirements: {
    electrical?: string[];
    plumbing?: string[];
    hvac?: string[];
  };
}

export interface ProductRecommendation {
  category: string;
  quantity: number;
  specifications: Record<string, any>;
  priority: 'high' | 'medium' | 'low';
  reason: string;
}

export const blueprintAnalysisService = {
  /**
   * Analyzes a blueprint file and extracts structured data
   *
   * @param fileId - The project_files table ID
   * @param fileUrl - Public URL of the file in storage
   * @param fileType - Type of file (pdf, dwg, dxf, etc.)
   * @returns Analysis results with room data and recommendations
   */
  async analyzeBlueprint(
    fileId: string,
    fileUrl: string,
    fileType: string
  ): Promise<BlueprintAnalysisResult> {
    try {
      // Update status to processing
      await supabase
        .from('project_files')
        .update({ processing_status: 'processing' })
        .eq('id', fileId);

      const startTime = Date.now();

      // Get project context for enriched analysis
      const { data: fileData } = await supabase
        .from('project_files')
        .select('project_id')
        .eq('id', fileId)
        .single();

      let projectContext = null;
      if (fileData?.project_id) {
        const { data: projectData } = await supabase
          .from('projects')
          .select('name, questionnaire_json')
          .eq('id', fileData.project_id)
          .single();

        if (projectData) {
          projectContext = {
            projectName: projectData.name,
            questionnaire: projectData.questionnaire_json,
          };
        }
      }

      // Perform AI analysis with project context
      const analysisResult = await this.performAIAnalysis(fileUrl, fileType, projectContext);

      const processingTime = Date.now() - startTime;

      // Store the analysis results
      await supabase
        .from('project_files')
        .update({
          processing_status: 'completed',
          ai_analysis_json: analysisResult,
        })
        .eq('id', fileId);

      return {
        ...analysisResult,
        metadata: {
          fileType,
          processingTime,
          confidence: 0.85, // Placeholder confidence score
        },
      };
    } catch (error) {
      // Update status to failed
      await supabase
        .from('project_files')
        .update({ processing_status: 'failed' })
        .eq('id', fileId);

      throw error;
    }
  },

  /**
   * Real AI analysis implementation using Claude Vision API
   *
   * Supports:
   * - PDF blueprints (converted to images)
   * - Direct image files (JPG, PNG, etc.)
   * - CAD files (DWG, DXF) - placeholder for future implementation
   * - BIM files (RVT, IFC) - placeholder for future implementation
   */
  async performAIAnalysis(
    fileUrl: string,
    fileType: string,
    projectContext?: { projectName: string; questionnaire: any } | null
  ): Promise<Omit<BlueprintAnalysisResult, 'metadata'>> {
    // Handle PDF and image files with Claude Vision
    if (fileType === 'pdf' || fileType === 'image') {
      return await this.analyzeBlueprintWithClaudeVision(fileUrl, fileType, projectContext);
    }

    // CAD and BIM files - placeholder for future implementation
    if (['dwg', 'dxf', 'dwf'].includes(fileType)) {
      // TODO: Implement CAD file parsing
      throw new Error(
        `CAD file analysis (${fileType}) not yet implemented. Please convert to PDF or use the API documentation to implement CAD parsing.`
      );
    }

    if (['rvt', 'ifc'].includes(fileType)) {
      // TODO: Implement BIM file parsing
      throw new Error(
        `BIM file analysis (${fileType}) not yet implemented. Please convert to PDF or use the API documentation to implement BIM parsing.`
      );
    }

    throw new Error(`Unsupported file type: ${fileType}`);
  },

  /**
   * Analyzes blueprint images using Claude Vision API with multi-page support
   */
  async analyzeBlueprintWithClaudeVision(
    fileUrl: string,
    fileType: string,
    projectContext?: { projectName: string; questionnaire: any } | null
  ): Promise<Omit<BlueprintAnalysisResult, 'metadata'>> {
    try {
      let images: Array<{ base64: string; mediaType: 'image/jpeg' | 'image/png' }> = [];

      // Convert PDF to images or get image directly
      if (fileType === 'pdf') {
        const pdfImages = await fetchPdfAndConvert(fileUrl, 10); // Process up to 10 pages

        if (pdfImages.length === 0) {
          throw new Error('No pages found in PDF');
        }

        // All pages are PNG now (from our updated pdfToImage.ts)
        images = pdfImages.map(img => ({
          base64: img.base64,
          mediaType: 'image/png' as const
        }));
      } else {
        // Direct image file
        const imageBase64 = await convertImageToBase64(fileUrl);
        const mediaType: 'image/jpeg' | 'image/png' = fileUrl.toLowerCase().includes('.png')
          ? 'image/png'
          : 'image/jpeg';

        images = [{ base64: imageBase64, mediaType }];
      }

      // Create the enhanced analysis prompt
      const pageContext = images.length > 1
        ? `You are analyzing ${images.length} blueprint pages. These may show different floors, sections, or views of the same building. Analyze ALL pages and combine the information into a single comprehensive response.`
        : `You are analyzing a single blueprint page.`;

      // Add project context if available
      const contextSection = projectContext?.questionnaire
        ? `\n\nPROJECT CONTEXT:
- Project name: ${projectContext.projectName || 'Unknown'}
- Project type: ${projectContext.questionnaire.project_type || 'residential'}
- Building type: ${projectContext.questionnaire.building_type || 'single family'}
- Expected floors: ${projectContext.questionnaire.floor_count || 'unknown'}

Use this context to validate your analysis. For example, if the project type is "residential", expect typical residential rooms. If floor_count is specified, verify your floorCount matches or explain any discrepancy.`
        : '';

      const prompt = `You are an expert architectural blueprint analyst. Analyze this floor plan and extract detailed information.

${pageContext}${contextSection}

Please analyze this blueprint and provide a structured response in JSON format with the following schema:

{
  "rooms": [
    {
      "id": "unique-id",
      "name": "Room name from blueprint labels (e.g., 'Master Bedroom', 'Kitchen', 'Bath 2')",
      "type": "kitchen|bathroom|bedroom|living_room|dining_room|office|other",
      "dimensions": {
        "length": number (in feet),
        "width": number (in feet),
        "height": number (in feet, if visible),
        "squareFootage": number (calculate length × width)
      },
      "confidence": number (0-1, how certain are you about this room's measurements),
      "features": ["list", "of", "notable", "features"],
      "requirements": {
        "electrical": ["list of electrical needs"],
        "plumbing": ["list of plumbing needs"],
        "hvac": ["list of HVAC needs"]
      }
    }
  ],
  "totalSquareFootage": number,
  "floorCount": number,
  "recommendations": [
    {
      "category": "Product category",
      "quantity": number,
      "specifications": {
        "type": "Product type",
        "size": "Size specification"
      },
      "priority": "high|medium|low",
      "reason": "Why this is recommended"
    }
  ]
}

CRITICAL INSTRUCTIONS - Follow these carefully:

0. SCALE DETECTION (PRIORITY): First, look for the scale legend on the blueprint (e.g., "1/4\" = 1'", "1:50", or a graphic scale bar).
   If found, use it to accurately calculate dimensions. If dimension annotations are missing, use the scale bar/legend to measure rooms.

1. ROOM NAMES: Look for text labels on the blueprint that indicate room names (e.g., "MASTER BEDROOM", "KITCHEN", "LIVING ROOM", "BATH"). Use these exact labels as the room names. If no label exists, create a descriptive name based on the room type (e.g., "Bedroom 1", "Bathroom 2").

2. ROOM DIMENSIONS: Look for dimension annotations on the blueprint (usually shown as numbers with tick marks or arrows). Common formats include:
   - "12'-0\" × 10'-6\"" (feet and inches)
   - "12' × 10.5'" (decimal feet)
   - Metric measurements that need conversion to feet
   Extract these dimensions and convert everything to decimal feet.

3. SQUARE FOOTAGE: For each room, calculate squareFootage = length × width. If dimensions show "12' × 10'", then squareFootage = 120.

4. ROOM IDENTIFICATION: Identify room types based on:
   - Text labels on the blueprint
   - Fixtures shown (toilets/vanities = bathroom, stove/sink = kitchen, etc.)
   - Door/window placement
   - Typical room sizes and relationships

5. BE THOROUGH: Extract ALL rooms visible in the blueprint, including closets, hallways, pantries, laundry rooms, etc.

6. FEATURES: List notable features like walk-in closets, islands, built-in shelving, bay windows, etc.

7. OUTPUT FORMAT: Return ONLY valid JSON with no additional text, markdown formatting, or explanations.

8. DIMENSION VALIDATION: Verify measurements are reasonable:
   - Typical bedroom: 100-200 sq ft
   - Master bedroom: 200-400 sq ft
   - Kitchen: 150-400 sq ft
   - Bathroom: 40-100 sq ft
   - Living room: 200-500 sq ft
   If extracted dimensions seem wrong (e.g., 10 sq ft bedroom), re-examine the blueprint scale and recalculate.

9. CONFIDENCE SCORING: For each room, provide a confidence score (0-1):
   - 1.0 = Dimensions clearly labeled and readable
   - 0.8 = Dimensions calculated from scale, labels clear
   - 0.6 = Estimated from proportions, some labels visible
   - 0.4 = Rough estimate, poor image quality or unclear labels
   - 0.2 = Very uncertain, minimal information available

If dimensions are not clearly readable, make reasonable estimates based on:
- Scale legend and measurements from the scale bar
- Typical room sizes for the room type
- Proportions relative to other rooms
- Standard door widths (typically 3 feet) as reference`;

      // Call Claude Vision API with all pages in a single request (batch processing)
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 8192, // Increased for multi-page analysis
        messages: [
          {
            role: 'user',
            content: [
              // Add all images first
              ...images.map((img) => ({
                type: 'image' as const,
                source: {
                  type: 'base64' as const,
                  media_type: img.mediaType,
                  data: img.base64,
                },
              })),
              // Then add the text prompt
              {
                type: 'text' as const,
                text: prompt,
              },
            ],
          },
        ],
      });

      // Extract the text response
      const textContent = response.content.find((block) => block.type === 'text');

      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text response from Claude');
      }

      // Parse the JSON response
      let analysisResult;
      try {
        // Claude might wrap JSON in markdown code blocks, so we need to extract it
        let jsonText = textContent.text.trim();

        // Remove markdown code fences if present
        if (jsonText.startsWith('```json')) {
          jsonText = jsonText.replace(/```json\n?/, '').replace(/```\s*$/, '');
        } else if (jsonText.startsWith('```')) {
          jsonText = jsonText.replace(/```\n?/, '').replace(/```\s*$/, '');
        }

        analysisResult = JSON.parse(jsonText);
      } catch (parseError) {
        console.error('Failed to parse Claude response:', textContent.text);
        throw new Error('Failed to parse AI response as JSON');
      }

      // Validate the analysis result
      const validationErrors = this.validateAnalysisResult(analysisResult);
      if (validationErrors.length > 0) {
        console.warn('Analysis validation warnings:', validationErrors);
        // Sanitize the result to fix common issues
        analysisResult = this.sanitizeAnalysisResult(analysisResult);
      }

      // Validate and return the result
      return {
        rooms: analysisResult.rooms || [],
        totalSquareFootage: analysisResult.totalSquareFootage || 0,
        floorCount: analysisResult.floorCount || 1,
        recommendations: analysisResult.recommendations || [],
        extractedText: textContent.text,
      };
    } catch (error) {
      console.error('Claude Vision analysis error:', error);
      throw error;
    }
  },

  /**
   * Gets the AI analysis results for a file
   *
   * @param fileId - The project_files table ID
   * @returns The stored analysis results or null if not yet analyzed
   */
  async getAnalysisResults(fileId: string): Promise<BlueprintAnalysisResult | null> {
    const { data, error } = await supabase
      .from('project_files')
      .select('ai_analysis_json, file_type, processing_status')
      .eq('id', fileId)
      .single();

    if (error || !data || !data.ai_analysis_json) {
      return null;
    }

    return data.ai_analysis_json as BlueprintAnalysisResult;
  },

  /**
   * Processes all blueprint files for a project
   *
   * @param projectId - The project ID
   * @returns Array of analysis results for each file
   */
  async analyzeProjectBlueprints(projectId: string): Promise<BlueprintAnalysisResult[]> {
    // Get all files for the project that haven't been processed
    const { data: files } = await supabase
      .from('project_files')
      .select('*')
      .eq('project_id', projectId)
      .in('processing_status', ['pending', 'failed']);

    if (!files || files.length === 0) {
      return [];
    }

    const results: BlueprintAnalysisResult[] = [];

    for (const file of files) {
      try {
        const result = await this.analyzeBlueprint(
          file.id,
          file.file_url,
          file.file_type
        );
        results.push(result);
      } catch (error) {
        console.error(`Failed to analyze file ${file.id}:`, error);
      }
    }

    return results;
  },

  /**
   * Combines analysis from multiple blueprints into a unified project view
   *
   * @param projectId - The project ID
   * @returns Aggregated analysis across all project blueprints
   */
  async getProjectAnalysis(projectId: string): Promise<{
    totalRooms: number;
    totalSquareFootage: number;
    roomsByType: Record<string, number>;
    allRecommendations: ProductRecommendation[];
  }> {
    const { data: files } = await supabase
      .from('project_files')
      .select('ai_analysis_json')
      .eq('project_id', projectId)
      .eq('processing_status', 'completed')
      .not('ai_analysis_json', 'is', null);

    if (!files || files.length === 0) {
      return {
        totalRooms: 0,
        totalSquareFootage: 0,
        roomsByType: {},
        allRecommendations: [],
      };
    }

    const allRooms: RoomData[] = [];
    const allRecommendations: ProductRecommendation[] = [];
    let totalSquareFootage = 0;

    files.forEach((file) => {
      const analysis = file.ai_analysis_json as BlueprintAnalysisResult;
      if (analysis) {
        allRooms.push(...analysis.rooms);
        allRecommendations.push(...analysis.recommendations);
        totalSquareFootage += analysis.totalSquareFootage;
      }
    });

    const roomsByType = allRooms.reduce((acc, room) => {
      acc[room.type] = (acc[room.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalRooms: allRooms.length,
      totalSquareFootage,
      roomsByType,
      allRecommendations,
    };
  },

  /**
   * Validates analysis result structure and data quality
   *
   * @param result - The parsed analysis result
   * @returns Array of validation error messages
   */
  validateAnalysisResult(result: any): string[] {
    const errors: string[] = [];

    // Check rooms array exists
    if (!Array.isArray(result.rooms)) {
      errors.push('rooms is not an array');
      return errors; // Can't continue validation
    }

    // Validate each room
    result.rooms.forEach((room: any, idx: number) => {
      // Check required fields
      if (!room.name) {
        errors.push(`Room ${idx} is missing a name`);
      }

      // Check dimensions exist
      if (!room.dimensions) {
        errors.push(`Room ${idx} (${room.name || 'unnamed'}) is missing dimensions`);
      } else {
        // Validate square footage is reasonable
        const sqft = room.dimensions.squareFootage;
        if (!sqft || sqft < 10) {
          errors.push(
            `Room ${idx} (${room.name || 'unnamed'}) has invalid square footage: ${sqft}`
          );
        }
        if (sqft > 2000) {
          errors.push(
            `Room ${idx} (${room.name || 'unnamed'}) seems too large: ${sqft} sq ft - verify this is correct`
          );
        }

        // Check length and width make sense
        if (room.dimensions.length && room.dimensions.width) {
          const calculatedSqft = room.dimensions.length * room.dimensions.width;
          if (Math.abs(calculatedSqft - sqft) > 5) {
            errors.push(
              `Room ${idx} (${room.name || 'unnamed'}) has mismatched dimensions: ${room.dimensions.length} × ${room.dimensions.width} ≠ ${sqft}`
            );
          }
        }
      }

      // Check confidence score
      if (room.confidence !== undefined && (room.confidence < 0 || room.confidence > 1)) {
        errors.push(
          `Room ${idx} (${room.name || 'unnamed'}) has invalid confidence score: ${room.confidence}`
        );
      }

      // Validate room type
      const validTypes = [
        'kitchen',
        'bathroom',
        'bedroom',
        'living_room',
        'dining_room',
        'office',
        'other',
      ];
      if (!validTypes.includes(room.type)) {
        errors.push(
          `Room ${idx} (${room.name || 'unnamed'}) has invalid type: ${room.type}`
        );
      }
    });

    // Check total square footage
    if (result.totalSquareFootage && result.totalSquareFootage < 100) {
      errors.push(
        `Total square footage seems too low: ${result.totalSquareFootage} sq ft`
      );
    }

    return errors;
  },

  /**
   * Sanitizes analysis result to fix common issues
   *
   * @param result - The analysis result to sanitize
   * @returns Sanitized result
   */
  sanitizeAnalysisResult(result: any): any {
    // Ensure rooms array exists
    if (!Array.isArray(result.rooms)) {
      result.rooms = [];
    }

    // Fix each room
    result.rooms = result.rooms
      .map((room: any, idx: number) => {
        // Ensure required fields
        room.id = room.id || `room-${idx + 1}`;
        room.name = room.name || `Room ${idx + 1}`;
        room.features = Array.isArray(room.features) ? room.features : [];
        room.requirements = room.requirements || {};

        // Fix dimensions
        if (!room.dimensions) {
          room.dimensions = {
            length: 0,
            width: 0,
            squareFootage: 0,
          };
        } else {
          // Recalculate square footage if mismatched
          if (room.dimensions.length && room.dimensions.width) {
            const calculated = room.dimensions.length * room.dimensions.width;
            const existing = room.dimensions.squareFootage || 0;

            // If mismatch is significant, use calculated value
            if (Math.abs(calculated - existing) > 5) {
              room.dimensions.squareFootage = Math.round(calculated);
            }
          }

          // Ensure square footage is reasonable
          if (room.dimensions.squareFootage < 10) {
            // Too small, likely an error - use default based on room type
            room.dimensions.squareFootage = this.getDefaultSquareFootage(room.type);
          }
        }

        // Ensure confidence score is valid
        if (
          room.confidence === undefined ||
          room.confidence < 0 ||
          room.confidence > 1
        ) {
          // Set low confidence if data was questionable
          room.confidence = 0.5;
        }

        // Validate room type
        const validTypes = [
          'kitchen',
          'bathroom',
          'bedroom',
          'living_room',
          'dining_room',
          'office',
          'other',
        ];
        if (!validTypes.includes(room.type)) {
          room.type = 'other';
        }

        return room;
      })
      .filter((room: any) => room !== null); // Remove null rooms

    // Ensure other fields exist
    result.totalSquareFootage = result.totalSquareFootage || 0;
    result.floorCount = result.floorCount || 1;
    result.recommendations = Array.isArray(result.recommendations)
      ? result.recommendations
      : [];

    return result;
  },

  /**
   * Gets default square footage for a room type
   */
  getDefaultSquareFootage(roomType: string): number {
    const defaults: Record<string, number> = {
      kitchen: 200,
      bathroom: 60,
      bedroom: 150,
      living_room: 300,
      dining_room: 200,
      office: 150,
      other: 100,
    };

    return defaults[roomType] || 100;
  },
};
