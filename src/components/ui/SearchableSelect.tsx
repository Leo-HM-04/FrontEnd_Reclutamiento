'use client';

/**
 * ============================================================
 * SEARCHABLE SELECT / COMBOBOX
 * ============================================================
 * Select con búsqueda integrada para filtrar opciones.
 * Soporta teclado (↑↓ Enter Escape), debounce, estados de carga.
 * Referencia visual: input de búsqueda en DocumentShareLinksDashboard.
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';

interface Option {
  value: string | number;
  label: string;
  searchText?: string; // texto adicional para búsqueda (email, etc.)
}

interface SearchableSelectProps {
  options: Option[];
  value?: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  emptyMessage?: string;
  loading?: boolean;
  className?: string;
  disabled?: boolean;
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Seleccionar...',
  emptyMessage = 'Sin resultados',
  loading = false,
  className = '',
  disabled = false,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filtrar opciones (con debounce implícito por re-render)
  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options;
    
    const term = searchTerm.toLowerCase();
    return options.filter((opt) => {
      const labelMatch = opt.label.toLowerCase().includes(term);
      const searchMatch = opt.searchText?.toLowerCase().includes(term);
      return labelMatch || searchMatch;
    });
  }, [options, searchTerm]);

  // Label del valor seleccionado
  const selectedLabel = useMemo(() => {
    const selected = options.find((opt) => opt.value === value);
    return selected?.label || '';
  }, [options, value]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus en input al abrir
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Reset highlighted al cambiar filtros
  useEffect(() => {
    setHighlightedIndex(0);
  }, [searchTerm]);

  // Scroll del item destacado
  useEffect(() => {
    if (isOpen && dropdownRef.current && highlightedIndex >= 0) {
      const items = dropdownRef.current.querySelectorAll('[data-option-index]');
      const item = items[highlightedIndex] as HTMLElement;
      if (item) {
        item.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  // ============================================================
  // HANDLERS
  // ============================================================

  const handleToggle = () => {
    if (disabled || loading) return;
    setIsOpen((prev) => !prev);
    if (!isOpen) {
      setSearchTerm('');
    }
  };

  const handleSelect = (optValue: string | number) => {
    onChange(optValue);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled || loading) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setIsOpen(true);
        setHighlightedIndex((prev) => Math.min(prev + 1, filteredOptions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setIsOpen(true);
        setHighlightedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (isOpen && filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex].value);
        } else {
          setIsOpen(true);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchTerm('');
        break;
      default:
        if (!isOpen && e.key.length === 1) {
          setIsOpen(true);
        }
        break;
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        disabled={disabled || loading}
        className={`w-full px-3 py-2 border rounded-lg text-left flex items-center justify-between transition-colors ${
          disabled || loading
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-white border-gray-300 hover:border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
        }`}
      >
        <span className={`truncate ${!selectedLabel ? 'text-gray-500' : 'text-gray-900'}`}>
          {loading ? 'Cargando...' : selectedLabel || placeholder}
        </span>
        <i className={`fas fa-chevron-${isOpen ? 'up' : 'down'} text-gray-400 text-xs ml-2`}></i>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm"></i>
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Options List */}
          <div
            ref={dropdownRef}
            className="max-h-60 overflow-y-auto"
            role="listbox"
          >
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="px-3 py-8 text-center text-sm text-gray-500">
                <i className="fas fa-search text-gray-300 text-2xl mb-2"></i>
                <p>{emptyMessage}</p>
                {searchTerm && <p className="text-xs mt-1">Intenta otro término de búsqueda</p>}
              </div>
            ) : (
              filteredOptions.map((option, index) => (
                <button
                  key={option.value}
                  type="button"
                  data-option-index={index}
                  onClick={() => handleSelect(option.value)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                    highlightedIndex === index
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-900 hover:bg-gray-50'
                  } ${option.value === value ? 'font-medium bg-blue-50' : ''}`}
                  role="option"
                  aria-selected={option.value === value}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 truncate">
                      <div className="font-medium">{option.label}</div>
                      {option.searchText && option.searchText !== option.label && (
                        <div className="text-xs text-gray-500 truncate mt-0.5">{option.searchText}</div>
                      )}
                    </div>
                    {option.value === value && (
                      <i className="fas fa-check text-blue-600 ml-2"></i>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
