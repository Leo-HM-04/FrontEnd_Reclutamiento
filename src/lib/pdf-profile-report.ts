/**
 * ════════════════════════════════════════════════════════════════════════════
 * PDF PROFILE REPORT - DISEÑO DASHBOARD MODERNO
 * ════════════════════════════════════════════════════════════════════════════
 * Generador de PDF tipo dashboard para reportes de perfiles de reclutamiento
 * Diseño moderno con cards, badges, KPIs y pipeline visual
 * 
 * Características:
 * - Layout tipo dashboard en 1 página tamaño carta
 * - KPIs con indicadores de color
 * - Pipeline visual del proceso
 * - Cards de información organizadas
 * - Soporte UTF-8 completo
 * ════════════════════════════════════════════════════════════════════════════
 */

import jsPDF from 'jspdf';
import { BAUSEN_LOGO_BASE64, BAUSEN_LOGO_RATIO } from './logo-base64';
import { BECHAPRA_WATERMARK_B_BASE64 } from './watermarkBase64';

// ═══════════════════════════════════════════════════════════════════════════
// COLORES DEL TEMA
// ═══════════════════════════════════════════════════════════════════════════
const COLORS = {
  // Primarios
  primary: { r: 0, g: 51, b: 160 },      // Azul corporativo
  primaryLight: { r: 59, g: 130, b: 246 }, // Azul claro
  primaryDark: { r: 0, g: 40, b: 120 },
  
  // Estados
  success: { r: 34, g: 197, b: 94 },     // Verde
  warning: { r: 245, g: 158, b: 11 },    // Naranja
  error: { r: 239, g: 68, b: 68 },       // Rojo
  info: { r: 59, g: 130, b: 246 },       // Azul info
  
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
  
  // Badges
  badgeGreen: { r: 220, g: 252, b: 231 },
  badgeGreenText: { r: 22, g: 101, b: 52 },
  badgeOrange: { r: 255, g: 237, b: 213 },
  badgeOrangeText: { r: 154, g: 52, b: 18 },
  badgeRed: { r: 254, g: 226, b: 226 },
  badgeRedText: { r: 153, g: 27, b: 27 },
  badgeBlue: { r: 219, g: 234, b: 254 },
  badgeBlueText: { r: 30, g: 64, b: 175 },
  badgeGray: { r: 243, g: 244, b: 246 },
  badgeGrayText: { r: 55, g: 65, b: 81 },
};

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS E INTERFACES
// ═══════════════════════════════════════════════════════════════════════════
export interface ProfileReportData {
  // Información básica
  titulo?: string;
  puesto: string;
  fecha: string;
  
  // KPIs
  kpis: {
    dias_abierto: number;
    candidatos: number;
    preseleccionados: number;
    entrevistas: number;
  };
  
  // Estados y clasificaciones
  estado: 'Aprobado' | 'Pendiente' | 'Rechazado' | 'En Revisión' | string;
  prioridad: 'high' | 'medium' | 'low' | string;
  servicio: 'normal' | 'urgente' | 'express' | string;
  
  // Información del cliente/empresa
  empresa: string;
  industria: string;
  contacto: string;
  email: string;
  
  // Detalles del puesto
  ciudad: string;
  modalidad: 'presencial' | 'remoto' | 'híbrido' | string;
  salario: string;
  supervisor: string;
  
  // Contenido
  resumen_rol: string;
  requisitos?: string;
  
  // Habilidades y competencias
  technical_skills?: string[];
  soft_skills?: string[];
  languages?: string[];
  
  // Opciones de diseño
  incluirMarcaAgua?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILIDADES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Limpia texto con problemas de encoding UTF-8 y entidades HTML
 */
function cleanText(text: string | any): string {
  // Manejar valores no-string
  if (!text) return '';
  if (typeof text !== 'string') {
    console.warn('⚠️ [cleanText] Valor no-string recibido:', typeof text, text);
    return String(text);
  }
  
  let cleaned = text;
  const original = text; // Guardar original para logging
  
  // 0. Detectar y corregir el patrón "&X" repetido (cada carácter precedido de &)
  // Este patrón ocurre cuando el texto ha sido mal procesado
  // Ejemplo: "&E&s&t&a&m&o&s" → "Estamos"
  const ampersandCount = (cleaned.match(/&/g) || []).length;
  const letterCount = cleaned.replace(/[^a-zA-ZáéíóúñÁÉÍÓÚÑüÜ0-9]/g, '').length;
  
  // LOG: Si detectamos muchos &, reportar
  if (ampersandCount > 5) {
    console.log('🚨 [cleanText] Texto con muchos ampersands detectado:', {
      original: original.substring(0, 100),
      ampersandCount,
      letterCount,
      ratio: ampersandCount / letterCount,
    });
  }
  
  if (/^&[^&]/.test(cleaned) || /&[a-zA-ZáéíóúñÁÉÍÓÚÑüÜ0-9]&/.test(cleaned)) {
    // Remover todos los & que preceden a caracteres individuales (no entidades HTML válidas)
    // Primero verificamos si parece ser este patrón específico
    
    // Si hay casi tantos & como letras, es el patrón problemático
    if (ampersandCount > letterCount * 0.5) {
      console.log('🔧 [cleanText] Aplicando limpieza de ampersands...');
      cleaned = cleaned.replace(/&(?![a-z]+;|#\d+;|#x[0-9a-f]+;)/gi, '');
      console.log('✅ [cleanText] Resultado después de limpiar:', cleaned.substring(0, 100));
    }
  }
  
  // 1. Decodificar entidades HTML comunes
  const htmlEntities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&nbsp;': ' ',
    '&ntilde;': 'ñ',
    '&Ntilde;': 'Ñ',
    '&aacute;': 'á',
    '&eacute;': 'é',
    '&iacute;': 'í',
    '&oacute;': 'ó',
    '&uacute;': 'ú',
    '&Aacute;': 'Á',
    '&Eacute;': 'É',
    '&Iacute;': 'Í',
    '&Oacute;': 'Ó',
    '&Uacute;': 'Ú',
    '&uuml;': 'ü',
    '&Uuml;': 'Ü',
  };
  
  for (const [entity, char] of Object.entries(htmlEntities)) {
    cleaned = cleaned.replace(new RegExp(entity, 'gi'), char);
  }
  
  // 2. Decodificar entidades numéricas HTML (&#123; o &#x7B;)
  cleaned = cleaned.replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)));
  cleaned = cleaned.replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  
  // 3. Reemplazos de caracteres mal codificados (mojibake común de UTF-8 leído como Latin-1)
  const replacements: Array<[string, string]> = [
    // Minúsculas con acento (UTF-8 mal interpretado como Latin-1)
    ['├í', 'á'],
    ['├®', 'é'],
    ['├¡', 'í'],
    ['├│', 'ó'],
    ['├║', 'ú'],
    ['├▒', 'ñ'],
    ['├╝', 'ü'],
    
    // Mayúsculas con acento
    ['├ü', 'Á'],
    ['├ë', 'É'],
    ['├ì', 'Í'],
    ['├ô', 'Ó'],
    ['├Ü', 'Ú'],
    ['├æ', 'Ñ'],
    ['├£', 'Ü'],
    
    // Patrones adicionales comunes
    ['Ã¡', 'á'], ['Ã©', 'é'], ['Ã­', 'í'], ['Ã³', 'ó'], ['Ãº', 'ú'],
    ['Ã±', 'ñ'], ['Ã¼', 'ü'],
    ['Á', 'Á'], ['É', 'É'], ['Í', 'Í'], ['Ó', 'Ó'], ['Ú', 'Ú'],
    ['Ñ', 'Ñ'], ['Ü', 'Ü'],
    
    // Otros caracteres especiales
    ['\u2013', '–'], // en-dash
    ['\u2014', '—'], // em-dash
    ['\u201c', '"'], // left double quote
    ['\u201d', '"'], // right double quote
    ['\u2018', "'"], // left single quote
    ['\u2019', "'"], // right single quote
    ['┬┐', '¿'],
    ['┬í', '¡'],
    ['Â ', ' '],
    ['Â', ''],
  ];
  
  for (const [corrupted, correct] of replacements) {
    cleaned = cleaned.split(corrupted).join(correct);
  }
  
  // 4. Normalizar espacios
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return cleaned;
}

/**
 * Normaliza ciudades duplicadas (ej: "Morealia, Morealia" → "Morealia")
 */
function normalizeCity(city: string): string {
  if (!city) return '';
  
  const parts = city.split(',').map(p => p.trim());
  const unique = [...new Set(parts)];
  return unique.join(', ');
}

/**
 * Formatea moneda
 */
function formatCurrency(amount: string): string {
  return cleanText(amount);
}

// ═══════════════════════════════════════════════════════════════════════════
// CLASE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════
export class ProfileReportPDF {
  private pdf: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number = 12; // mm (equivale a ~34pt)
  private contentWidth: number;
  private yPos: number = 0;
  private incluirMarcaAgua: boolean = true; // Por defecto habilitada
  
  constructor() {
    // Tamaño carta: 215.9mm x 279.4mm
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
   * Aplica marca de agua con el logo de Bausen
   * Se renderiza con opacidad sutil ENCIMA del contenido
   * Posicionada en el centro-inferior del documento para máxima visibilidad
   */
  private aplicarMarcaAgua(): void {
    if (!this.incluirMarcaAgua) return;
    
    const anyDoc = this.pdf as any;
    const imgData = BECHAPRA_WATERMARK_B_BASE64; // Usar la marca de agua oficial
    
    try {
      // Obtener propiedades de la imagen para mantener aspect ratio
      const props = anyDoc.getImageProperties(imgData);
      const ratio = props.width / props.height;
      
      // Tamaño para marca de agua (75% del ancho de página)
      const wmW = this.pageWidth * 0.75;
      const wmH = wmW / ratio;
      
      // Posición: INFERIOR IZQUIERDA (ligeramente fuera para efecto profesional)
      const x = -18; // Ligeramente hacia la izquierda
      const y = this.pageHeight - wmH + 12; // Parte inferior con ligero ajuste
      
      // Verificar si soporta estados gráficos para opacidad
      const hasGState = typeof anyDoc.GState === 'function' && typeof anyDoc.setGState === 'function';
      
      // Guardar estado gráfico actual
      if (typeof anyDoc.saveGraphicsState === 'function') {
        anyDoc.saveGraphicsState();
      }
      
      // Aplicar opacidad muy sutil (5%)
      // Este valor mantiene la marca visible pero muy discreta
      if (hasGState) {
        anyDoc.setGState(new anyDoc.GState({ opacity: 0.05 }));
      }
      
      // Dibujar marca de agua ENCIMA del contenido
      anyDoc.addImage(imgData, 'PNG', x, y, wmW, wmH, 'WM_BAUSEN_PROFILE', 'FAST');
      
      // Restaurar estado gráfico a opacidad completa
      if (hasGState) {
        anyDoc.setGState(new anyDoc.GState({ opacity: 1 }));
      }
      if (typeof anyDoc.restoreGraphicsState === 'function') {
        anyDoc.restoreGraphicsState();
      }
      
      console.log('✅ [PDF Profile] Marca de agua aplicada correctamente');
    } catch (e) {
      // Si falla, no romper el PDF
      console.warn('⚠️ [PDF Profile] Marca de agua no pudo renderizarse:', e);
    }
  }
  
  /**
   * Genera el reporte completo
   */
  generate(data: ProfileReportData): jsPDF {
    // LOG: Datos originales recibidos
    console.log('📄 [PDF Profile] Datos originales recibidos:', {
      puesto: data.puesto,
      requisitos: data.requisitos,
      technical_skills: data.technical_skills,
      soft_skills: data.soft_skills,
      languages: data.languages,
    });
    
    // Limpiar todos los textos
    const cleanData: ProfileReportData = {
      ...data,
      puesto: cleanText(data.puesto),
      empresa: cleanText(data.empresa),
      industria: cleanText(data.industria),
      contacto: cleanText(data.contacto),
      email: cleanText(data.email),
      ciudad: normalizeCity(cleanText(data.ciudad)),
      modalidad: cleanText(data.modalidad),
      salario: formatCurrency(data.salario),
      supervisor: cleanText(data.supervisor),
      resumen_rol: cleanText(data.resumen_rol),
      requisitos: cleanText(data.requisitos || ''),
      technical_skills: (data.technical_skills || [])
        .filter(skill => skill && (typeof skill === 'string' || typeof skill === 'number'))
        .map(skill => cleanText(skill)),
      soft_skills: (data.soft_skills || [])
        .filter(skill => skill && (typeof skill === 'string' || typeof skill === 'number'))
        .map(skill => cleanText(skill)),
      languages: (data.languages || [])
        .filter(lang => lang && (typeof lang === 'string' || typeof lang === 'number'))
        .map(lang => cleanText(lang)),
      fecha: cleanText(data.fecha),
      estado: cleanText(data.estado),
    };
    
    // LOG: Datos después de limpiar
    console.log('✅ [PDF Profile] Datos después de cleanText:', {
      puesto: cleanData.puesto,
      requisitos: cleanData.requisitos,
      technical_skills: cleanData.technical_skills,
      soft_skills: cleanData.soft_skills,
      languages: cleanData.languages,
    });
    
    // Configurar opción de marca de agua
    this.incluirMarcaAgua = data.incluirMarcaAgua !== false; // Por defecto true
    
    this.yPos = this.margin;
    
    // 1. Header
    this.drawHeader(cleanData);
    
    // 2. KPI Row
    this.drawKPICards(cleanData.kpis);
    
    // 3. Pipeline
    this.drawPipeline(cleanData.kpis);
    
    // 4. Two-column cards (Empresa + Detalles)
    this.drawInfoCards(cleanData);
    
    // 5. Resumen del rol y requisitos (incluye habilidades)
    this.drawResumenRolYRequisitos(
      cleanData.resumen_rol, 
      cleanData.requisitos || '',
      cleanData.technical_skills || [],
      cleanData.soft_skills || [],
      cleanData.languages || []
    );
    
    // 6. Footer
    this.drawFooter();
    
    // 7. Aplicar marca de agua AL FINAL (se dibuja encima con opacidad)
    this.aplicarMarcaAgua();
    
    return this.pdf;
  }
  
  /**
   * Header con logo, título, badges
   */
  private drawHeader(data: ProfileReportData): void {
    const headerHeight = 32;
    
    // Fondo del header blanco
    this.pdf.setFillColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
    this.pdf.rect(0, 0, this.pageWidth, headerHeight, 'F');
    
    // Línea decorativa inferior azul
    this.pdf.setFillColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
    this.pdf.rect(0, headerHeight, this.pageWidth, 1, 'F');
    
    // Logo Bausen (imagen real)
    const logoX = this.margin;
    const logoY = 4;
    const logoH = 18;  // Altura del logo
    const logoW = logoH * BAUSEN_LOGO_RATIO;  // Ancho proporcional
    
    // Añadir logo usando base64
    try {
      this.pdf.addImage(BAUSEN_LOGO_BASE64, 'PNG', logoX, logoY, logoW, logoH);
    } catch {
      // Fallback: si falla la imagen, mostrar texto
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.setFontSize(20);
      this.pdf.setTextColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
      this.pdf.text('BAUSEN', logoX, logoY + 12);
    }
    
    // Título "REPORTE DE PERFIL"
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(8);
    this.pdf.setTextColor(COLORS.gray500.r, COLORS.gray500.g, COLORS.gray500.b);
    this.pdf.text('REPORTE DE PERFIL', this.margin, headerHeight + 8);
    
    // Nombre del puesto (grande)
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(18);
    this.pdf.setTextColor(COLORS.gray900.r, COLORS.gray900.g, COLORS.gray900.b);
    this.pdf.text(data.puesto.toUpperCase(), this.margin, headerHeight + 16);
    
    // Fecha
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(9);
    this.pdf.setTextColor(COLORS.gray500.r, COLORS.gray500.g, COLORS.gray500.b);
    this.pdf.text(data.fecha, this.margin, headerHeight + 22);
    
    // Badges (alineados a la derecha)
    const badgeY = headerHeight + 10;
    let badgeX = this.pageWidth - this.margin;
    
    // Badge de servicio
    badgeX = this.drawBadge(
      data.servicio === 'urgente' ? 'URGENTE' : data.servicio === 'express' ? 'EXPRESS' : 'NORMAL',
      badgeX, badgeY,
      data.servicio === 'urgente' ? 'orange' : data.servicio === 'express' ? 'red' : 'gray',
      'right'
    );
    
    // Badge de prioridad
    badgeX = this.drawBadge(
      data.prioridad === 'high' ? 'ALTA' : data.prioridad === 'medium' ? 'MEDIA' : 'BAJA',
      badgeX - 3, badgeY,
      data.prioridad === 'high' ? 'red' : data.prioridad === 'medium' ? 'orange' : 'gray',
      'right'
    );
    
    // Badge de estado
    this.drawBadge(
      data.estado.toUpperCase(),
      badgeX - 3, badgeY,
      data.estado.toLowerCase() === 'aprobado' ? 'green' : 
      data.estado.toLowerCase() === 'pendiente' ? 'orange' : 
      data.estado.toLowerCase() === 'rechazado' ? 'red' : 'blue',
      'right'
    );
    
    this.yPos = headerHeight + 28;
  }
  
  /**
   * Dibuja un badge y retorna la posición X final
   */
  private drawBadge(
    text: string, 
    x: number, 
    y: number, 
    color: 'green' | 'orange' | 'red' | 'blue' | 'gray',
    align: 'left' | 'right' = 'left'
  ): number {
    const padding = 3;
    const height = 6;
    
    // Calcular ancho del texto
    this.pdf.setFontSize(7);
    this.pdf.setFont('helvetica', 'bold');
    const textWidth = this.pdf.getTextWidth(text);
    const badgeWidth = textWidth + (padding * 2);
    
    // Ajustar X según alineación
    const startX = align === 'right' ? x - badgeWidth : x;
    
    // Colores según tipo
    let bgColor, textColor;
    switch (color) {
      case 'green':
        bgColor = COLORS.badgeGreen;
        textColor = COLORS.badgeGreenText;
        break;
      case 'orange':
        bgColor = COLORS.badgeOrange;
        textColor = COLORS.badgeOrangeText;
        break;
      case 'red':
        bgColor = COLORS.badgeRed;
        textColor = COLORS.badgeRedText;
        break;
      case 'blue':
        bgColor = COLORS.badgeBlue;
        textColor = COLORS.badgeBlueText;
        break;
      default:
        bgColor = COLORS.badgeGray;
        textColor = COLORS.badgeGrayText;
    }
    
    // Dibujar fondo
    this.pdf.setFillColor(bgColor.r, bgColor.g, bgColor.b);
    this.pdf.roundedRect(startX, y - height + 2, badgeWidth, height, 1.5, 1.5, 'F');
    
    // Dibujar texto
    this.pdf.setTextColor(textColor.r, textColor.g, textColor.b);
    this.pdf.text(text, startX + padding, y);
    
    return startX;
  }
  
  /**
   * KPI Cards (4 tarjetas)
   */
  private drawKPICards(kpis: ProfileReportData['kpis']): void {
    const cardGap = 4;
    const cardWidth = (this.contentWidth - (cardGap * 3)) / 4;
    const cardHeight = 28;
    
    const cards = [
      {
        label: 'Días Abierto',
        value: kpis.dias_abierto,
        icon: '📅',
        showProgress: true,
        color: kpis.dias_abierto <= 15 ? 'success' : kpis.dias_abierto <= 30 ? 'warning' : 'error'
      },
      {
        label: 'Candidatos',
        value: kpis.candidatos,
        icon: '👥',
        color: 'primary'
      },
      {
        label: 'Preseleccionados',
        value: kpis.preseleccionados,
        icon: '✓',
        color: 'success'
      },
      {
        label: 'Entrevistas',
        value: kpis.entrevistas,
        icon: '🎯',
        color: 'info'
      }
    ];
    
    cards.forEach((card, index) => {
      const x = this.margin + (index * (cardWidth + cardGap));
      const y = this.yPos;
      
      // Fondo de la tarjeta
      this.pdf.setFillColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
      this.pdf.roundedRect(x, y, cardWidth, cardHeight, 2, 2, 'F');
      
      // Borde sutil
      this.pdf.setDrawColor(COLORS.gray200.r, COLORS.gray200.g, COLORS.gray200.b);
      this.pdf.setLineWidth(0.3);
      this.pdf.roundedRect(x, y, cardWidth, cardHeight, 2, 2, 'S');
      
      // Línea de color superior
      let accentColor = COLORS.primary;
      if (card.color === 'success') accentColor = COLORS.success;
      else if (card.color === 'warning') accentColor = COLORS.warning;
      else if (card.color === 'error') accentColor = COLORS.error;
      else if (card.color === 'info') accentColor = COLORS.info;
      
      this.pdf.setFillColor(accentColor.r, accentColor.g, accentColor.b);
      this.pdf.roundedRect(x, y, cardWidth, 2.5, 2, 2, 'F');
      this.pdf.setFillColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
      this.pdf.rect(x, y + 1.5, cardWidth, 1.5, 'F');
      
      // Valor grande
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.setFontSize(20);
      this.pdf.setTextColor(COLORS.gray900.r, COLORS.gray900.g, COLORS.gray900.b);
      this.pdf.text(String(card.value), x + cardWidth / 2, y + 14, { align: 'center' });
      
      // Label
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.setFontSize(7);
      this.pdf.setTextColor(COLORS.gray500.r, COLORS.gray500.g, COLORS.gray500.b);
      this.pdf.text(card.label, x + cardWidth / 2, y + 20, { align: 'center' });
      
      // Barra de progreso para días abiertos
      if (card.showProgress) {
        const progressY = y + 23;
        const progressWidth = cardWidth - 8;
        const progressHeight = 2;
        const progressX = x + 4;
        
        // Fondo de la barra
        this.pdf.setFillColor(COLORS.gray200.r, COLORS.gray200.g, COLORS.gray200.b);
        this.pdf.roundedRect(progressX, progressY, progressWidth, progressHeight, 1, 1, 'F');
        
        // Progreso (máximo 60 días = 100%)
        const progress = Math.min(kpis.dias_abierto / 60, 1);
        this.pdf.setFillColor(accentColor.r, accentColor.g, accentColor.b);
        this.pdf.roundedRect(progressX, progressY, progressWidth * progress, progressHeight, 1, 1, 'F');
      }
    });
    
    this.yPos += cardHeight + 6;
  }
  
  /**
   * Pipeline visual horizontal
   */
  private drawPipeline(kpis: ProfileReportData['kpis']): void {
    const pipelineHeight = 20;
    const y = this.yPos;
    
    // Fondo del pipeline
    this.pdf.setFillColor(COLORS.gray50.r, COLORS.gray50.g, COLORS.gray50.b);
    this.pdf.roundedRect(this.margin, y, this.contentWidth, pipelineHeight, 2, 2, 'F');
    
    // Borde
    this.pdf.setDrawColor(COLORS.gray200.r, COLORS.gray200.g, COLORS.gray200.b);
    this.pdf.setLineWidth(0.3);
    this.pdf.roundedRect(this.margin, y, this.contentWidth, pipelineHeight, 2, 2, 'S');
    
    const stages = [
      { label: 'Candidatos', value: kpis.candidatos, color: COLORS.primary },
      { label: 'Preselección', value: kpis.preseleccionados, color: COLORS.warning },
      { label: 'Entrevistas', value: kpis.entrevistas, color: COLORS.success },
    ];
    
    const stageWidth = this.contentWidth / stages.length;
    const circleRadius = 5;
    const lineY = y + pipelineHeight / 2;
    
    // Línea conectora
    this.pdf.setDrawColor(COLORS.gray300.r, COLORS.gray300.g, COLORS.gray300.b);
    this.pdf.setLineWidth(1.5);
    this.pdf.line(
      this.margin + stageWidth / 2 + circleRadius, 
      lineY, 
      this.margin + this.contentWidth - stageWidth / 2 - circleRadius, 
      lineY
    );
    
    // Etapas
    stages.forEach((stage, index) => {
      const centerX = this.margin + (stageWidth * index) + (stageWidth / 2);
      
      // Círculo
      this.pdf.setFillColor(stage.color.r, stage.color.g, stage.color.b);
      this.pdf.circle(centerX, lineY, circleRadius, 'F');
      
      // Número dentro del círculo
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.setFontSize(8);
      this.pdf.setTextColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
      this.pdf.text(String(stage.value), centerX, lineY + 1, { align: 'center' });
      
      // Label debajo
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.setFontSize(7);
      this.pdf.setTextColor(COLORS.gray600.r, COLORS.gray600.g, COLORS.gray600.b);
      this.pdf.text(stage.label, centerX, y + pipelineHeight - 2, { align: 'center' });
      
      // Flecha entre etapas (excepto última)
      if (index < stages.length - 1) {
        const arrowX = centerX + stageWidth / 2;
        this.pdf.setFillColor(COLORS.gray400.r, COLORS.gray400.g, COLORS.gray400.b);
        // Triángulo simple
        this.pdf.triangle(
          arrowX - 2, lineY - 2,
          arrowX + 2, lineY,
          arrowX - 2, lineY + 2,
          'F'
        );
      }
    });
    
    this.yPos += pipelineHeight + 6;
  }
  
  /**
   * Cards de información en dos columnas
   */
  private drawInfoCards(data: ProfileReportData): void {
    const cardGap = 4;
    const cardWidth = (this.contentWidth - cardGap) / 2;
    const cardHeight = 52;
    const y = this.yPos;
    
    // Card izquierda: Empresa
    this.drawInfoCard(
      this.margin,
      y,
      cardWidth,
      cardHeight,
      'Información de la Empresa',
      [
        { icon: '🏢', label: 'Empresa', value: data.empresa },
        { icon: '🏭', label: 'Industria', value: data.industria },
        { icon: '👤', label: 'Contacto', value: data.contacto },
        { icon: '✉️', label: 'Email', value: data.email },
      ]
    );
    
    // Card derecha: Detalles del puesto
    this.drawInfoCard(
      this.margin + cardWidth + cardGap,
      y,
      cardWidth,
      cardHeight,
      'Detalles del Puesto',
      [
        { icon: '📍', label: 'Ciudad', value: data.ciudad },
        { icon: '🏠', label: 'Modalidad', value: this.capitalizeFirst(data.modalidad) },
        { icon: '💰', label: 'Salario', value: data.salario },
        { icon: '👔', label: 'Supervisor', value: data.supervisor },
      ]
    );
    
    this.yPos += cardHeight + 6;
  }
  
  /**
   * Dibuja una card de información
   */
  private drawInfoCard(
    x: number,
    y: number,
    width: number,
    height: number,
    title: string,
    items: Array<{ icon: string; label: string; value: string }>
  ): void {
    // Fondo
    this.pdf.setFillColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
    this.pdf.roundedRect(x, y, width, height, 2, 2, 'F');
    
    // Borde
    this.pdf.setDrawColor(COLORS.gray200.r, COLORS.gray200.g, COLORS.gray200.b);
    this.pdf.setLineWidth(0.3);
    this.pdf.roundedRect(x, y, width, height, 2, 2, 'S');
    
    // Título
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(9);
    this.pdf.setTextColor(COLORS.gray900.r, COLORS.gray900.g, COLORS.gray900.b);
    this.pdf.text(title, x + 6, y + 8);
    
    // Línea separadora
    this.pdf.setDrawColor(COLORS.gray200.r, COLORS.gray200.g, COLORS.gray200.b);
    this.pdf.setLineWidth(0.2);
    this.pdf.line(x + 6, y + 11, x + width - 6, y + 11);
    
    // Items
    const itemHeight = 9;
    let itemY = y + 18;
    
    items.forEach((item) => {
      // Icono (usamos un círculo de color como placeholder)
      this.pdf.setFillColor(COLORS.gray100.r, COLORS.gray100.g, COLORS.gray100.b);
      this.pdf.circle(x + 9, itemY - 1.5, 2.5, 'F');
      
      // Label
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.setFontSize(7);
      this.pdf.setTextColor(COLORS.gray500.r, COLORS.gray500.g, COLORS.gray500.b);
      this.pdf.text(item.label + ':', x + 14, itemY);
      
      // Value (truncar si es muy largo)
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.setFontSize(8);
      this.pdf.setTextColor(COLORS.gray700.r, COLORS.gray700.g, COLORS.gray700.b);
      
      const maxWidth = width - 50;
      let displayValue = item.value;
      while (this.pdf.getTextWidth(displayValue) > maxWidth && displayValue.length > 3) {
        displayValue = displayValue.slice(0, -4) + '...';
      }
      this.pdf.text(displayValue, x + 35, itemY);
      
      itemY += itemHeight;
    });
  }
  
  /**
   * Card de resumen del rol y requisitos (dos columnas)
   */
  private drawResumenRolYRequisitos(
    resumen: string, 
    requisitos: string,
    technicalSkills: string[],
    softSkills: string[],
    languages: string[]
  ): void {
    const y = this.yPos;
    const availableHeight = this.pageHeight - y - 20; // Espacio hasta el footer
    const cardHeight = Math.min(availableHeight, 70);
    const columnGap = 6;
    const columnWidth = (this.contentWidth - columnGap) / 2;
    
    // ═══════════════════════════════════════════════════════════════
    // COLUMNA IZQUIERDA: Descripción del Puesto
    // ═══════════════════════════════════════════════════════════════
    
    // Fondo
    this.pdf.setFillColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
    this.pdf.roundedRect(this.margin, y, columnWidth, cardHeight, 2, 2, 'F');
    
    // Borde
    this.pdf.setDrawColor(COLORS.gray200.r, COLORS.gray200.g, COLORS.gray200.b);
    this.pdf.setLineWidth(0.3);
    this.pdf.roundedRect(this.margin, y, columnWidth, cardHeight, 2, 2, 'S');
    
    // Barra de color izquierda (azul)
    this.pdf.setFillColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
    this.pdf.roundedRect(this.margin, y, 3, cardHeight, 2, 2, 'F');
    this.pdf.setFillColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
    this.pdf.rect(this.margin + 2, y, 2, cardHeight, 'F');
    
    // Título
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(9);
    this.pdf.setTextColor(COLORS.gray900.r, COLORS.gray900.g, COLORS.gray900.b);
    this.pdf.text('Descripción del Puesto', this.margin + 8, y + 8);
    
    // Texto del resumen
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(7);
    this.pdf.setTextColor(COLORS.gray600.r, COLORS.gray600.g, COLORS.gray600.b);
    
    const textWidth = columnWidth - 14;
    const resumenLines = this.pdf.splitTextToSize(resumen || 'Sin descripción disponible', textWidth);
    const maxLines = Math.floor((cardHeight - 14) / 3.5);
    const displayResumenLines = resumenLines.slice(0, maxLines);
    
    if (resumenLines.length > maxLines && displayResumenLines.length > 0) {
      const lastLine = displayResumenLines[displayResumenLines.length - 1];
      displayResumenLines[displayResumenLines.length - 1] = lastLine.slice(0, -3) + '...';
    }
    
    this.pdf.text(displayResumenLines, this.margin + 8, y + 14);
    
    // ═══════════════════════════════════════════════════════════════
    // COLUMNA DERECHA: Requisitos (Habilidades + Requisitos Adicionales)
    // ═══════════════════════════════════════════════════════════════
    
    const rightColumnX = this.margin + columnWidth + columnGap;
    
    // Fondo
    this.pdf.setFillColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
    this.pdf.roundedRect(rightColumnX, y, columnWidth, cardHeight, 2, 2, 'F');
    
    // Borde
    this.pdf.setDrawColor(COLORS.gray200.r, COLORS.gray200.g, COLORS.gray200.b);
    this.pdf.setLineWidth(0.3);
    this.pdf.roundedRect(rightColumnX, y, columnWidth, cardHeight, 2, 2, 'S');
    
    // Barra de color izquierda (verde)
    this.pdf.setFillColor(COLORS.success.r, COLORS.success.g, COLORS.success.b);
    this.pdf.roundedRect(rightColumnX, y, 3, cardHeight, 2, 2, 'F');
    this.pdf.setFillColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
    this.pdf.rect(rightColumnX + 2, y, 2, cardHeight, 'F');
    
    // Título
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(9);
    this.pdf.setTextColor(COLORS.gray900.r, COLORS.gray900.g, COLORS.gray900.b);
    this.pdf.text('Requisitos', rightColumnX + 8, y + 8);
    
    // Construir texto de requisitos completo
    const requisitosPartes: string[] = [];
    
    // LOG: Verificar datos que llegan a la función de renderizado
    console.log('📊 [PDF Profile] Renderizando requisitos:', {
      technicalSkills,
      softSkills,
      languages,
      requisitos,
    });
    
    // Habilidades Técnicas
    if (technicalSkills && technicalSkills.length > 0) {
      const skillsText = technicalSkills.join(', ');
      console.log('🔧 Technical skills concatenadas:', skillsText);
      requisitosPartes.push('• Técnicas: ' + skillsText);
    }
    
    // Habilidades Blandas
    if (softSkills && softSkills.length > 0) {
      const skillsText = softSkills.join(', ');
      console.log('💼 Soft skills concatenadas:', skillsText);
      requisitosPartes.push('• Competencias: ' + skillsText);
    }
    
    // Idiomas
    if (languages && languages.length > 0) {
      const languagesText = languages.join(', ');
      console.log('🌐 Languages concatenados:', languagesText);
      requisitosPartes.push('• Idiomas: ' + languagesText);
    }
    
    // Requisitos Adicionales
    if (requisitos && requisitos.trim()) {
      console.log('📝 Requisitos adicionales:', requisitos);
      requisitosPartes.push('• Otros: ' + requisitos);
    }
    
    const requisitosText = requisitosPartes.length > 0 
      ? requisitosPartes.join('\n') 
      : 'Sin requisitos especificados';
    
    console.log('📄 Texto final de requisitos:', requisitosText);
    
    // Texto de requisitos
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(7);
    this.pdf.setTextColor(COLORS.gray600.r, COLORS.gray600.g, COLORS.gray600.b);
    
    const requisitosLines = this.pdf.splitTextToSize(requisitosText, textWidth);
    const displayRequisitosLines = requisitosLines.slice(0, maxLines);
    
    if (requisitosLines.length > maxLines && displayRequisitosLines.length > 0) {
      const lastLine = displayRequisitosLines[displayRequisitosLines.length - 1];
      displayRequisitosLines[displayRequisitosLines.length - 1] = lastLine.slice(0, -3) + '...';
    }
    
    this.pdf.text(displayRequisitosLines, rightColumnX + 8, y + 14);
    
    this.yPos += cardHeight + 4;
  }
  
  /**
   * Footer
   */
  private drawFooter(): void {
    const footerY = this.pageHeight - 10;
    
    // Línea superior
    this.pdf.setDrawColor(COLORS.gray300.r, COLORS.gray300.g, COLORS.gray300.b);
    this.pdf.setLineWidth(0.3);
    this.pdf.line(this.margin, footerY - 4, this.pageWidth - this.margin, footerY - 4);
    
    // Texto izquierdo (confidencial)
    this.pdf.setFont('helvetica', 'italic');
    this.pdf.setFontSize(7);
    this.pdf.setTextColor(COLORS.gray400.r, COLORS.gray400.g, COLORS.gray400.b);
    this.pdf.text('Documento confidencial', this.margin, footerY);
    
    // Logo pequeño centro
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(7);
    this.pdf.setTextColor(COLORS.gray500.r, COLORS.gray500.g, COLORS.gray500.b);
    this.pdf.text('BAUSEN', this.pageWidth / 2, footerY, { align: 'center' });
    
    // Número de página derecha
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(7);
    this.pdf.setTextColor(COLORS.gray400.r, COLORS.gray400.g, COLORS.gray400.b);
    this.pdf.text('Página 1 de 1', this.pageWidth - this.margin, footerY, { align: 'right' });
  }
  
  /**
   * Capitaliza primera letra
   */
  private capitalizeFirst(text: string): string {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  }
  
  /**
   * Guarda el PDF
   */
  save(filename: string = 'reporte-perfil.pdf'): void {
    this.pdf.save(filename);
  }
  
  /**
   * Retorna el blob del PDF
   */
  getBlob(): Blob {
    return this.pdf.output('blob');
  }
  
  /**
   * Retorna el PDF como base64
   */
  getBase64(): string {
    return this.pdf.output('datauristring');
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// FUNCIÓN DE CONVENIENCIA
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Genera y descarga un reporte de perfil en PDF
 */
export function generateProfileReport(data: ProfileReportData, filename?: string): void {
  const report = new ProfileReportPDF();
  report.generate(data);
  report.save(filename || `reporte-${data.puesto.toLowerCase().replace(/\s+/g, '-')}.pdf`);
}

/**
 * Genera un reporte de perfil y retorna el Blob
 */
export function generateProfileReportBlob(data: ProfileReportData): Blob {
  const report = new ProfileReportPDF();
  report.generate(data);
  return report.getBlob();
}

// ═══════════════════════════════════════════════════════════════════════════
// DATOS DE EJEMPLO (para testing)
// ═══════════════════════════════════════════════════════════════════════════
export const EXAMPLE_PROFILE_DATA: ProfileReportData = {
  titulo: 'REPORTE DE PERFIL',
  puesto: 'Gerente de Producto',
  fecha: '20 de enero de 2026',
  kpis: {
    dias_abierto: 55,
    candidatos: 6,
    preseleccionados: 0,
    entrevistas: 0,
  },
  estado: 'Aprobado',
  prioridad: 'high',
  servicio: 'normal',
  supervisor: 'Director Bechapra',
  empresa: 'Papas San Rafael',
  industria: 'Venta de Alimentos',
  contacto: 'Contacto Papas',
  email: 'gerente@papassanrafael.com',
  ciudad: 'Morelia, Michoacán',
  modalidad: 'presencial',
  salario: '$54,000.00 - $54,000.00 MXN/mensual',
  resumen_rol: 'Estamos buscando a alguien creativo y estratégico que nos ayude a diseñar e impulsar nuevos productos financieros, mejorar los que ya tenemos y adaptarlos a lo que realmente necesitan nuestros clientes. Queremos a una persona que entienda el mercado, sepa analizar datos, proponga soluciones viables y rentables, y que trabaje con metodologías modernas como CANVAS. Además, es clave que sepa alinear todo con las regulaciones (como CNBV) y que pueda liderar estudios de mercado que guíen nuestras decisiones.',
};
