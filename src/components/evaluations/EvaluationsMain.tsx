"use client";

import { useState } from "react";
import EvaluationTemplates from "./EvaluationTemplates";
import EvaluationQuestions from "./EvaluationQuestions";
import CandidateEvaluations from "./CandidateEvaluations";
import EvaluationAnswers from "./EvaluationAnswers";
import EvaluationComments from "./EvaluationComments";

type EvaluationView = 
  | "templates" 
  | "questions" 
  | "candidate-evaluations" 
  | "answers" 
  | "comments";

interface EvaluationsMainProps {
  onClose?: () => void;
}

export default function EvaluationsMain({ onClose }: EvaluationsMainProps) {
  const [currentView, setCurrentView] = useState<EvaluationView>("templates");

  const menuItems = [
    {
      id: "templates" as EvaluationView,
      label: "Plantillas de evaluación",
      icon: "fa-file-alt",
      description: "Gestionar plantillas de evaluación"
    },
    {
      id: "questions" as EvaluationView,
      label: "Preguntas de evaluación",
      icon: "fa-question-circle",
      description: "Administrar preguntas"
    },
    {
      id: "candidate-evaluations" as EvaluationView,
      label: "Evaluaciones de candidatos",
      icon: "fa-user-check",
      description: "Ver evaluaciones asignadas"
    },
    {
      id: "answers" as EvaluationView,
      label: "Respuestas de evaluación",
      icon: "fa-comment-dots",
      description: "Revisar respuestas"
    },
    {
      id: "comments" as EvaluationView,
      label: "Comentarios de evaluación",
      icon: "fa-comments",
      description: "Gestionar comentarios"
    }
  ];

  const getNavClass = (view: EvaluationView) => {
    return currentView === view
      ? "bg-blue-50 text-blue-700 border-l-4 border-blue-600"
      : "text-gray-700 hover:bg-gray-50 border-l-4 border-transparent";
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Sistema de Evaluaciones</h2>
            <p className="text-gray-600 mt-1">
              Gestión completa de evaluaciones para candidatos
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
              Menú de Evaluaciones
            </h3>
            <nav className="space-y-1">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
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
            {currentView === "templates" && <EvaluationTemplates />}
            {currentView === "questions" && <EvaluationQuestions />}
            {currentView === "candidate-evaluations" && <CandidateEvaluations />}
            {currentView === "answers" && <EvaluationAnswers />}
            {currentView === "comments" && <EvaluationComments />}
          </div>
        </div>
      </div>
    </div>
  );
}
