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

export default function CandidateEvaluations() {
  const [evaluations, setEvaluations] = useState<CandidateEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const statusOptions = [
    { value: "pending", label: "Pendiente", color: "yellow" },
    { value: "in_progress", label: "En Progreso", color: "blue" },
    { value: "completed", label: "Completada", color: "green" },
    { value: "reviewed", label: "Revisada", color: "purple" },
    { value: "expired", label: "Expirada", color: "red" }
  ];

  useEffect(() => {
    fetchEvaluations();
  }, []);

  const fetchEvaluations = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost:8000/api/evaluations/candidate-evaluations/",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setEvaluations(data);
      }
    } catch (error) {
      console.error("Error fetching evaluations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (id: number) => {
    try {
      const token = localStorage.getItem("token");
      // Aquí iría la lógica para abrir un modal de revisión
      console.log("Review evaluation:", id);
    } catch (error) {
      console.error("Error reviewing evaluation:", error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar esta evaluación?")) return;

    try {
      const token = localStorage.getItem("token");
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
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
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
            className="mt-4 sm:mt-0 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <i className="fas fa-plus mr-2"></i>
            Asignar Evaluación
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {statusOptions.map((status) => {
            const count = evaluations.filter((e) => e.status === status.value).length;
            return (
              <div key={status.value} className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-600">{status.label}</p>
                <p className="text-2xl font-bold text-gray-900">{count}</p>
              </div>
            );
          })}
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
          <i className="fas fa-clipboard-list text-5xl text-gray-300 mb-4"></i>
          <p className="text-gray-600">No se encontraron evaluaciones</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Candidato
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Evaluación
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Estado
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Puntuación
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Fecha Límite
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredEvaluations.map((evaluation) => (
                <tr key={evaluation.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <i className="fas fa-user text-blue-600 text-sm"></i>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {evaluation.candidate_name || `ID ${evaluation.candidate}`}
                        </p>
                        <p className="text-xs text-gray-500">
                          Asignada por: {evaluation.assigned_by_name}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-900">
                      {evaluation.template_name || `Plantilla ${evaluation.template}`}
                    </p>
                  </td>
                  <td className="px-4 py-3">{getStatusBadge(evaluation.status)}</td>
                  <td className="px-4 py-3">
                    {evaluation.final_score !== undefined ? (
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
                        onClick={() => handleReview(evaluation.id)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        title="Ver detalles"
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                      {evaluation.status === "completed" && (
                        <button
                          onClick={() => handleReview(evaluation.id)}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded"
                          title="Revisar"
                        >
                          <i className="fas fa-check-square"></i>
                        </button>
                      )}
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
    </div>
  );
}
