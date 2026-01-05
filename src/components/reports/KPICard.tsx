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
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-medium text-gray-600">{title}</h3>
            {tooltip && (
              <button
                className="text-gray-400 hover:text-gray-600"
                title={tooltip}
              >
                <i className="fas fa-info-circle text-xs" />
              </button>
            )}
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {value}
          </p>
        </div>
        <div className={`w-12 h-12 ${iconBgColor} rounded-xl flex items-center justify-center`}>
          <i className={`${icon} ${iconColor} text-xl`} />
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{subtitle}</p>
        
        {trend && (
          <div className={`flex items-center gap-1 text-sm font-medium ${
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