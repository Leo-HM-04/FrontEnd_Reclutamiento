"use client";

import { useState, useEffect } from "react";
import { bulkUploadCVs, getBulkUploadStatus, getProfiles } from "@/lib/api";

interface Profile {
  id: number;
  position_title: string;
  client_name?: string;
}

interface BulkCVUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (message: string) => void;
}

interface UploadResult {
  success: boolean;
  filename: string;
  candidate_name?: string;
  candidate_email?: string;
  candidate_id?: number;
  error?: string;
  created?: boolean;
  matching_score?: number;
}

export default function BulkCVUploadModal({ 
  isOpen, 
  onClose, 
  onSuccess 
}: BulkCVUploadModalProps) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<string>("");
  const [cvFiles, setCvFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const [results, setResults] = useState<UploadResult[] | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [isAsyncProcessing, setIsAsyncProcessing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadProfiles();
      resetForm();
    }
  }, [isOpen]);

  // Poll para procesamiento asíncrono
  useEffect(() => {
    if (isAsyncProcessing && taskId) {
      const interval = setInterval(async () => {
        try {
          const status = await getBulkUploadStatus(taskId);
          
          if (status.state === 'SUCCESS') {
            setResults(status.result?.successful_details || []);
            setUploadProgress(`✅ Procesamiento completado: ${status.result?.successful || 0} exitosos, ${status.result?.failed || 0} fallidos`);
            setIsAsyncProcessing(false);
            setLoading(false);
            clearInterval(interval);
          } else if (status.state === 'FAILURE') {
            setUploadProgress(`❌ Error en el procesamiento`);
            setIsAsyncProcessing(false);
            setLoading(false);
            clearInterval(interval);
          } else {
            setUploadProgress(`⏳ Procesando CVs... Estado: ${status.state}`);
          }
        } catch (error) {
          console.error('Error checking status:', error);
        }
      }, 3000); // Check cada 3 segundos

      return () => clearInterval(interval);
    }
  }, [isAsyncProcessing, taskId]);

  const loadProfiles = async () => {
    setLoadingProfiles(true);
    try {
      const response = await getProfiles();
      const profilesList = (response as any).results || (Array.isArray(response) ? response : []);
      setProfiles(profilesList);
    } catch (error) {
      console.error('Error loading profiles:', error);
    } finally {
      setLoadingProfiles(false);
    }
  };

  const resetForm = () => {
    setSelectedProfile("");
    setCvFiles([]);
    setResults(null);
    setUploadProgress("");
    setTaskId(null);
    setIsAsyncProcessing(false);
  };

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      
      // Validar cantidad
      if (files.length > 50) {
        alert('Máximo 50 archivos por carga');
        e.target.value = '';
        return;
      }
      
      // Validar tipos y tamaños
      const validFiles = files.filter(file => {
        const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        const maxSize = 10 * 1024 * 1024; // 10MB
        
        if (!validTypes.includes(file.type)) {
          alert(`${file.name}: Tipo de archivo no válido. Solo PDF o DOCX`);
          return false;
        }
        
        if (file.size > maxSize) {
          alert(`${file.name}: Archivo muy grande. Máximo 10MB`);
          return false;
        }
        
        return true;
      });
      
      setCvFiles(validFiles);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (cvFiles.length === 0) {
      alert('Por favor selecciona al menos un archivo CV');
      return;
    }

    setLoading(true);
    setUploadProgress(`⏳ Subiendo ${cvFiles.length} CVs...`);
    setResults(null);

    try {
      const formData = new FormData();
      
      // Agregar archivos
      cvFiles.forEach((file) => {
        formData.append('files', file);
      });
      
      // Agregar profile_id si está seleccionado
      if (selectedProfile) {
        formData.append('profile_id', selectedProfile);
      }

      const result = await bulkUploadCVs(formData);

      // Procesamiento síncrono (≤3 archivos)
      if (result.status === undefined || result.total_processed !== undefined) {
        setResults(result.results?.successful || []);
        setUploadProgress(
          `✅ ${result.message || 'Procesamiento completado'}\n` +
          `📊 Total: ${result.total_processed} | ✅ Exitosos: ${result.successful} | ❌ Fallidos: ${result.failed}`
        );
        setLoading(false);
        
        if (onSuccess) {
          onSuccess(`✅ ${result.successful} candidatos creados exitosamente`);
        }
      } 
      // Procesamiento asíncrono (3 archivos)
      else if (result.task_id) {
        setTaskId(result.task_id);
        setIsAsyncProcessing(true);
        setUploadProgress(`⏳ Procesando ${result.total_files} CVs en segundo plano...`);
      }
    } catch (error: any) {
      console.error('Error uploading CVs:', error);
      setUploadProgress(`❌ Error: ${error.message || 'Error al subir los CVs'}`);
      setLoading(false);
      
      if (onSuccess) {
        onSuccess(`⚠️ Error: ${error.message}`);
      }
    }
  };

  const handleClose = () => {
    if (!loading && !isAsyncProcessing) {
      resetForm();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full my-8">
        <div className="sticky top-0 bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-6 flex justify-between items-center rounded-t-2xl">
          <div>
            <h2 className="text-2xl font-bold">📤 Carga Masiva de CVs con IA</h2>
            <p className="text-green-100 text-sm mt-1">Analiza múltiples CVs automáticamente y crea candidatos</p>
          </div>
          <button
            onClick={handleClose}
            className="text-white hover:bg-green-800 rounded-full w-10 h-10 flex items-center justify-center transition"
            disabled={loading || isAsyncProcessing}
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        <div className="p-8">
          {!results ? (
            <form onSubmit={handleSubmit}>
              {/* Profile Selection */}
              <div className="mb-6">
                <label className="block text-gray-700 font-semibold mb-2">
                  <i className="fas fa-briefcase mr-2 text-green-600"></i>
                  Perfil / Vacante (Opcional)
                </label>
                {loadingProfiles ? (
                  <div className="flex items-center justify-center py-4">
                    <i className="fas fa-spinner fa-spin text-green-600 mr-2"></i>
                    <span className="text-gray-600">Cargando perfiles...</span>
                  </div>
                ) : (
                  <select
                    value={selectedProfile}
                    onChange={(e) => setSelectedProfile(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    disabled={loading || isAsyncProcessing}
                  >
                    <option value="">Sin asignar a perfil (solo crear candidatos)</option>
                    {profiles.map((profile) => (
                      <option key={profile.id} value={profile.id}>
                        {profile.position_title} {profile.client_name ? `- ${profile.client_name}` : ''}
                      </option>
                    ))}
                  </select>
                )}
                <p className="mt-2 text-sm text-gray-500">
                  Si seleccionas un perfil, se calculará el matching automáticamente
                </p>
              </div>

              {/* File Upload */}
              <div className="mb-6">
                <label className="block text-gray-700 font-semibold mb-2">
                  <i className="fas fa-file-upload mr-2 text-green-600"></i>
                  Archivos CV (PDF o DOCX)
                </label>
                <div className="border-2 border-dashed border-green-300 rounded-lg p-8 text-center bg-green-50 hover:bg-green-100 transition">
                  <i className="fas fa-cloud-upload-alt text-5xl text-green-600 mb-4"></i>
                  <p className="text-gray-700 font-semibold mb-2">
                    Arrastra archivos aquí o haz clic para seleccionar
                  </p>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.docx"
                    onChange={handleFilesChange}
                    className="hidden"
                    id="cv-files-input"
                    disabled={loading || isAsyncProcessing}
                  />
                  <label
                    htmlFor="cv-files-input"
                    className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg cursor-pointer hover:bg-green-700 transition"
                  >
                    Seleccionar CVs
                  </label>
                  <p className="text-sm text-gray-500 mt-3">
                    Máximo 50 archivos | 10MB por archivo | Formatos: PDF, DOCX
                  </p>
                </div>

                {cvFiles.length > 0 && (
                  <div className="mt-4">
                    <p className="font-semibold text-gray-700 mb-2">
                      <i className="fas fa-check-circle text-green-600 mr-2"></i>
                      {cvFiles.length} archivo(s) seleccionado(s):
                    </p>
                    <div className="max-h-40 overflow-y-auto bg-gray-50 rounded-lg p-4">
                      <ul className="space-y-1">
                        {cvFiles.map((file, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-center">
                            <i className="fas fa-file-pdf text-red-500 mr-2"></i>
                            {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* Info Box */}
              <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <i className="fas fa-robot text-green-500 text-xl"></i>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-700">
                      <strong>¿Cómo funciona?</strong>
                    </p>
                    <ul className="list-disc list-inside text-sm text-green-600 mt-2 space-y-1">
                      <li>Claude AI extrae automáticamente toda la información de cada CV</li>
                      <li>Crea candidatos completos con experiencia, educación y habilidades</li>
                      <li>Si asignas un perfil, calcula el matching con IA</li>
                      <li>Procesa ≤3 CVs inmediatamente, 3 en segundo plano</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Progress */}
              {uploadProgress && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-800 whitespace-pre-line">{uploadProgress}</p>
                  {(loading || isAsyncProcessing) && (
                    <div className="mt-3">
                      <div className="w-full bg-blue-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '100%' }}></div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition"
                  disabled={loading || isAsyncProcessing}
                >
                  {loading || isAsyncProcessing ? 'Procesando...' : 'Cancelar'}
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 font-semibold shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading || isAsyncProcessing || cvFiles.length === 0}
                >
                  {loading || isAsyncProcessing ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Procesando...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-rocket mr-2"></i>
                      Procesar {cvFiles.length} CV(s) con IA
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Results View */
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                <i className="fas fa-check-circle text-green-600 mr-2"></i>
                Resultados del Procesamiento
              </h3>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-l-4 ${
                      result.success
                        ? 'bg-green-50 border-green-500'
                        : 'bg-red-50 border-red-500'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">
                          {result.success ? (
                            <i className="fas fa-check-circle text-green-600 mr-2"></i>
                          ) : (
                            <i className="fas fa-times-circle text-red-600 mr-2"></i>
                          )}
                          {result.filename}
                        </p>
                        {result.success ? (
                          <div className="mt-2 text-sm text-gray-700">
                            <p>
                              <strong>Candidato:</strong> {result.candidate_name || 'N/A'}
                            </p>
                            <p>
                              <strong>Email:</strong> {result.candidate_email || 'N/A'}
                            </p>
                            {result.matching_score !== undefined && (
                              <p>
                                <strong>Matching:</strong>{' '}
                                <span className="font-bold text-green-600">
                                  {result.matching_score}%
                                </span>
                              </p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                              {result.created ? '✨ Nuevo candidato creado' : '🔄 Candidato actualizado'}
                            </p>
                          </div>
                        ) : (
                          <p className="mt-1 text-sm text-red-700">{result.error}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex gap-4">
                <button
                  onClick={handleClose}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 font-semibold shadow-lg transition"
                >
                  <i className="fas fa-check mr-2"></i>
                  Finalizar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}