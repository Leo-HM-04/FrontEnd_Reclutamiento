"use client";

import { useState, useEffect } from "react";

interface CandidateEvaluation {
  id: number;
  candidate: number;
  candidate_name?: string;
  template: number;
  template_name?: string;
  status: string;
  started_at?: string;
  completed_at?: string;
  expires_at?: string;
  final_score?: number;
  passed?: boolean;
  assigned_by_name?: string;
}

interface Template {
  id: number;
  title: string;
  description: string;
  category: string;
  duration_minutes: number;
  passing_score: number;
}

interface Candidate {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

export default function CandidateEvaluations() {
  const [evaluations, setEvaluations] = useState<CandidateEvaluation[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);

  const statusOptions = [
    { value: "pending", label: "Pendiente", color: "yellow" },
    { value: "in_progress", label: "En Progreso", color: "blue" },
    { value: "completed", label: "Completada", color: "green" },
    { value: "reviewed", label: "Revisada", color: "purple" },
    { value: "expired", label: "Expirada", color: "red" }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");

      // Fetch evaluations
      const evalRes = await fetch(
        "http://localhost:8000/api/evaluations/candidate-evaluations/",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (evalRes.ok) {
        const evalData = await evalRes.json();
        setEvaluations(Array.isArray(evalData) ? evalData : evalData.results || []);
      }

      // Fetch templates
      const templatesRes = await fetch(
        "http://localhost:8000/api/evaluations/templates/",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (templatesRes.ok) {
        const templatesData = await templatesRes.json();
        setTemplates(Array.isArray(templatesData) ? templatesData : templatesData.results || []);
      }

      // Fetch candidates
      const candidatesRes = await fetch(
        "http://localhost:8000/api/candidates/candidates/",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (candidatesRes.ok) {
        const candidatesData = await candidatesRes.json();
        setCandidates(Array.isArray(candidatesData) ? candidatesData : candidatesData.results || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar esta evaluación?")) return;

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        `http://localhost:8000/api/evaluations/candidate-evaluations/${id}/`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        setEvaluations(evaluations.filter((e) => e.id !== id));
      }
    } catch (error) {
      console.error("Error deleting evaluation:", error);
    }
  };

  const filteredEvaluations = evaluations.filter((evaluation) => {
    const matchesSearch =
      evaluation.candidate_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evaluation.template_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || evaluation.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const statusInfo = statusOptions.find((s) => s.value === status);
    const colors = {
      yellow: "bg-yellow-100 text-yellow-700",
      blue: "bg-blue-100 text-blue-700",
      green: "bg-green-100 text-green-700",
      purple: "bg-purple-100 text-purple-700",
      red: "bg-red-100 text-red-700"
    };
    const colorClass = colors[statusInfo?.color as keyof typeof colors] || colors.yellow;
    
    return (
      <span className={`px-2 py-1 text-xs rounded ${colorClass}`}>
        {statusInfo?.label || status}
      </span>
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-blue-600 mb-4"></i>
          <p className="text-gray-600">Cargando evaluaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Evaluaciones de Candidatos</h3>
            <p className="text-sm text-gray-600 mt-1">
              {evaluations.length} evaluaciones asignadas
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 sm:mt-0 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <i className="fas fa-plus mr-2"></i>
            Asignar Evaluación
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar por candidato o plantilla..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos los estados</option>
            {statusOptions.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Evaluations Table */}
      {filteredEvaluations.length === 0 ? (
        <div className="text-center py-12">
          <i className="fas fa-clipboard-list text-6xl text-gray-300 mb-4"></i>
          <p className="text-gray-500 text-lg">No se encontraron evaluaciones</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Candidato
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Plantilla
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Estado
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Calificación
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Fecha Límite
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEvaluations.map((evaluation) => (
                <tr key={evaluation.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{evaluation.candidate_name}</p>
                    {evaluation.assigned_by_name && (
                      <p className="text-xs text-gray-500">
                        Asignado por: {evaluation.assigned_by_name}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-900">{evaluation.template_name}</p>
                  </td>
                  <td className="px-4 py-3">{getStatusBadge(evaluation.status)}</td>
                  <td className="px-4 py-3">
                    {evaluation.final_score !== undefined && evaluation.final_score !== null ? (
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-gray-900">
                          {evaluation.final_score.toFixed(1)}%
                        </span>
                        {evaluation.passed !== undefined && (
                          <span>
                            {evaluation.passed ? (
                              <i className="fas fa-check-circle text-green-600"></i>
                            ) : (
                              <i className="fas fa-times-circle text-red-600"></i>
                            )}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">Pendiente</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-600">{formatDate(evaluation.expires_at)}</p>
                    {evaluation.completed_at && (
                      <p className="text-xs text-gray-500">
                        Completada: {formatDate(evaluation.completed_at)}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        title="Ver detalles"
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                      <button
                        onClick={() => handleDelete(evaluation.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
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
      )}

      {/* Modal para Asignar Evaluación */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Asignar Evaluación a Candidato</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);

                  // Calcular fecha de expiración (7 días desde ahora)
                  const expiresAt = new Date();
                  const daysToExpire = parseInt(formData.get("days_to_expire") as string) || 7;
                  expiresAt.setDate(expiresAt.getDate() + daysToExpire);

                  const data = {
                    template: parseInt(formData.get("template") as string),
                    candidate: parseInt(formData.get("candidate") as string),
                    expires_at: expiresAt.toISOString(),
                  };

                  try {
                    const token = localStorage.getItem("authToken");
                    const response = await fetch(
                      "http://localhost:8000/api/evaluations/candidate-evaluations/",
                      {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify(data),
                      }
                    );

                    if (response.ok) {
                      await fetchData();
                      setShowModal(false);
                      alert("Evaluación asignada exitosamente");
                    } else {
                      const error = await response.json();
                      alert("Error: " + JSON.stringify(error));
                    }
                  } catch (error) {
                    console.error("Error:", error);
                    alert("Error al asignar evaluación");
                  }
                }}
              >
                <div className="space-y-4">
                  {/* Seleccionar Plantilla */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Plantilla de Evaluación *
                    </label>
                    <select
                      name="template"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Seleccionar plantilla...</option>
                      {templates.map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.title} ({template.duration_minutes} min - {template.category})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Seleccionar Candidato */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Candidato *
                    </label>
                    <select
                      name="candidate"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Seleccionar candidato...</option>
                      {candidates.map((candidate) => (
                        <option key={candidate.id} value={candidate.id}>
                          {candidate.first_name} {candidate.last_name} - {candidate.email}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Días para expirar */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Días para completar la evaluación
                    </label>
                    <input
                      type="number"
                      name="days_to_expire"
                      defaultValue={7}
                      min="1"
                      max="90"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      El candidato tendrá este número de días para completar la evaluación
                    </p>
                  </div>
                </div>

                {/* Botones */}
                <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Asignar Evaluación
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}