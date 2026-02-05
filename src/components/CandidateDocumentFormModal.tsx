'use client';

import { useState, useEffect } from 'react';
import { useModal } from '@/context/ModalContext';
import { apiClient } from '@/lib/api';

interface CandidateDocumentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (message: string) => void;
}

interface Candidate {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
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

export default function CandidateDocumentFormModal({ isOpen, onClose, onSuccess }: CandidateDocumentFormModalProps) {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  
  const [documentForm, setDocumentForm] = useState({
    candidato: '',
    tipoDocumento: 'estudio_socioeconomico',
    archivo: null as File | null,
    archivoNombre: '',
    descripcion: '',
    nombreOriginalArchivo: ''
  });

  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { showAlert } = useModal();

  // Cargar candidatos cuando se abre el modal
  useEffect(() => {
    if (isOpen && candidates.length === 0) {
      loadCandidates();
    }
  }, [isOpen]);

  const loadCandidates = async () => {
    try {
      setLoadingCandidates(true);
      const response = await apiClient.getCandidates();
      setCandidates(response as Candidate[]);
      console.log('✅ Candidatos cargados:', response);
    } catch (error) {
      console.error('❌ Error al cargar candidatos:', error);
    } finally {
      setLoadingCandidates(false);
    }
  };

  const resetForm = () => {
    setDocumentForm({
      candidato: '',
      tipoDocumento: 'estudio_socioeconomico',
      archivo: null,
      archivoNombre: '',
      descripcion: '',
      nombreOriginalArchivo: ''
    });
    setShowAIAnalysis(false);
    setShowMetadata(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDocumentForm({
        ...documentForm,
        archivo: file,
        archivoNombre: file.name,
        nombreOriginalArchivo: file.name
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!documentForm.archivo) {
      await showAlert('Por favor selecciona un archivo');
      return;
    }

    if (!documentForm.candidato) {
      await showAlert('Por favor selecciona un candidato');
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append('candidate', documentForm.candidato);
      formData.append('document_type', documentForm.tipoDocumento);
      formData.append('file', documentForm.archivo);
      if (documentForm.descripcion) {
        formData.append('description', documentForm.descripcion);
      }

      console.log('📝 Subiendo documento al backend...');
      console.log('🔍 Datos del formulario:', {
        candidato: documentForm.candidato,
        tipoDocumento: documentForm.tipoDocumento,
        archivoNombre: documentForm.archivoNombre,
        descripcion: documentForm.descripcion
      });
      
      // Subir documento al backend
      const response = await apiClient.uploadCandidateDocument(formData);
      
      console.log('✅ Documento subido exitosamente:', response);
      
      if (onSuccess) {
        onSuccess("Documento subido exitosamente a la base de datos");
      }
      
      resetForm();
      onClose();
    } catch (error: any) {
      console.error('❌ Error al subir documento:', error);
      await showAlert(`Error al subir documento: ${error.message || 'Error desconocido'}`);
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-16 left-0 right-0 bottom-0  flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden">
        {/* Header - Degradado azul */}
        <div className="bg-linear-to-r from-blue-50 via-blue-100 to-indigo-50 px-6 py-5 shadow-lg border-b-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-500 p-4 rounded-xl shadow-lg">
                <i className="fas fa-file-upload text-3xl text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Agregar Documento del Candidato</h2>
                <p className="text-gray-600 text-sm mt-1 font-semibold">Subir documentos y archivos de candidatos</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white bg-red-500 hover:bg-red-600 p-3 rounded-lg transition-all duration-200 group shadow-lg"
              title="Cerrar"
              disabled={uploading}
            >
              <i className="fas fa-times text-xl group-hover:rotate-90 transition-transform duration-200" />
            </button>
          </div>
        </div>

        {/* Formulario con scroll */}
        <div className="p-6 bg-gray-50 overflow-y-auto max-h-[calc(95vh-120px)]">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">

            {/* DOCUMENTO */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-blue-500/10 border-b-2 border-blue-500 px-5 py-3.5">
                <h3 className="text-lg font-bold text-blue-800 tracking-wide flex items-center">
                  <i className="fas fa-file-alt mr-2" />
                  DOCUMENTO
                </h3>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Candidato */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <i className="fas fa-user text-blue-500 mr-1.5" />
                      Candidato <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={documentForm.candidato}
                        onChange={(e) => setDocumentForm({...documentForm, candidato: e.target.value})}
                        className="flex-1 px-3 py-2.5 rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:outline-none text-gray-800 shadow-sm transition-colors"
                        required
                        disabled={loadingCandidates}
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
                      <button 
                        type="button"
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                        title="Agregar nuevo candidato"
                      >
                        <i className="fas fa-plus" />
                      </button>
                      <button 
                        type="button"
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        title="Limpiar selección"
                        onClick={() => setDocumentForm({...documentForm, candidato: ''})}
                      >
                        <i className="fas fa-times" />
                      </button>
                      <button 
                        type="button"
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        title="Ver candidato"
                      >
                        <i className="fas fa-eye" />
                      </button>
                    </div>
                  </div>

                  {/* Tipo de Documento */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <i className="fas fa-tag text-blue-500 mr-1.5" />
                      Tipo de Documento <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={documentForm.tipoDocumento}
                      onChange={(e) => setDocumentForm({...documentForm, tipoDocumento: e.target.value})}
                      className="w-full px-3 py-2.5 rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:outline-none text-gray-800 shadow-sm transition-colors"
                      required
                    >
                      <optgroup label="━━━ DOCUMENTACIÓN ━━━">
                        {DOCUMENT_TYPES.filter(type => type.category === 'DOCUMENTACION').map(type => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </optgroup>
                      <optgroup label="━━━ INFORMACIÓN PERSONAL ━━━">
                        {DOCUMENT_TYPES.filter(type => type.category === 'INFORMACIÓN PERSONAL').map(type => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </optgroup>
                      <optgroup label="━━━ INFORMACIÓN DE GRADO ACADÉMICO ━━━">
                        {DOCUMENT_TYPES.filter(type => type.category === 'INFORMACIÓN DE GRADO ACADÉMICO').map(type => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </optgroup>
                    </select>
                  </div>

                  {/* Archivo */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <i className="fas fa-paperclip text-blue-500 mr-1.5" />
                      Archivo <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => document.getElementById('fileInput')?.click()}
                        className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        Elegir archivo
                      </button>
                      <span className="text-sm text-gray-500">
                        {documentForm.archivoNombre || 'No hay archivo'}
                      </span>
                      <input
                        id="fileInput"
                        type="file"
                        onChange={handleFileChange}
                        className="hidden"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      />
                    </div>
                  </div>

                  {/* Archivo (display) */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <i className="fas fa-link text-blue-500 mr-1.5" />
                      Enlace
                    </label>
                    <input
                      type="text"
                      value="-"
                      readOnly
                      className="w-full px-3 py-2.5 rounded-lg border-2 border-gray-300 bg-gray-50 text-gray-500 shadow-sm"
                    />
                  </div>

                  {/* Nombre Original del Archivo */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <i className="fas fa-file-signature text-blue-500 mr-1.5" />
                      Nombre Original del Archivo
                    </label>
                    <input
                      type="text"
                      value={documentForm.nombreOriginalArchivo}
                      onChange={(e) => setDocumentForm({...documentForm, nombreOriginalArchivo: e.target.value})}
                      className="w-full px-3 py-2.5 rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:outline-none text-gray-800 shadow-sm transition-colors"
                    />
                  </div>

                  {/* Descripción */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <i className="fas fa-align-left text-blue-500 mr-1.5" />
                      Descripción
                    </label>
                    <textarea
                      value={documentForm.descripcion}
                      onChange={(e) => setDocumentForm({...documentForm, descripcion: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2.5 rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:outline-none text-gray-800 shadow-sm transition-colors resize-none"
                      placeholder="Descripción del documento..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ANÁLISIS DE IA (Opcional) */}
            <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${showAIAnalysis ? 'block' : 'hidden'}`}>
              <div className="bg-purple-500/10 border-b-2 border-purple-500 px-5 py-3.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-purple-800 tracking-wide flex items-center">
                    <i className="fas fa-brain mr-2" />
                    ANÁLISIS DE IA
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowAIAnalysis(false)}
                    className="text-purple-600 hover:text-purple-800 text-sm font-medium transition-colors"
                  >
                    (Ocultar)
                  </button>
                </div>
              </div>
              <div className="p-5">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Texto extraído por IA
                    </label>
                    <textarea
                      rows={4}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm resize-none"
                      placeholder="El texto será extraído automáticamente..."
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Datos parseados por IA
                    </label>
                    <textarea
                      rows={4}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm resize-none"
                      placeholder="Los datos serán parseados automáticamente..."
                      readOnly
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* METADATOS (Opcional) */}
            <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${showMetadata ? 'block' : 'hidden'}`}>
              <div className="bg-gray-500/10 border-b-2 border-gray-500 px-5 py-3.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-800 tracking-wide flex items-center">
                    <i className="fas fa-info-circle mr-2" />
                    METADATOS
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowMetadata(false)}
                    className="text-gray-600 hover:text-gray-800 text-sm font-medium transition-colors"
                  >
                    (Ocultar)
                  </button>
                </div>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subido por
                    </label>
                    <input
                      type="text"
                      value="-"
                      readOnly
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de subida
                    </label>
                    <input
                      type="text"
                      value="-"
                      readOnly
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Botones para mostrar secciones opcionales */}
            <div className="bg-gray-50 px-5 py-4 rounded-lg border border-gray-200">
              <div className="flex flex-wrap gap-3">
                {!showAIAnalysis && (
                  <button
                    type="button"
                    onClick={() => setShowAIAnalysis(true)}
                    className="px-4 py-2 text-purple-600 bg-white border border-purple-300 rounded-md hover:bg-purple-50 transition-colors text-sm font-medium"
                  >
                    <i className="fas fa-brain mr-2"></i>
                    Análisis de IA
                  </button>
                )}
                {!showMetadata && (
                  <button
                    type="button"
                    onClick={() => setShowMetadata(true)}
                    className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    <i className="fas fa-info-circle mr-2"></i>
                    Metadatos
                  </button>
                )}
              </div>
            </div>

            {/* Botones de acción finales */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-between items-center shadow-lg rounded-lg">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors font-medium"
                disabled={uploading}
              >
                <i className="fas fa-times mr-2"></i>
                Cancelar
              </button>
              <div className="flex space-x-3">
                <button
                  type="button"
                  className="px-6 py-2.5 bg-slate-600 text-white rounded-md hover:bg-slate-700 transition-colors font-medium shadow-sm"
                  disabled={uploading}
                >
                  <i className="fas fa-save mr-2"></i>
                  Guardar
                </button>
                <button
                  type="button"
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium shadow-sm"
                  disabled={uploading}
                >
                  <i className="fas fa-plus mr-2"></i>
                  Guardar y agregar otro
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium shadow-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                  disabled={uploading}
                >
                  <i className={`fas ${uploading ? 'fa-spinner fa-spin' : 'fa-check'} mr-2`}></i>
                  {uploading ? 'Subiendo...' : 'Guardar y continuar editando'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
