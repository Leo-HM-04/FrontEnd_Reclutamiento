'use client';

import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUsers, 
  faPlus, 
  faSearch, 
  faFilter,
  faEye,
  faEdit,
  faTrash,
  faFileAlt,
  faPhoneAlt,
  faEnvelope,
  faMapMarkerAlt,
  faBriefcase,
  faGraduationCap,
  faCalendarAlt,
  faDollarSign,
  faLanguage,
  faCertificate,
  faSort,
  faSortUp,
  faSortDown
} from '@fortawesome/free-solid-svg-icons';
import { apiClient } from '@/lib/api';
import CandidateFormModal from '@/components/CandidateFormModal';
import CandidateDetailModal from '@/components/CandidateDetailModal';

interface Candidate {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  current_position: string;
  current_company: string;
  years_of_experience: number;
  education_level: string;
  status: string;
  created_at: string;
  skills: string[];
  salary_expectation_min?: number;
  salary_expectation_max?: number;
}

const STATUS_OPTIONS = [
  { value: 'new', label: 'Nuevo', color: 'bg-blue-100 text-blue-800' },
  { value: 'screening', label: 'En Revisión', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'qualified', label: 'Calificado', color: 'bg-green-100 text-green-800' },
  { value: 'interview', label: 'En Entrevista', color: 'bg-purple-100 text-purple-800' },
  { value: 'offer', label: 'Oferta Extendida', color: 'bg-orange-100 text-orange-800' },
  { value: 'hired', label: 'Contratado', color: 'bg-green-100 text-green-800' },
  { value: 'rejected', label: 'Rechazado', color: 'bg-red-100 text-red-800' },
  { value: 'withdrawn', label: 'Retirado', color: 'bg-gray-100 text-gray-800' },
];

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      // Aquí llamaremos a la API real
      const response = await apiClient.getCandidates();
      setCandidates((response as any)?.data || []);
    } catch (error) {
      console.error('Error fetching candidates:', error);
      // Datos de ejemplo mientras conectamos con la API
      setCandidates([
        {
          id: 1,
          first_name: 'Juan',
          last_name: 'Pérez García',
          email: 'juan.perez@email.com',
          phone: '+52 55 1234 5678',
          city: 'Ciudad de México',
          state: 'CDMX',
          current_position: 'Desarrollador Senior',
          current_company: 'TechCorp',
          years_of_experience: 5,
          education_level: 'Licenciatura',
          status: 'qualified',
          created_at: '2024-11-01T10:00:00Z',
          skills: ['React', 'Node.js', 'Python', 'PostgreSQL'],
          salary_expectation_min: 45000,
          salary_expectation_max: 55000,
        },
        {
          id: 2,
          first_name: 'María',
          last_name: 'González López',
          email: 'maria.gonzalez@email.com',
          phone: '+52 55 8765 4321',
          city: 'Guadalajara',
          state: 'Jalisco',
          current_position: 'Product Manager',
          current_company: 'InnovateMax',
          years_of_experience: 7,
          education_level: 'Maestría',
          status: 'interview',
          created_at: '2024-11-02T14:30:00Z',
          skills: ['Product Management', 'Agile', 'Scrum', 'Analytics'],
          salary_expectation_min: 60000,
          salary_expectation_max: 75000,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    return STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];
  };

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return 'No especificado';
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    if (min) return `Desde $${min.toLocaleString()}`;
    if (max) return `Hasta $${max.toLocaleString()}`;
    return 'No especificado';
  };

  const filteredCandidates = candidates.filter(candidate => {
    const matchesSearch = searchTerm === '' || 
      `${candidate.first_name} ${candidate.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.current_position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.current_company.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === '' || candidate.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const sortedCandidates = [...filteredCandidates].sort((a, b) => {
    let aValue: any = a[sortField as keyof Candidate];
    let bValue: any = b[sortField as keyof Candidate];
    
    // Handle undefined values
    if (aValue === undefined) aValue = '';
    if (bValue === undefined) bValue = '';
    
    if (typeof aValue === 'string') aValue = aValue.toLowerCase();
    if (typeof bValue === 'string') bValue = bValue.toLowerCase();
    
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

  const handleSaveCandidate = async (candidateData: any) => {
    try {
      if (selectedCandidate) {
        // Update existing candidate
        await apiClient.updateCandidate(selectedCandidate.id, candidateData);
      } else {
        // Create new candidate
        await apiClient.createCandidate(candidateData);
      }
      
      // Refresh candidates list
      await fetchCandidates();
      
      // Reset state
      setSelectedCandidate(null);
      setShowAddModal(false);
    } catch (error) {
      console.error('Error saving candidate:', error);
      // Here you could show an error message to the user
    }
  };

  const handleDeleteCandidate = async (candidateId: number) => {
    if (confirm('¿Estás seguro de que deseas eliminar este candidato?')) {
      try {
        await apiClient.deleteCandidate(candidateId);
        await fetchCandidates();
      } catch (error) {
        console.error('Error deleting candidate:', error);
      }
    }
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
            Agregar Candidato
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
                placeholder="Buscar candidatos..."
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
                Mostrando {sortedCandidates.length} de {candidates.length} candidatos
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Candidates Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando candidatos...</p>
          </div>
        ) : sortedCandidates.length === 0 ? (
          <div className="p-8 text-center">
            <FontAwesomeIcon icon={faUsers} className="text-6xl text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron candidatos</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter ? 'Intenta ajustar los filtros de búsqueda.' : 'Comienza agregando tu primer candidato.'}
            </p>
            {!searchTerm && !statusFilter && (
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
              >
                <FontAwesomeIcon icon={faPlus} className="mr-2" />
                Agregar Primer Candidato
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('first_name')}
                  >
                    <div className="flex items-center">
                      Nombre
                      <FontAwesomeIcon icon={getSortIcon('first_name')} className="ml-1 text-gray-400" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('current_position')}
                  >
                    <div className="flex items-center">
                      Posición Actual
                      <FontAwesomeIcon icon={getSortIcon('current_position')} className="ml-1 text-gray-400" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contacto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ubicación
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('years_of_experience')}
                  >
                    <div className="flex items-center">
                      Experiencia
                      <FontAwesomeIcon icon={getSortIcon('years_of_experience')} className="ml-1 text-gray-400" />
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
                {sortedCandidates.map((candidate) => {
                  const statusConfig = getStatusConfig(candidate.status);
                  return (
                    <tr key={candidate.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-linear-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                            {candidate.first_name.charAt(0)}{candidate.last_name.charAt(0)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {candidate.first_name} {candidate.last_name}
                            </div>
                            <div className="text-sm text-gray-500">{candidate.education_level}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{candidate.current_position}</div>
                        <div className="text-sm text-gray-500">{candidate.current_company}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center">
                          <FontAwesomeIcon icon={faEnvelope} className="mr-2 text-gray-400" />
                          {candidate.email}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center mt-1">
                          <FontAwesomeIcon icon={faPhoneAlt} className="mr-2 text-gray-400" />
                          {candidate.phone}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center">
                          <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2 text-gray-400" />
                          {candidate.city}
                        </div>
                        <div className="text-sm text-gray-500">{candidate.state}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{candidate.years_of_experience} años</div>
                        <div className="text-sm text-gray-500">
                          {formatSalary(candidate.salary_expectation_min, candidate.salary_expectation_max)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusConfig.color}`}>
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => {
                              setSelectedCandidate(candidate);
                              setShowDetailModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded"
                            title="Ver detalles"
                          >
                            <FontAwesomeIcon icon={faEye} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedCandidate(candidate);
                              setShowAddModal(true);
                            }}
                            className="text-green-600 hover:text-green-900 p-1 rounded"
                            title="Editar"
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </button>
                          <button
                            onClick={() => handleDeleteCandidate(candidate.id)}
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

      {/* Add/Edit Candidate Modal */}
      <CandidateFormModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setSelectedCandidate(null);
        }}
        candidate={selectedCandidate}
        onSave={handleSaveCandidate}
      />

      {/* Candidate Detail Modal */}
      <CandidateDetailModal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedCandidate(null);
        }}
        candidate={selectedCandidate}
        onEdit={() => {
          setShowDetailModal(false);
          setShowAddModal(true);
        }}
      />
    </div>
  );
}