# Sistema de Reclutamiento - Next.js

Este es un sistema completo de reclutamiento desarrollado con Next.js, convertido desde un frontend HTML estático manteniendo el mismo diseño y funcionalidad.

## 🚀 Características

- **Dashboard completo** con métricas en tiempo real
- **Gestión de candidatos** con filtros avanzados
- **Gestión de empleos** con diferentes estados
- **Reportes y análisis** con gráficos interactivos
- **Sistema de autenticación** con login y registro
- **Diseño responsive** con Tailwind CSS
- **Gráficos interactivos** con Chart.js
- **Iconos con Font Awesome**

## 🛠️ Tecnologías

- **Framework**: Next.js 16.0.1 with App Router
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS 4.0
- **Gráficos**: Chart.js + react-chartjs-2
- **Iconos**: Font Awesome
- **Utilidades**: clsx, tailwind-merge, date-fns

## 📦 Instalación

1. Clona el repositorio
2. Instala las dependencias:

```bash
npm install
```

3. Ejecuta el servidor de desarrollo:

```bash
npm run dev
```

4. Abre [http://localhost:3000](http://localhost:3000) en tu navegador

## 📁 Estructura del Proyecto

```
src/
├── app/                    # App Router pages
│   ├── auth/              # Páginas de autenticación
│   │   ├── page.tsx       # Login
│   │   └── register/      # Registro
│   ├── dashboard/         # Dashboard principal
│   │   ├── candidates/    # Gestión de candidatos
│   │   ├── jobs/          # Gestión de empleos
│   │   ├── reports/       # Reportes y análisis
│   │   └── settings/      # Configuración
│   ├── globals.css        # Estilos globales
│   ├── layout.tsx         # Layout principal
│   └── page.tsx           # Página de inicio
├── components/            # Componentes reutilizables
│   ├── Navigation.tsx     # Navegación principal
│   ├── charts/           # Componentes de gráficos
│   └── ui/               # Componentes UI base
├── lib/                  # Utilidades
│   └── utils.ts          # Funciones helper
└── types/                # Tipos TypeScript
    └── index.ts          # Definiciones de tipos
```

## 🎯 Funcionalidades Principales

### Dashboard
- Vista general con métricas clave
- Gráficos de rendimiento
- Actividad reciente del sistema

### Gestión de Candidatos
- Lista completa de candidatos
- Filtros por estado, habilidades, etc.
- Acciones de visualización, edición y descarga

### Gestión de Empleos
- Crear y editar ofertas de trabajo
- Estados: Activo, Cerrado, Borrador
- Métricas de aplicaciones por oferta

### Reportes
- Gráficos interactivos con Chart.js
- Análisis de tendencias
- Métricas detalladas de rendimiento

### Autenticación
- Sistema de login y registro
- Redirección automática según estado de autenticación

## 🎨 Diseño

El proyecto mantiene el diseño original del sistema HTML estático, incluyendo:
- Esquema de colores azul/gris
- Layout de navegación lateral
- Cards y componentes UI consistentes
- Responsive design para móviles y desktop

## 📊 Scripts Disponibles

```bash
npm run dev      # Servidor de desarrollo
npm run build    # Build de producción
npm run start    # Servidor de producción
npm run lint     # Linter ESLint
```

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
