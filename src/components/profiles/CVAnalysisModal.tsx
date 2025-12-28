"use client";

import { useState, useEffect } from "react";
import { analyzeCVWithAI, getCandidates } from "@/lib/api";

interface Candidate {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
}

interface CVAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (message: string) => void;
}

export default function CVAnalysisModal({ isOpen, onClose, onSuccess }: CVAnalysisModalProps) {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<string>("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingCandidates, setLoadingCandidates] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCandidates();
    }
  }, [isOpen]);

  const loadCandidates = async () => {
    setLoadingCandidates(true);
    try {
      const response = await getCandidates({ ordering: '-created_at' });
      const candidatesList = (response as any).results || (Array.isArray(response) ? response : []);
      setCandidates(candidatesList);
    } catch (error) {
      console.error('Error loading candidates:', error);
      if (onSuccess) {
        onSuccess('⚠️ Error al cargar candidatos');
      }
    } finally {
      setLoadingCandidates(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file type
      const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
      if (!validTypes.includes(file.type)) {
        alert('Por favor selecciona un archivo PDF o DOCX');
        e.target.value = '';
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('El archivo es demasiado grande. Máximo 10MB');
        e.target.value = '';
        return;
      }
      
      setCvFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCandidate) {
      alert('Por favor selecciona un candidato');
      return;
    }
    
    if (!cvFile) {
      alert('Por favor selecciona un archivo CV');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('candidate_id', selectedCandidate);
      formData.append('document_file', cvFile);

      const result = await analyzeCVWithAI(formData);

      if (onSuccess) {
        onSuccess(result.message || '✅ CV analizado exitosamente con IA');
      }

      // Reset form
      setSelectedCandidate("");
      setCvFile(null);
      onClose();
    } catch (error: any) {
      console.error('Error analyzing CV:', error);
      if (onSuccess) {
        onSuccess(`⚠️ Error: ${error.message || 'Error al analizar el CV'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-16 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-6 flex justify-between items-center rounded-t-2xl">
          <div>
            <h2 className="text-2xl font-bold">Analizar CV con IA</h2>
            <p className="text-blue-100 text-sm mt-1">Extrae información automáticamente usando Claude AI</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-blue-800 rounded-full w-10 h-10 flex items-center justify-center transition"
            disabled={loading}
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          {/* Candidate Selection */}
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">
              <i className="fas fa-user mr-2 text-blue-600"></i>
              Candidato
            </label>
            {loadingCandidates ? (
              <div className="flex items-center justify-center py-4">
                <i className="fas fa-spinner fa-spin text-blue-600 mr-2"></i>
                <span className="text-gray-600">Cargando candidatos...</span>
              </div>
            ) : (
              <select
                value={selectedCandidate}
                onChange={(e) => setSelectedCandidate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={loading}
              >
                <option value="">Seleccionar candidato...</option>
                {candidates.map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.full_name} - {candidate.email}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* File Upload */}
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">
              <i className="fas fa-file-pdf mr-2 text-blue-600"></i>
              Archivo CV (PDF o DOCX)
            </label>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={loading}
            />
            {cvFile && (
              <p className="mt-2 text-sm text-gray-600">
                <i className="fas fa-check-circle text-green-600 mr-1"></i>
                Archivo seleccionado: {cvFile.name} ({(cvFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <i className="fas fa-info-circle text-blue-500 text-xl"></i>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  <strong>Claude AI</strong> extraerá automáticamente:
                </p>
                <ul className="list-disc list-inside text-sm text-blue-600 mt-2 space-y-1">
                  <li>Información personal (nombre, email, teléfono)</li>
                  <li>Experiencia laboral completa</li>
                  <li>Educación y certificaciones</li>
                  <li>Habilidades técnicas y blandas</li>
                  <li>Idiomas</li>
                  <li>Análisis y recomendaciones</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 font-semibold shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || !selectedCandidate || !cvFile}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Analizando con IA...
                </>
              ) : (
                <>
                  <i className="fas fa-robot mr-2"></i>
                  Analizar con IA
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}