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

      // TODO: Implement actual AI analysis
      // This is where you would:
      // 1. For PDFs: Extract text and images, use OCR if needed
      // 2. For CAD files (DWG, DXF): Parse geometry and annotations
      // 3. For BIM files (RVT, IFC): Extract building data model
      // 4. Use Claude/GPT-4 Vision to analyze floor plans and extract room data
      // 5. Cross-reference with questionnaire data for context

      // Example placeholder analysis
      const analysisResult = await this.performAIAnalysis(fileUrl, fileType);

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
    fileType: string
  ): Promise<Omit<BlueprintAnalysisResult, 'metadata'>> {
    // Handle PDF and image files with Claude Vision
    if (fileType === 'pdf' || fileType === 'image') {
      return await this.analyzeBlueprintWithClaudeVision(fileUrl, fileType);
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
   * Analyzes blueprint images using Claude Vision API
   */
  async analyzeBlueprintWithClaudeVision(
    fileUrl: string,
    fileType: string
  ): Promise<Omit<BlueprintAnalysisResult, 'metadata'>> {
    try {
      let imageBase64: string;
      let mediaType: 'image/jpeg' | 'image/png' = 'image/jpeg';

      // Convert PDF to images or get image directly
      if (fileType === 'pdf') {
        const pdfImages = await fetchPdfAndConvert(fileUrl, 5); // Process first 5 pages

        if (pdfImages.length === 0) {
          throw new Error('No pages found in PDF');
        }

        // Use the first page for analysis (most PDFs have floor plans on page 1)
        imageBase64 = pdfImages[0].base64;
      } else {
        // Direct image file
        imageBase64 = await convertImageToBase64(fileUrl);

        // Determine media type from URL
        if (fileUrl.toLowerCase().includes('.png')) {
          mediaType = 'image/png';
        }
      }

      // Create the analysis prompt
      const prompt = `You are an expert architectural blueprint analyst. Analyze this floor plan and extract detailed information.

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

If dimensions are not clearly readable, make reasonable estimates based on:
- Typical room sizes (bedrooms: 120-200 sqft, master: 200-400 sqft, bathrooms: 40-100 sqft)
- Scale and proportion relative to other rooms
- Standard door widths (typically 3 feet) as reference`;

      // Call Claude Vision API
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType,
                  data: imageBase64,
                },
              },
              {
                type: 'text',
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
};
