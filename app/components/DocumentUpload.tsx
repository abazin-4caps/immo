'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { FiUpload, FiFile, FiTrash2, FiDownload, FiEye } from 'react-icons/fi';

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
  const [error, setError] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploading(true);
    setError(null);
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
      setError('Erreur lors de l\'upload du fichier. Veuillez réessayer.');
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
      setError(null);
      console.log('Starting deletion process for document:', documentId);
      
      if (!documentId) {
        throw new Error('Document ID is missing');
      }

      if (!projectId) {
        throw new Error('Project ID is missing');
      }

      const url = `/api/projects/${projectId}/documents/${documentId}`;
      console.log('Sending DELETE request to:', url);
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);
      console.log('Response status text:', response.statusText);

      // Si le statut est 204, c'est un succès sans contenu
      if (response.status === 204) {
        console.log('Document successfully deleted');
        onDocumentAdded?.();
        return;
      }

      // Pour tous les autres cas, on essaie de lire la réponse
      let errorMessage = 'Erreur lors de la suppression du document.';
      
      const text = await response.text();
      console.log('Response text:', text);

      if (text) {
        try {
          const json = JSON.parse(text);
          console.log('Parsed JSON response:', json);
          if (json.error) {
            errorMessage = json.error;
          }
        } catch (e) {
          console.log('Failed to parse JSON response:', e);
          errorMessage = text;
        }
      }

      if (!response.ok) {
        throw new Error(errorMessage);
      }

      onDocumentAdded?.();
    } catch (error) {
      console.error('Error in handleDelete:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors de la suppression du document. Veuillez réessayer.');
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return '🖼️';
    if (type.startsWith('application/pdf')) return '📄';
    if (type.startsWith('application/msword') || type.includes('document')) return '📝';
    if (type.startsWith('application/vnd.ms-excel') || type.includes('spreadsheet')) return '📊';
    return '📎';
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

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Erreur</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 space-y-2">
        {documents.length === 0 ? (
          <p className="text-center text-gray-500 text-sm">Aucun document uploadé</p>
        ) : (
          documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-3 bg-white rounded-lg border hover:shadow-md transition-shadow"
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl" role="img" aria-label="file type">
                  {getFileIcon(doc.type)}
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(doc.createdAt).toLocaleDateString()} - {doc.type}
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                  title="Voir le document"
                >
                  <FiEye className="h-5 w-5" />
                </a>
                <a
                  href={doc.url}
                  download
                  className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                  title="Télécharger"
                >
                  <FiDownload className="h-5 w-5" />
                </a>
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  title="Supprimer"
                >
                  <FiTrash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full">
            <div className="p-4">
              <h3 className="text-lg font-medium">{selectedDocument.name}</h3>
              {selectedDocument.type.startsWith('image/') ? (
                <img src={selectedDocument.url} alt={selectedDocument.name} className="max-h-[80vh] object-contain mx-auto" />
              ) : (
                <iframe src={selectedDocument.url} className="w-full h-[80vh]" />
              )}
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
              <button
                type="button"
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={() => setSelectedDocument(null)}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 