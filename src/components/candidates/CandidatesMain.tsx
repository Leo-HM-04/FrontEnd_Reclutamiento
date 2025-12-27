"use client";

import React, { useState, useEffect } from "react";
import { apiClient } from "@/lib/api";
import CandidateDetail from "./CandidateDetail";
import CandidateForm from "./CandidateForm";

type CandidateView = 
  | "candidates-list" 
  | "candidate-create"
  | "candidate-detail"
  | "applications" 
  | "documents" 
  | "notes"
  | "history"
  | "statistics";

interface MenuItem {
  id: CandidateView;
  label: string;
  icon: string;
  description: string;
}

interface CandidatesMainProps {
  onClose?: () => void;
}

export default function CandidatesMain({ onClose }: CandidatesMainProps) {
  const [currentView, setCurrentView] = useState<CandidateView>("candidates-list");
  const [selectedCandidateId, setSelectedCandidateId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>("");
  
  // Data states
  const [candidates, setCandidates] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Filtros para candidates-list
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [applicationFilter, setApplicationFilter] = useState("all");
  
  // Lista de perfiles para el filtro
  const [profiles, setProfiles] = useState<any[]>([]);

  // Load data when view changes
  useEffect(() => {
    loadData();
  }, [currentView]);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      const profilesData = await apiClient.getProfiles();
      setProfiles(profilesData as any[]);
    } catch (error) {
      console.error("Error loading profiles:", error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      switch (currentView) {
        case "candidates-list":
          const candidatesData = await apiClient.getCandidates();
          setCandidates(candidatesData as any[]);
          break;
        case "applications":
          const applicationsData = await apiClient.getCandidateApplications();
          setApplications(applicationsData as any[]);
          break;
        case "documents":
          const documentsData = await apiClient.getCandidateDocuments();
          setDocuments(documentsData as any[]);
          break;
        case "notes":
          const notesData = await apiClient.getCandidateNotes();
          setNotes(notesData as any[]);
          break;
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewCandidate = (candidateId: number) => {
    setSelectedCandidateId(candidateId);
    setCurrentView("candidate-detail");
  };

  const handleEditCandidate = (candidateId: number) => {
    setSelectedCandidateId(candidateId);
    setCurrentView("candidate-create");
  };

  const handleDeleteCandidate = async (candidateId: number) => {
    if (confirm('¿Estás seguro de que deseas eliminar este candidato?')) {
      try {
        await apiClient.deleteCandidate(candidateId);
        alert('Candidato eliminado exitosamente');
        loadData();
      } catch (error) {
        console.error('Error deleting candidate:', error);
        alert('Error al eliminar el candidato');
      }
    }
  };

  const handleBackToList = () => {
    setSelectedCandidateId(null);
    setCurrentView("candidates-list");
  };

  const menuItems: MenuItem[] = [
    {
      id: "candidates-list",
      label: "Ver Candidatos",
      icon: "fa-users",
      description: "Ver y gestionar todos los candidatos"
    },
    {
      id: "applications",
      label: "Aplicaciones",
      icon: "fa-briefcase",
      description: "Gestionar aplicaciones de candidatos"
    },
    {
      id: "documents",
      label: "Documentos",
      icon: "fa-folder-open",
      description: "CVs y documentos de candidatos"
    },
    {
      id: "notes",
      label: "Notas",
      icon: "fa-sticky-note",
      description: "Notas y observaciones"
    },
    {
      id: "history",
      label: "Historial",
      icon: "fa-history",
      description: "Historial de cambios y actividad"
    }
  ];

  const getNavClass = (view: CandidateView) => {
    return currentView === view
      ? "bg-blue-50 text-blue-700 border-l-4 border-blue-600"
      : "text-gray-700 hover:bg-gray-50 border-l-4 border-transparent";
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Gestión de Candidatos</h2>
            <p className="text-gray-600 mt-1">
              Sistema completo para gestionar candidatos y aplicaciones
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="mt-4 sm:mt-0 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              <i className="fas fa-arrow-left mr-2"></i>
              Volver
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Menu */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Menú de Candidatos
            </h3>
            <nav className="space-y-1">
              {menuItems.map((item, index) => (
                <React.Fragment key={item.id}>
                  <button
                    onClick={() => {
                      setCurrentView(item.id);
                      setSelectedCandidateId(null);
                    }}
                    className={`w-full flex items-start px-3 py-3 text-sm font-medium rounded-lg transition-all ${getNavClass(
                      item.id
                    )}`}
                  >
                    <i className={`fas ${item.icon} mt-0.5 mr-3 w-5`}></i>
                    <div className="text-left">
                      <div>{item.label}</div>
                      <div className="text-xs text-gray-500 mt-0.5 font-normal">
                        {item.description}
                      </div>
                    </div>
                  </button>

                  {/* Botón Crear Nuevo Candidato después del primer item */}
                  {index === 0 && (
                    <button
                      onClick={() => setCurrentView("candidate-create")}
                      className={`w-full flex items-start px-3 py-3 text-sm font-medium rounded-lg transition-all ${getNavClass(
                        "candidate-create"
                      )}`}
                    >
                      <i className="fas fa-plus-circle mt-0.5 mr-3 w-5"></i>
                      <div className="text-left">
                        <div>Crear Nuevo Candidato</div>
                        <div className="text-xs text-gray-500 mt-0.5 font-normal">
                          Agregar un nuevo candidato
                        </div>
                      </div>
                    </button>
                  )}
                </React.Fragment>
              ))}
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {/* CANDIDATE DETAIL */}
            {currentView === "candidate-detail" && selectedCandidateId && (
              <CandidateDetail 
                candidateId={selectedCandidateId} 
                onBack={handleBackToList}
              />
            )}

            {/* CANDIDATE CREATE/EDIT FORM */}
            {currentView === "candidate-create" && (
              <CandidateForm 
                candidateId={selectedCandidateId || undefined}
                onSuccess={() => {
                  handleBackToList();
                  loadData();
                }}
              />
            )}

            {/* CANDIDATES LIST */}
            {currentView === "candidates-list" && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">Todos los Candidatos</h3>
                  <button 
                    onClick={loadData}
                    className="px-6 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium flex items-center gap-2"
                  >
                    <i className="fas fa-sync"></i>
                    Actualizar
                  </button>
                </div>

                {/* Filtros */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                      <i className="fas fa-search mr-2"></i>
                      Buscar
                    </label>
                    <input
                      type="text"
                      placeholder="Buscar por nombre o email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                      <i className="fas fa-filter mr-2"></i>
                      Estado
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">Seleccionar estado...</option>
                      <option value="applied">Aplicó</option>
                      <option value="screening">En Revisión</option>
                      <option value="shortlisted">Pre-seleccionado</option>
                      <option value="interview_scheduled">Entrevista Agendada</option>
                      <option value="interviewed">Entrevistado</option>
                      <option value="offered">Oferta Extendida</option>
                      <option value="accepted">Oferta Aceptada</option>
                      <option value="rejected">Rechazado</option>
                      <option value="withdrawn">Retirado</option>
                    </select>
                  </div>
                  <div>
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                      <i className="fas fa-briefcase mr-2"></i>
                      Aplicaciones
                    </label>
                    <select
                      value={applicationFilter}
                      onChange={(e) => setApplicationFilter(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">Todas las aplicaciones</option>
                      {profiles.map((profile) => (
                        <option key={profile.id} value={profile.id}>
                          {profile.position_title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Estadísticas */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-orange-50 rounded-lg p-4">
                    <h4 className="text-orange-900 font-semibold text-sm mb-1">Total Candidatos</h4>
                    <p className="text-3xl font-bold text-orange-900">
                      {candidates.length}
                    </p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="text-blue-900 font-semibold text-sm mb-1">Aplicados</h4>
                    <p className="text-3xl font-bold text-blue-900">
                      {candidates.filter(c => c.latest_application_status === 'applied').length}
                    </p>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <h4 className="text-yellow-900 font-semibold text-sm mb-1">En Proceso</h4>
                    <p className="text-3xl font-bold text-yellow-900">
                      {candidates.filter(c => ['screening', 'shortlisted', 'interview_scheduled', 'interviewed'].includes(c.latest_application_status)).length}
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <h4 className="text-green-900 font-semibold text-sm mb-1">Ofertas</h4>
                    <p className="text-3xl font-bold text-green-900">
                      {candidates.filter(c => ['offered', 'accepted'].includes(c.latest_application_status)).length}
                    </p>
                  </div>
                </div>
                
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-500 mt-4">Cargando candidatos...</p>
                  </div>
                ) : candidates.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <i className="fas fa-users text-5xl mb-4 text-gray-300"></i>
                    <p className="text-lg">No hay candidatos registrados</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              NOMBRE
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              EMAIL
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              ESTADO
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              POSICIÓN ACTUAL
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              UBICACIÓN
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              EXPERIENCIA
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              TELÉFONO
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              ACCIONES
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {candidates
                            .filter(candidate => {
                              const matchesSearch = searchTerm === "" || 
                                `${candidate.first_name} ${candidate.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                candidate.email?.toLowerCase().includes(searchTerm.toLowerCase());
                              const matchesStatus = statusFilter === "all" || candidate.latest_application_status === statusFilter;
                              const matchesApplication = applicationFilter === "all" || 
                                (candidate.candidate_profiles && candidate.candidate_profiles.some((app: any) => app.profile === parseInt(applicationFilter)));
                              return matchesSearch && matchesStatus && matchesApplication;
                            })
                            .map((candidate) => (
                            <tr key={candidate.id} className="hover:bg-gray-50 cursor-pointer">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="shrink-0 h-10 w-10">
                                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                                      {(candidate.first_name?.[0] || 'C').toUpperCase()}{(candidate.last_name?.[0] || '').toUpperCase()}
                                    </div>
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">
                                      {candidate.first_name} {candidate.last_name}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {candidate.current_position || 'Sin posición'}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{candidate.email || '-'}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  (candidate.latest_application_status === 'accepted' || candidate.latest_application_status === 'offered') ? 'bg-green-100 text-green-800' :
                                  candidate.latest_application_status === 'rejected' ? 'bg-red-100 text-red-800' :
                                  candidate.latest_application_status === 'withdrawn' ? 'bg-gray-100 text-gray-800' :
                                  candidate.latest_application_status === 'screening' ? 'bg-yellow-100 text-yellow-800' :
                                  candidate.latest_application_status === 'shortlisted' ? 'bg-blue-100 text-blue-800' :
                                  (candidate.latest_application_status === 'interview_scheduled' || candidate.latest_application_status === 'interviewed') ? 'bg-purple-100 text-purple-800' :
                                  candidate.latest_application_status === 'applied' ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {candidate.latest_application_status_display || candidate.status_display || 'Nuevo'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {candidate.current_position || '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{candidate.city || '-'}</div>
                                <div className="text-sm text-gray-500">{candidate.state || '-'}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {candidate.years_of_experience || 0} años
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {candidate.phone || '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                <div className="flex items-center justify-center gap-3">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleViewCandidate(candidate.id); }}
                                    className="text-blue-600 hover:text-blue-900 transition-colors"
                                    title="Ver detalles"
                                  >
                                    <i className="fas fa-eye"></i>
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleEditCandidate(candidate.id); }}
                                    className="text-orange-600 hover:text-orange-900 transition-colors"
                                    title="Editar"
                                  >
                                    <i className="fas fa-edit"></i>
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteCandidate(candidate.id); }}
                                    className="text-red-600 hover:text-red-900 transition-colors"
                                    title="Eliminar"
                                  >
                                    <i className="fas fa-trash"></i>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* APPLICATIONS */}
            {currentView === "applications" && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Aplicaciones</h3>
                  <button 
                    onClick={loadData}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <i className="fas fa-sync mr-2"></i>
                    Actualizar
                  </button>
                </div>
                
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-500 mt-4">Cargando aplicaciones...</p>
                  </div>
                ) : applications.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <i className="fas fa-briefcase text-5xl mb-4 text-gray-300"></i>
                    <p className="text-lg">No hay aplicaciones registradas</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Candidato</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Perfil</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {applications.map((app) => (
                          <tr key={app.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">{app.candidate_name || `Candidato #${app.candidate}`}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{app.profile_title || `Perfil #${app.profile}`}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                app.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                app.status === 'shortlisted' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {app.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                              {new Date(app.applied_at || app.created_at).toLocaleDateString('es-MX')}
                            </td>
                            <td className="px-4 py-3 text-right text-sm">
                              <button className="text-blue-600 hover:text-blue-800 mr-3">
                                <i className="fas fa-eye"></i>
                              </button>
                              <button className="text-green-600 hover:text-green-800">
                                <i className="fas fa-edit"></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* DOCUMENTS */}
            {currentView === "documents" && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Documentos</h3>
                  <button 
                    onClick={loadData}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <i className="fas fa-sync mr-2"></i>
                    Actualizar
                  </button>
                </div>
                
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-500 mt-4">Cargando documentos...</p>
                  </div>
                ) : documents.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <i className="fas fa-folder-open text-5xl mb-4 text-gray-300"></i>
                    <p className="text-lg">No hay documentos registrados</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {documents.map((doc) => (
                      <div key={doc.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                              <i className="fas fa-file-alt"></i>
                            </div>
                            <div className="ml-3">
                              <h4 className="text-sm font-semibold text-gray-900">{doc.document_type}</h4>
                              <p className="text-xs text-gray-500">{doc.candidate_name || `Candidato #${doc.candidate}`}</p>
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {new Date(doc.uploaded_at).toLocaleDateString('es-MX')}
                          </span>
                          <div className="flex space-x-2">
                            <button className="text-green-600 hover:text-green-800 text-xs">
                              <i className="fas fa-download"></i>
                            </button>
                            <button className="text-red-600 hover:text-red-800 text-xs">
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* NOTES */}
            {currentView === "notes" && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Notas</h3>
                  <button 
                    onClick={loadData}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <i className="fas fa-sync mr-2"></i>
                    Actualizar
                  </button>
                </div>
                
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-500 mt-4">Cargando notas...</p>
                  </div>
                ) : notes.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <i className="fas fa-sticky-note text-5xl mb-4 text-gray-300"></i>
                    <p className="text-lg">No hay notas registradas</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {notes.map((note) => (
                      <div key={note.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-semibold">
                              {note.created_by_name?.[0] || 'U'}
                            </div>
                            <div className="ml-3">
                              <h4 className="text-sm font-semibold text-gray-900">{note.created_by_name || 'Usuario'}</h4>
                              <p className="text-xs text-gray-500">{note.candidate_name || `Candidato #${note.candidate}`}</p>
                            </div>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(note.created_at).toLocaleDateString('es-MX')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mt-2">{note.note}</p>
                        {note.is_important && (
                          <span className="inline-flex items-center px-2 py-1 mt-2 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                            <i className="fas fa-exclamation-circle mr-1"></i>
                            Importante
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* HISTORY */}
            {currentView === "history" && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Historial</h3>
                <div className="text-center py-12 text-gray-500">
                  <i className="fas fa-history text-5xl mb-4 text-gray-300"></i>
                  <p className="text-lg">Vista de historial en desarrollo</p>
                  <p className="text-sm mt-2">Aquí se mostrará el historial de actividad</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in">
          <div className="bg-white rounded-lg shadow-xl border-l-4 border-green-500 p-4 max-w-md">
            <div className="flex items-center">
              <i className="fas fa-check-circle text-green-500 text-xl mr-3"></i>
              <p className="text-gray-800">{successMessage}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
