"use client";

import { useState, useEffect } from "react";
import { createProfile, updateProfile, getProfile, getClients, apiClient } from "@/lib/api";
interface ProfileFormProps {
  profileId?: number;
  onSuccess?: () => void;
}

interface Client {
  id: number;
  company_name: string;
  name?: string;
}

interface User {
  id: number;
  full_name: string;
  email: string;
  role: string;
}

export default function ProfileForm({ profileId, onSuccess }: ProfileFormProps) {
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  
  
  const [formData, setFormData] = useState({
    // Información básica
    position_title: "",
    client: "",
    department: "",
    status: "draft",
    priority: "medium",
    service_type: "normal",
    positions_available: 1,
    
    // Descripción
    responsibilities: "",
    requirements: "",
    benefits: "",
    
    // Requisitos
    min_age: "",
    max_age: "",
    education_level: "",
    years_experience_required: "",
    
    // Salario
    salary_min: "",
    salary_max: "",
    salary_currency: "MXN",
    salary_period: "mensual",
    
    // Ubicación
    location: "",
    modality: "presencial",
    work_schedule: "",
    
    // Habilidades (JSON)
    technical_skills: "",
    soft_skills: "",
    languages_required: "",
    certifications_required: "",
    
    // Fechas
    deadline_date: "",
    expected_start_date: "",
    
    // Asignación
    assigned_to: "",
    
    // Notas
    internal_notes: "",

    published_platforms: [] as string[],

  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (profileId && clients.length > 0) {
      loadProfile();
    }
  }, [profileId, clients]);

  useEffect(() => {
    loadClientsAndUsers();
  }, []);

  const loadClientsAndUsers = async () => {
    setLoadingData(true);
    try {
      const [clientsRes, usersRes] = await Promise.all([
        getClients(),
        apiClient.getUsers()
      ]);
      
      const clientsList = (clientsRes as any).results || (Array.isArray(clientsRes) ? clientsRes : []);
      const usersList = (usersRes as any).results || (Array.isArray(usersRes) ? usersRes : []);
      
      setClients(clientsList);
      setUsers(usersList);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoadingData(false);
    }
  };



  const loadInitialData = async () => {
    setLoadingData(true);
    try {
      // Cargar clientes
      const clientsResponse = await getClients();
      const clientsList = (clientsResponse as any).results || (Array.isArray(clientsResponse) ? clientsResponse : []);
      setClients(clientsList);

      // Cargar usuarios (supervisores y directores)
      const usersResponse = await apiClient.getUsers();
      const usersList = (usersResponse as any).results || (Array.isArray(usersResponse) ? usersResponse : []);
      setUsers(usersList);

      console.log('✅ Clientes cargados:', clientsList.length);
      console.log('✅ Usuarios cargados:', usersList.length);
    } catch (error) {
      console.error("Error loading initial data:", error);
      alert("Error al cargar datos iniciales");
    } finally {
      setLoadingData(false);
    }
  };

  const loadProfile = async () => {
    if (!profileId) return;
    
    setLoading(true);
    try {
      const profile = await getProfile(profileId);
        
      // Parsear JSON fields
      const technicalSkills = Array.isArray(profile.technical_skills) 
        ? profile.technical_skills.join(", ") 
        : "";
      const softSkills = Array.isArray(profile.soft_skills) 
        ? profile.soft_skills.join(", ") 
        : "";
      const languages = Array.isArray(profile.languages) 
        ? profile.languages.join(", ") 
        : "";
      const certifications = Array.isArray(profile.additional_requirements) 
        ? profile.additional_requirements.join(", ") 
        : (profile.additional_requirements || "");
      
      // Reconstruir ubicación desde location_city y location_state
      const location = profile.location_city && profile.location_state 
        ? `${profile.location_city}, ${profile.location_state}`
        : profile.location_city || "";
      
      // Determinar modalidad desde is_remote e is_hybrid
      let modality = "presencial";
      if (profile.is_remote) modality = "remoto";
      else if (profile.is_hybrid) modality = "hibrido";
      
      // Extraer responsabilidades, requisitos y beneficios desde position_description
      const descriptionParts = (profile.position_description || "").split("\n\n");
      let responsibilities = "";
      let requirements = "";
      let benefits = profile.benefits || "";
      
      descriptionParts.forEach((part: string) => {
        if (part.includes("RESPONSABILIDADES:")) {
          responsibilities = part.replace("RESPONSABILIDADES:", "").trim();
        } else if (part.includes("REQUISITOS:")) {
          requirements = part.replace("REQUISITOS:", "").trim();
        } else if (part.includes("BENEFICIOS:")) {
          benefits = part.replace("BENEFICIOS:", "").trim();
        }
      });
      
      setFormData({
        position_title: profile.position_title || "",
        client: profile.client?.toString() || "",
        department: profile.department || "",
        status: profile.status || "draft",
        priority: profile.priority || "medium",
        service_type: profile.service_type || "normal",
        positions_available: profile.number_of_positions || 1,
        responsibilities: responsibilities,
        requirements: requirements,
        benefits: benefits,
        min_age: profile.age_min?.toString() || "",
        max_age: profile.age_max?.toString() || "",
        education_level: profile.education_level || "",
        years_experience_required: profile.years_experience?.toString() || "",
        salary_min: profile.salary_min?.toString() || "",
        salary_max: profile.salary_max?.toString() || "",
        salary_currency: profile.salary_currency || "MXN",
        salary_period: profile.salary_period || "mensual",
        location: location,
        modality: modality,
        published_platforms: profile.published_platforms || [],
        work_schedule: profile.work_schedule || "",
        technical_skills: technicalSkills,
        soft_skills: softSkills,
        languages_required: languages,
        certifications_required: certifications,
        deadline_date: profile.deadline || "",
        expected_start_date: profile.desired_start_date || "",
        assigned_to: profile.assigned_to?.toString() || "",
        internal_notes: profile.internal_notes || "",
      });
    } catch (error) {
      console.error("Error loading profile:", error);
      alert("Error al cargar el perfil");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  try {
    // Preparar descripción completa del puesto
    const position_description = `
RESPONSABILIDADES:
${formData.responsibilities || 'No especificadas'}

REQUISITOS:
${formData.requirements || 'No especificados'}

BENEFICIOS:
${formData.benefits || 'No especificados'}
`.trim();

    // Dividir ubicación en ciudad y estado
    const locationParts = (formData.location || '').split(',').map(s => s.trim());
    const location_city = locationParts[0] || 'Ciudad no especificada';
    const location_state = locationParts[1] || 'Estado no especificado';

    // Preparar datos para el backend
    const submitData = {
      client: parseInt(formData.client as any),
      position_title: formData.position_title,
      position_description: position_description,
      department: formData.department || '',
      location_city: location_city,
      location_state: location_state,
      is_remote: formData.modality === 'remoto',
      is_hybrid: formData.modality === 'hibrido',
      salary_min: formData.salary_min ? parseFloat(formData.salary_min as any) : 0,
      salary_max: formData.salary_max ? parseFloat(formData.salary_max as any) : 0,
      salary_currency: formData.salary_currency || 'MXN',
      salary_period: formData.salary_period || 'mensual',
      education_level: formData.education_level || 'No especificado',
      years_experience: formData.years_experience_required 
        ? parseInt(formData.years_experience_required as any) 
        : 0,
      age_min: formData.min_age ? parseInt(formData.min_age as any) : null,
      age_max: formData.max_age ? parseInt(formData.max_age as any) : null,
      technical_skills: formData.technical_skills 
        ? formData.technical_skills.split(",").map(s => s.trim()).filter(Boolean)
        : [],
      soft_skills: formData.soft_skills 
        ? formData.soft_skills.split(",").map(s => s.trim()).filter(Boolean)
        : [],
      languages: formData.languages_required 
        ? formData.languages_required.split(",").map(s => s.trim()).filter(Boolean)
        : [],
      benefits: formData.benefits || '',
      additional_requirements: formData.certifications_required || '',
      status: formData.status || 'draft',
      service_type: formData.service_type || 'normal',
      number_of_positions: parseInt(formData.positions_available as any) || 1,
      priority: formData.priority || 'medium',
      deadline: formData.deadline_date || null,
      desired_start_date: formData.expected_start_date || null,
      assigned_to: formData.assigned_to ? parseInt(formData.assigned_to as any) : undefined,
      internal_notes: formData.internal_notes || '',
      published_platforms: formData.published_platforms || [],
    };

    console.log('📤 Datos a enviar al backend:', submitData);

    if (profileId) {
      await updateProfile(profileId, submitData);
      alert("Perfil actualizado exitosamente");
    } else {
      await createProfile(submitData);
      alert("Perfil creado exitosamente");
    }
    
    if (onSuccess) onSuccess();
  } catch (error: any) {
    console.error("❌ Error saving profile:", error);
    console.error("📋 Detalles del error:", error.response?.data);
    alert(`Error al guardar: ${error.response?.data?.detail || error.message}`);
  } finally {
    setLoading(false);
  }
};

  

  if (loadingData) {
    return (
      <div className="flex justify-center items-center py-12">
        <i className="fas fa-spinner fa-spin text-4xl text-orange-600 mr-4"></i>
        <span className="text-gray-600">Cargando datos...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900">
          {profileId ? "Editar Perfil" : "Crear Nuevo Perfil"}
        </h3>
        <p className="text-gray-600 mt-1">
          Complete la información del perfil de reclutamiento
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Información Básica */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <i className="fas fa-info-circle text-orange-600 mr-2"></i>
            Información Básica
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título de la Posición *
              </label>
              <input
                type="text"
                name="position_title"
                value={formData.position_title}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                placeholder="Ej: Desarrollador Full Stack Senior"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Departamento
              </label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                placeholder="Ej: Tecnología, Ventas, RRHH"
              />
            </div>

            <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cliente *
            </label>
            <select
              name="client"
              value={formData.client}
              onChange={handleChange}
              required
              disabled={loadingData}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Seleccionar cliente...</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.company_name || client.name || `Cliente #${client.id}`}
                </option>
              ))}
            </select>
          </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de Posiciones *
              </label>
              <input
                type="number"
                name="positions_available"
                value={formData.positions_available}
                onChange={handleChange}
                min="1"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado *
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              >
                <option value="draft">Borrador</option>
                <option value="pending">Pendiente de Aprobación</option>
                <option value="approved">Aprobado</option>
                <option value="in_progress">En Proceso</option>
                <option value="candidates_found">Candidatos Encontrados</option>
                <option value="in_evaluation">En Evaluación</option>
                <option value="in_interview">En Entrevistas</option>
                <option value="finalists">Finalistas</option>
                <option value="completed">Completado</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prioridad *
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              >
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Servicio *
              </label>
              <select
                name="service_type"
                value={formData.service_type}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              >
                <option value="normal">Servicio Normal</option>
                <option value="specialized">Servicio Especializado</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Asignado a
              </label>
              <select
                name="assigned_to"
                value={formData.assigned_to}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Sin asignar</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.full_name} ({user.role}) - {user.email}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Selecciona el supervisor o director responsable
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plataformas de Publicación
              </label>
              <div className="space-y-2 border border-gray-300 rounded-lg p-4">
                {['LinkedIn', 'Indeed', 'OCC', 'CompuTrabajo'].map((platform) => (
                  <label key={platform} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      value={platform}
                      checked={formData.published_platforms.includes(platform)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData(prev => ({
                            ...prev,
                            published_platforms: [...prev.published_platforms, platform]
                          }));
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            published_platforms: prev.published_platforms.filter(p => p !== platform)
                          }));
                        }
                      }}
                      className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">{platform}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">Selecciona las plataformas donde se publicará</p>
            </div>
          </div>
        </div>

        {/* Descripción del Puesto */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <i className="fas fa-file-alt text-orange-600 mr-2"></i>
            Descripción del Puesto
          </h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Responsabilidades *
              </label>
              <textarea
                name="responsibilities"
                value={formData.responsibilities}
                onChange={handleChange}
                required
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                placeholder="Describa las responsabilidades principales del puesto..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Requisitos *
              </label>
              <textarea
                name="requirements"
                value={formData.requirements}
                onChange={handleChange}
                required
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                placeholder="Especifique los requisitos y calificaciones necesarias..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Beneficios
              </label>
              <textarea
                name="benefits"
                value={formData.benefits}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                placeholder="Prestaciones, beneficios, bonos, etc..."
              />
            </div>
          </div>
        </div>

        {/* Requisitos del Candidato */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <i className="fas fa-user-check text-orange-600 mr-2"></i>
            Requisitos del Candidato
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Edad Mínima
              </label>
              <input
                type="number"
                name="min_age"
                value={formData.min_age}
                onChange={handleChange}
                min="18"
                max="100"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Edad Máxima
              </label>
              <input
                type="number"
                name="max_age"
                value={formData.max_age}
                onChange={handleChange}
                min="18"
                max="100"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nivel Educativo
              </label>
              <input
                type="text"
                name="education_level"
                value={formData.education_level}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                placeholder="Ej: Licenciatura en Ingeniería"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Años de Experiencia
              </label>
              <input
                type="number"
                name="years_experience_required"
                value={formData.years_experience_required}
                onChange={handleChange}
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Salario y Compensación */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <i className="fas fa-dollar-sign text-orange-600 mr-2"></i>
            Salario y Compensación
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Salario Mínimo
              </label>
              <input
                type="number"
                name="salary_min"
                value={formData.salary_min}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Salario Máximo
              </label>
              <input
                type="number"
                name="salary_max"
                value={formData.salary_max}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Moneda
              </label>
              <select
                name="salary_currency"
                value={formData.salary_currency}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              >
                <option value="MXN">MXN - Peso Mexicano</option>
                <option value="USD">USD - Dólar Estadounidense</option>
                <option value="EUR">EUR - Euro</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Periodo
              </label>
              <select
                name="salary_period"
                value={formData.salary_period}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              >
                <option value="mensual">Mensual</option>
                <option value="anual">Anual</option>
                <option value="por_hora">Por Hora</option>
              </select>
            </div>
          </div>
        </div>

        {/* Ubicación y Modalidad */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <i className="fas fa-map-marker-alt text-orange-600 mr-2"></i>
            Ubicación y Modalidad
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ubicación *
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                placeholder="Ej: Ciudad de México, CDMX"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Modalidad *
              </label>
              <select
                name="modality"
                value={formData.modality}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              >
                <option value="presencial">Presencial</option>
                <option value="remoto">Remoto</option>
                <option value="hibrido">Híbrido</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Horario de Trabajo
              </label>
              <input
                type="text"
                name="work_schedule"
                value={formData.work_schedule}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                placeholder="Ej: Lunes a Viernes 9:00 AM - 6:00 PM"
              />
            </div>
          </div>
        </div>

        {/* Habilidades y Competencias */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <i className="fas fa-cogs text-orange-600 mr-2"></i>
            Habilidades y Competencias
          </h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Habilidades Técnicas
              </label>
              <input
                type="text"
                name="technical_skills"
                value={formData.technical_skills}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                placeholder="Separadas por comas: Python, Django, React, PostgreSQL"
              />
              <p className="text-xs text-gray-500 mt-1">Separe cada habilidad con una coma</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Habilidades Blandas
              </label>
              <input
                type="text"
                name="soft_skills"
                value={formData.soft_skills}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                placeholder="Separadas por comas: Trabajo en equipo, Liderazgo, Comunicación"
              />
              <p className="text-xs text-gray-500 mt-1">Separe cada habilidad con una coma</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Idiomas Requeridos
              </label>
              <input
                type="text"
                name="languages_required"
                value={formData.languages_required}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                placeholder="Separados por comas: Español, Inglés avanzado"
              />
              <p className="text-xs text-gray-500 mt-1">Separe cada idioma con una coma</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Certificaciones Requeridas
              </label>
              <input
                type="text"
                name="certifications_required"
                value={formData.certifications_required}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                placeholder="Separadas por comas: PMP, SCRUM Master, AWS"
              />
              <p className="text-xs text-gray-500 mt-1">Separe cada certificación con una coma</p>
            </div>
          </div>
        </div>

        {/* Fechas Importantes */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <i className="fas fa-calendar text-orange-600 mr-2"></i>
            Fechas Importantes
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha Límite
              </label>
              <input
                type="date"
                name="deadline_date"
                value={formData.deadline_date}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Inicio Esperada
              </label>
              <input
                type="date"
                name="expected_start_date"
                value={formData.expected_start_date}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Notas Internas */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <i className="fas fa-sticky-note text-orange-600 mr-2"></i>
            Notas Internas
          </h4>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notas
            </label>
            <textarea
              name="internal_notes"
              value={formData.internal_notes}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              placeholder="Notas privadas para uso interno del equipo..."
            />
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex justify-end space-x-4 pt-4 border-t">
          {onSuccess && (
            <button
              type="button"
              onClick={onSuccess}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Guardando...
              </>
            ) : (
              <>
                <i className="fas fa-save mr-2"></i>
                {profileId ? "Actualizar Perfil" : "Crear Perfil"}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}