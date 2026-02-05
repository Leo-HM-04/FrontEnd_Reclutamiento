'use client';

import { useState, useEffect } from 'react';
import { useModal } from '@/context/ModalContext';
import { apiClient } from '@/lib/api';

interface ClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (message: string) => void;
}

interface Contact {
  name: string;
  position: string;
  email: string;
  phone: string;
  is_primary: boolean;
}

export default function ClientFormModal({ isOpen, onClose, onSuccess }: ClientFormModalProps) {
  const { showAlert } = useModal();
  const [submitting, setSubmitting] = useState(false);
  
  const [clientForm, setClientForm] = useState({
    // Información de la Empresa
    company_name: '',
    rfc: '',
    industry: '',
    website: '',
    
    // Contacto Principal
    contact_name: '',
    contact_position: '',
    contact_email: '',
    contact_phone: '',
    
    // Dirección
    address_street: '',
    address_city: '',
    address_state: '',
    address_zip: '',
    address_country: 'México',
    
    // Gestión
    assigned_to: null,
    is_active: true,
    notes: '',
  });

  const [contacts, setContacts] = useState<Contact[]>([]);

  const resetForm = () => {
    setClientForm({
      company_name: '',
      rfc: '',
      industry: '',
      website: '',
      contact_name: '',
      contact_position: '',
      contact_email: '',
      contact_phone: '',
      address_street: '',
      address_city: '',
      address_state: '',
      address_zip: '',
      address_country: 'México',
      assigned_to: null,
      is_active: true,
      notes: '',
    });
    setContacts([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones
    if (!clientForm.company_name.trim()) {
      await showAlert('Por favor ingresa el nombre de la empresa');
      return;
    }

    if (!clientForm.rfc.trim()) {
      await showAlert('Por favor ingresa el RFC');
      return;
    }

    if (!clientForm.contact_email.trim()) {
      await showAlert('Por favor ingresa el email del contacto');
      return;
    }

    try {
      setSubmitting(true);

      const clientData = {
        ...clientForm,
        assigned_to: clientForm.assigned_to || undefined,
        contacts: contacts.length > 0 ? contacts : undefined,
      };

      console.log('📝 Creando cliente...');
      console.log('🔍 Datos del cliente:', clientData);
      
      const response = await apiClient.createClient(clientData);
      
      console.log('✅ Cliente creado exitosamente:', response);
      
      if (onSuccess) {
        onSuccess("Cliente creado exitosamente");
      }
      
      resetForm();
      onClose();
    } catch (error: any) {
      console.error('❌ Error al crear cliente:', error);
      await showAlert(`Error al crear cliente: ${error.message || 'Error desconocido'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const addContact = () => {
    setContacts([...contacts, {
      name: '',
      position: '',
      email: '',
      phone: '',
      is_primary: contacts.length === 0, // El primero es primario por defecto
    }]);
  };

  const removeContact = (index: number) => {
    setContacts(contacts.filter((_, i) => i !== index));
  };

  const updateContact = (index: number, field: keyof Contact, value: string | boolean) => {
    const updatedContacts = [...contacts];
    updatedContacts[index] = { ...updatedContacts[index], [field]: value };
    setContacts(updatedContacts);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0  flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden">
        {/* Header - Degradado azul */}
        <div className="bg-linear-to-r from-blue-50 via-blue-100 to-indigo-50 px-6 py-5 shadow-lg border-b-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-500 p-4 rounded-xl shadow-lg">
                <i className="fas fa-building text-3xl text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Agregar Cliente</h2>
                <p className="text-gray-600 text-sm mt-1 font-semibold">Administra empresas y organizaciones clientes</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white bg-red-500 hover:bg-red-600 p-3 rounded-lg transition-all duration-200 group shadow-lg"
              title="Cerrar"
              disabled={submitting}
            >
              <i className="fas fa-times text-xl group-hover:rotate-90 transition-transform duration-200" />
            </button>
          </div>
        </div>

        {/* Formulario con scroll */}
        <div className="p-6 bg-gray-50 overflow-y-auto max-h-[calc(95vh-120px)]">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* INFORMACIÓN DE LA EMPRESA */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-blue-500/10 border-b-2 border-blue-500 px-5 py-3.5">
                <h3 className="text-lg font-bold text-blue-800 tracking-wide flex items-center">
                  <i className="fas fa-building mr-2.5 text-xl" />
                  INFORMACIÓN DE LA EMPRESA
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Nombre de la Empresa <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={clientForm.company_name}
                      onChange={(e) => setClientForm({ ...clientForm, company_name: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-gray-800"
                      placeholder="Nombre de la empresa"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      RFC <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={clientForm.rfc}
                      onChange={(e) => setClientForm({ ...clientForm, rfc: e.target.value.toUpperCase() })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-gray-800"
                      placeholder="RFC de 12 o 13 caracteres"
                      maxLength={13}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Industria/Sector
                    </label>
                    <input
                      type="text"
                      value={clientForm.industry}
                      onChange={(e) => setClientForm({ ...clientForm, industry: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-gray-800"
                      placeholder="Ej: Tecnología, Finanzas, Retail"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Sitio Web
                    </label>
                    <input
                      type="url"
                      value={clientForm.website}
                      onChange={(e) => setClientForm({ ...clientForm, website: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-gray-800"
                      placeholder="https://ejemplo.com"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* CONTACTO PRINCIPAL */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-teal-500/10 border-b-2 border-teal-500 px-5 py-3.5">
                <h3 className="text-lg font-bold text-teal-800 tracking-wide flex items-center">
                  <i className="fas fa-user-tie mr-2.5 text-xl" />
                  CONTACTO PRINCIPAL
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Nombre del Contacto
                    </label>
                    <input
                      type="text"
                      value={clientForm.contact_name}
                      onChange={(e) => setClientForm({ ...clientForm, contact_name: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all bg-white text-gray-800"
                      placeholder="Nombre completo"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Puesto
                    </label>
                    <input
                      type="text"
                      value={clientForm.contact_position}
                      onChange={(e) => setClientForm({ ...clientForm, contact_position: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all bg-white text-gray-800"
                      placeholder="Ej: Gerente de Recursos Humanos"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Email del Contacto <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={clientForm.contact_email}
                      onChange={(e) => setClientForm({ ...clientForm, contact_email: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all bg-white text-gray-800"
                      placeholder="contacto@empresa.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={clientForm.contact_phone}
                      onChange={(e) => setClientForm({ ...clientForm, contact_phone: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all bg-white text-gray-800"
                      placeholder="+52 123 456 7890"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* DIRECCIÓN */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-purple-500/10 border-b-2 border-purple-500 px-5 py-3.5">
                <h3 className="text-lg font-bold text-purple-800 tracking-wide flex items-center">
                  <i className="fas fa-map-marker-alt mr-2.5 text-xl" />
                  DIRECCIÓN
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Calle
                    </label>
                    <input
                      type="text"
                      value={clientForm.address_street}
                      onChange={(e) => setClientForm({ ...clientForm, address_street: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all bg-white text-gray-800"
                      placeholder="Calle y número"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Ciudad
                    </label>
                    <input
                      type="text"
                      value={clientForm.address_city}
                      onChange={(e) => setClientForm({ ...clientForm, address_city: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all bg-white text-gray-800"
                      placeholder="Ciudad"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Estado
                    </label>
                    <input
                      type="text"
                      value={clientForm.address_state}
                      onChange={(e) => setClientForm({ ...clientForm, address_state: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all bg-white text-gray-800"
                      placeholder="Estado"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Código Postal
                    </label>
                    <input
                      type="text"
                      value={clientForm.address_zip}
                      onChange={(e) => setClientForm({ ...clientForm, address_zip: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all bg-white text-gray-800"
                      placeholder="Código postal"
                      maxLength={10}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      País
                    </label>
                    <input
                      type="text"
                      value={clientForm.address_country}
                      onChange={(e) => setClientForm({ ...clientForm, address_country: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all bg-white text-gray-800"
                      placeholder="País"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* GESTIÓN */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-indigo-500/10 border-b-2 border-indigo-500 px-5 py-3.5">
                <h3 className="text-lg font-bold text-indigo-800 tracking-wide flex items-center">
                  <i className="fas fa-cogs mr-2.5 text-xl" />
                  GESTIÓN
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={clientForm.is_active}
                      onChange={(e) => setClientForm({ ...clientForm, is_active: e.target.checked })}
                      className="w-5 h-5 text-green-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                    />
                    <span className="text-sm font-bold text-gray-700 group-hover:text-green-600 transition-colors flex items-center gap-1">
                      <i className="fas fa-check-circle text-green-500"></i>
                      Cliente Activo
                    </span>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Notas
                  </label>
                  <textarea
                    value={clientForm.notes}
                    onChange={(e) => setClientForm({ ...clientForm, notes: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none text-gray-800"
                    rows={3}
                    placeholder="Notas adicionales sobre el cliente..."
                  />
                </div>
              </div>
            </div>

            {/* CONTACTOS ADICIONALES */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-orange-500/10 border-b-2 border-orange-500 px-5 py-3.5">
                <h3 className="text-lg font-bold text-orange-800 tracking-wide flex items-center">
                  <i className="fas fa-users mr-2.5 text-xl" />
                  CONTACTOS ADICIONALES
                </h3>
              </div>
              <div className="p-6">
                {contacts.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    No hay contactos adicionales. Haz clic en "Agregar Contacto" para añadir uno.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {contacts.map((contact, index) => (
                      <div key={index} className="bg-white p-4 rounded-lg border-2 border-gray-200 relative">
                        <button
                          type="button"
                          onClick={() => removeContact(index)}
                          className="absolute top-2 right-2 text-red-500 hover:text-red-700 transition-colors"
                        >
                          <i className="fas fa-times-circle text-xl"></i>
                        </button>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">
                              Nombre
                            </label>
                            <input
                              type="text"
                              value={contact.name}
                              onChange={(e) => updateContact(index, 'name', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-sm"
                              placeholder="Nombre completo"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">
                              Puesto
                            </label>
                            <input
                              type="text"
                              value={contact.position}
                              onChange={(e) => updateContact(index, 'position', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-sm"
                              placeholder="Puesto"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">
                              Email
                            </label>
                            <input
                              type="email"
                              value={contact.email}
                              onChange={(e) => updateContact(index, 'email', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-sm"
                              placeholder="email@ejemplo.com"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">
                              Teléfono
                            </label>
                            <input
                              type="tel"
                              value={contact.phone}
                              onChange={(e) => updateContact(index, 'phone', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-sm"
                              placeholder="+52 123 456 7890"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={contact.is_primary}
                                onChange={(e) => updateContact(index, 'is_primary', e.target.checked)}
                                className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-2 focus:ring-orange-500"
                              />
                              <span className="text-xs font-semibold text-gray-700">
                                Contacto Principal
                              </span>
                            </label>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  onClick={addContact}
                  className="mt-4 w-full px-4 py-3 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors font-bold flex items-center justify-center gap-2"
                >
                  <i className="fas fa-plus-circle"></i>
                  Agregar otro Contacto
                </button>
              </div>
            </div>

            {/* Botones */}
            <div className="flex justify-between items-center pt-4 border-t-2 border-gray-200 bg-white p-6 rounded-xl -mx-6 -mb-6">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  onClose();
                }}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-bold flex items-center gap-2"
                disabled={submitting}
              >
                <i className="fas fa-times"></i>
                Cancelar
              </button>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-bold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save"></i>
                      Guardar
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={async (e) => {
                    e.preventDefault();
                    await handleSubmit(e as any);
                    resetForm();
                  }}
                  disabled={submitting}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-bold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <i className="fas fa-plus-circle"></i>
                  Guardar y agregar otro
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
