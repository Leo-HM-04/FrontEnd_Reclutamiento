# Script para reemplazar todas las alertas por modales personalizados

Write-Host "`n=== INICIANDO REEMPLAZO MASIVO DE ALERTAS ===" -ForegroundColor Cyan

$archivosActualizados = 0
$alertasReemplazadas = 0

# Obtener todos los archivos TSX
$archivos = Get-ChildItem -Path "src" -Recurse -Include *.tsx | Where-Object { $_.Name -notlike "ModalContext.tsx" }

foreach ($archivo in $archivos) {
    $rutaCompleta = $archivo.FullName
    $contenido = Get-Content $rutaCompleta -Encoding UTF8 -Raw
    $contenidoOriginal = $contenido
    
    # Contar alertas antes del reemplazo
    $alertasAntes = ([regex]::Matches($contenido, 'alert\(')).Count
    
    if ($alertasAntes -gt 0) {
        Write-Host "Procesando: $($archivo.Name) - $alertasAntes alertas encontradas" -ForegroundColor Yellow
        
        # Verificar si ya tiene el hook useModal
        $tieneUseModal = $contenido -match 'useModal'
        
        if (-not $tieneUseModal) {
            # Agregar import del useModal si no existe
            if ($contenido -match "import.*from.*react") {
                $contenido = $contenido -replace "(import.*from.*react[';])", "`$1`nimport { useModal } from '@/context/ModalContext';"
            }
            
            # Agregar el hook después de la declaración del componente
            if ($contenido -match "export default function \w+\([^\)]*\) \{") {
                $contenido = $contenido -replace "(export default function \w+\([^\)]*\) \{)", "`$1`n  const { showAlert, showSuccess, showError, showConfirm } = useModal();"
            } elseif ($contenido -match "const \w+ = \([^\)]*\).*=>.*\{") {
                $contenido = $contenido -replace "(const \w+ = \([^\)]*\).*=>.*\{)", "`$1`n  const { showAlert, showSuccess, showError, showConfirm } = useModal();"
            }
        }
        
        # Reemplazos de alertas por tipo
        $contenido = $contenido -replace "alert\('✅", "await showSuccess('" `
                                      -replace "alert\('❌ Error", "await showError('" `
                                      -replace "alert\(`❌ Error", "await showError(`" `
                                      -replace "alert\('Error", "await showError('" `
                                      -replace "alert\(`Error", "await showError(`" `
                                      -replace "alert\('Por favor", "await showAlert('Por favor" `
                                      -replace "alert\(`Por favor", "await showAlert(`Por favor" `
                                      -replace "alert\('Las contraseñas", "await showError('Las contraseñas" `
                                      -replace "alert\('La contraseña", "await showError('La contraseña" `
                                      -replace "alert\('Debes aceptar", "await showError('Debes aceptar" `
                                      -replace "alert\('.*creado exitosamente", { param($match) $match.Value -replace "alert\(", "await showSuccess(" } `
                                      -replace "alert\('.*actualizado exitosamente", { param($match) $match.Value -replace "alert\(", "await showSuccess(" } `
                                      -replace "alert\('.*eliminado exitosamente", { param($match) $match.Value -replace "alert\(", "await showSuccess(" } `
                                      -replace "alert\(`.*exitosamente", { param($match) $match.Value -replace "alert\(", "await showSuccess(" } `
                                      -replace "alert\('Perfil", { param($match) 
                                          if ($match.Value -match "exitosamente") { 
                                              $match.Value -replace "alert\(", "await showSuccess(" 
                                          } else { 
                                              $match.Value -replace "alert\(", "await showError(" 
                                          }
                                      } `
                                      -replace "alert\('Usuario", { param($match) 
                                          if ($match.Value -match "exitosamente|activado|desactivado") { 
                                              $match.Value -replace "alert\(", "await showSuccess(" 
                                          } else { 
                                              $match.Value -replace "alert\(", "await showError(" 
                                          }
                                      } `
                                      -replace "alert\(`Usuario", { param($match) 
                                          if ($match.Value -match "exitosamente|activado|desactivado") { 
                                              $match.Value -replace "alert\(", "await showSuccess(" 
                                          } else { 
                                              $match.Value -replace "alert\(", "await showError(" 
                                          }
                                      } `
                                      -replace "alert\('Cliente", { param($match) 
                                          if ($match.Value -match "exitosamente") { 
                                              $match.Value -replace "alert\(", "await showSuccess(" 
                                          } else { 
                                              $match.Value -replace "alert\(", "await showError(" 
                                          }
                                      } `
                                      -replace "alert\('Candidato", { param($match) 
                                          if ($match.Value -match "exitosamente") { 
                                              $match.Value -replace "alert\(", "await showSuccess(" 
                                          } else { 
                                              $match.Value -replace "alert\(", "await showError(" 
                                          }
                                      } `
                                      -replace "alert\('Documento", { param($match) 
                                          if ($match.Value -match "exitosamente|subido") { 
                                              $match.Value -replace "alert\(", "await showSuccess(" 
                                          } else { 
                                              $match.Value -replace "alert\(", "await showError(" 
                                          }
                                      } `
                                      -replace "alert\('Estado", { param($match) 
                                          if ($match.Value -match "actualizado") { 
                                              $match.Value -replace "alert\(", "await showSuccess(" 
                                          } else { 
                                              $match.Value -replace "alert\(", "await showError(" 
                                          }
                                      } `
                                      -replace "alert\(message\)", "await showAlert(message)" `
                                      -replace "alert\(`Generando", "await showAlert(`Generando" `
                                      -replace "alert\('Máximo", "await showError('Máximo" `
                                      -replace "alert\(`\$\{", "await showError(`$"
        
        # Reemplazar alert simples que quedaron
        $contenido = $contenido -replace "([^a-zA-Z])alert\(", "`$1await showAlert("
        
        # Contar alertas después
        $alertasDespues = ([regex]::Matches($contenido, 'alert\(')).Count
        $reemplazadas = $alertasAntes - $alertasDespues
        
        if ($contenido -ne $contenidoOriginal) {
            Set-Content $rutaCompleta -Value $contenido -Encoding UTF8
            $archivosActualizados++
            $alertasReemplazadas += $reemplazadas
            Write-Host "  ✓ $reemplazadas alertas reemplazadas" -ForegroundColor Green
        }
    }
}

Write-Host "`n=== RESUMEN ===" -ForegroundColor Cyan
Write-Host "Archivos actualizados: $archivosActualizados" -ForegroundColor Green
Write-Host "Alertas reemplazadas: $alertasReemplazadas" -ForegroundColor Green
Write-Host "`nRECUERDA: Algunos archivos pueden necesitar agregar 'async' a sus funciones" -ForegroundColor Yellow
Write-Host "para que funcionen correctamente con 'await showAlert/showSuccess/showError'" -ForegroundColor Yellow
