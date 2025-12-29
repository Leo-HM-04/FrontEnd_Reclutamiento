'use client';

/**
 * ════════════════════════════════════════════════════════════════════
 * PROFILE REPORT
 * ════════════════════════════════════════════════════════════════════
 * Reporte completo de un perfil individual (vacante)
 * ════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect } from 'react';
import { getProfileReport, formatDate, formatCurrency, getStatusColor, type ProfileReportData } from '@/lib/api-reports';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';

interface Props {
  profileId: number;
  onBack?: () => void;
}

export default function ProfileReport({ profileId, onBack }: Props) {
  const [data, setData] = useState<ProfileReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadData();
  }, [profileId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getProfileReport(profileId);
      setData(result);
    } catch (err) {
      setError('Error al cargar el reporte');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ═══════════════════════════════════════════════
  // EXPORTAR A PDF
  // ═══════════════════════════════════════════════
  const handleExportPDF = () => {
    setExporting(true);
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      let yPos = 20;
      const leftMargin = 20;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // ============================================
      // HELPER: Verificar nueva página
      // ============================================
      const checkNewPage = (height: number) => {
        if (yPos + height > pageHeight - 20) {
          pdf.addPage();
          yPos = 20;
        }
      };

      // ============================================
      // HEADER
      // ============================================
      pdf.setFillColor(37, 99, 235); // Azul
      pdf.rect(0, 0, pageWidth, 50, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('REPORTE DE PERFIL', leftMargin, 25);
      
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'normal');
      pdf.text(profile.position_title, leftMargin, 35);
      pdf.text(client.company_name, leftMargin, 42);

      yPos = 60;
      pdf.setTextColor(0, 0, 0);

      // ============================================
      // INFORMACIÓN GENERAL
      // ============================================
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Información General', leftMargin, yPos);
      yPos += 10;

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      
      const infoGeneral = [
        ['Estado:', profile.status_display],
        ['Prioridad:', profile.priority],
        ['Tipo de Servicio:', profile.service_type],
        ['Días Abierto:', `${progress.days_open} días`],
        ['Supervisor:', supervisor?.name || 'No asignado'],
      ];

      infoGeneral.forEach(([label, value]) => {
        checkNewPage(8);
        pdf.setFont('helvetica', 'bold');
        pdf.text(label, leftMargin, yPos);
        pdf.setFont('helvetica', 'normal');
        pdf.text(value, leftMargin + 50, yPos);
        yPos += 7;
      });

      yPos += 5;
      checkNewPage(25);

      // ============================================
      // UBICACIÓN Y SALARIO
      // ============================================
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Ubicación y Salario', leftMargin, yPos);
      yPos += 10;

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');

      const ubicacionSalario = [
        ['Ciudad:', profile.location.city],
        ['Estado:', profile.location.state],
        ['Modalidad:', profile.location.work_mode],
        ['Salario:', `$${profile.salary.min} - $${profile.salary.max} ${profile.salary.currency}/${profile.salary.period}`],
      ];

      ubicacionSalario.forEach(([label, value]) => {
        checkNewPage(8);
        pdf.setFont('helvetica', 'bold');
        pdf.text(label, leftMargin, yPos);
        pdf.setFont('helvetica', 'normal');
        pdf.text(value, leftMargin + 50, yPos);
        yPos += 7;
      });

      yPos += 5;
      checkNewPage(25);

      // ============================================
      // CLIENTE
      // ============================================
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Información del Cliente', leftMargin, yPos);
      yPos += 10;

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');

      const clienteInfo = [
        ['Empresa:', client.company_name],
        ['Industria:', client.industry],
        ['Contacto:', client.contact_name],
        ['Email:', client.contact_email],
        ['Teléfono:', client.contact_phone || 'No disponible'],
      ];

      clienteInfo.forEach(([label, value]) => {
        checkNewPage(8);
        pdf.setFont('helvetica', 'bold');
        pdf.text(label, leftMargin, yPos);
        pdf.setFont('helvetica', 'normal');
        pdf.text(value, leftMargin + 50, yPos);
        yPos += 7;
      });

      yPos += 10;
      checkNewPage(40);

      // ============================================
      // DESCRIPCIÓN DEL PUESTO
      // ============================================
      if (profile.description) {
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Descripción del Puesto', leftMargin, yPos);
        yPos += 10;

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        
        // Dividir texto largo en líneas
        const descriptionLines = pdf.splitTextToSize(
          profile.description, 
          pageWidth - (leftMargin * 2)
        );
        
        descriptionLines.forEach((line: string) => {
          checkNewPage(6);
          pdf.text(line, leftMargin, yPos);
          yPos += 5;
        });

        yPos += 5;
      }

      checkNewPage(50);

      // ============================================
      // REQUISITOS
      // ============================================
      if (profile.requirements) {
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Requisitos', leftMargin, yPos);
        yPos += 10;

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        
        const requirementsLines = pdf.splitTextToSize(
          profile.requirements, 
          pageWidth - (leftMargin * 2)
        );
        
        requirementsLines.forEach((line: string) => {
          checkNewPage(6);
          pdf.text(line, leftMargin, yPos);
          yPos += 5;
        });

        yPos += 5;
      }

      checkNewPage(50);

      // ============================================
      // BENEFICIOS
      // ============================================
      if (profile.benefits) {
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Beneficios', leftMargin, yPos);
        yPos += 10;

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        
        const benefitsLines = pdf.splitTextToSize(
          profile.benefits, 
          pageWidth - (leftMargin * 2)
        );
        
        benefitsLines.forEach((line: string) => {
          checkNewPage(6);
          pdf.text(line, leftMargin, yPos);
          yPos += 5;
        });

        yPos += 5;
      }

      checkNewPage(40);

      // ============================================
      // ESTADÍSTICAS DE CANDIDATOS
      // ============================================
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Estadísticas de Candidatos', leftMargin, yPos);
      yPos += 10;

      // Cuadros de estadísticas
      const stats = [
        { label: 'Total', value: candidates_stats.total, color: [37, 99, 235] },
        { label: 'Preseleccionados', value: candidates_stats.shortlisted, color: [147, 51, 234] },
        { label: 'Entrevistados', value: candidates_stats.interviewed, color: [34, 197, 94] },
      ];

      let xPos = leftMargin;
      stats.forEach((stat) => {
        pdf.setFillColor(stat.color[0], stat.color[1], stat.color[2]);
        pdf.roundedRect(xPos, yPos, 50, 25, 3, 3, 'F');
        
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(20);
        pdf.setFont('helvetica', 'bold');
        pdf.text(stat.value.toString(), xPos + 25, yPos + 12, { align: 'center' });
        
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(stat.label, xPos + 25, yPos + 20, { align: 'center' });
        
        xPos += 60;
      });

      pdf.setTextColor(0, 0, 0);
      yPos += 35;

      // ============================================
      // HISTORIAL DE ESTADOS (últimos 5)
      // ============================================
      checkNewPage(40);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Historial Reciente', leftMargin, yPos);
      yPos += 10;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');

      status_history.slice(0, 5).forEach((history) => {
        checkNewPage(15);
        pdf.setFont('helvetica', 'bold');
        pdf.text(formatDate(history.timestamp), leftMargin, yPos);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`${history.from_status_display} → ${history.to_status_display}`, leftMargin + 50, yPos);
        yPos += 6;
        if (history.notes) {
          pdf.setFontSize(9);
          pdf.setTextColor(100, 100, 100);
          pdf.text(history.notes, leftMargin + 50, yPos);
          pdf.setTextColor(0, 0, 0);
          pdf.setFontSize(10);
          yPos += 6;
        }
        yPos += 2;
      });

      // ============================================
      // FOOTER
      // ============================================
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

      // Guardar
      pdf.save(`Reporte_Perfil_${profile.position_title}_${new Date().toISOString().split('T')[0]}.pdf`);
      
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
    setExporting(true);
    try {
      // Crear workbook
      const wb = XLSX.utils.book_new();

      // ============================================
      // HOJA 1: Información del Perfil
      // ============================================
      const profileData = [
        ['REPORTE DE PERFIL'],
        [''],
        ['Información General'],
        ['Posición', profile.position_title],
        ['Estado', profile.status_display],
        ['Prioridad', profile.priority],
        ['Tipo de Servicio', profile.service_type],
        ['Días Abierto', progress.days_open],
        [''],
        ['Cliente'],
        ['Empresa', client.company_name],
        ['Industria', client.industry],
        ['Contacto', client.contact_name],
        ['Email', client.contact_email],
        [''],
        ['Ubicación'],
        ['Ciudad', profile.location.city],
        ['Estado', profile.location.state],
        ['Modalidad', profile.location.work_mode],
        [''],
        ['Salario'],
        ['Mínimo', `$${profile.salary.min}`],
        ['Máximo', `$${profile.salary.max}`],
        ['Moneda', profile.salary.currency],
        ['Periodo', profile.salary.period],
        [''],
        ['Requisitos'],
        ['Experiencia', `${profile.experience_required} años`],
        ['Nivel Educativo', profile.education_level],
      ];

      const ws1 = XLSX.utils.aoa_to_sheet(profileData);
      XLSX.utils.book_append_sheet(wb, ws1, 'Información');

      // ============================================
      // HOJA 2: Estadísticas de Candidatos
      // ============================================
      const statsData = [
        ['ESTADÍSTICAS DE CANDIDATOS'],
        [''],
        ['Métrica', 'Cantidad'],
        ['Total de Candidatos', candidates_stats.total],
        ['Preseleccionados', candidates_stats.shortlisted],
        ['En Entrevista', candidates_stats.interviewed],
        [''],
        ['Por Estado'],
        ...Object.entries(candidates_stats.by_status).map(([status, count]) => [status, count]),
      ];

      const ws2 = XLSX.utils.aoa_to_sheet(statsData);
      XLSX.utils.book_append_sheet(wb, ws2, 'Estadísticas');

      // ============================================
      // HOJA 3: Historial de Estados
      // ============================================
      const historyData = [
        ['HISTORIAL DE CAMBIOS DE ESTADO'],
        [''],
        ['Fecha', 'Estado Anterior', 'Estado Nuevo', 'Usuario', 'Notas'],
        ...status_history.map(h => [
          formatDate(h.timestamp),
          h.from_status_display,
          h.to_status_display,
          h.changed_by || 'Sistema',
          h.notes || ''
        ])
      ];

      const ws3 = XLSX.utils.aoa_to_sheet(historyData);
      XLSX.utils.book_append_sheet(wb, ws3, 'Historial');

      // Guardar archivo
      XLSX.writeFile(wb, `Reporte_Perfil_${profile.position_title}_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      alert('✅ Excel generado exitosamente');
    } catch (error) {
      console.error('Error al exportar Excel:', error);
      alert('❌ Error al generar Excel');
    } finally {
      setExporting(false);
    }
  };

  // ═══════════════════════════════════════════════
  // LOADING STATE
  // ═══════════════════════════════════════════════
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-blue-600 mb-4"></i>
          <p className="text-gray-600">Cargando reporte...</p>
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
        <p className="text-red-800 font-semibold">{error || 'No se pudo cargar el reporte'}</p>
        <button onClick={loadData} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
          Reintentar
        </button>
      </div>
    );
  }

  const { profile, client, supervisor, candidates_stats, progress, status_history } = data;

  return (
    <div id="report-content" className="space-y-6">
      {/* ═══════════════════════════════════════════════ */}
      {/* HEADER */}
      {/* ═══════════════════════════════════════════════ */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <i className="fas fa-briefcase text-3xl"></i>
              <h1 className="text-3xl font-bold">{profile.position_title}</h1>
            </div>
            <p className="text-blue-100 text-lg">{client.company_name}</p>
          </div>
          <div className="flex gap-2">
            {onBack && (
              <button 
                onClick={onBack} 
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                <i className="fas fa-arrow-left mr-2"></i>
                Volver
              </button>
            )}
            <button 
              onClick={handleExportPDF}
              disabled={exporting}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i className="fas fa-file-pdf mr-2"></i>
              {exporting ? 'Generando...' : 'PDF'}
            </button>
            <button 
              onClick={handleExportExcel}
              disabled={exporting}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i className="fas fa-file-excel mr-2"></i>
              {exporting ? 'Generando...' : 'Excel'}
            </button>
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium bg-${getStatusColor(profile.status)}-100 text-${getStatusColor(profile.status)}-800`}>
            {profile.status_display}
          </span>
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-white/20">
            {profile.priority === 'urgent' ? '🔥 Urgente' : profile.priority === 'high' ? '⚡ Alta' : '📝 Normal'}
          </span>
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-white/20">
            <i className="fas fa-calendar mr-1"></i>
            {progress.days_open} días abierto
          </span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════ */}
      {/* STATS CARDS */}
      {/* ═══════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Candidatos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <i className="fas fa-users text-2xl text-blue-600"></i>
            <span className="text-3xl font-bold text-gray-900">{candidates_stats.total}</span>
          </div>
          <p className="text-gray-600 text-sm">Total Candidatos</p>
        </div>

        {/* Preseleccionados */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <i className="fas fa-star text-2xl text-purple-600"></i>
            <span className="text-3xl font-bold text-gray-900">{candidates_stats.shortlisted}</span>
          </div>
          <p className="text-gray-600 text-sm">Preseleccionados</p>
        </div>

        {/* En Entrevista */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <i className="fas fa-comments text-2xl text-green-600"></i>
            <span className="text-3xl font-bold text-gray-900">{candidates_stats.interviewed}</span>
          </div>
          <p className="text-gray-600 text-sm">Entrevistados</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ═══════════════════════════════════════════════ */}
        {/* INFORMACIÓN DEL PERFIL */}
        {/* ═══════════════════════════════════════════════ */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <i className="fas fa-info-circle text-blue-600 mr-2"></i>
            Información del Perfil
          </h2>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-500">Ubicación</label>
              <p className="text-gray-900">{profile.location.city}, {profile.location.state}</p>
              <p className="text-sm text-gray-600">{profile.location.work_mode}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Salario</label>
              <p className="text-gray-900">
                {formatCurrency(profile.salary.min, profile.salary.currency)} - {formatCurrency(profile.salary.max, profile.salary.currency)}
              </p>
              <p className="text-sm text-gray-600">{profile.salary.period}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Experiencia Requerida</label>
              <p className="text-gray-900">{profile.experience_required}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Nivel Educativo</label>
              <p className="text-gray-900">{profile.education_level}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Tipo de Servicio</label>
              <p className="text-gray-900">{profile.service_type === 'specialized' ? 'Especializado' : 'Normal'}</p>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════ */}
        {/* INFORMACIÓN DEL CLIENTE */}
        {/* ═══════════════════════════════════════════════ */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <i className="fas fa-building text-blue-600 mr-2"></i>
            Cliente
          </h2>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-500">Empresa</label>
              <p className="text-gray-900 font-semibold">{client.company_name}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Industria</label>
              <p className="text-gray-900">{client.industry}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Contacto</label>
              <p className="text-gray-900">{client.contact_name}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Email</label>
              <p className="text-gray-900">{client.contact_email}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Teléfono</label>
              <p className="text-gray-900">{client.contact_phone}</p>
            </div>

            {supervisor && (
              <div className="pt-3 border-t border-gray-200">
                <label className="text-sm font-medium text-gray-500">Supervisor Asignado</label>
                <p className="text-gray-900">{supervisor.name}</p>
                <p className="text-sm text-gray-600">{supervisor.email}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════ */}
      {/* CANDIDATOS POR ESTADO */}
      {/* ═══════════════════════════════════════════════ */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <i className="fas fa-chart-pie text-blue-600 mr-2"></i>
          Candidatos por Estado
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{candidates_stats.applied}</div>
            <div className="text-sm text-gray-600">Aplicados</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{candidates_stats.screening}</div>
            <div className="text-sm text-gray-600">En Revisión</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{candidates_stats.shortlisted}</div>
            <div className="text-sm text-gray-600">Preseleccionados</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{candidates_stats.interviewed}</div>
            <div className="text-sm text-gray-600">Entrevistados</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{candidates_stats.offered}</div>
            <div className="text-sm text-gray-600">Con Oferta</div>
          </div>
          <div className="text-center p-4 bg-teal-50 rounded-lg">
            <div className="text-2xl font-bold text-teal-600">{candidates_stats.accepted}</div>
            <div className="text-sm text-gray-600">Aceptados</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{candidates_stats.rejected}</div>
            <div className="text-sm text-gray-600">Rechazados</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-600">{candidates_stats.total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════ */}
      {/* DESCRIPCIÓN Y REQUISITOS */}
      {/* ═══════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <i className="fas fa-file-alt text-blue-600 mr-2"></i>
            Descripción
          </h2>
          <p className="text-gray-700 whitespace-pre-line">{profile.description || 'No especificado'}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <i className="fas fa-check-circle text-blue-600 mr-2"></i>
            Requisitos
          </h2>
          <p className="text-gray-700 whitespace-pre-line">{profile.requirements || 'No especificado'}</p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════ */}
      {/* HISTORIAL DE CAMBIOS */}
      {/* ═══════════════════════════════════════════════ */}
      {status_history.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <i className="fas fa-history text-blue-600 mr-2"></i>
            Historial de Cambios
          </h2>

          <div className="space-y-3">
            {status_history.slice(0, 10).map((change, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <i className="fas fa-exchange-alt text-blue-600 mt-1"></i>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">
                    De <span className="font-semibold">{change.from_status_display}</span> a <span className="font-semibold">{change.to_status_display}</span>
                  </p>
                  {change.changed_by && (
                    <p className="text-xs text-gray-600">Por: {change.changed_by}</p>
                  )}
                  {change.notes && (
                    <p className="text-xs text-gray-600 mt-1">{change.notes}</p>
                  )}
                </div>
                <span className="text-xs text-gray-500">{formatDate(change.timestamp)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* FOOTER INFO */}
      {/* ═══════════════════════════════════════════════ */}
      <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
        <div className="flex justify-between items-center">
          <span>Creado: {formatDate(profile.created_at)}</span>
          <span>Última actualización: {formatDate(profile.updated_at)}</span>
          {progress.is_completed && profile.completed_at && (
            <span className="text-green-600 font-semibold">
              Completado: {formatDate(profile.completed_at)} ({progress.days_to_complete} días)
            </span>
          )}
        </div>
      </div>
    </div>
  );
}