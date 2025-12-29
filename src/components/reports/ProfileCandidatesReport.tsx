'use client';

/**
 * ════════════════════════════════════════════════════════════════════
 * PROFILE CANDIDATES REPORT
 * ════════════════════════════════════════════════════════════════════
 * Lista de todos los candidatos que aplicaron a un perfil
 * ════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect } from 'react';
import { getProfileCandidates, formatDate, getStatusColor, type ProfileCandidatesData } from '@/lib/api-reports';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

interface Props {
  profileId: number;
  onBack?: () => void;
  onViewCandidate?: (candidateId: number) => void;
}

export default function ProfileCandidatesReport({ profileId, onBack, onViewCandidate }: Props) {
  const [data, setData] = useState<ProfileCandidatesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadData();
  }, [profileId, statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getProfileCandidates(profileId, statusFilter || undefined);
      setData(result);
    } catch (err) {
      setError('Error al cargar candidatos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ═══════════════════════════════════════════════
  // EXPORTAR A PDF
  // ═══════════════════════════════════════════════
  const handleExportPDF = () => {
    if (!data) return;
    
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

      const checkNewPage = (height: number) => {
        if (yPos + height > pageHeight - 20) {
          pdf.addPage();
          yPos = 20;
        }
      };

      // HEADER
      pdf.setFillColor(147, 51, 234);
      pdf.rect(0, 0, pageWidth, 50, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('CANDIDATOS DEL PERFIL', leftMargin, 25);
      
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'normal');
      pdf.text(data.profile.title, leftMargin, 35);
      pdf.text(data.profile.client, leftMargin, 42);

      yPos = 60;
      pdf.setTextColor(0, 0, 0);

      // RESUMEN
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Resumen', leftMargin, yPos);
      yPos += 10;

      const stats = [
        { label: 'Total', value: data.summary.total_candidates, color: [147, 51, 234] },
        { label: 'Match Promedio', value: `${data.summary.avg_match_percentage}%`, color: [34, 197, 94] },
      ];

      let xPos = leftMargin;
      stats.forEach((stat) => {
        pdf.setFillColor(stat.color[0], stat.color[1], stat.color[2]);
        pdf.roundedRect(xPos, yPos, 60, 25, 3, 3, 'F');
        
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        pdf.text(stat.value.toString(), xPos + 30, yPos + 12, { align: 'center' });
        
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(stat.label, xPos + 30, yPos + 20, { align: 'center' });
        
        xPos += 70;
      });

      pdf.setTextColor(0, 0, 0);
      yPos += 35;

      // CANDIDATOS
      checkNewPage(20);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Lista de Candidatos', leftMargin, yPos);
      yPos += 10;

      pdf.setFontSize(10);
      data.candidates.forEach((candidate, index) => {
        checkNewPage(40);
        
        // Nombre
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${index + 1}. ${candidate.full_name}`, leftMargin, yPos);
        yPos += 6;
        
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Email: ${candidate.email}`, leftMargin + 5, yPos);
        yPos += 5;
        
        if (candidate.phone) {
          pdf.text(`Tel: ${candidate.phone}`, leftMargin + 5, yPos);
          yPos += 5;
        }
        
        pdf.text(`Estado: ${candidate.status_display}`, leftMargin + 5, yPos);
        yPos += 5;
        
        if (candidate.match_percentage !== null) {
          pdf.text(`Match: ${candidate.match_percentage}%`, leftMargin + 5, yPos);
          yPos += 5;
        }
        
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

      pdf.save(`Candidatos_${data.profile.title}_${new Date().toISOString().split('T')[0]}.pdf`);
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

      // HOJA 1: Lista de Candidatos
      const candidatesData = [
        ['CANDIDATOS DEL PERFIL'],
        ['Perfil:', data.profile.title],
        ['Cliente:', data.profile.client],
        [''],
        ['#', 'Nombre', 'Email', 'Teléfono', 'Estado', 'Match %', 'Rating', 'Posición Actual', 'Empresa Actual', 'Experiencia (años)'],
        ...data.candidates.map((c, i) => [
          i + 1,
          c.full_name,
          c.email,
          c.phone || '',
          c.status_display,
          c.match_percentage || '',
          c.overall_rating || '',
          c.current_position || '',
          c.current_company || '',
          c.years_of_experience
        ])
      ];

      const ws1 = XLSX.utils.aoa_to_sheet(candidatesData);
      XLSX.utils.book_append_sheet(wb, ws1, 'Candidatos');

      // HOJA 2: Resumen
      const summaryData = [
        ['RESUMEN'],
        [''],
        ['Métrica', 'Valor'],
        ['Total de Candidatos', data.summary.total_candidates],
        ['Match Promedio', `${data.summary.avg_match_percentage}%`],
        [''],
        ['Por Estado'],
        ...Object.entries(data.summary.by_status).map(([status, count]) => [status, count])
      ];

      const ws2 = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, ws2, 'Resumen');

      XLSX.writeFile(wb, `Candidatos_${data.profile.title}_${new Date().toISOString().split('T')[0]}.xlsx`);
      alert('✅ Excel generado exitosamente');
    } catch (error) {
      console.error('Error al exportar Excel:', error);
      alert('❌ Error al generar Excel');
    } finally {
      setExporting(false);
    }
  };

  // Filtrar por búsqueda
  const filteredCandidates = data?.candidates.filter(candidate =>
    candidate.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    candidate.current_company?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // ═══════════════════════════════════════════════
  // LOADING STATE
  // ═══════════════════════════════════════════════
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-purple-600 mb-4"></i>
          <p className="text-gray-600">Cargando candidatos...</p>
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
        <p className="text-red-800 font-semibold">{error || 'No se pudieron cargar los candidatos'}</p>
        <button onClick={loadData} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
          Reintentar
        </button>
      </div>
    );
  }

  const { profile, summary, candidates } = data;

  return (
    <div className="space-y-6">
      {/* ═══════════════════════════════════════════════ */}
      {/* HEADER */}
      {/* ═══════════════════════════════════════════════ */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <i className="fas fa-users text-3xl"></i>
              <div>
                <h1 className="text-3xl font-bold">Candidatos</h1>
                <p className="text-purple-100 text-lg">{profile.title}</p>
                <p className="text-purple-200 text-sm">{profile.client}</p>
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
      </div>

      {/* ═══════════════════════════════════════════════ */}
      {/* RESUMEN */}
      {/* ═══════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <i className="fas fa-users text-2xl text-purple-600"></i>
            <span className="text-3xl font-bold text-gray-900">{summary.total_candidates}</span>
          </div>
          <p className="text-gray-600 text-sm">Total Candidatos</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <i className="fas fa-chart-line text-2xl text-green-600"></i>
            <span className="text-3xl font-bold text-gray-900">{summary.avg_match_percentage.toFixed(0)}%</span>
          </div>
          <p className="text-gray-600 text-sm">Match Promedio</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <i className="fas fa-filter text-2xl text-blue-600"></i>
            <span className="text-3xl font-bold text-gray-900">{filteredCandidates.length}</span>
          </div>
          <p className="text-gray-600 text-sm">Mostrando</p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════ */}
      {/* FILTROS */}
      {/* ═══════════════════════════════════════════════ */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Búsqueda */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <i className="fas fa-search mr-2"></i>
              Buscar
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nombre, email o empresa..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Filtro por estado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <i className="fas fa-filter mr-2"></i>
              Filtrar por Estado
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Todos los estados</option>
              <option value="applied">Aplicados</option>
              <option value="screening">En Revisión</option>
              <option value="shortlisted">Preseleccionados</option>
              <option value="interviewed">Entrevistados</option>
              <option value="offered">Con Oferta</option>
              <option value="accepted">Aceptados</option>
              <option value="rejected">Rechazados</option>
            </select>
          </div>
        </div>
      </div>

      {/* ═════════════════════════════════════════════ */}
      {/* TABLA DE CANDIDATOS */}
      {/* ═══════════════════════════════════════════════ */}
      {filteredCandidates.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
          <i className="fas fa-inbox text-4xl text-gray-400 mb-4"></i>
          <p className="text-gray-600">No se encontraron candidatos</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Candidato
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Match
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Experiencia
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aplicó
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCandidates.map((candidate) => (
                  <tr key={candidate.application_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-semibold mr-3">
                          {candidate.full_name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{candidate.full_name}</div>
                          <div className="text-sm text-gray-500">{candidate.email}</div>
                          {candidate.current_company && (
                            <div className="text-xs text-gray-400">{candidate.current_position} en {candidate.current_company}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-${getStatusColor(candidate.status)}-100 text-${getStatusColor(candidate.status)}-800`}>
                        {candidate.status_display}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className={`h-2 rounded-full ${candidate.match_percentage >= 80 ? 'bg-green-500' : candidate.match_percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${candidate.match_percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-900">{candidate.match_percentage}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {candidate.years_of_experience} años
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(candidate.applied_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {onViewCandidate && (
                        <button
                          onClick={() => onViewCandidate(candidate.candidate_id)}
                          className="text-purple-600 hover:text-purple-900"
                        >
                          <i className="fas fa-eye mr-1"></i>
                          Ver
                        </button>
                      )}
                      <button className="text-blue-600 hover:text-blue-900">
                        <i className="fas fa-file-alt mr-1"></i>
                        Docs ({candidate.documents_count})
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* LEYENDA DE ESTADOS */}
      {/* ═══════════════════════════════════════════════ */}
      <div className="bg-gray-50 rounded-lg p-4">
        <p className="text-sm font-medium text-gray-700 mb-3">Leyenda de Estados:</p>
        <div className="flex flex-wrap gap-3">
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Aplicó</span>
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">En Revisión</span>
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">Preseleccionado</span>
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-cyan-100 text-cyan-800">Entrevistado</span>
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">Con Oferta</span>
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Aceptado</span>
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Rechazado</span>
        </div>
      </div>
    </div>
  );
}