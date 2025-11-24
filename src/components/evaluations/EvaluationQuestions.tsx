"use client";

import { useState, useEffect } from "react";

interface EvaluationQuestion {
  id: number;
  template: number;
  template_name?: string;
  question_text: string;
  question_type: string;
  options: string[];
  correct_answer?: string;
  points: number;
  order: number;
  is_required: boolean;
}

export default function EvaluationQuestions() {
  const [questions, setQuestions] = useState<EvaluationQuestion[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const questionTypes = [
    { value: "multiple_choice", label: "Opción Múltiple" },
    { value: "true_false", label: "Verdadero/Falso" },
    { value: "short_answer", label: "Respuesta Corta" },
    { value: "essay", label: "Ensayo" },
    { value: "rating", label: "Calificación" }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
  setLoading(true);
  try {
    const token = localStorage.getItem("token");

    // Fetch templates
    const templatesRes = await fetch("http://localhost:8000/api/evaluations/templates/", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const templatesData: any = await templatesRes.json();
    console.log("templatesData", templatesData);

    const normalizedTemplates = Array.isArray(templatesData)
      ? templatesData
      : Array.isArray(templatesData.results)
      ? templatesData.results
      : Array.isArray(templatesData.templates)
      ? templatesData.templates
      : [];

    setTemplates(normalizedTemplates);

    // Fetch questions
    const questionsRes = await fetch("http://localhost:8000/api/evaluations/questions/", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const questionsData: any = await questionsRes.json();
    console.log("questionsData", questionsData);

    const normalizedQuestions = Array.isArray(questionsData)
      ? questionsData
      : Array.isArray(questionsData.results)
      ? questionsData.results
      : Array.isArray(questionsData.questions)
      ? questionsData.questions
      : [];

    setQuestions(normalizedQuestions);
  } catch (error) {
    console.error("Error fetching data:", error);
  } finally {
    setLoading(false);
  }
};



  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar esta pregunta?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:8000/api/evaluations/questions/${id}/`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        setQuestions(questions.filter((q) => q.id !== id));
      }
    } catch (error) {
      console.error("Error deleting question:", error);
    }
  };

  const filteredQuestions = questions.filter((question) => {
    const matchesSearch = question.question_text
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesTemplate =
      selectedTemplate === "all" || question.template === parseInt(selectedTemplate);
    return matchesSearch && matchesTemplate;
  });

  const getQuestionTypeLabel = (type: string) => {
    return questionTypes.find((t) => t.value === type)?.label || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-blue-600 mb-4"></i>
          <p className="text-gray-600">Cargando preguntas...</p>
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
            <h3 className="text-xl font-bold text-gray-900">Preguntas de Evaluación</h3>
            <p className="text-sm text-gray-600 mt-1">
              {questions.length} preguntas registradas
            </p>
          </div>
          <button
            className="mt-4 sm:mt-0 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <i className="fas fa-plus mr-2"></i>
            Nueva Pregunta
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar preguntas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todas las plantillas</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Questions List */}
      {filteredQuestions.length === 0 ? (
        <div className="text-center py-12">
          <i className="fas fa-question-circle text-5xl text-gray-300 mb-4"></i>
          <p className="text-gray-600">No se encontraron preguntas</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQuestions.map((question, index) => (
            <div
              key={question.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-blue-700">
                      {question.order}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                        {getQuestionTypeLabel(question.question_type)}
                      </span>
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                        {question.points} pts
                      </span>
                      {question.is_required && (
                        <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded">
                          Obligatoria
                        </span>
                      )}
                    </div>
                    <p className="text-gray-900 font-medium mb-2">{question.question_text}</p>
                    
                    {/* Options for multiple choice */}
                    {question.question_type === "multiple_choice" && question.options && (
                      <div className="mt-3 space-y-2">
                        {question.options.map((option, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm">
                            <div className="w-6 h-6 border-2 border-gray-300 rounded-full flex items-center justify-center">
                              <span className="text-xs text-gray-600">
                                {String.fromCharCode(65 + idx)}
                              </span>
                            </div>
                            <span className="text-gray-700">{option}</span>
                            {question.correct_answer === option && (
                              <i className="fas fa-check text-green-600 text-xs"></i>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <p className="text-xs text-gray-500 mt-2">
                      Plantilla: {question.template_name || `ID ${question.template}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                    <i className="fas fa-edit"></i>
                  </button>
                  <button
                    onClick={() => handleDelete(question.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
