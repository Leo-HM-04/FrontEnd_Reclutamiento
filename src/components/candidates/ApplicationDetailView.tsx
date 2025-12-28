"use client";

import { useState } from "react";
import ProfileDetail from "../profiles/ProfileDetail";
import CandidateDetail from "./CandidateDetail";

interface ApplicationDetailViewProps {
  profileId: number;
  candidateId: number;
  onBack: () => void;
}

export default function ApplicationDetailView({ profileId, candidateId, onBack }: ApplicationDetailViewProps) {
  const [activeTab, setActiveTab] = useState<'candidate' | 'profile'>('candidate');

  return (
    <div>
      {/* Header con pestañas */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Detalles de la Aplicación</h2>
          <button
            onClick={onBack}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2"
          >
            <i className="fas fa-arrow-left"></i>
            Volver
          </button>
        </div>
        
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('candidate')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === 'candidate'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <i className="fas fa-user mr-2"></i>
            Candidato
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === 'profile'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <i className="fas fa-briefcase mr-2"></i>
            Perfil / Vacante
          </button>
        </div>
      </div>

      {/* Contenido según pestaña activa */}
      {activeTab === 'candidate' && (
        <CandidateDetail candidateId={candidateId} onBack={onBack} />
      )}
      
      {activeTab === 'profile' && (
        <ProfileDetail profileId={profileId} onBack={onBack} />
      )}
    </div>
  );
}