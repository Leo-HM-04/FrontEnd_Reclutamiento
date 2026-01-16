import os
import re

def replace_alerts_in_file(file_path):
    """Reemplaza todas las alertas por modales personalizados"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        alerts_before = len(re.findall(r'\balert\s*\(', content))
        
        if alerts_before == 0:
            return 0
        
        print(f"\nProcesando: {os.path.basename(file_path)}")
        print(f"  Alertas encontradas: {alerts_before}")
        
        # Reemplazos específicos por tipo
        replacements = [
            (r"alert\('✅", "await showSuccess('"),
            (r'alert\("✅', 'await showSuccess("'),
            (r"alert\('❌ Error", "await showError('"),
            (r'alert\("❌ Error', 'await showError("'),
            (r"alert\(`❌ Error", "await showError(`"),
            (r"alert\('Error", "await showError('"),
            (r'alert\("Error', 'await showError("'),
            (r"alert\(`Error", "await showError(`"),
            (r'alert\("Por favor', 'await showAlert("Por favor'),
            (r"alert\('Por favor", "await showAlert('Por favor"),
            (r"alert\(`Por favor", "await showAlert(`Por favor"),
            (r"alert\('Las contraseñas", "await showError('Las contraseñas"),
            (r'alert\("Las contraseñas', 'await showError("Las contraseñas'),
            (r"alert\('La contraseña", "await showError('La contraseña"),
            (r'alert\("La contraseña', 'await showError("La contraseña'),
            (r"alert\('Debes aceptar", "await showError('Debes aceptar"),
            (r'alert\("Debes aceptar', 'await showError("Debes aceptar'),
            (r"alert\('Máximo", "await showError('Máximo"),
            (r'alert\("Máximo', 'await showError("Máximo'),
            # Mensajes de éxito
            (r"alert\('([^']*)(creado|actualizado|eliminado|subido|aprobado|rechazado|activado|desactivado) exitosamente", 
             r"await showSuccess('\1\2 exitosamente"),
            (r'alert\("([^"]*)(creado|actualizado|eliminado|subido|aprobado|rechazado|activado|desactivado) exitosamente', 
             r'await showSuccess("\1\2 exitosamente'),
            (r"alert\(`([^`]*)(exitosamente|activado|desactivado)", r"await showSuccess(`\1\2"),
            # Alertas de entidades específicas
            (r"alert\('Usuario ([^']*)", lambda m: f"await showSuccess('Usuario {m.group(1)}" if 'exitosamente' in m.group(1) or 'activado' in m.group(1) or 'desactivado' in m.group(1) else f"await showError('Usuario {m.group(1)}"),
            (r"alert\(`Usuario ([^`]*)", lambda m: f"await showSuccess(`Usuario {m.group(1)}" if 'exitosamente' in m.group(1) or 'activado' in m.group(1) or 'desactivado' in m.group(1) else f"await showError(`Usuario {m.group(1)}"),
            # Alertas genéricas
            (r"\balert\(message\)", "await showAlert(message)"),
            (r"alert\('Generando", "await showAlert('Generando"),
            (r'alert\("Generando', 'await showAlert("Generando'),
            (r"alert\(`Generando", "await showAlert(`Generando"),
        ]
        
        for pattern, replacement in replacements:
            if callable(replacement):
                content = re.sub(pattern, replacement, content)
            else:
                content = content.replace(pattern, replacement)
        
        # Reemplazo final para alertas que quedaron
        content = re.sub(r'([^a-zA-Z_])alert\s*\(', r'\1await showAlert(', content)
        
        alerts_after = len(re.findall(r'\balert\s*\(', content))
        replaced = alerts_before - alerts_after
        
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"  ✓ {replaced} alertas reemplazadas")
            return replaced
        
        return 0
    except Exception as e:
        print(f"  ✗ Error: {e}")
        return 0

def main():
    src_path = "src"
    total_files = 0
    total_replaced = 0
    
    print("=== INICIANDO REEMPLAZO DE ALERTAS ===\n")
    
    for root, dirs, files in os.walk(src_path):
        # Excluir node_modules
        dirs[:] = [d for d in dirs if d != 'node_modules']
        
        for file in files:
            if file.endswith('.tsx') and file != 'ModalContext.tsx':
                file_path = os.path.join(root, file)
                replaced = replace_alerts_in_file(file_path)
                if replaced > 0:
                    total_files += 1
                    total_replaced += replaced
    
    print(f"\n=== RESUMEN ===")
    print(f"Archivos actualizados: {total_files}")
    print(f"Alertas reemplazadas: {total_replaced}")
    print(f"\n⚠️ IMPORTANTE: Verifica que las funciones que usan await sean async")

if __name__ == "__main__":
    main()
