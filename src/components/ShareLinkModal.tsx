'use client';

/**
 * ============================================================
 * MODAL DE COMPARTIR ENLACE DE AVANCE
 * ============================================================
 * Modal para generar, mostrar y copiar el enlace compartible
 * del avance de un perfil de reclutamiento
 * 
 * Características:
 * - Generación de enlace único
 * - Copiar al portapapeles
 * - Abrir en nueva pestaña
 * - Revocar enlace (opcional)
 * - Diseño profesional y responsive
 */

import React, { useState } from 'react';

// ============================================================
// INTERFACES
// ============================================================

interface ShareLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareLink: string;
  profileTitle: string;
  clientName: string;
  onRevoke?: () => void;
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export default function ShareLinkModal({
  isOpen,
  onClose,
  shareLink,
  profileTitle,
  clientName,
  onRevoke,
}: ShareLinkModalProps) {
  const [copied, setCopied] = useState(false);

  // ============================================================
  // FUNCIONES
  // ============================================================

  const handleCopy = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenInNewTab = () => {
    window.open(shareLink, '_blank', 'noopener,noreferrer');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Avance: ${profileTitle}`,
          text: `Seguimiento del proceso de reclutamiento para ${profileTitle}`,
          url: shareLink,
        });
      } catch (err) {
        console.log('Error al compartir:', err);
      }
    } else {
      handleCopy();
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 z-50 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-auto transform transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mr-4">
                <i className="fas fa-share-alt text-white text-xl"></i>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Compartir Avance</h2>
                <p className="text-sm text-gray-600 mt-1">Enlace público del progreso</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            {/* Información del Perfil */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
                    Perfil
                  </label>
                  <p className="text-sm font-semibold text-gray-900">{profileTitle}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
                    Cliente
                  </label>
                  <p className="text-sm font-semibold text-gray-900">{clientName}</p>
                </div>
              </div>
            </div>

            {/* Enlace para Compartir */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <i className="fas fa-link mr-2 text-blue-600"></i>
                Enlace para Compartir
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={shareLink}
                  readOnly
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleCopy}
                  className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
                    copied
                      ? 'bg-green-600 text-white'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  <i className={`fas ${copied ? 'fa-check-circle' : 'fa-copy'}`}></i>
                  {copied ? '¡Copiado!' : 'Copiar'}
                </button>
              </div>
            </div>

            {/* Información del Enlace */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <i className="fas fa-info-circle text-blue-600 text-lg mt-0.5 mr-3"></i>
                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">
                    Información del Enlace Compartible
                  </h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li className="flex items-start">
                      <i className="fas fa-check text-blue-600 mr-2 mt-0.5"></i>
                      <span>Este enlace puede ser compartido con tu cliente de forma segura</span>
                    </li>
                    <li className="flex items-start">
                      <i className="fas fa-check text-blue-600 mr-2 mt-0.5"></i>
                      <span>No requiere inicio de sesión ni credenciales</span>
                    </li>
                    <li className="flex items-start">
                      <i className="fas fa-check text-blue-600 mr-2 mt-0.5"></i>
                      <span>Se actualiza automáticamente en tiempo real</span>
                    </li>
                    <li className="flex items-start">
                      <i className="fas fa-check text-blue-600 mr-2 mt-0.5"></i>
                      <span>Válido indefinidamente hasta que lo revoque</span>
                    </li>
                    <li className="flex items-start">
                      <i className="fas fa-check text-blue-600 mr-2 mt-0.5"></i>
                      <span>Protege la privacidad de los candidatos (sin nombres reales)</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Acciones Rápidas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handleShare}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                <i className="fas fa-share-square"></i>
                Compartir
              </button>
              <button
                onClick={handleOpenInNewTab}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                <i className="fas fa-external-link-alt"></i>
                Abrir Vista Previa
              </button>
            </div>

            {/* Opción de Revocar (si está habilitada) */}
            {onRevoke && (
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
                  <i className="fas fa-exclamation-triangle text-red-600 text-lg mt-0.5"></i>
                  <div className="flex-1">
                    <h4 className="font-semibold text-red-900 mb-1">Zona de Peligro</h4>
                    <p className="text-sm text-red-700 mb-3">
                      Revocar el enlace generará uno nuevo y el enlace actual dejará de funcionar.
                    </p>
                    <button
                      onClick={onRevoke}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                    >
                      <i className="fas fa-ban mr-2"></i>
                      Revocar Enlace
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
            <button
              onClick={onClose}
              className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Cerrar
            </button>
            <button
              onClick={handleCopy}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2 transition-colors"
            >
              <i className="fas fa-copy"></i>
              Copiar Enlace
            </button>
          </div>
        </div>
      </div>
    </>
  );
}