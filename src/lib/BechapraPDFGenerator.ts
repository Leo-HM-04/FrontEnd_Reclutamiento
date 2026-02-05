/**
 * Bechapra PDF Generator - Servicio de Generación de Reportes PDF
 * 
 * Este servicio genera PDFs profesionales desde el frontend usando jsPDF
 * Incluye soporte para todos los módulos de Bechapra con diseño visual atractivo
 * 
 * @version 1.0.0
 * @license Proprietary
 */

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { BECHAPRA_WATERMARK_B_BASE64 } from './watermarkBase64'
// TODO: Restaurar cuando exista el archivo de tipos
/*
import { 
  ReporteData, 
  Modulo1Data, 
  Modulo3Data, 
  Modulo6Data,
  Modulo04Data,
  Modulo05Data,
  Modulo07Data,
  Modulo08Data,
  Modulo11Data
} from '@/app/reportes/ver/components/types'
*/

// Tipos temporales mientras no exista el archivo de tipos
type ReporteData = any;
type Modulo1Data = any;
type Modulo3Data = any;
type Modulo6Data = any;
type Modulo04Data = any;
type Modulo05Data = any;
type Modulo07Data = any;
type Modulo08Data = any;
type Modulo11Data = any;

import { BAUSEN_LOGO_BASE64 } from './logo-base64'
// TODO: Verificar si estos logos existen
// import { BAUSEN_LOGO_WHITE_BASE64 } from './logoWhiteBase64'
// import { formatCurrency, formatNumber, formatDate } from '../utils/formatters'

// Funciones de formato temporales
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value || 0);
};
const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('es-MX').format(value || 0);
};
const formatDate = (date: string | Date): string => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('es-MX');
};

// ============================================
// TIPOS E INTERFACES
// ============================================

export interface PDFConfig {
  nombreReporte: string
  fechaGeneracion?: Date
  nombreEmpresa?: string
  rfc?: string
  periodo?: string
  reportId?: string
  incluirPortada?: boolean
  incluirIndice?: boolean
  incluirMarcaAgua?: boolean
  colorPrimario?: string
  colorSecundario?: string
}

export interface ModuloPDFSection {
  moduloKey: string
  titulo: string
  descripcion?: string
  data: any
}

interface PDFTheme {
  primary: string
  secondary: string
  accent: string
  success: string
  warning: string
  danger: string
  text: string
  textMuted: string
  background: string
  border: string
}

// ============================================
// CLASE PRINCIPAL: BechapraPDFGenerator
// ============================================

export class BechapraPDFGenerator {
  private doc: jsPDF
  private config: PDFConfig
  private currentPage: number = 1
  private totalPages: number = 0
  private yPosition: number = 0
  private pageHeight: number
  private pageWidth: number
  private margin: number = 20
  private contentWidth: number
  private theme: PDFTheme

  // Colores Bechapra
  private static readonly COLORS = {
    primary: '#0033A0',      // Azul Bechapra
    secondary: '#2563EB',    // Azul Secundario Bechapra
    accent: '#06b6d4',       // Cyan
    success: '#10b981',      // Emerald
    warning: '#f59e0b',      // Amber
    danger: '#ef4444',       // Red
    text: '#1f2937',         // Gray 800
    textMuted: '#6b7280',    // Gray 500
    background: '#f8fafc',   // Slate 50
    border: '#e5e7eb',       // Gray 200
    gradientStart: '#667eea',
    gradientEnd: '#764ba2'
  }

  private aplicarMarcaAgua(): void {
  if (!this.config.incluirMarcaAgua) return

  const anyDoc = this.doc as any
  const imgData = BECHAPRA_WATERMARK_B_BASE64

  try {
    // Props para mantener aspect ratio
    const props = anyDoc.getImageProperties(imgData)
    const ratio = props.width / props.height

    // Tamaño grande tipo “B” de fondo (ajustable)
    const wmW = this.pageWidth * 0.85
    const wmH = wmW / ratio

    // Posición: abajo-izquierda, ligeramente “fuera” para look pro (ajustable)
    const x = -18
    const y = this.pageHeight - wmH + 12

    // Opacidad (si tu build de jsPDF soporta GState)
    const hasGState = typeof anyDoc.GState === 'function' && typeof anyDoc.setGState === 'function'
    if (typeof anyDoc.saveGraphicsState === 'function') anyDoc.saveGraphicsState()
    if (hasGState) anyDoc.setGState(new anyDoc.GState({ opacity: 0.08 }))

    // Dibuja watermark ANTES del contenido de la página
    anyDoc.addImage(imgData, 'PNG', x, y, wmW, wmH, 'WM_BECHAPRA_B', 'FAST')

    // Restore estado gráfico
    if (hasGState) anyDoc.setGState(new anyDoc.GState({ opacity: 1 }))
    if (typeof anyDoc.restoreGraphicsState === 'function') anyDoc.restoreGraphicsState()
  } catch (e) {
    // Si falla, no rompas el PDF
    // (Opcional) console.warn('Marca de agua no pudo renderizarse', e)
  }
}


  constructor(config: PDFConfig) {
    this.config = {
      incluirPortada: true,
      incluirIndice: true,
      incluirMarcaAgua: false,
      colorPrimario: BechapraPDFGenerator.COLORS.primary,
      colorSecundario: BechapraPDFGenerator.COLORS.secondary,
      ...config
    }

    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter'
    })

    this.pageHeight = this.doc.internal.pageSize.getHeight()
    this.pageWidth = this.doc.internal.pageSize.getWidth()
    this.contentWidth = this.pageWidth - (this.margin * 2)
    this.yPosition = this.margin

    this.theme = {
      primary: this.config.colorPrimario!,
      secondary: this.config.colorSecundario!,
      accent: BechapraPDFGenerator.COLORS.accent,
      success: BechapraPDFGenerator.COLORS.success,
      warning: BechapraPDFGenerator.COLORS.warning,
      danger: BechapraPDFGenerator.COLORS.danger,
      text: BechapraPDFGenerator.COLORS.text,
      textMuted: BechapraPDFGenerator.COLORS.textMuted,
      background: BechapraPDFGenerator.COLORS.background,
      border: BechapraPDFGenerator.COLORS.border
    }
  }

  // ============================================
  // MÉTODO PRINCIPAL: Generar Reporte Completo
  // ============================================

  public async generarReporteCompleto(reporteData: ReporteData): Promise<Blob> {
  try {
    // ✅ Si NO hay portada, esta primera página debe traer watermark
    if (this.config.incluirMarcaAgua && !this.config.incluirPortada) {
      this.aplicarMarcaAgua()
    }

    // Portada
    if (this.config.incluirPortada) {
      this.generarPortada(reporteData)
      this.addNewPage()
    }

      // Índice
      if (this.config.incluirIndice) {
        this.generarIndice(reporteData)
        this.addNewPage()
      }

      // Resumen Ejecutivo
      this.generarResumenEjecutivo(reporteData)

      // Módulos disponibles
      const modulos = this.getModulosDisponibles(reporteData)
      if (modulos.length > 0) this.addNewPage()

      for (let i = 0; i < modulos.length; i++) {
        const modulo = modulos[i]
        await this.generarSeccionModulo(modulo, reporteData)
        if (i < modulos.length - 1) this.addNewPage()
      }

      // Pie de página en todas las páginas
      this.agregarNumeracionPaginas()

      // Generar blob
      return this.doc.output('blob')
    } catch (error) {
      console.error('Error al generar PDF:', error)
      throw error
    }
  }

  // ============================================
  // PORTADA
  // ============================================

  private generarPortada(reporteData?: ReporteData): void {
    const centerX = this.pageWidth / 2

    // Fondo con gradiente (simulado con franjas)
    const start = this.hexToRgb(this.theme.primary)     // #0033A0
    const end = this.hexToRgb(this.theme.secondary)     // #2563EB
    this.drawVerticalGradient(0, 0, this.pageWidth, this.pageHeight, [start.r, start.g, start.b], [end.r, end.g, end.b], 90)

    // Card para el logo (blanca)
    const logoCardW = 95
    const logoCardH = 48
    const logoCardX = centerX - (logoCardW / 2)
    const logoCardY = 30

    // Sombra suave (simulada, sin transparencia para evitar dependencias)

    // Logo (Bausen) respetando aspect ratio y reutilizando alias para no re-embed
    try {
      const imgData = BAUSEN_LOGO_BASE64
      const props = (this.doc as any).getImageProperties(imgData)
      const pad = 1
      const maxW = logoCardW - (pad * 0.2)
      const maxH = logoCardH - (pad * 0.2)

      const ratio = props.width / props.height
      let w = maxW
      let h = w / ratio
      if (h > maxH) {
        h = maxH
        w = h * ratio
      }

      const x = logoCardX + (logoCardW - w) / 2
      const y = logoCardY + (logoCardH - h) / 2

      this.doc.addImage(imgData, 'PNG', x, y, w, h, 'BAUSEN_LOGO', 'FAST')
    } catch (e) {
      // Fallback
      this.doc.setTextColor(255, 255, 255)
      this.doc.setFontSize(18)
      this.doc.setFont('helvetica', 'bold')
      this.doc.text('Bausen', centerX, logoCardY + 28, { align: 'center' })
    }

    // Tagline
    this.doc.setTextColor(255, 255, 255)
    this.doc.setFontSize(13)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text('Sistema de Análisis Contable con IA', centerX, logoCardY + logoCardH + 18, { align: 'center' })

    // Título del reporte
    this.doc.setFont('helvetica', 'bold')
    this.doc.setFontSize(34)
    this.doc.text('REPORTE CONTABLE', centerX, this.pageHeight / 2 - 10, { align: 'center' })

    this.doc.setFont('helvetica', 'normal')
    this.doc.setFontSize(24)
    this.doc.text('INTEGRAL', centerX, this.pageHeight / 2 + 12, { align: 'center' })

    // Card inferior con metadatos
    const metaW = this.contentWidth
    const metaH = 42
    const metaX = this.margin
    const metaY = this.pageHeight - this.margin - metaH

    this.doc.setFillColor(255, 255, 255)
    this.doc.roundedRect(metaX, metaY, metaW, metaH, 5, 5, 'F')
    this.doc.setDrawColor(229, 231, 235)
    this.doc.setLineWidth(0.6)
    this.doc.roundedRect(metaX, metaY, metaW, metaH, 5, 5, 'S')

    const leftX = metaX + 8
    const rightX = metaX + metaW / 2 + 2
    let y = metaY + 12

    this.doc.setFontSize(9)
    this.doc.setFont('helvetica', 'bold')
    this.doc.setTextColor(31, 41, 55)

    if (this.config.nombreEmpresa) {
      this.doc.text('Empresa:', leftX, y)
      this.doc.setFont('helvetica', 'normal')
      this.doc.text(this.fitText(this.config.nombreEmpresa, metaW / 2 - 25), leftX + 18, y)
      this.doc.setFont('helvetica', 'bold')
    }

    if (this.config.rfc) {
      this.doc.text('RFC:', rightX, y)
      this.doc.setFont('helvetica', 'normal')
      this.doc.text(this.fitText(this.config.rfc, metaW / 2 - 18), rightX + 10, y)
      this.doc.setFont('helvetica', 'bold')
    }

    y += 10

    if (this.config.periodo) {
      this.doc.text('Período:', leftX, y)
      this.doc.setFont('helvetica', 'normal')
      this.doc.text(this.fitText(this.config.periodo, metaW / 2 - 25), leftX + 18, y)
      this.doc.setFont('helvetica', 'bold')
    }

    // Fecha e ID
    const fecha = this.config.fechaGeneracion || new Date()
    const fechaStr = fecha.toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    this.doc.text('Generado:', rightX, y)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text(this.fitText(fechaStr, metaW / 2 - 26), rightX + 18, y)

    y += 10

    const reportId = this.config.reportId || (reporteData as any)?.id || (reporteData as any)?.report_id
    if (reportId) {
      this.doc.setFont('helvetica', 'bold')
      this.doc.text('ID:', leftX, y)
      this.doc.setFont('helvetica', 'normal')
      this.doc.text(this.fitText(String(reportId), metaW - 25), leftX + 8, y)
    }

    // Versión
    this.doc.setFontSize(8)
    this.doc.setTextColor(107, 114, 128)
    this.doc.text('Bausen v1.0 • Powered by AI', centerX, this.pageHeight - 12, { align: 'center' })
  }

  // ============================================
  // ÍNDICE
  // ============================================

  private generarIndice(reporteData: ReporteData): void {
    this.agregarEncabezadoSeccion('ÍNDICE', 'Contenido del Reporte')

    const modulos = this.getModulosDisponibles(reporteData)
    
    this.yPosition += 10
    let pageNum = 3 // Después de portada e índice

    // Estilo para el índice
    this.doc.setFontSize(12)
    
    // Resumen Ejecutivo
    this.agregarEntradaIndice('1. Resumen Ejecutivo', pageNum)
    pageNum++

    // Módulos
    modulos.forEach((modulo, index) => {
      this.agregarEntradaIndice(`${index + 2}. ${modulo.titulo}`, pageNum)
      pageNum++
    })
  }

  private agregarEntradaIndice(texto: string, pagina: number): void {
    const puntosWidth = this.contentWidth - 20
    
    this.doc.setFont('helvetica', 'normal')
    this.doc.setTextColor(31, 41, 55)
    this.doc.text(texto, this.margin, this.yPosition)
    
    // Línea de puntos
    const textWidth = this.doc.getTextWidth(texto)
    let dotsX = this.margin + textWidth + 5
    this.doc.setTextColor(200, 200, 200)
    while (dotsX < this.margin + puntosWidth) {
      this.doc.text('.', dotsX, this.yPosition)
      dotsX += 2
    }
    
    // Número de página
    this.doc.setTextColor(102, 126, 234)
    this.doc.text(pagina.toString(), this.margin + this.contentWidth, this.yPosition, { align: 'right' })
    
    this.yPosition += 8
  }

  // ============================================
  // RESUMEN EJECUTIVO
  // ============================================

  private generarResumenEjecutivo(reporteData: ReporteData): void {
    this.agregarEncabezadoSeccion('RESUMEN EJECUTIVO', 'Visión general del análisis')

    this.agregarParrafo(
      'Este reporte contable integral consolida los resultados de los módulos procesados. ' +
      'Incluye indicadores clave, alertas y tablas de detalle para facilitar la revisión y la toma de decisiones.'
    )

    // Módulos procesados
    this.yPosition += 6
    this.agregarSubtitulo('Módulos Analizados')

    const modulos = this.getModulosDisponibles(reporteData)
    if (modulos.length === 0) {
      this.agregarMensajeVacio('No hay módulos con información para mostrar')
      return
    }

    modulos.forEach((modulo: any) => {
      this.agregarCheckItem(modulo.titulo, modulo.descripcion || '')
    })

    {/*
    // KPIs principales
    this.yPosition += 8
    this.agregarSubtitulo('Indicadores Clave')

    const kpis = this.calcularKPIsPrincipales(reporteData)
    if (kpis.length > 0) {
      this.generarGridKPIs(kpis)
    } else {
      this.agregarMensajeVacio('No se pudieron calcular indicadores para este reporte')
    }
    */}
  }

  private calcularKPIsPrincipales(reporteData: ReporteData): Array<{titulo: string, valor: string, icono: string, color: string}> {
    const kpis: Array<{titulo: string, valor: string, icono: string, color: string}> = []

    // Módulo 1: Estados de Cuenta
    if (reporteData.modulo1?.success) {
      const totalDepositos = this.calcularTotalDepositos(reporteData.modulo1)
      const totalRetiros = this.calcularTotalRetiros(reporteData.modulo1)
      kpis.push({
        titulo: 'Total Depósitos',
        valor: formatCurrency(totalDepositos),
        icono: '💰',
        color: this.theme.success
      })
      kpis.push({
        titulo: 'Total Retiros',
        valor: formatCurrency(totalRetiros),
        icono: '💸',
        color: this.theme.danger
      })
    }

    // Módulo 3: Facturas XML
    if (reporteData.modulo3?.success) {
      kpis.push({
        titulo: 'Facturas Emitidas',
        valor: formatCurrency(reporteData.modulo3.resumen?.monto_emitidas || 0),
        icono: '📤',
        color: this.theme.primary
      })
      kpis.push({
        titulo: 'Facturas Recibidas',
        valor: formatCurrency(reporteData.modulo3.resumen?.monto_recibidas || 0),
        icono: '📥',
        color: this.theme.secondary
      })
    }

    // Módulo 6: Nómina
    if (reporteData.modulo6?.success) {
      const totalNomina = reporteData.modulo6.resumen?.total_neto || 0
      kpis.push({
        titulo: 'Total Nómina',
        valor: formatCurrency(totalNomina),
        icono: '👥',
        color: this.theme.accent
      })
    }

    return kpis
  }

  // ============================================
  // GENERADORES DE MÓDULOS
  // ============================================

  private async generarSeccionModulo(modulo: ModuloPDFSection, reporteData: ReporteData): Promise<void> {
    this.agregarEncabezadoModulo(modulo.titulo.toUpperCase(), modulo.descripcion || '')

    switch (modulo.moduloKey) {
      case 'modulo1':
        this.generarModulo01(reporteData.modulo1!)
        break
      case 'modulo3':
        this.generarModulo03(reporteData.modulo3!)
        break
      case 'modulo4':
        this.generarModulo04(reporteData.modulo4!)
        break
      case 'modulo5':
        this.generarModulo05(reporteData.modulo5!)
        break
      case 'modulo6':
        this.generarModulo06(reporteData.modulo6!)
        break
      case 'modulo7':
        this.generarModulo07(reporteData.modulo7!)
        break
      case 'modulo8':
        this.generarModulo08(reporteData.modulo8!)
        break
      case 'modulo11':
        this.generarModulo11(reporteData.modulo11!)
        break
      default:
        this.doc.text(`Módulo ${modulo.moduloKey} no implementado`, this.margin, this.yPosition)
    }
  }

  // ============================================
  // MÓDULO 01: Estados de Cuenta
  // ============================================

  private generarModulo01(data: Modulo1Data): void {
    if (!data.resultados || data.resultados.length === 0) {
      this.agregarMensajeVacio('No hay datos de estados de cuenta')
      return
    }

    // KPIs del módulo
    const totalDepositos = this.calcularTotalDepositos(data)
    const totalRetiros = this.calcularTotalRetiros(data)
    const flujoNeto = totalDepositos - totalRetiros

    this.generarGridKPIs([
      { titulo: 'Total Depósitos', valor: formatCurrency(totalDepositos), icono: '⬆️', color: this.theme.success },
      { titulo: 'Total Retiros', valor: formatCurrency(totalRetiros), icono: '⬇️', color: this.theme.danger },
      { titulo: 'Flujo Neto', valor: formatCurrency(flujoNeto), icono: '📊', color: flujoNeto >= 0 ? this.theme.success : this.theme.danger }
    ])

    // Tabla de resumen por archivo
    this.yPosition += 15
    this.agregarSubtitulo('Resumen por Estado de Cuenta')

    const tableData = data.resultados.map((archivo: any) => [
      archivo.filename || 'Sin nombre',
      archivo.datos?.banco || 'N/A',
      archivo.datos?.numero_cuenta || 'N/A',
      archivo.datos?.periodo || 'N/A',
      formatCurrency(parseFloat(archivo.datos?.total_depositos || '0')),
      formatCurrency(parseFloat(archivo.datos?.total_retiros || '0')),
      formatCurrency(parseFloat(archivo.datos?.saldo_final || '0'))
    ])

    autoTable(this.doc, {
      startY: this.yPosition,
      head: [['Archivo', 'Banco', 'Cuenta', 'Período', 'Depósitos', 'Retiros', 'Saldo Final']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [102, 126, 234],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      styles: {
        fontSize: 8,
        cellPadding: 3
      },
      columnStyles: {
        0: { cellWidth: 35 },
        4: { halign: 'right' },
        5: { halign: 'right' },
        6: { halign: 'right' }
      }
    })

    this.yPosition = (this.doc as any).lastAutoTable.finalY + 10

    // Botón placeholder para archivos originales
    this.agregarBotonArchivo('📂 Ver Estados de Cuenta Originales', 'modulo1_archivos')
  }

  // ============================================
  // MÓDULO 03: Facturas XML
  // ============================================

  private generarModulo03(data: Modulo3Data): void {
    if (!data.resumen) {
      this.agregarMensajeVacio('No hay datos de facturas XML')
      return
    }

    const resumen = data.resumen

    // KPIs
    this.generarGridKPIs([
      { titulo: 'Emitidas', valor: `${resumen.total_emitidas} facturas`, icono: '📤', color: this.theme.primary },
      { titulo: 'Recibidas', valor: `${resumen.total_recibidas} facturas`, icono: '📥', color: this.theme.secondary },
      { titulo: 'Monto Emitidas', valor: formatCurrency(resumen.monto_emitidas), icono: '💵', color: this.theme.success },
      { titulo: 'Monto Recibidas', valor: formatCurrency(resumen.monto_recibidas), icono: '💳', color: this.theme.warning },
      { titulo: 'Balance', valor: formatCurrency(resumen.balance), icono: '📊', color: resumen.balance >= 0 ? this.theme.success : this.theme.danger },
      { titulo: 'Match', valor: `${resumen.porcentaje_match?.toFixed(1) || 0}%`, icono: '✅', color: this.theme.accent }
    ])

    // Tabla de facturas emitidas (muestra las primeras 10)
    this.yPosition += 15
    this.agregarSubtitulo('Facturas Emitidas (Principales)')
    
    if (data.emitidas && data.emitidas.length > 0) {
      const facturasEmitidas = data.emitidas.slice(0, 10).map((f: any) => [
        f.uuid?.slice(0, 8) || 'N/A',
        f.fecha || 'N/A',
        f.nombre?.slice(0, 25) || 'N/A',
        formatCurrency(f.total || 0),
        f.razon_social || 'N/A'
      ])

      autoTable(this.doc, {
        startY: this.yPosition,
        head: [['UUID', 'Fecha', 'Receptor', 'Total', 'Uso CFDI']],
        body: facturasEmitidas,
        theme: 'striped',
        headStyles: { fillColor: [102, 126, 234], textColor: 255 },
        styles: { fontSize: 8 }
      })

      this.yPosition = (this.doc as any).lastAutoTable.finalY + 10
    }

    // Botón placeholder
    this.agregarBotonArchivo('📂 Ver XMLs Originales', 'modulo3_archivos')
  }

  // ============================================
  // MÓDULO 04: SUA
  // ============================================

  private generarModulo04(data: Modulo04Data): void {
    if (!data || !data.success) {
      this.agregarMensajeVacio('No hay datos de SUA')
      return
    }

    const resumen = data.resumen || {}
    const comprobante = data.comprobante || {}

    this.generarGridKPIs([
      { titulo: 'Total Trabajadores', valor: formatNumber(resumen.num_cotizantes || 0), icono: '👥', color: this.theme.primary },
      { titulo: 'Total Cuotas', valor: formatCurrency(resumen.total_pagar || 0), icono: '💰', color: this.theme.success },
      { titulo: 'Cuota IMSS', valor: formatCurrency(comprobante.importe_imss || 0), icono: '🏥', color: this.theme.secondary },
      { titulo: 'Cuota Infonavit', valor: formatCurrency(resumen.infonavit || 0), icono: '🏠', color: this.theme.accent }
    ])

    this.agregarBotonArchivo('📂 Ver Archivos SUA', 'modulo4_archivos')
  }

  // ============================================
  // MÓDULO 05: ISN (Impuesto Sobre Nómina)
  // ============================================

  private generarModulo05(data: Modulo05Data): void {
    if (!data || !data.success) {
      this.agregarMensajeVacio('No hay datos de ISN')
      return
    }

    const kpis = data.dashboard?.kpis
    const desglose = data.dashboard?.desglose

    this.generarGridKPIs([
      { titulo: 'Base Gravable', valor: formatCurrency(kpis?.base_gravable || 0), icono: '📊', color: this.theme.primary },
      { titulo: 'ISN del Mes', valor: formatCurrency(kpis?.isn_mes || 0), icono: '💵', color: this.theme.success },
      { titulo: 'Empleados', valor: formatNumber(kpis?.num_empleados || 0), icono: '👥', color: this.theme.secondary },
      { titulo: 'Total a Pagar', valor: formatCurrency(desglose?.total || 0), icono: '💰', color: this.theme.warning }
    ])

    // Desglose del ISN
    if (desglose) {
      this.yPosition += 10
      this.agregarSubtitulo('Desglose del Impuesto')
      
      const desgloseData = [
        ['ISN (3%)', formatCurrency(desglose.isn_3 || 0)],
        ['Educación (1.5%)', formatCurrency(desglose.educacion_15 || 0)],
        ['Redondeo', formatCurrency(desglose.redondeo || 0)],
        ['Total', formatCurrency(desglose.total || 0)]
      ]

      autoTable(this.doc, {
        startY: this.yPosition,
        head: [['Concepto', 'Monto']],
        body: desgloseData,
        theme: 'striped',
        headStyles: { fillColor: [102, 126, 234], textColor: 255 },
        styles: { fontSize: 9 },
        columnStyles: {
          1: { halign: 'right' }
        }
      })

      this.yPosition = (this.doc as any).lastAutoTable.finalY + 10
    }

    // Estado de cumplimiento
    const cumplimiento = data.dashboard?.cumplimiento
    if (cumplimiento) {
      this.agregarSubtitulo('Estado de Cumplimiento')
      this.doc.setFontSize(10)
      this.doc.setTextColor(31, 41, 55)
      this.doc.text(`Estado: ${cumplimiento.estado_pago || 'N/A'}`, this.margin, this.yPosition)
      this.yPosition += 6
      this.doc.text(`Fecha de Pago: ${cumplimiento.fecha_pago || 'N/A'}`, this.margin, this.yPosition)
      this.yPosition += 10
    }

    this.agregarBotonArchivo('📂 Ver Documentos ISN', 'modulo5_archivos')
  }

  // ============================================
  // MÓDULO 06: Nómina
  // ============================================

  private generarModulo06(data: Modulo6Data): void {
    if (!data || !data.success) {
      this.agregarMensajeVacio('No hay datos de nómina')
      return
    }

    // Obtener datos de resumen - priorizar resumen_global, luego resumen
    const resumenGlobal = data.resumen_global
    const resumenSimple = data.resumen

    // Calcular num_empleados desde diferentes fuentes
    const numEmpleados = resumenSimple?.num_empleados || data.empleados?.length || 0
    const totalPercepciones = resumenGlobal?.total_percepciones || resumenSimple?.total_percepciones || 0
    const totalDeducciones = resumenGlobal?.total_deducciones || resumenSimple?.total_deducciones || 0
    const totalNeto = resumenGlobal?.total_neto || resumenSimple?.total_neto || 0

    this.generarGridKPIs([
      { titulo: 'Total Empleados', valor: formatNumber(numEmpleados), icono: '👥', color: this.theme.primary },
      { titulo: 'Total Percepciones', valor: formatCurrency(totalPercepciones), icono: '💵', color: this.theme.success },
      { titulo: 'Total Deducciones', valor: formatCurrency(totalDeducciones), icono: '💳', color: this.theme.danger },
      { titulo: 'Total Neto', valor: formatCurrency(totalNeto), icono: '📊', color: this.theme.accent }
    ])

    // Tabla de empleados (si hay)
    if (data.empleados && data.empleados.length > 0) {
      this.yPosition += 15
      this.agregarSubtitulo('Resumen por Empleado')

      const empleadosData = data.empleados.slice(0, 15).map((emp: any) => [
        emp.numero || 'N/A',
        emp.nombre?.slice(0, 30) || 'N/A',
        emp.departamento || 'N/A',
        formatCurrency(emp.total_percepciones || 0),
        formatCurrency(emp.total_deducciones || 0),
        formatCurrency(emp.neto || 0)
      ])

      autoTable(this.doc, {
        startY: this.yPosition,
        head: [['No. Emp', 'Nombre', 'Depto', 'Percepciones', 'Deducciones', 'Neto']],
        body: empleadosData,
        theme: 'striped',
        headStyles: { fillColor: [102, 126, 234], textColor: 255 },
        styles: { fontSize: 8 },
        columnStyles: {
          3: { halign: 'right' },
          4: { halign: 'right' },
          5: { halign: 'right' }
        }
      })

      this.yPosition = (this.doc as any).lastAutoTable.finalY + 10
    }

    this.agregarBotonArchivo('📂 Ver Recibos de Nómina', 'modulo6_archivos')
  }

  // ============================================
  // MÓDULO 07: FONACOT - VERSIÓN COMPLETA CON ESTILO BECHAPRA
  // ============================================

  private generarModulo07(data: Modulo07Data): void {
    if (!data || !data.success) {
      this.agregarMensajeVacio('No hay datos de FONACOT')
      return
    }

    const { trabajadores, resumen, dashboard, conciliacion, pago, alertas } = data

    // COLORES BECHAPRA (RGB para jsPDF)
    const BECHAPRA_COLORS = {
      primary: [0, 51, 160],      // #0033A0
      purple: [124, 58, 237],     // #7C3AED
      blue: [37, 99, 235],        // #2563EB
      green: [16, 185, 129],      // #10B981
      cyan: [6, 182, 212],        // #06B6D4
      yellow: [234, 179, 8],      // #EAB308
      red: [239, 68, 68],         // #EF4444
      gray: [107, 114, 128]       // #6B7280
    }

    // ============================================
    // ALERTAS (si existen)
    // ============================================
    if (alertas && alertas.length > 0) {
      alertas.forEach((alerta: any) => {
        const colorRGB = alerta.tipo === 'error' ? BECHAPRA_COLORS.red :
                        alerta.tipo === 'warning' ? BECHAPRA_COLORS.yellow :
                        BECHAPRA_COLORS.blue

        this.doc.setFillColor(colorRGB[0], colorRGB[1], colorRGB[2])
        this.doc.rect(this.margin, this.yPosition, 3, 8, 'F')

        this.doc.setFillColor(colorRGB[0] + 200, colorRGB[1] + 200, colorRGB[2] + 200)
        this.doc.roundedRect(this.margin + 5, this.yPosition, this.contentWidth - 5, 8, 1, 1, 'F')

        this.doc.setFontSize(9)
        this.doc.setFont('helvetica', 'bold')
        this.doc.setTextColor(colorRGB[0], colorRGB[1], colorRGB[2])
        this.doc.text(alerta.titulo, this.margin + 8, this.yPosition + 3)

        this.doc.setFont('helvetica', 'normal')
        this.doc.setFontSize(8)
        this.doc.text(alerta.mensaje, this.margin + 8, this.yPosition + 6)

        this.yPosition += 10
      })
      this.yPosition += 5
    }

    // ============================================
    // KPIs MEJORADOS - 4 CARDS
    // ============================================
    const estadoPago = dashboard?.kpis?.estado_pago || 'PENDIENTE'
    const estadoColor = estadoPago === 'ENVIADA' || estadoPago === 'PAGADO' 
      ? BECHAPRA_COLORS.green 
      : BECHAPRA_COLORS.yellow

    const kpis = [
      {
        label: 'TOTAL A PAGAR',
        value: formatCurrency(resumen?.total_a_pagar || 0),
        subtitle: pago?.fecha_programada || 'Sin fecha',
        badge: estadoPago,
        color: BECHAPRA_COLORS.blue
      },
      {
        label: 'TRABAJADORES',
        value: formatNumber(resumen?.num_trabajadores || 0),
        subtitle: 'Con créditos activos',
        color: BECHAPRA_COLORS.primary
      },
      {
        label: 'TOTAL CRÉDITOS',
        value: formatNumber(resumen?.num_creditos || 0),
        subtitle: (resumen?.num_creditos || 0) > (resumen?.num_trabajadores || 0) 
          ? 'Algunos con múltiples' 
          : 'Uno por trabajador',
        color: BECHAPRA_COLORS.green
      },
      {
        label: 'ESTADO DEL PAGO',
        value: estadoPago,
        subtitle: pago?.referencia_bancaria?.substring(0, 18) || 'Sin referencia',
        color: estadoColor
      }
    ]

    const kpiGap = 4
    const kpiWidth = (this.contentWidth - (kpiGap * 3)) / 4
    const kpiHeight = 24

    const clamp255 = (n: number) => Math.max(0, Math.min(255, n))

    kpis.forEach((kpi, index) => {
      const xPos = this.margin + (index * (kpiWidth + kpiGap))
      const yPos = this.yPosition

      // Background claro (cap a 255 para evitar overflow)
      this.doc.setFillColor(
        clamp255(kpi.color[0] + 220),
        clamp255(kpi.color[1] + 220),
        clamp255(kpi.color[2] + 220)
      )
      this.doc.roundedRect(xPos, yPos, kpiWidth, kpiHeight, 2, 2, 'F')

      // Borde lateral
      this.doc.setFillColor(kpi.color[0], kpi.color[1], kpi.color[2])
      this.doc.rect(xPos, yPos, 2, kpiHeight, 'F')

      // Badge dinámico (ancho según texto) + reserva para el label
      let badgeW = 0
      if (kpi.badge) {
        const badgeText =
          (kpi.badge === 'ENVIADA' || kpi.badge === 'PAGADO') ? `✓ ${kpi.badge}` : kpi.badge

        this.doc.setFont('helvetica', 'bold')
        this.doc.setFontSize(6)

        const padX = 2.2
        badgeW = this.doc.getTextWidth(badgeText) + (padX * 2)
        const badgeH = 4.2

        const badgeX = xPos + kpiWidth - badgeW - 2
        const badgeY = yPos + 2

        this.doc.setFillColor(kpi.color[0], kpi.color[1], kpi.color[2])
        this.doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 1, 1, 'F')
        this.doc.setTextColor(255, 255, 255)
        this.doc.text(badgeText, badgeX + padX, badgeY + 3)
      }

      // Label (con ancho máximo para NO chocar con badge)
      const labelMaxW = kpiWidth - 8 - (badgeW > 0 ? (badgeW + 2) : 0)
      this.doc.setTextColor(BECHAPRA_COLORS.gray[0], BECHAPRA_COLORS.gray[1], BECHAPRA_COLORS.gray[2])
      this.doc.setFontSize(7)
      this.doc.setFont('helvetica', 'bold')
      this.doc.text(this.fitText(kpi.label, labelMaxW), xPos + 4, yPos + 6)

      // Value (un poco más abajo para respirar)
      this.doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2])
      this.doc.setFontSize(12)
      this.doc.setFont('helvetica', 'bold')
      this.doc.text(kpi.value, xPos + 4, yPos + 15)

      // Subtitle
      this.doc.setTextColor(BECHAPRA_COLORS.gray[0], BECHAPRA_COLORS.gray[1], BECHAPRA_COLORS.gray[2])
      this.doc.setFontSize(6)
      this.doc.setFont('helvetica', 'normal')
      const subtitleLines = this.doc.splitTextToSize(kpi.subtitle, kpiWidth - 8)
      this.doc.text(subtitleLines, xPos + 4, yPos + 20)
    })

    this.yPosition += kpiHeight + 12


    // ============================================
    // SECCIÓN 1: DETALLE DE TRABAJADORES
    // ============================================
    this.checkPageBreak(15)

    // Título con barra lateral
    this.doc.setFillColor(BECHAPRA_COLORS.primary[0], BECHAPRA_COLORS.primary[1], BECHAPRA_COLORS.primary[2])
    this.doc.rect(this.margin, this.yPosition, 2, 5, 'F')
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'bold')
    this.doc.setTextColor(31, 41, 55)
    this.doc.text(`Detalle de Trabajadores`, this.margin + 5, this.yPosition + 4)
    
    this.yPosition += 10

    // Agrupar trabajadores por no_fonacot
    const trabajadoresMap = new Map()
    trabajadores?.forEach((t: any) => {
      if (!trabajadoresMap.has(t.no_fonacot)) {
        trabajadoresMap.set(t.no_fonacot, {
          no_fonacot: t.no_fonacot,
          nombre: t.nombre,
          rfc: t.rfc,
          nss: t.nss,
          creditos: []
        })
      }
      trabajadoresMap.get(t.no_fonacot).creditos.push(t)
    })
    const trabajadoresUnicos = Array.from(trabajadoresMap.values())

    // Renderizar cada trabajador con sus créditos
    trabajadoresUnicos.forEach((trabajador: any) => {
      const headerH = 8
      const infoH = 5
      const creditH = 8
      const sepH = 2
      const bottomPad = 6
      const cardGap = 6


      const cardHeight =
        headerH +
        infoH +
        (trabajador.creditos.length * creditH) +
        Math.max(trabajador.creditos.length - 1, 0) * sepH +
        bottomPad

      this.checkPageBreak(cardHeight + bottomPad + cardGap)

      const totalRetenciones = trabajador.creditos.reduce((sum: number, c: any) => 
        sum + (c.retencion_mensual || 0), 0
      )

      // Card del trabajador
      this.doc.setDrawColor(229, 231, 235)
      this.doc.setLineWidth(0.5)
      this.doc.roundedRect(this.margin, this.yPosition, this.contentWidth,
      cardHeight, 2, 2, 'S')

      // Header con fondo
      this.doc.setFillColor(249, 250, 251)
      this.doc.roundedRect(this.margin, this.yPosition, this.contentWidth, 8, 2, 2, 'F')

      // Nombre del trabajador
      this.doc.setTextColor(BECHAPRA_COLORS.primary[0], BECHAPRA_COLORS.primary[1], BECHAPRA_COLORS.primary[2])
      this.doc.setFontSize(10)
      this.doc.setFont('helvetica', 'bold')
      this.doc.text(trabajador.nombre, this.margin + 3, this.yPosition + 4)

      // Total retenciones (derecha)
      this.doc.setFontSize(12)
      this.doc.text(
        formatCurrency(totalRetenciones), 
        this.pageWidth - this.margin - 3, 
        this.yPosition + 4, 
        { align: 'right' }
      )
      this.doc.setFontSize(6)
      this.doc.setTextColor(BECHAPRA_COLORS.gray[0], BECHAPRA_COLORS.gray[1], BECHAPRA_COLORS.gray[2])
      this.doc.text(
        `${trabajador.creditos.length} crédito${trabajador.creditos.length > 1 ? 's' : ''}`,
        this.pageWidth - this.margin - 3,
        this.yPosition + 7,
        { align: 'right' }
      )

      // Datos del trabajador
      this.yPosition += 8
      this.doc.setFontSize(7)
      this.doc.setFont('helvetica', 'normal')
      this.doc.text(`RFC: ${trabajador.rfc}`, this.margin + 3, this.yPosition + 3)
      this.doc.text(`NSS: ${trabajador.nss}`, this.margin + 50, this.yPosition + 3)
      this.doc.text(`No. FONACOT: ${trabajador.no_fonacot}`, this.margin + 100, this.yPosition + 3)

      this.yPosition += 5

      // Cada crédito
      trabajador.creditos.forEach((credito: any, cIdx: number) => {
        if (cIdx > 0) {
          this.doc.setDrawColor(243, 244, 246)
          this.doc.line(this.margin + 3, this.yPosition, this.pageWidth - this.margin - 3, this.yPosition)
          this.yPosition += 2
        }

        // No. Crédito
        this.doc.setFontSize(7)
        this.doc.setFont('helvetica', 'bold')
        this.doc.setTextColor(31, 41, 55)
        this.doc.text('No. Crédito:', this.margin + 3, this.yPosition + 3)
        this.doc.setFont('helvetica', 'normal')
        this.doc.text(credito.no_credito.toString(), this.margin + 18, this.yPosition + 3)

        // Barra de progreso
        const progressBarWidth = 25
        const progressX = this.margin + 40
        this.doc.setFont('helvetica', 'bold')
        this.doc.text('Progreso:', progressX, this.yPosition + 3)

        // Fondo barra
        this.doc.setFillColor(229, 231, 235)
        this.doc.roundedRect(progressX + 12, this.yPosition, progressBarWidth, 2, 0.5, 0.5, 'F')

        // Progreso
        this.doc.setFillColor(BECHAPRA_COLORS.primary[0], BECHAPRA_COLORS.primary[1], BECHAPRA_COLORS.primary[2])
        const fillWidth = (progressBarWidth * credito.progreso) / 100
        if (fillWidth > 0) {
          this.doc.roundedRect(progressX + 12, this.yPosition, fillWidth, 2, 0.5, 0.5, 'F')
        }

        this.doc.setFontSize(7)
        this.doc.setTextColor(31, 41, 55)
        this.doc.text(`${credito.progreso}%`, progressX + 13 + progressBarWidth, this.yPosition + 1.5)

        this.doc.setFontSize(6)
        this.doc.setTextColor(BECHAPRA_COLORS.gray[0], BECHAPRA_COLORS.gray[1], BECHAPRA_COLORS.gray[2])
        this.doc.text(
          `${credito.cuotas_pagadas} de ${credito.plazo_total} cuotas`,
          progressX + 12,
          this.yPosition + 5
        )

        // Saldo Pendiente
        this.doc.setFontSize(7)
        this.doc.setFont('helvetica', 'bold')
        this.doc.setTextColor(31, 41, 55)
        this.doc.text('Saldo:', this.margin + 95, this.yPosition + 3)
        this.doc.setFont('helvetica', 'normal')
        this.doc.text(formatCurrency(credito.saldo_pendiente), this.margin + 105, this.yPosition + 3)

        // Retención Mensual
        this.doc.setTextColor(BECHAPRA_COLORS.primary[0], BECHAPRA_COLORS.primary[1], BECHAPRA_COLORS.primary[2])
        this.doc.setFont('helvetica', 'bold')
        this.doc.text('Retención:', this.margin + 135, this.yPosition + 3)
        this.doc.text(formatCurrency(credito.retencion_mensual), this.margin + 153, this.yPosition + 3)

        this.yPosition += 8
      })

      this.yPosition += bottomPad
      this.yPosition += cardGap

    })

    // ============================================
    // SECCIÓN 2: TABLA DE TODOS LOS CRÉDITOS
    // ============================================
    this.checkPageBreak(20)
    this.yPosition += 5

    // Título con barra lateral
    this.doc.setFillColor(BECHAPRA_COLORS.blue[0], BECHAPRA_COLORS.blue[1], BECHAPRA_COLORS.blue[2])
    this.doc.rect(this.margin, this.yPosition, 2, 6, 'F')
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'bold')
    this.doc.setTextColor(31, 41, 55)
    this.doc.text(`Todos los Créditos (${trabajadores?.length || 0})`, this.margin + 5, this.yPosition + 4)
    
    this.yPosition += 10

    // Tabla con autoTable
    if (trabajadores && trabajadores.length > 0) {
      const tableData = trabajadores.map((credito: any) => [
        credito.nombre,
        credito.no_credito.toString(),
        `${credito.cuotas_pagadas}/${credito.plazo_total}`,
        `${credito.progreso}%`,
        formatCurrency(credito.saldo_pendiente),
        formatCurrency(credito.retencion_mensual)
      ])

      autoTable(this.doc, {
        startY: this.yPosition,
        head: [['Nombre', 'No. Crédito', 'Cuotas', 'Progreso', 'Saldo', 'Retención']],
        body: tableData,
        theme: 'striped',
        headStyles: {
          fillColor: [BECHAPRA_COLORS.blue[0], BECHAPRA_COLORS.blue[1], BECHAPRA_COLORS.blue[2]],
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: 'bold',
          halign: 'left'
        },
        bodyStyles: {
          fontSize: 7,
          textColor: [31, 41, 55]
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 22, halign: 'left' },
          2: { cellWidth: 18, halign: 'center' },
          3: { cellWidth: 18, halign: 'center' },
          4: { cellWidth: 30, halign: 'right' },
          5: { cellWidth: 30, halign: 'right', textColor: [BECHAPRA_COLORS.blue[0], BECHAPRA_COLORS.blue[1], BECHAPRA_COLORS.blue[2]], fontStyle: 'bold' }
        },
        margin: { left: this.margin, right: this.margin }
      })

      this.yPosition = (this.doc as any).lastAutoTable.finalY + 10
    }

    // ============================================
    // SECCIÓN 3: CONCILIACIÓN DE PAGOS
    // ============================================
    if (conciliacion) {
      this.checkPageBreak(40)

      // Título con barra lateral
      this.doc.setFillColor(BECHAPRA_COLORS.green[0], BECHAPRA_COLORS.green[1], BECHAPRA_COLORS.green[2])
      this.doc.rect(this.margin, this.yPosition, 2, 6, 'F')
      this.doc.setFontSize(12)
      this.doc.setFont('helvetica', 'bold')
      this.doc.setTextColor(31, 41, 55)
      this.doc.text('Conciliación de Pagos', this.margin + 5, this.yPosition + 4)
      
      this.yPosition += 12

      const conciliado = conciliacion.conciliado
      const concilColor = conciliado ? BECHAPRA_COLORS.green : BECHAPRA_COLORS.red

      // Card de conciliación
      this.doc.setFillColor(
        conciliado ? 236 : 254,
        conciliado ? 253 : 226,
        conciliado ? 245 : 226
      )
      this.doc.setDrawColor(concilColor[0], concilColor[1], concilColor[2])
      this.doc.setLineWidth(1)
      this.doc.roundedRect(this.margin, this.yPosition, this.contentWidth, 30, 2, 2, 'FD')

      // Ícono
      this.doc.setFontSize(18)
      this.doc.setTextColor(concilColor[0], concilColor[1], concilColor[2])
      this.doc.text(conciliado ? '✓' : '✗', this.margin + 6, this.yPosition + 10)

      // Texto
      this.doc.setFontSize(11)
      this.doc.setFont('helvetica', 'bold')
      this.doc.text(
        conciliado ? 'Montos Conciliados' : 'Diferencia Detectada',
        this.margin + 16,
        this.yPosition + 7
      )

      this.doc.setFontSize(8)
      this.doc.setFont('helvetica', 'normal')
      this.doc.text(
        conciliado 
          ? 'Los montos de cédula y ficha coinciden'
          : 'Existe una diferencia entre cédula y ficha',
        this.margin + 16,
        this.yPosition + 12
      )

      // 3 Cards de montos (✅ sin overflow)
      this.yPosition += 16

      const innerPadX = 3     // padding interno dentro del card grande
      const montoGap = 3      // separación entre tarjetas
      const montoWidth = (this.contentWidth - (innerPadX * 2) - (montoGap * 2)) / 3

      const montos = [
        { label: 'MONTO CÉDULA', value: conciliacion.monto_cedula },
        { label: 'MONTO FICHA', value: conciliacion.monto_ficha },
        { label: 'MONTO PAGADO', value: conciliacion.monto_pagado }
      ]

      montos.forEach((monto, index) => {
        const xPos = this.margin + innerPadX + (index * (montoWidth + montoGap))

        this.doc.setFillColor(255, 255, 255)
        this.doc.setDrawColor(concilColor[0], concilColor[1], concilColor[2])
        this.doc.setLineWidth(0.5)
        this.doc.roundedRect(xPos, this.yPosition, montoWidth, 12, 1.5, 1.5, 'FD')

        this.doc.setTextColor(concilColor[0], concilColor[1], concilColor[2])
        this.doc.setFontSize(7)
        this.doc.setFont('helvetica', 'bold')
        this.doc.text(monto.label, xPos + 3, this.yPosition + 4)

        this.doc.setFontSize(10)
        this.doc.text(
          monto.value ? formatCurrency(monto.value) : 'Pendiente',
          xPos + 3,
          this.yPosition + 9
        )
      })


      this.yPosition += 16
      this.yPosition += 8

    }

    // ============================================
    // SECCIÓN 4: INFORMACIÓN DE PAGO
    // ============================================
    if (pago) {
      // ✅ PRE-CÁLCULO: si no cabe TODO (Info + Fecha real + Botón), manda TODO a la siguiente página
      const footerReserve = 18 // para no pelear con el pie de página
      const btnReserve = 20    // 12mm alto + 8mm padding del botón
      const gridGapY = 4
      const cardHeight = 12

      const infoReserve =
        10 + // título + separación (tu yPosition += 10)
        (cardHeight * 2) + gridGapY + 10 + // grid completo
        (pago.fecha_pago_real ? 16 : 0)    // card de fecha pago real si existe

      this.checkPageBreak(infoReserve + btnReserve + footerReserve)


      // Título con barra lateral
      this.doc.setFillColor(BECHAPRA_COLORS.cyan[0], BECHAPRA_COLORS.cyan[1], BECHAPRA_COLORS.cyan[2])
      this.doc.rect(this.margin, this.yPosition, 2, 6, 'F')
      this.doc.setFontSize(12)
      this.doc.setFont('helvetica', 'bold')
      this.doc.setTextColor(31, 41, 55)
      this.doc.text('Información de Pago', this.margin + 5, this.yPosition + 4)
      
      this.yPosition += 10

      // Grid 2x2
      const gridGapX = 4
      const cardWidth = (this.contentWidth - gridGapX) / 2


      const infoPagos = [
        { 
          label: 'REFERENCIA BANCARIA',
          value: pago.referencia_bancaria || 'N/A',
          cyan: true
        },
        {
          label: 'ESTADO',
          value: pago.estado || 'PENDIENTE',
          cyan: true
        },
        {
          label: 'FECHA PROGRAMADA',
          value: pago.fecha_programada || 'N/A',
          cyan: false
        },
        {
          label: 'FECHA LÍMITE',
          value: pago.fecha_limite || 'N/A',
          cyan: false
        }
      ]

      infoPagos.forEach((info, index) => {
        const row = Math.floor(index / 2)
        const col = index % 2
        const xPos = this.margin + (col * (cardWidth + gridGapX))
        const yCard = this.yPosition + (row * (cardHeight + gridGapY))


        if (info.cyan) {
          this.doc.setFillColor(236, 254, 255)
          this.doc.setDrawColor(BECHAPRA_COLORS.cyan[0], BECHAPRA_COLORS.cyan[1], BECHAPRA_COLORS.cyan[2])
        } else {
          this.doc.setFillColor(255, 255, 255)
          this.doc.setDrawColor(229, 231, 235)
        }

        this.doc.setLineWidth(0.5)
        this.doc.roundedRect(xPos, yCard, cardWidth, cardHeight, 1.5, 1.5, 'FD')

        this.doc.setTextColor(
          info.cyan ? BECHAPRA_COLORS.cyan[0] : BECHAPRA_COLORS.gray[0],
          info.cyan ? BECHAPRA_COLORS.cyan[1] : BECHAPRA_COLORS.gray[1],
          info.cyan ? BECHAPRA_COLORS.cyan[2] : BECHAPRA_COLORS.gray[2]
        )
        this.doc.setFontSize(7)
        this.doc.setFont('helvetica', 'bold')
        this.doc.text(info.label, xPos + 3, yCard + 4)

        this.doc.setTextColor(info.cyan ? 14 : 31, info.cyan ? 116 : 41, info.cyan ? 144 : 55)
        this.doc.setFontSize(9)
        this.doc.text(this.fitText(info.value, cardWidth - 6), xPos + 3, yCard + 8)
      })

      this.yPosition += (cardHeight * 2) + gridGapY + 10

      // Fecha de Pago Real (si existe)
      if (pago.fecha_pago_real) {
        this.doc.setFillColor(236, 253, 245)
        this.doc.setDrawColor(BECHAPRA_COLORS.green[0], BECHAPRA_COLORS.green[1], BECHAPRA_COLORS.green[2])
        this.doc.setLineWidth(0.5)
        this.doc.roundedRect(this.margin, this.yPosition, this.contentWidth, 11, 1.5, 1.5, 'FD')

        this.doc.setTextColor(BECHAPRA_COLORS.green[0], BECHAPRA_COLORS.green[1], BECHAPRA_COLORS.green[2])
        this.doc.setFontSize(7)
        this.doc.setFont('helvetica', 'bold')
        this.doc.text('FECHA DE PAGO REAL', this.margin + 3, this.yPosition + 4)

        this.doc.setFontSize(10)
        this.doc.text(pago.fecha_pago_real, this.margin + 3, this.yPosition + 8)

        this.yPosition += 16
      } else {
        this.agregarBotonArchivo('📂 Ver Documentos FONACOT', 'modulo7_archivos')
      }
    }

    
  }

  // ============================================
  // MÓDULO 08: Control Fiscal
  // ============================================

  private generarModulo08(data: Modulo08Data): void {
    if (!data || !data.success) {
      this.agregarMensajeVacio('No hay datos de control fiscal')
      return
    }

    const kpis = data.kpis
    const resumenData = data.resumen?.resumen

    // KPIs Principales
    this.generarGridKPIs([
      { titulo: 'Total ISR', valor: formatCurrency(kpis?.total_isr_pagado || resumenData?.total_isr || 0), icono: '📊', color: this.theme.primary },
      { titulo: 'Total IVA', valor: formatCurrency(kpis?.total_iva_pagado || resumenData?.total_iva || 0), icono: '💰', color: this.theme.secondary },
      { titulo: 'Total Impuestos', valor: formatCurrency(kpis?.total_impuestos || resumenData?.total_anual || 0), icono: '💵', color: this.theme.success },
      { titulo: 'Carga Fiscal', valor: `${(kpis?.carga_fiscal || 0).toFixed(2)}%`, icono: '📈', color: this.theme.warning }
    ])

    // Tabla mensual si hay datos
    const meses = resumenData?.meses || []
    if (meses.length > 0) {
      this.yPosition += 15
      this.agregarSubtitulo('Resumen Mensual de Impuestos')

      const mesesData = meses.map((m: any) => [
        m.mes || 'N/A',
        formatCurrency(m.isr_persona_moral || 0),
        formatCurrency(m.isr_retenciones || 0),
        formatCurrency(m.iva_mensual || 0),
        formatCurrency(m.iva_retenciones || 0),
        formatCurrency(m.total_mes || 0)
      ])

      autoTable(this.doc, {
        startY: this.yPosition,
        head: [['Mes', 'ISR P.M.', 'ISR Ret.', 'IVA', 'IVA Ret.', 'Total']],
        body: mesesData,
        theme: 'striped',
        headStyles: { fillColor: [102, 126, 234], textColor: 255 },
        styles: { fontSize: 8 },
        columnStyles: {
          1: { halign: 'right' },
          2: { halign: 'right' },
          3: { halign: 'right' },
          4: { halign: 'right' },
          5: { halign: 'right' }
        }
      })

      this.yPosition = (this.doc as any).lastAutoTable.finalY + 10
    }

    // Declaraciones
    if (data.declaraciones && data.declaraciones.total > 0) {
      this.yPosition += 5
      this.agregarSubtitulo(`Declaraciones (${data.declaraciones.total})`)
      
      const declData = data.declaraciones.declaraciones.slice(0, 8).map((d: any) => [
        d.mes || 'N/A',
        d.tipo || 'N/A',
        d.impuesto || 'N/A',
        formatCurrency(d.total_pagar || d.monto || 0),
        d.fecha_presentacion || 'N/A'
      ])

      autoTable(this.doc, {
        startY: this.yPosition,
        head: [['Mes', 'Tipo', 'Impuesto', 'Monto', 'Fecha']],
        body: declData,
        theme: 'striped',
        headStyles: { fillColor: [139, 92, 246], textColor: 255 },
        styles: { fontSize: 8 },
        columnStyles: {
          3: { halign: 'right' }
        }
      })

      this.yPosition = (this.doc as any).lastAutoTable.finalY + 10
    }

    this.agregarBotonArchivo('📂 Ver Declaraciones', 'modulo8_archivos')
  }

  // ============================================
  // MÓDULO 11: Estados Financieros
  // ============================================

  private generarModulo11(data: Modulo11Data): void {
    if (!data || !data.success || !data.datos) {
      this.agregarMensajeVacio('No hay datos de estados financieros')
      return
    }

    const { datos, informacion_general } = data
    const { kpis, balance_general, estado_resultados, razones_financieras } = datos

    // Información general
    if (informacion_general) {
      this.doc.setFontSize(10)
      this.doc.setTextColor(107, 114, 128)
      this.doc.text(`Ejercicio: ${data.ejercicio || informacion_general.ejercicio || 'N/A'}`, this.margin, this.yPosition)
      this.yPosition += 10
    }

    // KPIs Principales
    if (kpis) {
      this.generarGridKPIs([
        { titulo: 'Activo Total', valor: formatCurrency(kpis.activo_total || 0), icono: '📊', color: this.theme.success },
        { titulo: 'Pasivo Total', valor: formatCurrency(kpis.pasivo_total || 0), icono: '📉', color: this.theme.danger },
        { titulo: 'Capital', valor: formatCurrency(kpis.capital_total || 0), icono: '💰', color: this.theme.primary },
        { titulo: 'Utilidad Neta', valor: formatCurrency(kpis.utilidad_neta || 0), icono: '💵', color: this.theme.accent }
      ])
      this.yPosition += 10
    }

    // Balance General
    if (balance_general) {
      this.agregarSubtitulo('Balance General')
      this.generarGridKPIs([
        { titulo: 'Activo Circulante', valor: formatCurrency(balance_general.activo_circulante || 0), icono: '💳', color: this.theme.success },
        { titulo: 'Activo Fijo', valor: formatCurrency(balance_general.activo_fijo || 0), icono: '🏢', color: this.theme.primary },
        { titulo: 'Pasivo Circulante', valor: formatCurrency(balance_general.pasivo_circulante || 0), icono: '📋', color: this.theme.warning },
        { titulo: 'Capital Contable', valor: formatCurrency(balance_general.capital_total || 0), icono: '🏦', color: this.theme.secondary }
      ])
      this.yPosition += 15
    }

    // Estado de Resultados
    if (estado_resultados) {
      this.agregarSubtitulo('Estado de Resultados')
      this.generarGridKPIs([
        { titulo: 'Ingresos Totales', valor: formatCurrency(estado_resultados.ingresos_totales || 0), icono: '📈', color: this.theme.success },
        { titulo: 'Gastos Operativos', valor: formatCurrency(estado_resultados.gastos_operativos_totales || 0), icono: '📦', color: this.theme.warning },
        { titulo: 'Utilidad Bruta', valor: formatCurrency(estado_resultados.utilidad_bruta || 0), icono: '💵', color: this.theme.primary },
        { titulo: 'Utilidad Neta', valor: formatCurrency(estado_resultados.utilidad_neta || 0), icono: '🎯', color: this.theme.accent }
      ])
      this.yPosition += 15
    }

    // Razones Financieras (resumen)
    if (razones_financieras) {
      this.agregarSubtitulo('Razones Financieras Clave')
      
      // Obtener valores de razones (estructura puede ser anidada o plana)
      const getRazon = (key: string, nested: string) => {
        if (razones_financieras[key] !== undefined) return razones_financieras[key]
        const keys = nested.split('.')
        let val: any = razones_financieras
        for (const k of keys) val = val?.[k]
        return val || 0
      }

      this.generarGridKPIs([
        { titulo: 'Liquidez', valor: getRazon('liquidez_corriente', 'liquidez.razon_corriente')?.toFixed(2) || '0', icono: '💧', color: this.theme.primary },
        { titulo: 'Prueba Ácida', valor: getRazon('prueba_acida', 'liquidez.prueba_acida')?.toFixed(2) || '0', icono: '🧪', color: this.theme.secondary },
        { titulo: 'Endeudamiento', valor: `${(getRazon('endeudamiento', 'apalancamiento.endeudamiento') * 100)?.toFixed(1) || 0}%`, icono: '📊', color: this.theme.warning }
      ])
    }

    // Proveedores Top
    const proveedores = datos.proveedores_top_15 || []
    if (proveedores.length > 0) {
      this.yPosition += 10
      this.agregarSubtitulo('Top 10 Proveedores')

      const provData = proveedores.slice(0, 10).map((p: any) => [
        p.nombre?.slice(0, 30) || 'N/A',
        formatCurrency(p.saldo || 0),
        `${(p.porcentaje || 0).toFixed(1)}%`
      ])

      autoTable(this.doc, {
        startY: this.yPosition,
        head: [['Proveedor', 'Saldo', '%']],
        body: provData,
        theme: 'striped',
        headStyles: { fillColor: [102, 126, 234], textColor: 255 },
        styles: { fontSize: 8 },
        columnStyles: {
          1: { halign: 'right' },
          2: { halign: 'right' }
        }
      })

      this.yPosition = (this.doc as any).lastAutoTable.finalY + 10
    }

    this.agregarBotonArchivo('📂 Ver Estados Financieros', 'modulo11_archivos')
  }

  // ============================================
  // UTILIDADES DE RENDERIZADO
  // ============================================

  private agregarEncabezadoSeccion(titulo: string, subtitulo: string): void {
    this.checkPageBreak(35)

    // Título principal
    this.doc.setFont('helvetica', 'bold')
    this.doc.setFontSize(22)
    this.doc.setTextColor(31, 41, 55)
    this.doc.text(titulo, this.margin, this.yPosition)

    // Línea inferior
    const rgb = this.hexToRgb(this.theme.primary)
    this.yPosition += 4
    this.doc.setDrawColor(rgb.r, rgb.g, rgb.b)
    this.doc.setLineWidth(1)
    this.doc.line(this.margin, this.yPosition, this.margin + this.contentWidth, this.yPosition)

    // Subtítulo
    if (subtitulo) {
      this.yPosition += 8
      this.doc.setFont('helvetica', 'normal')
      this.doc.setFontSize(11)
      this.doc.setTextColor(107, 114, 128)
      this.doc.text(subtitulo, this.margin, this.yPosition)
    }

    this.yPosition += 14
  }

  private agregarSubtitulo(texto: string): void {
    this.doc.setFontSize(13)
    this.doc.setFont('helvetica', 'bold')
    this.doc.setTextColor(55, 65, 81)
    this.doc.text(texto, this.margin, this.yPosition)
    this.yPosition += 8
  }


  private agregarParrafo(texto: string, fontSize: number = 10): void {
    if (!texto) return
    this.doc.setFont('helvetica', 'normal')
    this.doc.setFontSize(fontSize)
    this.doc.setTextColor(75, 85, 99)

    const lines = this.doc.splitTextToSize(texto, this.contentWidth)
    const lineH = fontSize * 0.45 + 2.2

    this.checkPageBreak(lines.length * lineH + 10)

    this.doc.text(lines, this.margin, this.yPosition)
    this.yPosition += (lines.length * lineH) + 2
  }

  private fitText(text: any, maxWidth: number): string {
    let t = String(text ?? '')
    if (!t) return ''
    if (this.doc.getTextWidth(t) <= maxWidth) return t
    while (t.length > 0 && this.doc.getTextWidth(t + '...') > maxWidth) t = t.slice(0, -1)
    return t.length ? (t + '...') : ''
  }

  private drawVerticalGradient(
    x: number,
    y: number,
    w: number,
    h: number,
    startRGB: [number, number, number],
    endRGB: [number, number, number],
    steps: number = 60
  ): void {
    const [sr, sg, sb] = startRGB
    const [er, eg, eb] = endRGB
    const stepH = h / steps

    for (let i = 0; i < steps; i++) {
      const t = steps === 1 ? 0 : i / (steps - 1)
      const r = Math.round(sr + (er - sr) * t)
      const g = Math.round(sg + (eg - sg) * t)
      const b = Math.round(sb + (eb - sb) * t)
      this.doc.setFillColor(r, g, b)
      this.doc.rect(x, y + (i * stepH), w, stepH + 0.2, 'F')
    }
  }

  private agregarEncabezadoModulo(titulo: string, subtitulo: string): void {
    this.checkPageBreak(28)

    const rgb = this.hexToRgb(this.theme.primary)
    const barH = 18

    this.doc.setFillColor(rgb.r, rgb.g, rgb.b)
    this.doc.roundedRect(this.margin, this.yPosition, this.contentWidth, barH, 4, 4, 'F')

    this.doc.setTextColor(255, 255, 255)
    this.doc.setFont('helvetica', 'bold')
    this.doc.setFontSize(13)
    this.doc.text(this.fitText(titulo, this.contentWidth - 12), this.margin + 6, this.yPosition + 7)

    if (subtitulo) {
      this.doc.setFont('helvetica', 'normal')
      this.doc.setFontSize(9)
      this.doc.text(this.fitText(subtitulo, this.contentWidth - 12), this.margin + 6, this.yPosition + 13)
    }

    this.yPosition += barH + 10

    // Reset
    this.doc.setTextColor(31, 41, 55)
  }

  private generarGridKPIs(kpis: Array<{titulo: string, valor: string, icono: string, color: string}>): void {
    const kpiWidth = (this.contentWidth - 10) / Math.min(kpis.length, 3)
    const kpiHeight = 25
    
    let row = 0
    let col = 0
    
    kpis.forEach((kpi, index) => {
      const x = this.margin + (col * (kpiWidth + 5))
      const y = this.yPosition + (row * (kpiHeight + 5))

      // Fondo del KPI
      this.doc.setFillColor(248, 250, 252)
      this.doc.roundedRect(x, y, kpiWidth, kpiHeight, 2, 2, 'F')

      // Borde izquierdo con color
      const rgb = this.hexToRgb(kpi.color)
      this.doc.setFillColor(rgb.r, rgb.g, rgb.b)
      this.doc.rect(x, y, 3, kpiHeight, 'F')

      // Icono y título
      this.doc.setFontSize(8)
      this.doc.setTextColor(107, 114, 128)
      this.doc.text(`${kpi.icono} ${kpi.titulo}`, x + 6, y + 8)

      // Valor
      this.doc.setFontSize(12)
      this.doc.setFont('helvetica', 'bold')
      this.doc.setTextColor(31, 41, 55)
      this.doc.text(kpi.valor, x + 6, y + 18)

      col++
      if (col >= 3) {
        col = 0
        row++
      }
    })

    this.yPosition += (Math.ceil(kpis.length / 3)) * (kpiHeight + 5) + 5
  }

  private agregarCheckItem(titulo: string, descripcion: string): void {
    const cardH = descripcion ? 14 : 11
    this.checkPageBreak(cardH + 4)

    const x = this.margin
    const y = this.yPosition

    // Card
    this.doc.setFillColor(255, 255, 255)
    this.doc.setDrawColor(229, 231, 235)
    this.doc.setLineWidth(0.6)
    this.doc.roundedRect(x, y, this.contentWidth, cardH, 2.5, 2.5, 'FD')

    // Barra lateral
    const p = this.hexToRgb(this.theme.primary)
    this.doc.setFillColor(p.r, p.g, p.b)
    this.doc.rect(x, y, 3, cardH, 'F')

    // Check
    this.doc.setFillColor(16, 185, 129)
    this.doc.circle(x + 8, y + (cardH / 2), 2, 'F')

    // Texto
    this.doc.setFont('helvetica', 'bold')
    this.doc.setFontSize(10)
    this.doc.setTextColor(31, 41, 55)
    this.doc.text(this.fitText(titulo, this.contentWidth - 20), x + 13, y + 6)

    if (descripcion) {
      this.doc.setFont('helvetica', 'normal')
      this.doc.setFontSize(8)
      this.doc.setTextColor(107, 114, 128)
      this.doc.text(this.fitText(descripcion, this.contentWidth - 20), x + 13, y + 11)
    }

    this.yPosition += cardH + 4
  }

  private agregarMensajeVacio(mensaje: string): void {
    this.doc.setFillColor(254, 243, 199)
    this.doc.roundedRect(this.margin, this.yPosition, this.contentWidth, 20, 2, 2, 'F')
    
    this.doc.setFontSize(11)
    this.doc.setTextColor(146, 64, 14)
    this.doc.text(`⚠️ ${mensaje}`, this.margin + 10, this.yPosition + 12)
    
    this.yPosition += 25
  }

  private agregarBotonArchivo(texto: string, archivoId: string): void {
    texto = String(texto ?? '').replace(/📂\s*/g, '')

    // Placeholder visual (no interactividad real)
    const h = 12
    this.checkPageBreak(h + 6)

    const x = this.margin
    const y = this.yPosition

    const rgb = this.hexToRgb(this.theme.secondary)

    this.doc.setFillColor(239, 246, 255)
    this.doc.setDrawColor(rgb.r, rgb.g, rgb.b)
    this.doc.setLineWidth(0.6)
    this.doc.roundedRect(x, y, this.contentWidth, h, 2.5, 2.5, 'FD')

    // Barra lateral
    this.doc.setFillColor(rgb.r, rgb.g, rgb.b)
    this.doc.rect(x, y, 3, h, 'F')

    // Texto
    this.doc.setFont('helvetica', 'bold')
    this.doc.setFontSize(9)
    this.doc.setTextColor(rgb.r, rgb.g, rgb.b)
    this.doc.text(this.fitText(texto, this.contentWidth - 14), x + 8, y + 8)

    this.yPosition += h + 8
  }

  /**
   * Verifica si hay suficiente espacio en la página actual para el contenido que se va a agregar.
   * Si no hay suficiente espacio, agrega una nueva página y reinicia la posición Y.
   * @param espacioNecesario Espacio vertical necesario en mm
   */
  private checkPageBreak(espacioNecesario: number): void {
    if (this.yPosition + espacioNecesario > this.pageHeight - this.margin) {
      this.addNewPage()
    }
  }

  private addNewPage(): void {
    this.doc.addPage()
    this.currentPage++
    this.yPosition = this.margin

    // ✅ Marca de agua en páginas internas
    if (this.config.incluirMarcaAgua) {
      this.aplicarMarcaAgua()
    }
  }


  private agregarNumeracionPaginas(): void {
    const totalPages = (this.doc as any).internal.getNumberOfPages()

    for (let i = 1; i <= totalPages; i++) {
      this.doc.setPage(i)

      // No agregar pie en portada
      if (i === 1) continue

      // Pie de página
      this.doc.setFontSize(8)
      this.doc.setTextColor(156, 163, 175)

      // Nombre del reporte
      this.doc.text(this.config.nombreReporte, this.margin, this.pageHeight - 10)

      // Número de página
      this.doc.text(
        `Página ${i} de ${totalPages}`,
        this.pageWidth - this.margin,
        this.pageHeight - 10,
        { align: 'right' }
      )

      // Línea separadora
      this.doc.setDrawColor(229, 231, 235)
      this.doc.setLineWidth(0.5)
      this.doc.line(this.margin, this.pageHeight - 15, this.pageWidth - this.margin, this.pageHeight - 15)
    }
  }

  // ============================================
  // UTILIDADES DE CÁLCULO
  // ============================================

  private getModulosDisponibles(data: ReporteData): ModuloPDFSection[] {
    const modulos: ModuloPDFSection[] = []

    if (data.modulo1?.success) {
      modulos.push({
        moduloKey: 'modulo1',
        titulo: 'Módulo 01 - Estados de Cuenta',
        descripcion: 'Análisis de movimientos bancarios',
        data: data.modulo1
      })
    }

    if (data.modulo3?.success) {
      modulos.push({
        moduloKey: 'modulo3',
        titulo: 'Módulo 03 - Facturas XML',
        descripcion: 'Conciliación de facturas emitidas y recibidas',
        data: data.modulo3
      })
    }

    if (data.modulo4?.success) {
      modulos.push({
        moduloKey: 'modulo4',
        titulo: 'Módulo 04 - SUA',
        descripcion: 'Sistema Único de Autodeterminación',
        data: data.modulo4
      })
    }

    if (data.modulo5?.success) {
      modulos.push({
        moduloKey: 'modulo5',
        titulo: 'Módulo 05 - ISN',
        descripcion: 'Impuesto Sobre Nómina',
        data: data.modulo5
      })
    }

    if (data.modulo6?.success) {
      modulos.push({
        moduloKey: 'modulo6',
        titulo: 'Módulo 06 - Nómina',
        descripcion: 'Gestión y análisis de nómina',
        data: data.modulo6
      })
    }

    if (data.modulo7?.success) {
      modulos.push({
        moduloKey: 'modulo7',
        titulo: 'Módulo 07 - FONACOT',
        descripcion: 'Créditos y descuentos FONACOT',
        data: data.modulo7
      })
    }

    if (data.modulo8?.success) {
      modulos.push({
        moduloKey: 'modulo8',
        titulo: 'Módulo 08 - Control Fiscal',
        descripcion: 'Declaraciones ISR e IVA',
        data: data.modulo8
      })
    }

    if (data.modulo11?.success) {
      modulos.push({
        moduloKey: 'modulo11',
        titulo: 'Módulo 11 - Estados Financieros',
        descripcion: 'Balance General y Estado de Resultados',
        data: data.modulo11
      })
    }

    return modulos
  }

  private calcularTotalDepositos(data: Modulo1Data): number {
    let total = 0
    data.resultados?.forEach((archivo: any) => {
      const depositos = parseFloat(archivo.datos?.total_depositos || '0')
      if (!isNaN(depositos)) total += depositos
    })
    return total
  }

  private calcularTotalRetiros(data: Modulo1Data): number {
    let total = 0
    data.resultados?.forEach((archivo: any) => {
      const retiros = parseFloat(archivo.datos?.total_retiros || '0')
      if (!isNaN(retiros)) total += retiros
    })
    return total
  }

  private hexToRgb(hex: string): {r: number, g: number, b: number} {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 }
  }
}

// ============================================
// FUNCIÓN DE EXPORTACIÓN RÁPIDA
// ============================================

export async function generarPDFReporte(
  reporteData: ReporteData,
  config?: Partial<PDFConfig>
): Promise<Blob> {
  const generator = new BechapraPDFGenerator({
    nombreReporte: config?.nombreReporte || 'Reporte Bechapra',
    incluirMarcaAgua: true,
    fechaGeneracion: config?.fechaGeneracion || new Date(),
    nombreEmpresa: config?.nombreEmpresa,
    rfc: config?.rfc,
    periodo: config?.periodo,
    incluirPortada: config?.incluirPortada ?? true,
    incluirIndice: config?.incluirIndice ?? true,
    ...config
  })

  return generator.generarReporteCompleto(reporteData)
}

export default BechapraPDFGenerator
