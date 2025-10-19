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
  const [uploading, setUploading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileType = (file: File): string => {
    const extension = file.name.split('.').pop()?.toLowerCase();

    switch (extension) {
      case 'dwg':
        return 'dwg';
      case 'dxf':
        return 'dxf';
      case 'dwf':
        return 'dwf';
      case 'rvt':
        return 'rvt';
      case 'ifc':
        return 'ifc';
      case 'pdf':
        return 'pdf';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'bmp':
        return 'image';
      default:
        return 'pdf'; // Default fallback
    }
  };

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
        const fileType = getFileType(file);

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
          file_size: file.size,
          page_type: null,
          processing_status: 'pending',
          ai_analysis_json: null,
        });

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
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer"
      >
        <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
        <h3 className="text-base font-medium text-gray-900 mb-2">Upload Files</h3>
        <p className="text-xs text-gray-600 mb-3">
          Click to browse or drag and drop files
        </p>
        <p className="text-xs text-gray-500">
          PDF, DWG, DXF, DWF, RVT, IFC, JPG, PNG
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.dwg,.dxf,.dwf,.rvt,.ifc,.jpg,.jpeg,.png,.gif,.bmp"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          {uploadingFiles.map((file, idx) => (
            <div key={idx} className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <File className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <span className="text-xs font-medium text-gray-900 truncate">{file.name}</span>
              </div>
              {file.error && (
                <p className="text-xs text-red-600 mb-2">{file.error}</p>
              )}
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all ${
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
