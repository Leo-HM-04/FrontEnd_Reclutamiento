"use client";

import React, { useState, useEffect } from "react";
import { apiClient } from "@/lib/api";

interface CandidateFormProps {
  candidateId?: number;
  onSuccess?: () => void;
}

export default function CandidateForm({ candidateId, onSuccess }: CandidateFormProps) {
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  
  const [formData, setFormData] = useState({
    // Información Personal
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    alternative_phone: "",
    
    // Ubicación
    city: "",
    state: "",
    country: "México",
    address: "",
    
    // Información Laboral
    current_position: "",
    current_company: "",
    years_of_experience: "",
    
    // Educación
    education_level: "",
    university: "",
    degree: "",
    
    // Habilidades (JSON arrays)
    skills: "",
    languages: "",
    certifications: "",
    
    // Salario
    salary_expectation_min: "",
    salary_expectation_max: "",
    salary_currency: "MXN",
    
    // Estado y Origen
    status: "new",
    source: "",
    
    // Disponibilidad
    available_from: "",
    notice_period_days: "",
    
    // Enlaces
    linkedin_url: "",
    portfolio_url: "",
    github_url: "",
    
    // Notas
    internal_notes: "",
  });

  useEffect(() => {
    if (candidateId) {
      loadCandidate();
    }
  }, [candidateId]);

  const loadCandidate = async () => {
    if (!candidateId) return;
    
    setLoadingData(true);
    try {
      const candidateData = await apiClient.getCandidate(candidateId);
      const candidate = candidateData as any;
      
      // Parsear JSON fields
      const skills = Array.isArray(candidate.skills) 
        ? candidate.skills.join(", ") 
        : "";
      const languages = Array.isArray(candidate.languages) 
        ? candidate.languages.map((lang: any) => 
            typeof lang === 'object' ? `${lang.idioma} (${lang.nivel})` : lang
          ).join(", ")
        : "";
      const certifications = Array.isArray(candidate.certifications) 
        ? candidate.certifications.join(", ") 
        : "";
      
      setFormData({
        first_name: candidate.first_name || "",
        last_name: candidate.last_name || "",
        email: candidate.email || "",
        phone: candidate.phone || "",
        alternative_phone: candidate.alternative_phone || "",
        city: candidate.city || "",
        state: candidate.state || "",
        country: candidate.country || "México",
        address: candidate.address || "",
        current_position: candidate.current_position || "",
        current_company: candidate.current_company || "",
        years_of_experience: candidate.years_of_experience?.toString() || "",
        education_level: candidate.education_level || "",
        university: candidate.university || "",
        degree: candidate.degree || "",
        skills: skills,
        languages: languages,
        certifications: certifications,
        salary_expectation_min: candidate.salary_expectation_min?.toString() || "",
        salary_expectation_max: candidate.salary_expectation_max?.toString() || "",
        salary_currency: candidate.salary_currency || "MXN",
        status: candidate.status || "new",
        source: candidate.source || "",
        available_from: candidate.available_from || "",
        notice_period_days: candidate.notice_period_days?.toString() || "",
        linkedin_url: candidate.linkedin_url || "",
        portfolio_url: candidate.portfolio_url || "",
        github_url: candidate.github_url || "",
        internal_notes: candidate.internal_notes || "",
      });
    } catch (error) {
      console.error("Error loading candidate:", error);
      alert("Error al cargar el candidato");
    } finally {
      setLoadingData(false);
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
      const submitData: any = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        status: formData.status || "new",
        salary_currency: formData.salary_currency || "MXN",
      };

      // Campos opcionales de texto - solo agregar si tienen valor
      if (formData.alternative_phone) submitData.alternative_phone = formData.alternative_phone;
      if (formData.city) submitData.city = formData.city;
      if (formData.state) submitData.state = formData.state;
      if (formData.country) submitData.country = formData.country;
      if (formData.address) submitData.address = formData.address;
      if (formData.current_position) submitData.current_position = formData.current_position;
      if (formData.current_company) submitData.current_company = formData.current_company;
      if (formData.education_level) submitData.education_level = formData.education_level;
      if (formData.university) submitData.university = formData.university;
      if (formData.degree) submitData.degree = formData.degree;
      if (formData.source) submitData.source = formData.source;
      if (formData.available_from) submitData.available_from = formData.available_from;
      if (formData.linkedin_url) submitData.linkedin_url = formData.linkedin_url;
      if (formData.portfolio_url) submitData.portfolio_url = formData.portfolio_url;
      if (formData.github_url) submitData.github_url = formData.github_url;
      if (formData.internal_notes) submitData.internal_notes = formData.internal_notes;

      // Arrays - skills, languages, certifications
      submitData.skills = formData.skills 
        ? formData.skills.split(",").map(s => s.trim()).filter(Boolean)
        : [];
      
      submitData.certifications = formData.certifications 
        ? formData.certifications.split(",").map(s => s.trim()).filter(Boolean)
        : [];
      
      // Para languages, intentar parsear formato "idioma (nivel)"
      submitData.languages = formData.languages 
        ? formData.languages.split(",").map(s => {
            const trimmed = s.trim();
            const match = trimmed.match(/^(.+?)\s*\((.+?)\)$/);
            if (match) {
              return { idioma: match[1].trim(), nivel: match[2].trim() };
            }
            return { idioma: trimmed, nivel: "No especificado" };
          }).filter(Boolean)
        : [];

      // Convertir números - solo si tienen valor
      if (formData.years_of_experience) {
        submitData.years_of_experience = parseInt(formData.years_of_experience as any);
      }
      
      // Salario - validar que si se envía max, también se envíe min
      const hasMinSalary = formData.salary_expectation_min && formData.salary_expectation_min.trim() !== '';
      const hasMaxSalary = formData.salary_expectation_max && formData.salary_expectation_max.trim() !== '';
      
      if (hasMinSalary || hasMaxSalary) {
        // Si solo hay mínimo, enviarlo
        if (hasMinSalary) {
          submitData.salary_expectation_min = parseFloat(formData.salary_expectation_min as any);
        }
        // Si solo hay máximo, también enviar mínimo como 0
        if (hasMaxSalary) {
          submitData.salary_expectation_max = parseFloat(formData.salary_expectation_max as any);
          // Si hay max pero no min, establecer min en 0
          if (!hasMinSalary) {
            submitData.salary_expectation_min = 0;
          }
        }
      }
      
      if (formData.notice_period_days) {
        submitData.notice_period_days = parseInt(formData.notice_period_days as any);
      }

      console.log('📤 Datos a enviar:', submitData);

      if (candidateId) {
        await apiClient.updateCandidate(candidateId, submitData);
        alert("Candidato actualizado exitosamente");
      } else {
        await apiClient.createCandidate(submitData);
        alert("Candidato creado exitosamente");
      }
      
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error("❌ Error saving candidate:", error);
      console.error("❌ Error details:", error.details);
      console.error("❌ Full error object:", JSON.stringify(error, null, 2));
      
      // Intentar extraer el mensaje de error más útil
      let errorMsg = "Error desconocido";
      
      if (error.details) {
        // Si details es un objeto con campos específicos
        if (typeof error.details === 'object') {
          const errorFields = Object.keys(error.details);
          if (errorFields.length > 0) {
            errorMsg = errorFields.map(field => 
              `${field}: ${JSON.stringify(error.details[field])}`
            ).join(', ');
          }
        } else {
          errorMsg = JSON.stringify(error.details);
        }
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      alert(`Error al guardar candidato:\n\n${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex justify-center items-center py-12">
        <i className="fas fa-spinner fa-spin text-4xl text-blue-600 mr-4"></i>
        <span className="text-gray-600">Cargando datos...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900">
          {candidateId ? "Editar Candidato" : "Crear Nuevo Candidato"}
        </h3>
        <p className="text-gray-600 mt-1">
          Complete la información del candidato
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Información Personal */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <i className="fas fa-user text-blue-600 mr-2"></i>
            Información Personal
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre *
              </label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Juan"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Apellido *
              </label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Pérez García"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="ejemplo@correo.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teléfono *
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: 722 555 1234"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teléfono Alternativo
              </label>
              <input
                type="text"
                name="alternative_phone"
                value={formData.alternative_phone}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: 722 555 5678"
              />
            </div>
          </div>
        </div>

        {/* Ubicación */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <i className="fas fa-map-marker-alt text-blue-600 mr-2"></i>
            Ubicación
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ciudad
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Toluca"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: México"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                País
              </label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: México"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dirección Completa
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Calle, número, colonia"
              />
            </div>
          </div>
        </div>

        {/* Información Laboral */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <i className="fas fa-briefcase text-blue-600 mr-2"></i>
            Información Laboral Actual
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Posición Actual
              </label>
              <input
                type="text"
                name="current_position"
                value={formData.current_position}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Desarrollador Full Stack"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Empresa Actual
              </label>
              <input
                type="text"
                name="current_company"
                value={formData.current_company}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Tech Solutions SA"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Años de Experiencia
              </label>
              <input
                type="number"
                name="years_of_experience"
                value={formData.years_of_experience}
                onChange={handleChange}
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: 5"
              />
            </div>
          </div>
        </div>

        {/* Educación */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <i className="fas fa-graduation-cap text-blue-600 mr-2"></i>
            Educación
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nivel Educativo
              </label>
              <select
                name="education_level"
                value={formData.education_level}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar nivel...</option>
                <option value="Primaria">Primaria</option>
                <option value="Secundaria">Secundaria</option>
                <option value="Preparatoria">Preparatoria</option>
                <option value="Técnico">Técnico</option>
                <option value="Licenciatura">Licenciatura</option>
                <option value="Maestría">Maestría</option>
                <option value="Doctorado">Doctorado</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Universidad/Institución
              </label>
              <input
                type="text"
                name="university"
                value={formData.university}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: UNAM"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título/Carrera
              </label>
              <input
                type="text"
                name="degree"
                value={formData.degree}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Ingeniería en Sistemas Computacionales"
              />
            </div>
          </div>
        </div>

        {/* Habilidades y Competencias */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <i className="fas fa-cogs text-blue-600 mr-2"></i>
            Habilidades y Competencias
          </h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Habilidades
              </label>
              <input
                type="text"
                name="skills"
                value={formData.skills}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Separadas por comas: Python, Django, React, PostgreSQL"
              />
              <p className="text-xs text-gray-500 mt-1">Separe cada habilidad con una coma</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Idiomas
              </label>
              <input
                type="text"
                name="languages"
                value={formData.languages}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Formato: Español (Nativo), Inglés (Avanzado)"
              />
              <p className="text-xs text-gray-500 mt-1">Formato: Idioma (Nivel), separados por comas</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Certificaciones
              </label>
              <input
                type="text"
                name="certifications"
                value={formData.certifications}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Separadas por comas: PMP, SCRUM Master, AWS"
              />
              <p className="text-xs text-gray-500 mt-1">Separe cada certificación con una coma</p>
            </div>
          </div>
        </div>

        {/* Expectativas Salariales */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <i className="fas fa-dollar-sign text-blue-600 mr-2"></i>
            Expectativas Salariales
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Salario Mínimo
              </label>
              <input
                type="number"
                name="salary_expectation_min"
                value={formData.salary_expectation_min}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: 15000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Salario Máximo
              </label>
              <input
                type="number"
                name="salary_expectation_max"
                value={formData.salary_expectation_max}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: 20000"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="MXN">MXN - Peso Mexicano</option>
                <option value="USD">USD - Dólar</option>
                <option value="EUR">EUR - Euro</option>
              </select>
            </div>
          </div>
        </div>

        {/* Estado y Origen */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <i className="fas fa-info-circle text-blue-600 mr-2"></i>
            Estado y Origen
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="new">Nuevo</option>
                <option value="screening">En Revisión</option>
                <option value="qualified">Calificado</option>
                <option value="interview">En Entrevista</option>
                <option value="offer">Oferta Extendida</option>
                <option value="hired">Contratado</option>
                <option value="rejected">Rechazado</option>
                <option value="withdrawn">Retirado</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fuente
              </label>
              <input
                type="text"
                name="source"
                value={formData.source}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: LinkedIn, Facebook, Referido"
              />
            </div>
          </div>
        </div>

        {/* Disponibilidad */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <i className="fas fa-calendar-check text-blue-600 mr-2"></i>
            Disponibilidad
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Disponible Desde
              </label>
              <input
                type="date"
                name="available_from"
                value={formData.available_from}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Días de Aviso Previo
              </label>
              <input
                type="number"
                name="notice_period_days"
                value={formData.notice_period_days}
                onChange={handleChange}
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: 15"
              />
            </div>
          </div>
        </div>

        {/* Enlaces */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <i className="fas fa-link text-blue-600 mr-2"></i>
            Enlaces
          </h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                LinkedIn
              </label>
              <input
                type="url"
                name="linkedin_url"
                value={formData.linkedin_url}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="https://linkedin.com/in/usuario"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Portafolio
              </label>
              <input
                type="url"
                name="portfolio_url"
                value={formData.portfolio_url}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="https://miportafolio.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GitHub
              </label>
              <input
                type="url"
                name="github_url"
                value={formData.github_url}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="https://github.com/usuario"
              />
            </div>
          </div>
        </div>

        {/* Notas Internas */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <i className="fas fa-sticky-note text-blue-600 mr-2"></i>
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Guardando...
              </>
            ) : (
              <>
                <i className="fas fa-save mr-2"></i>
                {candidateId ? "Actualizar Candidato" : "Crear Candidato"}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
