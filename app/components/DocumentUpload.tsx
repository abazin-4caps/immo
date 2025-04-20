'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { FiUpload, FiFile, FiTrash2, FiDownload } from 'react-icons/fi';

interface Document {
  id: string;
  name: string;
  type: string;
  url: string;
  createdAt: Date;
}

interface DocumentUploadProps {
  projectId: string;
  documents: Document[];
  onDocumentAdded?: () => void;
}

export default function DocumentUpload({ projectId, documents, onDocumentAdded }: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploading(true);
    try {
      for (const file of acceptedFiles) {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch(`/api/projects/${projectId}/documents`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }
      }
      onDocumentAdded?.();
    } catch (error) {
      console.error('Error uploading file:', error);
      // TODO: Add error notification
    } finally {
      setUploading(false);
    }
  }, [projectId, onDocumentAdded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true
  });

  const handleDelete = async (documentId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/documents/${documentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Delete failed');
      }

      onDocumentAdded?.();
    } catch (error) {
      console.error('Error deleting document:', error);
      // TODO: Add error notification
    }
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
      >
        <input {...getInputProps()} />
        <FiUpload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          {isDragActive
            ? 'Déposez les fichiers ici...'
            : 'Glissez et déposez des fichiers ici, ou cliquez pour sélectionner'}
        </p>
        {uploading && (
          <p className="mt-2 text-sm text-blue-500">Upload en cours...</p>
        )}
      </div>

      <div className="mt-6 space-y-2">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="flex items-center justify-between p-3 bg-white rounded-lg border"
          >
            <div className="flex items-center space-x-3">
              <FiFile className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                <p className="text-xs text-gray-500">
                  {new Date(doc.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <a
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <FiDownload className="h-5 w-5" />
              </a>
              <button
                onClick={() => handleDelete(doc.id)}
                className="p-2 text-gray-400 hover:text-red-600"
              >
                <FiTrash2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 