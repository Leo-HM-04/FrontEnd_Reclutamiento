"use client";

import { useState, useEffect } from "react";
import { getProfiles, getProfileDocuments, uploadProfileDocument } from "@/lib/api";

interface ProfileDocument {
  id: number;
  profile: number;
  profile_title?: string;
  document_type: string;
  file: string;
  file_name: string;
  file_size: number;
  uploaded_by: number;
  uploaded_by_name?: string;
  description: string;
  uploaded_at: string;
}

export default function ProfileDocuments() {
  const [documents, setDocuments] = useState<ProfileDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<number | null>(null);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadData, setUploadData] = useState({
    document_type: "requirement",
    description: "",
    file: null as File | null,
  });

  useEffect(() => {
    loadProfiles();
  }, []);

  useEffect(() => {
    if (selectedProfile) {
      loadDocuments();
    }
  }, [selectedProfile]);

  const loadProfiles = async () => {
    try {
      const response = await getProfiles();
      setProfiles(response.data.results || response.data);
    } catch (error) {
      console.error("Error loading profiles:", error);
    }
  };

  const loadDocuments = async () => {
    if (!selectedProfile) return;
    
    setLoading(true);
    try {
      const response = await getProfileDocuments(selectedProfile);
      setDocuments(response.data);
    } catch (error) {
      console.error("Error loading documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadData({ ...uploadData, file: e.target.files[0] });
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfile || !uploadData.file) {
      alert("Por favor seleccione un perfil y un archivo");
      return;
    }

    const formData = new FormData();
    formData.append("file", uploadData.file);
    formData.append("document_type", uploadData.document_type);
    formData.append("description", uploadData.description);

    try {
      await uploadProfileDocument(selectedProfile, formData);
      alert("Documento subido exitosamente");
      setShowUploadModal(false);
      setUploadData({ document_type: "requirement", description: "", file: null });
      loadDocuments();
    } catch (error: any) {
      console.error("Error uploading document:", error);
      alert(`Error al subir documento: ${error.response?.data?.detail || error.message}`);
    }
  };

  const getDocumentIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      requirement: "fa-file-alt",
      contract: "fa-file-contract",
      proposal: "fa-file-invoice",
      evaluation: "fa-clipboard-check",
      other: "fa-file",
    };
    return icons[type] || "fa-file";
  };

  const getDocumentColor = (type: string) => {
    const colors: { [key: string]: string } = {
      requirement: "text-blue-600",
      contract: "text-green-600",
      proposal: "text-purple-600",
      evaluation: "text-orange-600",
      other: "text-gray-600",
    };
    return colors[type] || "text-gray-600";
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Documentos de Perfiles</h3>
            <p className="text-gray-600 mt-1">
              Gestiona documentos asociados a los perfiles de reclutamiento
            </p>
          </div>
          {selectedProfile && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              <i className="fas fa-upload mr-2"></i>
              Subir Documento
            </button>
          )}
        </div>
      </div>

      {/* Profile Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <i className="fas fa-briefcase mr-2"></i>
          Seleccionar Perfil
        </label>
        <select
          value={selectedProfile || ""}
          onChange={(e) => setSelectedProfile(Number(e.target.value))}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
        >
          <option value="">Seleccione un perfil...</option>
          {profiles.map((profile) => (
            <option key={profile.id} value={profile.id}>
              {profile.position_title} - {profile.client_name || `Cliente #${profile.client}`}
            </option>
          ))}
        </select>
      </div>

      {/* Documents List */}
      {selectedProfile && (
        <div>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <i className="fas fa-spinner fa-spin text-4xl text-orange-600"></i>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <i className="fas fa-folder-open text-gray-300 text-5xl mb-4"></i>
              <p className="text-gray-500 text-lg">No hay documentos para este perfil</p>
              <button
                onClick={() => setShowUploadModal(true)}
                className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                <i className="fas fa-upload mr-2"></i>
                Subir Primer Documento
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center ${getDocumentColor(doc.document_type)}`}>
                        <i className={`fas ${getDocumentIcon(doc.document_type)} text-xl`}></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{doc.file_name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(doc.file_size)}</p>
                      </div>
                    </div>
                  </div>

                  {doc.description && (
                    <p className="text-sm text-gray-600 mb-3">{doc.description}</p>
                  )}

                  <div className="text-xs text-gray-500 mb-3">
                    <div className="flex items-center mb-1">
                      <i className="fas fa-user mr-1"></i>
                      {doc.uploaded_by_name || `Usuario #${doc.uploaded_by}`}
                    </div>
                    <div className="flex items-center">
                      <i className="fas fa-clock mr-1"></i>
                      {new Date(doc.uploaded_at).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <a
                      href={doc.file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 text-center"
                    >
                      <i className="fas fa-download mr-1"></i>
                      Descargar
                    </a>
                    <button
                      className="px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
                      title="Eliminar"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">Subir Documento</h3>
            
            <form onSubmit={handleUpload}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Documento
                </label>
                <select
                  value={uploadData.document_type}
                  onChange={(e) => setUploadData({ ...uploadData, document_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  <option value="requirement">Requisitos</option>
                  <option value="contract">Contrato</option>
                  <option value="proposal">Propuesta</option>
                  <option value="evaluation">Evaluación</option>
                  <option value="other">Otro</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  value={uploadData.description}
                  onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="Descripción del documento..."
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Archivo
                </label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
                {uploadData.file && (
                  <p className="text-sm text-gray-600 mt-2">
                    Archivo seleccionado: {uploadData.file.name}
                  </p>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadData({ document_type: "requirement", description: "", file: null });
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  <i className="fas fa-upload mr-2"></i>
                  Subir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
