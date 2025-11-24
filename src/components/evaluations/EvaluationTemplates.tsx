"use client";

import { useState, useEffect } from "react";

interface EvaluationTemplate {
  id: number;
  title: string;
  description: string;
  category: string;
  duration_minutes: number;
  passing_score: number;
  is_active: boolean;
  is_template: boolean;
  created_at: string;
  questions_count?: number;
}

export default function EvaluationTemplates() {
  const [templates, setTemplates] = useState<EvaluationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EvaluationTemplate | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  const categories = [
    { value: "technical", label: "Técnica" },
    { value: "behavioral", label: "Conductual" },
    { value: "cognitive", label: "Cognitiva" },
    { value: "cultural", label: "Cultural Fit" },
    { value: "leadership", label: "Liderazgo" },
    { value: "other", label: "Otra" }
  ];

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8000/api/evaluations/templates/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar esta plantilla?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:8000/api/evaluations/templates/${id}/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        setTemplates(templates.filter((t) => t.id !== id));
      }
    } catch (error) {
      console.error("Error deleting template:", error);
    }
  };

  const handleDuplicate = async (id: number) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:8000/api/evaluations/templates/${id}/duplicate/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        fetchTemplates();
      }
    } catch (error) {
      console.error("Error duplicating template:", error);
    }
  };

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch = template.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || template.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-blue-600 mb-4"></i>
          <p className="text-gray-600">Cargando plantillas...</p>
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
            <h3 className="text-xl font-bold text-gray-900">Plantillas de Evaluación</h3>
            <p className="text-sm text-gray-600 mt-1">
              {templates.length} plantillas disponibles
            </p>
          </div>
          <button
            onClick={() => {
              setSelectedTemplate(null);
              setShowModal(true);
            }}
            className="mt-4 sm:mt-0 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <i className="fas fa-plus mr-2"></i>
            Nueva Plantilla
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar plantillas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todas las categorías</option>
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="text-center py-12">
          <i className="fas fa-inbox text-5xl text-gray-300 mb-4"></i>
          <p className="text-gray-600">No se encontraron plantillas</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900">{template.title}</h4>
                    {template.is_active ? (
                      <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded">
                        Activa
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                        Inactiva
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <span className="text-gray-500">Categoría:</span>
                  <p className="font-medium text-gray-900">
                    {categories.find((c) => c.value === template.category)?.label || template.category}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Duración:</span>
                  <p className="font-medium text-gray-900">{template.duration_minutes} min</p>
                </div>
                <div>
                  <span className="text-gray-500">Puntaje mínimo:</span>
                  <p className="font-medium text-gray-900">{template.passing_score}%</p>
                </div>
                <div>
                  <span className="text-gray-500">Preguntas:</span>
                  <p className="font-medium text-gray-900">{template.questions_count || 0}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
                <button
                  onClick={() => {
                    setSelectedTemplate(template);
                    setShowModal(true);
                  }}
                  className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                >
                  <i className="fas fa-edit mr-2"></i>
                  Editar
                </button>
                <button
                  onClick={() => handleDuplicate(template.id)}
                  className="px-3 py-2 text-sm bg-gray-50 text-gray-700 rounded hover:bg-gray-100"
                >
                  <i className="fas fa-copy"></i>
                </button>
                <button
                  onClick={() => handleDelete(template.id)}
                  className="px-3 py-2 text-sm bg-red-50 text-red-700 rounded hover:bg-red-100"
                >
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
