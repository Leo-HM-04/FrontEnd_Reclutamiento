"use client";

import React, { useState, useEffect } from "react";
import { apiClient } from "@/lib/api";
import { useModal } from "@/context/ModalContext";

interface Client {
  id?: number;
  company_name?: string;
  rfc?: string;
  industry?: string;
  website?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  contact_position?: string;
  address_street?: string;
  address_city?: string;
  address_state?: string;
  address_zip?: string;
  address_country?: string;
  is_active?: boolean;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  assigned_to_id?: number;
  created_by_id?: number;
  assigned_to_name?: string;
  created_by_name?: string;
}

interface ClientDetailProps {
  clientId: number;
  onBack: () => void;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
}

export default function ClientDetail({ clientId, onBack, onEdit, onDelete }: ClientDetailProps) {
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const { showConfirm, showAlert, showSuccess, showError } = useModal();

  useEffect(() => {
    loadClient();
  }, [clientId]);

  const loadClient = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getClient(clientId);
      setClient(data as Client);
    } catch (error) {
      console.error("Error loading client:", error);
      await showError("Error al cargar el cliente");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (onEdit && client?.id) {
      onEdit(client.id);
    }
  };

  const handleDelete = async () => {
    if (!client?.id) return;
    
    const confirmed = await showConfirm(`¿Estás seguro de que deseas eliminar el cliente "${client.company_name}"?`);
    if (confirmed) {
      try {
        await apiClient.deleteClient(client.id);
        await showSuccess("Cliente eliminado exitosamente");
        onBack();
      } catch (error) {
        console.error("Error deleting client:", error);
        await showError("Error al eliminar el cliente");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <i className="fas fa-spinner fa-spin text-4xl text-green-600 mr-4"></i>
        <span className="text-gray-600">Cargando información del cliente...</span>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <i className="fas fa-exclamation-triangle text-5xl text-gray-300 mb-4"></i>
        <p className="text-gray-500">No se pudo cargar la información del cliente</p>
        <button
          onClick={onBack}
          className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Volver a la lista
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mr-4">
              {(client.company_name?.[0] || 'C').toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{client.company_name || 'Sin nombre'}</h2>
              <p className="text-gray-600">ID: {client.id} | RFC: {client.rfc || 'No especificado'}</p>
              <div className="flex items-center mt-2 space-x-2">
                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  client.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {client.is_active ? 'Activo' : 'Inactivo'}
                </span>
                {client.industry && (
                  <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {client.industry}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={onBack}
          className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium flex items-center"
        >
          <i className="fas fa-arrow-left mr-2"></i>
          Volver
        </button>
        {onEdit && (
          <button
            onClick={handleEdit}
            className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium flex items-center"
          >
            <i className="fas fa-edit mr-2"></i>
            Editar
          </button>
        )}
        {onDelete && (
          <button
            onClick={handleDelete}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium flex items-center"
          >
            <i className="fas fa-trash mr-2"></i>
            Eliminar
          </button>
        )}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información de la Empresa */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <i className="fas fa-building text-green-600 mr-2"></i>
              Información de la Empresa
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Nombre de la Empresa</label>
                <p className="text-gray-900 mt-1">{client.company_name || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">RFC</label>
                <p className="text-gray-900 mt-1">{client.rfc || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Industria</label>
                <p className="text-gray-900 mt-1">{client.industry || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Sitio Web</label>
                <p className="text-gray-900 mt-1">
                  {client.website ? (
                    <a 
                      href={client.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-green-600 hover:text-green-700 hover:underline"
                    >
                      {client.website}
                      <i className="fas fa-external-link-alt ml-1 text-xs"></i>
                    </a>
                  ) : '-'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Estado</label>
                <p className="mt-1">
                  <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    client.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {client.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Información de Contacto */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <i className="fas fa-user text-green-600 mr-2"></i>
              Información de Contacto
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Nombre del Contacto</label>
                <p className="text-gray-900 mt-1">{client.contact_name || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Posición</label>
                <p className="text-gray-900 mt-1">{client.contact_position || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-gray-900 mt-1">
                  {client.contact_email ? (
                    <a 
                      href={`mailto:${client.contact_email}`}
                      className="text-green-600 hover:text-green-700 hover:underline"
                    >
                      {client.contact_email}
                    </a>
                  ) : '-'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Teléfono</label>
                <p className="text-gray-900 mt-1">
                  {client.contact_phone ? (
                    <a 
                      href={`tel:${client.contact_phone}`}
                      className="text-green-600 hover:text-green-700 hover:underline"
                    >
                      {client.contact_phone}
                    </a>
                  ) : '-'}
                </p>
              </div>
            </div>
          </div>

          {/* Dirección */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <i className="fas fa-map-marker-alt text-green-600 mr-2"></i>
              Dirección
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-500">Calle</label>
                <p className="text-gray-900 mt-1">{client.address_street || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Ciudad</label>
                <p className="text-gray-900 mt-1">{client.address_city || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Estado</label>
                <p className="text-gray-900 mt-1">{client.address_state || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Código Postal</label>
                <p className="text-gray-900 mt-1">{client.address_zip || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">País</label>
                <p className="text-gray-900 mt-1">{client.address_country || '-'}</p>
              </div>
            </div>
          </div>

          {/* Notas */}
          {client.notes && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <i className="fas fa-sticky-note text-green-600 mr-2"></i>
                Notas
              </h3>
              <p className="text-gray-700 whitespace-pre-wrap">{client.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar - 1 column */}
        <div className="lg:col-span-1 space-y-6">
          {/* Asignación */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <i className="fas fa-user-tie text-green-600 mr-2"></i>
              Asignación
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Asignado a</label>
                <p className="text-gray-900 mt-1">
                  {client.assigned_to_name || client.assigned_to_id ? (
                    <span className="flex items-center">
                      <i className="fas fa-user-circle text-green-600 mr-2"></i>
                      {client.assigned_to_name || `Usuario #${client.assigned_to_id}`}
                    </span>
                  ) : (
                    <span className="text-gray-500">Sin asignar</span>
                  )}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Creado por</label>
                <p className="text-gray-900 mt-1">
                  {client.created_by_name || client.created_by_id ? (
                    <span className="flex items-center">
                      <i className="fas fa-user-circle text-green-600 mr-2"></i>
                      {client.created_by_name || `Usuario #${client.created_by_id}`}
                    </span>
                  ) : (
                    <span className="text-gray-500">Desconocido</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Fechas */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <i className="fas fa-calendar text-green-600 mr-2"></i>
              Fechas
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Creado</label>
                <p className="text-gray-900 mt-1">
                  {client.created_at ? new Date(client.created_at).toLocaleString('es-MX', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : '-'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Última actualización</label>
                <p className="text-gray-900 mt-1">
                  {client.updated_at ? new Date(client.updated_at).toLocaleString('es-MX', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : '-'}
                </p>
              </div>
            </div>
          </div>

          {/* Acciones Rápidas */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <i className="fas fa-bolt text-green-600 mr-2"></i>
              Acciones Rápidas
            </h3>
            <div className="space-y-2">
              {client.contact_email && (
                <a
                  href={`mailto:${client.contact_email}`}
                  className="w-full px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 font-medium flex items-center justify-center"
                >
                  <i className="fas fa-envelope mr-2"></i>
                  Enviar Email
                </a>
              )}
              {client.contact_phone && (
                <a
                  href={`tel:${client.contact_phone}`}
                  className="w-full px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 font-medium flex items-center justify-center"
                >
                  <i className="fas fa-phone mr-2"></i>
                  Llamar
                </a>
              )}
              {client.website && (
                <a
                  href={client.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 font-medium flex items-center justify-center"
                >
                  <i className="fas fa-globe mr-2"></i>
                  Visitar Sitio Web
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
