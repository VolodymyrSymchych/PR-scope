'use client';

import { useState, useCallback } from 'react';
import { Upload, X, File as FileIcon } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

interface FileUploaderProps {
  projectId?: number;
  taskId?: number;
  onUploadSuccess?: () => void;
  maxSize?: number; // in bytes
  accept?: Record<string, string[]>;
}

export function FileUploader({
  projectId,
  taskId,
  onUploadSuccess,
  maxSize = 10 * 1024 * 1024, // 10MB default
  accept,
}: FileUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      setUploading(true);
      setError(null);

      try {
        for (const file of acceptedFiles) {
          if (file.size > maxSize) {
            throw new Error(`File ${file.name} exceeds maximum size of ${maxSize / 1024 / 1024}MB`);
          }

          const formData = new FormData();
          formData.append('file', file);
          if (projectId) {
            formData.append('projectId', projectId.toString());
          }
          if (taskId) {
            formData.append('taskId', taskId.toString());
          }

          await axios.post('/api/files', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
        }

        onUploadSuccess?.();
      } catch (err: any) {
        setError(err.response?.data?.error || err.message || 'Failed to upload file');
      } finally {
        setUploading(false);
      }
    },
    [projectId, taskId, maxSize, onUploadSuccess]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize,
    accept,
    disabled: uploading,
  });

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-2">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-xl p-6 cursor-pointer transition-colors
          ${isDragActive ? 'border-primary bg-primary/10' : 'border-white/20 hover:border-white/30'}
          ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center space-y-2">
          <Upload className={`w-8 h-8 ${isDragActive ? 'text-primary' : 'text-text-tertiary'}`} />
          <p className="text-sm text-text-secondary text-center">
            {isDragActive
              ? 'Drop files here'
              : 'Drag & drop files here, or click to select'}
          </p>
          <p className="text-xs text-text-tertiary">
            Max file size: {formatFileSize(maxSize)}
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {uploading && (
        <div className="flex items-center justify-center space-x-2 text-sm text-text-secondary">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          <span>Uploading...</span>
        </div>
      )}
    </div>
  );
}

