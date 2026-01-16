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

// Map hex colors to Tailwind bg classes
const getColorClasses = (color: string): { bg: string; text: string; border: string } => {
  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    '#3B82F6': { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
    '#8B5CF6': { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
    '#06B6D4': { bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-300' },
    '#F59E0B': { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' },
    '#EC4899': { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-300' },
    '#6366F1': { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-300' },
    '#10B981': { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
  };
  return colorMap[color] || { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' };
};

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
        
        const colorClasses = getColorClasses(stage.color);

        return (
          <div key={index} className="relative">
            {/* Contenedor de la barra con ancho máximo */}
            <div className="w-full">
              <div
                className={`h-12 rounded-lg flex items-center justify-between px-4 font-semibold transition-all hover:shadow-sm border ${colorClasses.bg} ${colorClasses.text} ${colorClasses.border}`}
                style={{
                  width: `${Math.min(width, 100)}%`,
                  minWidth: '180px',
                  maxWidth: '100%',
                }}
              >
                <span className="text-sm truncate">{stage.label}</span>
                <span className="text-lg ml-2">{stage.value}</span>
              </div>
            </div>

            {/* Información adicional */}
            <div className="flex items-center gap-4 mt-1 ml-4">
              <span className="text-xs text-gray-600">
                {stage.percentage.toFixed(1)}% del total
              </span>
              {index > 0 && (
                <span className="text-xs text-gray-500">
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
