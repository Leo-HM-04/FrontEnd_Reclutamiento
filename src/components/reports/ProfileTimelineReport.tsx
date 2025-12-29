'use client';

/**
 * ════════════════════════════════════════════════════════════════════
 * PROFILE TIMELINE REPORT
 * ════════════════════════════════════════════════════════════════════
 * Línea de tiempo completa del proceso de un perfil
 * ════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect } from 'react';
import { getProfileTimeline, formatDateTime, type ProfileTimelineData, type TimelineEvent } from '@/lib/api-reports';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

interface Props {
  profileId: number;
  onBack?: () => void;
}

export default function ProfileTimelineReport({ profileId, onBack }: Props) {
  const [data, setData] = useState<ProfileTimelineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadData();
  }, [profileId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getProfileTimeline(profileId);
      setData(result);
    } catch (err) {
      setError('Error al cargar el timeline');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar eventos por tipo
  const filteredEvents = filterType
    ? data?.timeline.filter(event => event.type === filterType) || []
    : data?.timeline || [];

  // ═══════════════════════════════════════════════
  // LOADING STATE
  // ═══════════════════════════════════════════════
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-green-600 mb-4"></i>
          <p className="text-gray-600">Cargando timeline...</p>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════
  // ERROR STATE
  // ═══════════════════════════════════════════════
  if (error || !data) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <i className="fas fa-exclamation-triangle text-red-600 text-2xl mb-2"></i>
        <p className="text-red-800 font-semibold">{error || 'No se pudo cargar el timeline'}</p>
        <button onClick={loadData} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
          Reintentar
        </button>
      </div>
    );
  }

  const { profile, timeline, total_events } = data;

  // Función para obtener el color de fondo del evento
  const getEventBgColor = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-50 border-blue-200',
      purple: 'bg-purple-50 border-purple-200',
      green: 'bg-green-50 border-green-200',
      orange: 'bg-orange-50 border-orange-200',
      yellow: 'bg-yellow-50 border-yellow-200',
      red: 'bg-red-50 border-red-200',
      cyan: 'bg-cyan-50 border-cyan-200',
    };
    return colors[color] || 'bg-gray-50 border-gray-200';
  };

  const getEventIconColor = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'text-blue-600 bg-blue-100',
      purple: 'text-purple-600 bg-purple-100',
      green: 'text-green-600 bg-green-100',
      orange: 'text-orange-600 bg-orange-100',
      yellow: 'text-yellow-600 bg-yellow-100',
      red: 'text-red-600 bg-red-100',
      cyan: 'text-cyan-600 bg-cyan-100',
    };
    return colors[color] || 'text-gray-600 bg-gray-100';
  };


  // ═══════════════════════════════════════════════
  // EXPORTAR A PDF
  // ═══════════════════════════════════════════════
  const handleExportPDF = () => {
    if (!data) return;
    
    setExporting(true);
    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      let yPos = 20;
      const leftMargin = 15;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const checkNewPage = (height: number) => {
        if (yPos + height > pageHeight - 20) {
          pdf.addPage();
          yPos = 20;
        }
      };

      // HEADER
      pdf.setFillColor(34, 197, 94); // Green
      pdf.rect(0, 0, pageWidth, 60, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(28);
      pdf.setFont('helvetica', 'bold');
      pdf.text('TIMELINE DEL PERFIL', leftMargin, 25);
      
      pdf.setFontSize(16);
      pdf.text(data.profile.title, leftMargin, 38);
      
      pdf.setFontSize(12);
      pdf.text(data.profile.client, leftMargin, 48);

      yPos = 70;
      pdf.setTextColor(0, 0, 0);

      // RESUMEN
      pdf.setFillColor(240, 253, 244);
      pdf.roundedRect(leftMargin, yPos, pageWidth - (leftMargin * 2), 20, 3, 3, 'F');
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Total de Eventos: ${data.total_events}`, leftMargin + 5, yPos + 12);

      yPos += 30;

      // EVENTOS DEL TIMELINE
      const events = filterType 
        ? data.timeline.filter((e: any) => e.type === filterType)
        : data.timeline;

      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Cronología de Eventos', leftMargin, yPos);
      yPos += 10;

      pdf.setFontSize(10);
      events.forEach((event: any, idx: number) => {
        checkNewPage(25);
        
        // Fecha y título
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${idx + 1}. ${event.title}`, leftMargin, yPos);
        yPos += 5;
        
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(100, 100, 100);
        pdf.text(new Date(event.timestamp).toLocaleString('es-MX'), leftMargin + 5, yPos);
        yPos += 5;
        
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(10);
        
        // Descripción
        const description = pdf.splitTextToSize(event.description, pageWidth - (leftMargin * 2) - 10);
        description.forEach((line: string) => {
          checkNewPage(5);
          pdf.text(line, leftMargin + 5, yPos);
          yPos += 5;
        });
        
        // Usuario
        if (event.user) {
          pdf.setFontSize(9);
          pdf.setTextColor(100, 100, 100);
          pdf.text(`Usuario: ${event.user}`, leftMargin + 5, yPos);
          yPos += 5;
        }
        
        pdf.setTextColor(0, 0, 0);
        yPos += 3;
      });

      // FOOTER
      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text(
          `Generado el ${new Date().toLocaleDateString('es-MX')} - Página ${i} de ${pageCount}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }

      pdf.save(`Timeline_${data.profile.title}_${new Date().toISOString().split('T')[0]}.pdf`);
      alert('✅ PDF generado exitosamente');
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      alert('❌ Error al generar PDF');
    } finally {
      setExporting(false);
    }
  };

  // ═══════════════════════════════════════════════
  // EXPORTAR A EXCEL
  // ═══════════════════════════════════════════════
  const handleExportExcel = () => {
    if (!data) return;
    
    setExporting(true);
    try {
      const wb = XLSX.utils.book_new();

      const events = filterType 
        ? data.timeline.filter((e: any) => e.type === filterType)
        : data.timeline;

      // HOJA: Timeline
      const timelineData = [
        ['TIMELINE DEL PERFIL'],
        ['Perfil:', data.profile.title],
        ['Cliente:', data.profile.client],
        ['Total Eventos:', data.total_events],
        [''],
        ['#', 'Fecha', 'Evento', 'Descripción', 'Usuario'],
        ...events.map((event: any, idx: number) => [
          idx + 1,
          new Date(event.timestamp).toLocaleString('es-MX'),
          event.title,
          event.description,
          event.user || ''
        ])
      ];

      const ws = XLSX.utils.aoa_to_sheet(timelineData);
      XLSX.utils.book_append_sheet(wb, ws, 'Timeline');

      XLSX.writeFile(wb, `Timeline_${data.profile.title}_${new Date().toISOString().split('T')[0]}.xlsx`);
      alert('✅ Excel generado exitosamente');
    } catch (error) {
      console.error('Error al exportar Excel:', error);
      alert('❌ Error al generar Excel');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ═══════════════════════════════════════════════ */}
      {/* HEADER */}
      {/* ═══════════════════════════════════════════════ */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <i className="fas fa-history text-3xl"></i>
              <div>
                <h1 className="text-3xl font-bold">Timeline del Proceso</h1>
                <p className="text-green-100 text-lg">{profile.title}</p>
                <p className="text-green-200 text-sm">{profile.client}</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {onBack && (
              <button onClick={onBack} className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
                <i className="fas fa-arrow-left mr-2"></i>
                Volver
              </button>
            )}
            <button 
              onClick={handleExportPDF}
              disabled={exporting}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors disabled:opacity-50"
            >
              <i className="fas fa-file-pdf mr-2"></i>
              {exporting ? 'Generando...' : 'PDF'}
            </button>
            <button 
              onClick={handleExportExcel}
              disabled={exporting}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors disabled:opacity-50"
            >
              <i className="fas fa-file-excel mr-2"></i>
              {exporting ? 'Generando...' : 'Excel'}
            </button>
            <button onClick={() => window.print()} className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
              <i className="fas fa-print"></i>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-white/20">
            <i className="fas fa-list mr-2"></i>
            {total_events} eventos
          </span>
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-white/20">
            <i className="fas fa-filter mr-2"></i>
            Mostrando: {filteredEvents.length}
          </span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════ */}
      {/* FILTROS */}
      {/* ═══════════════════════════════════════════════ */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <i className="fas fa-filter mr-2"></i>
          Filtrar por Tipo de Evento
        </label>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        >
          <option value="">Todos los eventos</option>
          <option value="profile_created">Perfil Creado</option>
          <option value="status_change">Cambio de Estado</option>
          <option value="candidate_applied">Candidato Aplicó</option>
          <option value="interview_scheduled">Entrevista Agendada</option>
          <option value="offer_extended">Oferta Extendida</option>
          <option value="offer_accepted">Oferta Aceptada</option>
          <option value="profile_completed">Perfil Completado</option>
        </select>
      </div>

      {/* ═══════════════════════════════════════════════ */}
      {/* TIMELINE */}
      {/* ═══════════════════════════════════════════════ */}
      {filteredEvents.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
          <i className="fas fa-inbox text-4xl text-gray-400 mb-4"></i>
          <p className="text-gray-600">No hay eventos para mostrar</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="relative">
            {/* Línea vertical del timeline */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>

            {/* Eventos */}
            <div className="space-y-6">
              {filteredEvents.map((event, idx) => (
                <div key={idx} className="relative flex items-start">
                  {/* Icono */}
                  <div className={`relative z-10 flex items-center justify-center w-16 h-16 rounded-full ${getEventIconColor(event.color)}`}>
                    <i className={`${event.icon} text-xl`}></i>
                  </div>

                  {/* Contenido */}
                  <div className={`ml-6 flex-1 p-4 rounded-lg border ${getEventBgColor(event.color)}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                        <p className="text-sm text-gray-600">{event.description}</p>
                      </div>
                      <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
                        {formatDateTime(event.timestamp)}
                      </span>
                    </div>

                    {/* Usuario */}
                    {event.user && (
                      <p className="text-sm text-gray-600 mt-2">
                        <i className="fas fa-user mr-1"></i>
                        {event.user}
                      </p>
                    )}

                    {/* Notas */}
                    {event.notes && (
                      <p className="text-sm text-gray-700 mt-2 p-2 bg-white rounded border border-gray-200">
                        <i className="fas fa-comment mr-1"></i>
                        {event.notes}
                      </p>
                    )}

                    {/* Acciones */}
                    {event.candidate_id && (
                      <div className="mt-3">
                        <button className="text-sm text-blue-600 hover:text-blue-800">
                          <i className="fas fa-eye mr-1"></i>
                          Ver candidato
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* LEYENDA */}
      {/* ═══════════════════════════════════════════════ */}
      <div className="bg-gray-50 rounded-lg p-4">
        <p className="text-sm font-medium text-gray-700 mb-3">Leyenda de Eventos:</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <i className="fas fa-plus-circle text-blue-600 text-sm"></i>
            </div>
            <span className="text-sm text-gray-700">Creación</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
              <i className="fas fa-exchange-alt text-purple-600 text-sm"></i>
            </div>
            <span className="text-sm text-gray-700">Cambio Estado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
              <i className="fas fa-user-plus text-green-600 text-sm"></i>
            </div>
            <span className="text-sm text-gray-700">Candidato</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
              <i className="fas fa-calendar-check text-orange-600 text-sm"></i>
            </div>
            <span className="text-sm text-gray-700">Entrevista</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
              <i className="fas fa-handshake text-yellow-600 text-sm"></i>
            </div>
            <span className="text-sm text-gray-700">Oferta</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
              <i className="fas fa-check-circle text-green-600 text-sm"></i>
            </div>
            <span className="text-sm text-gray-700">Aceptación</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
              <i className="fas fa-flag-checkered text-green-600 text-sm"></i>
            </div>
            <span className="text-sm text-gray-700">Completado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
              <i className="fas fa-times-circle text-red-600 text-sm"></i>
            </div>
            <span className="text-sm text-gray-700">Cancelado</span>
          </div>
        </div>
      </div>
    </div>
  );
}