'use client';

/**
 * ============================================================
 * PÁGINA PÚBLICA PARA SUBIR DOCUMENTOS
 * ============================================================
 * Página accesible sin autenticación donde los candidatos
 * pueden subir los documentos solicitados a través de un link.
 * 
 * Características:
 * - Acceso mediante token único
 * - Lista de documentos pendientes
 * - Subida con validación OCR
 * - Progreso visual
 * - Redirect a bausen.mx al completar
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  getPublicDocumentShareLink, 
  uploadPublicDocument,
  PublicDocumentShareLink 
} from '@/lib/api';
import { useDocumentValidation } from '@/lib/useDocumentValidation';
import DocumentValidationResult from '@/components/DocumentValidationResult';

// ============================================================
// INTERFACES
// ============================================================

interface UploadingDocument {
  type: string;
  label: string;
  file: File | null;
  status: 'pending' | 'validating' | 'uploading' | 'success' | 'error';
  error?: string;
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export default function PublicDocumentUploadPage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string;

  // Estados principales
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [linkData, setLinkData] = useState<PublicDocumentShareLink | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(5);

  // Estados de subida
  const [selectedDocType, setSelectedDocType] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // Hook de validación OCR
  const {
    validationResult,
    isValidating,
    validateDocument,
    resetValidation,
  } = useDocumentValidation();

  // ============================================================
  // CARGAR DATOS DEL LINK
  // ============================================================

  const loadLinkData = useCallback(async () => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await getPublicDocumentShareLink(token);
      setLinkData(data);
      
      // Verificar si ya está completo
      if (data.pending_documents.length === 0) {
        setIsComplete(true);
      }
    } catch (err: any) {
      setError(err.message || 'Link no válido o expirado');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadLinkData();
  }, [loadLinkData]);

  // ============================================================
  // REDIRECT COUNTDOWN
  // ============================================================

  useEffect(() => {
    if (isComplete && redirectCountdown > 0) {
      const timer = setTimeout(() => {
        setRedirectCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (isComplete && redirectCountdown === 0) {
      window.location.href = 'https://bausen.mx';
    }
  }, [isComplete, redirectCountdown]);

  // ============================================================
  // HANDLERS
  // ============================================================

  const handleFileSelect = async (docType: string, label: string, file: File) => {
    setSelectedDocType(docType);
    setSelectedFile(file);
    setUploadSuccess(null);
    resetValidation();

    // Validar documento con OCR
    await validateDocument(file, docType);
  };

  const handleUpload = async () => {
    if (!selectedDocType || !selectedFile || !token) return;

    setUploading(true);
    setError(null);

    try {
      const result = await uploadPublicDocument(token, selectedDocType, selectedFile);
      
      setUploadSuccess(result.message);
      
      // Actualizar datos del link
      setLinkData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          progress_percentage: result.progress,
          pending_documents: result.pending_documents,
        };
      });

      // Limpiar selección
      setSelectedDocType(null);
      setSelectedFile(null);
      resetValidation();

      // Verificar si completó todos
      if (result.is_complete) {
        setIsComplete(true);
      }
    } catch (err: any) {
      setError(err.message || 'Error al subir el documento');
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedDocType(null);
    setSelectedFile(null);
    resetValidation();
    setUploadSuccess(null);
  };

  // ============================================================
  // RENDER - LOADING STATE
  // ============================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER - ERROR STATE
  // ============================================================

  if (error && !linkData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Link no disponible</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <a
            href="https://bausen.mx"
            className="inline-block px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
          >
            Ir a Bausen
          </a>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER - COMPLETE STATE
  // ============================================================

  if (isComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Documentos completados!</h1>
          <p className="text-gray-600 mb-6">
            Gracias {linkData?.candidate_name}, hemos recibido todos tus documentos correctamente.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-500">
              Serás redirigido automáticamente en
            </p>
            <p className="text-3xl font-bold text-emerald-600">{redirectCountdown}</p>
            <p className="text-sm text-gray-500">segundos</p>
          </div>
          <a
            href="https://bausen.mx"
            className="inline-block px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
          >
            Ir a Bausen ahora
          </a>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER - MAIN UPLOAD FORM
  // ============================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Subir Documentos</h1>
          <p className="text-gray-600 mt-2">
            Hola {linkData?.candidate_name}, sube los documentos solicitados
          </p>
        </div>

        {/* Message from recruiter */}
        {linkData?.message && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Mensaje del reclutador:</strong> {linkData.message}
            </p>
          </div>
        )}

        {/* Progress */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">Progreso</span>
            <span className="text-sm font-bold text-emerald-600">
              {linkData?.progress_percentage}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-emerald-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${linkData?.progress_percentage || 0}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {linkData?.pending_documents.length} documento(s) pendiente(s) de {linkData?.requested_documents_info.length} total
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Success message */}
        {uploadSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-emerald-700">{uploadSuccess}</p>
          </div>
        )}

        {/* Document being validated/uploaded */}
        {selectedDocType && selectedFile && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">
              Documento seleccionado
            </h3>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="font-medium text-gray-900">{selectedFile.name}</p>
              <p className="text-sm text-gray-500">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>

            {/* OCR Validation Result */}
            <DocumentValidationResult
              result={validationResult}
              isValidating={isValidating}
              showActions={false}
            />

            {/* Action Buttons */}
            {validationResult && !isValidating && (
              <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {uploading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  {validationResult.status === 'approved' ? 'Subir documento' : 'Subir de todos modos'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Pending Documents List */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Documentos pendientes</h2>
          </div>
          
          <div className="divide-y divide-gray-100">
            {linkData?.pending_documents.map((doc) => (
              <div key={doc.type} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{doc.label}</p>
                      <p className="text-xs text-gray-500">PDF, JPG o PNG (máx. 10MB)</p>
                    </div>
                  </div>
                  
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFileSelect(doc.type, doc.label, file);
                        }
                      }}
                      disabled={selectedDocType !== null && selectedDocType !== doc.type}
                    />
                    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedDocType === doc.type
                        ? 'bg-emerald-100 text-emerald-700'
                        : selectedDocType !== null
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700'
                    }`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Seleccionar
                    </span>
                  </label>
                </div>
              </div>
            ))}

            {linkData?.pending_documents.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <p>No hay documentos pendientes</p>
              </div>
            )}
          </div>
        </div>

        {/* Expiration Notice */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            Este link expira el{' '}
            {linkData?.expires_at && new Date(linkData.expires_at).toLocaleDateString('es-MX', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <a
            href="https://bausen.mx"
            className="text-sm text-gray-500 hover:text-emerald-600 transition-colors"
          >
            Powered by Bausen
          </a>
        </div>
      </div>
    </div>
  );
}
