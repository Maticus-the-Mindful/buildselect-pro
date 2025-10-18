import { useState, useRef } from 'react';
import { Upload, File } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface FileUploadProps {
  projectId: string;
  onUploadComplete: () => void;
}

interface UploadingFile {
  name: string;
  progress: number;
  error?: string;
}

export function FileUpload({ projectId, onUploadComplete }: FileUploadProps) {
  const [, setUploading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const fileArray = Array.from(files);

    setUploadingFiles(fileArray.map(f => ({ name: f.name, progress: 0 })));

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];

      try {
        const fileName = `${projectId}/${Date.now()}-${file.name}`;
        const fileType = file.type.startsWith('image/') ? 'image' : 'pdf';

        setUploadingFiles(prev =>
          prev.map((f, idx) => idx === i ? { ...f, progress: 50 } : f)
        );

        const { error: uploadError } = await supabase.storage
          .from('project-files')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('project-files')
          .getPublicUrl(fileName);

        await supabase.from('project_files').insert({
          project_id: projectId,
          file_name: file.name,
          file_type: fileType,
          file_url: publicUrl,
          file_size: file.size
        } as any);

        setUploadingFiles(prev =>
          prev.map((f, idx) => idx === i ? { ...f, progress: 100 } : f)
        );
      } catch (error: any) {
        setUploadingFiles(prev =>
          prev.map((f, idx) => idx === i ? { ...f, error: error.message } : f)
        );
      }
    }

    setTimeout(() => {
      setUploading(false);
      setUploadingFiles([]);
      onUploadComplete();
      if (fileInputRef.current) fileInputRef.current.value = '';
    }, 1000);
  };

  return (
    <div className="space-y-4">
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-400 transition-colors cursor-pointer"
      >
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Plans & Files</h3>
        <p className="text-sm text-gray-600 mb-4">
          Click to browse or drag and drop PDF plans and images
        </p>
        <p className="text-xs text-gray-500">Supports: PDF, JPG, PNG (Max 10MB per file)</p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          {uploadingFiles.map((file, idx) => (
            <div key={idx} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <File className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-900">{file.name}</span>
                </div>
                {file.error && (
                  <span className="text-xs text-red-600">{file.error}</span>
                )}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    file.error ? 'bg-red-500' : 'bg-blue-600'
                  }`}
                  style={{ width: `${file.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
