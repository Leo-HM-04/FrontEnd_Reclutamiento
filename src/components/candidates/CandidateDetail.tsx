"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api";

interface CandidateDetailProps {
  candidateId: number;
  onBack?: () => void;
}

interface Candidate {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  alternative_phone?: string;
  city?: string;
  state?: string;
  country?: string;
  address?: string;
  current_position?: string;
  current_company?: string;
  years_of_experience?: number;
  education_level?: string;
  university?: string;
  degree?: string;
  skills?: string[];
  languages?: any[];
  certifications?: string[];
  salary_expectation_min?: number;
  salary_expectation_max?: number;
  salary_currency?: string;
  status?: string;
  status_display?: string;
  candidate_profiles?: any[];
  source?: string;
  available_from?: string;
  notice_period_days?: number;
  linkedin_url?: string;
  portfolio_url?: string;
  github_url?: string;
  internal_notes?: string;
  created_at?: string;
  assigned_to_name?: string;
  latest_application_status?: string;
  latest_application_status_display?: string;
}

export default function CandidateDetail({ candidateId, onBack }: CandidateDetailProps) {
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCandidate();
  }, [candidateId]);

  const loadCandidate = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getCandidate(candidateId);
      setCandidate(data as Candidate);
    } catch (error) {
      console.error("Error loading candidate:", error);
      alert("Error al cargar el candidato");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status?: string) => {
    const statusConfig: { [key: string]: { bg: string; text: string; label: string } } = {
      applied: { bg: "bg-blue-100", text: "text-blue-700", label: "Aplicado" },
      screening: { bg: "bg-yellow-100", text: "text-yellow-700", label: "En Evaluación" },
      shortlisted: { bg: "bg-purple-100", text: "text-purple-700", label: "Preseleccionado" },
      interview_scheduled: { bg: "bg-indigo-100", text: "text-indigo-700", label: "Entrevista Programada" },
      interviewed: { bg: "bg-pink-100", text: "text-pink-700", label: "Entrevistado" },
      offered: { bg: "bg-green-100", text: "text-green-700", label: "Oferta Realizada" },
      accepted: { bg: "bg-green-100", text: "text-green-700", label: "Oferta Aceptada" },
      rejected: { bg: "bg-red-100", text: "text-red-700", label: "Rechazado" },
      withdrawn: { bg: "bg-gray-100", text: "text-gray-700", label: "Retirado" },
      new: { bg: "bg-gray-100", text: "text-gray-700", label: "Nuevo" },
    };

    const config = statusConfig[status || "new"] || statusConfig.new;
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  if (loading || !candidate) {
    return (
      <div className="flex justify-center items-center py-12">
        <i className="fas fa-spinner fa-spin text-4xl text-blue-600"></i>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <i className="fas fa-arrow-left"></i>
              </button>
            )}
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                {candidate.first_name} {candidate.last_name}
              </h3>
              <p className="text-gray-600">ID: #{candidate.id}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusBadge(
              candidate.candidate_profiles && candidate.candidate_profiles.length > 0
                ? candidate.candidate_profiles[0].status
                : candidate.status
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <i className="fas fa-edit mr-2"></i>
            Editar
          </button>
          <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
            <i className="fas fa-file-alt mr-2"></i>
            Ver Aplicaciones
          </button>
          <button className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
            <i className="fas fa-folder mr-2"></i>
            Ver Documentos
          </button>
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            <i className="fas fa-sticky-note mr-2"></i>
            Ver Notas
          </button>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información Básica */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <i className="fas fa-info-circle text-blue-600 mr-2"></i>
              Información Básica
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{candidate.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Teléfono</p>
                <p className="font-medium">{candidate.phone || "-"}</p>
              </div>
              {candidate.alternative_phone && (
                <div>
                  <p className="text-sm text-gray-500">Teléfono Alternativo</p>
                  <p className="font-medium">{candidate.alternative_phone}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">Ubicación</p>
                <p className="font-medium">
                  {candidate.city && candidate.state
                    ? `${candidate.city}, ${candidate.state}`
                    : candidate.city || candidate.state || "-"}
                </p>
              </div>
              {candidate.address && (
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Dirección</p>
                  <p className="font-medium">{candidate.address}</p>
                </div>
              )}
            </div>
          </div>

          {/* Experiencia Laboral */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <i className="fas fa-briefcase text-blue-600 mr-2"></i>
              Experiencia Laboral
            </h4>
            <div className="space-y-3">
              {candidate.current_position && (
                <div>
                  <p className="text-sm text-gray-500">Posición Actual</p>
                  <p className="font-medium">{candidate.current_position}</p>
                </div>
              )}
              {candidate.current_company && (
                <div>
                  <p className="text-sm text-gray-500">Empresa Actual</p>
                  <p className="font-medium">{candidate.current_company}</p>
                </div>
              )}
              {candidate.years_of_experience !== null && (
                <div>
                  <p className="text-sm text-gray-500">Años de Experiencia</p>
                  <p className="font-medium">{candidate.years_of_experience} años</p>
                </div>
              )}
            </div>
          </div>

          {/* Educación */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <i className="fas fa-graduation-cap text-blue-600 mr-2"></i>
              Educación
            </h4>
            <div className="space-y-3">
              {candidate.education_level && (
                <div>
                  <p className="text-sm text-gray-500">Nivel Educativo</p>
                  <p className="font-medium capitalize">{candidate.education_level}</p>
                </div>
              )}
              {candidate.university && (
                <div>
                  <p className="text-sm text-gray-500">Universidad</p>
                  <p className="font-medium">{candidate.university}</p>
                </div>
              )}
              {candidate.degree && (
                <div>
                  <p className="text-sm text-gray-500">Título</p>
                  <p className="font-medium">{candidate.degree}</p>
                </div>
              )}
            </div>
          </div>

          {/* Habilidades */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <i className="fas fa-brain text-blue-600 mr-2"></i>
              Habilidades y Competencias
            </h4>

            {candidate.skills && candidate.skills.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Habilidades:</p>
                <div className="flex flex-wrap gap-2">
                  {candidate.skills.map((skill, idx) => (
                    <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {candidate.languages && candidate.languages.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Idiomas:</p>
                <div className="flex flex-wrap gap-2">
                  {candidate.languages.map((lang: any, idx) => (
                    <span key={idx} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                      {typeof lang === 'string' ? lang : `${lang.idioma || ''} ${lang.nivel ? `(${lang.nivel})` : ''}`}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {candidate.certifications && candidate.certifications.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Certificaciones:</p>
                <div className="flex flex-wrap gap-2">
                  {candidate.certifications.map((cert, idx) => (
                    <span key={idx} className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
                      {cert}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Notas Internas */}
          {candidate.internal_notes && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <i className="fas fa-sticky-note text-blue-600 mr-2"></i>
                Notas Internas
              </h4>
              <p className="text-gray-700 whitespace-pre-line">{candidate.internal_notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Expectativas Salariales */}
          {(candidate.salary_expectation_min || candidate.salary_expectation_max) && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Expectativa Salarial</h4>
              <div className="space-y-2">
                <p className="text-2xl font-bold text-gray-900">
                  {candidate.salary_expectation_min && candidate.salary_expectation_max
                    ? `$${candidate.salary_expectation_min.toLocaleString()} - $${candidate.salary_expectation_max.toLocaleString()}`
                    : candidate.salary_expectation_min
                    ? `$${candidate.salary_expectation_min.toLocaleString()}+`
                    : `Hasta $${candidate.salary_expectation_max?.toLocaleString()}`}
                </p>
                <p className="text-sm text-gray-500">{candidate.salary_currency || "MXN"}</p>
              </div>
            </div>
          )}

          {/* Disponibilidad */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Disponibilidad</h4>
            <div className="space-y-3">
              {candidate.available_from && (
                <div>
                  <p className="text-sm text-gray-500">Disponible desde</p>
                  <p className="font-medium">
                    {new Date(candidate.available_from).toLocaleDateString()}
                  </p>
                </div>
              )}
              {candidate.notice_period_days !== null && (
                <div>
                  <p className="text-sm text-gray-500">Período de Aviso</p>
                  <p className="font-medium">{candidate.notice_period_days} días</p>
                </div>
              )}
            </div>
          </div>

          {/* Enlaces */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Enlaces</h4>
            <div className="space-y-3">
              {candidate.linkedin_url && (
                <a
                  href={candidate.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-blue-600 hover:text-blue-800"
                >
                  <i className="fab fa-linkedin mr-2"></i>
                  LinkedIn
                </a>
              )}
              {candidate.portfolio_url && (
                <a
                  href={candidate.portfolio_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-blue-600 hover:text-blue-800"
                >
                  <i className="fas fa-briefcase mr-2"></i>
                  Portafolio
                </a>
              )}
              {candidate.github_url && (
                <a
                  href={candidate.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-blue-600 hover:text-blue-800"
                >
                  <i className="fab fa-github mr-2"></i>
                  GitHub
                </a>
              )}
            </div>
          </div>

          {/* Información Adicional */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Información Adicional</h4>
            <div className="space-y-3">
              {candidate.source && (
                <div>
                  <p className="text-sm text-gray-500">Fuente</p>
                  <p className="font-medium capitalize">{candidate.source}</p>
                </div>
              )}
              {candidate.assigned_to_name && (
                <div>
                  <p className="text-sm text-gray-500">Asignado a</p>
                  <p className="font-medium">{candidate.assigned_to_name}</p>
                </div>
              )}
              {candidate.created_at && (
                <div>
                  <p className="text-sm text-gray-500">Registrado</p>
                  <p className="font-medium">
                    {new Date(candidate.created_at).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
