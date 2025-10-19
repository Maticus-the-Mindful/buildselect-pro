/*
  # Add Blueprint File Type Support

  Extends the project_files table to support additional blueprint formats:
  - PDF (.pdf): Universal format for blueprints
  - DWG (.dwg): AutoCAD native format
  - DXF (.dxf): Drawing Exchange Format
  - DWF (.dwf): Design Web Format
  - RVT (.rvt): Revit BIM format
  - IFC (.ifc): Open BIM standard
  - Image formats: JPG, PNG
*/

-- Drop the existing file_type constraint
ALTER TABLE project_files
DROP CONSTRAINT IF EXISTS project_files_file_type_check;

-- Add new constraint with expanded file types
ALTER TABLE project_files
ADD CONSTRAINT project_files_file_type_check
CHECK (file_type IN ('pdf', 'dwg', 'dxf', 'dwf', 'rvt', 'ifc', 'image'));

-- Add a new column to store AI analysis results (optional, for future use)
ALTER TABLE project_files
ADD COLUMN IF NOT EXISTS ai_analysis_json JSONB DEFAULT NULL;

-- Add a new column to track processing status for AI analysis
ALTER TABLE project_files
ADD COLUMN IF NOT EXISTS processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed'));

-- Add index for faster queries on file type
CREATE INDEX IF NOT EXISTS idx_project_files_file_type_v2 ON project_files(file_type);

-- Add index for AI processing status queries
CREATE INDEX IF NOT EXISTS idx_project_files_processing_status ON project_files(processing_status);

-- Add comment for documentation
COMMENT ON COLUMN project_files.file_type IS 'Supported types: pdf, dwg, dxf, dwf, rvt, ifc, image';
COMMENT ON COLUMN project_files.ai_analysis_json IS 'Stores AI-extracted data from blueprints (rooms, dimensions, etc.)';
COMMENT ON COLUMN project_files.processing_status IS 'Tracks AI analysis status: pending, processing, completed, failed';
