"use client";

import { useState, useEffect } from "react";
import { generateProfileFromTranscription, getClients } from "@/lib/api";

interface Client {
  id: number;
  business_name: string;
  commercial_name: string;
}

interface ProfileGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (message: string) => void;
}

export default function ProfileGenerationModal({ 
  isOpen, 
  onClose, 
  onSuccess 
}: ProfileGenerationModalProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [transcription, setTranscription] = useState<string>("");
  const [additionalNotes, setAdditionalNotes] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [loadingClients, setLoadingClients] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadClients();
    }
  }, [isOpen]);

  const loadClients = async () => {
    setLoadingClients(true);
    try {
      const response = await getClients();
        const clientsList = (response as any).results || (Array.isArray(response) ? response : []);
      setClients(clientsList);
    } catch (error) {
      console.error('Error loading clients:', error);
      if (onSuccess) {
        onSuccess('⚠️ Error al cargar clientes');
      }
    } finally {
      setLoadingClients(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!transcription.trim()) {
      alert('Por favor ingresa la transcripción de la reunión');
      return;
    }

    setLoading(true);

    try {
      const data: any = {
        meeting_transcription: transcription,
        additional_notes: additionalNotes,
      };

      if (selectedClient) {
        data.client_id = parseInt(selectedClient);
      }

      const result = await generateProfileFromTranscription(data);

      if (onSuccess) {
        onSuccess(result.message || '✅ Perfil generado exitosamente con IA');
      }

      // Reset form
      setSelectedClient("");
      setTranscription("");
      setAdditionalNotes("");
      onClose();
    } catch (error: any) {
      console.error('Error generating profile:', error);
      if (onSuccess) {
        onSuccess(`⚠️ Error: ${error.message || 'Error al generar el perfil'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-16 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex items-center justify-center z-35 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-8 py-6 flex justify-between items-center rounded-t-2xl">
          <div>
            <h2 className="text-2xl font-bold">Generar Perfil con IA</h2>
            <p className="text-purple-100 text-sm mt-1">Crea perfiles automáticamente desde transcripciones de reuniones</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-purple-800 rounded-full w-10 h-10 flex items-center justify-center transition"
            disabled={loading}
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          {/* Client Selection (Optional) */}
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">
              <i className="fas fa-building mr-2 text-purple-600"></i>
              Cliente (Opcional)
            </label>
            {loadingClients ? (
              <div className="flex items-center justify-center py-4">
                <i className="fas fa-spinner fa-spin text-purple-600 mr-2"></i>
                <span className="text-gray-600">Cargando clientes...</span>
              </div>
            ) : (
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={loading}
              >
                <option value="">Seleccionar cliente (opcional)...</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.commercial_name || client.business_name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Transcription */}
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">
              <i className="fas fa-microphone mr-2 text-purple-600"></i>
              Transcripción de la Reunión *
            </label>
            <textarea
              value={transcription}
              onChange={(e) => setTranscription(e.target.value)}
              rows={12}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
              placeholder="Pega aquí la transcripción completa de la reunión con el cliente donde se discutió el perfil de reclutamiento..."
              required
              disabled={loading}
            />
            <p className="mt-2 text-sm text-gray-500">
              {transcription.length} caracteres
            </p>
          </div>

          {/* Additional Notes */}
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">
              <i className="fas fa-sticky-note mr-2 text-purple-600"></i>
              Notas Adicionales (Opcional)
            </label>
            <textarea
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Agrega cualquier contexto adicional, requisitos especiales, o información que no esté en la transcripción..."
              disabled={loading}
            />
          </div>

          {/* Info Box */}
          <div className="bg-purple-50 border-l-4 border-purple-500 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <i className="fas fa-magic text-purple-500 text-xl"></i>
              </div>
              <div className="ml-3">
                <p className="text-sm text-purple-700">
                  <strong>Claude AI</strong> generará automáticamente:
                </p>
                <ul className="list-disc list-inside text-sm text-purple-600 mt-2 space-y-1">
                  <li>Título del puesto y descripción completa</li>
                  <li>Responsabilidades principales</li>
                  <li>Requisitos técnicos y experiencia necesaria</li>
                  <li>Habilidades requeridas</li>
                  <li>Rango salarial y beneficios</li>
                  <li>Modalidad de trabajo y ubicación</li>
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
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 font-semibold shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || !transcription.trim()}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Generando con IA...
                </>
              ) : (
                <>
                  <i className="fas fa-magic mr-2"></i>
                  Generar Perfil con IA
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}