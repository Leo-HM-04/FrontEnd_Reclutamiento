'use client';

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers,
  faBriefcase,
  faFileAlt,
  faCheckCircle,
} from '@fortawesome/free-solid-svg-icons';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const mockMetrics = {
  totalCandidates: 1247,
  activeJobs: 23,
  pendingApplications: 156,
  hiredThisMonth: 12,
};

const mockRecentApplications = [
  { id: 1, candidate: 'Ana García', position: 'Desarrollador Frontend', status: 'Entrevista' },
  { id: 2, candidate: 'Carlos López', position: 'Diseñador UX/UI', status: 'Revisión' },
  { id: 3, candidate: 'María Rodriguez', position: 'Project Manager', status: 'Pendiente' },
  { id: 4, candidate: 'Juan Pérez', position: 'Backend Developer', status: 'Contratado' },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Bienvenido al sistema de reclutamiento
        </p>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Candidatos</CardTitle>
            <FontAwesomeIcon icon={faUsers} className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockMetrics.totalCandidates.toLocaleString()}</div>
            <p className="text-xs text-gray-500">
              +20.1% desde el mes pasado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empleos Activos</CardTitle>
            <FontAwesomeIcon icon={faBriefcase} className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockMetrics.activeJobs}</div>
            <p className="text-xs text-gray-500">
              +2 nuevas posiciones
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aplicaciones Pendientes</CardTitle>
            <FontAwesomeIcon icon={faFileAlt} className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockMetrics.pendingApplications}</div>
            <p className="text-xs text-gray-500">
              Requieren revisión
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contratados Este Mes</CardTitle>
            <FontAwesomeIcon icon={faCheckCircle} className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockMetrics.hiredThisMonth}</div>
            <p className="text-xs text-gray-500">
              Meta: 15 contrataciones
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sección de aplicaciones recientes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Aplicaciones Recientes</CardTitle>
            <CardDescription>
              Las últimas aplicaciones recibidas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockRecentApplications.map((app) => (
                <div key={app.id} className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {app.candidate}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {app.position}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    app.status === 'Contratado' 
                      ? 'bg-green-100 text-green-800'
                      : app.status === 'Entrevista'
                      ? 'bg-blue-100 text-blue-800'
                      : app.status === 'Revisión'
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {app.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actividad del Sistema</CardTitle>
            <CardDescription>
              Resumen de actividad de las últimas 24 horas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">15 nuevas aplicaciones recibidas</p>
                  <p className="text-xs text-gray-500">Hace 2 horas</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">3 entrevistas programadas</p>
                  <p className="text-xs text-gray-500">Hace 4 horas</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">2 ofertas de trabajo publicadas</p>
                  <p className="text-xs text-gray-500">Hace 6 horas</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">1 candidato contratado</p>
                  <p className="text-xs text-gray-500">Hace 8 horas</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}