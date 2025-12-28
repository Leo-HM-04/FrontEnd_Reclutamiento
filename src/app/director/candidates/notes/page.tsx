'use client';

import React, { useState, useEffect } from 'react';
import NotesPostItView from '@/components/NotesPostItView';
import { apiClient } from '@/lib/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faStickyNote,
  faPlus,
  faSearch,
  faFilter,
  faEye,
  faEdit,
  faTrash,
  faUser,
  faCalendarAlt,
  faSort,
  faSortUp,
  faSortDown,
  faTimes,
  faSave,
  faComment,
  faExclamationCircle,
  faInfoCircle,
  faCheckCircle,
  faFlag,
  faClock,
  faEllipsisV
} from '@fortawesome/free-solid-svg-icons';

interface Note {
  id: number;
  candidate: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  title: string;
  content: string;
  note_type: string;
  priority: string;
  created_by: {
    id: number;
    first_name: string;
    last_name: string;
  };
  created_date: string;
  updated_date: string;
  is_private: boolean;
  tags: string[];
}

const NOTE_TYPES = [
  { value: 'interview', label: 'Entrevista', color: 'bg-blue-100 text-blue-800', icon: faComment },
  { value: 'evaluation', label: 'Evaluación', color: 'bg-green-100 text-green-800', icon: faCheckCircle },
  { value: 'concern', label: 'Preocupación', color: 'bg-red-100 text-red-800', icon: faExclamationCircle },
  { value: 'general', label: 'General', color: 'bg-gray-100 text-gray-800', icon: faInfoCircle },
  { value: 'reference', label: 'Referencia', color: 'bg-purple-100 text-purple-800', icon: faFlag },
];

const PRIORITY_LEVELS = [
  { value: 'low', label: 'Baja', color: 'bg-green-100 text-green-800' },
  { value: 'medium', label: 'Media', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'high', label: 'Alta', color: 'bg-red-100 text-red-800' },
];

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [sortField, setSortField] = useState('created_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [expandedNotes, setExpandedNotes] = useState<Set<number>>(new Set());

  // Form state
  const [formData, setFormData] = useState({
    candidate_id: '',
    title: '',
    content: '',
    note_type: 'general',
    priority: 'medium',
    is_private: false,
    tags: [] as string[],
  });

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      // Mock data for demonstration
      setNotes([
        {
          id: 1,
          candidate: {
            id: 1,
            first_name: 'Juan',
            last_name: 'Pérez García',
            email: 'juan.perez@email.com',
          },
          title: 'Entrevista técnica completada',
          content: 'El candidato demostró excelentes conocimientos en React y Node.js. Resolvió los problemas de algoritmos correctamente y mostró buena comunicación. Puntos a considerar: experiencia limitada en arquitecturas de microservicios.',
          note_type: 'interview',
          priority: 'high',
          created_by: {
            id: 1,
            first_name: 'Director',
            last_name: 'RH',
          },
          created_date: '2024-11-01T10:00:00Z',
          updated_date: '2024-11-01T10:00:00Z',
          is_private: false,
          tags: ['entrevista', 'técnica', 'react', 'nodejs'],
        },
        {
          id: 2,
          candidate: {
            id: 2,
            first_name: 'María',
            last_name: 'González López',
            email: 'maria.gonzalez@email.com',
          },
          title: 'Referencias verificadas',
          content: 'Se contactó con dos referencias previas. Ambas confirmaron el excelente desempeño de la candidata en gestión de productos y liderazgo de equipos. Mencionaron especialmente sus habilidades de comunicación y resolución de problemas.',
          note_type: 'reference',
          priority: 'medium',
          created_by: {
            id: 2,
            first_name: 'Supervisor',
            last_name: 'RH',
          },
          created_date: '2024-11-02T14:30:00Z',
          updated_date: '2024-11-02T14:30:00Z',
          is_private: true,
          tags: ['referencias', 'liderazgo', 'comunicación'],
        },
      ]);
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNoteTypeConfig = (type: string) => {
    return NOTE_TYPES.find(t => t.value === type) || NOTE_TYPES[3]; // Default to general
  };

  const getPriorityConfig = (priority: string) => {
    return PRIORITY_LEVELS.find(p => p.value === priority) || PRIORITY_LEVELS[1]; // Default to medium
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substr(0, maxLength) + '...';
  };

  const toggleNoteExpansion = (noteId: number) => {
    const newExpanded = new Set(expandedNotes);
    if (newExpanded.has(noteId)) {
      newExpanded.delete(noteId);
    } else {
      newExpanded.add(noteId);
    }
    setExpandedNotes(newExpanded);
  };

  const filteredNotes = notes.filter(note => {
    const matchesSearch = searchTerm === '' || 
      `${note.candidate.first_name} ${note.candidate.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = typeFilter === '' || note.note_type === typeFilter;
    const matchesPriority = priorityFilter === '' || note.priority === priorityFilter;
    
    return matchesSearch && matchesType && matchesPriority;
  });

  const sortedNotes = [...filteredNotes].sort((a, b) => {
    let aValue: any = a[sortField as keyof Note];
    let bValue: any = b[sortField as keyof Note];
    
    // Handle nested properties
    if (sortField === 'candidate_name') {
      aValue = `${a.candidate.first_name} ${a.candidate.last_name}`.toLowerCase();
      bValue = `${b.candidate.first_name} ${b.candidate.last_name}`.toLowerCase();
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

  const handleAddNote = () => {
    setFormData({
      candidate_id: '',
      title: '',
      content: '',
      note_type: 'general',
      priority: 'medium',
      is_private: false,
      tags: [],
    });
    setShowAddModal(true);
  };

  const handleEditNote = (note: Note) => {
    setSelectedNote(note);
    setFormData({
      candidate_id: note.candidate.id.toString(),
      title: note.title,
      content: note.content,
      note_type: note.note_type,
      priority: note.priority,
      is_private: note.is_private,
      tags: note.tags,
    });
    setShowEditModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission logic here
    console.log('Form data:', formData);
    
    // Close modals
    setShowAddModal(false);
    setShowEditModal(false);
    
    // Refresh notes
    fetchNotes();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Action Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-end">
          <button
            onClick={handleAddNote}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center transition-colors"
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2" />
            Nueva Nota
          </button>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar notas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Type Filter */}
            <div className="relative">
              <FontAwesomeIcon icon={faFilter} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                <option value="">Todos los tipos</option>
                {NOTE_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority Filter */}
            <div className="relative">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="pl-4 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                <option value="">Todas las prioridades</option>
                {PRIORITY_LEVELS.map(priority => (
                  <option key={priority.value} value={priority.value}>
                    {priority.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Results Count */}
            <div className="flex items-center justify-end">
              <span className="text-gray-600">
                {sortedNotes.length} de {notes.length} notas
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes Grid */}
      <div className="space-y-6">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando notas...</p>
          </div>
        ) : sortedNotes.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <FontAwesomeIcon icon={faStickyNote} className="text-6xl text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron notas</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || typeFilter || priorityFilter ? 'Intenta ajustar los filtros de búsqueda.' : 'No hay notas registradas.'}
            </p>
            <button
              onClick={handleAddNote}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
            >
              Crear primera nota
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {sortedNotes.map((note) => {
              const typeConfig = getNoteTypeConfig(note.note_type);
              const priorityConfig = getPriorityConfig(note.priority);
              const isExpanded = expandedNotes.has(note.id);
              
              return (
                <div key={note.id} className="bg-white rounded-lg shadow-sm border-l-4 border-blue-500 hover:shadow-md transition-shadow">
                  <div className="p-6">
                    {/* Note Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{note.title}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <div className="w-6 h-6 bg-linear-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-medium mr-2">
                              {note.candidate.first_name.charAt(0)}{note.candidate.last_name.charAt(0)}
                            </div>
                            {note.candidate.first_name} {note.candidate.last_name}
                          </div>
                          <div className="flex items-center">
                            <FontAwesomeIcon icon={faCalendarAlt} className="mr-1" />
                            {formatDate(note.created_date)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditNote(note)}
                          className="text-gray-400 hover:text-gray-600 p-1 rounded"
                          title="Editar nota"
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button
                          className="text-gray-400 hover:text-red-600 p-1 rounded"
                          title="Eliminar nota"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </div>

                    {/* Note Badges */}
                    <div className="flex items-center space-x-2 mb-4">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${typeConfig.color}`}>
                        <FontAwesomeIcon icon={typeConfig.icon} className="mr-1" />
                        {typeConfig.label}
                      </span>
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${priorityConfig.color}`}>
                        {priorityConfig.label}
                      </span>
                      {note.is_private && (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                          Privada
                        </span>
                      )}
                    </div>

                    {/* Note Content */}
                    <div className="text-gray-700 mb-4">
                      {isExpanded ? (
                        <p className="whitespace-pre-wrap">{note.content}</p>
                      ) : (
                        <p>{truncateContent(note.content)}</p>
                      )}
                      {note.content.length > 150 && (
                        <button
                          onClick={() => toggleNoteExpansion(note.id)}
                          className="text-blue-600 hover:text-blue-800 text-sm mt-2 font-medium"
                        >
                          {isExpanded ? 'Ver menos' : 'Ver más'}
                        </button>
                      )}
                    </div>

                    {/* Note Tags */}
                    {note.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
                        {note.tags.map((tag, index) => (
                          <span 
                            key={index}
                            className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Note Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed top-16 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  {showAddModal ? 'Crear Nueva Nota' : 'Editar Nota'}
                </h2>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Título *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Type and Priority */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Nota
                    </label>
                    <select
                      value={formData.note_type}
                      onChange={(e) => setFormData({ ...formData, note_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {NOTE_TYPES.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prioridad
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {PRIORITY_LEVELS.map(priority => (
                        <option key={priority.value} value={priority.value}>
                          {priority.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contenido *
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Private Note Checkbox */}
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_private}
                      onChange={(e) => setFormData({ ...formData, is_private: e.target.checked })}
                      className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Nota privada (solo visible para ti)</span>
                  </label>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setShowEditModal(false);
                    }}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                  >
                    <FontAwesomeIcon icon={faSave} className="mr-2" />
                    {showAddModal ? 'Crear Nota' : 'Guardar Cambios'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}