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
        console.log("Templates data:", data);
        setTemplates(Array.isArray(data) ? data : data.results || []);
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
          <i className="fas fa-file-alt text-6xl text-gray-300 mb-4"></i>
          <p className="text-gray-500 text-lg">No se encontraron plantillas</p>
          <button
            onClick={() => {
              setSelectedTemplate(null);
              setShowModal(true);
            }}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <i className="fas fa-plus mr-2"></i>
            Crear primera plantilla
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow"
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

      {/* Modal para Crear/Editar Plantilla */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  {selectedTemplate ? "Editar Plantilla" : "Nueva Plantilla"}
                </h3>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedTemplate(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                
                const data = {
                  title: formData.get("title"),
                  description: formData.get("description"),
                  category: formData.get("category"),
                  duration_minutes: parseInt(formData.get("duration_minutes") as string),
                  passing_score: parseFloat(formData.get("passing_score") as string),
                  is_active: formData.get("is_active") === "on",
                  is_template: true
                };

                try {
                  const token = localStorage.getItem("token");
                  const url = selectedTemplate
                    ? `http://localhost:8000/api/evaluations/templates/${selectedTemplate.id}/`
                    : "http://localhost:8000/api/evaluations/templates/";
                  
                  const method = selectedTemplate ? "PUT" : "POST";

                  const response = await fetch(url, {
                    method,
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(data),
                  });

                  if (response.ok) {
                    await fetchTemplates();
                    setShowModal(false);
                    setSelectedTemplate(null);
                    alert(selectedTemplate ? "Plantilla actualizada exitosamente" : "Plantilla creada exitosamente");
                  } else {
                    const error = await response.json();
                    alert("Error: " + JSON.stringify(error));
                  }
                } catch (error) {
                  console.error("Error:", error);
                  alert("Error al guardar la plantilla");
                }
              }}>
                <div className="space-y-4">
                  {/* Título */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Título *
                    </label>
                    <input
                      type="text"
                      name="title"
                      defaultValue={selectedTemplate?.title || ""}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Ej: Evaluación Python Senior"
                    />
                  </div>

                  {/* Descripción */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descripción
                    </label>
                    <textarea
                      name="description"
                      defaultValue={selectedTemplate?.description || ""}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Descripción de la evaluación"
                    />
                  </div>

                  {/* Categoría */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Categoría *
                    </label>
                    <select
                      name="category"
                      defaultValue={selectedTemplate?.category || "technical"}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {categories.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Duración */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duración (minutos) *
                    </label>
                    <input
                      type="number"
                      name="duration_minutes"
                      defaultValue={selectedTemplate?.duration_minutes || 60}
                      required
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Puntaje mínimo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Puntaje Mínimo Aprobatorio (%) *
                    </label>
                    <input
                      type="number"
                      name="passing_score"
                      defaultValue={selectedTemplate?.passing_score || 70}
                      required
                      min="0"
                      max="100"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Activa */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_active"
                      id="is_active"
                      defaultChecked={selectedTemplate?.is_active !== false}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                      Plantilla activa
                    </label>
                  </div>
                </div>

                {/* Botones */}
                <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setSelectedTemplate(null);
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {selectedTemplate ? "Actualizar" : "Crear"} Plantilla
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