'use client';

import React from 'react';

interface FunnelStage {
  label: string;
  value: number;
  percentage: number;
  color: string;
}

interface FunnelChartProps {
  stages: FunnelStage[];
}

export default function FunnelChart({ stages }: FunnelChartProps) {
  // Encontrar el valor máximo para normalizar los anchos
  const maxValue = Math.max(...stages.map(s => s.value), 1);

  return (
    <div className="space-y-3">
      {stages.map((stage, index) => {
        // Calcular ancho basado en el valor máximo (normalizado)
        const width = (stage.value / maxValue) * 100;
        
        // Calcular conversión vs etapa anterior
        const conversionRate = index > 0 
          ? ((stage.value / stages[index - 1].value) * 100).toFixed(1)
          : '100.0';

        return (
          <div key={index} className="relative">
            {/* Contenedor de la barra con ancho máximo */}
            <div className="w-full">
              <div
                className="h-16 rounded-lg flex items-center justify-between px-4 text-white font-semibold transition-all hover:opacity-90"
                style={{
                  width: `${Math.min(width, 100)}%`, // Nunca exceder 100%
                  backgroundColor: stage.color,
                  minWidth: '200px',
                  maxWidth: '100%', // Límite máximo
                }}
              >
                <span className="text-sm truncate">{stage.label}</span>
                <span className="text-lg ml-2">{stage.value}</span>
              </div>
            </div>

            {/* Información adicional */}
            <div className="flex items-center gap-4 mt-1 ml-4">
              <span className="text-sm text-gray-600">
                {stage.percentage.toFixed(1)}% del total
              </span>
              {index > 0 && (
                <span className="text-sm text-gray-500">
                  • Conversión: {conversionRate}%
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}