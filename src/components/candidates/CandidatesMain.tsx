"use client";

import { useState } from "react";

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

  const handleViewCandidate = (candidateId: number) => {
    setSelectedCandidateId(candidateId);
    setCurrentView("candidate-detail");
  };

  const handleBackToList = () => {
    setSelectedCandidateId(null);
    setCurrentView("candidates-list");
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
              {menuItems.map((item) => (
                <button
                  key={item.id}
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
              ))}
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {currentView === "candidates-list" && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Lista de Candidatos</h3>
                <div className="text-center py-12 text-gray-500">
                  <i className="fas fa-users text-5xl mb-4 text-gray-300"></i>
                  <p className="text-lg">Vista de candidatos en desarrollo</p>
                  <p className="text-sm mt-2">Aquí se mostrará la lista de candidatos</p>
                </div>
              </div>
            )}

            {currentView === "applications" && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Aplicaciones</h3>
                <div className="text-center py-12 text-gray-500">
                  <i className="fas fa-briefcase text-5xl mb-4 text-gray-300"></i>
                  <p className="text-lg">Vista de aplicaciones en desarrollo</p>
                  <p className="text-sm mt-2">Aquí se mostrarán las aplicaciones de candidatos</p>
                </div>
              </div>
            )}

            {currentView === "documents" && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Documentos</h3>
                <div className="text-center py-12 text-gray-500">
                  <i className="fas fa-folder-open text-5xl mb-4 text-gray-300"></i>
                  <p className="text-lg">Vista de documentos en desarrollo</p>
                  <p className="text-sm mt-2">Aquí se mostrarán los CVs y documentos</p>
                </div>
              </div>
            )}

            {currentView === "notes" && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Notas</h3>
                <div className="text-center py-12 text-gray-500">
                  <i className="fas fa-sticky-note text-5xl mb-4 text-gray-300"></i>
                  <p className="text-lg">Vista de notas en desarrollo</p>
                  <p className="text-sm mt-2">Aquí se mostrarán las notas de candidatos</p>
                </div>
              </div>
            )}

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
