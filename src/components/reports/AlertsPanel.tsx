'use client';

import React from 'react';

interface Alert {
  id: number;
  type: 'urgent' | 'important' | 'info';
  title: string;
  description: string;
  count: number;
  action?: () => void;
}

interface AlertsPanelProps {
  alerts: Alert[];
}

export default function AlertsPanel({ alerts }: AlertsPanelProps) {
  const getAlertStyle = (type: Alert['type']) => {
    switch (type) {
      case 'urgent':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          icon: 'text-red-600',
          badge: 'bg-red-100 text-red-800',
        };
      case 'important':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          icon: 'text-yellow-600',
          badge: 'bg-yellow-100 text-yellow-800',
        };
      case 'info':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          icon: 'text-blue-600',
          badge: 'bg-blue-100 text-blue-800',
        };
    }
  };

  const urgentCount = alerts.filter(a => a.type === 'urgent').length;
  const importantCount = alerts.filter(a => a.type === 'important').length;
  const infoCount = alerts.filter(a => a.type === 'info').length;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          <i className="fas fa-bell text-orange-600 mr-2" />
          Alertas y Acciones
        </h3>
        <div className="flex gap-2">
          {urgentCount > 0 && (
            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">
              {urgentCount} Urgentes
            </span>
          )}
          {importantCount > 0 && (
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
              {importantCount} Importantes
            </span>
          )}
        </div>
      </div>

      <div className="space-y-3 max-h-[500px] overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="text-center py-8">
            <i className="fas fa-check-circle text-green-500 text-4xl mb-2" />
            <p className="text-gray-500">No hay alertas pendientes</p>
          </div>
        ) : (
          alerts.map((alert) => {
            const style = getAlertStyle(alert.type);
            return (
              <div
                key={alert.id}
                className={`${style.bg} ${style.border} border rounded-lg p-4 hover:shadow-sm transition-shadow`}
              >
                <div className="flex items-start gap-3">
                  <i className={`fas fa-exclamation-circle ${style.icon} mt-1`} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-gray-900">{alert.title}</h4>
                      <span className={`px-2 py-1 ${style.badge} text-xs font-semibold rounded-full`}>
                        {alert.count}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{alert.description}</p>
                    {alert.action && (
                      <button
                        onClick={alert.action}
                        className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                      >
                        Ver detalles →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}