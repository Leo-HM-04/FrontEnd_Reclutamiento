'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// Tipos
type ModalType = 'alert' | 'confirm' | 'success' | 'error' | 'warning';

interface ModalOptions {
  title?: string;
  message: string;
  type?: ModalType;
  confirmText?: string;
  cancelText?: string;
}

interface ModalState extends ModalOptions {
  isOpen: boolean;
  resolve?: (value: boolean) => void;
}

interface ModalContextType {
  showAlert: (message: string, title?: string) => Promise<void>;
  showConfirm: (message: string, title?: string) => Promise<boolean>;
  showSuccess: (message: string, title?: string) => Promise<void>;
  showError: (message: string, title?: string) => Promise<void>;
  showWarning: (message: string, title?: string) => Promise<boolean>;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

// Hook para usar el modal
export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal debe usarse dentro de un ModalProvider');
  }
  return context;
};

// Componente del Modal
const Modal = ({ 
  isOpen, 
  type = 'alert', 
  title, 
  message, 
  confirmText = 'Aceptar',
  cancelText = 'Cancelar',
  onConfirm, 
  onCancel 
}: ModalState & { onConfirm: () => void; onCancel: () => void }) => {
  if (!isOpen) return null;

  const iconConfig = {
    alert: { icon: 'fa-info-circle', bg: 'bg-blue-100', color: 'text-blue-600' },
    confirm: { icon: 'fa-question-circle', bg: 'bg-blue-100', color: 'text-blue-600' },
    success: { icon: 'fa-check-circle', bg: 'bg-green-100', color: 'text-green-600' },
    error: { icon: 'fa-times-circle', bg: 'bg-red-100', color: 'text-red-600' },
    warning: { icon: 'fa-exclamation-triangle', bg: 'bg-yellow-100', color: 'text-yellow-600' },
  };

  const buttonConfig = {
    alert: 'bg-blue-600 hover:bg-blue-700',
    confirm: 'bg-blue-600 hover:bg-blue-700',
    success: 'bg-green-600 hover:bg-green-700',
    error: 'bg-red-600 hover:bg-red-700',
    warning: 'bg-yellow-600 hover:bg-yellow-700',
  };

  const config = iconConfig[type];
  const buttonClass = buttonConfig[type];
  const showCancelButton = type === 'confirm' || type === 'warning';

  const defaultTitles = {
    alert: 'Información',
    confirm: 'Confirmar acción',
    success: '¡Éxito!',
    error: 'Error',
    warning: 'Advertencia',
  };

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      {/* Overlay */}
      <div 
        className="fixed inset-0  transition-opacity" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
        onClick={showCancelButton ? onCancel : onConfirm}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all animate-modal-enter">
          {/* Header con icono */}
          <div className="flex flex-col items-center pt-8 pb-4 px-6">
            <div className={`w-16 h-16 ${config.bg} rounded-full flex items-center justify-center mb-4`}>
              <i className={`fas ${config.icon} ${config.color} text-3xl`} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 text-center">
              {title || defaultTitles[type]}
            </h3>
          </div>
          
          {/* Contenido */}
          <div className="px-6 pb-6">
            <p className="text-gray-600 text-center leading-relaxed">
              {message}
            </p>
          </div>
          
          {/* Botones */}
          <div className={`px-6 pb-6 flex ${showCancelButton ? 'gap-3' : 'justify-center'}`}>
            {showCancelButton && (
              <button
                onClick={onCancel}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
              >
                {cancelText}
              </button>
            )}
            <button
              onClick={onConfirm}
              className={`${showCancelButton ? 'flex-1' : 'px-12'} py-3 ${buttonClass} text-white font-semibold rounded-xl transition-colors`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>

      {/* Estilos de animación */}
      <style jsx>{`
        @keyframes modal-enter {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-modal-enter {
          animation: modal-enter 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

// Provider
export const ModalProvider = ({ children }: { children: ReactNode }) => {
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    message: '',
    type: 'alert',
  });

  const showModal = useCallback((options: ModalOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        ...options,
        resolve,
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    modalState.resolve?.(true);
    setModalState(prev => ({ ...prev, isOpen: false }));
  }, [modalState.resolve]);

  const handleCancel = useCallback(() => {
    modalState.resolve?.(false);
    setModalState(prev => ({ ...prev, isOpen: false }));
  }, [modalState.resolve]);

  const showAlert = useCallback(async (message: string, title?: string) => {
    await showModal({ message, title, type: 'alert' });
  }, [showModal]);

  const showConfirm = useCallback((message: string, title?: string) => {
    return showModal({ message, title, type: 'confirm' });
  }, [showModal]);

  const showSuccess = useCallback(async (message: string, title?: string) => {
    await showModal({ message, title, type: 'success' });
  }, [showModal]);

  const showError = useCallback(async (message: string, title?: string) => {
    await showModal({ message, title, type: 'error' });
  }, [showModal]);

  const showWarning = useCallback((message: string, title?: string) => {
    return showModal({ message, title, type: 'warning' });
  }, [showModal]);

  return (
    <ModalContext.Provider value={{ showAlert, showConfirm, showSuccess, showError, showWarning }}>
      {children}
      <Modal
        {...modalState}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </ModalContext.Provider>
  );
};

export default ModalProvider;
