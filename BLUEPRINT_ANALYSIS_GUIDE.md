# Blueprint Analysis System - Implementation Guide

## Overview

The BuildSelect Pro blueprint analysis system provides AI-powered processing of architectural and construction documents to automatically extract room data, dimensions, and generate product recommendations based on uploaded blueprints.

## Supported File Formats

- **PDF (.pdf)**: Universal format for blueprints and construction documents
- **DWG (.dwg)**: AutoCAD native format for 2D/3D CAD drawings
- **DXF (.dxf)**: Drawing Exchange Format - open standard for CAD data
- **DWF (.dwf)**: Design Web Format - lightweight Autodesk format
- **RVT (.rvt)**: Revit native format for Building Information Modeling (BIM)
- **IFC (.ifc)**: Industry Foundation Classes - open BIM standard
- **Images**: JPG, PNG, GIF, BMP for scanned blueprints

## System Architecture

### Database Schema

#### project_files Table
```sql
CREATE TABLE project_files (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  file_name TEXT NOT NULL,
  file_type TEXT CHECK (file_type IN ('pdf', 'dwg', 'dxf', 'dwf', 'rvt', 'ifc', 'image')),
  file_url TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  page_type TEXT CHECK (page_type IN ('floor_plan', 'elevation', 'mep', 'rcp', 'other')),
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  ai_analysis_json JSONB DEFAULT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Storage
- Bucket: `project-files` (public read, authenticated write)
- Path structure: `{projectId}/{timestamp}-{filename}`
- Max file size: 100MB per file

### Components

1. **FileUpload.tsx** - Handles file upload with drag-and-drop support
2. **FileList.tsx** - Displays uploaded files with type-specific icons
3. **BlueprintAnalysisButton.tsx** - Triggers and displays AI analysis status
4. **blueprintAnalysisService.ts** - Core AI analysis logic
5. **useBlueprintAnalysis.ts** - React hook for blueprint analysis

## AI Analysis Workflow

### 1. File Upload
```tsx
// User uploads blueprint via FileUpload component
// File is stored in Supabase storage
// Record created in project_files table with status 'pending'
```

### 2. Trigger Analysis
```tsx
import { useBlueprintAnalysis } from '@/hooks/useBlueprintAnalysis';

const { analyzeFile, analyzing, results } = useBlueprintAnalysis();

// Analyze single file
const result = await analyzeFile(fileId, fileUrl, fileType);

// Analyze all files in project
const allResults = await analyzeProject(projectId);
```

### 3. Analysis Process

The `blueprintAnalysisService.analyzeBlueprint()` method:

1. Updates `processing_status` to `'processing'`
2. Processes file based on type:
   - **PDF**: Extract text/images, OCR if needed, analyze with Claude Vision
   - **DWG/DXF**: Parse geometry using CAD parser library
   - **RVT**: Use Revit API wrapper to extract BIM data
   - **IFC**: Parse using IFC.js or similar library
3. Extracts structured data:
   - Room locations and dimensions
   - Room types (kitchen, bathroom, etc.)
   - MEP (Mechanical, Electrical, Plumbing) requirements
   - Product recommendations
4. Stores results in `ai_analysis_json` field
5. Updates `processing_status` to `'completed'`

### 4. Display Results

The `BlueprintAnalysisButton` component shows:
- **Pending**: "Analyze Blueprint" button
- **Processing**: Loading spinner
- **Completed**: Checkmark with room count
- **Failed**: Error icon with retry option

## Integration with Questionnaire

The AI analysis results should be cross-referenced with questionnaire data:

```typescript
// In your product selection logic:
const blueprintAnalysis = await blueprintAnalysisService.getProjectAnalysis(projectId);
const questionnaireData = await getQuestionnaire(projectId);

// Combine both data sources:
const productRecommendations = generateRecommendations({
  rooms: blueprintAnalysis.roomsByType,
  preferences: questionnaireData.style,
  budget: questionnaireData.category_budgets,
  // Blueprint analysis provides the "what" (rooms, dimensions)
  // Questionnaire provides the "how" (style, preferences, budget)
});
```

## Implementing Actual AI Analysis

### For PDF Files (Most Common)

```typescript
// In blueprintAnalysisService.ts, update performAIAnalysis():

async performAIAnalysis(fileUrl: string, fileType: string) {
  if (fileType === 'pdf') {
    // 1. Convert PDF to images
    const pdfImages = await convertPdfToImages(fileUrl);

    // 2. Use Claude with vision API
    const prompt = `
      Analyze this architectural floor plan and extract:
      1. All rooms with their names and types
      2. Dimensions (length x width in feet)
      3. Notable features (islands, pantries, etc.)
      4. Electrical and plumbing requirements

      Return structured JSON matching this schema:
      {
        rooms: [{ name, type, dimensions, features, requirements }],
        totalSquareFootage: number,
        floorCount: number
      }
    `;

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: pdfImages[0]
            }
          },
          {
            type: 'text',
            text: prompt
          }
        ]
      }]
    });

    return JSON.parse(response.content[0].text);
  }
}
```

### For DWG/DXF Files

```typescript
// Install: npm install dxf-parser
import DxfParser from 'dxf-parser';

async performAIAnalysis(fileUrl: string, fileType: string) {
  if (fileType === 'dxf') {
    const dxfContent = await fetch(fileUrl).then(r => r.text());
    const parser = new DxfParser();
    const dxf = parser.parseSync(dxfContent);

    // Extract entities (lines, arcs, text, etc.)
    const entities = dxf.entities;

    // Parse text labels to identify rooms
    const textEntities = entities.filter(e => e.type === 'TEXT');

    // Parse polylines/lines to calculate dimensions
    const polylines = entities.filter(e => e.type === 'LWPOLYLINE');

    // Use Claude to interpret extracted data
    const interpretation = await interpretCadData({
      texts: textEntities,
      geometry: polylines
    });

    return interpretation;
  }
}
```

### For IFC Files (BIM)

```typescript
// Install: npm install web-ifc
import { IfcAPI } from 'web-ifc';

async performAIAnalysis(fileUrl: string, fileType: string) {
  if (fileType === 'ifc') {
    const ifcApi = new IfcAPI();
    await ifcApi.Init();

    const ifcData = await fetch(fileUrl).then(r => r.arrayBuffer());
    const modelID = ifcApi.OpenModel(new Uint8Array(ifcData));

    // Get all spaces (rooms)
    const spaces = ifcApi.GetLineIDsWithType(modelID, IFCSPACE);

    const rooms = [];
    for (const spaceID of spaces) {
      const space = ifcApi.GetLine(modelID, spaceID);

      rooms.push({
        id: spaceID.toString(),
        name: space.LongName?.value || space.Name?.value,
        type: inferRoomType(space.Name?.value),
        dimensions: extractSpaceDimensions(ifcApi, modelID, spaceID)
      });
    }

    return { rooms, totalSquareFootage: calculateTotal(rooms) };
  }
}
```

## Product Recommendation Logic

Once blueprint analysis is complete, generate recommendations:

```typescript
function generateRecommendations(
  rooms: RoomData[],
  questionnaire: QuestionnaireData,
  catalog: CatalogConnection
): ProductRecommendation[] {
  const recommendations = [];

  for (const room of rooms) {
    if (room.type === 'kitchen') {
      // Kitchen requires range, refrigerator, dishwasher, etc.
      recommendations.push({
        category: 'Appliances',
        quantity: 1,
        specifications: {
          type: 'Range',
          fuel: questionnaire.energy_type || 'gas',
          size: room.dimensions.width >= 15 ? '36"' : '30"',
          style: questionnaire.style
        },
        priority: 'high',
        reason: `${room.name} requires professional range for ${room.dimensions.squareFootage} sq ft space`
      });
    }

    if (room.type === 'bathroom') {
      // Bathroom requires fixtures based on size
      const isMasterBath = room.dimensions.squareFootage > 80;

      recommendations.push({
        category: 'Plumbing Fixtures',
        quantity: isMasterBath ? 2 : 1,
        specifications: {
          type: 'Sink',
          style: questionnaire.style,
          finish: questionnaire.finish_colors?.includes('chrome') ? 'chrome' : 'brushed nickel'
        },
        priority: 'high',
        reason: `${room.name} requires ${isMasterBath ? 'double' : 'single'} vanity sink`
      });
    }
  }

  return recommendations;
}
```

## Testing

### Manual Testing Checklist

1. **File Upload**
   - [ ] Upload PDF blueprint
   - [ ] Upload DWG file (if available)
   - [ ] Upload DXF file
   - [ ] Upload IFC file
   - [ ] Upload image (JPG/PNG)
   - [ ] Verify files appear in list with correct icons
   - [ ] Verify file size displayed correctly

2. **AI Analysis**
   - [ ] Click "Analyze Blueprint" button
   - [ ] Verify status changes to "Analyzing..."
   - [ ] Verify status changes to "AI Analyzed" on completion
   - [ ] Click to view analysis results
   - [ ] Verify room count is displayed
   - [ ] Verify square footage is displayed

3. **Database**
   - [ ] Check `project_files` table has correct file_type
   - [ ] Check `processing_status` updates correctly
   - [ ] Check `ai_analysis_json` contains structured data

### Unit Tests

```typescript
// tests/blueprintAnalysis.test.ts
import { blueprintAnalysisService } from '../services/blueprintAnalysisService';

describe('Blueprint Analysis Service', () => {
  it('should detect file type correctly', () => {
    const pdfFile = new File([''], 'blueprint.pdf');
    expect(getFileType(pdfFile)).toBe('pdf');

    const dwgFile = new File([''], 'floor-plan.dwg');
    expect(getFileType(dwgFile)).toBe('dwg');
  });

  it('should extract rooms from analysis', async () => {
    const result = await blueprintAnalysisService.analyzeBlueprint(
      'test-file-id',
      'test-url',
      'pdf'
    );

    expect(result.rooms).toBeDefined();
    expect(result.rooms.length).toBeGreaterThan(0);
    expect(result.totalSquareFootage).toBeGreaterThan(0);
  });
});
```

## Next Steps

1. **Implement PDF Analysis**: Integrate Claude Vision API for PDF blueprint analysis
2. **Add CAD Parsing**: Implement DWG/DXF parsing using `dxf-parser` or similar
3. **Implement BIM Support**: Add IFC.js for IFC file parsing
4. **Create Analysis Dashboard**: Build UI to display detailed analysis results
5. **Integrate with Product Selection**: Use analysis results to auto-populate questionnaire
6. **Add Batch Processing**: Process all project files at once
7. **Implement Caching**: Cache analysis results to avoid re-processing

## Resources

- [Claude Vision API](https://docs.anthropic.com/claude/docs/vision)
- [DXF Parser](https://github.com/gdsestimating/dxf-parser)
- [IFC.js](https://ifcjs.github.io/info/)
- [PDF.js](https://mozilla.github.io/pdf.js/)
- [Revit API](https://www.revitapidocs.com/)

## Support

For questions or issues with the blueprint analysis system, please refer to:
- Main documentation: `/docs/blueprint-analysis.md`
- API reference: `/docs/api/blueprint-analysis.md`
- Troubleshooting: `/docs/troubleshooting.md`
