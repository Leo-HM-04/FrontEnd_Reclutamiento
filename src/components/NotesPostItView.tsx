'use client';

import React, { useState } from 'react';
import { useModal } from '@/context/ModalContext';

interface Note {
  id: number;
  candidate: number;
  candidate_name?: string;
  profile_id?: number;
  profile_title?: string;
  note: string;
  is_important: boolean;
  created_by_name: string;
  created_at: string;
}

interface NotesPostItViewProps {
  notes: Note[];
  onEdit?: (note: Note) => void;
  onDelete?: (noteId: number) => void;
  onToggleImportant?: (note: Note) => void;
}

export default function NotesPostItView({ 
  notes, 
  onEdit, 
  onDelete, 
  onToggleImportant 
}: NotesPostItViewProps) {
  const { showConfirm } = useModal();
  
  const [groupBy, setGroupBy] = useState<'profile' | 'candidate' | 'all'>('profile');
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  // Agrupar notas
  const groupedNotes = React.useMemo(() => {
    if (groupBy === 'all') {
      return { 'Todas las notas': notes };
    }

    const groups: Record<string, Note[]> = {};

    notes.forEach(note => {
      let key: string;
      
      if (groupBy === 'profile') {
        key = note.profile_title || 'Sin perfil asignado';
      } else {
        key = note.candidate_name || `Candidato #${note.candidate}`;
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(note);
    });

    return groups;
  }, [notes, groupBy]);

  // Colores aleatorios para post-its (más suaves)
  const getPostItColor = (index: number) => {
    const colors = [
      'bg-yellow-50 border-yellow-200',
      'bg-pink-50 border-pink-200',
      'bg-blue-50 border-blue-200',
      'bg-green-50 border-green-200',
      'bg-purple-50 border-purple-200',
      'bg-orange-50 border-orange-200',
    ];
    return colors[index % colors.length];
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Hace menos de 1 hora';
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    
    return date.toLocaleDateString('es-MX', { 
      day: 'numeric', 
      month: 'short' 
    });
  };

  // Truncar texto
  const truncateText = (text: string, maxLength: number = 120) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="space-y-6">
      {/* Controles de agrupación */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            <i className="fas fa-layer-group mr-2 text-blue-600"></i>
            Agrupar notas por:
          </h3>
          
          <div className="flex gap-2">
            <button
              onClick={() => setGroupBy('profile')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                groupBy === 'profile'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <i className="fas fa-briefcase mr-2"></i>
              Perfiles
            </button>
            
            <button
              onClick={() => setGroupBy('candidate')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                groupBy === 'candidate'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <i className="fas fa-user mr-2"></i>
              Candidatos
            </button>
            
            <button
              onClick={() => setGroupBy('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                groupBy === 'all'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <i className="fas fa-th mr-2"></i>
              Todas
            </button>
          </div>
        </div>
      </div>

      {/* Grupos de notas */}
      {Object.entries(groupedNotes).map(([groupName, groupNotes]) => (
        <div key={groupName} className="space-y-4">
          {/* Título del grupo */}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              {groupBy === 'profile' && <i className="fas fa-briefcase text-blue-600"></i>}
              {groupBy === 'candidate' && <i className="fas fa-user text-green-600"></i>}
              {groupName}
              <span className="text-sm font-normal text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                {groupNotes.length} {groupNotes.length === 1 ? 'nota' : 'notas'}
              </span>
            </h2>
          </div>

          {/* Post-its en grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {groupNotes.map((note, index) => (
              <div
                key={note.id}
                className={`
                  relative group
                  ${getPostItColor(index)}
                  border-2 rounded-lg shadow-md
                  hover:shadow-xl hover:-translate-y-1
                  transition-all duration-200
                  p-4 min-h-[200px] max-h-[250px]
                  flex flex-col
                  cursor-pointer
                `}
              >
                {/* Badge de importante */}
                {note.is_important && (
                  <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-2 shadow-lg">
                    <i className="fas fa-star text-sm"></i>
                  </div>
                )}

                {/* Contenido de la nota */}
                <div className="flex-1 overflow-hidden">
                  {/* Candidato/Perfil (si está agrupado de otra manera) */}
                  {groupBy !== 'candidate' && note.candidate_name && (
                    <div className="flex items-center gap-2 mb-2 text-xs text-gray-600">
                      <i className="fas fa-user"></i>
                      <span className="font-medium truncate">{note.candidate_name}</span>
                    </div>
                  )}

                  {groupBy !== 'profile' && note.profile_title && (
                    <div className="flex items-center gap-2 mb-2 text-xs text-gray-600">
                      <i className="fas fa-briefcase"></i>
                      <span className="font-medium truncate">{note.profile_title}</span>
                    </div>
                  )}

                  {/* Texto de la nota */}
                  <p className="text-sm text-gray-800 leading-relaxed mb-3 break-words">
                    {truncateText(note.note, 120)}
                  </p>
                </div>

                {/* Footer de la nota */}
                <div className="border-t border-gray-300 pt-2 mt-2">
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <i className="fas fa-user-circle"></i>
                      <span className="truncate max-w-[100px]">{note.created_by_name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <i className="fas fa-clock"></i>
                      <span>{formatDate(note.created_at)}</span>
                    </div>
                  </div>
                </div>

                {/* Botones de acción (aparecen al hover) */}
                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  {onToggleImportant && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleImportant(note);
                      }}
                      className={`p-2 rounded-lg transition-colors ${
                        note.is_important
                          ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                          : 'bg-white/80 text-gray-700 hover:bg-white'
                      }`}
                      title={note.is_important ? 'Marcar como normal' : 'Marcar como importante'}
                    >
                      <i className="fas fa-star text-xs"></i>
                    </button>
                  )}

                  {onEdit && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(note);
                      }}
                      className="p-2 bg-white/80 hover:bg-white text-blue-600 rounded-lg transition-colors"
                      title="Editar nota"
                    >
                      <i className="fas fa-edit text-xs"></i>
                    </button>
                  )}

                  {onDelete && (
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        const confirmed = await showConfirm('¿Eliminar esta nota?');
                        if (confirmed) {
                          onDelete(note.id);
                        }
                      }}
                      className="p-2 bg-white/80 hover:bg-white text-red-600 rounded-lg transition-colors"
                      title="Eliminar nota"
                    >
                      <i className="fas fa-trash text-xs"></i>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Mensaje si no hay notas */}
      {notes.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <i className="fas fa-sticky-note text-gray-300 text-6xl mb-4"></i>
          <p className="text-lg font-medium text-gray-900">No hay notas</p>
          <p className="text-gray-500 mt-1">Las notas aparecerán aquí cuando se creen</p>
        </div>
      )}
    </div>
  );
}
