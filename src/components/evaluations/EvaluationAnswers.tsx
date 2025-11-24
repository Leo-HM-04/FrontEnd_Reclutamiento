"use client";

import { useState, useEffect } from "react";

interface EvaluationAnswer {
  id: number;
  evaluation: number;
  evaluation_info?: string;
  question: number;
  question_text?: string;
  answer_text?: string;
  selected_option?: string;
  rating?: number;
  points_earned: number;
  max_points: number;
  feedback?: string;
  answered_at?: string;
}

export default function EvaluationAnswers() {
  const [answers, setAnswers] = useState<EvaluationAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvaluation, setSelectedEvaluation] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchAnswers();
  }, []);

  const fetchAnswers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8000/api/evaluations/answers/", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setAnswers(data);
      }
    } catch (error) {
      console.error("Error fetching answers:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAnswers = answers.filter((answer) => {
    const matchesSearch =
      answer.question_text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      answer.answer_text?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEvaluation =
      selectedEvaluation === "all" || answer.evaluation === parseInt(selectedEvaluation);
    return matchesSearch && matchesEvaluation;
  });

  const getScoreColor = (earned: number, max: number) => {
    const percentage = (earned / max) * 100;
    if (percentage >= 80) return "text-green-600";
    if (percentage >= 60) return "text-yellow-600";
    return "text-red-600";
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
          <p className="text-gray-600">Cargando respuestas...</p>
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
            <h3 className="text-xl font-bold text-gray-900">Respuestas de Evaluación</h3>
            <p className="text-sm text-gray-600 mt-1">
              {answers.length} respuestas registradas
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-green-50 rounded-lg p-4 border border-green-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 font-medium">Respuestas Correctas</p>
                <p className="text-2xl font-bold text-green-900">
                  {answers.filter((a) => a.points_earned === a.max_points).length}
                </p>
              </div>
              <i className="fas fa-check-circle text-3xl text-green-400"></i>
            </div>
          </div>

          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-700 font-medium">Respuestas Parciales</p>
                <p className="text-2xl font-bold text-yellow-900">
                  {
                    answers.filter(
                      (a) => a.points_earned > 0 && a.points_earned < a.max_points
                    ).length
                  }
                </p>
              </div>
              <i className="fas fa-exclamation-circle text-3xl text-yellow-400"></i>
            </div>
          </div>

          <div className="bg-red-50 rounded-lg p-4 border border-red-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-700 font-medium">Respuestas Incorrectas</p>
                <p className="text-2xl font-bold text-red-900">
                  {answers.filter((a) => a.points_earned === 0).length}
                </p>
              </div>
              <i className="fas fa-times-circle text-3xl text-red-400"></i>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar respuestas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Answers List */}
      {filteredAnswers.length === 0 ? (
        <div className="text-center py-12">
          <i className="fas fa-comment-dots text-5xl text-gray-300 mb-4"></i>
          <p className="text-gray-600">No se encontraron respuestas</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAnswers.map((answer) => (
            <div
              key={answer.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                      Evaluación #{answer.evaluation}
                    </span>
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                      Pregunta #{answer.question}
                    </span>
                  </div>
                  
                  <h4 className="font-medium text-gray-900 mb-2">
                    {answer.question_text || "Pregunta sin texto"}
                  </h4>
                  
                  {/* Answer content */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-2">
                    {answer.answer_text && (
                      <p className="text-sm text-gray-700">{answer.answer_text}</p>
                    )}
                    {answer.selected_option && (
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Opción seleccionada:</span> {answer.selected_option}
                      </p>
                    )}
                    {answer.rating !== undefined && (
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-gray-600">Calificación:</span>
                        {[...Array(5)].map((_, i) => (
                          <i
                            key={i}
                            className={`fas fa-star ${
                              i < answer.rating! ? "text-yellow-400" : "text-gray-300"
                            }`}
                          ></i>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Score */}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Puntuación:</span>
                      <span
                        className={`font-bold ${getScoreColor(
                          answer.points_earned,
                          answer.max_points
                        )}`}
                      >
                        {answer.points_earned} / {answer.max_points}
                      </span>
                    </div>
                    
                    {answer.answered_at && (
                      <div className="flex items-center gap-2 text-gray-500">
                        <i className="fas fa-clock text-xs"></i>
                        <span>{formatDate(answer.answered_at)}</span>
                      </div>
                    )}
                  </div>

                  {/* Feedback */}
                  {answer.feedback && (
                    <div className="mt-3 bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
                      <p className="text-xs text-blue-700 font-medium mb-1">Retroalimentación:</p>
                      <p className="text-sm text-blue-900">{answer.feedback}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
