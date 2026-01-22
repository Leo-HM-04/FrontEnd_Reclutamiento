/**
 * ════════════════════════════════════════════════════════════════════════════
 * PDF GENERATOR - DISEÑO INSTITUCIONAL BAUSEN
 * ════════════════════════════════════════════════════════════════════════════
 * Sistema profesional de generación de PDFs usando jsPDF + autoTable
 * Diseño ejecutivo con logo, marca de agua y estilo corporativo
 * ════════════════════════════════════════════════════════════════════════════
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ═══════════════════════════════════════════════════════════════════════════
// COLORES CORPORATIVOS BAUSEN
// ═══════════════════════════════════════════════════════════════════════════
export const BAUSEN_COLORS = {
  primary: '#0033A0',
  primaryDark: '#002878',
  primaryLight: '#1E50B0',
  accent: '#3B82F6',
  gold: '#D4A853',
  dark: '#1F2937',
  gray: '#4B5563',
  grayLight: '#9CA3AF',
  grayLighter: '#E5E7EB',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  white: '#FFFFFF',
  bgLight: '#F8FAFC',
};

// Colores en formato RGB para jsPDF
const RGB = {
  primary: { r: 0, g: 51, b: 160 },
  primaryDark: { r: 0, g: 40, b: 120 },
  accent: { r: 212, g: 168, b: 83 },
  success: { r: 16, g: 185, b: 129 },
  warning: { r: 245, g: 158, b: 11 },
  error: { r: 239, g: 68, b: 68 },
  gray: { r: 107, g: 114, b: 128 },
  grayLight: { r: 156, g: 163, b: 175 },
  grayLighter: { r: 229, g: 231, b: 235 },
  dark: { r: 31, g: 41, b: 55 },
  white: { r: 255, g: 255, b: 255 },
  bgLight: { r: 248, g: 250, b: 252 },
};

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════
interface KPIData {
  label: string;
  value: string | number;
  type?: 'primary' | 'success' | 'warning' | 'accent' | 'error';
}

interface TableColumn {
  key: string;
  header: string;
  width?: number;
}

export interface ReportConfig {
  title: string;
  subtitle?: string;
}

interface PDFOptions {
  filename?: string;
}

interface ContentItem {
  type: 'header' | 'kpis' | 'sectionTitle' | 'section' | 'infoGrid' | 'table' | 'paragraph' | 'timeline' | 'space';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
}

// ═══════════════════════════════════════════════════════════════════════════
// CLASE PRINCIPAL DE GENERACIÓN DE PDF
// ═══════════════════════════════════════════════════════════════════════════
export class PDFReport {
  private pdf: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number = 15;
  private yPos: number = 15;
  private pageNumber: number = 1;

  constructor() {
    this.pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    this.pageWidth = this.pdf.internal.pageSize.getWidth();
    this.pageHeight = this.pdf.internal.pageSize.getHeight();
  }

  // ═══════════════════════════════════════════════════════════════════════
  // HEADER INSTITUCIONAL
  // ═══════════════════════════════════════════════════════════════════════
  drawHeader(title: string, subtitle?: string): void {
    const headerHeight = 35;
    
    // Fondo degradado azul (simulado con rectángulos)
    for (let i = 0; i < headerHeight; i++) {
      const ratio = i / headerHeight;
      const r = Math.round(RGB.primary.r * (1 - ratio * 0.3));
      const g = Math.round(RGB.primary.g * (1 - ratio * 0.3));
      const b = Math.round(RGB.primary.b * (1 - ratio * 0.3));
      this.pdf.setFillColor(r, g, b);
      this.pdf.rect(0, i, this.pageWidth, 1, 'F');
    }

    // Línea dorada inferior
    this.pdf.setFillColor(RGB.accent.r, RGB.accent.g, RGB.accent.b);
    this.pdf.rect(0, headerHeight, this.pageWidth, 2, 'F');

    // Logo BAUSEN (caja blanca con logo)
    this.pdf.setFillColor(255, 255, 255);
    this.pdf.roundedRect(12, 8, 45, 20, 3, 3, 'F');
    
    // Isotipo (figura de 8)
    this.pdf.setFillColor(RGB.primary.r, RGB.primary.g, RGB.primary.b);
    this.pdf.ellipse(22, 14, 5, 4, 'F');
    this.pdf.ellipse(22, 22, 6, 5, 'F');
    this.pdf.setFillColor(255, 255, 255);
    this.pdf.ellipse(22, 14, 2.5, 2, 'F');
    this.pdf.ellipse(22, 22, 3, 2.5, 'F');
    
    // Texto "Bausen"
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(14);
    this.pdf.setTextColor(RGB.primary.r, RGB.primary.g, RGB.primary.b);
    this.pdf.text('Bausen', 30, 20);

    // Título del reporte
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(16);
    this.pdf.setTextColor(255, 255, 255);
    this.pdf.text(title.toUpperCase(), this.pageWidth - 15, 16, { align: 'right' });

    // Subtítulo
    if (subtitle) {
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.setFontSize(10);
      this.pdf.setTextColor(220, 220, 220);
      this.pdf.text(subtitle, this.pageWidth - 15, 23, { align: 'right' });
    }

    // Fecha
    const date = new Date().toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    this.pdf.setFontSize(8);
    this.pdf.setTextColor(180, 180, 180);
    this.pdf.text(date, this.pageWidth - 15, 30, { align: 'right' });

    this.yPos = headerHeight + 10;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // MARCA DE AGUA
  // ═══════════════════════════════════════════════════════════════════════
  drawWatermark(): void {
    const pages = this.pdf.getNumberOfPages();
    
    for (let i = 1; i <= pages; i++) {
      this.pdf.setPage(i);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.setFontSize(60);
      this.pdf.setTextColor(RGB.primary.r, RGB.primary.g, RGB.primary.b);
      
      // Aplicar opacidad muy baja
      this.pdf.setGState(this.pdf.GState({ opacity: 0.04 }));
      
      const centerX = this.pageWidth / 2;
      const centerY = this.pageHeight / 2;
      
      // Guardar estado y rotar
      this.pdf.saveGraphicsState();
      this.pdf.text('BAUSEN', centerX, centerY, {
        align: 'center',
        angle: 45
      });
      this.pdf.restoreGraphicsState();
      
      // Restaurar opacidad
      this.pdf.setGState(this.pdf.GState({ opacity: 1 }));
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // FOOTER
  // ═══════════════════════════════════════════════════════════════════════
  drawFooter(): void {
    const footerY = this.pageHeight - 12;
    
    // Línea superior
    this.pdf.setDrawColor(RGB.primary.r, RGB.primary.g, RGB.primary.b);
    this.pdf.setLineWidth(0.5);
    this.pdf.line(this.margin, footerY - 3, this.pageWidth - this.margin, footerY - 3);

    // Texto izquierdo
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(8);
    this.pdf.setTextColor(RGB.primary.r, RGB.primary.g, RGB.primary.b);
    this.pdf.text('BAUSEN', this.margin, footerY);
    
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setTextColor(RGB.gray.r, RGB.gray.g, RGB.gray.b);
    this.pdf.text(' | Sistema de Gestión de Talento', this.margin + 15, footerY);

    // Confidencial (centro)
    this.pdf.setFont('helvetica', 'italic');
    this.pdf.setFontSize(7);
    this.pdf.setTextColor(RGB.grayLight.r, RGB.grayLight.g, RGB.grayLight.b);
    this.pdf.text('Documento confidencial', this.pageWidth / 2, footerY, { align: 'center' });

    // Número de página (derecha)
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(8);
    this.pdf.setTextColor(RGB.gray.r, RGB.gray.g, RGB.gray.b);
    this.pdf.text(`Página ${this.pageNumber}`, this.pageWidth - this.margin, footerY, { align: 'right' });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // KPI CARDS
  // ═══════════════════════════════════════════════════════════════════════
  drawKPIRow(kpis: KPIData[]): void {
    const cardWidth = (this.pageWidth - (this.margin * 2) - ((kpis.length - 1) * 5)) / kpis.length;
    const cardHeight = 25;
    let xPos = this.margin;

    kpis.forEach((kpi) => {
      // Color según tipo
      let color = RGB.primary;
      switch (kpi.type) {
        case 'success': color = RGB.success; break;
        case 'warning': color = RGB.warning; break;
        case 'accent': color = RGB.accent; break;
        case 'error': color = RGB.error; break;
      }

      // Fondo de la tarjeta
      this.pdf.setFillColor(RGB.bgLight.r, RGB.bgLight.g, RGB.bgLight.b);
      this.pdf.roundedRect(xPos, this.yPos, cardWidth, cardHeight, 2, 2, 'F');

      // Borde izquierdo de color
      this.pdf.setFillColor(color.r, color.g, color.b);
      this.pdf.rect(xPos, this.yPos, 3, cardHeight, 'F');

      // Valor
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.setFontSize(18);
      this.pdf.setTextColor(RGB.dark.r, RGB.dark.g, RGB.dark.b);
      this.pdf.text(String(kpi.value), xPos + 10, this.yPos + 12);

      // Label
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.setFontSize(8);
      this.pdf.setTextColor(RGB.gray.r, RGB.gray.g, RGB.gray.b);
      this.pdf.text(kpi.label.toUpperCase(), xPos + 10, this.yPos + 20);

      xPos += cardWidth + 5;
    });

    this.yPos += cardHeight + 10;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // TÍTULO DE SECCIÓN
  // ═══════════════════════════════════════════════════════════════════════
  drawSectionTitle(title: string): void {
    this.checkNewPage(15);

    // Fondo
    this.pdf.setFillColor(RGB.bgLight.r, RGB.bgLight.g, RGB.bgLight.b);
    this.pdf.roundedRect(this.margin, this.yPos, this.pageWidth - (this.margin * 2), 10, 2, 2, 'F');

    // Barra izquierda
    this.pdf.setFillColor(RGB.primary.r, RGB.primary.g, RGB.primary.b);
    this.pdf.rect(this.margin, this.yPos, 3, 10, 'F');

    // Texto
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(10);
    this.pdf.setTextColor(RGB.dark.r, RGB.dark.g, RGB.dark.b);
    this.pdf.text(title.toUpperCase(), this.margin + 8, this.yPos + 7);

    this.yPos += 15;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // INFO GRID (2 columnas)
  // ═══════════════════════════════════════════════════════════════════════
  drawInfoGrid(items: Array<{ label: string; value: string }>): void {
    const colWidth = (this.pageWidth - (this.margin * 2) - 10) / 2;
    let col = 0;

    items.forEach((item) => {
      const xPos = this.margin + (col * (colWidth + 10));
      
      this.checkNewPage(15);

      // Fondo
      this.pdf.setFillColor(250, 250, 250);
      this.pdf.roundedRect(xPos, this.yPos, colWidth, 12, 2, 2, 'F');

      // Borde
      this.pdf.setDrawColor(RGB.grayLighter.r, RGB.grayLighter.g, RGB.grayLighter.b);
      this.pdf.setLineWidth(0.3);
      this.pdf.roundedRect(xPos, this.yPos, colWidth, 12, 2, 2, 'S');

      // Label
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.setFontSize(7);
      this.pdf.setTextColor(RGB.gray.r, RGB.gray.g, RGB.gray.b);
      this.pdf.text(item.label.toUpperCase(), xPos + 4, this.yPos + 4);

      // Value
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.setFontSize(9);
      this.pdf.setTextColor(RGB.dark.r, RGB.dark.g, RGB.dark.b);
      const displayValue = item.value || 'N/A';
      this.pdf.text(displayValue.substring(0, 35), xPos + 4, this.yPos + 10);

      col++;
      if (col >= 2) {
        col = 0;
        this.yPos += 14;
      }
    });

    if (col !== 0) {
      this.yPos += 14;
    }
    this.yPos += 5;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // TABLA
  // ═══════════════════════════════════════════════════════════════════════
  drawTable(columns: TableColumn[], data: Record<string, unknown>[]): void {
    this.checkNewPage(30);

    const headers = columns.map(col => col.header);
    const body = data.map(row => 
      columns.map(col => String(row[col.key] ?? 'N/A'))
    );

    autoTable(this.pdf, {
      startY: this.yPos,
      head: [headers],
      body: body,
      margin: { left: this.margin, right: this.margin },
      styles: {
        fontSize: 8,
        cellPadding: 3,
        lineColor: [229, 231, 235],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [RGB.primary.r, RGB.primary.g, RGB.primary.b],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: columns.reduce((acc, col, index) => {
        if (col.width) {
          acc[index] = { cellWidth: col.width };
        }
        return acc;
      }, {} as Record<number, { cellWidth: number }>),
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.yPos = (this.pdf as any).lastAutoTable?.finalY + 10 || this.yPos + 30;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PÁRRAFO
  // ═══════════════════════════════════════════════════════════════════════
  drawParagraph(text: string): void {
    this.checkNewPage(20);

    // Fondo
    this.pdf.setFillColor(250, 250, 250);
    const lines = this.pdf.splitTextToSize(text, this.pageWidth - (this.margin * 2) - 20);
    const height = lines.length * 5 + 10;
    this.pdf.roundedRect(this.margin, this.yPos, this.pageWidth - (this.margin * 2), height, 2, 2, 'F');

    // Barra izquierda
    this.pdf.setFillColor(RGB.primary.r, RGB.primary.g, RGB.primary.b);
    this.pdf.rect(this.margin, this.yPos, 2, height, 'F');

    // Texto
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(9);
    this.pdf.setTextColor(RGB.dark.r, RGB.dark.g, RGB.dark.b);
    
    let textY = this.yPos + 7;
    lines.forEach((line: string) => {
      this.pdf.text(line, this.margin + 8, textY);
      textY += 5;
    });

    this.yPos += height + 5;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // TIMELINE
  // ═══════════════════════════════════════════════════════════════════════
  drawTimeline(items: Array<{ date: string; title: string; description?: string }>): void {
    items.forEach((item, index) => {
      this.checkNewPage(20);

      // Punto
      this.pdf.setFillColor(RGB.primary.r, RGB.primary.g, RGB.primary.b);
      this.pdf.circle(this.margin + 5, this.yPos + 5, 3, 'F');
      this.pdf.setFillColor(255, 255, 255);
      this.pdf.circle(this.margin + 5, this.yPos + 5, 1.5, 'F');

      // Línea vertical (si no es el último)
      if (index < items.length - 1) {
        this.pdf.setDrawColor(RGB.grayLighter.r, RGB.grayLighter.g, RGB.grayLighter.b);
        this.pdf.setLineWidth(0.5);
        this.pdf.line(this.margin + 5, this.yPos + 8, this.margin + 5, this.yPos + 20);
      }

      // Contenido
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.setFontSize(8);
      this.pdf.setTextColor(RGB.primary.r, RGB.primary.g, RGB.primary.b);
      this.pdf.text(item.date, this.margin + 12, this.yPos + 4);

      this.pdf.setFont('helvetica', 'normal');
      this.pdf.setFontSize(9);
      this.pdf.setTextColor(RGB.dark.r, RGB.dark.g, RGB.dark.b);
      this.pdf.text(item.title, this.margin + 12, this.yPos + 10);

      if (item.description) {
        this.pdf.setFontSize(8);
        this.pdf.setTextColor(RGB.gray.r, RGB.gray.g, RGB.gray.b);
        this.pdf.text(item.description.substring(0, 60), this.margin + 12, this.yPos + 15);
      }

      this.yPos += 20;
    });

    this.yPos += 5;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // UTILIDADES
  // ═══════════════════════════════════════════════════════════════════════
  checkNewPage(height: number): void {
    if (this.yPos + height > this.pageHeight - 25) {
      this.drawFooter();
      this.pdf.addPage();
      this.pageNumber++;
      this.yPos = 15;
    }
  }

  addSpace(height: number = 10): void {
    this.yPos += height;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // GUARDAR PDF
  // ═══════════════════════════════════════════════════════════════════════
  save(filename: string): void {
    this.drawWatermark();
    this.drawFooter();
    this.pdf.save(filename);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// FUNCIONES DE COMPATIBILIDAD (para reportes existentes)
// ═══════════════════════════════════════════════════════════════════════════

// Almacenamiento temporal de contenido
let contentItems: ContentItem[] = [];
let reportConfig: ReportConfig = { title: '' };

export function generateHeader(title: string, subtitle?: string): string {
  reportConfig = { title, subtitle };
  contentItems.push({ type: 'header', data: { title, subtitle } });
  return '';
}

export function generateKPIRow(kpis: KPIData[]): string {
  contentItems.push({ type: 'kpis', data: kpis });
  return '';
}

export function generateSectionTitle(title: string): string {
  contentItems.push({ type: 'sectionTitle', data: { title } });
  return '';
}

export function generateSection(title: string, content: string): string {
  contentItems.push({ type: 'section', data: { title } });
  return content;
}

export function generateInfoGrid(items: Array<{ label: string; value: string }>): string {
  contentItems.push({ type: 'infoGrid', data: items });
  return '';
}

export function generateTable(
  columns: TableColumn[],
  data: Record<string, unknown>[],
  options?: { maxRows?: number }
): string {
  const limitedData = options?.maxRows ? data.slice(0, options.maxRows) : data;
  contentItems.push({ type: 'table', data: { columns, rows: limitedData } });
  return '';
}

export function generateBadge(text: string, type: 'primary' | 'success' | 'warning' | 'error' | 'gray' = 'gray'): string {
  return text; // Solo retorna el texto para tablas
}

export function generateParagraph(text: string): string {
  contentItems.push({ type: 'paragraph', data: { text } });
  return '';
}

export function generateTimeline(items: Array<{ date: string; title: string; description?: string }>): string {
  contentItems.push({ type: 'timeline', data: items });
  return '';
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function wrapInPage(content: string, config: ReportConfig): string {
  reportConfig = config;
  // Retornar un marcador para indicar que está listo para generar
  return '__READY_TO_GENERATE__';
}

export async function generatePDF(wrappedContent: string, options?: PDFOptions): Promise<void> {
  try {
    const report = new PDFReport();
    
    // Dibujar header con la configuración guardada
    report.drawHeader(reportConfig.title, reportConfig.subtitle);

    // Procesar cada elemento de contenido
    contentItems.forEach((item) => {
      switch (item.type) {
        case 'header':
          // Ya procesado arriba
          break;
        case 'kpis':
          report.drawKPIRow(item.data);
          break;
        case 'sectionTitle':
          report.drawSectionTitle(item.data.title);
          break;
        case 'section':
          report.drawSectionTitle(item.data.title);
          break;
        case 'infoGrid':
          report.drawInfoGrid(item.data);
          break;
        case 'table':
          report.drawTable(item.data.columns, item.data.rows);
          break;
        case 'paragraph':
          report.drawParagraph(item.data.text);
          break;
        case 'timeline':
          report.drawTimeline(item.data);
          break;
        case 'space':
          report.addSpace(item.data.height || 10);
          break;
      }
    });

    // Guardar PDF
    const filename = options?.filename || `reporte-bausen-${new Date().toISOString().split('T')[0]}.pdf`;
    report.save(filename);
    
    // Limpiar estado
    contentItems = [];
    reportConfig = { title: '' };
  } catch (error) {
    console.error('Error generating PDF:', error);
    // Limpiar estado en caso de error
    contentItems = [];
    reportConfig = { title: '' };
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILIDADES DE FORMATO
// ═══════════════════════════════════════════════════════════════════════════

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(dateString: string): string {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getStatusBadgeType(status: string): 'primary' | 'success' | 'warning' | 'error' | 'gray' {
  const statusMap: Record<string, 'primary' | 'success' | 'warning' | 'error' | 'gray'> = {
    new: 'primary',
    screening: 'warning',
    qualified: 'success',
    shortlisted: 'success',
    interviewing: 'warning',
    offered: 'success',
    hired: 'success',
    rejected: 'error',
    withdrawn: 'gray',
    on_hold: 'warning',
    draft: 'gray',
    open: 'primary',
    in_progress: 'warning',
    completed: 'success',
    cancelled: 'error',
    active: 'success',
    inactive: 'gray',
  };
  return statusMap[status?.toLowerCase()] || 'gray';
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    new: 'Nuevo',
    screening: 'En Revisión',
    qualified: 'Calificado',
    shortlisted: 'Preseleccionado',
    interviewing: 'En Entrevista',
    offered: 'Oferta',
    hired: 'Contratado',
    rejected: 'Rechazado',
    withdrawn: 'Retirado',
    on_hold: 'En Espera',
    draft: 'Borrador',
    open: 'Abierto',
    in_progress: 'En Proceso',
    completed: 'Completado',
    cancelled: 'Cancelado',
    active: 'Activo',
    inactive: 'Inactivo',
  };
  return labels[status?.toLowerCase()] || status || 'N/A';
}
