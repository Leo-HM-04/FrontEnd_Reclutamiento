'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export default function ThankYouPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-check-circle text-green-600 text-2xl"></i>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            ¡Gracias por tu solicitud!
          </h1>
          <p className="text-gray-600 mb-6">
            Hemos recibido tu perfil de reclutamiento correctamente. Nuestro equipo lo revisará.
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">¿Qué sucede ahora?</h3>
            <ul className="text-sm text-blue-800 space-y-1 text-left">
              <li>• Revisaremos tu solicitud en las próximas horas</li>
              <li>• Te contactaremos si necesitamos más información</li>
              <li>• Procesaremos tu perfil para encontrar candidatos ideales</li>
            </ul>
          </div>

          <button
            onClick={() => window.location.href = 'https://bechapra.com.mx'}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
          >
            Volver al inicio
          </button>
        </div>

        <div className="mt-6 text-xs text-gray-500">
          Si tienes alguna pregunta, puedes contactarnos en cualquier momento.
        </div>
      </div>
    </div>
  );
}