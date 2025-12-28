"use client";

import React, { useState, useEffect } from "react";
import { apiClient } from "@/lib/api";
import ClientDetail from "./ClientDetail";
import ClientForm from "./ClientForm";
import AddContactModal from "./AddContactModal";


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
  
  // Data states
  const [clients, setClients] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [showContactModal, setShowContactModal] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Filtros para clients-list
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [industryFilter, setIndustryFilter] = useState("all");

  // Load data when view changes
  useEffect(() => {
    loadData();
  }, [currentView]);

  const loadData = async () => {
    setLoading(true);
    try {
      switch (currentView) {
        case "clients-list":
          const clientsData = await apiClient.getClients();
          setClients(clientsData as any[]);
          break;
        case "contacts":
          // Los contactos se cargan junto con los clientes
          const clientsForContacts = await apiClient.getClients();
          setClients(clientsForContacts as any[]);
          break;
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

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

  const handleEditClient = (clientId: number) => {
    setSelectedClientId(clientId);
    setCurrentView("client-create");
  };

  const handleDeleteClient = async (clientId: number) => {
    if (confirm('¿Estás seguro de que deseas eliminar este cliente?')) {
      try {
        await apiClient.deleteClient(clientId);
        alert('Cliente eliminado exitosamente');
        loadData();
      } catch (error) {
        console.error('Error deleting client:', error);
        alert('Error al eliminar el cliente');
      }
    }
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
              {menuItems.map((item, index) => (
                <React.Fragment key={item.id}>
                  <button
                    onClick={() => {
                      setCurrentView(item.id);
                      setSelectedClientId(null);
                    }}
                    className={`w-full flex items-start px-3 py-3 text-sm font-medium rounded-lg transition-all ${getNavClass(
                      item.id
                    )}`}
                  >
                    <div className="shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
                        <i className={`fas ${item.icon} text-lg`}></i>
                      </div>
                    </div>
                    <div className="ml-3 flex-1 text-left">
                      <div className="font-semibold">{item.label}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{item.description}</div>
                    </div>
                  </button>
                  {index === 0 && (
                    <button
                      onClick={() => {
                        setSelectedClientId(null);
                        setCurrentView("client-create");
                      }}
                      className={`w-full flex items-start px-3 py-3 text-sm font-medium rounded-lg transition-all ${getNavClass(
                        "client-create"
                      )}`}
                    >
                      <div className="shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-lg bg-green-600 flex items-center justify-center text-white">
                          <i className="fas fa-plus text-lg"></i>
                        </div>
                      </div>
                      <div className="ml-3 flex-1 text-left">
                        <div className="font-semibold">Crear Nuevo Cliente</div>
                        <div className="text-xs text-gray-500 mt-0.5">Agregar un nuevo cliente</div>
                      </div>
                    </button>
                  )}
                </React.Fragment>
              ))}
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {/* CLIENT DETAIL */}
            {currentView === "client-detail" && selectedClientId && (
              <ClientDetail 
                clientId={selectedClientId}
                onBack={handleBackToList}
                onEdit={handleEditClient}
                onDelete={handleDeleteClient}
              />
            )}

            {/* CLIENT CREATE/EDIT FORM */}
            {currentView === "client-create" && (
              <ClientForm 
                clientId={selectedClientId || undefined}
                onSuccess={handleBackToList}
              />
            )}

            {/* CLIENTS LIST */}
            {currentView === "clients-list" && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">Todos los Clientes</h3>
                  <button 
                    onClick={loadData}
                    className="px-6 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium flex items-center gap-2"
                  >
                    <i className="fas fa-sync"></i>
                    Actualizar
                  </button>
                </div>

                {/* Filtros */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                      <i className="fas fa-search mr-2"></i>
                      Buscar
                    </label>
                    <input
                      type="text"
                      placeholder="Buscar por nombre o industria..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                      <i className="fas fa-filter mr-2"></i>
                      Estado
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="all">Todos los estados</option>
                      <option value="active">Activo</option>
                      <option value="inactive">Inactivo</option>
                    </select>
                  </div>
                  <div>
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                      <i className="fas fa-industry mr-2"></i>
                      Industria
                    </label>
                    <select
                      value={industryFilter}
                      onChange={(e) => setIndustryFilter(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="all">Todas las industrias</option>
                      {Array.from(new Set(clients.map(c => c.industry).filter(Boolean))).map(industry => (
                        <option key={industry} value={industry}>
                          {industry}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Estadísticas */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-orange-50 rounded-lg p-4">
                    <h4 className="text-orange-900 font-semibold text-sm mb-1">Total Clientes</h4>
                    <p className="text-3xl font-bold text-orange-900">
                      {clients.length}
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <h4 className="text-green-900 font-semibold text-sm mb-1">Activos</h4>
                    <p className="text-3xl font-bold text-green-900">
                      {clients.filter(c => c.is_active).length}
                    </p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="text-blue-900 font-semibold text-sm mb-1">Con Contratos</h4>
                    <p className="text-3xl font-bold text-blue-900">
                      {clients.filter(c => c.contract_status === 'active').length}
                    </p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <h4 className="text-purple-900 font-semibold text-sm mb-1">Inactivos</h4>
                    <p className="text-3xl font-bold text-purple-900">
                      {clients.filter(c => !c.is_active).length}
                    </p>
                  </div>
                </div>
                
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                    <p className="text-gray-500 mt-4">Cargando clientes...</p>
                  </div>
                ) : clients.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <i className="fas fa-building text-5xl mb-4 text-gray-300"></i>
                    <p className="text-lg">No hay clientes registrados</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              EMPRESA
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              CONTACTO
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              INDUSTRIA
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              UBICACIÓN
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              ESTADO
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              TELÉFONO
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              ACCIONES
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {clients
                            .filter(client => {
                              const matchesSearch = searchTerm === "" || 
                                client.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                client.industry?.toLowerCase().includes(searchTerm.toLowerCase());
                              const matchesStatus = statusFilter === "all" || 
                                (statusFilter === "active" && client.is_active) ||
                                (statusFilter === "inactive" && !client.is_active);
                              const matchesIndustry = industryFilter === "all" || client.industry === industryFilter;
                              return matchesSearch && matchesStatus && matchesIndustry;
                            })
                            .map((client) => (
                            <tr key={client.id} className="hover:bg-gray-50 cursor-pointer">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="shrink-0 h-10 w-10">
                                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-semibold">
                                      {(client.company_name?.[0] || 'C').toUpperCase()}
                                    </div>
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">
                                      {client.company_name}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {client.rfc || '-'}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{client.contact_name || '-'}</div>
                                <div className="text-sm text-gray-500">{client.contact_email || '-'}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{client.industry || '-'}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{client.address_city || '-'}</div>
                                <div className="text-sm text-gray-500">{client.address_state || '-'}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  client.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {client.is_active ? 'Activo' : 'Inactivo'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {client.contact_phone || '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex items-center space-x-3">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleViewClient(client.id); }}
                                    className="text-blue-600 hover:text-blue-900 transition-colors"
                                    title="Ver detalles"
                                  >
                                    <i className="fas fa-eye text-lg"></i>
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleEditClient(client.id); }}
                                    className="text-orange-600 hover:text-orange-900 transition-colors"
                                    title="Editar"
                                  >
                                    <i className="fas fa-edit text-lg"></i>
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteClient(client.id); }}
                                    className="text-red-600 hover:text-red-900 transition-colors"
                                    title="Eliminar"
                                  >
                                    <i className="fas fa-trash text-lg"></i>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {currentView === "contacts" && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">Contactos de Clientes</h3>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setShowContactModal(true)}
                      className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
                    >
                      <i className="fas fa-plus"></i>
                      Agregar Contacto
                    </button>
                    <button 
                      onClick={loadData}
                      className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center gap-2"
                    >
                      <i className="fas fa-sync"></i>
                      Actualizar
                    </button>
                  </div>
                </div>

                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                    <p className="text-gray-500 mt-4">Cargando contactos...</p>
                  </div>
                ) : clients.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <i className="fas fa-address-book text-5xl mb-4 text-gray-300"></i>
                    <p className="text-lg">No hay clientes registrados</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {clients.map((client) => (
                      <div key={client.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900">{client.company_name}</h4>
                            <p className="text-sm text-gray-500">{client.industry}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            client.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {client.is_active ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                        
                        {client.contacts && client.contacts.length > 0 ? (
                          <div className="space-y-3">
                            {client.contacts.map((contact: any) => (
                              <div key={contact.id} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-semibold">
                                    {contact.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900">{contact.name}</p>
                                    <p className="text-sm text-gray-500">{contact.position}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-gray-600">{contact.email}</p>
                                  <p className="text-sm text-gray-600">{contact.phone}</p>
                                  {contact.is_primary && (
                                    <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                                      Principal
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-4 text-gray-400">
                            <i className="fas fa-user-slash mb-2"></i>
                            <p className="text-sm">No hay contactos registrados para este cliente</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
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


      {/* Add Contact Modal */}
        {showContactModal && (
          <AddContactModal
            clients={clients}
            onClose={() => setShowContactModal(false)}
            onSuccess={() => {
              setShowContactModal(false);
              loadData();
            }}
          />
        )}
    </div>
    
  );
}
