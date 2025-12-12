"use client";

import { useState } from "react";

type ClientView = 
  | "clients-list" 
  | "client-create"
  | "client-detail"
  | "contacts" 
  | "contracts"
  | "history"
  | "statistics";

interface MenuItem {
  id: ClientView;
  label: string;
  icon: string;
  description: string;
}

interface ClientsMainProps {
  onClose?: () => void;
}

export default function ClientsMain({ onClose }: ClientsMainProps) {
  const [currentView, setCurrentView] = useState<ClientView>("clients-list");
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>("");

  const menuItems: MenuItem[] = [
    {
      id: "clients-list",
      label: "Ver Clientes",
      icon: "fa-building",
      description: "Ver y gestionar todos los clientes"
    },
    {
      id: "contacts",
      label: "Contactos",
      icon: "fa-address-book",
      description: "Gestionar contactos de clientes"
    },
    {
      id: "contracts",
      label: "Contratos",
      icon: "fa-file-contract",
      description: "Contratos y acuerdos"
    },
    {
      id: "history",
      label: "Historial",
      icon: "fa-history",
      description: "Historial de interacciones"
    },
    {
      id: "statistics",
      label: "Estadísticas",
      icon: "fa-chart-bar",
      description: "Métricas y estadísticas de clientes"
    }
  ];

  const getNavClass = (view: ClientView) => {
    return currentView === view
      ? "bg-green-50 text-green-700 border-l-4 border-green-600"
      : "text-gray-700 hover:bg-gray-50 border-l-4 border-transparent";
  };

  const handleViewClient = (clientId: number) => {
    setSelectedClientId(clientId);
    setCurrentView("client-detail");
  };

  const handleBackToList = () => {
    setSelectedClientId(null);
    setCurrentView("clients-list");
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Gestión de Clientes</h2>
            <p className="text-gray-600 mt-1">
              Sistema completo para gestionar clientes y contactos
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
              Menú de Clientes
            </h3>
            <nav className="space-y-1">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentView(item.id);
                    setSelectedClientId(null);
                  }}
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
            {currentView === "clients-list" && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Lista de Clientes</h3>
                <div className="text-center py-12 text-gray-500">
                  <i className="fas fa-building text-5xl mb-4 text-gray-300"></i>
                  <p className="text-lg">Vista de clientes en desarrollo</p>
                  <p className="text-sm mt-2">Aquí se mostrará la lista de clientes</p>
                </div>
              </div>
            )}

            {currentView === "contacts" && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Contactos</h3>
                <div className="text-center py-12 text-gray-500">
                  <i className="fas fa-address-book text-5xl mb-4 text-gray-300"></i>
                  <p className="text-lg">Vista de contactos en desarrollo</p>
                  <p className="text-sm mt-2">Aquí se mostrarán los contactos de clientes</p>
                </div>
              </div>
            )}

            {currentView === "contracts" && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Contratos</h3>
                <div className="text-center py-12 text-gray-500">
                  <i className="fas fa-file-contract text-5xl mb-4 text-gray-300"></i>
                  <p className="text-lg">Vista de contratos en desarrollo</p>
                  <p className="text-sm mt-2">Aquí se mostrarán los contratos</p>
                </div>
              </div>
            )}

            {currentView === "history" && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Historial</h3>
                <div className="text-center py-12 text-gray-500">
                  <i className="fas fa-history text-5xl mb-4 text-gray-300"></i>
                  <p className="text-lg">Vista de historial en desarrollo</p>
                  <p className="text-sm mt-2">Aquí se mostrará el historial de interacciones</p>
                </div>
              </div>
            )}

            {currentView === "statistics" && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Estadísticas</h3>
                <div className="text-center py-12 text-gray-500">
                  <i className="fas fa-chart-bar text-5xl mb-4 text-gray-300"></i>
                  <p className="text-lg">Vista de estadísticas en desarrollo</p>
                  <p className="text-sm mt-2">Aquí se mostrarán las métricas de clientes</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in">
          <div className="bg-white rounded-lg shadow-xl border-l-4 border-green-500 p-4 max-w-md">
            <div className="flex items-center">
              <i className="fas fa-check-circle text-green-500 text-xl mr-3"></i>
              <p className="text-gray-800">{successMessage}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
