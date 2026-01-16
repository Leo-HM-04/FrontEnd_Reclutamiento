'use client';

import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faSearch,
  faEye,
  faEdit,
  faTrash,
  faMapMarkerAlt,
  faBriefcase,
  faClock,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const mockJobs = [
  {
    id: 1,
    title: 'Desarrollador Frontend Senior',
    company: 'TechCorp Solutions',
    location: 'Madrid, España',
    type: 'Tiempo Completo',
    salary: '45.000€ - 55.000€',
    applications: 23,
    status: 'Activo',
    postedDate: '2024-01-15',
    description: 'Buscamos un desarrollador frontend senior con experiencia en React y TypeScript...',
  },
  {
    id: 2,
    title: 'Diseñador UX/UI',
    company: 'Creative Agency',
    location: 'Barcelona, España',
    type: 'Remoto',
    salary: '38.000€ - 48.000€',
    applications: 15,
    status: 'Activo',
    postedDate: '2024-01-14',
    description: 'Únete a nuestro equipo de diseño y crea experiencias excepcionales...',
  },
  {
    id: 3,
    title: 'Product Manager',
    company: 'StartupXYZ',
    location: 'Valencia, España',
    type: 'Tiempo Completo',
    salary: '50.000€ - 65.000€',
    applications: 31,
    status: 'Cerrado',
    postedDate: '2024-01-10',
    description: 'Lidera el desarrollo de productos innovadores en un entorno dinámico...',
  },
  {
    id: 4,
    title: 'Backend Developer',
    company: 'DataTech Inc',
    location: 'Sevilla, España',
    type: 'Híbrido',
    salary: '42.000€ - 52.000€',
    applications: 18,
    status: 'Borrador',
    postedDate: '2024-01-12',
    description: 'Desarrolla APIs robustas y escalables con las últimas tecnologías...',
  },
];

export default function JobsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [typeFilter, setTypeFilter] = useState('Todos');

  const filteredJobs = mockJobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'Todos' || job.status === statusFilter;
    const matchesType = typeFilter === 'Todos' || job.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Activo': return 'bg-green-100 text-green-800';
      case 'Cerrado': return 'bg-red-100 text-red-800';
      case 'Borrador': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Tiempo Completo': return 'bg-blue-100 text-blue-800';
      case 'Remoto': return 'bg-purple-100 text-purple-800';
      case 'Híbrido': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Empleos</h1>
          <p className="text-gray-600 mt-2">
            Administra todas las ofertas de trabajo
          </p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <FontAwesomeIcon icon={faPlus} className="w-4 h-4 mr-2" />
          Nueva Oferta
        </Button>
      </div>

      {/* Métricas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ofertas Activas</p>
                <p className="text-2xl font-bold text-green-600">
                  {mockJobs.filter(j => j.status === 'Activo').length}
                </p>
              </div>
              <FontAwesomeIcon icon={faBriefcase} className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Aplicaciones</p>
                <p className="text-2xl font-bold text-blue-600">
                  {mockJobs.reduce((acc, job) => acc + job.applications, 0)}
                </p>
              </div>
              <FontAwesomeIcon icon={faUsers} className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Borradores</p>
                <p className="text-2xl font-bold text-gray-600">
                  {mockJobs.filter(j => j.status === 'Borrador').length}
                </p>
              </div>
              <FontAwesomeIcon icon={faClock} className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Promedio Apps/Oferta</p>
                <p className="text-2xl font-bold text-purple-600">
                  {Math.round(mockJobs.reduce((acc, job) => acc + job.applications, 0) / mockJobs.length)}
                </p>
              </div>
              <FontAwesomeIcon icon={faUsers} className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <FontAwesomeIcon 
                  icon={faSearch} 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"
                />
                <input
                  type="text"
                  placeholder="Buscar ofertas..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <select
              className="w-full sm:w-40 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option>Todos</option>
              <option>Activo</option>
              <option>Cerrado</option>
              <option>Borrador</option>
            </select>
            <select
              className="w-full sm:w-40 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option>Todos</option>
              <option>Tiempo Completo</option>
              <option>Remoto</option>
              <option>Híbrido</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de empleos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredJobs.map((job) => (
          <Card key={job.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg">{job.title}</CardTitle>
                  <p className="text-gray-600 mt-1">{job.company}</p>
                </div>
                <div className="flex space-x-1">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(job.status)}`}>
                    {job.status}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="w-4 h-4 mr-2" />
                  {job.location}
                </div>
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(job.type)}`}>
                    {job.type}
                  </span>
                  <span className="text-sm font-medium text-green-600">{job.salary}</span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">{job.description}</p>
                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  <div className="flex items-center text-sm text-gray-600">
                    <FontAwesomeIcon icon={faUsers} className="w-4 h-4 mr-1" />
                    {job.applications} aplicaciones
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(job.postedDate).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex space-x-2 pt-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    <FontAwesomeIcon icon={faEye} className="w-4 h-4 mr-2" />
                    Ver
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    <FontAwesomeIcon icon={faEdit} className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                    <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
