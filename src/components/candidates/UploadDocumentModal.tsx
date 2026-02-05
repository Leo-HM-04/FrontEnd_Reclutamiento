"use client";

import { useState, useEffect, useCallback } from "react";
import { useModal } from '@/context/ModalContext';
import { apiClient } from "@/lib/api";
import DocumentValidationResult, { ValidationResult } from "@/components/DocumentValidationResult";
import { useDocumentValidation, requiresOCRValidation } from "@/lib/useDocumentValidation";

interface UploadDocumentModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const DOCUMENT_TYPES = [
  // DOCUMENTACION
  { value: 'estudio_socioeconomico', label: 'Estudio socioeconómico', category: 'DOCUMENTACION' },
  { value: 'estudio_laboratorio', label: 'Estudio de laboratorio', category: 'DOCUMENTACION' },
  { value: 'estudio_psicometrico', label: 'Estudio psicométrico', category: 'DOCUMENTACION' },
  { value: 'entrevistas_examenes', label: 'Entrevistas y exámenes', category: 'DOCUMENTACION' },
  
  // INFORMACIÓN PERSONAL
  { value: 'ine_pasaporte', label: 'Identificación oficial INE o pasaporte (no IFE)', category: 'INFORMACIÓN PERSONAL' },
  { value: 'acta_nacimiento', label: 'Acta de nacimiento', category: 'INFORMACIÓN PERSONAL' },
  { value: 'comprobante_domicilio', label: 'Comprobante de domicilio', category: 'INFORMACIÓN PERSONAL' },
  { value: 'situacion_fiscal', label: 'Constancia de situación fiscal', category: 'INFORMACIÓN PERSONAL' },
  { value: 'curp', label: 'CURP', category: 'INFORMACIÓN PERSONAL' },
  { value: 'nss', label: 'Numero de Seguridad Social NSS', category: 'INFORMACIÓN PERSONAL' },
  { value: 'estado_cuenta', label: 'Estado de cuenta bancario', category: 'INFORMACIÓN PERSONAL' },
  { value: 'cartas_recomendacion', label: 'Dos cartas de recomendación con números telefónicos', category: 'INFORMACIÓN PERSONAL' },
  
  // INFORMACIÓN DE GRADO ACADÉMICO
  { value: 'titulo_profesional', label: 'Título profesional', category: 'INFORMACIÓN DE GRADO ACADÉMICO' },
  { value: 'cedula_profesional', label: 'Cedula profesional', category: 'INFORMACIÓN DE GRADO ACADÉMICO' },
  { value: 'cv', label: 'CV', category: 'INFORMACIÓN DE GRADO ACADÉMICO' },
  { value: 'cartas_trabajos_anteriores', label: 'Cartas de anteriores trabajos', category: 'INFORMACIÓN DE GRADO ACADÉMICO' },
];

export default function UploadDocumentModal({ onClose, onSuccess }: UploadDocumentModalProps) {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [step, setStep] = useState<'form' | 'validation' | 'upload'>('form');
  const { showAlert } = useModal();
  
  // Hook de validación OCR
  const {
    validationResult,
    isValidating,
    validateDocument,
    resetValidation,
    shouldBlockUpload,
    isValidationSuccessful
  } = useDocumentValidation();
  
  const [formData, setFormData] = useState({
    candidate: '',
    document_type: 'estudio_socioeconomico',
    description: '',
    file: null as File | null,
  });

  useEffect(() => {
    loadCandidates();
  }, []);

  const loadCandidates = async () => {
    try {
      setLoadingCandidates(true);
      const response = await apiClient.getCandidates();
      const candidatesData = (response as any)?.results || (response as any) || [];
      setCandidates(candidatesData);
    } catch (error) {
      console.error('Error loading candidates:', error);
    } finally {
      setLoadingCandidates(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, file: e.target.files[0] });
      resetValidation(); // Reset validación cuando cambia el archivo
      setStep('form');
    }
  };

  // Validar documento antes de subir
  const handleValidateAndUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.candidate || !formData.file) {
      await showAlert('Por favor completa todos los campos obligatorios');
      return;
    }

    // Si el tipo de documento requiere validación OCR
    if (requiresOCRValidation(formData.document_type)) {
      setStep('validation');
      await validateDocument(formData.file, formData.document_type);
    } else {
      // Si no requiere validación, subir directamente
      await performUpload();
    }
  };

  // Realizar la subida del documento
  const performUpload = async (forceUpload = false) => {
    if (!formData.file) return;
    
    try {
      setUploading(true);
      setStep('upload');

      const uploadFormData = new FormData();
      uploadFormData.append('candidate', formData.candidate);
      uploadFormData.append('document_type', formData.document_type);
      uploadFormData.append('description', formData.description);
      uploadFormData.append('file', formData.file);
      
      // Añadir flag de forzado y datos de validación si existen
      if (forceUpload) {
        uploadFormData.append('force_upload', 'true');
      }
      if (validationResult) {
        uploadFormData.append('validation_status', validationResult.status);
        uploadFormData.append('validation_score', validationResult.match_score.toString());
      }

      await apiClient.uploadCandidateDocument(uploadFormData);
      
      await showAlert('Documento subido exitosamente');
      onSuccess();
    } catch (error: any) {
      console.error('Error al subir:', error);
      await showAlert(`Error al subir documento: ${error.message || 'Error desconocido'}`);
      setStep('form');
    } finally {
      setUploading(false);
    }
  };

  // Handlers para acciones de validación
  const handleValidationRetry = useCallback(() => {
    // Limpiar el archivo para forzar reselección
    setFormData(prev => ({ ...prev, file: null }));
    resetValidation();
    setStep('form');
    
    // Resetear el input de archivo
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }, [resetValidation]);

  const handleForceUpload = useCallback(() => {
    performUpload(true);
  }, [formData, validationResult]);

  const handleContinueUpload = useCallback(() => {
    performUpload(false);
  }, [formData]);

  // Verificar si el documento actual requiere validación
  const currentRequiresValidation = requiresOCRValidation(formData.document_type);

  return (
    <div className="fixed top-16 left-0 right-0 bottom-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 rounded-t-2xl sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Subir Documento</h2>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
              disabled={uploading || isValidating}
            >
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>
          {/* Progress indicator */}
          {currentRequiresValidation && formData.file && (
            <div className="mt-3 flex items-center gap-2 text-sm text-white/80">
              <span className={`flex items-center gap-1 ${step === 'form' ? 'text-white font-medium' : ''}`}>
                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">1</span>
                Seleccionar
              </span>
              <i className="fas fa-chevron-right text-xs"></i>
              <span className={`flex items-center gap-1 ${step === 'validation' ? 'text-white font-medium' : ''}`}>
                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">2</span>
                Validar
              </span>
              <i className="fas fa-chevron-right text-xs"></i>
              <span className={`flex items-center gap-1 ${step === 'upload' ? 'text-white font-medium' : ''}`}>
                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">3</span>
                Subir
              </span>
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleValidateAndUpload} className="p-6 space-y-4">
          {/* Candidato */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Candidato <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.candidate}
              onChange={(e) => setFormData({ ...formData, candidate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
              disabled={loadingCandidates || isValidating || uploading}
            >
              <option value="">
                {loadingCandidates ? 'Cargando candidatos...' : 'Seleccionar candidato...'}
              </option>
              {candidates.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.first_name} {candidate.last_name} - {candidate.email}
                </option>
              ))}
            </select>
          </div>

          {/* Tipo de Documento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Documento <span className="text-red-500">*</span>
              {currentRequiresValidation && (
                <span className="ml-2 text-xs text-blue-600 font-normal">
                  <i className="fas fa-shield-alt mr-1"></i>
                  Con validación automática
                </span>
              )}
            </label>
            <select
              value={formData.document_type}
              onChange={(e) => {
                setFormData({ ...formData, document_type: e.target.value });
                resetValidation();
                setStep('form');
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
              disabled={isValidating || uploading}
            >
              <optgroup label="━━━ DOCUMENTACIÓN ━━━">
                {DOCUMENT_TYPES.filter(type => type.category === 'DOCUMENTACION').map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </optgroup>
              <optgroup label="━━━ INFORMACIÓN PERSONAL ━━━">
                {DOCUMENT_TYPES.filter(type => type.category === 'INFORMACIÓN PERSONAL').map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </optgroup>
              <optgroup label="━━━ INFORMACIÓN DE GRADO ACADÉMICO ━━━">
                {DOCUMENT_TYPES.filter(type => type.category === 'INFORMACIÓN DE GRADO ACADÉMICO').map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              placeholder="Descripción opcional del documento..."
              disabled={isValidating || uploading}
            />
          </div>

          {/* Archivo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Archivo <span className="text-red-500">*</span>
            </label>
            <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              formData.file 
                ? 'border-green-300 bg-green-50' 
                : 'border-gray-300 hover:border-green-500'
            }`}>
              <input
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                className="hidden"
                id="file-upload"
                required
                disabled={isValidating || uploading}
              />
              <label htmlFor="file-upload" className={`cursor-pointer ${isValidating || uploading ? 'pointer-events-none opacity-50' : ''}`}>
                {formData.file ? (
                  <>
                    <i className="fas fa-file-check text-4xl text-green-500 mb-3"></i>
                    <p className="text-sm text-green-700 font-medium">
                      {formData.file.name}
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      {(formData.file.size / 1024 / 1024).toFixed(2)} MB • Click para cambiar
                    </p>
                  </>
                ) : (
                  <>
                    <i className="fas fa-upload text-4xl text-gray-400 mb-3"></i>
                    <p className="text-sm text-gray-600">
                      Click para seleccionar un archivo
                    </p>
                    <p className="text-xs text-gray-500 mt-2">PDF, Word, o imágenes (máx. 10MB)</p>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* Resultado de Validación */}
          {(isValidating || validationResult) && step === 'validation' && (
            <DocumentValidationResult
              result={validationResult}
              isValidating={isValidating}
              onRetry={handleValidationRetry}
              onForceUpload={handleForceUpload}
              onContinue={handleContinueUpload}
              showForceUpload={true}
            />
          )}

          {/* Buttons - solo mostrar si no estamos en paso de validación con resultado */}
          {!(step === 'validation' && validationResult) && (
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                disabled={uploading || isValidating}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={uploading || isValidating || !formData.file}
              >
                {uploading ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Subiendo...
                  </>
                ) : isValidating ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Validando...
                  </>
                ) : currentRequiresValidation ? (
                  <>
                    <i className="fas fa-shield-alt mr-2"></i>
                    Validar y Subir
                  </>
                ) : (
                  <>
                    <i className="fas fa-upload mr-2"></i>
                    Subir Documento
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
