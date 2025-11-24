# Sistema de Evaluaciones - Módulo Completo

## 📦 Contenido del Paquete

Este paquete contiene todos los componentes necesarios para el Sistema de Evaluaciones:

### Componentes React (5):
1. **EvaluationsMain.tsx** - Componente principal con navegación
2. **EvaluationTemplates.tsx** - Gestión de plantillas
3. **EvaluationQuestions.tsx** - Gestión de preguntas
4. **CandidateEvaluations.tsx** - Evaluaciones de candidatos
5. **EvaluationAnswers.tsx** - Respuestas de evaluación
6. **EvaluationComments.tsx** - Comentarios de evaluación

### Archivo API:
- **api-evaluations.ts** - Todas las funciones para consumir los endpoints del backend

## 🚀 Instalación

### Paso 1: Copiar los Componentes

Copia todos los archivos `.tsx` a la carpeta de componentes de tu proyecto:

```bash
# Crear carpeta de evaluaciones si no existe
mkdir -p src/components/evaluations

# Copiar todos los archivos .tsx
cp EvaluationsMain.tsx src/components/evaluations/
cp EvaluationTemplates.tsx src/components/evaluations/
cp EvaluationQuestions.tsx src/components/evaluations/
cp CandidateEvaluations.tsx src/components/evaluations/
cp EvaluationAnswers.tsx src/components/evaluations/
cp EvaluationComments.tsx src/components/evaluations/
```

### Paso 2: Actualizar o Crear el Archivo API

Si ya tienes un archivo `src/lib/api.ts`:
- Abre `api-evaluations.ts` y copia todas las funciones
- Pégalas al final de tu archivo `src/lib/api.ts` existente

Si NO tienes un archivo `src/lib/api.ts`:
```bash
# Crear carpeta lib si no existe
mkdir -p src/lib

# Copiar el archivo
cp api-evaluations.ts src/lib/api.ts
```

### Paso 3: Integrar en el Dashboard del Director

Abre el archivo `src/app/director/page.tsx` y agrega lo siguiente:

#### 3.1. Importar el componente principal

Al inicio del archivo, junto con los demás imports:

```typescript
import EvaluationsMain from "@/components/evaluations/EvaluationsMain";
```

#### 3.2. Agregar el item en el Sidebar

Busca donde está la navegación del sidebar y agrega:

```typescript
<li>
  <button 
    onClick={() => setCurrentView("evaluations")} 
    className={`sidebar-item flex items-center px-3 py-2 text-sm font-medium rounded-lg cursor-pointer transition-all w-full ${getNavItemClass("evaluations")}`}
  >
    <i className="fas fa-clipboard-check mr-3 w-5" />
    Sistema de Evaluaciones
  </button>
</li>
```

#### 3.3. Agregar el render del componente

Busca donde se renderizan las diferentes vistas (donde está `{currentView === "dashboard" && ...}`) y agrega:

```typescript
{currentView === "evaluations" && <EvaluationsMain />}
```

## 📋 Estructura Final

Después de la instalación, tu proyecto debería verse así:

```
src/
├── app/
│   └── director/
│       └── page.tsx                    # (modificado)
├── components/
│   └── evaluations/
│       ├── EvaluationsMain.tsx         # ✨ NUEVO
│       ├── EvaluationTemplates.tsx     # ✨ NUEVO
│       ├── EvaluationQuestions.tsx     # ✨ NUEVO
│       ├── CandidateEvaluations.tsx    # ✨ NUEVO
│       ├── EvaluationAnswers.tsx       # ✨ NUEVO
│       └── EvaluationComments.tsx      # ✨ NUEVO
└── lib/
    └── api.ts                          # (actualizado)
```

## ✅ Verificación

Para verificar que todo está funcionando:

1. **Inicia el servidor de desarrollo:**
   ```bash
   npm run dev
   ```

2. **Accede al dashboard del director:**
   ```
   http://localhost:3000/director
   ```

3. **Haz clic en "Sistema de Evaluaciones"** en el sidebar

4. **Deberías ver:**
   - Un menú lateral con 5 opciones
   - La vista de "Plantillas de evaluación" por defecto
   - Datos cargados desde el backend (si tienes el backend corriendo)

## 🔧 Configuración del Backend

Asegúrate de que tu backend Django esté corriendo en:
```
http://localhost:8000
```

Y que los siguientes endpoints estén disponibles:
- `/api/evaluations/templates/`
- `/api/evaluations/questions/`
- `/api/evaluations/candidate-evaluations/`
- `/api/evaluations/answers/`
- `/api/evaluations/comments/`

## 🎨 Personalización

### Colores
Los componentes usan el esquema de colores del Director (azul). Si quieres personalizar:

- **Azul principal:** `bg-blue-600`, `text-blue-700`, etc.
- **Hover:** `hover:bg-blue-700`
- **Fondo:** `bg-blue-50`

### Iconos
Los componentes usan Font Awesome. Asegúrate de tener Font Awesome instalado:

```html
<!-- En tu layout o en la página -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
```

## 📝 Notas Importantes

1. **Tokens de Autenticación:** Los componentes obtienen el token JWT de `localStorage.getItem("token")`. Asegúrate de que tu sistema de login lo guarde correctamente.

2. **CORS:** Si ves errores de CORS, asegúrate de que tu backend Django tenga configurado CORS correctamente para aceptar peticiones desde `http://localhost:3000`.

3. **Manejo de Errores:** Los componentes tienen manejo básico de errores. Puedes mejorar esto agregando toasts o notificaciones.

## 🐛 Solución de Problemas

### Error: "Cannot find module '@/components/evaluations/EvaluationsMain'"
- Verifica que copiaste los archivos a la carpeta correcta
- Revisa que el path alias `@` esté configurado en tu `tsconfig.json`

### Error: "fetch failed" o problemas de red
- Verifica que el backend esté corriendo
- Verifica la URL del backend en `.env.local`
- Revisa la configuración de CORS en Django

### Los componentes no cargan datos
- Abre la consola del navegador (F12)
- Verifica que las peticiones a la API se estén haciendo
- Revisa que el token JWT sea válido
- Verifica que los endpoints del backend estén respondiendo correctamente

## 📞 Soporte

Si tienes algún problema:
1. Revisa la consola del navegador (F12)
2. Revisa los logs del backend Django
3. Verifica que todos los archivos estén en su lugar correcto

## 🎉 ¡Listo!

Ahora tienes un Sistema de Evaluaciones completamente funcional integrado en tu dashboard del Director. Todas las operaciones CRUD están conectadas al backend y listas para usar.
