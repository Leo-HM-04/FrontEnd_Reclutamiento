/**
 * ════════════════════════════════════════════════════════════════════════════
 * PDF CANDIDATES REPORT - DISEÑO DASHBOARD MODERNO
 * ════════════════════════════════════════════════════════════════════════════
 * Generador de PDF tipo dashboard para reportes de candidatos por perfil
 * Diseño moderno con cards, badges, KPIs, tabla y visualización de match
 * 
 * Características:
 * - Layout tipo dashboard en 1 página tamaño carta
 * - KPIs con indicadores visuales
 * - Visualización de distribución de match
 * - Tabla de candidatos con badges
 * - Soporte UTF-8 completo
 * ════════════════════════════════════════════════════════════════════════════
 */

import jsPDF from 'jspdf';
import { BAUSEN_LOGO_BASE64, BAUSEN_LOGO_RATIO } from './logo-base64';

// ═══════════════════════════════════════════════════════════════════════════
// COLORES DEL TEMA
// ═══════════════════════════════════════════════════════════════════════════
const COLORS = {
  // Primarios
  primary: { r: 0, g: 51, b: 160 },
  primaryLight: { r: 59, g: 130, b: 246 },
  primaryDark: { r: 0, g: 40, b: 120 },
  
  // Estados
  success: { r: 34, g: 197, b: 94 },
  warning: { r: 245, g: 158, b: 11 },
  error: { r: 239, g: 68, b: 68 },
  info: { r: 59, g: 130, b: 246 },
  
  // Neutrales
  white: { r: 255, g: 255, b: 255 },
  black: { r: 0, g: 0, b: 0 },
  gray900: { r: 17, g: 24, b: 39 },
  gray700: { r: 55, g: 65, b: 81 },
  gray600: { r: 75, g: 85, b: 99 },
  gray500: { r: 107, g: 114, b: 128 },
  gray400: { r: 156, g: 163, b: 175 },
  gray300: { r: 209, g: 213, b: 219 },
  gray200: { r: 229, g: 231, b: 235 },
  gray100: { r: 243, g: 244, b: 246 },
  gray50: { r: 249, g: 250, b: 251 },
  
  // Match levels
  matchHigh: { r: 34, g: 197, b: 94 },
  matchMedium: { r: 245, g: 158, b: 11 },
  matchLow: { r: 239, g: 68, b: 68 },
  
  // Badges
  badgeGreen: { r: 220, g: 252, b: 231 },
  badgeGreenText: { r: 22, g: 101, b: 52 },
  badgeOrange: { r: 255, g: 237, b: 213 },
  badgeOrangeText: { r: 154, g: 52, b: 18 },
  badgeBlue: { r: 219, g: 234, b: 254 },
  badgeBlueText: { r: 30, g: 64, b: 175 },
  badgeGray: { r: 243, g: 244, b: 246 },
  badgeGrayText: { r: 55, g: 65, b: 81 },
  badgePurple: { r: 243, g: 232, b: 255 },
  badgePurpleText: { r: 107, g: 33, b: 168 },
};

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS E INTERFACES
// ═══════════════════════════════════════════════════════════════════════════
export interface CandidateData {
  nombre: string;
  email: string;
  estado: string;
  match_porcentaje: number;
}

export interface CandidatesReportData {
  puesto: string;
  fecha: string;
  cliente: string;
  candidatos: CandidateData[];
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILIDADES DE LIMPIEZA DE TEXTO UTF-8
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Limpia y normaliza texto con problemas de encoding
 */
function cleanText(text: string): string {
  if (!text) return '';
  
  let cleaned = text;
  
  // Paso 1: Arreglar encoding UTF-8 corrupto (├ + caracter)
  // Estos son caracteres UTF-8 que se muestran como CP-1252/Latin-1
  const utf8Fixes: [RegExp, string][] = [
    // Vocales minúsculas con acento
    [/├í/g, 'a'],  // á
    [/├®/g, 'e'],  // é
    [/├¡/g, 'i'],  // í
    [/├│/g, 'o'],  // ó
    [/├║/g, 'u'],  // ú
    [/├▒/g, 'n'],  // ñ
    
    // Vocales mayúsculas con acento
    [/├ü/g, 'A'],  // Á
    [/├ë/g, 'E'],  // É
    [/├ì/g, 'I'],  // Í
    [/├ô/g, 'O'],  // Ó
    [/├Ü/g, 'U'],  // Ú
    [/├æ/g, 'N'],  // Ñ
    
    // Variantes adicionales de encoding corrupto
    [/Ã¡/g, 'a'],  // á
    [/Ã©/g, 'e'],  // é
    [/Ã­/g, 'i'],  // í
    [/Ã³/g, 'o'],  // ó
    [/Ãº/g, 'u'],  // ú
    [/Ã±/g, 'n'],  // ñ
    [/Ã¼/g, 'u'],  // ü
    
    // Mayúsculas
    [/Ã/g, 'A'],  // Á
    [/Ã‰/g, 'E'],  // É
    [/Ã/g, 'I'],  // Í
    [/Ã"/g, 'O'],  // Ó
    [/Ãš/g, 'U'],  // Ú
    [/Ã'/g, 'N'],  // Ñ
  ];
  
  for (const [pattern, replacement] of utf8Fixes) {
    cleaned = cleaned.replace(pattern, replacement);
  }
  
  // Paso 2: Limpiar caracteres ├ residuales que no matchearon
  cleaned = cleaned.replace(/├/g, '');
  
  // Paso 3: Mapa de reemplazos adicionales
  const replacements: [RegExp, string][] = [
    // Patrón &letra& → letra (para encoding muy corrupto)
    [/&([a-zA-Z])&/g, '$1'],
    [/&([a-zA-Z])/g, '$1'],
    [/([a-zA-Z])&/g, '$1'],
    
    // HTML entities
    [/&aacute;/gi, 'a'],
    [/&eacute;/gi, 'e'],
    [/&iacute;/gi, 'i'],
    [/&oacute;/gi, 'o'],
    [/&uacute;/gi, 'u'],
    [/&ntilde;/gi, 'n'],
    [/&amp;/g, '&'],
    [/&nbsp;/g, ' '],
    
    // URL encoding
    [/%C3%A1/g, 'a'],
    [/%C3%A9/g, 'e'],
    [/%C3%AD/g, 'i'],
    [/%C3%B3/g, 'o'],
    [/%C3%BA/g, 'u'],
    [/%C3%B1/g, 'n'],
    [/%40/g, '@'],
    [/%20/g, ' '],
    
    // Limpiar % sueltos
    [/%(?![0-9A-Fa-f]{2})/g, ''],
    
    // Caracteres de control
    [/[\x00-\x1F\x7F]/g, ''],
    
    // Ampersands sueltos múltiples
    [/&{2,}/g, ''],
  ];
  
  for (const [pattern, replacement] of replacements) {
    cleaned = cleaned.replace(pattern, replacement);
  }
  
  // Paso 4: Normalizar espacios múltiples
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return cleaned;
}

/**
 * Trunca texto si excede longitud máxima
 */
function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Obtiene color de match según porcentaje
 */
function getMatchColor(percentage: number): { r: number; g: number; b: number } {
  if (percentage >= 70) return COLORS.matchHigh;
  if (percentage >= 40) return COLORS.matchMedium;
  return COLORS.matchLow;
}

/**
 * Obtiene nivel de match como texto
 */
function getMatchLevel(percentage: number): string {
  if (percentage >= 70) return 'ALTO';
  if (percentage >= 40) return 'MEDIO';
  return 'BAJO';
}

// ═══════════════════════════════════════════════════════════════════════════
// CLASE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════
export class CandidatesReportPDF {
  private pdf: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number = 12;
  private contentWidth: number;
  private yPos: number = 0;
  
  constructor() {
    this.pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter'
    });
    
    this.pageWidth = this.pdf.internal.pageSize.getWidth();
    this.pageHeight = this.pdf.internal.pageSize.getHeight();
    this.contentWidth = this.pageWidth - (this.margin * 2);
  }
  
  /**
   * Genera el reporte completo
   */
  generate(data: CandidatesReportData): jsPDF {
    // Limpiar datos
    const cleanData: CandidatesReportData = {
      puesto: cleanText(data.puesto),
      fecha: cleanText(data.fecha),
      cliente: cleanText(data.cliente),
      candidatos: data.candidatos.map(c => ({
        nombre: cleanText(c.nombre),
        email: cleanText(c.email),
        estado: cleanText(c.estado),
        match_porcentaje: c.match_porcentaje
      }))
    };
    
    // Calcular estadísticas
    const stats = this.calculateStats(cleanData.candidatos);
    
    this.yPos = this.margin;
    
    // 1. Header
    this.drawHeader(cleanData);
    
    // 2. KPI Cards
    this.drawKPICards(stats, cleanData.cliente);
    
    // 3. Match Distribution
    this.drawMatchDistribution(cleanData.candidatos);
    
    // 4. Candidates Table
    this.drawCandidatesTable(cleanData.candidatos);
    
    // 5. Footer
    this.drawFooter();
    
    return this.pdf;
  }
  
  /**
   * Calcula estadísticas de candidatos
   */
  private calculateStats(candidatos: CandidateData[]) {
    const total = candidatos.length;
    const matchSum = candidatos.reduce((sum, c) => sum + c.match_porcentaje, 0);
    const matchPromedio = total > 0 ? matchSum / total : 0;
    const topMatch = Math.max(...candidatos.map(c => c.match_porcentaje));
    const ofertasExtendidas = candidatos.filter(c => 
      c.estado.toLowerCase().includes('oferta')
    ).length;
    
    return {
      total,
      matchPromedio: Math.round(matchPromedio * 10) / 10,
      topMatch,
      ofertasExtendidas
    };
  }
  
  /**
   * Header con logo, título, puesto y fecha
   */
  private drawHeader(data: CandidatesReportData): void {
    const headerHeight = 28;
    
    // Fondo blanco
    this.pdf.setFillColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
    this.pdf.rect(0, 0, this.pageWidth, headerHeight, 'F');
    
    // Línea decorativa azul
    this.pdf.setFillColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
    this.pdf.rect(0, headerHeight, this.pageWidth, 1, 'F');
    
    // Logo
    const logoX = this.margin;
    const logoY = 4;
    const logoH = 14;
    const logoW = logoH * BAUSEN_LOGO_RATIO;
    
    try {
      this.pdf.addImage(BAUSEN_LOGO_BASE64, 'PNG', logoX, logoY, logoW, logoH);
    } catch {
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.setFontSize(16);
      this.pdf.setTextColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
      this.pdf.text('BAUSEN', logoX, logoY + 10);
    }
    
    // Título centrado
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(14);
    this.pdf.setTextColor(COLORS.gray900.r, COLORS.gray900.g, COLORS.gray900.b);
    this.pdf.text('CANDIDATOS DEL PERFIL', this.pageWidth / 2, 10, { align: 'center' });
    
    // Puesto
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(11);
    this.pdf.setTextColor(COLORS.gray600.r, COLORS.gray600.g, COLORS.gray600.b);
    this.pdf.text(data.puesto, this.pageWidth / 2, 17, { align: 'center' });
    
    // Fecha a la derecha
    this.pdf.setFontSize(8);
    this.pdf.setTextColor(COLORS.gray500.r, COLORS.gray500.g, COLORS.gray500.b);
    this.pdf.text(data.fecha, this.pageWidth - this.margin, 24, { align: 'right' });
    
    this.yPos = headerHeight + 5;
  }
  
  /**
   * Cards de KPIs
   */
  private drawKPICards(stats: { total: number; matchPromedio: number; topMatch: number; ofertasExtendidas: number }, cliente: string): void {
    const cardWidth = (this.contentWidth - 9) / 4; // 4 cards con 3mm entre ellas
    const cardHeight = 22;
    const startX = this.margin;
    const startY = this.yPos;
    
    const kpis = [
      { label: 'Total Candidatos', value: stats.total.toString(), icon: '👥' },
      { label: 'Match Promedio', value: `${stats.matchPromedio}%`, icon: '📊' },
      { label: 'Top Match', value: `${stats.topMatch}%`, icon: '⭐' },
      { label: 'Ofertas', value: stats.ofertasExtendidas.toString(), icon: '📋' }
    ];
    
    kpis.forEach((kpi, index) => {
      const x = startX + (cardWidth + 3) * index;
      
      // Card background
      this.pdf.setFillColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
      this.pdf.roundedRect(x, startY, cardWidth, cardHeight, 2, 2, 'F');
      
      // Border
      this.pdf.setDrawColor(COLORS.gray200.r, COLORS.gray200.g, COLORS.gray200.b);
      this.pdf.setLineWidth(0.3);
      this.pdf.roundedRect(x, startY, cardWidth, cardHeight, 2, 2, 'S');
      
      // Top accent line
      const accentColor = index === 0 ? COLORS.primary : 
                          index === 1 ? COLORS.info :
                          index === 2 ? COLORS.success : COLORS.warning;
      this.pdf.setFillColor(accentColor.r, accentColor.g, accentColor.b);
      this.pdf.rect(x, startY, cardWidth, 1.5, 'F');
      
      // Value (big number)
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.setFontSize(16);
      this.pdf.setTextColor(COLORS.gray900.r, COLORS.gray900.g, COLORS.gray900.b);
      this.pdf.text(kpi.value, x + cardWidth / 2, startY + 11, { align: 'center' });
      
      // Label
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.setFontSize(7);
      this.pdf.setTextColor(COLORS.gray500.r, COLORS.gray500.g, COLORS.gray500.b);
      this.pdf.text(kpi.label, x + cardWidth / 2, startY + 18, { align: 'center' });
    });
    
    // Cliente badge debajo de los KPIs
    this.yPos = startY + cardHeight + 4;
    
    // Cliente card
    this.pdf.setFillColor(COLORS.badgeBlue.r, COLORS.badgeBlue.g, COLORS.badgeBlue.b);
    const clienteText = `Cliente: ${cliente}`;
    this.pdf.setFontSize(8);
    const clienteWidth = this.pdf.getTextWidth(clienteText) + 8;
    this.pdf.roundedRect(this.margin, this.yPos, clienteWidth, 6, 1, 1, 'F');
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setTextColor(COLORS.badgeBlueText.r, COLORS.badgeBlueText.g, COLORS.badgeBlueText.b);
    this.pdf.text(clienteText, this.margin + 4, this.yPos + 4.2);
    
    this.yPos += 10;
  }
  
  /**
   * Visualización de distribución de match
   */
  private drawMatchDistribution(candidatos: CandidateData[]): void {
    const startY = this.yPos;
    const barHeight = 18;
    
    // Título de sección
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(9);
    this.pdf.setTextColor(COLORS.gray700.r, COLORS.gray700.g, COLORS.gray700.b);
    this.pdf.text('DISTRIBUCION DE MATCH', this.margin, startY);
    
    this.yPos = startY + 5;
    
    // Container
    this.pdf.setFillColor(COLORS.gray50.r, COLORS.gray50.g, COLORS.gray50.b);
    this.pdf.roundedRect(this.margin, this.yPos, this.contentWidth, barHeight, 2, 2, 'F');
    
    // Ordenar candidatos por match
    const sorted = [...candidatos].sort((a, b) => b.match_porcentaje - a.match_porcentaje);
    const barWidth = (this.contentWidth - 10) / sorted.length;
    const maxBarHeight = barHeight - 6;
    
    sorted.forEach((candidato, index) => {
      const x = this.margin + 5 + (barWidth * index);
      const heightRatio = candidato.match_porcentaje / 100;
      const currentBarHeight = maxBarHeight * heightRatio;
      const barY = this.yPos + (barHeight - 3) - currentBarHeight;
      
      // Bar
      const color = getMatchColor(candidato.match_porcentaje);
      this.pdf.setFillColor(color.r, color.g, color.b);
      this.pdf.roundedRect(x, barY, barWidth - 2, currentBarHeight, 1, 1, 'F');
      
      // Percentage label on top
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.setFontSize(5);
      this.pdf.setTextColor(COLORS.gray700.r, COLORS.gray700.g, COLORS.gray700.b);
      this.pdf.text(`${candidato.match_porcentaje}%`, x + (barWidth - 2) / 2, barY - 1, { align: 'center' });
    });
    
    // Leyenda
    this.yPos += barHeight + 2;
    const legendY = this.yPos;
    
    const legends = [
      { label: 'Alto (>=70%)', color: COLORS.matchHigh },
      { label: 'Medio (40-69%)', color: COLORS.matchMedium },
      { label: 'Bajo (<40%)', color: COLORS.matchLow }
    ];
    
    let legendX = this.margin;
    this.pdf.setFontSize(6);
    
    legends.forEach((legend) => {
      // Color box
      this.pdf.setFillColor(legend.color.r, legend.color.g, legend.color.b);
      this.pdf.rect(legendX, legendY, 3, 3, 'F');
      
      // Label
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.setTextColor(COLORS.gray600.r, COLORS.gray600.g, COLORS.gray600.b);
      this.pdf.text(legend.label, legendX + 4, legendY + 2.5);
      
      legendX += this.pdf.getTextWidth(legend.label) + 10;
    });
    
    this.yPos += 8;
  }
  
  /**
   * Tabla de candidatos
   */
  private drawCandidatesTable(candidatos: CandidateData[]): void {
    const startY = this.yPos;
    const rowHeight = 9;
    const headerHeight = 8;
    
    // Título de sección
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(9);
    this.pdf.setTextColor(COLORS.gray700.r, COLORS.gray700.g, COLORS.gray700.b);
    this.pdf.text('LISTADO DE CANDIDATOS', this.margin, startY);
    
    this.yPos = startY + 4;
    
    // Columnas
    const cols = {
      nombre: { x: this.margin, width: 55 },
      email: { x: this.margin + 55, width: 60 },
      estado: { x: this.margin + 115, width: 35 },
      match: { x: this.margin + 150, width: this.contentWidth - 150 }
    };
    
    // Header
    this.pdf.setFillColor(COLORS.gray100.r, COLORS.gray100.g, COLORS.gray100.b);
    this.pdf.rect(this.margin, this.yPos, this.contentWidth, headerHeight, 'F');
    
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(7);
    this.pdf.setTextColor(COLORS.gray700.r, COLORS.gray700.g, COLORS.gray700.b);
    
    this.pdf.text('NOMBRE', cols.nombre.x + 2, this.yPos + 5);
    this.pdf.text('EMAIL', cols.email.x + 2, this.yPos + 5);
    this.pdf.text('ESTADO', cols.estado.x + 2, this.yPos + 5);
    this.pdf.text('MATCH', cols.match.x + 2, this.yPos + 5);
    
    this.yPos += headerHeight;
    
    // Ordenar por match desc
    const sorted = [...candidatos].sort((a, b) => b.match_porcentaje - a.match_porcentaje);
    
    sorted.forEach((candidato, index) => {
      // Fila alternada
      if (index % 2 === 0) {
        this.pdf.setFillColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
      } else {
        this.pdf.setFillColor(COLORS.gray50.r, COLORS.gray50.g, COLORS.gray50.b);
      }
      this.pdf.rect(this.margin, this.yPos, this.contentWidth, rowHeight, 'F');
      
      // Border inferior
      this.pdf.setDrawColor(COLORS.gray200.r, COLORS.gray200.g, COLORS.gray200.b);
      this.pdf.setLineWidth(0.1);
      this.pdf.line(this.margin, this.yPos + rowHeight, this.margin + this.contentWidth, this.yPos + rowHeight);
      
      // Nombre
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.setFontSize(7);
      this.pdf.setTextColor(COLORS.gray900.r, COLORS.gray900.g, COLORS.gray900.b);
      this.pdf.text(truncateText(candidato.nombre, 30), cols.nombre.x + 2, this.yPos + 5.5);
      
      // Email
      this.pdf.setTextColor(COLORS.gray600.r, COLORS.gray600.g, COLORS.gray600.b);
      this.pdf.text(truncateText(candidato.email, 32), cols.email.x + 2, this.yPos + 5.5);
      
      // Estado Badge
      this.drawStateBadge(candidato.estado, cols.estado.x + 2, this.yPos + 2);
      
      // Match con barra visual
      this.drawMatchBar(candidato.match_porcentaje, cols.match.x + 2, this.yPos + 2, cols.match.width - 6);
      
      this.yPos += rowHeight;
    });
    
    this.yPos += 3;
  }
  
  /**
   * Badge de estado
   */
  private drawStateBadge(estado: string, x: number, y: number): void {
    const isOferta = estado.toLowerCase().includes('oferta');
    
    const bgColor = isOferta ? COLORS.badgeGreen : COLORS.badgeGray;
    const textColor = isOferta ? COLORS.badgeGreenText : COLORS.badgeGrayText;
    
    const text = truncateText(estado, 15);
    this.pdf.setFontSize(6);
    const textWidth = this.pdf.getTextWidth(text);
    const badgeWidth = textWidth + 4;
    
    this.pdf.setFillColor(bgColor.r, bgColor.g, bgColor.b);
    this.pdf.roundedRect(x, y, badgeWidth, 5, 1, 1, 'F');
    
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setTextColor(textColor.r, textColor.g, textColor.b);
    this.pdf.text(text, x + 2, y + 3.5);
  }
  
  /**
   * Barra de match con porcentaje
   */
  private drawMatchBar(percentage: number, x: number, y: number, width: number): void {
    const barHeight = 5;
    const barWidth = width - 20;
    
    // Background
    this.pdf.setFillColor(COLORS.gray200.r, COLORS.gray200.g, COLORS.gray200.b);
    this.pdf.roundedRect(x, y, barWidth, barHeight, 1, 1, 'F');
    
    // Progress
    const color = getMatchColor(percentage);
    const progressWidth = (barWidth * percentage) / 100;
    this.pdf.setFillColor(color.r, color.g, color.b);
    this.pdf.roundedRect(x, y, progressWidth, barHeight, 1, 1, 'F');
    
    // Percentage text
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(7);
    this.pdf.setTextColor(COLORS.gray900.r, COLORS.gray900.g, COLORS.gray900.b);
    this.pdf.text(`${percentage}%`, x + barWidth + 2, y + 3.8);
    
    // Level indicator (for B/W printing)
    const level = getMatchLevel(percentage);
    this.pdf.setFontSize(5);
    this.pdf.setTextColor(color.r, color.g, color.b);
    this.pdf.text(level, x + barWidth / 2, y + 3.5, { align: 'center' });
  }
  
  /**
   * Footer
   */
  private drawFooter(): void {
    const footerY = this.pageHeight - 10;
    
    // Línea separadora
    this.pdf.setDrawColor(COLORS.gray300.r, COLORS.gray300.g, COLORS.gray300.b);
    this.pdf.setLineWidth(0.3);
    this.pdf.line(this.margin, footerY - 3, this.pageWidth - this.margin, footerY - 3);
    
    // Texto izquierdo
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(7);
    this.pdf.setTextColor(COLORS.gray500.r, COLORS.gray500.g, COLORS.gray500.b);
    this.pdf.text('BAUSEN | Sistema de Gestion de Talento', this.margin, footerY);
    
    // Centro
    this.pdf.setFont('helvetica', 'italic');
    this.pdf.text('Documento confidencial', this.pageWidth / 2, footerY, { align: 'center' });
    
    // Derecha
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.text('Pagina 1 de 1', this.pageWidth - this.margin, footerY, { align: 'right' });
  }
  
  /**
   * Guarda el PDF
   */
  save(filename: string = 'candidatos-perfil.pdf'): void {
    this.pdf.save(filename);
  }
  
  /**
   * Retorna el PDF como blob
   */
  toBlob(): Blob {
    return this.pdf.output('blob');
  }
  
  /**
   * Retorna el PDF como data URI
   */
  toDataUri(): string {
    return this.pdf.output('datauristring');
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// FUNCIÓN DE UTILIDAD PARA EXPORTAR
// ═══════════════════════════════════════════════════════════════════════════
export function generateCandidatesReportPDF(data: CandidatesReportData): jsPDF {
  const generator = new CandidatesReportPDF();
  return generator.generate(data);
}

export function downloadCandidatesReportPDF(data: CandidatesReportData, filename?: string): void {
  const generator = new CandidatesReportPDF();
  generator.generate(data);
  generator.save(filename || `candidatos-${data.puesto.toLowerCase().replace(/\s+/g, '-')}.pdf`);
}
