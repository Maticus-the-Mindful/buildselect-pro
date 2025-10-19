/*
  # Catalog Storage Bucket

  Creates the storage bucket for catalog file uploads (CSV, XLSX files).
*/

-- Create storage bucket for catalog files
INSERT INTO storage.buckets (id, name, public)
VALUES ('catalog-files', 'catalog-files', false);

-- Allow authenticated users to upload their own files
CREATE POLICY "Users can upload own catalog files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'catalog-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to read their own files
CREATE POLICY "Users can read own catalog files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'catalog-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to update their own files
CREATE POLICY "Users can update own catalog files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'catalog-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to delete their own files
CREATE POLICY "Users can delete own catalog files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'catalog-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
