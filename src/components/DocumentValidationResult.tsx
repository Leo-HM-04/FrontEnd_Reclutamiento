"use client";

import { useState, useEffect } from "react";

// =============================================================================
// TIPOS
// =============================================================================

export type ValidationStatus = 
  | "approved"           // ✅ Documento válido
  | "warning"            // ⚠️ Verificación parcial
  | "rejected_illegible" // ❌ Ilegible
  | "rejected_wrong_type"// ❌ Tipo incorrecto
  | "rejected_exclusion" // ❌ Documento no válido (ej: IFE)
  | "analyzing"          // ⏳ Analizando
  | "error"              // Error de sistema
  | "skipped"            // Validación omitida
  | "idle";              // Estado inicial

export interface DetectedField {
  field_name: string;
  detected: boolean;
  value?: string;
  confidence: number;
}

export interface ValidationResult {
  status: ValidationStatus;
  legibility_score: number;
  match_score: number;
  document_type: string;
  probable_document_type?: string;
  flags_detected: DetectedField[];
  masked_fields: Record<string, string>;
  user_message: {
    title: string;
    subtitle: string;
    tips_intro?: string;
  };
  next_actions: string[];
  tips: string[];
  text_length: number;
  processing_time: number;
  error_message?: string;
}

export interface DocumentValidationResultProps {
  result: ValidationResult | null;
  isValidating: boolean;
  onRetry?: () => void;
  onForceUpload?: () => void;
  onContinue?: () => void;
  showForceUpload?: boolean;
  showActions?: boolean;  // Para ocultar botones en modo público
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export default function DocumentValidationResult({
  result,
  isValidating,
  onRetry,
  onForceUpload,
  onContinue,
  showForceUpload = true,
  showActions = true
}: DocumentValidationResultProps) {
  
  // Estado de animación para el loader
  const [dots, setDots] = useState("");
  
  useEffect(() => {
    if (isValidating) {
      const interval = setInterval(() => {
        setDots(prev => prev.length >= 3 ? "" : prev + ".");
      }, 500);
      return () => clearInterval(interval);
    }
  }, [isValidating]);

  // ==========================================================================
  // ESTADO: ANALIZANDO
  // ==========================================================================
  if (isValidating) {
    return (
      <div className="bg-white border-2 border-blue-100 rounded-lg p-6 shadow-sm">
        <div className="flex items-center gap-4">
          {/* Spinner profesional */}
          <div className="relative">
            <div className="w-10 h-10 rounded-full border-3 border-gray-200 border-t-blue-600 animate-spin"></div>
          </div>
          
          {/* Mensaje */}
          <div className="flex-1">
            <h4 className="text-base font-semibold text-gray-900">
              Validando documento{dots}
            </h4>
            <p className="text-sm text-gray-600 mt-0.5">
              Procesando con OCR, esto tomará unos segundos
            </p>
          </div>
        </div>
        
        {/* Barra de progreso */}
        <div className="mt-4 h-1 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full animate-progress-indeterminate"></div>
        </div>
      </div>
    );
  }

  // Si no hay resultado, no mostrar nada
  if (!result) return null;

  // ==========================================================================
  // ESTADO: APROBADO ✅
  // ==========================================================================
  if (result.status === "approved" || result.status === "skipped") {
    return (
      <div className="bg-white border-2 border-green-200 rounded-lg p-6 shadow-sm">
        {/* Header con badge */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
              <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">Documento validado</span>
            </div>
            <h4 className="text-lg font-semibold text-gray-900">
              {result.user_message?.title?.replace(/✅|✓/g, '').trim() || "Documento validado"}
            </h4>
            <p className="text-sm text-gray-600 mt-1">
              {result.user_message?.subtitle || "El documento parece correcto y legible."}
            </p>
          </div>
          <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
        </div>

        {/* Campos detectados en grid compacto */}
        {result.flags_detected && result.flags_detected.length > 0 && (
          <div className="mt-5 pt-5 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Información detectada
            </p>
            <div className="grid grid-cols-2 gap-2">
              {result.flags_detected.filter(f => f.detected).map((field, idx) => (
                <div 
                  key={idx}
                  className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-100 rounded-md"
                >
                  <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                  </svg>
                  <span className="text-sm text-gray-700 font-medium truncate">
                    {formatFieldName(field.field_name)}
                  </span>
                  {field.value && (
                    <span className="text-xs text-gray-500 ml-auto truncate max-w-[100px]">
                      {field.value}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Scores en badges */}
        <div className="mt-5 flex items-center gap-3 text-sm">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-md">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
            </svg>
            <span className="font-medium text-gray-700">{result.legibility_score.toFixed(0)}%</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-md">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span className="font-medium text-gray-700">{result.match_score.toFixed(0)}%</span>
          </div>
        </div>

        {/* Botón continuar - más prominente */}
        <div className="mt-5 pt-5 border-t border-gray-100">
          <button
            onClick={onContinue}
            className="w-full px-4 py-3 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2"
          >
            Continuar con la carga
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
            </svg>
          </button>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // ESTADO: ADVERTENCIA ⚠️
  // ==========================================================================
  if (result.status === "warning") {
    return (
      <div className="bg-white border-2 border-amber-200 rounded-lg p-6 shadow-sm">
        {/* Header con badge */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Verificación parcial</span>
            </div>
            <h4 className="text-lg font-semibold text-gray-900">
              {result.user_message?.title?.replace(/⚠️|⚠/g, '').trim() || "Verificación parcial"}
            </h4>
            <p className="text-sm text-gray-600 mt-1">
              {result.user_message?.subtitle || "Detectamos el documento pero algunos elementos no son claros."}
            </p>
          </div>
          <div className="flex-shrink-0 w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
          </div>
        </div>

        {/* Campos en grid profesional */}
        {result.flags_detected && result.flags_detected.length > 0 && (
          <div className="mt-5 pt-5 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Estado de la validación</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {result.flags_detected.map((field, idx) => (
                <div 
                  key={idx}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md border ${
                    field.detected 
                      ? 'bg-green-50 border-green-100' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  {field.detected ? (
                    <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path>
                    </svg>
                  )}
                  <span className={`text-sm font-medium ${field.detected ? 'text-gray-700' : 'text-gray-500'}`}>
                    {formatFieldName(field.field_name)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tips profesionales */}
        {result.tips && result.tips.length > 0 && (
          <div className="mt-5 pt-5 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Recomendaciones</p>
            <ul className="space-y-2">
              {result.tips.slice(0, 3).map((tip, idx) => (
                <li key={idx} className="text-sm text-gray-600 flex items-start gap-2 pl-1">
                  <span className="text-amber-500 font-bold">·</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Scores */}
        <div className="mt-5 flex items-center gap-3 text-sm">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-md">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
            </svg>
            <span className="font-medium text-gray-700">{result.legibility_score.toFixed(0)}%</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-md">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span className="font-medium text-gray-700">{result.match_score.toFixed(0)}%</span>
          </div>
        </div>

        {/* Botones (solo si showActions=true) */}
        {showActions && (
          <div className="mt-5 pt-5 border-t border-gray-100 grid grid-cols-2 gap-3">
            <button
              onClick={onRetry}
              className="px-4 py-3 bg-white border-2 border-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-all duration-200"
            >
              Reintentar
            </button>
            <button
              onClick={onContinue}
              className="px-4 py-3 bg-amber-600 text-white text-sm font-semibold rounded-lg hover:bg-amber-700 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Continuar
            </button>
          </div>
        )}
      </div>
    );
  }

  // ==========================================================================
  // ESTADO: RECHAZADO - ILEGIBLE ❌
  // ==========================================================================
  if (result.status === "rejected_illegible") {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
            <i className="fas fa-eye-slash text-red-600 text-2xl"></i>
          </div>
          <div className="flex-1">
            <h4 className="text-lg font-semibold text-red-900">
              {result.user_message?.title || "❌ Documento ilegible"}
            </h4>
            <p className="text-sm text-red-700 mt-1">
              {result.user_message?.subtitle || "No pudimos leer el contenido del documento."}
            </p>
          </div>
        </div>

        {/* Tips para mejorar */}
        <div className="mt-4 pt-4 border-t border-red-200">
          <p className="text-sm font-medium text-red-800 mb-3">
            <i className="fas fa-lightbulb mr-2"></i>
            Para mejorar la calidad:
          </p>
          <ul className="space-y-2">
            {(result.tips?.length ? result.tips : [
              "Usa buena iluminación, sin sombras",
              "Captura el documento completo sin recortar bordes",
              "Evita reflejos, usa fondo liso",
              "Enfoca bien y no muevas al tomar la foto",
              "Si tiene varias páginas, sube el PDF completo"
            ]).map((tip, idx) => (
              <li key={idx} className="text-sm text-red-700 flex items-start gap-3 bg-red-100/50 px-3 py-2 rounded-lg">
                <i className="fas fa-check-circle text-red-400 mt-0.5"></i>
                {tip}
              </li>
            ))}
          </ul>
        </div>

        {/* Score */}
        <div className="mt-4 text-sm text-red-700">
          <i className="fas fa-eye mr-1"></i>
          Legibilidad: {result.legibility_score.toFixed(0)}%
        </div>

        {/* Botones (solo si showActions=true) */}
        {showActions && (
          <div className="mt-4 pt-4 border-t border-red-200 flex flex-col sm:flex-row gap-3">
            <button
              onClick={onRetry}
              className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              <i className="fas fa-redo mr-2"></i>
              Volver a subir
            </button>
            {showForceUpload && result.next_actions?.includes("force_upload") && (
              <button
                onClick={onForceUpload}
                className="flex-1 px-4 py-2.5 border border-red-300 text-red-700 rounded-lg font-medium hover:bg-red-100 transition-colors text-sm"
              >
                <i className="fas fa-upload mr-2"></i>
                Subir de todos modos (revisión manual)
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // ==========================================================================
  // ESTADO: RECHAZADO - TIPO INCORRECTO ❌
  // ==========================================================================
  if (result.status === "rejected_wrong_type" || result.status === "rejected_exclusion") {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
            <i className="fas fa-file-excel text-red-600 text-2xl"></i>
          </div>
          <div className="flex-1">
            <h4 className="text-lg font-semibold text-red-900">
              {result.user_message?.title || "❌ Documento incorrecto"}
            </h4>
            <p className="text-sm text-red-700 mt-1">
              {result.user_message?.subtitle || "Este archivo no corresponde al tipo de documento seleccionado."}
            </p>
          </div>
        </div>

        {/* Tipo detectado */}
        {result.probable_document_type && (
          <div className="mt-4 pt-4 border-t border-red-200">
            <p className="text-sm text-red-700">
              <i className="fas fa-info-circle mr-2"></i>
              Parece que este documento podría ser: 
              <strong className="ml-1">{formatDocumentType(result.probable_document_type)}</strong>
            </p>
          </div>
        )}

        {/* Tips específicos */}
        {result.tips && result.tips.length > 0 && (
          <div className="mt-4 pt-4 border-t border-red-200">
            <p className="text-sm font-medium text-red-800 mb-2">
              <i className="fas fa-lightbulb mr-2"></i>
              Ten en cuenta:
            </p>
            <ul className="space-y-1">
              {result.tips.map((tip, idx) => (
                <li key={idx} className="text-sm text-red-700 flex items-start gap-2">
                  <span className="text-red-400 mt-1">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Scores */}
        <div className="mt-4 flex gap-4 text-sm text-red-700">
          <span>
            <i className="fas fa-eye mr-1"></i>
            Legibilidad: {result.legibility_score.toFixed(0)}%
          </span>
          <span>
            <i className="fas fa-bullseye mr-1"></i>
            Coincidencia: {result.match_score.toFixed(0)}%
          </span>
        </div>

        {/* Botones (solo si showActions=true) */}
        {showActions && (
          <div className="mt-4 pt-4 border-t border-red-200 flex flex-col sm:flex-row gap-3">
            <button
              onClick={onRetry}
              className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              <i className="fas fa-redo mr-2"></i>
              Subir documento correcto
            </button>
            {showForceUpload && result.next_actions?.includes("force_upload") && (
              <button
                onClick={onForceUpload}
                className="flex-1 px-4 py-2.5 border border-red-300 text-red-700 rounded-lg font-medium hover:bg-red-100 transition-colors text-sm"
              >
                <i className="fas fa-upload mr-2"></i>
                Subir de todos modos
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // ==========================================================================
  // ESTADO: ERROR
  // ==========================================================================
  if (result.status === "error") {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
            <i className="fas fa-exclamation-circle text-gray-600 text-2xl"></i>
          </div>
          <div className="flex-1">
            <h4 className="text-lg font-semibold text-gray-900">
              {result.user_message?.title || "Error de procesamiento"}
            </h4>
            <p className="text-sm text-gray-600 mt-1">
              {result.user_message?.subtitle || "Ocurrió un error al analizar el documento."}
            </p>
          </div>
        </div>

        {showActions && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={onRetry}
              className="w-full px-4 py-2.5 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              <i className="fas fa-redo mr-2"></i>
              Intentar de nuevo
            </button>
          </div>
        )}
      </div>
    );
  }

  return null;
}

// =============================================================================
// UTILIDADES
// =============================================================================

function formatFieldName(name: string): string {
  const translations: Record<string, string> = {
    "CURP": "CURP detectada",
    "RFC": "RFC detectado",
    "NOMBRE": "Nombre detectado",
    "FECHA": "Fecha detectada",
    "TELEFONO": "Teléfono detectado",
    "TELEFONO_MX": "Teléfono detectado",
    "EMAIL": "Email detectado",
    "CLABE": "CLABE detectada",
    "NSS": "NSS detectado",
    "CEDULA_NUM": "Número de cédula",
    "CODIGO_POSTAL": "C.P. detectado",
    "CONTACTO": "Datos de contacto",
  };
  
  return translations[name.toUpperCase()] || name.replace(/_/g, " ");
}

function formatDocumentType(type: string): string {
  const translations: Record<string, string> = {
    "ine_pasaporte": "INE o Pasaporte",
    "acta_nacimiento": "Acta de Nacimiento",
    "comprobante_domicilio": "Comprobante de Domicilio",
    "situacion_fiscal": "Constancia de Situación Fiscal",
    "curp": "CURP",
    "nss": "NSS / IMSS",
    "estado_cuenta": "Estado de Cuenta Bancario",
    "cartas_recomendacion": "Carta de Recomendación",
    "titulo_profesional": "Título Profesional",
    "cedula_profesional": "Cédula Profesional",
    "cv": "CV / Currículum",
    "cartas_trabajos_anteriores": "Constancia Laboral",
  };
  
  return translations[type] || type.replace(/_/g, " ");
}
