import os
import re

def fix_modal_imports_and_async(file_path):
    """Asegura que el archivo tenga los imports y async correctos"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        has_changes = False
        
        # Verificar si usa showAlert, showSuccess, etc.
        uses_modal = bool(re.search(r'(showAlert|showSuccess|showError|showConfirm)\s*\(', content))
        
        if not uses_modal:
            return False
        
        print(f"\nProcesando: {os.path.basename(file_path)}")
        
        # 1. Agregar import si no existe
        has_import = 'useModal' in content
        if not has_import:
            # Buscar donde agregar el import (después de imports de React)
            if re.search(r"import.*from\s+['\"]react['\"]", content):
                content = re.sub(
                    r"(import.*from\s+['\"]react['\"];?)",
                    r"\1\nimport { useModal } from '@/context/ModalContext';",
                    content,
                    count=1
                )
                print("  ✓ Import agregado")
                has_changes = True
        
        # 2. Agregar hook si no existe
        has_hook = 'showAlert, showSuccess, showError' in content or 'showAlert' in content
        if not has_hook:
            # Buscar la declaración del componente
            component_match = re.search(
                r'(export default function \w+\([^\)]*\)\s*\{)',
                content
            )
            if component_match:
                insert_pos = component_match.end()
                content = (content[:insert_pos] + 
                          '\n  const { showAlert, showSuccess, showError, showConfirm } = useModal();' +
                          content[insert_pos:])
                print("  ✓ Hook agregado")
                has_changes = True
            else:
                # Buscar componente de arrow function
                component_match = re.search(
                    r'(const \w+\s*=\s*\([^\)]*\)\s*=>.*?\{)',
                    content
                )
                if component_match:
                    insert_pos = component_match.end()
                    content = (content[:insert_pos] + 
                              '\n  const { showAlert, showSuccess, showError, showConfirm } = useModal();' +
                              content[insert_pos:])
                    print("  ✓ Hook agregado")
                    has_changes = True
        
        # 3. Agregar async a funciones que usan await
        # Buscar funciones que usan await show*
        function_patterns = [
            # const handleX = () => {
            (r'(const \w+\s*=\s*)\(\s*([^\)]*)\s*\)\s*=>\s*\{([^}]*await\s+show[A-Z]\w+)', 
             r'\1async (\2) => {'),
            # function handleX() {
            (r'(function \w+)\(\s*([^\)]*)\s*\)\s*\{([^}]*await\s+show[A-Z]\w+)', 
             r'async \1(\2) {'),
            # handleX: () => {
            (r'(\w+:\s*)\(\s*([^\)]*)\s*\)\s*=>\s*\{([^}]*await\s+show[A-Z]\w+)', 
             r'\1async (\2) => {'),
        ]
        
        for pattern, replacement in function_patterns:
            if re.search(pattern, content):
                # Solo reemplazar si no es ya async
                matches = re.finditer(pattern, content)
                for match in matches:
                    if 'async' not in match.group(1):
                        content = re.sub(pattern, replacement, content)
                        print("  ✓ async agregado a funciones")
                        has_changes = True
                        break
        
        if has_changes and content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        
        return False
    except Exception as e:
        print(f"  ✗ Error: {e}")
        return False

def main():
    src_path = "src"
    total_fixed = 0
    
    print("=== CORRIGIENDO IMPORTS Y ASYNC ===\n")
    
    for root, dirs, files in os.walk(src_path):
        dirs[:] = [d for d in dirs if d != 'node_modules']
        
        for file in files:
            if file.endswith('.tsx') and file != 'ModalContext.tsx':
                file_path = os.path.join(root, file)
                if fix_modal_imports_and_async(file_path):
                    total_fixed += 1
    
    print(f"\n=== RESUMEN ===")
    print(f"Archivos corregidos: {total_fixed}")
    print(f"\n✅ Proceso completado!")

if __name__ == "__main__":
    main()
