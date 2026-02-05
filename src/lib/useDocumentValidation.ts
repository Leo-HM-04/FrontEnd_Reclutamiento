"use client";

import { useState, useCallback } from "react";
import { apiClient } from "@/lib/api";

// =============================================================================
// TIPOS (exportados para uso en componentes)
// =============================================================================

export type ValidationStatus = 
  | "approved"
  | "warning"
  | "rejected_illegible"
  | "rejected_wrong_type"
  | "rejected_exclusion"
  | "analyzing"
  | "error"
  | "skipped"
  | "idle";  // Estado inicial

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

export interface UseDocumentValidationReturn {
  // Estado
  validationResult: ValidationResult | null;
  isValidating: boolean;
  validationStatus: ValidationStatus;
  
  // Acciones
  validateDocument: (file: File, documentType: string) => Promise<ValidationResult>;
  resetValidation: () => void;
  
  // Helpers
  shouldBlockUpload: () => boolean;
  canForceUpload: () => boolean;
  isValidationSuccessful: () => boolean;
}

// =============================================================================
// HOOK PRINCIPAL
// =============================================================================

export function useDocumentValidation(): UseDocumentValidationReturn {
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<ValidationStatus>("idle");

  /**
   * Valida un documento contra el endpoint de OCR del backend.
   */
  const validateDocument = useCallback(async (
    file: File, 
    documentType: string
  ): Promise<ValidationResult> => {
    setIsValidating(true);
    setValidationStatus("analyzing");
    setValidationResult(null);

    try {
      // Crear FormData
      const formData = new FormData();
      formData.append("file", file);
      formData.append("document_type", documentType);

      console.log("🔍 [VALIDATION] Enviando documento al backend...", {
        fileName: file.name,
        fileSize: file.size,
        documentType: documentType
      });

      // Llamar al endpoint
      const response = await apiClient.validateDocument(formData);
      
      console.log("✅ [VALIDATION] Respuesta del backend:", response);
      
      const result = response as ValidationResult;
      setValidationResult(result);
      setValidationStatus(result.status as ValidationStatus);
      
      console.log("📊 [VALIDATION] Estado actualizado:", result.status);
      
      return result;
      
    } catch (error: any) {
      console.error("❌ [VALIDATION] Error:", error);
      console.error("❌ [VALIDATION] Error completo:", JSON.stringify(error, null, 2));
      
      const errorResult: ValidationResult = {
        status: "error",
        legibility_score: 0,
        match_score: 0,
        document_type: documentType,
        flags_detected: [],
        masked_fields: {},
        user_message: {
          title: "Error de procesamiento",
          subtitle: error.message || "No pudimos procesar el archivo"
        },
        next_actions: ["retry"],
        tips: [],
        text_length: 0,
        processing_time: 0,
        error_message: error.message
      };
      
      setValidationResult(errorResult);
      setValidationStatus("error");
      
      return errorResult;
      
    } finally {
      setIsValidating(false);
    }
  }, []);

  /**
   * Resetea el estado de validación.
   */
  const resetValidation = useCallback(() => {
    setValidationResult(null);
    setValidationStatus("idle");
    setIsValidating(false);
  }, []);

  /**
   * Determina si el upload debe bloquearse basado en la validación.
   * Retorna true si el documento fue rechazado por ser ilegible
   * o por ser un documento no válido (ej: IFE).
   */
  const shouldBlockUpload = useCallback(() => {
    if (!validationResult) return false;
    
    // Bloquear solo en casos de exclusión (documento inválido tipo IFE)
    // Para ilegible y wrong_type, permitir forzar upload
    return validationResult.status === "rejected_exclusion";
  }, [validationResult]);

  /**
   * Determina si se puede forzar el upload a pesar de la validación.
   */
  const canForceUpload = useCallback(() => {
    if (!validationResult) return true;
    
    // Permitir forzar en warning, rejected_illegible, rejected_wrong_type
    const forceableStatuses: ValidationStatus[] = [
      "warning",
      "rejected_illegible", 
      "rejected_wrong_type"
    ];
    
    return (
      forceableStatuses.includes(validationResult.status as ValidationStatus) &&
      validationResult.next_actions?.includes("force_upload")
    );
  }, [validationResult]);

  /**
   * Verifica si la validación fue exitosa (aprobado o warning).
   */
  const isValidationSuccessful = useCallback(() => {
    if (!validationResult) return false;
    
    return ["approved", "skipped", "warning"].includes(validationResult.status);
  }, [validationResult]);

  return {
    validationResult,
    isValidating,
    validationStatus,
    validateDocument,
    resetValidation,
    shouldBlockUpload,
    canForceUpload,
    isValidationSuccessful,
  };
}

// =============================================================================
// TIPOS DE DOCUMENTOS QUE REQUIEREN VALIDACIÓN OCR
// =============================================================================

/**
 * Lista de tipos de documentos que deben validarse con OCR.
 * Los documentos de la sección 1 (estudios) no requieren validación estricta.
 */
export const DOCUMENTS_REQUIRING_VALIDATION = [
  // Sección 2: Información Personal
  "ine_pasaporte",
  "acta_nacimiento",
  "comprobante_domicilio",
  "situacion_fiscal",
  "curp",
  "nss",
  "estado_cuenta",
  "cartas_recomendacion",
  // Sección 3: Información de Grado Académico
  "titulo_profesional",
  "cedula_profesional",
  "cv",
  "cartas_trabajos_anteriores",
];

/**
 * Determina si un tipo de documento requiere validación OCR.
 */
export function requiresOCRValidation(documentType: string): boolean {
  return DOCUMENTS_REQUIRING_VALIDATION.includes(documentType);
}
