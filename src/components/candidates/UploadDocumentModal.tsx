"use client";

import { useState, useEffect } from "react";
import { useModal } from '@/context/ModalContext';
import { apiClient } from "@/lib/api";

interface UploadDocumentModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const DOCUMENT_TYPES = [
  { value: 'cv', label: 'Curriculum Vitae' },
  { value: 'cover_letter', label: 'Carta de Presentación' },
  { value: 'certificate', label: 'Certificado' },
  { value: 'portfolio', label: 'Portafolio' },
  { value: 'other', label: 'Otro' },
];

export default function UploadDocumentModal({ onClose, onSuccess }: UploadDocumentModalProps) {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    candidate: '',
    document_type: 'cv',
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
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.candidate || !formData.file) {
      await showAlert('Por favor completa todos los campos obligatorios');
      return;
    }

    try {
      setUploading(true);

      const uploadFormData = new FormData();
      uploadFormData.append('candidate', formData.candidate);
      uploadFormData.append('document_type', formData.document_type);
      uploadFormData.append('description', formData.description);
      uploadFormData.append('file', formData.file);

      await apiClient.uploadCandidateDocument(uploadFormData);
      
      await showAlert('Documento subido exitosamente');
      onSuccess();
    } catch (error: any) {
      console.error('Error al subir:', error);
      await showAlert(`Error al subir documento: ${error.message || 'Error desconocido'}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed top-16 left-0 right-0 bottom-0  flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Subir Documento</h2>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
          </div>

          {/* Tipo de Documento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Documento <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.document_type}
              onChange={(e) => setFormData({ ...formData, document_type: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            >
              {DOCUMENT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              placeholder="Descripción opcional del documento..."
            />
          </div>

          {/* Archivo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Archivo <span className="text-red-500">*</span>
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-500 transition-colors">
              <input
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                className="hidden"
                id="file-upload"
                required
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <i className="fas fa-upload text-4xl text-gray-400 mb-3"></i>
                <p className="text-sm text-gray-600">
                  {formData.file ? `Seleccionado: ${formData.file.name}` : 'Click para seleccionar un archivo'}
                </p>
                <p className="text-xs text-gray-500 mt-2">PDF, Word, o imágenes (máx. 10MB)</p>
              </label>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              disabled={uploading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Subiendo...
                </>
              ) : (
                <>
                  <i className="fas fa-upload mr-2"></i>
                  Subir Documento
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
