// app/supervisor/page.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useModal } from '@/context/ModalContext';
import { Chart, ArcElement, Tooltip, Legend, DoughnutController } from "chart.js";

Chart.register(ArcElement, Tooltip, Legend, DoughnutController);

type Notification = { id: number; icon?: string; message: string; time: string };
type Activity = { id: number; icon?: string; description: string; time: string };
type MyProcess = {
  id: number;
  position: string;
  department: string;
  client: string;
  status: "active" | "pending" | "completed";
  statusText: string;
  candidates: string; // "12/15"
  deadline: string; // "YYYY-MM-DD"
};

export default function SupervisorPage() {
  // ===== Estado principal
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<
    "dashboard" | "my-processes" | "candidates" | "clients" | "reports" | "documents" | "team-metrics"
  >("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [stats, setStats] = useState({
    activeProcesses: 0,
    activeCandidates: 0,
    successRate: 0,
    clientSatisfaction: 0,
    myProcesses: 0,
    pendingToday: 0,
  });

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [myProcesses, setMyProcesses] = useState<MyProcess[]>([]);

  // Dropdowns
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // ===== Chart
  const doughnutRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<Chart | null>(null);

  // ===== Util: debounce
  function debounce<T extends (...args: any[]) => void>(fn: T, wait = 300) {
    let t: any;
    return (...args: Parameters<T>) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), wait);
    };
  }

  const handleSearch = useMemo(
    () =>
      debounce((value: string) => {
        if (value.length > 2) {
          console.info(`🔎 Buscando: ${value}`);
          // En producción: llamar API de búsqueda
        }
      }, 300),
    []
  );

  // ===== Init
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        // Simula carga
        await new Promise((r) => setTimeout(r, 500));

        setStats({
          activeProcesses: 12,
          activeCandidates: 48,
          successRate: 85,
          clientSatisfaction: 4.7,
          myProcesses: 8,
          pendingToday: 5,
        });

        setNotifications([
          {
            id: 1,
            icon: "user-plus",
            message: 'Nuevo candidato agregado al proceso "Desarrollador Senior"',
            time: "Hace 2 horas",
          },
          {
            id: 2,
            icon: "check-circle",
            message: 'Proceso "Analista de Datos" completado',
            time: "Hace 4 horas",
          },
          {
            id: 3,
            icon: "clock",
            message: "Recordatorio: Evaluación pendiente para mañana",
            time: "Hace 6 horas",
          },
        ]);

        setRecentActivity([
          {
            id: 1,
            icon: "file-alt",
            description: "María García subió su CV actualizado",
            time: "Hace 30 minutos",
          },
          {
            id: 2,
            icon: "check-circle",
            description: "Evaluación técnica completada por Juan Pérez",
            time: "Hace 2 horas",
          },
          {
            id: 3,
            icon: "comment",
            description: 'Nuevo comentario en proceso "Diseñador UX"',
            time: "Hace 3 horas",
          },
        ]);

        setMyProcesses([
          {
            id: 1,
            position: "Desarrollador Frontend Senior",
            department: "Tecnología",
            client: "Tech Corp",
            status: "active",
            statusText: "Activo",
            candidates: "12/15",
            deadline: "2025-11-30",
          },
          {
            id: 2,
            position: "Analista de Datos",
            department: "Analytics",
            client: "Data Solutions",
            status: "active",
            statusText: "Activo",
            candidates: "8/10",
            deadline: "2025-12-15",
          },
          {
            id: 3,
            position: "Diseñador UX/UI",
            department: "Diseño",
            client: "Creative Agency",
            status: "pending",
            statusText: "Pendiente",
            candidates: "5/8",
            deadline: "2025-11-20",
          },
        ]);
      } catch (e) {
        await showAlert("Error cargando el dashboard");
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Crear/actualizar gráfica
  useEffect(() => {
    if (!doughnutRef.current) return;

    // destruir instancia previa si existe
    if (chartInstance.current) {
      chartInstance.current.destroy();
      chartInstance.current = null;
    }

    const ctx = doughnutRef.current.getContext("2d");
    if (!ctx) return;

    chartInstance.current = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["En Proceso", "Completados", "Pausados"],
        datasets: [
          {
            data: [8, 25, 4],
            backgroundColor: ["#3B82F6", "#10B981", "#F59E0B"],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: "bottom" } },
      },
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [currentView]);

  // ===== Acciones (solo lectura)
  const refreshDashboard = async () => {
    try {
      setLoading(true);
      // Reutiliza la misma carga mock
      await new Promise((r) => setTimeout(r, 400));
      console.info("✅ Dashboard actualizado");
    } catch {
      await showAlert("Error actualizando dashboard");
    } finally {
      setLoading(false);
    }
  };

  const exportDashboard = () => {
    console.info("Generando exportación del dashboard...");
  };

  const exportProcesses = () => {
    console.info("Exportando lista de procesos...");
  };

  const viewProcessDetails = (id: number) => {
    console.info(`Abriendo detalles del proceso ${id}...`);
  };

  const logout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
  };

  // Helpers
  const navClass = (view: typeof currentView) =>
    currentView === view
      ? "bg-purple-50 text-purple-700 font-semibold"
      : "text-gray-700 hover:bg-gray-50";

  const statusPill = (status: MyProcess["status"]) => {
    if (status === "active") return "bg-green-100 text-green-800";
    if (status === "pending") return "bg-yellow-100 text-yellow-800";
    return "bg-blue-100 text-blue-800";
  };

  return (
    <div className="bg-gray-50 font-sans antialiased min-h-screen">
      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-white/90 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Cargando dashboard...</p>
          </div>
        </div>
      )}

      {/* Banner Solo Lectura */}
      <div className="bg-linear-to-r from-purple-50 to-purple-100 border-l-4 border-purple-600 px-6 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center">
            <i className="fas fa-lock text-purple-600 mr-3"></i>
            <div>
              <p className="text-sm font-semibold text-purple-900">Modo Solo Lectura</p>
              <p className="text-xs text-purple-700">
                Puedes visualizar y exportar datos, pero no realizar modificaciones
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-purple-200 text-purple-800 text-xs font-medium rounded-full">
            Supervisor
          </span>
        </div>
      </div>

      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 relative z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo y Título */}
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen((v) => !v)}
                className="lg:hidden mr-4 p-2 rounded-lg hover:bg-gray-100"
              >
                <svg
                  className="w-5 h-5 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-linear-to-r from-purple-500 to-purple-600 flex items-center justify-center">
                  <i className="fas fa-eye text-white"></i>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Sistema RH</h1>
                  <p className="text-xs text-gray-500">Panel de Supervisión</p>
                </div>
              </div>
            </div>

            {/* Búsqueda + Notificaciones + Perfil */}
            <div className="flex items-center space-x-4">
              {/* Búsqueda */}
              <div className="hidden md:block">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      handleSearch(e.target.value);
                    }}
                    placeholder="Buscar en el sistema..."
                    className="w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4"></i>
                </div>
              </div>

              {/* Notificaciones */}
              <div className="relative">
                <button
                  onClick={() => setNotifOpen((o) => !o)}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors relative"
                >
                  <i className="fas fa-bell text-gray-600 h-5 w-5"></i>
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                </button>
                {notifOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-gray-900">Notificaciones</h3>
                        <span className="text-xs text-blue-600">{notifications.length} nuevas</span>
                      </div>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {notifications.map((n) => (
                          <div
                            key={n.id}
                            className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                          >
                            <div className="shrink-0 mt-1">
                              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                                <i className="fas fa-user text-blue-600 w-3.5 h-3.5"></i>
                              </div>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-gray-900">{n.message}</p>
                              <p className="text-xs text-gray-500">{n.time}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 pt-3 border-t">
                        <a href="#" className="text-sm text-blue-600 hover:text-blue-700">
                          Ver todas las notificaciones
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Perfil */}
              <div className="relative">
                <button
                  onClick={() => setProfileOpen((o) => !o)}
                  className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 p-1 hover:bg-gray-50 transition-colors"
                >
                  <img
                    className="h-8 w-8 rounded-full border-2 border-purple-200"
                    src={`https://ui-avatars.com/api/?name=Supervisor+RH&background=9333ea&color=fff`}
                    alt="Supervisor RH"
                  />
                  <span className="ml-2 text-gray-700 font-medium hidden sm:block">Supervisor RH</span>
                  <i className="fas fa-chevron-down ml-1 text-gray-400 h-4 w-4"></i>
                </button>

                {profileOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                    <div className="p-4 border-b">
                      <p className="text-sm font-semibold text-gray-900">Supervisor RH</p>
                      <p className="text-xs text-gray-500">supervisor@bechapra.com</p>
                      <span className="inline-flex items-center gap-1 mt-2 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                        <i className="fas fa-lock h-3 w-3"></i>
                        Solo Lectura
                      </span>
                    </div>
                    <div className="py-2">
                      <a className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        <i className="fas fa-user inline-block mr-2 h-4 w-4"></i>
                        Mi Perfil
                      </a>
                      <a className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        <SettingsIcon />
                        Configuración
                      </a>
                    </div>
                    <div className="border-t py-2">
                      <button
                        onClick={logout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <i className="fas fa-sign-out-alt inline-block mr-2 h-4 w-4"></i>
                        Cerrar Sesión
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Layout principal */}
      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`bg-white border-r border-gray-200 fixed lg:sticky top-0 h-screen z-20 transition-transform duration-300 w-64 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          {/* Sidebar Header */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-linear-to-r from-purple-500 to-purple-600 flex items-center justify-center">
                <i className="fas fa-eye text-white w-4 h-4"></i>
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Panel Supervisor</h2>
                <p className="text-xs text-gray-500">Solo Visualización</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="p-4">
            <ul className="space-y-1">
              <li>
                <button
                  onClick={() => {
                    setCurrentView("dashboard");
                    setSidebarOpen(false);
                  }}
                  className={`sidebar-item flex w-full items-center px-3 py-2 text-sm font-medium rounded-lg transition-all ${navClass(
                    "dashboard"
                  )}`}
                >
                  <i className="fas fa-chart-line mr-3 w-5 h-5"></i>
                  Dashboard
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setCurrentView("my-processes");
                    setSidebarOpen(false);
                  }}
                  className={`sidebar-item flex w-full items-center px-3 py-2 text-sm font-medium rounded-lg transition-all ${navClass(
                    "my-processes"
                  )}`}
                >
                  <svg className="mr-3 w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <path d="M4 6h16M4 12h10M4 18h7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  Mis Procesos
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setCurrentView("candidates");
                    setSidebarOpen(false);
                  }}
                  className={`sidebar-item flex w-full items-center px-3 py-2 text-sm font-medium rounded-lg transition-all ${navClass(
                    "candidates"
                  )}`}
                >
                  <svg className="mr-3 w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M16 11c1.657 0 3-1.79 3-4s-1.343-4-3-4-3 1.79-3 4 1.343 4 3 4zM8 13c-2.761 0-5 2.239-5 5v2h10v-2c0-2.761-2.239-5-5-5z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                  Candidatos
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setCurrentView("clients");
                    setSidebarOpen(false);
                  }}
                  className={`sidebar-item flex w-full items-center px-3 py-2 text-sm font-medium rounded-lg transition-all ${navClass(
                    "clients"
                  )}`}
                >
                  <svg className="mr-3 w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <path d="M3 21V7l9-4 9 4v14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M9 22V12h6v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  Clientes
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setCurrentView("reports");
                    setSidebarOpen(false);
                  }}
                  className={`sidebar-item flex w-full items-center px-3 py-2 text-sm font-medium rounded-lg transition-all ${navClass(
                    "reports"
                  )}`}
                >
                  <svg className="mr-3 w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M3 3h12l6 6v12H3V3z M15 3v6h6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                  Reportes
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setCurrentView("documents");
                    setSidebarOpen(false);
                  }}
                  className={`sidebar-item flex w-full items-center px-3 py-2 text-sm font-medium rounded-lg transition-all ${navClass(
                    "documents"
                  )}`}
                >
                  <svg className="mr-3 w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <path d="M7 3h6l5 5v13H7V3z M13 3v6h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  Documentos
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setCurrentView("team-metrics");
                    setSidebarOpen(false);
                  }}
                  className={`sidebar-item flex w-full items-center px-3 py-2 text-sm font-medium rounded-lg transition-all ${navClass(
                    "team-metrics"
                  )}`}
                >
                  <svg className="mr-3 w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <path d="M4 19v-6M12 19v-8M20 19V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  Métricas del Equipo
                </button>
              </li>
            </ul>
          </div>

          {/* Quick Stats */}
          <div className="p-4 border-t border-gray-100 mt-auto">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Resumen Rápido</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Mis Procesos</span>
                <span className="text-xs font-semibold text-blue-600">{stats.myProcesses}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Pendientes Hoy</span>
                <span className="text-xs font-semibold text-yellow-600">{stats.pendingToday}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main
          className={`flex-1 overflow-y-auto lg:ml-0 ${sidebarOpen ? "lg:ml-64" : "ml-0 lg:ml-0"}`}
          onClick={() => setSidebarOpen(false)}
        >
          {/* ===== Dashboard ===== */}
          {currentView === "dashboard" && (
            <div className="p-6">
              {/* Header */}
              <div className="mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900">Panel de Supervisión</h2>
                    <p className="text-gray-600 mt-1">Vista general del sistema de reclutamiento</p>
                  </div>
                  <div className="mt-4 sm:mt-0 flex space-x-3">
                    <button
                      onClick={refreshDashboard}
                      className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <svg className="inline-block mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M4 4v6h6M20 20v-6h-6M20 8a8 8 0 00-14.31-4M4 16a8 8 0 0014.31 4"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                      Actualizar
                    </button>
                    <button
                      onClick={exportDashboard}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-blue-700"
                    >
                      <i className="fas fa-download inline-block mr-2 h-4 w-4"></i>
                      Exportar
                    </button>
                  </div>
                </div>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Procesos Activos</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{stats.activeProcesses}</p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-xl">
                      <i className="fas fa-briefcase text-blue-600 h-6 w-6"></i>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm">
                    <span className="flex items-center text-green-600">
                      <svg className="h-3.5 w-3.5 mr-1" viewBox="0 0 24 24" fill="none">
                        <path d="M18 15l-6-6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                      <span className="font-semibold">15%</span>
                    </span>
                    <span className="text-gray-500 ml-2">vs mes anterior</span>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Candidatos Activos</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{stats.activeCandidates}</p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-xl">
                      <i className="fas fa-user-check text-green-600 h-6 w-6"></i>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm">
                    <span className="flex items-center text-green-600">
                      <svg className="h-3.5 w-3.5 mr-1" viewBox="0 0 24 24" fill="none">
                        <path d="M18 15l-6-6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                      <span className="font-semibold">8%</span>
                    </span>
                    <span className="text-gray-500 ml-2">desde última semana</span>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Tasa de Éxito</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{stats.successRate}%</p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-xl">
                      <i className="fas fa-chart-line text-purple-600 h-6 w-6"></i>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm">
                    <span className="flex items-center text-green-600">
                      <svg className="h-3.5 w-3.5 mr-1" viewBox="0 0 24 24" fill="none">
                        <path d="M18 15l-6-6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                      <span className="font-semibold">3%</span>
                    </span>
                    <span className="text-gray-500 ml-2">mejora continua</span>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Satisfacción Cliente</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{stats.clientSatisfaction}/5</p>
                    </div>
                    <div className="p-3 bg-yellow-100 rounded-xl">
                      <i className="fas fa-star text-yellow-600 h-6 w-6"></i>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center">
                    {/* rating visual */}
                    <div className="flex items-center text-yellow-400">
                      <i className="fas fa-star h-3.5 w-3.5 fill-yellow-400"></i>
                      <i className="fas fa-star h-3.5 w-3.5 fill-yellow-400 ml-1"></i>
                      <i className="fas fa-star h-3.5 w-3.5 fill-yellow-400 ml-1"></i>
                      <i className="fas fa-star h-3.5 w-3.5 fill-yellow-400 ml-1"></i>
                      <i className="fas fa-star h-3.5 w-3.5 ml-1"></i>
                    </div>
                    <span className="text-sm text-gray-500 ml-2">Excelente</span>
                  </div>
                </div>
              </div>

              {/* Charts + Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Distribución de Procesos</h3>
                    <i className="fas fa-lock text-gray-400 h-4 w-4"></i>
                  </div>
                  <div className="h-64">
                    <canvas ref={doughnutRef} />
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Actividad Reciente</h3>
                  </div>
                  <div className="space-y-4">
                    {recentActivity.map((a) => (
                      <div key={a.id} className="flex items-start space-x-3 pb-3 border-b border-gray-100 last:border-0">
                        <div className="shrink-0 mt-1">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <i className="fas fa-user text-blue-600 w-4 h-4"></i>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900">{a.description}</p>
                          <p className="text-xs text-gray-500 mt-1">{a.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tabla Mis Procesos */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Mis Procesos Asignados</h3>
                  <button
                    onClick={exportProcesses}
                    className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
                  >
                    <i className="fas fa-download inline-block mr-2 h-4 w-4"></i>
                    Exportar
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Posición</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Candidatos</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Límite</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ver</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {myProcesses.map((p) => (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4">
                            <div className="flex items-center">
                              <div className="w-10 h-10 rounded-lg bg-linear-to-r from-blue-500 to-blue-600 flex items-center justify-center mr-3">
                                <i className="fas fa-briefcase text-white h-4 w-4"></i>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{p.position}</p>
                                <p className="text-xs text-gray-500">{p.department}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-900">{p.client}</td>
                          <td className="px-4 py-4">
                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${statusPill(p.status)}`}>
                              {p.statusText}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-900">{p.candidates}</td>
                          <td className="px-4 py-4 text-sm text-gray-900">{p.deadline}</td>
                          <td className="px-4 py-4">
                            <button
                              onClick={() => viewProcessDetails(p.id)}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <i className="fas fa-eye h-4 w-4"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ===== Mis Procesos ===== */}
          {currentView === "my-processes" && (
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Mis Procesos</h2>
                <p className="text-gray-600">Procesos de reclutamiento asignados a mí</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-2 text-purple-600 mb-4">
                  <i className="fas fa-lock h-4 w-4"></i>
                  <p className="text-sm">Vista de solo lectura - Puedes ver detalles y exportar información</p>
                </div>
                <p className="text-gray-600">Panel de mis procesos en desarrollo...</p>
              </div>
            </div>
          )}

          {/* ===== Candidatos ===== */}
          {currentView === "candidates" && (
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Gestión de Candidatos</h2>
                <p className="text-gray-600">Visualización de candidatos del sistema</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-2 text-purple-600 mb-4">
                  <i className="fas fa-lock h-4 w-4"></i>
                  <p className="text-sm">Vista de solo lectura - No puedes crear o editar candidatos</p>
                </div>
                <p className="text-gray-600">Panel de candidatos en desarrollo...</p>
              </div>
            </div>
          )}

          {/* ===== Clientes ===== */}
          {currentView === "clients" && (
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Gestión de Clientes</h2>
                <p className="text-gray-600">Visualización de información de clientes</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-2 text-purple-600 mb-4">
                  <i className="fas fa-lock h-4 w-4"></i>
                  <p className="text-sm">Vista de solo lectura - No puedes modificar información de clientes</p>
                </div>
                <p className="text-gray-600">Panel de clientes en desarrollo...</p>
              </div>
            </div>
          )}

          {/* ===== Reportes ===== */}
          {currentView === "reports" && (
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Reportes y Analytics</h2>
                <p className="text-gray-600">Exportación y visualización de reportes</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <p className="text-gray-600">Puedes exportar cualquier reporte en formato PDF o Excel</p>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    <i className="fas fa-download inline-block mr-2 h-4 w-4"></i>
                    Generar Reporte
                  </button>
                </div>
                <p className="text-gray-600">Panel de reportes en desarrollo...</p>
              </div>
            </div>
          )}

          {/* ===== Documentos ===== */}
          {currentView === "documents" && (
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Gestión de Documentos</h2>
                <p className="text-gray-600">Visualización de documentos del sistema</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-2 text-purple-600 mb-4">
                  <i className="fas fa-lock h-4 w-4"></i>
                  <p className="text-sm">Vista de solo lectura - Puedes descargar pero no subir documentos</p>
                </div>
                <p className="text-gray-600">Panel de documentos en desarrollo...</p>
              </div>
            </div>
          )}

          {/* ===== Métricas del Equipo ===== */}
          {currentView === "team-metrics" && (
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Métricas del Equipo</h2>
                <p className="text-gray-600">Visualización del rendimiento del equipo</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <p className="text-gray-600">Panel de métricas en desarrollo...</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

/** Icono de engrane simple para evitar más imports */
function SettingsIcon() {
  return (
    <svg className="inline-block mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none">
      <path
        d="M10.325 4.317a1 1 0 011.35 0l.905.79a1 1 0 00.77.236l1.18-.129a1 1 0 011.04.65l.44 1.117a1 1 0 00.58.58l1.118.44a1 1 0 01.65 1.041l-.13 1.18a1 1 0 00.236.77l.79.905a1 1 0 010 1.35l-.79.905a1 1 0 00-.236.77l.129 1.18a1 1 0 01-.65 1.04l-1.117.44a1 1 0 00-.58.58l-.44 1.118a1 1 0 01-1.041.65l-1.18-.13a1 1 0 00-.77.236l-.905.79a1 1 0 01-1.35 0l-.905-.79a1 1 0 00-.77-.236l-1.18.129a1 1 0 01-1.04-.65l-.44-1.117a1 1 0 00-.58-.58l-1.118-.44a1 1 0 01-.65-1.041l.13-1.18a1 1 0 00-.236-.77l-.79-.905a1 1 0 010-1.35l.79-.905a1 1 0 00.236-.77l-.129-1.18a1 1 0 01.65-1.04l1.117-.44a1 1 0 00.58-.58l.44-1.118a1 1 0 011.041-.65l1.18.13a1 1 0 00.77-.236l.905-.79zM12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

