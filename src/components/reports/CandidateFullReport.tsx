'use client';

/**
 * ════════════════════════════════════════════════════════════════════
 * CANDIDATE FULL REPORT
 * ════════════════════════════════════════════════════════════════════
 * Reporte completo de un candidato individual
 * ════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect } from 'react';
import { getCandidateFullReport, formatDate, formatCurrency, getStatusColor, type CandidateFullReportData } from '@/lib/api-reports';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

interface Props {
  candidateId: number;
  onBack?: () => void;
}

export default function CandidateFullReport({ candidateId, onBack }: Props) {
  const [data, setData] = useState<CandidateFullReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'applications' | 'documents' | 'evaluations' | 'notes'>('info');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadData();
  }, [candidateId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getCandidateFullReport(candidateId);
      setData(result);
    } catch (err) {
      setError('Error al cargar el reporte');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ═══════════════════════════════════════════════
  // LOADING STATE
  // ═══════════════════════════════════════════════
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-orange-600 mb-4"></i>
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

  // ═══════════════════════════════════════════════
  // EXPORTAR A PDF COMPLETO
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
      const contentWidth = pageWidth - (leftMargin * 2);

      const checkNewPage = (height: number) => {
        if (yPos + height > pageHeight - 20) {
          pdf.addPage();
          yPos = 20;
        }
      };

      // ============================================
      // HEADER
      // ============================================
      pdf.setFillColor(234, 88, 12);
      pdf.rect(0, 0, pageWidth, 70, 'F');
      
      // Avatar circular
      pdf.setFillColor(255, 255, 255, 0.2);
      pdf.circle(leftMargin + 10, 35, 12, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text(data.personal_info.full_name.charAt(0), leftMargin + 10, 38, { align: 'center' });
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text(data.personal_info.full_name, leftMargin + 28, 30);
      
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'normal');
      if (data.personal_info.current_position) {
        pdf.text(data.personal_info.current_position, leftMargin + 28, 40);
      }
      
      pdf.setFontSize(12);
      if (data.personal_info.current_company) {
        pdf.text(data.personal_info.current_company, leftMargin + 28, 48);
      }

      // Contacto
      pdf.setFontSize(9);
      let contactY = 60;
      pdf.text(`📧 ${data.personal_info.email}`, leftMargin, contactY);
      pdf.text(`📞 ${data.personal_info.phone}`, leftMargin + 70, contactY);
      pdf.text(`📍 ${data.personal_info.location.city}, ${data.personal_info.location.state}`, leftMargin + 130, contactY);

      yPos = 80;
      pdf.setTextColor(0, 0, 0);

      // ============================================
      // ESTADÍSTICAS
      // ============================================
      const stats = [
        { label: 'Aplicaciones', value: data.statistics.total_applications, color: [234, 88, 12] },
        { label: 'Documentos', value: data.statistics.total_documents, color: [34, 197, 94] },
        { label: 'Evaluaciones', value: data.statistics.total_evaluations, color: [59, 130, 246] },
        { label: 'Experiencia', value: `${data.personal_info.years_of_experience} años`, color: [168, 85, 247] },
      ];

      let xPos = leftMargin;
      const statWidth = (contentWidth - 15) / 4;
      stats.forEach((stat) => {
        pdf.setFillColor(stat.color[0], stat.color[1], stat.color[2]);
        pdf.roundedRect(xPos, yPos, statWidth, 20, 3, 3, 'F');
        
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text(stat.value.toString(), xPos + statWidth / 2, yPos + 10, { align: 'center' });
        
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.text(stat.label, xPos + statWidth / 2, yPos + 16, { align: 'center' });
        
        xPos += statWidth + 5;
      });

      pdf.setTextColor(0, 0, 0);
      yPos += 28;

      // ============================================
      // INFORMACIÓN PERSONAL
      // ============================================
      checkNewPage(15);
      pdf.setFillColor(249, 250, 251);
      pdf.roundedRect(leftMargin, yPos, contentWidth, 10, 2, 2, 'F');
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(234, 88, 12);
      pdf.text('INFORMACIÓN PERSONAL', leftMargin + 3, yPos + 7);
      pdf.setTextColor(0, 0, 0);
      yPos += 15;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      const personalData = [
        ['Nivel Educativo:', data.personal_info.education_level],
        ['Universidad:', data.personal_info.university || 'No especificado'],
        ['Título:', data.personal_info.degree || 'No especificado'],
      ];

      personalData.forEach(([label, value]) => {
        checkNewPage(6);
        pdf.setFont('helvetica', 'bold');
        pdf.text(label, leftMargin, yPos);
        pdf.setFont('helvetica', 'normal');
        pdf.text(value, leftMargin + 45, yPos);
        yPos += 6;
      });

      // Expectativa Salarial
      if (data.personal_info.salary_expectation) {
        checkNewPage(6);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Expectativa Salarial:', leftMargin, yPos);
        pdf.setFont('helvetica', 'normal');
        const salaryText = `${formatCurrency(data.personal_info.salary_expectation.min, data.personal_info.salary_expectation.currency)} - ${formatCurrency(data.personal_info.salary_expectation.max, data.personal_info.salary_expectation.currency)}`;
        pdf.text(salaryText, leftMargin + 45, yPos);
        yPos += 6;
      }

      yPos += 5;

      // ============================================
      // HABILIDADES
      // ============================================
      if (data.personal_info.skills && data.personal_info.skills.length > 0) {
        checkNewPage(15);
        pdf.setFillColor(249, 250, 251);
        pdf.roundedRect(leftMargin, yPos, contentWidth, 10, 2, 2, 'F');
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(234, 88, 12);
        pdf.text('HABILIDADES', leftMargin + 3, yPos + 7);
        pdf.setTextColor(0, 0, 0);
        yPos += 15;

        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        
        let skillX = leftMargin;
        let skillY = yPos;
        
        data.personal_info.skills.forEach((skill: string) => {
          const skillWidth = pdf.getTextWidth(skill) + 8;
          
          if (skillX + skillWidth > pageWidth - leftMargin) {
            skillX = leftMargin;
            skillY += 8;
            checkNewPage(8);
          }
          
          pdf.setFillColor(255, 237, 213);
          pdf.roundedRect(skillX, skillY - 5, skillWidth, 7, 2, 2, 'F');
          pdf.setTextColor(234, 88, 12);
          pdf.text(skill, skillX + 4, skillY);
          
          skillX += skillWidth + 3;
        });
        
        yPos = skillY + 8;
        pdf.setTextColor(0, 0, 0);
      }

      // ============================================
      // IDIOMAS
      // ============================================
      if (data.personal_info.languages && data.personal_info.languages.length > 0) {
        checkNewPage(15);
        pdf.setFillColor(249, 250, 251);
        pdf.roundedRect(leftMargin, yPos, contentWidth, 10, 2, 2, 'F');
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(234, 88, 12);
        pdf.text('IDIOMAS', leftMargin + 3, yPos + 7);
        pdf.setTextColor(0, 0, 0);
        yPos += 15;

        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        
        let langX = leftMargin;
        let langY = yPos;
        
        data.personal_info.languages.forEach((lang: any) => {
          const langText = typeof lang === 'object' ? `${lang.idioma} (${lang.nivel})` : lang;
          const langWidth = pdf.getTextWidth(langText) + 8;
          
          if (langX + langWidth > pageWidth - leftMargin) {
            langX = leftMargin;
            langY += 8;
            checkNewPage(8);
          }
          
          pdf.setFillColor(219, 234, 254);
          pdf.roundedRect(langX, langY - 5, langWidth, 7, 2, 2, 'F');
          pdf.setTextColor(37, 99, 235);
          pdf.text(langText, langX + 4, langY);
          
          langX += langWidth + 3;
        });
        
        yPos = langY + 8;
        pdf.setTextColor(0, 0, 0);
      }

      // ============================================
      // CERTIFICACIONES
      // ============================================
      if (data.personal_info.certifications && data.personal_info.certifications.length > 0) {
        checkNewPage(15);
        pdf.setFillColor(249, 250, 251);
        pdf.roundedRect(leftMargin, yPos, contentWidth, 10, 2, 2, 'F');
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(234, 88, 12);
        pdf.text('CERTIFICACIONES', leftMargin + 3, yPos + 7);
        pdf.setTextColor(0, 0, 0);
        yPos += 15;

        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        
        data.personal_info.certifications.forEach((cert: string) => {
          checkNewPage(6);
          pdf.text(`• ${cert}`, leftMargin, yPos);
          yPos += 6;
        });
        
        yPos += 3;
      }

      // ============================================
      // ENLACES
      // ============================================
      const hasLinks = data.personal_info.linkedin_url || data.personal_info.portfolio_url || data.personal_info.github_url;
      
      if (hasLinks) {
        checkNewPage(15);
        pdf.setFillColor(249, 250, 251);
        pdf.roundedRect(leftMargin, yPos, contentWidth, 10, 2, 2, 'F');
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(234, 88, 12);
        pdf.text('ENLACES', leftMargin + 3, yPos + 7);
        pdf.setTextColor(0, 0, 0);
        yPos += 15;

        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(37, 99, 235);
        
        if (data.personal_info.linkedin_url) {
          checkNewPage(6);
          pdf.text(`🔗 LinkedIn: ${data.personal_info.linkedin_url}`, leftMargin, yPos);
          yPos += 6;
        }
        
        if (data.personal_info.portfolio_url) {
          checkNewPage(6);
          pdf.text(`🔗 Portafolio: ${data.personal_info.portfolio_url}`, leftMargin, yPos);
          yPos += 6;
        }
        
        if (data.personal_info.github_url) {
          checkNewPage(6);
          pdf.text(`🔗 GitHub: ${data.personal_info.github_url}`, leftMargin, yPos);
          yPos += 6;
        }
        
        pdf.setTextColor(0, 0, 0);
        yPos += 3;
      }

      // ============================================
      // APLICACIONES
      // ============================================
      if (data.applications.length > 0) {
        checkNewPage(15);
        pdf.setFillColor(249, 250, 251);
        pdf.roundedRect(leftMargin, yPos, contentWidth, 10, 2, 2, 'F');
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(234, 88, 12);
        pdf.text('APLICACIONES A PERFILES', leftMargin + 3, yPos + 7);
        pdf.setTextColor(0, 0, 0);
        yPos += 15;

        pdf.setFontSize(10);
        data.applications.forEach((app, idx) => {
          checkNewPage(20);
          
          pdf.setFillColor(255, 255, 255);
          pdf.roundedRect(leftMargin, yPos, contentWidth, 18, 2, 2, 'D');
          
          pdf.setFont('helvetica', 'bold');
          pdf.text(`${idx + 1}. ${app.profile.title}`, leftMargin + 3, yPos + 6);
          
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(9);
          pdf.text(`Cliente: ${app.profile.client}`, leftMargin + 3, yPos + 11);
          pdf.text(`Estado: ${app.status_display}`, leftMargin + 3, yPos + 15);
          
          if (app.match_percentage !== null) {
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(34, 197, 94);
            pdf.text(`Match: ${app.match_percentage}%`, leftMargin + contentWidth - 25, yPos + 11);
            pdf.setTextColor(0, 0, 0);
          }
          
          yPos += 22;
        });
      }

      // ============================================
      // FOOTER
      // ============================================
      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text(
          `Generado el ${new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })} - Página ${i} de ${pageCount}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }

      pdf.save(`Reporte_Candidato_${data.personal_info.full_name}_${new Date().toISOString().split('T')[0]}.pdf`);
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

      // HOJA 1: Información Personal
      const personalData = [
        ['REPORTE DE CANDIDATO'],
        [''],
        ['Información Personal'],
        ['Nombre Completo', data.personal_info.full_name],
        ['Email', data.personal_info.email],
        ['Teléfono', data.personal_info.phone],
        ['Ciudad', data.personal_info.location.city],
        ['Estado', data.personal_info.location.state],
        ['Posición Actual', data.personal_info.current_position || ''],
        ['Empresa Actual', data.personal_info.current_company || ''],
        ['Años Experiencia', data.personal_info.years_of_experience],
        ['Nivel Educativo', data.personal_info.education_level],
      ];

      const ws1 = XLSX.utils.aoa_to_sheet(personalData);
      XLSX.utils.book_append_sheet(wb, ws1, 'Información');

      // HOJA 2: Aplicaciones
      const applicationsData = [
        ['APLICACIONES A PERFILES'],
        [''],
        ['Perfil', 'Cliente', 'Estado', 'Match %', 'Rating', 'Fecha Aplicación'],
        ...data.applications.map(app => [
          app.profile.title,
          app.profile.client,
          app.status_display,
          app.match_percentage || '',
          app.overall_rating || '',
          new Date(app.applied_at).toLocaleDateString('es-MX')
        ])
      ];

      const ws2 = XLSX.utils.aoa_to_sheet(applicationsData);
      XLSX.utils.book_append_sheet(wb, ws2, 'Aplicaciones');

      // HOJA 3: Documentos
      const documentsData = [
        ['DOCUMENTOS'],
        [''],
        ['Nombre', 'Tipo', 'Fecha'],
        ...data.documents.map(doc => [
          doc.filename,                    
          doc.type, 
          new Date(doc.uploaded_at).toLocaleDateString('es-MX')
        ])
      ];

      const ws3 = XLSX.utils.aoa_to_sheet(documentsData);
      XLSX.utils.book_append_sheet(wb, ws3, 'Documentos');

      XLSX.writeFile(wb, `Reporte_Candidato_${data.personal_info.full_name}_${new Date().toISOString().split('T')[0]}.xlsx`);
      alert('✅ Excel generado exitosamente');
    } catch (error) {
      console.error('Error al exportar Excel:', error);
      alert('❌ Error al generar Excel');
    } finally {
      setExporting(false);
    }
  };

  const { personal_info, applications, documents, evaluations, notes, statistics } = data;

  return (
    <div className="space-y-6">
      {/* ═══════════════════════════════════════════════ */}
      {/* HEADER */}
      {/* ═══════════════════════════════════════════════ */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-800 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-4xl">
                {personal_info.full_name.charAt(0)}
              </div>
              <div>
                <h1 className="text-3xl font-bold">{personal_info.full_name}</h1>
                <p className="text-orange-100 text-lg">{personal_info.current_position}</p>
                <p className="text-orange-200 text-sm">{personal_info.current_company}</p>
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
          </div>
        </div>

        {/* Contact Info */}
        <div className="flex flex-wrap gap-4 text-sm">
          <span><i className="fas fa-envelope mr-2"></i>{personal_info.email}</span>
          <span><i className="fas fa-phone mr-2"></i>{personal_info.phone}</span>
          <span><i className="fas fa-map-marker-alt mr-2"></i>{personal_info.location.city}, {personal_info.location.state}</span>
          {personal_info.linkedin_url && (
            <a href={personal_info.linkedin_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
              <i className="fab fa-linkedin mr-2"></i>LinkedIn
            </a>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════ */}
      {/* STATS CARDS */}
      {/* ═══════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">{statistics.total_applications}</div>
          <div className="text-sm text-gray-600">Aplicaciones</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{statistics.active_applications}</div>
          <div className="text-sm text-gray-600">Activas</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{statistics.total_documents}</div>
          <div className="text-sm text-gray-600">Documentos</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{statistics.total_evaluations}</div>
          <div className="text-sm text-gray-600">Evaluaciones</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">{statistics.avg_match_percentage.toFixed(0)}%</div>
          <div className="text-sm text-gray-600">Match Prom.</div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════ */}
      {/* TABS */}
      {/* ═══════════════════════════════════════════════ */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {/* Tab Headers */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('info')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'info' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-600 hover:text-gray-900'}`}
          >
            <i className="fas fa-user mr-2"></i>
            Información Personal
          </button>
          <button
            onClick={() => setActiveTab('applications')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'applications' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-600 hover:text-gray-900'}`}
          >
            <i className="fas fa-briefcase mr-2"></i>
            Aplicaciones ({applications.length})
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'documents' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-600 hover:text-gray-900'}`}
          >
            <i className="fas fa-file-alt mr-2"></i>
            Documentos ({documents.length})
          </button>
          <button
            onClick={() => setActiveTab('evaluations')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'evaluations' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-600 hover:text-gray-900'}`}
          >
            <i className="fas fa-clipboard-check mr-2"></i>
            Evaluaciones ({evaluations.length})
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'notes' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-600 hover:text-gray-900'}`}
          >
            <i className="fas fa-sticky-note mr-2"></i>
            Notas ({notes.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* ═══════════════════════════════════════════════ */}
          {/* TAB: INFORMACIÓN PERSONAL */}
          {/* ═══════════════════════════════════════════════ */}
          {activeTab === 'info' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 text-lg mb-3">Datos Generales</h3>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Experiencia</label>
                  <p className="text-gray-900">{personal_info.years_of_experience} años</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Nivel Educativo</label>
                  <p className="text-gray-900">{personal_info.education_level}</p>
                </div>

                {personal_info.university && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Universidad</label>
                    <p className="text-gray-900">{personal_info.university}</p>
                  </div>
                )}

                {personal_info.degree && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Título</label>
                    <p className="text-gray-900">{personal_info.degree}</p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-500">Expectativa Salarial</label>
                  <p className="text-gray-900">
                    {formatCurrency(personal_info.salary_expectation.min, personal_info.salary_expectation.currency)} - {formatCurrency(personal_info.salary_expectation.max, personal_info.salary_expectation.currency)}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Disponibilidad</label>
                  <p className="text-gray-900">{personal_info.availability}</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 text-lg mb-3">Habilidades y Conocimientos</h3>

                {personal_info.skills && personal_info.skills.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Habilidades</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {personal_info.skills.map((skill, idx) => (
                        <span key={idx} className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {personal_info.certifications && personal_info.certifications.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Certificaciones</label>
                    <ul className="list-disc list-inside mt-2 text-gray-900 space-y-1">
                      {personal_info.certifications.map((cert, idx) => (
                        <li key={idx}>{cert}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {personal_info.languages && personal_info.languages.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Idiomas</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {personal_info.languages.map((lang: any, idx: number) => (
                        <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                          {typeof lang === 'object' ? `${lang.idioma} (${lang.nivel})` : lang}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Enlaces */}
                <div className="pt-4 border-t border-gray-200">
                  <label className="text-sm font-medium text-gray-500">Enlaces</label>
                  <div className="space-y-2 mt-2">
                    {personal_info.linkedin_url && (
                      <a href={personal_info.linkedin_url} target="_blank" rel="noopener noreferrer" className="block text-blue-600 hover:underline text-sm">
                        <i className="fab fa-linkedin mr-2"></i>LinkedIn
                      </a>
                    )}
                    {personal_info.portfolio_url && (
                      <a href={personal_info.portfolio_url} target="_blank" rel="noopener noreferrer" className="block text-blue-600 hover:underline text-sm">
                        <i className="fas fa-briefcase mr-2"></i>Portafolio
                      </a>
                    )}
                    {personal_info.github_url && (
                      <a href={personal_info.github_url} target="_blank" rel="noopener noreferrer" className="block text-blue-600 hover:underline text-sm">
                        <i className="fab fa-github mr-2"></i>GitHub
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════ */}
          {/* TAB: APLICACIONES */}
          {/* ═══════════════════════════════════════════════ */}
          {activeTab === 'applications' && (
            <div className="space-y-4">
              {applications.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No hay aplicaciones registradas</p>
              ) : (
                applications.map((app) => (
                  <div key={app.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">{app.profile.title}</h4>
                        <p className="text-sm text-gray-600">{app.profile.client}</p>
                      </div>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full bg-${getStatusColor(app.status)}-100 text-${getStatusColor(app.status)}-800`}>
                        {app.status_display}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500">Match:</span>
                        <span className="ml-2 font-semibold text-gray-900">{app.match_percentage}%</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Rating:</span>
                        <span className="ml-2 font-semibold text-gray-900">{app.overall_rating}/5</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Aplicó:</span>
                        <span className="ml-2 text-gray-900">{formatDate(app.applied_at)}</span>
                      </div>
                      {app.interview_date && (
                        <div>
                          <span className="text-gray-500">Entrevista:</span>
                          <span className="ml-2 text-gray-900">{formatDate(app.interview_date)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════ */}
          {/* TAB: DOCUMENTOS */}
          {/* ═══════════════════════════════════════════════ */}
          {activeTab === 'documents' && (
            <div className="space-y-3">
              {documents.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No hay documentos adjuntos</p>
              ) : (
                documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <i className="fas fa-file-pdf text-2xl text-red-600"></i>
                      <div>
                        <p className="font-medium text-gray-900">{doc.filename}</p>
                        <p className="text-sm text-gray-600">{doc.type} • {formatDate(doc.uploaded_at)}</p>
                        {doc.description && (
                          <p className="text-xs text-gray-500 mt-1">{doc.description}</p>
                        )}
                      </div>
                    </div>
                    {doc.file_url && (
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <i className="fas fa-download mr-2"></i>
                        Descargar
                      </a>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════ */}
          {/* TAB: EVALUACIONES */}
          {/* ═══════════════════════════════════════════════ */}
          {activeTab === 'evaluations' && (
            <div className="space-y-3">
              {evaluations.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No hay evaluaciones registradas</p>
              ) : (
                evaluations.map((evaluation) => (
                  <div key={evaluation.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-900">{evaluation.profile.title}</h4>
                        {evaluation.template && (
                          <p className="text-sm text-gray-600">Plantilla: {evaluation.template}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-purple-600">{evaluation.score}/100</div>
                        <span className="text-xs text-gray-500">{evaluation.status}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      {evaluation.evaluator && (
                        <span><i className="fas fa-user mr-1"></i>{evaluation.evaluator}</span>
                      )}
                      {evaluation.completed_at && (
                        <span><i className="fas fa-calendar mr-1"></i>{formatDate(evaluation.completed_at)}</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════ */}
          {/* TAB: NOTAS */}
          {/* ═══════════════════════════════════════════════ */}
          {activeTab === 'notes' && (
            <div className="space-y-3">
              {notes.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No hay notas registradas</p>
              ) : (
                notes.map((note) => (
                  <div key={note.id} className="border-l-4 border-yellow-400 bg-yellow-50 p-4 rounded">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs font-semibold text-yellow-800 uppercase">{note.type}</span>
                      <span className="text-xs text-gray-500">{formatDate(note.created_at)}</span>
                    </div>
                    <p className="text-gray-700">{note.content}</p>
                    {note.created_by && (
                      <p className="text-xs text-gray-600 mt-2">
                        <i className="fas fa-user mr-1"></i>
                        {note.created_by}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}