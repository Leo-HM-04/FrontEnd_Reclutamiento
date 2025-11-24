"use client";

import { useState, useEffect } from "react";
import { createProfile, updateProfile, getProfile } from "@/lib/api";

interface ProfileFormProps {
  profileId?: number;
  onSuccess?: () => void;
}

export default function ProfileForm({ profileId, onSuccess }: ProfileFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Información básica
    position_title: "",
    client: "",
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
  });

  useEffect(() => {
    if (profileId) {
      loadProfile();
    }
  }, [profileId]);

  const loadProfile = async () => {
    if (!profileId) return;
    
    setLoading(true);
    try {
      const response = await getProfile(profileId);
      const profile = response.data;
      
      // Parsear JSON fields
      const technicalSkills = Array.isArray(profile.technical_skills) 
        ? profile.technical_skills.join(", ") 
        : "";
      const softSkills = Array.isArray(profile.soft_skills) 
        ? profile.soft_skills.join(", ") 
        : "";
      const languages = Array.isArray(profile.languages_required) 
        ? profile.languages_required.join(", ") 
        : "";
      const certifications = Array.isArray(profile.certifications_required) 
        ? profile.certifications_required.join(", ") 
        : "";
      
      setFormData({
        ...formData,
        ...profile,
        technical_skills: technicalSkills,
        soft_skills: softSkills,
        languages_required: languages,
        certifications_required: certifications,
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
      // Convertir strings separados por comas a arrays para JSON fields
      const submitData = {
        ...formData,
        technical_skills: formData.technical_skills 
          ? formData.technical_skills.split(",").map(s => s.trim()).filter(Boolean)
          : [],
        soft_skills: formData.soft_skills 
          ? formData.soft_skills.split(",").map(s => s.trim()).filter(Boolean)
          : [],
        languages_required: formData.languages_required 
          ? formData.languages_required.split(",").map(s => s.trim()).filter(Boolean)
          : [],
        certifications_required: formData.certifications_required 
          ? formData.certifications_required.split(",").map(s => s.trim()).filter(Boolean)
          : [],
        // Convertir números
        positions_available: parseInt(formData.positions_available as any) || 1,
        min_age: formData.min_age ? parseInt(formData.min_age as any) : null,
        max_age: formData.max_age ? parseInt(formData.max_age as any) : null,
        years_experience_required: formData.years_experience_required 
          ? parseInt(formData.years_experience_required as any) 
          : null,
        salary_min: formData.salary_min ? parseFloat(formData.salary_min as any) : null,
        salary_max: formData.salary_max ? parseFloat(formData.salary_max as any) : null,
        client: parseInt(formData.client as any),
        assigned_to: formData.assigned_to ? parseInt(formData.assigned_to as any) : undefined
      };

      if (profileId) {
        await updateProfile(profileId, submitData);
        alert("Perfil actualizado exitosamente");
      } else {
        await createProfile(submitData);
        alert("Perfil creado exitosamente");
      }
      
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error("Error saving profile:", error);
      alert(`Error al guardar: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

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
                Cliente * (ID)
              </label>
              <input
                type="number"
                name="client"
                value={formData.client}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
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
                Asignado a (ID Usuario)
              </label>
              <input
                type="number"
                name="assigned_to"
                value={formData.assigned_to}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
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
                Responsabilidades
              </label>
              <textarea
                name="responsibilities"
                value={formData.responsibilities}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                placeholder="Describa las responsabilidades principales del puesto..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Requisitos
              </label>
              <textarea
                name="requirements"
                value={formData.requirements}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                placeholder="Describa los requisitos del puesto..."
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
                placeholder="Describa los beneficios ofrecidos..."
              />
            </div>
          </div>
        </div>

        {/* Requisitos Específicos */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <i className="fas fa-clipboard-check text-orange-600 mr-2"></i>
            Requisitos Específicos
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
              <select
                name="education_level"
                value={formData.education_level}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Seleccionar...</option>
                <option value="secundaria">Secundaria</option>
                <option value="preparatoria">Preparatoria</option>
                <option value="tecnico">Técnico</option>
                <option value="licenciatura">Licenciatura</option>
                <option value="maestria">Maestría</option>
                <option value="doctorado">Doctorado</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Años de Experiencia Requeridos
              </label>
              <input
                type="number"
                name="years_experience_required"
                value={formData.years_experience_required}
                onChange={handleChange}
                min="0"
                max="50"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Salario */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <i className="fas fa-dollar-sign text-orange-600 mr-2"></i>
            Información Salarial
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
                <option value="quincenal">Quincenal</option>
                <option value="semanal">Semanal</option>
                <option value="anual">Anual</option>
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
                Ubicación
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                placeholder="Ciudad, Estado"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Modalidad
              </label>
              <select
                name="modality"
                value={formData.modality}
                onChange={handleChange}
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

        {/* Habilidades */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <i className="fas fa-brain text-orange-600 mr-2"></i>
            Habilidades y Competencias
          </h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Habilidades Técnicas (separadas por comas)
              </label>
              <textarea
                name="technical_skills"
                value={formData.technical_skills}
                onChange={handleChange}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                placeholder="Python, Django, PostgreSQL, Docker, AWS"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Habilidades Blandas (separadas por comas)
              </label>
              <textarea
                name="soft_skills"
                value={formData.soft_skills}
                onChange={handleChange}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                placeholder="Liderazgo, Trabajo en equipo, Comunicación efectiva"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Idiomas Requeridos (separados por comas)
              </label>
              <input
                type="text"
                name="languages_required"
                value={formData.languages_required}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                placeholder="Español, Inglés avanzado"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Certificaciones Requeridas (separadas por comas)
              </label>
              <input
                type="text"
                name="certifications_required"
                value={formData.certifications_required}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                placeholder="PMP, Scrum Master, AWS Certified"
              />
            </div>
          </div>
        </div>

        {/* Fechas */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <i className="fas fa-calendar-alt text-orange-600 mr-2"></i>
            Fechas Importantes
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha Límite de Búsqueda
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
                Fecha Esperada de Inicio
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
          
          <textarea
            name="internal_notes"
            value={formData.internal_notes}
            onChange={handleChange}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            placeholder="Notas internas sobre el perfil, no visibles para el cliente..."
          />
        </div>

        {/* Botones */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => onSuccess && onSuccess()}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400"
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
