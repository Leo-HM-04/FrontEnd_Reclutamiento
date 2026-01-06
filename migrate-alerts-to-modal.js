#!/usr/bin/env node

/**
 * ============================================================
 * SCRIPT DE MIGRACIÓN: Alertas Nativas → useModal
 * ============================================================
 * 
 * Este script automatiza la migración de alert() y confirm() 
 * nativos del navegador al sistema de modales personalizado.
 * 
 * USO:
 *   node migrate-alerts-to-modal.js [--dry-run] [--path ./src]
 * 
 * OPCIONES:
 *   --dry-run    Solo muestra los cambios sin aplicarlos
 *   --path       Directorio a procesar (default: ./src)
 * 
 * ============================================================
 */

const fs = require('fs');
const path = require('path');

// ============================================================
// CONFIGURACIÓN
// ============================================================

const CONFIG = {
  // Extensiones de archivo a procesar
  extensions: ['.tsx', '.ts', '.jsx', '.js'],
  
  // Directorios a ignorar
  ignoreDirs: ['node_modules', '.next', 'dist', 'build', '.git'],
  
  // Archivos a ignorar (ya migrados o especiales)
  ignoreFiles: ['ModalContext.tsx', 'ModalContext.ts'],
  
  // Import a agregar
  modalImport: "import { useModal } from '@/context/ModalContext';",
  
  // Hook declaration
  hookDeclaration: "const { showAlert, showConfirm, showSuccess, showError, showWarning } = useModal();",
};

// ============================================================
// PATRONES DE DETECCIÓN Y REEMPLAZO
// ============================================================

const PATTERNS = {
  // Detectar si ya tiene el import de useModal
  hasModalImport: /import\s*{[^}]*useModal[^}]*}\s*from\s*['"]@\/context\/ModalContext['"]/,
  
  // Detectar si ya usa el hook useModal
  hasModalHook: /const\s*{[^}]*show(Alert|Confirm|Success|Error|Warning)[^}]*}\s*=\s*useModal\(\)/,
  
  // Patrones de alert() - capturar el mensaje
  alertPatterns: [
    // alert('mensaje')
    /\balert\s*\(\s*(['"`])(.*?)\1\s*\)/g,
    // alert(`template ${var}`)
    /\balert\s*\(\s*`([^`]*)`\s*\)/g,
    // alert(variable)
    /\balert\s*\(\s*([a-zA-Z_$][a-zA-Z0-9_$]*(?:\??\.[a-zA-Z_$][a-zA-Z0-9_$]*)*(?:\s*\|\|\s*['"`][^'"`]*['"`])?)\s*\)/g,
    // alert(error?.message || 'default')
    /\balert\s*\(\s*([^)]+)\s*\)/g,
  ],
  
  // Patrones de confirm()
  confirmPatterns: [
    // if (!confirm('mensaje')) return;
    /if\s*\(\s*!confirm\s*\(\s*(['"`])(.*?)\1\s*\)\s*\)\s*(return;?|{[^}]*})/g,
    // if (!confirm(`template`)) return;
    /if\s*\(\s*!confirm\s*\(\s*`([^`]*)`\s*\)\s*\)\s*(return;?|{[^}]*})/g,
    // const result = confirm('mensaje')
    /(?:const|let|var)\s+(\w+)\s*=\s*confirm\s*\(\s*(['"`])([^'")`]*)\2\s*\)/g,
    // confirm('mensaje') standalone
    /\bconfirm\s*\(\s*(['"`])(.*?)\1\s*\)/g,
    /\bconfirm\s*\(\s*`([^`]*)`\s*\)/g,
  ],
};

// ============================================================
// CLASIFICADOR DE MENSAJES
// ============================================================

/**
 * Clasifica el mensaje de alert para determinar qué función usar
 */
function classifyAlertMessage(message) {
  const lowerMessage = message.toLowerCase();
  
  // Patrones de éxito
  const successPatterns = [
    'exitosamente', 'exitoso', 'éxito', 'success', 'creado', 'actualizado',
    'eliminado', 'guardado', 'enviado', 'copiado', 'generado', 'duplicado',
    'activado', 'desactivado', '✅', 'completado'
  ];
  
  // Patrones de error
  const errorPatterns = [
    'error', 'fallo', 'falló', 'failed', 'no se pudo', 'no puede',
    'inválido', 'invalid', '❌', 'problema', 'incorrecto'
  ];
  
  // Patrones de advertencia
  const warningPatterns = [
    'advertencia', 'warning', 'cuidado', 'atención', '⚠️'
  ];
  
  // Clasificar
  if (successPatterns.some(p => lowerMessage.includes(p))) {
    return 'showSuccess';
  }
  if (errorPatterns.some(p => lowerMessage.includes(p))) {
    return 'showError';
  }
  if (warningPatterns.some(p => lowerMessage.includes(p))) {
    return 'showWarning';
  }
  
  // Default: alert informativo
  return 'showAlert';
}

// ============================================================
// PROCESADOR DE ARCHIVOS
// ============================================================

class AlertMigrator {
  constructor(options = {}) {
    this.dryRun = options.dryRun || false;
    this.basePath = options.path || './src';
    this.stats = {
      filesScanned: 0,
      filesModified: 0,
      alertsReplaced: 0,
      confirmsReplaced: 0,
      importsAdded: 0,
      hooksAdded: 0,
      errors: [],
    };
    this.changes = [];
  }

  /**
   * Ejecuta la migración
   */
  run() {
    console.log('\n🚀 Iniciando migración de alertas a useModal...\n');
    console.log(`📁 Directorio: ${this.basePath}`);
    console.log(`🔍 Modo: ${this.dryRun ? 'DRY RUN (sin cambios reales)' : 'APLICAR CAMBIOS'}\n`);
    console.log('═'.repeat(60) + '\n');

    this.processDirectory(this.basePath);
    this.printSummary();
    
    return this.stats;
  }

  /**
   * Procesa un directorio recursivamente
   */
  processDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) {
      console.error(`❌ El directorio no existe: ${dirPath}`);
      return;
    }

    const items = fs.readdirSync(dirPath);

    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        if (!CONFIG.ignoreDirs.includes(item)) {
          this.processDirectory(fullPath);
        }
      } else if (stat.isFile()) {
        const ext = path.extname(item);
        if (CONFIG.extensions.includes(ext) && !CONFIG.ignoreFiles.includes(item)) {
          this.processFile(fullPath);
        }
      }
    }
  }

  /**
   * Procesa un archivo individual
   */
  processFile(filePath) {
    this.stats.filesScanned++;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let fileChanges = [];

    // Verificar si tiene alertas o confirms
    const hasAlerts = /\balert\s*\(/.test(content);
    const hasConfirms = /\bconfirm\s*\(/.test(content);

    if (!hasAlerts && !hasConfirms) {
      return; // No hay nada que cambiar
    }

    console.log(`\n📄 Procesando: ${filePath}`);

    // 1. Agregar import si no existe
    if (!PATTERNS.hasModalImport.test(content)) {
      content = this.addImport(content, filePath);
      fileChanges.push('✅ Import de useModal agregado');
      this.stats.importsAdded++;
    }

    // 2. Agregar hook si no existe
    if (!PATTERNS.hasModalHook.test(content)) {
      content = this.addHookDeclaration(content, filePath);
      fileChanges.push('✅ Hook useModal() agregado');
      this.stats.hooksAdded++;
    }

    // 3. Reemplazar confirms (antes que alerts porque algunos patterns se solapan)
    if (hasConfirms) {
      const result = this.replaceConfirms(content);
      content = result.content;
      this.stats.confirmsReplaced += result.count;
      if (result.count > 0) {
        fileChanges.push(`✅ ${result.count} confirm() reemplazados`);
      }
    }

    // 4. Reemplazar alerts
    if (hasAlerts) {
      const result = this.replaceAlerts(content);
      content = result.content;
      this.stats.alertsReplaced += result.count;
      if (result.count > 0) {
        fileChanges.push(`✅ ${result.count} alert() reemplazados`);
      }
    }

    // Guardar cambios si hubo modificaciones
    if (content !== originalContent) {
      this.stats.filesModified++;
      
      if (fileChanges.length > 0) {
        fileChanges.forEach(change => console.log(`   ${change}`));
      }

      if (!this.dryRun) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`   💾 Archivo guardado`);
      } else {
        console.log(`   📝 [DRY RUN] Cambios detectados pero no aplicados`);
      }

      this.changes.push({
        file: filePath,
        changes: fileChanges,
      });
    }
  }

  /**
   * Agrega el import de useModal
   */
  addImport(content, filePath) {
    // Buscar la última línea de imports
    const importRegex = /^import\s+.*?;?\s*$/gm;
    let lastImportMatch = null;
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      lastImportMatch = match;
    }

    if (lastImportMatch) {
      // Insertar después del último import
      const insertPosition = lastImportMatch.index + lastImportMatch[0].length;
      content = 
        content.slice(0, insertPosition) + 
        '\n' + CONFIG.modalImport + 
        content.slice(insertPosition);
    } else {
      // No hay imports, agregar al inicio después de 'use client' si existe
      if (content.startsWith("'use client'") || content.startsWith('"use client"')) {
        const endOfDirective = content.indexOf(';') + 1;
        content = 
          content.slice(0, endOfDirective) + 
          '\n\n' + CONFIG.modalImport + 
          content.slice(endOfDirective);
      } else {
        content = CONFIG.modalImport + '\n\n' + content;
      }
    }

    return content;
  }

  /**
   * Agrega la declaración del hook useModal
   */
  addHookDeclaration(content, filePath) {
    // Buscar el inicio del componente (después de function o const ... = )
    const componentPatterns = [
      // export default function ComponentName() {
      /(export\s+default\s+function\s+\w+\s*\([^)]*\)\s*{)/,
      // export function ComponentName() {
      /(export\s+function\s+\w+\s*\([^)]*\)\s*{)/,
      // function ComponentName() {
      /(function\s+\w+\s*\([^)]*\)\s*{)/,
      // const ComponentName = () => {
      /(const\s+\w+\s*=\s*\([^)]*\)\s*=>\s*{)/,
      // export default function() {
      /(export\s+default\s+function\s*\([^)]*\)\s*{)/,
    ];

    for (const pattern of componentPatterns) {
      const match = content.match(pattern);
      if (match) {
        const insertPosition = match.index + match[0].length;
        
        // Verificar si ya existe alguna declaración de useModal cerca
        const nearbyContent = content.slice(insertPosition, insertPosition + 500);
        if (nearbyContent.includes('useModal()')) {
          return content; // Ya tiene el hook
        }

        content = 
          content.slice(0, insertPosition) + 
          '\n  ' + CONFIG.hookDeclaration + '\n' + 
          content.slice(insertPosition);
        break;
      }
    }

    return content;
  }

  /**
   * Reemplaza los confirm() por showConfirm()
   */
  replaceConfirms(content) {
    let count = 0;

    // Patrón: if (!confirm('mensaje')) return;
    content = content.replace(
      /if\s*\(\s*!confirm\s*\(\s*(['"`])([^'"`]*)\1\s*\)\s*\)\s*{\s*return;?\s*}/g,
      (match, quote, message) => {
        count++;
        return `if (!(await showConfirm(${quote}${message}${quote}))) {\n      return;\n    }`;
      }
    );

    content = content.replace(
      /if\s*\(\s*!confirm\s*\(\s*(['"`])([^'"`]*)\1\s*\)\s*\)\s*return;?/g,
      (match, quote, message) => {
        count++;
        return `if (!(await showConfirm(${quote}${message}${quote}))) return`;
      }
    );

    // Patrón: if (!confirm(`template`)) return;
    content = content.replace(
      /if\s*\(\s*!confirm\s*\(\s*`([^`]*)`\s*\)\s*\)\s*{\s*return;?\s*}/g,
      (match, message) => {
        count++;
        return `if (!(await showConfirm(\`${message}\`))) {\n      return;\n    }`;
      }
    );

    content = content.replace(
      /if\s*\(\s*!confirm\s*\(\s*`([^`]*)`\s*\)\s*\)\s*return;?/g,
      (match, message) => {
        count++;
        return `if (!(await showConfirm(\`${message}\`))) return`;
      }
    );

    // Patrón genérico: confirm() standalone (menos común)
    content = content.replace(
      /(?<!await\s+show)confirm\s*\(\s*(['"`])([^'"`]*)\1\s*\)/g,
      (match, quote, message) => {
        // Evitar reemplazar si ya fue procesado
        if (match.includes('showConfirm')) return match;
        count++;
        return `await showConfirm(${quote}${message}${quote})`;
      }
    );

    content = content.replace(
      /(?<!await\s+show)confirm\s*\(\s*`([^`]*)`\s*\)/g,
      (match, message) => {
        if (match.includes('showConfirm')) return match;
        count++;
        return `await showConfirm(\`${message}\`)`;
      }
    );

    return { content, count };
  }

  /**
   * Reemplaza los alert() por la función apropiada
   */
  replaceAlerts(content) {
    let count = 0;

    // Patrón: alert('mensaje')
    content = content.replace(
      /\balert\s*\(\s*(['"])([^'"]*)\1\s*\)/g,
      (match, quote, message) => {
        count++;
        const func = classifyAlertMessage(message);
        return `await ${func}(${quote}${message}${quote})`;
      }
    );

    // Patrón: alert(`template string`)
    content = content.replace(
      /\balert\s*\(\s*`([^`]*)`\s*\)/g,
      (match, message) => {
        count++;
        const func = classifyAlertMessage(message);
        return `await ${func}(\`${message}\`)`;
      }
    );

    // Patrón: alert(variable) o alert(error?.message || 'default')
    content = content.replace(
      /\balert\s*\(\s*([a-zA-Z_$][a-zA-Z0-9_$?.]*(?: *\|\| *['"`][^'"`]*['"`])?)\s*\)/g,
      (match, expression) => {
        // Determinar tipo basado en el nombre de la variable
        count++;
        const lowerExpr = expression.toLowerCase();
        let func = 'showAlert';
        if (lowerExpr.includes('error') || lowerExpr.includes('err')) {
          func = 'showError';
        } else if (lowerExpr.includes('success') || lowerExpr.includes('message')) {
          func = 'showAlert';
        }
        return `await ${func}(${expression})`;
      }
    );

    return { content, count };
  }

  /**
   * Imprime el resumen de la migración
   */
  printSummary() {
    console.log('\n' + '═'.repeat(60));
    console.log('\n📊 RESUMEN DE LA MIGRACIÓN\n');
    console.log(`   📁 Archivos escaneados: ${this.stats.filesScanned}`);
    console.log(`   ✏️  Archivos modificados: ${this.stats.filesModified}`);
    console.log(`   📥 Imports agregados: ${this.stats.importsAdded}`);
    console.log(`   🪝 Hooks agregados: ${this.stats.hooksAdded}`);
    console.log(`   🔔 alert() reemplazados: ${this.stats.alertsReplaced}`);
    console.log(`   ❓ confirm() reemplazados: ${this.stats.confirmsReplaced}`);
    
    if (this.stats.errors.length > 0) {
      console.log(`\n   ❌ Errores: ${this.stats.errors.length}`);
      this.stats.errors.forEach(err => console.log(`      - ${err}`));
    }

    if (this.dryRun) {
      console.log('\n   ⚠️  MODO DRY RUN: No se aplicaron cambios reales');
      console.log('   💡 Ejecuta sin --dry-run para aplicar los cambios');
    }

    console.log('\n' + '═'.repeat(60) + '\n');

    // Mostrar lista de archivos modificados
    if (this.changes.length > 0) {
      console.log('📝 ARCHIVOS MODIFICADOS:\n');
      this.changes.forEach(change => {
        console.log(`   ${change.file}`);
        change.changes.forEach(c => console.log(`      ${c}`));
      });
      console.log('');
    }
  }
}

// ============================================================
// EJECUCIÓN PRINCIPAL
// ============================================================

function main() {
  const args = process.argv.slice(2);
  
  const options = {
    dryRun: args.includes('--dry-run'),
    path: './src',
  };

  // Buscar --path argumento
  const pathIndex = args.indexOf('--path');
  if (pathIndex !== -1 && args[pathIndex + 1]) {
    options.path = args[pathIndex + 1];
  }

  // Mostrar ayuda
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║     SCRIPT DE MIGRACIÓN: Alertas Nativas → useModal          ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  USO:                                                        ║
║    node migrate-alerts-to-modal.js [opciones]                ║
║                                                              ║
║  OPCIONES:                                                   ║
║    --dry-run    Solo muestra cambios sin aplicarlos          ║
║    --path DIR   Directorio a procesar (default: ./src)       ║
║    --help, -h   Muestra esta ayuda                           ║
║                                                              ║
║  EJEMPLOS:                                                   ║
║    node migrate-alerts-to-modal.js --dry-run                 ║
║    node migrate-alerts-to-modal.js --path ./src/components   ║
║    node migrate-alerts-to-modal.js                           ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
    `);
    process.exit(0);
  }

  const migrator = new AlertMigrator(options);
  migrator.run();
}

main();