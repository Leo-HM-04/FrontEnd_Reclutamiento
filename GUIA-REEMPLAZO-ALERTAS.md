# GUÍA DE REEMPLAZO DE ALERTAS POR MODALES PERSONALIZADOS

## ¿Qué hacer?

Reemplazar todas las llamadas `alert()` por el sistema de modales personalizado que usa `useModal()`.

## Paso 1: Importar el hook

Agregar al inicio del componente (después de los imports de React):

```typescript
import { useModal } from '@/context/ModalContext';
```

## Paso 2: Usar el hook en el componente

Dentro del componente funcional, agregar:

```typescript
const { showAlert, showSuccess, showError, showConfirm } = useModal();
```

## Paso 3: Reemplazar las alertas

### Alertas de ERROR (rojas):
```typescript
// ANTES:
alert('Error al cargar');
alert('Las contraseñas no coinciden');
alert(`Error: ${message}`);

// DESPUÉS:
await showError('Error al cargar');
await showError('Las contraseñas no coinciden');
await showError(`Error: ${message}`);
```

### Alertas de ÉXITO (verdes):
```typescript
// ANTES:
alert('Usuario creado exitosamente');
alert('✅ PDF generado exitosamente');

// DESPUÉS:
await showSuccess('Usuario creado exitosamente');
await showSuccess('PDF generado exitosamente');
```

### Alertas INFORMATIVAS (azules):
```typescript
// ANTES:
alert('Por favor completa todos los campos');
alert(message);

// DESPUÉS:
await showAlert('Por favor completa todos los campos');
await showAlert(message);
```

### Confirmaciones (con botones Sí/No):
```typescript
// ANTES:
if (confirm('¿Estás seguro de eliminar?')) {
  // hacer algo
}

// DESPUÉS:
const confirmado = await showConfirm('¿Estás seguro de eliminar?');
if (confirmado) {
  // hacer algo
}
```

## Paso 4: Agregar 'async' a las funciones

Como usamos `await`, las funciones deben ser `async`:

```typescript
// ANTES:
const handleDelete = () => {
  alert('Eliminado');
}

// DESPUÉS:
const handleDelete = async () => {
  await showSuccess('Eliminado');
}
```

## Archivos ya actualizados:
- ✅ src/app/admin/page.tsx (parcialmente)
- ✅ src/context/ModalContext.tsx (el modal en sí)

## Archivos que necesitan actualización:
- [ ] src/app/admin/page-new.tsx
- [ ] src/app/supervisor/page.tsx  
- [ ] src/app/director/page.tsx
- [ ] src/app/director/candidates/page.tsx
- [ ] src/app/director/candidates/documents/page.tsx
- [ ] src/app/evaluacion-publica/[token]/page.tsx
- [ ] src/app/auth/register/page.tsx
- [ ] src/components/ShortlistedCandidatesDashboard.tsx
- [ ] src/components/SelectedCandidatesDashboard.tsx
- [ ] src/components/ReportsDashboard.tsx
- [ ] src/components/ProfilesStatusDashboard.tsx
- [ ] src/components/reports/*.tsx (todos)
- [ ] src/components/profiles/*.tsx (todos)
- [ ] src/components/DirectorCandidateFormModal.tsx

## IMPORTANTE:

El modal personalizado tiene estas ventajas sobre alert():
- ✅ Diseño consistente con el sistema
- ✅ Fondo difuminado
- ✅ Iconos según el tipo
- ✅ Animaciones suaves
- ✅ No bloquea el navegador
- ✅ Responsive
