'use client';

import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFileAlt,
  faPlus,
  faSearch,
  faFilter,
  faEye,
  faEdit,
  faTrash,
  faUser,
  faBriefcase,
  faCalendarAlt,
  faPercent,
  faSort,
  faSortUp,
  faSortDown,
  faCheckCircle,
  faTimesCircle,
  faClock
} from '@fortawesome/free-solid-svg-icons';
import { apiClient } from '@/lib/api';

interface Application {
  id: number;
  candidate: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    current_position: string;
  };
  profile: {
    id: number;
    title: string;
    department: string;
  };
  status: string;
  application_date: string;
  match_percentage: number;
  evaluation_score: number;
  notes: string;
}

const STATUS_OPTIONS = [
  { value: 'applied', label: 'Aplicó', color: 'bg-blue-100 text-blue-800', icon: faClock },
  { value: 'reviewing', label: 'En Revisión', color: 'bg-yellow-100 text-yellow-800', icon: faEye },
  { value: 'shortlisted', label: 'Preseleccionado', color: 'bg-green-100 text-green-800', icon: faCheckCircle },
  { value: 'rejected', label: 'Rechazado', color: 'bg-red-100 text-red-800', icon: faTimesCircle },
  { value: 'withdrawn', label: 'Retirado', color: 'bg-gray-100 text-gray-800', icon: faTimesCircle },
];

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortField, setSortField] = useState('application_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getCandidateApplications();
      setApplications((response as any)?.data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      // Mock data for demonstration
      setApplications([
        {
          id: 1,
          candidate: {
            id: 1,
            first_name: 'Juan',
            last_name: 'Pérez García',
            email: 'juan.perez@email.com',
            current_position: 'Desarrollador Senior',
          },
          profile: {
            id: 1,
            title: 'Desarrollador Full Stack Senior',
            department: 'Tecnología',
          },
          status: 'shortlisted',
          application_date: '2024-11-01T10:00:00Z',
          match_percentage: 85,
          evaluation_score: 4.2,
          notes: 'Candidato muy promisorio con experiencia relevante.',
        },
        {
          id: 2,
          candidate: {
            id: 2,
            first_name: 'María',
            last_name: 'González López',
            email: 'maria.gonzalez@email.com',
            current_position: 'Product Manager',
          },
          profile: {
            id: 2,
            title: 'Product Manager Senior',
            department: 'Producto',
          },
          status: 'reviewing',
          application_date: '2024-11-02T14:30:00Z',
          match_percentage: 78,
          evaluation_score: 3.8,
          notes: 'Buena experiencia en gestión de productos digitales.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    return STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 4.0) return 'text-green-600';
    if (score >= 3.0) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMatchColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-100 text-green-800';
    if (percentage >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const filteredApplications = applications.filter(application => {
    const matchesSearch = searchTerm === '' || 
      `${application.candidate.first_name} ${application.candidate.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      application.candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      application.profile.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === '' || application.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const sortedApplications = [...filteredApplications].sort((a, b) => {
    let aValue: any = a[sortField as keyof Application];
    let bValue: any = b[sortField as keyof Application];
    
    // Handle nested properties
    if (sortField === 'candidate_name') {
      aValue = `${a.candidate.first_name} ${a.candidate.last_name}`.toLowerCase();
      bValue = `${b.candidate.first_name} ${b.candidate.last_name}`.toLowerCase();
    } else if (sortField === 'profile_title') {
      aValue = a.profile.title.toLowerCase();
      bValue = b.profile.title.toLowerCase();
    } else if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return faSort;
    return sortDirection === 'asc' ? faSortUp : faSortDown;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Action Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-end">
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center transition-colors"
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2" />
            Nueva Aplicación
          </button>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar aplicaciones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <FontAwesomeIcon icon={faFilter} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                <option value="">Todos los estados</option>
                {STATUS_OPTIONS.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Results Count */}
            <div className="flex items-center justify-end">
              <span className="text-gray-600">
                Mostrando {sortedApplications.length} de {applications.length} aplicaciones
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando aplicaciones...</p>
          </div>
        ) : sortedApplications.length === 0 ? (
          <div className="p-8 text-center">
            <FontAwesomeIcon icon={faFileAlt} className="text-6xl text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron aplicaciones</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter ? 'Intenta ajustar los filtros de búsqueda.' : 'No hay aplicaciones registradas.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('candidate_name')}
                  >
                    <div className="flex items-center">
                      Candidato
                      <FontAwesomeIcon icon={getSortIcon('candidate_name')} className="ml-1 text-gray-400" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('profile_title')}
                  >
                    <div className="flex items-center">
                      Posición
                      <FontAwesomeIcon icon={getSortIcon('profile_title')} className="ml-1 text-gray-400" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('application_date')}
                  >
                    <div className="flex items-center">
                      Fecha de Aplicación
                      <FontAwesomeIcon icon={getSortIcon('application_date')} className="ml-1 text-gray-400" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Compatibilidad
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('evaluation_score')}
                  >
                    <div className="flex items-center">
                      Evaluación
                      <FontAwesomeIcon icon={getSortIcon('evaluation_score')} className="ml-1 text-gray-400" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center">
                      Estado
                      <FontAwesomeIcon icon={getSortIcon('status')} className="ml-1 text-gray-400" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedApplications.map((application) => {
                  const statusConfig = getStatusConfig(application.status);
                  return (
                    <tr key={application.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-linear-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                            {application.candidate.first_name.charAt(0)}{application.candidate.last_name.charAt(0)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {application.candidate.first_name} {application.candidate.last_name}
                            </div>
                            <div className="text-sm text-gray-500">{application.candidate.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{application.profile.title}</div>
                        <div className="text-sm text-gray-500">{application.profile.department}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center">
                          <FontAwesomeIcon icon={faCalendarAlt} className="mr-2 text-gray-400" />
                          {formatDate(application.application_date)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${application.match_percentage}%` }}
                            ></div>
                          </div>
                          <span className={`text-sm font-medium px-2 py-1 rounded ${getMatchColor(application.match_percentage)}`}>
                            {application.match_percentage}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className={`text-sm font-medium ${getScoreColor(application.evaluation_score)}`}>
                            ★ {application.evaluation_score.toFixed(1)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${statusConfig.color}`}>
                          <FontAwesomeIcon icon={statusConfig.icon} className="mr-1" />
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            className="text-blue-600 hover:text-blue-900 p-1 rounded"
                            title="Ver detalles"
                          >
                            <FontAwesomeIcon icon={faEye} />
                          </button>
                          <button
                            className="text-green-600 hover:text-green-900 p-1 rounded"
                            title="Editar"
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </button>
                          <button
                            className="text-red-600 hover:text-red-900 p-1 rounded"
                            title="Eliminar"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}