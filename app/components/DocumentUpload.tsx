'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FaFilePdf, FaFileImage, FaFile, FaTrash, FaEye } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import Modal from './Modal';

interface Document {
  id: string;
  name: string;
  url: string;
  type: string;
  createdAt: Date;
}

interface DocumentUploadProps {
  projectId: string;
  documents: Document[];
  onDocumentAdded: () => void;
}

export default function DocumentUpload({ projectId, documents, onDocumentAdded }: DocumentUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      acceptedFiles.forEach((file) => {
        formData.append('file', file);
      });

      const response = await fetch(`/api/projects/${projectId}/documents`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Erreur lors du téléchargement des documents');
      }

      await response.json();
      onDocumentAdded();
      toast.success('Documents téléchargés avec succès');
    } catch (err) {
      console.error('Erreur de téléchargement:', err);
      setError('Erreur lors du téléchargement. Veuillez réessayer.');
      toast.error('Erreur lors du téléchargement des documents');
    } finally {
      setIsUploading(false);
    }
  }, [projectId, onDocumentAdded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg'],
    },
  });

  const handleDelete = async (documentId: string) => {
    console.log('Début de la suppression du document:', documentId);
    
    try {
      if (!documentId || !projectId) {
        throw new Error('ID du document ou du projet manquant');
      }

      const response = await fetch(`/api/projects/${projectId}/documents/${documentId}`, {
        method: 'DELETE',
      });

      console.log('Réponse de la suppression:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la suppression');
      }

      onDocumentAdded();
      toast.success('Document supprimé avec succès');
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      toast.error('Erreur lors de la suppression du document. Veuillez réessayer.');
    }
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return <FaFilePdf className="w-6 h-6 text-red-500" />;
    if (type.includes('image')) return <FaFileImage className="w-6 h-6 text-blue-500" />;
    return <FaFile className="w-6 h-6 text-gray-500" />;
  };

  const handlePreview = async (document: Document) => {
    setSelectedDocument(document);
    setIsPreviewOpen(true);

    if (document.type.includes('pdf')) {
      try {
        const response = await fetch(`/api/projects/${projectId}/documents/${document.id}/download`);
        if (!response.ok) {
          throw new Error('Erreur lors du chargement du PDF');
        }
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
      } catch (error) {
        console.error('Erreur lors du chargement du PDF:', error);
        toast.error('Erreur lors du chargement du PDF');
      }
    }
  };

  const handleClosePreview = () => {
    setIsPreviewOpen(false);
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`p-6 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-500'}`}
      >
        <input {...getInputProps()} />
        {isUploading ? (
          <p className="text-gray-600">Téléchargement en cours...</p>
        ) : isDragActive ? (
          <p className="text-blue-500">Déposez les fichiers ici</p>
        ) : (
          <p className="text-gray-600">
            Glissez-déposez des fichiers ici, ou cliquez pour sélectionner
          </p>
        )}
      </div>

      {error && <p className="text-red-500">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-grow min-w-0">
                  {getFileIcon(doc.type)}
                  <span className="text-sm font-medium truncate flex-grow">{doc.name}</span>
                </div>
                <div className="flex space-x-2 ml-2 shrink-0">
                  <button
                    onClick={() => handlePreview(doc)}
                    className="p-1.5 text-gray-600 hover:text-blue-500 transition-colors"
                    title="Prévisualiser"
                  >
                    <FaEye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="p-1.5 text-gray-600 hover:text-red-500 transition-colors"
                    title="Supprimer"
                  >
                    <FaTrash className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                Ajouté le {formatDate(doc.createdAt)}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={isPreviewOpen}
        onClose={handleClosePreview}
        title={selectedDocument?.name || 'Aperçu du document'}
      >
        <div className="max-h-[80vh] overflow-y-auto">
          {selectedDocument && (
            selectedDocument.type.includes('pdf') ? (
              pdfUrl ? (
                <iframe
                  src={pdfUrl}
                  className="w-full h-[80vh] border-0"
                  title={selectedDocument.name}
                />
              ) : (
                <div className="flex justify-center items-center h-[80vh]">
                  <p>Chargement du PDF...</p>
                </div>
              )
            ) : selectedDocument.type.includes('image') ? (
              <div className="flex justify-center">
                <Image
                  src={selectedDocument.url}
                  alt={selectedDocument.name}
                  width={800}
                  height={600}
                  className="object-contain max-h-[70vh]"
                />
              </div>
            ) : (
              <p>Ce type de fichier ne peut pas être prévisualisé</p>
            )
          )}
        </div>
      </Modal>
    </div>
  );
}