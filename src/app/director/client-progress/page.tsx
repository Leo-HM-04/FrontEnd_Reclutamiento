'use client';

import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faLightbulb,
  faUsers,
  faChartBar,
  faCog,
  faBullseye,
  faCheckCircle,
  faSpinner,
  faCircle,
  faBuilding,
  faCalendarAlt,
  faUserTie,
  faTrophy,
  faChartLine,
} from '@fortawesome/free-solid-svg-icons';

interface Client {
  id: number;
  name: string;
  company: string;
  startDate: string;
  currentPhase: number;
  completionPercentage: number;
  assignedTo: string;
}

interface Phase {
  id: number;
  name: string;
  icon: any;
  description: string;
  status: 'completed' | 'in-progress' | 'pending';
  completionDate?: string;
}

export default function ClientProgressPage() {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Datos de ejemplo de clientes
  const clients: Client[] = [
    {
      id: 1,
      name: 'Proyecto TechCorp',
      company: 'TechCorp Industries',
      startDate: '2025-01-15',
      currentPhase: 3,
      completionPercentage: 60,
      assignedTo: 'Juan Pérez',
    },
    {
      id: 2,
      name: 'Reclutamiento StartupXYZ',
      company: 'StartupXYZ',
      startDate: '2025-02-01',
      currentPhase: 2,
      completionPercentage: 40,
      assignedTo: 'María García',
    },
    {
      id: 3,
      name: 'Expansión GlobalTech',
      company: 'GlobalTech Solutions',
      startDate: '2025-01-20',
      currentPhase: 4,
      completionPercentage: 80,
      assignedTo: 'Carlos Rodríguez',
    },
  ];

  // Fases del proceso
  const phases: Phase[] = [
    {
      id: 1,
      name: 'Definición de Necesidades',
      icon: faLightbulb,
      description: 'Análisis inicial y definición de requisitos del cliente',
      status: selectedClient ? (selectedClient.currentPhase > 1 ? 'completed' : selectedClient.currentPhase === 1 ? 'in-progress' : 'pending') : 'pending',
      completionDate: selectedClient && selectedClient.currentPhase > 1 ? '15/01/2025' : undefined,
    },
    {
      id: 2,
      name: 'Búsqueda y Selección',
      icon: faUsers,
      description: 'Reclutamiento activo y filtrado de candidatos',
      status: selectedClient ? (selectedClient.currentPhase > 2 ? 'completed' : selectedClient.currentPhase === 2 ? 'in-progress' : 'pending') : 'pending',
      completionDate: selectedClient && selectedClient.currentPhase > 2 ? '25/01/2025' : undefined,
    },
    {
      id: 3,
      name: 'Evaluación',
      icon: faChartBar,
      description: 'Entrevistas y evaluaciones técnicas',
      status: selectedClient ? (selectedClient.currentPhase > 3 ? 'completed' : selectedClient.currentPhase === 3 ? 'in-progress' : 'pending') : 'pending',
      completionDate: selectedClient && selectedClient.currentPhase > 3 ? '05/02/2025' : undefined,
    },
    {
      id: 4,
      name: 'Proceso de Onboarding',
      icon: faCog,
      description: 'Integración y capacitación del personal',
      status: selectedClient ? (selectedClient.currentPhase > 4 ? 'completed' : selectedClient.currentPhase === 4 ? 'in-progress' : 'pending') : 'pending',
      completionDate: selectedClient && selectedClient.currentPhase > 4 ? '15/02/2025' : undefined,
    },
    {
      id: 5,
      name: 'Cierre y Seguimiento',
      icon: faBullseye,
      description: 'Finalización del proyecto y seguimiento post-colocación',
      status: selectedClient ? (selectedClient.currentPhase > 5 ? 'completed' : selectedClient.currentPhase === 5 ? 'in-progress' : 'pending') : 'pending',
      completionDate: selectedClient && selectedClient.currentPhase > 5 ? '28/02/2025' : undefined,
    },
  ];

  const getPhaseColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100 border-green-300';
      case 'in-progress':
        return 'text-blue-600 bg-blue-100 border-blue-300';
      default:
        return 'text-gray-400 bg-gray-100 border-gray-300';
    }
  };

  const getPhaseIconColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'in-progress':
        return 'text-blue-600';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return faCheckCircle;
      case 'in-progress':
        return faSpinner;
      default:
        return faCircle;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            <FontAwesomeIcon icon={faChartLine} className="mr-3 text-blue-600" />
            Avance de Cliente
          </h1>
          <p className="text-gray-600">
            Visualiza el progreso de los procesos de reclutamiento para cada cliente
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de Clientes */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Clientes Activos</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {clients.map((client) => (
                  <button
                    key={client.id}
                    onClick={() => setSelectedClient(client)}
                    className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                      selectedClient?.id === client.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{client.name}</h3>
                        <p className="text-sm text-gray-600 mb-2 flex items-center">
                          <FontAwesomeIcon icon={faBuilding} className="w-3 h-3 mr-2" />
                          {client.company}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center">
                          <FontAwesomeIcon icon={faUserTie} className="w-3 h-3 mr-2" />
                          {client.assignedTo}
                        </p>
                      </div>
                      <div className="ml-4 text-right">
                        <div className="text-2xl font-bold text-blue-600">{client.completionPercentage}%</div>
                        <div className="text-xs text-gray-500">Completado</div>
                      </div>
                    </div>
                    
                    {/* Barra de progreso */}
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${client.completionPercentage}%` }}
                        />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Estadísticas rápidas */}
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="text-3xl font-bold text-green-600 mb-1">3</div>
                <div className="text-sm text-gray-600">Clientes Activos</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="text-3xl font-bold text-blue-600 mb-1">60%</div>
                <div className="text-sm text-gray-600">Progreso Promedio</div>
              </div>
            </div>
          </div>

          {/* Timeline de Progreso */}
          <div className="lg:col-span-2">
            {selectedClient ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                {/* Header del cliente seleccionado */}
                <div className="mb-8 pb-6 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{selectedClient.name}</h2>
                      <p className="text-gray-600 flex items-center mt-1">
                        <FontAwesomeIcon icon={faBuilding} className="w-4 h-4 mr-2" />
                        {selectedClient.company}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-bold text-blue-600">{selectedClient.completionPercentage}%</div>
                      <div className="text-sm text-gray-500">Progreso Total</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <FontAwesomeIcon icon={faCalendarAlt} className="w-4 h-4 mr-2 text-gray-400" />
                      Inicio: {new Date(selectedClient.startDate).toLocaleDateString('es-ES')}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <FontAwesomeIcon icon={faUserTie} className="w-4 h-4 mr-2 text-gray-400" />
                      Asignado a: {selectedClient.assignedTo}
                    </div>
                  </div>
                </div>

                {/* Timeline de Fases */}
                <div className="space-y-6">
                  {phases.map((phase, index) => (
                    <div key={phase.id} className="relative">
                      {/* Línea conectora */}
                      {index < phases.length - 1 && (
                        <div
                          className={`absolute left-8 top-16 w-0.5 h-full ${
                            phase.status === 'completed' ? 'bg-green-300' : 'bg-gray-300'
                          }`}
                        />
                      )}

                      <div className="flex items-start">
                        {/* Icono de fase */}
                        <div
                          className={`relative z-10 flex items-center justify-center w-16 h-16 rounded-full border-4 ${getPhaseColor(
                            phase.status
                          )}`}
                        >
                          <FontAwesomeIcon
                            icon={phase.icon}
                            className={`text-2xl ${getPhaseIconColor(phase.status)}`}
                          />
                        </div>

                        {/* Contenido de la fase */}
                        <div className="ml-6 flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{phase.name}</h3>
                            <div className="flex items-center">
                              <FontAwesomeIcon
                                icon={getStatusIcon(phase.status)}
                                className={`w-5 h-5 mr-2 ${
                                  phase.status === 'in-progress' ? 'animate-spin' : ''
                                } ${getPhaseIconColor(phase.status)}`}
                              />
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  phase.status === 'completed'
                                    ? 'bg-green-100 text-green-800'
                                    : phase.status === 'in-progress'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {phase.status === 'completed'
                                  ? 'Completado'
                                  : phase.status === 'in-progress'
                                  ? 'En Progreso'
                                  : 'Pendiente'}
                              </span>
                            </div>
                          </div>
                          
                          <p className="text-gray-600 text-sm mb-3">{phase.description}</p>
                          
                          {phase.completionDate && (
                            <p className="text-xs text-gray-500 flex items-center">
                              <FontAwesomeIcon icon={faCheckCircle} className="w-3 h-3 mr-2 text-green-600" />
                              Completado el {phase.completionDate}
                            </p>
                          )}

                          {/* Detalles adicionales para fase en progreso */}
                          {phase.status === 'in-progress' && (
                            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                              <p className="text-sm font-semibold text-blue-900 mb-2">Acciones Actuales:</p>
                              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                                <li>Revisión de perfiles en progreso</li>
                                <li>3 entrevistas programadas esta semana</li>
                                <li>Evaluación técnica pendiente</li>
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer con botón de acción */}
                <div className="mt-8 pt-6 border-t border-gray-200 flex justify-between items-center">
                  <button className="px-6 py-2.5 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors font-medium">
                    Ver Detalles Completos
                  </button>
                  <button className="px-6 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium flex items-center">
                    <FontAwesomeIcon icon={faTrophy} className="mr-2" />
                    Generar Reporte
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <FontAwesomeIcon icon={faChartLine} className="text-6xl text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Selecciona un Cliente</h3>
                <p className="text-gray-600">
                  Selecciona un cliente de la lista para ver el progreso detallado de su proceso
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
