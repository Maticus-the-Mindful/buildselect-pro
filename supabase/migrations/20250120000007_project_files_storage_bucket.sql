/*
  # Project Files Storage Bucket

  Creates the storage bucket for project blueprint and plan uploads.
  Supports: PDF, DWG, DXF, DWF, RVT, IFC, and image files.
*/

-- Create storage bucket for project files
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-files', 'project-files', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files to their projects
CREATE POLICY "Users can upload files to their projects"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'project-files' AND
  -- Verify user owns the project (extracted from path: {projectId}/{filename})
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id::text = (storage.foldername(name))[1]
    AND projects.user_id = auth.uid()
  )
);

-- Allow authenticated users to read files from their projects
CREATE POLICY "Users can read files from their projects"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'project-files' AND
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id::text = (storage.foldername(name))[1]
    AND projects.user_id = auth.uid()
  )
);

-- Allow authenticated users to update files in their projects
CREATE POLICY "Users can update files in their projects"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'project-files' AND
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id::text = (storage.foldername(name))[1]
    AND projects.user_id = auth.uid()
  )
);

-- Allow authenticated users to delete files from their projects
CREATE POLICY "Users can delete files from their projects"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'project-files' AND
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id::text = (storage.foldername(name))[1]
    AND projects.user_id = auth.uid()
  )
);
