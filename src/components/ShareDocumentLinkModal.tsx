'use client';

/**
 * ============================================================
 * MODAL PARA COMPARTIR LINK DE DOCUMENTOS
 * ============================================================
 * Modal para generar links públicos que permiten a candidatos
 * subir documentos específicos sin necesidad de autenticarse.
 * 
 * Características:
 * - Selección de candidato
 * - Selección múltiple de tipos de documentos
 * - Configuración de días de expiración
 * - Mensaje personalizado opcional
 * - Generación de link único y seguro
 * - Copiar link al portapapeles
 */

import React, { useState, useEffect } from 'react';
import { 
  createDocumentShareLink, 
  getCandidates, 
  DocumentShareLinkCreate,
  DocumentShareLink 
} from '@/lib/api';

// ============================================================
// INTERFACES
// ============================================================

interface Candidate {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

interface ShareDocumentLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (link: DocumentShareLink) => void;
  preselectedCandidateId?: number;
}

// ============================================================
// TIPOS DE DOCUMENTOS DISPONIBLES
// ============================================================

const DOCUMENT_TYPES = {
  // Sección 2: Información Personal
  'personal': {
    title: 'Información Personal',
    documents: [
      { type: 'ine_pasaporte', label: 'Identificación oficial (INE o pasaporte)' },
      { type: 'acta_nacimiento', label: 'Acta de nacimiento' },
      { type: 'comprobante_domicilio', label: 'Comprobante de domicilio' },
      { type: 'situacion_fiscal', label: 'Constancia de situación fiscal' },
      { type: 'curp', label: 'CURP' },
      { type: 'nss', label: 'Número de Seguridad Social (NSS)' },
      { type: 'estado_cuenta', label: 'Estado de cuenta bancario' },
      { type: 'cartas_recomendacion', label: 'Cartas de recomendación' },
    ]
  },
  // Sección 3: Información de Grado Académico
  'academico': {
    title: 'Información de Grado Académico',
    documents: [
      { type: 'titulo_profesional', label: 'Título profesional' },
      { type: 'cedula_profesional', label: 'Cédula profesional' },
      { type: 'cv', label: 'Currículum Vitae (CV)' },
      { type: 'cartas_trabajos_anteriores', label: 'Cartas de trabajos anteriores' },
    ]
  }
};

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export default function ShareDocumentLinkModal({
  isOpen,
  onClose,
  onSuccess,
  preselectedCandidateId,
}: ShareDocumentLinkModalProps) {
  // Estados
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form data
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [expirationDays, setExpirationDays] = useState(7);
  const [message, setMessage] = useState('');
  
  // Link generado
  const [generatedLink, setGeneratedLink] = useState<DocumentShareLink | null>(null);
  const [copied, setCopied] = useState(false);

  // ============================================================
  // EFECTOS
  // ============================================================

  useEffect(() => {
    if (isOpen) {
      loadCandidates();
      // Reset form
      setStep(1);
      setError(null);
      setSelectedDocuments([]);
      setExpirationDays(7);
      setMessage('');
      setGeneratedLink(null);
      setCopied(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (preselectedCandidateId && candidates.length > 0) {
      const candidate = candidates.find(c => c.id === preselectedCandidateId);
      if (candidate) {
        setSelectedCandidate(candidate);
        setStep(2);
      }
    }
  }, [preselectedCandidateId, candidates]);

  // ============================================================
  // FUNCIONES
  // ============================================================

  const loadCandidates = async () => {
    setLoadingCandidates(true);
    try {
      const data = await getCandidates();
      setCandidates(data as Candidate[]);
    } catch (err) {
      console.error('Error loading candidates:', err);
      setError('Error al cargar candidatos');
    } finally {
      setLoadingCandidates(false);
    }
  };

  const handleDocumentToggle = (docType: string) => {
    setSelectedDocuments(prev => 
      prev.includes(docType)
        ? prev.filter(d => d !== docType)
        : [...prev, docType]
    );
  };

  const handleSelectAllSection = (sectionKey: string) => {
    const sectionDocs = DOCUMENT_TYPES[sectionKey as keyof typeof DOCUMENT_TYPES].documents.map(d => d.type);
    const allSelected = sectionDocs.every(doc => selectedDocuments.includes(doc));
    
    if (allSelected) {
      setSelectedDocuments(prev => prev.filter(d => !sectionDocs.includes(d)));
    } else {
      setSelectedDocuments(prev => [...new Set([...prev, ...sectionDocs])]);
    }
  };

  const handleCreateLink = async () => {
    console.log('🔵 handleCreateLink called');
    console.log('Selected candidate:', selectedCandidate);
    console.log('Selected documents:', selectedDocuments);
    
    if (!selectedCandidate || selectedDocuments.length === 0) {
      console.error('❌ Validation failed: candidate or documents missing');
      setError('Selecciona al menos un documento');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data: DocumentShareLinkCreate = {
        candidate: selectedCandidate.id,
        requested_document_types: selectedDocuments,
        expiration_days: expirationDays,
        message: message,
      };

      console.log('📤 Sending data to API:', data);
      const link = await createDocumentShareLink(data);
      console.log('✅ Link created successfully:', link);
      console.log('Setting generated link...');
      
      setGeneratedLink(link);
      console.log('Setting step to 3...');
      setStep(3);
      console.log('Calling onSuccess...');
      onSuccess?.(link);
      console.log('✅ All done!');
    } catch (err: any) {
      console.error('❌ Error creating link:', err);
      setError(err.message || 'Error al generar el link');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (generatedLink?.share_url) {
      navigator.clipboard.writeText(generatedLink.share_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenInNewTab = () => {
    if (generatedLink?.share_url) {
      window.open(generatedLink.share_url, '_blank', 'noopener,noreferrer');
    }
  };

  const filteredCandidates = candidates.filter(c => 
    `${c.first_name} ${c.last_name} ${c.email}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ============================================================
  // RENDER
  // ============================================================

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 z-50 transition-opacity"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className="bg-white rounded-xl shadow-2xl max-w-3xl w-full mx-auto transform transition-all max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-teal-50 flex-shrink-0">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-lg bg-emerald-600 flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Compartir Link de Documentos</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {step === 1 && 'Paso 1: Selecciona el candidato'}
                  {step === 2 && 'Paso 2: Selecciona los documentos'}
                  {step === 3 && 'Link generado exitosamente'}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Progress Bar */}
          {step !== 3 && (
            <div className="px-6 pt-4 flex-shrink-0">
              <div className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 1 ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  1
                </div>
                <div className={`flex-1 h-1 mx-2 ${step >= 2 ? 'bg-emerald-600' : 'bg-gray-200'}`}></div>
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 2 ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  2
                </div>
              </div>
            </div>
          )}

          {/* Body */}
          <div className="p-6 overflow-y-auto flex-1">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Step 1: Select Candidate */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Buscar candidato
                  </label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por nombre o email..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                {loadingCandidates ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
                    {filteredCandidates.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        No se encontraron candidatos
                      </div>
                    ) : (
                      filteredCandidates.map((candidate) => (
                        <button
                          key={candidate.id}
                          onClick={() => {
                            setSelectedCandidate(candidate);
                            setStep(2);
                          }}
                          className={`w-full p-4 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors ${
                            selectedCandidate?.id === candidate.id ? 'bg-emerald-50' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900">
                                {candidate.first_name} {candidate.last_name}
                              </p>
                              <p className="text-sm text-gray-500">{candidate.email}</p>
                            </div>
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Select Documents */}
            {step === 2 && selectedCandidate && (
              <div className="space-y-6">
                {/* Selected Candidate Info */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase">Candidato seleccionado</p>
                      <p className="font-semibold text-gray-900">
                        {selectedCandidate.first_name} {selectedCandidate.last_name}
                      </p>
                      <p className="text-sm text-gray-500">{selectedCandidate.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedCandidate(null);
                        setStep(1);
                      }}
                      className="text-sm text-emerald-600 hover:text-emerald-700"
                    >
                      Cambiar
                    </button>
                  </div>
                </div>

                {/* Document Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Documentos a solicitar
                  </label>
                  
                  {Object.entries(DOCUMENT_TYPES).map(([key, section]) => {
                    const sectionDocs = section.documents.map(d => d.type);
                    const selectedInSection = sectionDocs.filter(d => selectedDocuments.includes(d)).length;
                    const allSelected = selectedInSection === sectionDocs.length;
                    
                    return (
                      <div key={key} className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
                          <span className="font-medium text-gray-700">{section.title}</span>
                          <button
                            onClick={() => handleSelectAllSection(key)}
                            className="text-sm text-emerald-600 hover:text-emerald-700"
                          >
                            {allSelected ? 'Deseleccionar todos' : 'Seleccionar todos'}
                          </button>
                        </div>
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                          {section.documents.map((doc) => (
                            <label
                              key={doc.type}
                              className="flex items-center p-2 rounded hover:bg-gray-50 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={selectedDocuments.includes(doc.type)}
                                onChange={() => handleDocumentToggle(doc.type)}
                                className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                              />
                              <span className="ml-3 text-sm text-gray-700">{doc.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Configuration */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Días hasta expiración
                    </label>
                    <select
                      value={expirationDays}
                      onChange={(e) => setExpirationDays(Number(e.target.value))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value={3}>3 días</option>
                      <option value={7}>7 días</option>
                      <option value={14}>14 días</option>
                      <option value={30}>30 días</option>
                      <option value={60}>60 días</option>
                      <option value={90}>90 días</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mensaje para el candidato (opcional)
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Instrucciones adicionales o mensaje personalizado..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Summary */}
                {selectedDocuments.length > 0 && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-emerald-800">
                      {selectedDocuments.length} documento{selectedDocuments.length !== 1 ? 's' : ''} seleccionado{selectedDocuments.length !== 1 ? 's' : ''}
                    </p>
                    <p className="text-sm text-emerald-600 mt-1">
                      El link expirará en {expirationDays} días
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Link Generated */}
            {step === 3 && generatedLink && (
              <div className="space-y-6">
                {/* Success Message */}
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">¡Link generado exitosamente!</h3>
                  <p className="text-gray-600 mt-2">
                    Comparte este link con {generatedLink.candidate_info?.first_name} para que suba sus documentos
                  </p>
                </div>

                {/* Link Box */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Link para compartir
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={generatedLink.share_url}
                      readOnly
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 text-sm"
                    />
                    <button
                      onClick={handleCopy}
                      className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                        copied
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700'
                      }`}
                    >
                      {copied ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={handleOpenInNewTab}
                      className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Details */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-3">Detalles del link</h4>
                  <dl className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <dt className="text-gray-500">Candidato</dt>
                      <dd className="font-medium text-gray-900">{generatedLink.candidate_info?.full_name}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Documentos solicitados</dt>
                      <dd className="font-medium text-gray-900">{generatedLink.requested_document_types.length}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Expira</dt>
                      <dd className="font-medium text-gray-900">
                        {new Date(generatedLink.expires_at).toLocaleDateString('es-MX', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Estado</dt>
                      <dd className="font-medium text-emerald-600">{generatedLink.status_display}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
            {step === 1 && (
              <>
                <button
                  onClick={onClose}
                  className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium"
                >
                  Cancelar
                </button>
                <div></div>
              </>
            )}

            {step === 2 && (
              <>
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium"
                >
                  Atrás
                </button>
                <button
                  onClick={handleCreateLink}
                  disabled={loading || selectedDocuments.length === 0}
                  className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  Generar Link
                </button>
              </>
            )}

            {step === 3 && (
              <>
                <div></div>
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700"
                >
                  Cerrar
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
