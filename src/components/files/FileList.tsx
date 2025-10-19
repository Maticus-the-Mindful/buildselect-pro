import { useState, useEffect } from 'react';
import { FileText, Image as ImageIcon, Download, Trash2, Box, Boxes, Cuboid } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';
import { BlueprintAnalysisButton } from './BlueprintAnalysisButton';

type ProjectFile = Database['public']['Tables']['project_files']['Row'];

interface FileListProps {
  projectId: string;
  onFileDeleted: () => void;
}

export function FileList({ projectId, onFileDeleted }: FileListProps) {
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFiles();
  }, [projectId]);

  const loadFiles = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('project_files')
      .select('*')
      .eq('project_id', projectId)
      .order('uploaded_at', { ascending: false });

    if (data) setFiles(data);
    setLoading(false);
  };

  const handleDelete = async (fileId: string, fileUrl: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    const fileName = fileUrl.split('/').pop();
    if (fileName) {
      await supabase.storage.from('project-files').remove([fileName]);
    }

    await supabase.from('project_files').delete().eq('id', fileId);

    loadFiles();
    onFileDeleted();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'pdf':
        return <FileText className="w-10 h-10 text-red-500" />;
      case 'image':
        return <ImageIcon className="w-10 h-10 text-blue-500" />;
      case 'dwg':
      case 'dxf':
        return <Box className="w-10 h-10 text-orange-500" />;
      case 'dwf':
        return <FileText className="w-10 h-10 text-purple-500" />;
      case 'rvt':
        return <Cuboid className="w-10 h-10 text-green-500" />;
      case 'ifc':
        return <Boxes className="w-10 h-10 text-teal-500" />;
      default:
        return <FileText className="w-10 h-10 text-gray-500" />;
    }
  };

  const getFileTypeName = (fileType: string): string => {
    switch (fileType) {
      case 'dwg':
        return 'AutoCAD Drawing';
      case 'dxf':
        return 'Drawing Exchange';
      case 'dwf':
        return 'Design Web Format';
      case 'rvt':
        return 'Revit BIM';
      case 'ifc':
        return 'BIM Standard';
      case 'pdf':
        return 'PDF Document';
      case 'image':
        return 'Image';
      default:
        return fileType.toUpperCase();
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        <p className="text-sm text-gray-600">Loading files...</p>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="text-center py-8 text-gray-600">
        No files uploaded yet
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {files.map((file) => (
        <div
          key={file.id}
          className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div className="flex-shrink-0">
            {getFileIcon(file.file_type)}
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-gray-900 truncate">
              {file.file_name}
            </h4>
            <p className="text-xs text-gray-500">
              {getFileTypeName(file.file_type)} • {formatFileSize(file.file_size)} • Uploaded {new Date(file.uploaded_at).toLocaleDateString()}
            </p>
            <div className="mt-2">
              <BlueprintAnalysisButton file={file} />
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <a
              href={file.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Download"
            >
              <Download className="w-5 h-5" />
            </a>
            <button
              onClick={() => handleDelete(file.id, file.file_url)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
