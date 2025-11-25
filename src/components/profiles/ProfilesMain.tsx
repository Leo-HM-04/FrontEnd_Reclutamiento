"use client";

import { useState } from "react";
import ProfilesList from "./ProfilesList";
import ProfileForm from "./ProfileForm";
import ProfileDetail from "./ProfileDetail";
import ProfileStatusHistory from "./ProfileStatusHistory";
import ProfileDocuments from "./ProfileDocuments";
import ProfileStats from "./ProfileStats";
import CVAnalysisModal from "./CVAnalysisModal";
import ProfileGenerationModal from "./ProfileGenerationModal";

type ProfileView = 
  | "profiles-list" 
  | "profile-create"
  | "profile-detail"
  | "profiles-pending" 
  | "profile-history" 
  | "profile-documents"
  | "profile-stats"
  | "ai-cv-analysis"
  | "ai-profile-generation";

  interface MenuItem {
  id: ProfileView;
  label: string;
  icon: string;
  description: string;
  isAction?: boolean;
  action?: () => void;
}

interface ProfilesMainProps {
  onClose?: () => void;
}

export default function ProfilesMain({ onClose }: ProfilesMainProps) {
  const [currentView, setCurrentView] = useState<ProfileView>("profiles-list");
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);
  const [showCVAnalysis, setShowCVAnalysis] = useState(false); // NUEVO
  const [showProfileGeneration, setShowProfileGeneration] = useState(false); // NUEVO
  const [successMessage, setSuccessMessage] = useState<string>(""); // NUEVO

 const menuItems: MenuItem[] = [
    {
      id: "profiles-list",
      label: "Perfiles de Reclutamiento",
      icon: "fa-briefcase",
      description: "Ver y gestionar todos los perfiles"
    },
    {
      id: "profile-create",
      label: "Crear Nuevo Perfil",
      icon: "fa-plus-circle",
      description: "Crear un nuevo perfil de reclutamiento"
    },
    {
      id: "profiles-pending",
      label: "Perfiles Pendientes",
      icon: "fa-clock",
      description: "Perfiles pendientes de aprobación"
    },
    {
      id: "profile-history",
      label: "Historial de Estados",
      icon: "fa-history",
      description: "Ver cambios de estado de perfiles"
    },
    {
      id: "profile-documents",
      label: "Documentos de Perfiles",
      icon: "fa-folder-open",
      description: "Gestionar documentos asociados"
    },
    {
      id: "profile-stats",
      label: "Estadísticas",
      icon: "fa-chart-bar",
      description: "Métricas y estadísticas de perfiles"
    },
    {
      id: "ai-cv-analysis",
      label: "🤖 Analizar CVs con IA",
      icon: "fa-robot",
      description: "Extraer información de CVs automáticamente",
      isAction: true,
      action: () => setShowCVAnalysis(true)
    },
    {
      id: "ai-profile-generation",
      label: "✨ Generar Perfil con IA",
      icon: "fa-magic",
      description: "Crear perfiles desde transcripciones",
      isAction: true,
      action: () => setShowProfileGeneration(true)
    }
  ];

  const getNavClass = (view: ProfileView) => {
    return currentView === view
      ? "bg-orange-50 text-orange-700 border-l-4 border-orange-600"
      : "text-gray-700 hover:bg-gray-50 border-l-4 border-transparent";
  };

  const handleViewProfile = (profileId: number) => {
    setSelectedProfileId(profileId);
    setCurrentView("profile-detail");
  };

  const handleBackToList = () => {
    setSelectedProfileId(null);
    setCurrentView("profiles-list");
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Gestión de Perfiles de Reclutamiento</h2>
            <p className="text-gray-600 mt-1">
              Sistema completo para gestionar perfiles y vacantes
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
              Menú de Perfiles
            </h3>
            <nav className="space-y-1">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.isAction && item.action) {
                      item.action();
                    } else {
                      setCurrentView(item.id);
                      setSelectedProfileId(null);
                    }
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
            {currentView === "profiles-list" && (
              <ProfilesList onViewProfile={handleViewProfile} />
            )}
            {currentView === "profile-create" && (
              <ProfileForm onSuccess={handleBackToList} />
            )}
            {currentView === "profile-detail" && selectedProfileId && (
              <ProfileDetail 
                profileId={selectedProfileId} 
                onBack={handleBackToList}
              />
            )}
            {currentView === "profiles-pending" && (
              <ProfilesList 
                filterStatus="pending" 
                onViewProfile={handleViewProfile}
              />
            )}
            {currentView === "profile-history" && (
              <ProfileStatusHistory />
            )}
            {currentView === "profile-documents" && (
              <ProfileDocuments />
            )}
            {currentView === "profile-stats" && (
              <ProfileStats />
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

      {/* CV Analysis Modal */}
      <CVAnalysisModal
        isOpen={showCVAnalysis}
        onClose={() => setShowCVAnalysis(false)}
        onSuccess={(message) => {
          setSuccessMessage(message);
          setTimeout(() => setSuccessMessage(""), 5000);
          // Reload data if needed
          setCurrentView("profiles-list");
        }}
      />

      {/* Profile Generation Modal */}
      <ProfileGenerationModal
        isOpen={showProfileGeneration}
        onClose={() => setShowProfileGeneration(false)}
        onSuccess={(message) => {
          setSuccessMessage(message);
          setTimeout(() => setSuccessMessage(""), 5000);
          // Reload data if needed
          setCurrentView("profiles-list");
        }}
      />
    </div>
  );
}