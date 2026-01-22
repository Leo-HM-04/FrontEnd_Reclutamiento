/**
 * ════════════════════════════════════════════════════════════════════════════
 * PDF TIMELINE REPORT - DISEÑO DASHBOARD AVANZADO
 * ════════════════════════════════════════════════════════════════════════════
 * 
 * Genera PDF tipo dashboard para timeline de proceso de reclutamiento.
 * Diseño inspirado en reportes ejecutivos con:
 * - Header con banda de color
 * - KPI Cards con métricas clave
 * - Diagrama tipo Gantt del proceso
 * - Tarjetas de candidatos con match%
 * - Comparativa de eficiencia vs industria
 * - Timeline de eventos agrupado por día
 * 
 * ════════════════════════════════════════════════════════════════════════════
 */

import jsPDF from 'jspdf';
import { BAUSEN_LOGO_BASE64 } from './logo-base64';

// ════════════════════════════════════════════════════════════════════════════
// COLORES CORPORATIVOS (Sistema del PDF de referencia)
// ════════════════════════════════════════════════════════════════════════════
const COLORS = {
  headerBand: { r: 11, g: 58, b: 110 },      // #0B3A6E - Azul oscuro header
  primary: { r: 11, g: 58, b: 110 },          // #0B3A6E
  success: { r: 34, g: 160, b: 107 },         // #22A06B - Verde
  accent: { r: 107, g: 116, b: 242 },         // #6B74F2 - Púrpura
  warning: { r: 245, g: 165, b: 36 },         // #F5A524 - Amarillo/Naranja
  danger: { r: 239, g: 68, b: 68 },           // Rojo
  ganttTrack: { r: 233, g: 237, b: 243 },     // #E9EDF3 - Gris claro
  textPrimary: { r: 11, g: 18, b: 32 },       // #0B1220
  textSecondary: { r: 91, g: 103, b: 122 },   // #5B677A
  white: { r: 255, g: 255, b: 255 },
  lightBg: { r: 248, g: 250, b: 252 },
  border: { r: 229, g: 231, b: 235 },
};

// ════════════════════════════════════════════════════════════════════════════
// FUNCIÓN PARA CORREGIR MOJIBAKE
// ════════════════════════════════════════════════════════════════════════════
function fixMojibake(text: string): string {
  if (!text) return '';
  
  const mojibakeMap: { [key: string]: string } = {
    // Vocales acentuadas (patrón ├X)
    '├í': 'á', '├®': 'é', '├¡': 'í', '├│': 'ó', '├║': 'ú',
    '├ü': 'Á', '├ë': 'É', '├ì': 'Í', '├ô': 'Ó', '├Ü': 'Ú',
    // Ñ
    '├▒': 'ñ', '├æ': 'Ñ',
    // Diéresis
    '├╝': 'ü', '├£': 'Ü',
    // Patrones con %
    '%í': 'á', '%®': 'é', '%¡': 'í', '%ó': 'ó', '%ú': 'ú',
    '%ñ': 'ñ', '%Ñ': 'Ñ', '%Q%': 'ú', "%%'": '',
    // Patrones URL encoded
    '%C3%A1': 'á', '%C3%A9': 'é', '%C3%AD': 'í', '%C3%B3': 'ó', '%C3%BA': 'ú',
    '%C3%B1': 'ñ', '%C3%91': 'Ñ',
    // Unicode escapes
    '\u00c3\u00a1': 'á', '\u00c3\u00a9': 'é', '\u00c3\u00ad': 'í',
    '\u00c3\u00b3': 'ó', '\u00c3\u00ba': 'ú', '\u00c3\u00b1': 'ñ',
  };
  
  let result = text;
  for (const [corrupted, correct] of Object.entries(mojibakeMap)) {
    result = result.split(corrupted).join(correct);
  }
  
  return result;
}

// ════════════════════════════════════════════════════════════════════════════
// INTERFACES
// ════════════════════════════════════════════════════════════════════════════
export interface TimelineCandidato {
  nombre: string;
  email: string;
  fecha_aplico: string;
  match_porcentaje: number;
  estado: string;
}

export interface TimelineEvento {
  fecha_hora: string;
  tipo: string;
  descripcion: string;
}

export interface TimelineReportData {
  puesto: string;
  cliente: string;
  fecha_reporte: string;
  
  // KPIs
  dias_abierto: number;
  total_candidatos: number;
  match_promedio: number;
  total_eventos: number;
  
  // Candidatos
  candidatos: TimelineCandidato[];
  
  // Eventos
  eventos: TimelineEvento[];
}

// ════════════════════════════════════════════════════════════════════════════
// CLASE GENERADORA DEL PDF
// ════════════════════════════════════════════════════════════════════════════
export class TimelineReportPDF {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number;
  private contentWidth: number;
  private currentY: number;
  private pageNumber: number;
  private totalPages: number;

  constructor() {
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter',
    });
    
    this.pageWidth = 215.9;
    this.pageHeight = 279.4;
    this.margin = 12;
    this.contentWidth = this.pageWidth - (this.margin * 2);
    this.currentY = this.margin;
    this.pageNumber = 1;
    this.totalPages = 2;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // GENERAR PDF COMPLETO
  // ══════════════════════════════════════════════════════════════════════════
  generate(data: TimelineReportData): jsPDF {
    // Limpiar datos
    const cleanData = this.cleanAllData(data);
    
    // Calcular métricas derivadas
    const metrics = this.calculateMetrics(cleanData);
    
    // ─── PÁGINA 1: Dashboard + KPIs + Gantt ───
    this.drawHeaderBand(cleanData);
    this.drawKPICards(cleanData, metrics);
    this.drawGanttDiagram(cleanData, metrics);
    this.drawFooter();
    
    // ─── PÁGINA 2: Candidatos + Eficiencia + Eventos ───
    this.doc.addPage();
    this.pageNumber = 2;
    this.currentY = this.margin;
    
    this.drawPageHeader('CANDIDATOS Y ANÁLISIS', cleanData);
    this.drawCandidateCards(cleanData);
    this.drawEfficiencyComparison(metrics);
    this.drawEventsTimeline(cleanData);
    this.drawFooter();
    
    return this.doc;
  }

  private cleanAllData(data: TimelineReportData): TimelineReportData {
    return {
      ...data,
      puesto: fixMojibake(data.puesto),
      cliente: fixMojibake(data.cliente),
      candidatos: data.candidatos.map(c => ({
        ...c,
        nombre: fixMojibake(c.nombre),
        email: fixMojibake(c.email),
      })),
      eventos: data.eventos.map(e => ({
        ...e,
        tipo: fixMojibake(e.tipo),
        descripcion: fixMojibake(e.descripcion),
      })),
    };
  }

  private calculateMetrics(data: TimelineReportData) {
    // Calcular tiempo total del proceso
    const tiempoTotalHoras = data.dias_abierto * 24;
    const benchmarkHoras = 360; // 15 días promedio industria
    const ahorroHoras = benchmarkHoras - tiempoTotalHoras;
    const ahorroDias = Math.max(0, ahorroHoras / 24);
    const eficienciaPorcentaje = Math.min(100, (benchmarkHoras / Math.max(tiempoTotalHoras, 1)) * 50);
    
    // Fases del proceso (sintéticas basadas en eventos)
    const fases = [
      { nombre: 'Creación del Perfil', duracion: 5, color: COLORS.primary },
      { nombre: 'Recepción de Candidatos', duracion: data.dias_abierto * 24 - 5, color: COLORS.success },
    ];
    
    return {
      tiempoTotalHoras,
      benchmarkHoras,
      ahorroHoras,
      ahorroDias,
      eficienciaPorcentaje,
      fases,
    };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // HEADER CON BANDA DE COLOR
  // ══════════════════════════════════════════════════════════════════════════
  private drawHeaderBand(data: TimelineReportData): void {
    const bandHeight = 35;
    
    // Banda de color sólido
    this.doc.setFillColor(COLORS.headerBand.r, COLORS.headerBand.g, COLORS.headerBand.b);
    this.doc.rect(0, 0, this.pageWidth, bandHeight, 'F');
    
    // Logo (blanco sobre fondo oscuro)
    try {
      const logoHeight = 12;
      const logoWidth = logoHeight * 3.46;
      this.doc.addImage(BAUSEN_LOGO_BASE64, 'PNG', this.margin, 6, logoWidth, logoHeight);
    } catch {
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(14);
      this.doc.setTextColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
      this.doc.text('BAUSEN', this.margin, 14);
    }
    
    // Título principal
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(16);
    this.doc.setTextColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
    this.doc.text('TIMELINE DEL PROCESO', this.pageWidth / 2, 12, { align: 'center' });
    
    // Subtítulo (puesto)
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(11);
    this.doc.text(data.puesto, this.pageWidth / 2, 20, { align: 'center' });
    
    // Cliente y fecha
    this.doc.setFontSize(9);
    this.doc.text(`${data.cliente} • ${data.fecha_reporte}`, this.pageWidth / 2, 28, { align: 'center' });
    
    this.currentY = bandHeight + 8;
  }

  private drawPageHeader(title: string, data: TimelineReportData): void {
    // Banda más pequeña para páginas secundarias
    const bandHeight = 18;
    
    this.doc.setFillColor(COLORS.headerBand.r, COLORS.headerBand.g, COLORS.headerBand.b);
    this.doc.rect(0, 0, this.pageWidth, bandHeight, 'F');
    
    // Logo pequeño
    try {
      const logoHeight = 8;
      const logoWidth = logoHeight * 3.46;
      this.doc.addImage(BAUSEN_LOGO_BASE64, 'PNG', this.margin, 5, logoWidth, logoHeight);
    } catch {
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(10);
      this.doc.setTextColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
      this.doc.text('BAUSEN', this.margin, 11);
    }
    
    // Título
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(12);
    this.doc.setTextColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
    this.doc.text(title, this.pageWidth / 2, 11, { align: 'center' });
    
    // Puesto (derecha)
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(9);
    this.doc.text(data.puesto, this.pageWidth - this.margin, 11, { align: 'right' });
    
    this.currentY = bandHeight + 6;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // KPI CARDS (4 cards con barra de color superior)
  // ══════════════════════════════════════════════════════════════════════════
  private drawKPICards(data: TimelineReportData, metrics: ReturnType<typeof this.calculateMetrics>): void {
    const cardWidth = (this.contentWidth - 9) / 4;
    const cardHeight = 32;
    const gap = 3;
    
    const kpis = [
      {
        value: `${data.dias_abierto}`,
        unit: 'días',
        label: 'Tiempo Abierto',
        subtext: `${metrics.tiempoTotalHoras.toFixed(0)} hrs`,
        color: COLORS.primary,
      },
      {
        value: `${data.total_candidatos}`,
        unit: '',
        label: 'Candidatos',
        subtext: `${data.total_eventos} eventos`,
        color: COLORS.success,
      },
      {
        value: `${data.match_promedio.toFixed(1)}`,
        unit: '%',
        label: 'Match Promedio',
        subtext: 'del pool',
        color: COLORS.accent,
      },
      {
        value: `${metrics.eficienciaPorcentaje.toFixed(0)}`,
        unit: '%',
        label: 'Eficiencia',
        subtext: 'vs industria',
        color: COLORS.warning,
      },
    ];
    
    kpis.forEach((kpi, index) => {
      const x = this.margin + (cardWidth + gap) * index;
      this.drawKPICard(x, this.currentY, cardWidth, cardHeight, kpi);
    });
    
    this.currentY += cardHeight + 10;
  }

  private drawKPICard(
    x: number,
    y: number,
    width: number,
    height: number,
    kpi: { value: string; unit: string; label: string; subtext: string; color: { r: number; g: number; b: number } }
  ): void {
    // Fondo blanco con sombra sutil (borde)
    this.doc.setFillColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
    this.doc.roundedRect(x, y, width, height, 2, 2, 'F');
    
    // Borde
    this.doc.setDrawColor(COLORS.border.r, COLORS.border.g, COLORS.border.b);
    this.doc.setLineWidth(0.3);
    this.doc.roundedRect(x, y, width, height, 2, 2, 'S');
    
    // Barra superior de color
    this.doc.setFillColor(kpi.color.r, kpi.color.g, kpi.color.b);
    this.doc.roundedRect(x, y, width, 4, 2, 2, 'F');
    this.doc.setFillColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
    this.doc.rect(x, y + 3, width, 2, 'F');
    
    // Valor grande
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(18);
    this.doc.setTextColor(kpi.color.r, kpi.color.g, kpi.color.b);
    
    const valueText = kpi.value + kpi.unit;
    this.doc.text(valueText, x + width / 2, y + 16, { align: 'center' });
    
    // Label
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(7);
    this.doc.setTextColor(COLORS.textPrimary.r, COLORS.textPrimary.g, COLORS.textPrimary.b);
    this.doc.text(kpi.label, x + width / 2, y + 23, { align: 'center' });
    
    // Subtext
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(6);
    this.doc.setTextColor(COLORS.textSecondary.r, COLORS.textSecondary.g, COLORS.textSecondary.b);
    this.doc.text(kpi.subtext, x + width / 2, y + 29, { align: 'center' });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // DIAGRAMA TIPO GANTT
  // ══════════════════════════════════════════════════════════════════════════
  private drawGanttDiagram(data: TimelineReportData, metrics: ReturnType<typeof this.calculateMetrics>): void {
    const ganttY = this.currentY;
    const ganttHeight = 70;
    
    // Título de sección
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(11);
    this.doc.setTextColor(COLORS.textPrimary.r, COLORS.textPrimary.g, COLORS.textPrimary.b);
    this.doc.text('DIAGRAMA DEL PROCESO', this.margin, ganttY);
    
    // Contenedor
    const containerY = ganttY + 6;
    this.doc.setFillColor(COLORS.lightBg.r, COLORS.lightBg.g, COLORS.lightBg.b);
    this.doc.roundedRect(this.margin, containerY, this.contentWidth, ganttHeight - 6, 3, 3, 'F');
    
    // Eje horizontal (timeline)
    const axisY = containerY + ganttHeight - 18;
    const axisStartX = this.margin + 50;
    const axisEndX = this.pageWidth - this.margin - 30;
    const axisWidth = axisEndX - axisStartX;
    
    // Línea del eje
    this.doc.setDrawColor(COLORS.border.r, COLORS.border.g, COLORS.border.b);
    this.doc.setLineWidth(0.5);
    this.doc.line(axisStartX, axisY, axisEndX, axisY);
    
    // Marcas del eje
    const marks = [
      { pos: 0, label: 'Inicio' },
      { pos: 0.5, label: '50%' },
      { pos: 1, label: 'Actual' },
    ];
    
    marks.forEach(mark => {
      const markX = axisStartX + axisWidth * mark.pos;
      this.doc.line(markX, axisY - 2, markX, axisY + 2);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(6);
      this.doc.setTextColor(COLORS.textSecondary.r, COLORS.textSecondary.g, COLORS.textSecondary.b);
      this.doc.text(mark.label, markX, axisY + 7, { align: 'center' });
    });
    
    // Fases del proceso (barras Gantt)
    const trackHeight = 12;
    const trackGap = 4;
    let trackY = containerY + 12;
    
    const totalDuration = metrics.fases.reduce((sum, f) => sum + f.duracion, 0);
    let currentOffset = 0;
    
    metrics.fases.forEach((fase) => {
      // Track gris de fondo
      this.doc.setFillColor(COLORS.ganttTrack.r, COLORS.ganttTrack.g, COLORS.ganttTrack.b);
      this.doc.roundedRect(axisStartX, trackY, axisWidth, trackHeight, 2, 2, 'F');
      
      // Barra de progreso de la fase
      const barStart = (currentOffset / totalDuration) * axisWidth;
      const barWidth = (fase.duracion / totalDuration) * axisWidth;
      
      this.doc.setFillColor(fase.color.r, fase.color.g, fase.color.b);
      this.doc.roundedRect(axisStartX + barStart, trackY, barWidth, trackHeight, 2, 2, 'F');
      
      // Nombre de la fase (izquierda)
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(7);
      this.doc.setTextColor(COLORS.textPrimary.r, COLORS.textPrimary.g, COLORS.textPrimary.b);
      this.doc.text(fase.nombre, this.margin + 4, trackY + 8);
      
      // Duración (derecha)
      const duracionText = fase.duracion < 60 ? `${fase.duracion} min` : `${(fase.duracion / 24).toFixed(1)} días`;
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(7);
      this.doc.setTextColor(COLORS.textSecondary.r, COLORS.textSecondary.g, COLORS.textSecondary.b);
      this.doc.text(duracionText, this.pageWidth - this.margin - 4, trackY + 8, { align: 'right' });
      
      currentOffset += fase.duracion;
      trackY += trackHeight + trackGap;
    });
    
    // Leyenda del tiempo total
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(8);
    this.doc.setTextColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
    this.doc.text(
      `Tiempo total: ${data.dias_abierto} días (${metrics.tiempoTotalHoras.toFixed(0)} hrs)`,
      this.pageWidth - this.margin,
      containerY + 8,
      { align: 'right' }
    );
    
    this.currentY = containerY + ganttHeight + 8;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // TARJETAS DE CANDIDATOS
  // ══════════════════════════════════════════════════════════════════════════
  private drawCandidateCards(data: TimelineReportData): void {
    // Título de sección
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(11);
    this.doc.setTextColor(COLORS.textPrimary.r, COLORS.textPrimary.g, COLORS.textPrimary.b);
    this.doc.text('CANDIDATOS DEL PROCESO', this.margin, this.currentY);
    
    this.currentY += 6;
    
    // Ordenar por match descendente
    const sortedCandidatos = [...data.candidatos].sort((a, b) => b.match_porcentaje - a.match_porcentaje);
    
    // Grid de 3 columnas
    const cardWidth = (this.contentWidth - 6) / 3;
    const cardHeight = 28;
    const gap = 3;
    
    sortedCandidatos.forEach((candidato, index) => {
      const col = index % 3;
      const row = Math.floor(index / 3);
      const x = this.margin + (cardWidth + gap) * col;
      const y = this.currentY + row * (cardHeight + gap);
      
      const isTop = index < 2; // Resaltar top 2
      
      this.drawCandidateCard(x, y, cardWidth, cardHeight, candidato, isTop, index + 1);
    });
    
    const rows = Math.ceil(data.candidatos.length / 3);
    this.currentY += rows * (cardHeight + gap) + 8;
  }

  private drawCandidateCard(
    x: number,
    y: number,
    width: number,
    height: number,
    candidato: TimelineCandidato,
    isTop: boolean,
    rank: number
  ): void {
    // Fondo
    const bgColor = isTop ? { r: 240, g: 253, b: 244 } : COLORS.white;
    this.doc.setFillColor(bgColor.r, bgColor.g, bgColor.b);
    this.doc.roundedRect(x, y, width, height, 2, 2, 'F');
    
    // Borde (resaltado si es top)
    const borderColor = isTop ? COLORS.success : COLORS.border;
    this.doc.setDrawColor(borderColor.r, borderColor.g, borderColor.b);
    this.doc.setLineWidth(isTop ? 0.8 : 0.3);
    this.doc.roundedRect(x, y, width, height, 2, 2, 'S');
    
    // Avatar con iniciales
    const avatarSize = 12;
    const avatarX = x + 8;
    const avatarY = y + height / 2;
    
    const avatarColor = isTop ? COLORS.success : COLORS.primary;
    this.doc.setFillColor(avatarColor.r, avatarColor.g, avatarColor.b);
    this.doc.circle(avatarX, avatarY, avatarSize / 2, 'F');
    
    const initials = this.getInitials(candidato.nombre);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(7);
    this.doc.setTextColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
    this.doc.text(initials, avatarX, avatarY + 1, { align: 'center' });
    
    // Badge de ranking (top 2)
    if (isTop) {
      this.doc.setFillColor(COLORS.warning.r, COLORS.warning.g, COLORS.warning.b);
      this.doc.circle(avatarX + avatarSize / 2 - 1, avatarY - avatarSize / 2 + 1, 3, 'F');
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(5);
      this.doc.setTextColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
      this.doc.text(`${rank}`, avatarX + avatarSize / 2 - 1, avatarY - avatarSize / 2 + 2.5, { align: 'center' });
    }
    
    // Nombre
    const textX = avatarX + avatarSize / 2 + 4;
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(7);
    this.doc.setTextColor(COLORS.textPrimary.r, COLORS.textPrimary.g, COLORS.textPrimary.b);
    const truncatedName = this.truncateText(candidato.nombre, width - 30, 7);
    this.doc.text(truncatedName, textX, y + 9);
    
    // Match % con barra visual
    const matchBarWidth = 30;
    const matchBarHeight = 4;
    const matchBarX = x + width - matchBarWidth - 4;
    const matchBarY = y + 5;
    
    // Fondo de la barra
    this.doc.setFillColor(COLORS.ganttTrack.r, COLORS.ganttTrack.g, COLORS.ganttTrack.b);
    this.doc.roundedRect(matchBarX, matchBarY, matchBarWidth, matchBarHeight, 1, 1, 'F');
    
    // Progreso
    const progressColor = candidato.match_porcentaje >= 70 ? COLORS.success :
                         candidato.match_porcentaje >= 50 ? COLORS.warning : COLORS.danger;
    const progressWidth = (candidato.match_porcentaje / 100) * matchBarWidth;
    this.doc.setFillColor(progressColor.r, progressColor.g, progressColor.b);
    this.doc.roundedRect(matchBarX, matchBarY, progressWidth, matchBarHeight, 1, 1, 'F');
    
    // Porcentaje texto
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(6);
    this.doc.setTextColor(progressColor.r, progressColor.g, progressColor.b);
    this.doc.text(`${candidato.match_porcentaje}%`, matchBarX + matchBarWidth + 2, matchBarY + 3);
    
    // Fecha de aplicación
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(6);
    this.doc.setTextColor(COLORS.textSecondary.r, COLORS.textSecondary.g, COLORS.textSecondary.b);
    const shortDate = this.extractShortDate(candidato.fecha_aplico);
    this.doc.text(shortDate, textX, y + 16);
    
    // Estado badge
    this.drawMiniStateBadge(textX, y + 19, candidato.estado);
  }

  private drawMiniStateBadge(x: number, y: number, estado: string): void {
    const badgeWidth = this.doc.getTextWidth(estado) + 4;
    const badgeHeight = 5;
    
    this.doc.setFillColor(224, 231, 255);
    this.doc.roundedRect(x, y, badgeWidth, badgeHeight, 1, 1, 'F');
    
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(5);
    this.doc.setTextColor(COLORS.accent.r, COLORS.accent.g, COLORS.accent.b);
    this.doc.text(estado, x + 2, y + 3.5);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // COMPARATIVA DE EFICIENCIA
  // ══════════════════════════════════════════════════════════════════════════
  private drawEfficiencyComparison(metrics: ReturnType<typeof this.calculateMetrics>): void {
    const sectionY = this.currentY;
    const sectionHeight = 40;
    
    // Título
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(11);
    this.doc.setTextColor(COLORS.textPrimary.r, COLORS.textPrimary.g, COLORS.textPrimary.b);
    this.doc.text('COMPARATIVA DE EFICIENCIA', this.margin, sectionY);
    
    // Contenedor
    const containerY = sectionY + 6;
    this.doc.setFillColor(COLORS.lightBg.r, COLORS.lightBg.g, COLORS.lightBg.b);
    this.doc.roundedRect(this.margin, containerY, this.contentWidth, sectionHeight - 6, 3, 3, 'F');
    
    const barWidth = this.contentWidth - 80;
    const barHeight = 10;
    const barX = this.margin + 60;
    
    // Barra: Este proceso
    const bar1Y = containerY + 10;
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(7);
    this.doc.setTextColor(COLORS.textPrimary.r, COLORS.textPrimary.g, COLORS.textPrimary.b);
    this.doc.text('Este proceso', this.margin + 4, bar1Y + 7);
    
    // Fondo
    this.doc.setFillColor(COLORS.ganttTrack.r, COLORS.ganttTrack.g, COLORS.ganttTrack.b);
    this.doc.roundedRect(barX, bar1Y, barWidth, barHeight, 2, 2, 'F');
    
    // Progreso (proporción del benchmark)
    const processRatio = Math.min(1, metrics.tiempoTotalHoras / metrics.benchmarkHoras);
    const progress1Width = processRatio * barWidth;
    this.doc.setFillColor(COLORS.success.r, COLORS.success.g, COLORS.success.b);
    this.doc.roundedRect(barX, bar1Y, progress1Width, barHeight, 2, 2, 'F');
    
    // Valor
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(8);
    this.doc.setTextColor(COLORS.success.r, COLORS.success.g, COLORS.success.b);
    this.doc.text(`${metrics.tiempoTotalHoras.toFixed(0)} hrs`, barX + barWidth + 4, bar1Y + 7);
    
    // Barra: Promedio industria
    const bar2Y = containerY + 24;
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(7);
    this.doc.setTextColor(COLORS.textSecondary.r, COLORS.textSecondary.g, COLORS.textSecondary.b);
    this.doc.text('Prom. industria', this.margin + 4, bar2Y + 7);
    
    // Fondo completo (100%)
    this.doc.setFillColor(COLORS.ganttTrack.r, COLORS.ganttTrack.g, COLORS.ganttTrack.b);
    this.doc.roundedRect(barX, bar2Y, barWidth, barHeight, 2, 2, 'F');
    
    // Barra completa (benchmark)
    this.doc.setFillColor(COLORS.textSecondary.r, COLORS.textSecondary.g, COLORS.textSecondary.b);
    this.doc.roundedRect(barX, bar2Y, barWidth, barHeight, 2, 2, 'F');
    
    // Valor
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(8);
    this.doc.text(`${metrics.benchmarkHoras} hrs`, barX + barWidth + 4, bar2Y + 7);
    
    // Insight box
    if (metrics.ahorroDias > 0) {
      const insightX = this.pageWidth - this.margin - 60;
      const insightY = containerY + 8;
      
      this.doc.setFillColor(209, 250, 229);
      this.doc.roundedRect(insightX, insightY, 56, 22, 2, 2, 'F');
      
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(12);
      this.doc.setTextColor(COLORS.success.r, COLORS.success.g, COLORS.success.b);
      this.doc.text(`-${metrics.ahorroDias.toFixed(1)} días`, insightX + 28, insightY + 10, { align: 'center' });
      
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(6);
      this.doc.text('vs promedio', insightX + 28, insightY + 17, { align: 'center' });
    }
    
    this.currentY = containerY + sectionHeight + 6;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // TIMELINE DE EVENTOS
  // ══════════════════════════════════════════════════════════════════════════
  private drawEventsTimeline(data: TimelineReportData): void {
    // Título
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(11);
    this.doc.setTextColor(COLORS.textPrimary.r, COLORS.textPrimary.g, COLORS.textPrimary.b);
    this.doc.text('DETALLE DE EVENTOS', this.margin, this.currentY);
    
    this.currentY += 6;
    
    // Agrupar eventos por día
    const eventosPorDia = this.groupEventsByDay(data.eventos);
    
    Object.entries(eventosPorDia).forEach(([dia, eventos]) => {
      // Separador de día
      this.doc.setFillColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
      this.doc.roundedRect(this.margin, this.currentY, this.contentWidth, 6, 1, 1, 'F');
      
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(7);
      this.doc.setTextColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
      this.doc.text(dia, this.margin + 4, this.currentY + 4.5);
      
      this.currentY += 8;
      
      // Eventos del día
      eventos.forEach((evento, index) => {
        this.drawEventItem(evento, index === eventos.length - 1);
      });
      
      this.currentY += 2;
    });
  }

  private groupEventsByDay(eventos: TimelineEvento[]): { [key: string]: TimelineEvento[] } {
    const grupos: { [key: string]: TimelineEvento[] } = {};
    
    eventos.forEach(evento => {
      // Extraer fecha (ej: "25 de noviembre de 2025")
      const match = evento.fecha_hora.match(/(\d+ de \w+ de \d+)/);
      const dia = match ? match[1] : 'Sin fecha';
      
      if (!grupos[dia]) grupos[dia] = [];
      grupos[dia].push(evento);
    });
    
    return grupos;
  }

  private drawEventItem(evento: TimelineEvento, isLast: boolean): void {
    const itemHeight = 12;
    const dotSize = 4;
    const lineX = this.margin + 6;
    
    // Línea vertical del timeline
    if (!isLast) {
      this.doc.setDrawColor(COLORS.border.r, COLORS.border.g, COLORS.border.b);
      this.doc.setLineWidth(0.5);
      this.doc.line(lineX, this.currentY + dotSize, lineX, this.currentY + itemHeight);
    }
    
    // Punto del evento
    const dotColor = evento.tipo.includes('Creado') ? COLORS.primary :
                    evento.tipo.includes('Aplicó') ? COLORS.success : COLORS.accent;
    this.doc.setFillColor(dotColor.r, dotColor.g, dotColor.b);
    this.doc.circle(lineX, this.currentY + 2, dotSize / 2, 'F');
    
    // Hora
    const horaMatch = evento.fecha_hora.match(/(\d+:\d+ [ap]\.m\.)/);
    const hora = horaMatch ? horaMatch[1] : '';
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(6);
    this.doc.setTextColor(COLORS.textSecondary.r, COLORS.textSecondary.g, COLORS.textSecondary.b);
    this.doc.text(hora, lineX + 6, this.currentY + 3);
    
    // Tipo (badge)
    const badgeX = lineX + 30;
    const badgeWidth = Math.min(this.doc.getTextWidth(evento.tipo) + 6, 45);
    this.doc.setFillColor(dotColor.r, dotColor.g, dotColor.b);
    this.doc.roundedRect(badgeX, this.currentY, badgeWidth, 5, 1, 1, 'F');
    
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(5);
    this.doc.setTextColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
    this.doc.text(evento.tipo, badgeX + 3, this.currentY + 3.5);
    
    // Descripción
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(7);
    this.doc.setTextColor(COLORS.textPrimary.r, COLORS.textPrimary.g, COLORS.textPrimary.b);
    const descX = badgeX + badgeWidth + 4;
    const maxDescWidth = this.contentWidth - descX + this.margin - 4;
    const truncatedDesc = this.truncateText(evento.descripcion, maxDescWidth, 7);
    this.doc.text(truncatedDesc, descX, this.currentY + 3);
    
    this.currentY += itemHeight;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // FOOTER
  // ══════════════════════════════════════════════════════════════════════════
  private drawFooter(): void {
    const footerY = this.pageHeight - 10;
    
    // Línea superior
    this.doc.setDrawColor(COLORS.border.r, COLORS.border.g, COLORS.border.b);
    this.doc.setLineWidth(0.3);
    this.doc.line(this.margin, footerY - 3, this.pageWidth - this.margin, footerY - 3);
    
    // Texto izquierda
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(7);
    this.doc.setTextColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
    this.doc.text('BAUSEN', this.margin, footerY);
    
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(COLORS.textSecondary.r, COLORS.textSecondary.g, COLORS.textSecondary.b);
    this.doc.text(' | Sistema de Gestión de Talento', this.margin + 14, footerY);
    
    // Centro
    this.doc.setFont('helvetica', 'italic');
    this.doc.setFontSize(6);
    this.doc.text('Documento confidencial', this.pageWidth / 2, footerY, { align: 'center' });
    
    // Derecha
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(7);
    this.doc.text(`Página ${this.pageNumber} de ${this.totalPages}`, this.pageWidth - this.margin, footerY, { align: 'right' });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ══════════════════════════════════════════════════════════════════════════
  private getInitials(name: string): string {
    return name
      .split(' ')
      .filter(word => word.length > 0)
      .slice(0, 2)
      .map(word => word[0].toUpperCase())
      .join('');
  }

  private truncateText(text: string, maxWidth: number, fontSize: number): string {
    this.doc.setFontSize(fontSize);
    if (this.doc.getTextWidth(text) <= maxWidth) {
      return text;
    }
    
    let truncated = text;
    while (this.doc.getTextWidth(truncated + '...') > maxWidth && truncated.length > 0) {
      truncated = truncated.slice(0, -1);
    }
    return truncated + '...';
  }

  private extractShortDate(fechaHora: string): string {
    // De "26 de noviembre de 2025, 05:27 p.m." extraer "26 nov 05:27"
    const match = fechaHora.match(/(\d+) de (\w+) de \d+, (\d+:\d+)/);
    if (match) {
      const meses: { [key: string]: string } = {
        enero: 'ene', febrero: 'feb', marzo: 'mar', abril: 'abr',
        mayo: 'may', junio: 'jun', julio: 'jul', agosto: 'ago',
        septiembre: 'sep', octubre: 'oct', noviembre: 'nov', diciembre: 'dic',
      };
      const mesCorto = meses[match[2].toLowerCase()] || match[2].substring(0, 3);
      return `${match[1]} ${mesCorto} ${match[3]}`;
    }
    return fechaHora.substring(0, 15);
  }
}

// ════════════════════════════════════════════════════════════════════════════
// FUNCIONES EXPORTABLES
// ════════════════════════════════════════════════════════════════════════════
export function generateTimelineReportPDF(data: TimelineReportData): jsPDF {
  const generator = new TimelineReportPDF();
  return generator.generate(data);
}

export function downloadTimelineReportPDF(data: TimelineReportData, filename?: string): void {
  const generator = new TimelineReportPDF();
  const pdf = generator.generate(data);
  const defaultFilename = `Timeline_${data.puesto.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(filename || defaultFilename);
}
