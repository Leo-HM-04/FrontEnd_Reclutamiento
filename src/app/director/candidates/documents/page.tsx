'use client';

import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import CandidateDocumentFormModal from '@/components/CandidateDocumentFormModal';
import { 
  faFileAlt,
  faPlus,
  faSearch,
  faFilter,
  faDownload,
  faEye,
  faEdit,
  faTrash,
  faFilePdf,
  faFileWord,
  faFileImage,
  faFileExcel,
  faFile,
  faUser,
  faCalendarAlt,
  faSort,
  faSortUp,
  faSortDown,
  faUpload,
  faTimes,
  faCheckCircle,
  faExclamationTriangle,
  faCloudUploadAlt
} from '@fortawesome/free-solid-svg-icons';

interface Document {
  id: number;
  candidate: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  document_type: string;
  title: string;
  file_name: string;
  file_size: number;
  upload_date: string;
  uploaded_by: {
    id: number;
    first_name: string;
    last_name: string;
  };
  is_verified: boolean;
  notes: string;
}

const DOCUMENT_TYPES = [
  { value: 'cv', label: 'Currículum Vitae', icon: faFileAlt },
  { value: 'cover_letter', label: 'Carta de Presentación', icon: faFileAlt },
  { value: 'portfolio', label: 'Portafolio', icon: faFile },
  { value: 'certificate', label: 'Certificado', icon: faFileAlt },
  { value: 'diploma', label: 'Diploma', icon: faFileAlt },
  { value: 'transcript', label: 'Transcripciones', icon: faFileAlt },
  { value: 'reference', label: 'Referencias', icon: faFileAlt },
  { value: 'other', label: 'Otros', icon: faFile },
];

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [verificationFilter, setVerificationFilter] = useState('');
  const [sortField, setSortField] = useState('upload_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      // Mock data for demonstration
      setDocuments([
        {
          id: 1,
          candidate: {
            id: 1,
            first_name: 'Juan',
            last_name: 'Pérez García',
            email: 'juan.perez@email.com',
          },
          document_type: 'cv',
          title: 'CV - Juan Pérez García',
          file_name: 'CV_Juan_Perez_2024.pdf',
          file_size: 2048000, // 2MB in bytes
          upload_date: '2024-11-01T10:00:00Z',
          uploaded_by: {
            id: 1,
            first_name: 'Admin',
            last_name: 'Sistema',
          },
          is_verified: true,
          notes: 'CV actualizado con experiencia reciente',
        },
        {
          id: 2,
          candidate: {
            id: 2,
            first_name: 'María',
            last_name: 'González López',
            email: 'maria.gonzalez@email.com',
          },
          document_type: 'certificate',
          title: 'Certificado PMP',
          file_name: 'Certificado_PMP_Maria_Gonzalez.pdf',
          file_size: 1536000, // 1.5MB in bytes
          upload_date: '2024-11-02T14:30:00Z',
          uploaded_by: {
            id: 2,
            first_name: 'María',
            last_name: 'González',
          },
          is_verified: false,
          notes: 'Pendiente de verificación',
        },
      ]);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return faFilePdf;
      case 'doc':
      case 'docx':
        return faFileWord;
      case 'xls':
      case 'xlsx':
        return faFileExcel;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return faFileImage;
      default:
        return faFile;
    }
  };

  const getFileIconColor = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'text-red-600';
      case 'doc':
      case 'docx':
        return 'text-blue-600';
      case 'xls':
      case 'xlsx':
        return 'text-green-600';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDocumentTypeLabel = (type: string) => {
    return DOCUMENT_TYPES.find(t => t.value === type)?.label || type;
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = searchTerm === '' || 
      `${doc.candidate.first_name} ${doc.candidate.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.file_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === '' || doc.document_type === typeFilter;
    
    const matchesVerification = verificationFilter === '' || 
      (verificationFilter === 'verified' && doc.is_verified) ||
      (verificationFilter === 'unverified' && !doc.is_verified);
    
    return matchesSearch && matchesType && matchesVerification;
  });

  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    let aValue: any = a[sortField as keyof Document];
    let bValue: any = b[sortField as keyof Document];
    
    // Handle nested properties
    if (sortField === 'candidate_name') {
      aValue = `${a.candidate.first_name} ${a.candidate.last_name}`.toLowerCase();
      bValue = `${b.candidate.first_name} ${b.candidate.last_name}`.toLowerCase();
    } else if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return faSort;
    return sortDirection === 'asc' ? faSortUp : faSortDown;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    // Handle file upload logic here
    console.log('Files dropped:', files);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Action Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-end">
          <button
            onClick={() => setShowUploadModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center transition-colors"
          >
            <FontAwesomeIcon icon={faUpload} className="mr-2" />
            Subir Documento
          </button>
        </div>

        {/* Drag and Drop Upload Area */}
        <div 
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors mb-6 ${
            dragOver 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <FontAwesomeIcon 
            icon={faCloudUploadAlt} 
            className={`text-4xl mb-4 ${dragOver ? 'text-blue-500' : 'text-gray-400'}`} 
          />
          <p className={`text-lg font-medium ${dragOver ? 'text-blue-700' : 'text-gray-700'}`}>
            {dragOver ? 'Suelta los archivos aquí' : 'Arrastra y suelta archivos aquí para subirlos'}
          </p>
          <p className="text-gray-500 mt-2">
            o haz clic en "Subir Documento" para seleccionar archivos
          </p>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar documentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Type Filter */}
            <div className="relative">
              <FontAwesomeIcon icon={faFilter} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                <option value="">Todos los tipos</option>
                {DOCUMENT_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Verification Filter */}
            <div className="relative">
              <select
                value={verificationFilter}
                onChange={(e) => setVerificationFilter(e.target.value)}
                className="pl-4 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                <option value="">Todos los estados</option>
                <option value="verified">Verificados</option>
                <option value="unverified">Sin verificar</option>
              </select>
            </div>

            {/* Results Count */}
            <div className="flex items-center justify-end">
              <span className="text-gray-600">
                {sortedDocuments.length} de {documents.length} documentos
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando documentos...</p>
          </div>
        ) : sortedDocuments.length === 0 ? (
          <div className="p-8 text-center">
            <FontAwesomeIcon icon={faFileAlt} className="text-6xl text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron documentos</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || typeFilter || verificationFilter ? 'Intenta ajustar los filtros de búsqueda.' : 'No hay documentos cargados.'}
            </p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
            >
              Subir primer documento
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Archivo
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('candidate_name')}
                  >
                    <div className="flex items-center">
                      Candidato
                      <FontAwesomeIcon icon={getSortIcon('candidate_name')} className="ml-1 text-gray-400" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('document_type')}
                  >
                    <div className="flex items-center">
                      Tipo
                      <FontAwesomeIcon icon={getSortIcon('document_type')} className="ml-1 text-gray-400" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tamaño
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('upload_date')}
                  >
                    <div className="flex items-center">
                      Fecha de Carga
                      <FontAwesomeIcon icon={getSortIcon('upload_date')} className="ml-1 text-gray-400" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedDocuments.map((document) => (
                  <tr key={document.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FontAwesomeIcon 
                          icon={getFileIcon(document.file_name)} 
                          className={`text-2xl mr-3 ${getFileIconColor(document.file_name)}`} 
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{document.title}</div>
                          <div className="text-sm text-gray-500">{document.file_name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-linear-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                          {document.candidate.first_name.charAt(0)}{document.candidate.last_name.charAt(0)}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {document.candidate.first_name} {document.candidate.last_name}
                          </div>
                          <div className="text-sm text-gray-500">{document.candidate.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                        {getDocumentTypeLabel(document.document_type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatFileSize(document.file_size)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <FontAwesomeIcon icon={faCalendarAlt} className="mr-2 text-gray-400" />
                        {formatDate(document.upload_date)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {document.is_verified ? (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            <FontAwesomeIcon icon={faCheckCircle} className="mr-1" />
                            Verificado
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            <FontAwesomeIcon icon={faExclamationTriangle} className="mr-1" />
                            Pendiente
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          title="Ver documento"
                        >
                          <FontAwesomeIcon icon={faEye} />
                        </button>
                        <button
                          className="text-green-600 hover:text-green-900 p-1 rounded"
                          title="Descargar"
                        >
                          <FontAwesomeIcon icon={faDownload} />
                        </button>
                        <button
                          className="text-orange-600 hover:text-orange-900 p-1 rounded"
                          title="Editar"
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button
                          className="text-red-600 hover:text-red-900 p-1 rounded"
                          title="Eliminar"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Formulario de Documento */}
      <CandidateDocumentFormModal 
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={(message) => {
          alert(message);
          fetchDocuments(); // Recargar documentos después de subir
        }}
      />
    </div>
  );
}