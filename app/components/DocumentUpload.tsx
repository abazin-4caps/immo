'use client';

import { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { FiUpload, FiFile, FiTrash2, FiDownload, FiEye, FiGrid, FiList, FiFilter, FiSearch } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { Document as PDFDocument, Page as PDFPage, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Configuration de worker pour react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

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

type ViewMode = 'grid' | 'list';
type SortField = 'name' | 'date' | 'type';
type SortOrder = 'asc' | 'desc';

export default function DocumentUpload({ projectId, documents, onDocumentAdded }: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);

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
      
      if (!documentId || !projectId) {
        const error = !documentId ? 'Document ID is missing' : 'Project ID is missing';
        console.error(error);
        setError(error);
        return;
      }

      const response = await fetch('/api/delete-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ documentId, projectId }),
      });

      console.log('Response status:', response.status);
      console.log('Response status text:', response.statusText);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      let responseData;
      const text = await response.text();
      console.log('Raw response text:', text);

      try {
        responseData = text ? JSON.parse(text) : null;
        console.log('Parsed response data:', responseData);
      } catch (e) {
        console.error('Error parsing response:', e);
        throw new Error('Erreur lors de la lecture de la réponse du serveur');
      }

      if (!response.ok) {
        const errorMessage = responseData?.error || 'Erreur lors de la suppression du document';
        throw new Error(errorMessage);
      }

      console.log('Document successfully deleted');
      onDocumentAdded?.();
    } catch (error) {
      console.error('Error in handleDelete:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors de la suppression du document. Veuillez réessayer.');
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      setError(null);
      const response = await fetch(`/api/projects/${projectId}/documents/${doc.id}/download`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Erreur lors du téléchargement');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
      setError('Erreur lors du téléchargement du fichier. Veuillez réessayer.');
    }
  };

  const sortedAndFilteredDocuments = documents
    .filter(doc => {
      if (selectedType !== 'all' && !doc.type.includes(selectedType)) return false;
      if (searchTerm && !doc.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortField === 'name') {
        return sortOrder === 'asc' 
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      }
      if (sortField === 'date') {
        return sortOrder === 'asc'
          ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortField === 'type') {
        return sortOrder === 'asc'
          ? a.type.localeCompare(b.type)
          : b.type.localeCompare(a.type);
      }
      return 0;
    });

  const uniqueTypes = ['all', ...Array.from(new Set(documents.map(doc => {
    if (doc.type.startsWith('image/')) return 'image';
    if (doc.type.includes('pdf')) return 'pdf';
    if (doc.type.includes('document')) return 'document';
    if (doc.type.includes('spreadsheet')) return 'spreadsheet';
    return 'other';
  })))];

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return '🖼️';
    if (type.startsWith('application/pdf')) return '📄';
    if (type.startsWith('application/msword') || type.includes('document')) return '📝';
    if (type.startsWith('application/vnd.ms-excel') || type.includes('spreadsheet')) return '📊';
    return '📎';
  };

  const getFileTypeLabel = (type: string) => {
    if (type.startsWith('image/')) return 'Image';
    if (type.includes('pdf')) return 'PDF';
    if (type.includes('document')) return 'Document';
    if (type.includes('spreadsheet')) return 'Tableur';
    return 'Autre';
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200
          ${isDragActive ? 'border-blue-500 bg-blue-50 scale-102' : 'border-gray-300 hover:border-gray-400'}`}
      >
        <input {...getInputProps()} />
        <motion.div
          initial={{ scale: 1 }}
          animate={{ scale: isDragActive ? 1.05 : 1 }}
          transition={{ duration: 0.2 }}
        >
          <FiUpload className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">
            {isDragActive
              ? 'Déposez les fichiers ici...'
              : 'Glissez et déposez des fichiers ici, ou cliquez pour sélectionner'}
          </p>
          {uploading && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-2 text-sm text-blue-500"
            >
              Upload en cours...
            </motion.p>
          )}
        </motion.div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-md bg-red-50 p-4"
          >
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Erreur</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-wrap gap-4 items-center justify-between bg-white p-4 rounded-lg shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {uniqueTypes.map(type => (
              <option key={type} value={type}>
                {type === 'all' ? 'Tous les types' : getFileTypeLabel(type)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={`${sortField}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-') as [SortField, SortOrder];
              setSortField(field);
              setSortOrder(order);
            }}
            className="border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="date-desc">Plus récent</option>
            <option value="date-asc">Plus ancien</option>
            <option value="name-asc">Nom A-Z</option>
            <option value="name-desc">Nom Z-A</option>
            <option value="type-asc">Type A-Z</option>
            <option value="type-desc">Type Z-A</option>
          </select>
          <div className="flex items-center space-x-2 border rounded-md p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-gray-100' : ''}`}
              title="Vue grille"
            >
              <FiGrid className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-gray-100' : ''}`}
              title="Vue liste"
            >
              <FiList className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className={`mt-6 ${viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-2'}`}>
        {sortedAndFilteredDocuments.length === 0 ? (
          <p className="text-center text-gray-500 text-sm col-span-full">Aucun document trouvé</p>
        ) : (
          <AnimatePresence>
            {sortedAndFilteredDocuments.map((doc) => (
              <motion.div
                key={doc.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={`
                  ${viewMode === 'grid'
                    ? 'flex flex-col p-4 bg-white rounded-lg border hover:shadow-lg transition-shadow'
                    : 'flex items-center justify-between p-3 bg-white rounded-lg border hover:shadow-md transition-shadow'}
                `}
              >
                <div className={`flex items-center ${viewMode === 'grid' ? 'flex-col text-center mb-4' : 'space-x-3'}`}>
                  <span className="text-2xl mb-2" role="img" aria-label="file type">
                    {getFileIcon(doc.type)}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(doc.createdAt).toLocaleDateString()} - {getFileTypeLabel(doc.type)}
                    </p>
                  </div>
                </div>
                <div className={`flex ${viewMode === 'grid' ? 'justify-center space-x-4' : 'space-x-2'}`}>
                  <button
                    onClick={() => setSelectedDocument(doc)}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Voir le document"
                  >
                    <FiEye className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDownload(doc)}
                    className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                    title="Télécharger"
                  >
                    <FiDownload className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    title="Supprimer"
                  >
                    <FiTrash2 className="h-5 w-5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      <AnimatePresence>
        {selectedDocument && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={(e: React.MouseEvent<HTMLDivElement>) => {
              if (e.target === e.currentTarget) setSelectedDocument(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-lg max-w-4xl w-full overflow-hidden"
            >
              <div className="flex justify-between items-center p-4 border-b">
                <h3 className="text-lg font-medium">{selectedDocument.name}</h3>
                <button
                  onClick={() => setSelectedDocument(null)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <span className="sr-only">Fermer</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-4">
                {selectedDocument.type.startsWith('image/') ? (
                  <img
                    src={selectedDocument.url}
                    alt={selectedDocument.name}
                    className="max-h-[70vh] object-contain mx-auto"
                    loading="lazy"
                  />
                ) : selectedDocument.type.includes('pdf') ? (
                  <div className="flex flex-col items-center justify-center min-h-[70vh] bg-gray-50 relative">
                    {isLoadingPdf && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-90">
                        <div className="text-blue-600">Chargement du PDF...</div>
                      </div>
                    )}
                    {pdfError ? (
                      <div className="flex flex-col items-center justify-center">
                        <div className="text-6xl mb-4">📄</div>
                        <p className="text-lg text-gray-600 mb-4">{selectedDocument.name}</p>
                        <p className="text-sm text-red-500 mb-6">Erreur lors du chargement du PDF</p>
                        <button
                          onClick={() => handleDownload(selectedDocument)}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <FiDownload className="mr-2 h-5 w-5" />
                          Télécharger le PDF
                        </button>
                      </div>
                    ) : (
                      <div className="w-full max-w-4xl mx-auto">
                        <PDFDocument
                          file={selectedDocument.url}
                          onLoadSuccess={({ numPages }) => {
                            setNumPages(numPages);
                            setIsLoadingPdf(false);
                          }}
                          onLoadError={(error) => {
                            console.error('Error loading PDF:', error);
                            setPdfError(error.message);
                            setIsLoadingPdf(false);
                          }}
                          loading={() => {
                            setIsLoadingPdf(true);
                            return <div>Chargement...</div>;
                          }}
                        >
                          <PDFPage
                            pageNumber={pageNumber}
                            renderTextLayer={true}
                            renderAnnotationLayer={true}
                            className="mx-auto"
                          />
                        </PDFDocument>
                        {numPages && numPages > 1 && (
                          <div className="flex items-center justify-center mt-4 space-x-4">
                            <button
                              onClick={() => setPageNumber(page => Math.max(1, page - 1))}
                              disabled={pageNumber <= 1}
                              className="px-3 py-1 bg-gray-100 rounded-md disabled:opacity-50"
                            >
                              Précédent
                            </button>
                            <span className="text-sm text-gray-600">
                              Page {pageNumber} sur {numPages}
                            </span>
                            <button
                              onClick={() => setPageNumber(page => Math.min(numPages, page + 1))}
                              disabled={pageNumber >= numPages}
                              className="px-3 py-1 bg-gray-100 rounded-md disabled:opacity-50"
                            >
                              Suivant
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[70vh] bg-gray-50">
                    <div className="text-6xl mb-4">{getFileIcon(selectedDocument.type)}</div>
                    <p className="text-lg text-gray-600 mb-4">{selectedDocument.name}</p>
                    <p className="text-sm text-gray-500 mb-6">La prévisualisation n'est pas disponible pour ce type de fichier</p>
                    <button
                      onClick={() => handleDownload(selectedDocument)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <FiDownload className="mr-2 h-5 w-5" />
                      Télécharger le fichier
                    </button>
                  </div>
                )}
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={() => handleDownload(selectedDocument)}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Télécharger
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setSelectedDocument(null)}
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 