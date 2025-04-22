'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { FaFilePdf, FaImage, FaFile, FaTrash, FaDownload, FaEye } from 'react-icons/fa';
import { Document as PDFDocument, Page, pdfjs } from 'react-pdf';
import Modal from './Modal';
import { cn } from '../../lib/utils';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Configuration du worker PDF.js avec le fichier local
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

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
  onUpload: (files: File[]) => Promise<void>;
  onDelete: (documentId: string) => Promise<void>;
}

export default function DocumentUpload({
  projectId,
  documents,
  onUpload,
  onDelete,
}: DocumentUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortField, setSortField] = useState<'name' | 'createdAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFileTypes, setSelectedFileTypes] = useState<string[]>([]);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setError(null);
      setIsUploading(true);
      try {
        await onUpload(acceptedFiles);
      } catch (err) {
        setError('Une erreur est survenue lors du téléchargement');
        console.error('Upload error:', err);
      } finally {
        setIsUploading(false);
      }
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
    },
  });

  const handleDelete = async (documentId: string) => {
    try {
      await onDelete(documentId);
    } catch (err) {
      setError('Une erreur est survenue lors de la suppression');
      console.error('Delete error:', err);
    }
  };

  const handlePreview = (document: Document) => {
    setSelectedDocument(document);
    setIsPreviewOpen(true);
    setPageNumber(1); // Reset to first page when opening new document
  };

  const handleDownload = async (document: Document) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/documents/${document.id}/download`);
      if (!response.ok) throw new Error('Erreur lors du téléchargement');
      
      // Get the blob from the response
      const blob = await response.blob();
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link element and trigger download
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document.name;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      
      // Clean up the URL
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      setError('Une erreur est survenue lors du téléchargement');
    }
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const filteredAndSortedDocuments = documents
    .filter((doc) => {
      const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = selectedFileTypes.length === 0 || selectedFileTypes.includes(doc.type);
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      const aValue = sortField === 'name' ? a.name : a.createdAt.getTime();
      const bValue = sortField === 'name' ? b.name : b.createdAt.getTime();
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      return sortOrder === 'asc' 
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    });

  const uniqueFileTypes = Array.from(new Set(documents.map((doc) => doc.type)));

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'application/pdf':
        return <FaFilePdf className="w-8 h-8 text-red-500" />;
      case 'image/jpeg':
      case 'image/png':
      case 'image/gif':
        return <FaImage className="w-8 h-8 text-blue-500" />;
      default:
        return <FaFile className="w-8 h-8 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        )}
      >
        <input {...getInputProps()} />
        {isUploading ? (
          <p className="text-gray-600">Téléchargement en cours...</p>
        ) : isDragActive ? (
          <p className="text-blue-500">Déposez les fichiers ici...</p>
        ) : (
          <p className="text-gray-600">
            Glissez et déposez des fichiers ici, ou cliquez pour sélectionner
          </p>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Rechercher..."
            className="border rounded px-3 py-1"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value as 'name' | 'createdAt')}
            className="border rounded px-3 py-1"
          >
            <option value="createdAt">Date</option>
            <option value="name">Nom</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="border rounded px-3 py-1"
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
        <div className="flex gap-2">
          {uniqueFileTypes.map((type) => (
            <label key={type} className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={selectedFileTypes.includes(type)}
                onChange={(e) => {
                  setSelectedFileTypes(
                    e.target.checked
                      ? [...selectedFileTypes, type]
                      : selectedFileTypes.filter((t) => t !== type)
                  );
                }}
              />
              {type}
            </label>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              'px-3 py-1 rounded',
              viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            )}
          >
            Grille
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              'px-3 py-1 rounded',
              viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            )}
          >
            Liste
          </button>
        </div>
      </div>

      <div
        className={cn(
          viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
            : 'space-y-2'
        )}
      >
        {filteredAndSortedDocuments.map((document) => (
          <div
            key={document.id}
            className={cn(
              'border rounded-lg p-4 flex',
              viewMode === 'grid' ? 'flex-col items-center' : 'items-center justify-between'
            )}
          >
            <div className={cn('flex items-center gap-2', viewMode === 'grid' ? 'flex-col' : '')}>
              {getFileIcon(document.type)}
              <span className="font-medium">{document.name}</span>
            </div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => handlePreview(document)}
                className="text-blue-500 hover:text-blue-700"
                title="Prévisualiser"
              >
                <FaEye />
              </button>
              <button
                onClick={() => handleDownload(document)}
                className="text-green-500 hover:text-green-700"
                title="Télécharger"
              >
                <FaDownload />
              </button>
              <button
                onClick={() => handleDelete(document.id)}
                className="text-red-500 hover:text-red-700"
                title="Supprimer"
              >
                <FaTrash />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={isPreviewOpen}
        onClose={() => {
          setIsPreviewOpen(false);
          setSelectedDocument(null);
        }}
        title={selectedDocument?.name || ''}
      >
        <div className="max-h-[80vh] overflow-y-auto">
          {selectedDocument?.type === 'application/pdf' ? (
            <div>
              <PDFDocument
                file={selectedDocument.url}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={(error) => {
                  console.error('Error loading PDF:', error);
                  setError('Erreur lors du chargement du PDF');
                }}
              >
                <Page 
                  pageNumber={pageNumber}
                  width={Math.min(window.innerWidth * 0.8, 800)}
                />
              </PDFDocument>
              {numPages && numPages > 1 && (
                <div className="flex justify-center gap-4 mt-4">
                  <button
                    onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
                    disabled={pageNumber <= 1}
                    className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
                  >
                    Précédent
                  </button>
                  <span className="self-center">
                    Page {pageNumber} sur {numPages}
                  </span>
                  <button
                    onClick={() => setPageNumber(Math.min(numPages, pageNumber + 1))}
                    disabled={pageNumber >= numPages}
                    className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
                  >
                    Suivant
                  </button>
                </div>
              )}
            </div>
          ) : selectedDocument?.type.startsWith('image/') ? (
            <img
              src={selectedDocument.url}
              alt={selectedDocument.name}
              className="max-w-full h-auto"
            />
          ) : (
            <div className="text-center py-8">
              <p>Aperçu non disponible pour ce type de fichier</p>
              <button
                onClick={() => selectedDocument && handleDownload(selectedDocument)}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
              >
                Télécharger le fichier
              </button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}