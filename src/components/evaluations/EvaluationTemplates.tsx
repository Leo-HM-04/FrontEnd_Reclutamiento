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
  const [questionCount, setQuestionCount] = useState(0);

  const categories = [
    { value: "technical", label: "Técnica" },
    { value: "behavioral", label: "Conductual" },
    { value: "cognitive", label: "Cognitiva" },
    { value: "cultural", label: "Cultural Fit" },
    { value: "leadership", label: "Liderazgo" },
    { value: "other", label: "Otra" }
  ];

  const questionTypes = [
    { value: "multiple_choice", label: "Opción Múltiple" },
    { value: "true_false", label: "Verdadero/Falso" },
    { value: "short_answer", label: "Respuesta Corta" },
    { value: "essay", label: "Ensayo" },
    { value: "rating", label: "Calificación" }
  ];

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("http://localhost:8000/api/evaluations/templates/", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setTemplates(Array.isArray(data) ? data : data.results || []);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar?")) return;
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`http://localhost:8000/api/evaluations/templates/${id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) setTemplates(templates.filter((t) => t.id !== id));
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleDuplicate = async (id: number) => {
    try {
      const token = localStorage.getItem("authToken");
      await fetch(`http://localhost:8000/api/evaluations/templates/${id}/duplicate/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchTemplates();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const addQuestion = () => {
    const container = document.getElementById("questions-container");
    const index = questionCount;
    
    const questionDiv = document.createElement("div");
    questionDiv.setAttribute("data-question-index", index.toString());
    questionDiv.className = "border border-gray-300 rounded-lg p-4 mb-4 bg-white";
    questionDiv.innerHTML = `
      <div class="flex justify-between items-center mb-3">
        <h5 class="font-semibold text-gray-900">Pregunta ${index + 1}</h5>
        <button type="button" onclick="this.parentElement.parentElement.remove()" class="text-red-600 hover:text-red-800">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <div class="space-y-3">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Pregunta *</label>
          <textarea name="question_text_${index}" rows="2" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"></textarea>
        </div>

        <div class="grid grid-cols-3 gap-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
            <select name="question_type_${index}" onchange="handleQuestionTypeChange(${index}, this.value)" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option value="multiple_choice">Opción Múltiple</option>
              <option value="true_false">Verdadero/Falso</option>
              <option value="short_answer">Respuesta Corta</option>
              <option value="essay">Ensayo</option>
              <option value="rating">Calificación</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Puntos *</label>
            <input type="number" name="points_${index}" value="10" min="0" step="0.5" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Orden</label>
            <input type="number" name="order_${index}" value="${index}" min="0" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
        </div>

        <div id="options_section_${index}">
          <label class="block text-sm font-medium text-gray-700 mb-1">Opciones (una por línea) *</label>
          <textarea name="options_${index}" rows="4" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="A) Opción 1&#10;B) Opción 2&#10;C) Opción 3&#10;D) Opción 4"></textarea>
        </div>

        <div id="answer_section_${index}">
          <label class="block text-sm font-medium text-gray-700 mb-1">Respuesta Correcta</label>
          <input type="text" name="correct_answer_${index}" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Ej: A)" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Texto de Ayuda (opcional)</label>
          <input type="text" name="help_text_${index}" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>

        <div class="flex items-center">
          <input type="checkbox" name="is_required_${index}" id="required_${index}" class="h-4 w-4 rounded" />
          <label for="required_${index}" class="ml-2 text-sm">Obligatoria</label>
        </div>
      </div>
    `;
    
    container?.appendChild(questionDiv);
    setQuestionCount(index + 1);
  };

  useEffect(() => {
    (window as any).handleQuestionTypeChange = (index: number, type: string) => {
      const optionsSection = document.getElementById(`options_section_${index}`);
      const answerSection = document.getElementById(`answer_section_${index}`);
      
      if (optionsSection && answerSection) {
        if (type === "multiple_choice") {
          optionsSection.style.display = "block";
          answerSection.style.display = "block";
          answerSection.innerHTML = `
            <label class="block text-sm font-medium text-gray-700 mb-1">Respuesta Correcta</label>
            <input type="text" name="correct_answer_${index}" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Ej: A)" />
          `;
        } else if (type === "true_false") {
          optionsSection.style.display = "none";
          answerSection.style.display = "block";
          answerSection.innerHTML = `
            <label class="block text-sm font-medium text-gray-700 mb-1">Respuesta Correcta</label>
            <select name="correct_answer_${index}" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option value="">Seleccionar...</option>
              <option value="Verdadero">Verdadero</option>
              <option value="Falso">Falso</option>
            </select>
          `;
        } else {
          optionsSection.style.display = "none";
          answerSection.style.display = "none";
        }
      }
    };
  }, []);

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
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Plantillas de Evaluación</h3>
            <p className="text-sm text-gray-600 mt-1">{templates.length} plantillas</p>
          </div>
          <button onClick={() => { setSelectedTemplate(null); setShowModal(true); setQuestionCount(0); }} className="mt-4 sm:mt-0 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <i className="fas fa-plus mr-2"></i>Nueva Plantilla
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="flex-1 px-4 py-2 border rounded-lg" />
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="px-4 py-2 border rounded-lg">
            <option value="all">Todas</option>
            {categories.map((cat) => (<option key={cat.value} value={cat.value}>{cat.label}</option>))}
          </select>
        </div>
      </div>

      {filteredTemplates.length === 0 ? (
        <div className="text-center py-12">
          <i className="fas fa-file-alt text-6xl text-gray-300 mb-4"></i>
          <p className="text-gray-500">No hay plantillas</p>
          <button onClick={() => { setShowModal(true); setQuestionCount(0); }} className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg">
            <i className="fas fa-plus mr-2"></i>Crear primera plantilla
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTemplates.map((template) => (
            <div key={template.id} className="bg-white border rounded-lg p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900">{template.title}</h4>
                    {template.is_active ? (
                      <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded">Activa</span>
                    ) : (
                      <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">Inactiva</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{template.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div><span className="text-gray-500">Categoría:</span><p className="font-medium">{categories.find((c) => c.value === template.category)?.label}</p></div>
                <div><span className="text-gray-500">Duración:</span><p className="font-medium">{template.duration_minutes} min</p></div>
                <div><span className="text-gray-500">Puntaje mínimo:</span><p className="font-medium">{template.passing_score}%</p></div>
                <div><span className="text-gray-500">Preguntas:</span><p className="font-medium">{template.questions_count || 0}</p></div>
              </div>

              <div className="flex gap-2 pt-3 border-t">
                <button onClick={() => { setSelectedTemplate(template); setShowModal(true); }} className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100"><i className="fas fa-edit mr-2"></i>Editar</button>
                <button onClick={() => handleDuplicate(template.id)} className="px-3 py-2 text-sm bg-gray-50 text-gray-700 rounded hover:bg-gray-100"><i className="fas fa-copy"></i></button>
                <button onClick={() => handleDelete(template.id)} className="px-3 py-2 text-sm bg-red-50 text-red-700 rounded hover:bg-red-100"><i className="fas fa-trash"></i></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">{selectedTemplate ? "Editar" : "Nueva"} Plantilla</h3>
                <button onClick={() => { setShowModal(false); setSelectedTemplate(null); }} className="text-gray-400 hover:text-gray-600">
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
                  const token = localStorage.getItem("authToken");
                  const url = selectedTemplate ? `http://localhost:8000/api/evaluations/templates/${selectedTemplate.id}/` : "http://localhost:8000/api/evaluations/templates/";
                  const response = await fetch(url, { method: selectedTemplate ? "PUT" : "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(data) });

                  if (response.ok) {
                    const createdTemplate = await response.json();
                    
                    if (!selectedTemplate) {
                      const questionElements = document.querySelectorAll('[data-question-index]');
                      if (questionElements.length > 0) {
                        const questions: any[] = [];
                        
                        questionElements.forEach((el: any) => {
                          const index = el.getAttribute('data-question-index');
                          const questionText = (document.querySelector(`[name="question_text_${index}"]`) as HTMLTextAreaElement)?.value;
                          const questionType = (document.querySelector(`[name="question_type_${index}"]`) as HTMLSelectElement)?.value;
                          const points = parseFloat((document.querySelector(`[name="points_${index}"]`) as HTMLInputElement)?.value || "10");
                          const order = parseInt((document.querySelector(`[name="order_${index}"]`) as HTMLInputElement)?.value || "0");
                          const isRequired = (document.querySelector(`[name="is_required_${index}"]`) as HTMLInputElement)?.checked || false;
                          const helpText = (document.querySelector(`[name="help_text_${index}"]`) as HTMLInputElement)?.value || "";
                          
                          let options: string[] = [];
                          let correctAnswer = "";
                          
                          if (questionType === "multiple_choice") {
                            const optionsText = (document.querySelector(`[name="options_${index}"]`) as HTMLTextAreaElement)?.value;
                            options = optionsText ? optionsText.split("\n").filter(opt => opt.trim()) : [];
                            correctAnswer = (document.querySelector(`[name="correct_answer_${index}"]`) as HTMLInputElement)?.value || "";
                          } else if (questionType === "true_false") {
                            options = ["Verdadero", "Falso"];
                            correctAnswer = (document.querySelector(`[name="correct_answer_${index}"]`) as HTMLSelectElement)?.value || "";
                          }
                          
                          if (questionText) {
                            questions.push({
                              question_text: questionText,
                              question_type: questionType,
                              options: options,
                              correct_answer: correctAnswer || null,
                              points: points,
                              order: order,
                              is_required: isRequired,
                              help_text: helpText
                            });
                          }
                        });

                        if (questions.length > 0) {
                          await fetch("http://localhost:8000/api/evaluations/questions/bulk_create/", {
                            method: "POST",
                            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                            body: JSON.stringify({ template_id: createdTemplate.id, questions: questions }),
                          });
                        }
                      }
                    }

                    await fetchTemplates();
                    setShowModal(false);
                    setSelectedTemplate(null);
                    alert("✅ " + (selectedTemplate ? "Actualizada" : `Creada con ${questionCount} preguntas`));
                  } else {
                    alert("❌ Error: " + JSON.stringify(await response.json()));
                  }
                } catch (error) {
                  alert("❌ Error al guardar");
                }
              }}>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-2">Título *</label>
                    <input type="text" name="title" defaultValue={selectedTemplate?.title || ""} required className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-2">Descripción</label>
                    <textarea name="description" defaultValue={selectedTemplate?.description || ""} rows={2} className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Categoría *</label>
                    <select name="category" defaultValue={selectedTemplate?.category || "technical"} required className="w-full px-3 py-2 border rounded-lg">
                      {categories.map((cat) => (<option key={cat.value} value={cat.value}>{cat.label}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Duración (min) *</label>
                    <input type="number" name="duration_minutes" defaultValue={selectedTemplate?.duration_minutes || 60} required min="1" className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Puntaje mínimo (%) *</label>
                    <input type="number" name="passing_score" defaultValue={selectedTemplate?.passing_score || 70} required min="0" max="100" step="0.01" className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" name="is_active" id="is_active" defaultChecked={selectedTemplate?.is_active !== false} className="h-4 w-4" />
                    <label htmlFor="is_active" className="ml-2 text-sm">Activa</label>
                  </div>
                </div>

                {!selectedTemplate && (
                  <div className="mt-6 border-t pt-6">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-lg font-semibold">Preguntas</h4>
                      <button type="button" onClick={addQuestion} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                        <i className="fas fa-plus mr-2"></i>Agregar Pregunta
                      </button>
                    </div>
                    <div id="questions-container"></div>
                  </div>
                )}

                <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
                  <button type="button" onClick={() => { setShowModal(false); setSelectedTemplate(null); }} className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">Cancelar</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{selectedTemplate ? "Actualizar" : "Crear"}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}