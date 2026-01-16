'use client';

import React from 'react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: string;
  iconBgColor: string;
  iconColor: string;
  trend?: {
    value: number;
    isPositive: boolean;
    percentage: number;
  };
  tooltip?: string;
}

// Map iconBgColor to card background
const getCardBgColor = (iconBgColor: string): string => {
  if (iconBgColor.includes('blue')) return 'bg-blue-50';
  if (iconBgColor.includes('purple')) return 'bg-purple-50';
  if (iconBgColor.includes('green')) return 'bg-green-50';
  if (iconBgColor.includes('yellow')) return 'bg-yellow-50';
  if (iconBgColor.includes('orange')) return 'bg-orange-50';
  if (iconBgColor.includes('red')) return 'bg-red-50';
  return 'bg-gray-50';
};

export default function KPICard({
  title,
  value,
  subtitle,
  icon,
  iconBgColor,
  iconColor,
  trend,
  tooltip,
}: KPICardProps) {
  const cardBgColor = getCardBgColor(iconBgColor);
  
  return (
    <div className={`${cardBgColor} rounded-lg p-4 hover:shadow-sm transition-all`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`text-sm font-medium ${iconColor.replace('text-', 'text-')}`}>{title}</h3>
            {tooltip && (
              <button
                className="text-gray-400 hover:text-gray-600"
                title={tooltip}
              >
                <i className="fas fa-info-circle text-xs" />
              </button>
            )}
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {value}
          </p>
        </div>
        <div className={`w-10 h-10 ${iconBgColor} rounded-lg flex items-center justify-center`}>
          <i className={`${icon} ${iconColor} text-lg`} />
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-600">{subtitle}</p>
        
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium ${
            trend.isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            <i className={`fas fa-arrow-${trend.isPositive ? 'up' : 'down'} text-xs`} />
            <span>{trend.percentage.toFixed(1)}%</span>
          </div>
        )}
      </div>
    </div>
  );
}
