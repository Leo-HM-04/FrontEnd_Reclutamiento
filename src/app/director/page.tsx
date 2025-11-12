// app/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";

type Stats = {
  activeProcesses: number;
  completedCandidates: number;
  successRate: number;
  clientSatisfaction: number;
};

type NotificationItem = {
  id: number;
  message: string;
  time: string;
  icon: string;
};

type Approval = {
  id: number;
  candidate: string;
  email: string;
  position: string;
  department: string;
  client: string;
  score: number;
  supervisor: string;
};

type Activity = {
  id: number;
  type: "success" | "info" | "purple";
  icon: string;
  message: string;
  details: string;
  time: string;
};

type Process = {
  id: number;
  title: string;
  processId: string;
  client: string;
  status: "active" | "paused" | "completed";
  candidates: { current: number; target: number };
  progress: number;
  responsible: string;
  priority: "high" | "medium" | "low";
};

type Candidate = {
  id: number;
  name: string;
  email: string;
  phone: string;
  position: string;
  experience: string;
  score: number;
  status: "approved" | "in-process";
  uploadedAt: string;
};

type ClientCard = {
  id: number;
  name: string;
  industry: string;
  contact: string;
  email: string;
  phone: string;
  status: "active" | "paused";
  activeProcesses: number;
  totalCandidates: number;
  lastActivity: string;
};

type TeamMember = {
  id: number;
  name: string;
  role: string;
  email: string;
  status: "active" | "paused";
  assignedProcesses: number;
  managedCandidates: number;
  successRate: number;
  avatar: string;
};

type DocItem = {
  id: number;
  name: string;
  type: string;
  size: string;
  uploadedBy: string;
  uploadedAt: string;
  category: string;
};

type Client = {
  id: number;
  company_name: string;
  rfc: string;
  industry: string;
  website?: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  contact_position: string;
  address_street: string;
  address_city: string;
  address_state: string;
  address_zip: string;
  address_country: string;
  assigned_to?: number;
  assigned_to_name?: string;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by_name?: string;
  contacts?: ContactPerson[];
  active_profiles_count?: number;
};

type ContactPerson = {
  id: number;
  client: number;
  name: string;
  position: string;
  email: string;
  phone: string;
  is_primary: boolean;
  notes?: string;
  created_at: string;
};

function useDebounce<T extends (...args: any[]) => void>(fn: T, delay = 300) {
  const timeout = useRef<number | null>(null);
  return (...args: Parameters<T>) => {
    if (timeout.current) window.clearTimeout(timeout.current);
    timeout.current = window.setTimeout(() => fn(...args), delay);
  };
}

// Mini toasts locales
type Toast = { id: number; type: "info" | "success" | "warning" | "error"; text: string };
function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = (type: Toast["type"], text: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, type, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
  };
  return {
    toasts,
    info: (t: string) => push("info", t),
    success: (t: string) => push("success", t),
    warning: (t: string) => push("warning", t),
    error: (t: string) => push("error", t),
  };
}

export default function Page() {
  const router = useRouter();
  const { toasts, info, success, warning, error } = useToasts();

  // ====== State principal (equivalente a directorApp) ======
  const [currentView, setCurrentView] = useState<
    "dashboard" | "processes" | "candidates" | "clients" | "team" | "approvals" | "reports" | "documents" | "applications" | "notes" | "history" | "tasks" | "client-list" | "client-contacts" | "client-progress"
  >("dashboard");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [stats, setStats] = useState<Stats>({
    activeProcesses: 0,
    completedCandidates: 0,
    successRate: 0,
    clientSatisfaction: 0,
  });

  const [notifications, setNotifications] = useState<{ unread: number; items: NotificationItem[] }>({
    unread: 0,
    items: [],
  });

  const [pendingApprovals, setPendingApprovals] = useState<Approval[]>([]);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [clients, setClients] = useState<ClientCard[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [documents, setDocuments] = useState<DocItem[]>([]);

  // Estado para tareas de Celery
  const [celeryData, setCeleryData] = useState<any>(null);
  const [celeryGroups, setCeleryGroups] = useState<any>(null);

  // Estado para clientes
  const [clientsData, setClientsData] = useState<Client[]>([]);
  const [contactsData, setContactsData] = useState<ContactPerson[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Dropdowns
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [candidatesMenuOpen, setCandidatesMenuOpen] = useState(false);
  const [clientsMenuOpen, setClientsMenuOpen] = useState(false);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [showRejectReason, setShowRejectReason] = useState(false);
  const [showCandidateForm, setShowCandidateForm] = useState(false);
  const [showSocialNetworks, setShowSocialNetworks] = useState(false);
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false);
  
  // Estado para fases expandidas en client-progress
  const [expandedPhases, setExpandedPhases] = useState<Set<number>>(new Set());

  // Estados del formulario de aplicación
  const [applicationForm, setApplicationForm] = useState({
    candidato: '',
    perfil: '',
    estadoAplicacion: 'Aplicó',
    fechaAplicacion: '',
    porcentajeCoincidencia: '',
    calificacionGeneral: '',
    notas: '',
    fechaEntrevista: '',
    horaEntrevista: '',
    fechaOferta: '',
    horaOferta: '',
    razonRechazo: ''
  });

  // Estados del formulario de candidato
  const [candidateForm, setCandidateForm] = useState({
    // Información Personal
    nombres: '',
    apellidos: '',
    fullName: '',
    correoElectronico: '',
    telefono: '',
    telefonoAlternativo: '',
    
    // Ubicación
    ciudad: '',
    estado: '',
    pais: 'México',
    direccionCompleta: '',
    
    // Información Profesional
    posicionActual: '',
    empresaActual: '',
    anosExperiencia: 0,
    nivelEstudios: '',
    universidad: '',
    carreraTitulo: '',
    habilidades: '',
    idiomas: '',
    certificaciones: '',
    
    // Expectativas Salariales
    expectativaSalarialMinima: '',
    expectativaSalarialMaxima: '',
    moneda: 'MXN',
    salaryExpectationRange: 'No especificado',
    
    // Disponibilidad
    disponibleDesde: '',
    diasPreviso: '',
    
    // Gestión
    estadoCandidato: 'Nuevo',
    asignadoA: '',
    fuenteReclutamiento: '',
    notasInternas: '',
    
    // Redes Sociales
    linkedin: '',
    portfolio: '',
    github: '',
    
    // Análisis de IA
    resumenGeneradoIA: '',
    puntuacionCoincidenciaIA: '',
    analisisCompletoIA: '',
    
    // Metadatos
    creadoPor: '',
    fechaCreacion: '',
    ultimaActualizacion: '',
    activeApplications: ''
  });

  // ====== Chart.js ======
  const processChartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<any>(null);

  // ====== Carga inicial ======
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        await loadDashboardData();
        setupCharts();
        // Actualizaciones cada 30s
        const id = setInterval(() => loadDashboardData(), 30000);
        return () => clearInterval(id);
      } catch (e) {
        console.error(e);
        error("Error cargando el dashboard");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cargar datos de Celery cuando la vista sea "tasks"
  useEffect(() => {
    if (currentView === "tasks") {
      loadCeleryData();
      // Actualizar cada 10 segundos cuando se esté viendo la sección de tareas
      const interval = setInterval(loadCeleryData, 10000);
      return () => clearInterval(interval);
    }
  }, [currentView]);

  // Cargar datos de clientes cuando sea necesario
  useEffect(() => {
    if (currentView === "client-list" || currentView === "clients") {
      loadClientsData();
    } else if (currentView === "client-contacts") {
      loadContactsData();
    }
  }, [currentView]);

  function setupCharts() {
    const anyChart = (window as any).Chart;
    if (!anyChart || !processChartRef.current) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    chartInstanceRef.current = new anyChart(processChartRef.current, {
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
  }

  async function loadDashboardData() {
    // Mock data (igual que tu HTML)
    setStats({ activeProcesses: 12, completedCandidates: 25, successRate: 85, clientSatisfaction: 4.7 });

    setNotifications({
      unread: 3,
      items: [
        { id: 1, message: "Nuevo candidato requiere aprobación", time: "Hace 5 min", icon: "fas fa-user-plus" },
        { id: 2, message: "Reporte mensual disponible", time: "Hace 1 hora", icon: "fas fa-chart-bar" },
        { id: 3, message: "Cliente TechCorp agregó feedback", time: "Hace 2 horas", icon: "fas fa-comment" },
      ],
    });

    setPendingApprovals([
      {
        id: 1,
        candidate: "María García López",
        email: "maria.garcia@email.com",
        position: "Desarrolladora Frontend",
        department: "Tecnología",
        client: "TechCorp S.A.",
        score: 92,
        supervisor: "Juan Pérez",
      },
      {
        id: 2,
        candidate: "Carlos López Ruiz",
        email: "carlos.lopez@email.com",
        position: "DevOps Engineer",
        department: "Infraestructura",
        client: "StartupXYZ",
        score: 88,
        supervisor: "Ana Martínez",
      },
      {
        id: 3,
        candidate: "Ana Martínez Silva",
        email: "ana.martinez@email.com",
        position: "Product Manager",
        department: "Producto",
        client: "InnovaCorp",
        score: 85,
        supervisor: "Carlos Ruiz",
      },
    ]);

    setRecentActivity([
      { id: 1, type: "success", icon: "fas fa-check", message: "Candidato aprobado para TechCorp", details: "Juan Pérez - Desarrollador Senior", time: "Hace 2 horas" },
      { id: 2, type: "info", icon: "fas fa-file-alt", message: "Nuevo reporte generado", details: "Reporte mensual de actividad", time: "Hace 4 horas" },
      { id: 3, type: "purple", icon: "fas fa-building", message: "Nuevo cliente registrado", details: "StartupXYZ - 5 posiciones abiertas", time: "Ayer" },
    ]);

    setProcesses([
      {
        id: 1,
        title: "Desarrollador Senior",
        processId: "PROC-001",
        client: "TechCorp",
        status: "active",
        candidates: { current: 12, target: 20 },
        progress: 60,
        responsible: "Ana García",
        priority: "high",
      },
      {
        id: 2,
        title: "Product Manager",
        processId: "PROC-002",
        client: "StartupXYZ",
        status: "active",
        candidates: { current: 8, target: 10 },
        progress: 80,
        responsible: "Carlos Ruiz",
        priority: "medium",
      },
    ]);

    setCandidates([
      { id: 1, name: "Juan Pérez", email: "juan.perez@email.com", phone: "+52 555 123 4567", position: "Desarrollador Senior", experience: "5 años", score: 95, status: "approved", uploadedAt: "Hace 2 horas" },
      { id: 2, name: "María González", email: "maria.gonzalez@email.com", phone: "+52 555 987 6543", position: "Product Manager", experience: "3 años", score: 88, status: "in-process", uploadedAt: "Hace 1 día" },
    ]);

    setClients([
      { id: 1, name: "TechCorp", industry: "Tecnología", contact: "María González", email: "maria@techcorp.com", phone: "+52 555 987 6543", status: "active", activeProcesses: 5, totalCandidates: 45, lastActivity: "Hace 2 días" },
      { id: 2, name: "StartupXYZ", industry: "Fintech", contact: "Pedro López", email: "pedro@startupxyz.com", phone: "+52 555 456 7890", status: "active", activeProcesses: 3, totalCandidates: 25, lastActivity: "Hace 1 semana" },
    ]);

    setTeamMembers([
      { id: 1, name: "Ana García", role: "Recruiter Senior", email: "ana.garcia@company.com", status: "active", assignedProcesses: 8, managedCandidates: 45, successRate: 92, avatar: "Ana+Garcia" },
      { id: 2, name: "Carlos Ruiz", role: "Talent Acquisition", email: "carlos.ruiz@company.com", status: "active", assignedProcesses: 6, managedCandidates: 32, successRate: 88, avatar: "Carlos+Ruiz" },
    ]);

    setDocuments([
      { id: 1, name: "CV_Juan_Perez_2024.pdf", type: "pdf", size: "2.5 MB", uploadedBy: "Ana García", uploadedAt: "Hace 2 horas", category: "CV" },
      { id: 2, name: "Contrato_Maria_Gonzalez.docx", type: "docx", size: "1.2 MB", uploadedBy: "Carlos Ruiz", uploadedAt: "Hace 1 día", category: "Contrato" },
    ]);
  }

  // ====== Acciones (toasts) ======
  const approveCandidate = async (id: number) => {
    setLoading(true);
    try {
      setPendingApprovals((arr) => arr.filter((a) => a.id !== id));
      success("Candidato aprobado exitosamente");
    } catch {
      error("Error al aprobar candidato");
    } finally {
      setLoading(false);
    }
  };

  const rejectCandidate = async (id: number) => {
    setLoading(true);
    try {
      setPendingApprovals((arr) => arr.filter((a) => a.id !== id));
      warning("Candidato rechazado");
    } catch {
      error("Error al rechazar candidato");
    } finally {
      setLoading(false);
    }
  };

  const viewCandidate = (id: number) => info("Abriendo detalles del candidato...");
  const viewProcessDetails = (id: number) => info(`Viendo detalles del proceso ${id}...`);
  const refreshDashboard = async () => {
    await loadDashboardData();
    success("Dashboard actualizado");
  };
  const exportDashboard = () => info("Generando exportación...");
  const openNewProcessModal = () => info("Abriendo formulario de nuevo proceso...");
  const openUploadCVModal = () => info("Abriendo subida de CV...");
  const generateReport = () => info("Generando reporte...");

  const refreshProcesses = () => info("Actualizando procesos...");
  const exportCandidates = () => info("Exportando candidatos...");
  const viewCandidateDetails = (id: number) => info(`Viendo detalles del candidato ${id}...`);
  const addNewClient = () => info("Abriendo formulario de nuevo cliente...");
  const viewClientDetails = (id: number) => info(`Viendo detalles del cliente ${id}...`);
  const addTeamMember = () => info("Abriendo formulario para agregar miembro...");
  const viewTeamMemberProfile = (id: number) => info(`Viendo perfil del miembro ${id}...`);
  const approveAllPending = () => info("Aprobando todas las solicitudes pendientes...");
  const filterApprovals = () => info("Aplicando filtros de aprobaciones...");
  const generateMonthlyReport = () => info("Generando reporte mensual...");
  const exportAllReports = () => info("Exportando todos los reportes...");
  const uploadDocument = () => info("Abriendo subida de documentos...");
  const searchDocuments = () => info("Abriendo búsqueda de documentos...");
  const viewDocument = (id: number) => info(`Viendo documento ${id}...`);
  const downloadDocument = (id: number) => info(`Descargando documento ${id}...`);
  const deleteDocument = (id: number) => warning(`Eliminando documento ${id}...`);

  // ====== Funciones para datos de Celery ======
  const loadCeleryData = async () => {
    try {
      // Verificar si hay token de autenticación
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.warn('No hay token de autenticación disponible');
        warning('Sesión expirada. Por favor, inicia sesión nuevamente.');
        router.push('/auth');
        return;
      }

      console.log('Cargando datos de Celery...');
      
      // Cargar datos por separado para manejar errores individuales
      let tasksData = null;
      let groupsData = null;
      
      try {
        tasksData = await apiClient.getCeleryTasksStatus();
        console.log('Datos de tareas Celery cargados:', tasksData);
      } catch (taskErr: any) {
        console.warn('Error cargando tareas Celery, usando fallback:', taskErr);
        tasksData = {
          active_tasks: { count: 0, tasks: [] },
          scheduled_tasks: { count: 0, tasks: [] },
          statistics: {
            total_tasks: 0,
            successful_tasks: 0,
            failed_tasks: 0,
            pending_tasks: 0,
            retry_tasks: 0
          },
          recent_tasks: [],
          task_types: [],
          workers_status: { active_workers: 0, workers: [] }
        };
      }
      
      try {
        groupsData = await apiClient.getCeleryTaskGroups();
        console.log('Datos de grupos Celery cargados:', groupsData);
      } catch (groupErr: any) {
        console.warn('Error cargando grupos Celery, usando fallback:', groupErr);
        groupsData = {
          groups: {
            ai_services: { name: 'Servicios de IA', statistics: { total: 0, successful: 0, failed: 0, pending: 0 } },
            documents: { name: 'Documentos', statistics: { total: 0, successful: 0, failed: 0, pending: 0 } },
            notifications: { name: 'Notificaciones', statistics: { total: 0, successful: 0, failed: 0, pending: 0 } },
            system: { name: 'Sistema', statistics: { total: 0, successful: 0, failed: 0, pending: 0 } }
          }
        };
      }
      
      setCeleryData(tasksData);
      setCeleryGroups(groupsData);
      success('Datos de sistema actualizados');
    } catch (err: any) {
      console.error('Error general loading Celery data:', err);
      
      // Manejar errores de autenticación que no se capturaron antes
      if (err?.status === 401) {
        warning('Sesión expirada. Redirigiendo al login...');
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        router.push('/auth');
        return;
      }
      
      // Para otros errores, usar datos de fallback ya configurados arriba
      warning('Algunos datos del sistema no están disponibles');
    }
  };

  const refreshCeleryData = async () => {
    setLoading(true);
    try {
      await loadCeleryData();
      success("Datos de tareas actualizados");
    } catch (err) {
      error("Error al actualizar datos de tareas");
    } finally {
      setLoading(false);
    }
  };

  // ====== Funciones para datos de Clientes ======
  const loadClientsData = async () => {
    try {
      const clientsResponse = await apiClient.getClients();
      setClientsData(clientsResponse.results || clientsResponse);
      console.log('Clientes cargados:', clientsResponse);
    } catch (err: any) {
      console.error('Error cargando clientes:', err);
      console.error('Error details:', {
        message: err.message,
        status: err.status,
        response: err.response
      });
      if (err?.status === 401) {
        warning('Sesión expirada');
        router.push('/auth');
      } else {
        error(`Error al cargar clientes: ${err.message || 'Error desconocido'}`);
      }
    }
  };

  const loadContactsData = async (clientId?: number) => {
    try {
      const params = clientId ? { client: clientId } : {};
      const contactsResponse = await apiClient.getContacts(params);
      setContactsData(contactsResponse.results || contactsResponse);
      console.log('Contactos cargados:', contactsResponse);
    } catch (err: any) {
      console.error('Error cargando contactos:', err);
      console.error('Error details:', {
        message: err.message,
        status: err.status,
        response: err.response
      });
      error(`Error al cargar contactos: ${err.message || 'Error desconocido'}`);
    }
  };

  const createClient = async (clientData: Partial<Client>) => {
    try {
      setLoading(true);
      const newClient = await apiClient.createClient(clientData);
      await loadClientsData(); // Recargar lista
      success('Cliente creado exitosamente');
      return newClient;
    } catch (err: any) {
      console.error('Error creando cliente:', err);
      error('Error al crear cliente');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateClient = async (id: number, clientData: Partial<Client>) => {
    try {
      setLoading(true);
      const updatedClient = await apiClient.updateClient(id, clientData);
      await loadClientsData(); // Recargar lista
      success('Cliente actualizado exitosamente');
      return updatedClient;
    } catch (err: any) {
      console.error('Error actualizando cliente:', err);
      error('Error al actualizar cliente');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteClient = async (id: number) => {
    try {
      setLoading(true);
      await apiClient.deleteClient(id);
      await loadClientsData(); // Recargar lista
      success('Cliente eliminado exitosamente');
    } catch (err: any) {
      console.error('Error eliminando cliente:', err);
      error('Error al eliminar cliente');
    } finally {
      setLoading(false);
    }
  };

  const createContact = async (contactData: Partial<ContactPerson>) => {
    try {
      setLoading(true);
      const newContact = await apiClient.createContact(contactData);
      await loadContactsData(); // Recargar lista
      success('Contacto creado exitosamente');
      return newContact;
    } catch (err: any) {
      console.error('Error creando contacto:', err);
      error('Error al crear contacto');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateContact = async (id: number, contactData: Partial<ContactPerson>) => {
    try {
      setLoading(true);
      const updatedContact = await apiClient.updateContact(id, contactData);
      await loadContactsData(); // Recargar lista
      success('Contacto actualizado exitosamente');
      return updatedContact;
    } catch (err: any) {
      console.error('Error actualizando contacto:', err);
      error('Error al actualizar contacto');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteContact = async (id: number) => {
    try {
      setLoading(true);
      await apiClient.deleteContact(id);
      await loadContactsData(); // Recargar lista
      success('Contacto eliminado exitosamente');
    } catch (err: any) {
      console.error('Error eliminando contacto:', err);
      error('Error al eliminar contacto');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    setTimeout(() => router.push("/login"), 300);
  };

  const debouncedSearch = useDebounce((q: string) => {
    if (q.trim().length > 2) info(`Buscando: ${q}`);
  }, 300);

  // ====== Helpers UI ======
  const getNavItemClass = (view: typeof currentView) =>
    currentView === view
      ? "bg-primary-50 text-primary-700 border-r-2 border-primary-600"
      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900";

  // Close dropdowns al hacer click fuera (click global)
  useEffect(() => {
    const closeAll = () => {
      setNotifOpen(false);
      setProfileOpen(false);
    };
    window.addEventListener("click", closeAll);
    return () => window.removeEventListener("click", closeAll);
  }, []);

  // Evitar que clicks internos cierren dropdowns
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div className="min-h-screen" onClick={() => {}}>
      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
            <p className="text-gray-600">Cargando dashboard...</p>
          </div>
        </div>
      )}

      {/* Toasts */}
      <div className="fixed top-4 right-4 z-60 space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`px-4 py-2 rounded-lg shadow text-white ${
              t.type === "success"
                ? "bg-green-600"
                : t.type === "warning"
                ? "bg-yellow-600"
                : t.type === "error"
                ? "bg-red-600"
                : "bg-gray-800"
            }`}
          >
            {t.text}
          </div>
        ))}
      </div>

      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 relative z-10">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo y Título */}
            <div className="flex items-center">
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden mr-4 text-gray-600 hover:text-gray-900"
              >
                <i className="fas fa-bars text-xl"></i>
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-linear-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                  <i className="fas fa-users text-white text-sm"></i>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Sistema de Reclutamiento</h1>
                  <p className="text-xs text-gray-500">Panel Directivo</p>
                </div>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="hidden md:flex items-center">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Buscar candidatos, procesos..." 
                    className="w-64 px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      debouncedSearch(e.target.value);
                    }}
                  />
                  <i className="fas fa-search absolute left-3 top-3 text-gray-400"></i>
                </div>
              </div>

              {/* Notificaciones */}
              <div className="relative" onClick={stop}>
                <button 
                  onClick={() => setNotifOpen(!notifOpen)}
                  className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <i className="fas fa-bell text-xl"></i>
                  {notifications.unread > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                    <div className="px-4 py-2 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-900">Notificaciones</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.items.length === 0 ? (
                        <div className="px-4 py-8 text-center text-gray-500">
                          <i className="fas fa-bell text-3xl mb-2"></i>
                          <p>No hay notificaciones</p>
                        </div>
                      ) : (
                        notifications.items.map((n) => (
                          <div key={n.id} className="px-4 py-3 hover:bg-gray-50 cursor-pointer">
                            <div className="flex items-start space-x-3">
                              <i className={`${n.icon} text-blue-600 text-sm mt-1`}></i>
                              <div className="flex-1">
                                <p className="text-sm text-gray-900">{n.message}</p>
                                <p className="text-xs text-gray-500">{n.time}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Menu */}
              <div className="relative" onClick={stop}>
                <button 
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">DR</span>
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-gray-900">Director RH</p>
                    <p className="text-xs text-gray-500">Director</p>
                  </div>
                  <i className="fas fa-chevron-down text-gray-400 text-xs"></i>
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                    <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      <i className="fas fa-user mr-2"></i>Mi Perfil
                    </a>
                    <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      <i className="fas fa-cog mr-2"></i>Configuración
                    </a>
                    <hr className="my-2" />
                    <button 
                      onClick={logout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      <i className="fas fa-sign-out-alt mr-2"></i>Cerrar Sesión
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Layout: Sidebar + Main Content */}
      <div className="flex">
        {/* Sidebar */}
        <aside className={`fixed inset-y-0 left-0 top-16 w-64 bg-white border-r border-gray-200 overflow-y-auto transition-transform duration-300 ease-in-out z-20 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}>
          {/* Sidebar Header */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 shrink-0 bg-linear-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                <i className="fas fa-chart-line text-white text-sm"></i>
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold text-gray-900 truncate">Panel de Control</h2>
                <p className="text-xs text-gray-500 truncate">Director RH</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="p-4">
            <ul className="space-y-1">
              <li>
                <button onClick={() => setCurrentView("dashboard")} className={`sidebar-item flex items-center px-3 py-2 text-sm font-medium rounded-lg cursor-pointer transition-all w-full ${getNavItemClass("dashboard")}`}>
                  <i className="fas fa-chart-line mr-3 w-5" />
                  Dashboard
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentView("processes")} className={`sidebar-item flex items-center px-3 py-2 text-sm font-medium rounded-lg cursor-pointer transition-all w-full ${getNavItemClass("processes")}`}>
                  <i className="fas fa-cogs mr-3 w-5" />
                  Procesos
                  {stats.activeProcesses > 0 && (
                    <span className="ml-auto bg-primary-100 text-primary-800 text-xs px-2 py-1 rounded-full">
                      {stats.activeProcesses}
                    </span>
                  )}
                </button>
              </li>
              <li>
                <div>
                  <button onClick={() => setCandidatesMenuOpen(!candidatesMenuOpen)} className={`sidebar-item flex items-center px-3 py-2 text-sm font-medium rounded-lg cursor-pointer transition-all w-full ${getNavItemClass("candidates")}`}>
                    <i className="fas fa-user-tie mr-3 w-5" />
                    Candidatos
                    <i className={`fas fa-chevron-${candidatesMenuOpen ? 'down' : 'right'} ml-auto text-xs transition-transform`} />
                  </button>
                  {candidatesMenuOpen && (
                    <ul className="ml-8 mt-1 space-y-1">
                      <li>
                        <button onClick={() => setCurrentView("candidates")} className={`sidebar-item flex items-center px-3 py-2 text-sm font-medium rounded-lg cursor-pointer transition-all w-full ${getNavItemClass("candidates")}`}>
                          <i className="fas fa-users mr-3 w-4" />
                          Ver Candidatos
                        </button>
                      </li>
                      <li>
                        <button onClick={() => setCurrentView("applications")} className={`sidebar-item flex items-center px-3 py-2 text-sm font-medium rounded-lg cursor-pointer transition-all w-full ${getNavItemClass("applications")}`}>
                          <i className="fas fa-briefcase mr-3 w-4" />
                          Aplicaciones
                        </button>
                      </li>
                      <li>
                        <button onClick={() => setCurrentView("documents")} className={`sidebar-item flex items-center px-3 py-2 text-sm font-medium rounded-lg cursor-pointer transition-all w-full ${getNavItemClass("documents")}`}>
                          <i className="fas fa-folder-open mr-3 w-4" />
                          Documentos
                        </button>
                      </li>
                      <li>
                        <button onClick={() => setCurrentView("notes")} className={`sidebar-item flex items-center px-3 py-2 text-sm font-medium rounded-lg cursor-pointer transition-all w-full ${getNavItemClass("notes")}`}>
                          <i className="fas fa-sticky-note mr-3 w-4" />
                          Notas
                        </button>
                      </li>
                      <li>
                        <button onClick={() => setCurrentView("history")} className={`sidebar-item flex items-center px-3 py-2 text-sm font-medium rounded-lg cursor-pointer transition-all w-full ${getNavItemClass("history")}`}>
                          <i className="fas fa-history mr-3 w-4" />
                          Historial
                        </button>
                      </li>
                    </ul>
                  )}
                </div>
              </li>
              <li>
                <button 
                  onClick={() => setClientsMenuOpen(!clientsMenuOpen)} 
                  className={`sidebar-item flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg cursor-pointer transition-all w-full ${
                    currentView === "clients" || currentView === "client-list" || currentView === "client-contacts" 
                      ? "bg-primary-50 text-primary-600 border-r-2 border-primary-600" 
                      : "text-gray-700 hover:text-primary-600 hover:bg-primary-50"
                  }`}
                >
                  <div className="flex items-center">
                    <i className="fas fa-building mr-3 w-5" />
                    Clientes
                  </div>
                  <i className={`fas fa-chevron-${clientsMenuOpen ? 'down' : 'right'} ml-auto text-xs transition-all duration-200`} />
                </button>
                
                {/* Submenu de Clientes */}
                <div className={`overflow-hidden transition-all duration-300 ${clientsMenuOpen ? "max-h-40" : "max-h-0"}`}>
                  <div className="ml-6 mt-2 space-y-1">
                    <button 
                      onClick={() => setCurrentView("client-list")} 
                      className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                        currentView === "client-list" 
                          ? "bg-primary-100 text-primary-700" 
                          : "text-gray-600 hover:text-primary-600 hover:bg-primary-50"
                      }`}
                    >
                      <i className="fas fa-building mr-2" />
                      Clientes
                    </button>
                    <button 
                      onClick={() => setCurrentView("client-contacts")} 
                      className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                        currentView === "client-contacts" 
                          ? "bg-primary-100 text-primary-700" 
                          : "text-gray-600 hover:text-primary-600 hover:bg-primary-50"
                      }`}
                    >
                      <i className="fas fa-address-book mr-2" />
                      Contactos
                    </button>
                  </div>
                </div>
              </li>
              <li>
                <button onClick={() => setCurrentView("client-progress")} className={`sidebar-item flex items-center px-3 py-2 text-sm font-medium rounded-lg cursor-pointer transition-all w-full ${getNavItemClass("client-progress")}`}>
                  <i className="fas fa-chart-line mr-3 w-5" />
                  Avance de Cliente
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentView("team")} className={`sidebar-item flex items-center px-3 py-2 text-sm font-medium rounded-lg cursor-pointer transition-all w-full ${getNavItemClass("team")}`}>
                  <i className="fas fa-users mr-3 w-5" />
                  Equipo
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentView("approvals")} className={`sidebar-item flex items-center px-3 py-2 text-sm font-medium rounded-lg cursor-pointer transition-all w-full ${getNavItemClass("approvals")}`}>
                  <i className="fas fa-check-circle mr-3 w-5" />
                  Aprobaciones
                  {pendingApprovals.length > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      {pendingApprovals.length}
                    </span>
                  )}
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentView("reports")} className={`sidebar-item flex items-center px-3 py-2 text-sm font-medium rounded-lg cursor-pointer transition-all w-full ${getNavItemClass("reports")}`}>
                  <i className="fas fa-chart-bar mr-3 w-5" />
                  Reportes
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentView("tasks")} className={`sidebar-item flex items-center px-3 py-2 text-sm font-medium rounded-lg cursor-pointer transition-all w-full ${getNavItemClass("tasks")}`}>
                  <i className="fas fa-cogs mr-3 w-5" />
                  Tareas de Sistema
                </button>
              </li>

            </ul>

            {/* Quick Actions */}
            <div className="mt-8 pt-6 border-t border-gray-100">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Acciones Rápidas</h3>
              <div className="space-y-2">
                <button onClick={openNewProcessModal} className="w-full flex items-center px-3 py-2 text-sm text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                  <i className="fas fa-plus mr-3" />
                  Nuevo Proceso
                </button>
                <button onClick={openUploadCVModal} className="w-full flex items-center px-3 py-2 text-sm text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                  <i className="fas fa-upload mr-3" />
                  Subir CV
                </button>
                <button onClick={generateReport} className="w-full flex items-center px-3 py-2 text-sm text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                  <i className="fas fa-download mr-3" />
                  Generar Reporte
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 pt-16 lg:ml-64 bg-gray-50">
          {/* DASHBOARD */}
          {currentView === "dashboard" && (
            <div className="p-6">
              {/* Encabezado */}
              <div className="mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900">Panel Directivo</h2>
                    <p className="text-gray-600 mt-1">Resumen ejecutivo del sistema de reclutamiento</p>
                  </div>
                  <div className="mt-4 sm:mt-0 flex space-x-3">
                    <button
                      onClick={refreshDashboard}
                      className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <i className="fas fa-sync mr-2" />
                      Actualizar
                    </button>
                    <button
                      onClick={exportDashboard}
                      className="px-4 py-2 btn-primary text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <i className="fas fa-download mr-2" />
                      Exportar
                    </button>
                  </div>
                </div>
              </div>

              {/* KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="card bg-white rounded-xl shadow-sm border border-gray-200 p-6 card-hover">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Procesos Activos</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{stats.activeProcesses}</p>
                      <div className="flex items-center mt-2 text-sm">
                        <span className="text-green-600 flex items-center">
                          <i className="fas fa-arrow-up mr-1" /> +15%
                        </span>
                        <span className="text-gray-500 ml-1">vs mes anterior</span>
                      </div>
                    </div>
                    <div className="p-3 gradient-primary rounded-lg">
                      <i className="fas fa-briefcase text-white text-xl" />
                    </div>
                  </div>
                </div>

                <div className="card bg-white rounded-xl shadow-sm border border-gray-200 p-6 card-hover">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Candidatos Finalizados</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{stats.completedCandidates}</p>
                      <div className="flex items-center mt-2 text-sm">
                        <span className="text-green-600 flex items-center">
                          <i className="fas fa-arrow-up mr-1" /> +8%
                        </span>
                        <span className="text-gray-500 ml-1">vs mes anterior</span>
                      </div>
                    </div>
                    <div className="p-3 gradient-success rounded-lg">
                      <i className="fas fa-user-check text-white text-xl" />
                    </div>
                  </div>
                </div>

                <div className="card bg-white rounded-xl shadow-sm border border-gray-200 p-6 card-hover">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Tasa de Éxito</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{stats.successRate}%</p>
                      <div className="flex items-center mt-2 text-sm">
                        <span className="text-green-600 flex items-center">
                          <i className="fas fa-arrow-up mr-1" /> +3%
                        </span>
                        <span className="text-gray-500 ml-1">vs mes anterior</span>
                      </div>
                    </div>
                    <div className="p-3 gradient-warning rounded-lg">
                      <i className="fas fa-percentage text-white text-xl" />
                    </div>
                  </div>
                </div>

                <div className="card bg-white rounded-xl shadow-sm border border-gray-200 p-6 card-hover">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Satisfacción Cliente</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{stats.clientSatisfaction}/5</p>
                      <div className="flex items-center mt-2 text-sm">
                        <span className="text-green-600 flex items-center">
                          <i className="fas fa-arrow-up mr-1" /> +0.3
                        </span>
                        <span className="text-gray-500 ml-1">vs mes anterior</span>
                      </div>
                    </div>
                    <div className="p-3 gradient-purple rounded-lg">
                      <i className="fas fa-star text-white text-xl" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts & actividad */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="card bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Procesos por Estado</h3>
                    <button className="text-gray-400 hover:text-gray-600">
                      <i className="fas fa-ellipsis-h" />
                    </button>
                  </div>
                  <div className="max-h-64" style={{ height: 256 }}>
                    <canvas ref={processChartRef} />
                  </div>
                </div>

                <div className="card bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Actividad Reciente</h3>
                    <a href="#" className="text-sm text-primary-600 hover:text-primary-700">
                      Ver todo
                    </a>
                  </div>
                  <div className="space-y-4 max-h-64 overflow-y-auto custom-scrollbar">
                    {recentActivity.map((a) => {
                      const color =
                        a.type === "success" ? "bg-green-100 text-green-600" : a.type === "info" ? "bg-blue-100 text-blue-600" : "bg-purple-100 text-purple-600";
                      return (
                        <div key={a.id} className="flex items-start space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${color.split(" ").slice(0, 1).join(" ")}`}>
                            <i className={`${a.icon} ${color.split(" ").slice(1).join(" ")}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900">{a.message}</p>
                            <p className="text-xs text-gray-500">{a.details}</p>
                            <p className="text-xs text-gray-400">{a.time}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Aprobaciones pendientes */}
              <div className="card bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Aprobaciones Pendientes</h3>
                    <span className="bg-red-100 text-red-800 text-xs font-medium px-3 py-1 rounded-full">
                      {pendingApprovals.length} pendientes
                    </span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {["Candidato", "Posición", "Cliente", "Score IA", "Supervisor", "Acciones"].map((h) => (
                          <th key={h} className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${h === "Acciones" ? "text-right" : "text-left"}`}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {pendingApprovals.map((a) => (
                        <tr key={a.id} className="table-row">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <img
                                className="h-10 w-10 rounded-full border-2 border-gray-200"
                                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(a.candidate)}&background=random`}
                                alt={a.candidate}
                              />
                              <div className="ml-3">
                                <p className="text-sm font-medium text-gray-900">{a.candidate}</p>
                                <p className="text-xs text-gray-500">{a.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <p className="text-sm text-gray-900">{a.position}</p>
                            <p className="text-xs text-gray-500">{a.department}</p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{a.client}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                a.score >= 90 ? "bg-green-100 text-green-800" : a.score >= 80 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"
                              }`}
                            >
                              {a.score}%
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{a.supervisor}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <button onClick={() => approveCandidate(a.id)} className="text-green-600 hover:text-green-900 p-1 rounded" title="Aprobar">
                                <i className="fas fa-check" />
                              </button>
                              <button onClick={() => rejectCandidate(a.id)} className="text-red-600 hover:text-red-900 p-1 rounded" title="Rechazar">
                                <i className="fas fa-times" />
                              </button>
                              <button onClick={() => viewCandidate(a.id)} className="text-blue-600 hover:text-blue-900 p-1 rounded" title="Ver detalles">
                                <i className="fas fa-eye" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {pendingApprovals.length === 0 && (
                  <div className="text-center py-12 empty-state">
                    <i className="fas fa-check-circle text-6xl text-gray-300 mb-4" />
                    <p className="text-gray-500">No hay aprobaciones pendientes</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PROCESSES */}
          {currentView === "processes" && (
            <div className="p-6">
              <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Gestión de Procesos</h2>
                  <p className="text-gray-600 mt-1">Administra y supervisa todos los procesos de reclutamiento activos</p>
                </div>
                <div className="mt-4 sm:mt-0 flex space-x-3">
                  <button
                    onClick={refreshProcesses}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <i className="fas fa-sync mr-2" />
                    Actualizar
                  </button>
                  <button onClick={openNewProcessModal} className="px-4 py-2 btn-primary text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <i className="fas fa-plus mr-2" />
                    Nuevo Proceso
                  </button>
                </div>
              </div>

              {/* Filtros (visual) */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {["Estado", "Cliente", "Prioridad"].map((label, i) => (
                    <div key={label}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
                      <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500">
                        <option value="">Todos</option>
                        {i === 0 && (
                          <>
                            <option value="active">Activos</option>
                            <option value="paused">Pausados</option>
                            <option value="completed">Completados</option>
                          </>
                        )}
                        {i === 1 && (
                          <>
                            <option value="TechCorp">TechCorp</option>
                            <option value="StartupXYZ">StartupXYZ</option>
                            <option value="Innovate">Innovate Inc</option>
                          </>
                        )}
                        {i === 2 && (
                          <>
                            <option value="high">Alta</option>
                            <option value="medium">Media</option>
                            <option value="low">Baja</option>
                          </>
                        )}
                      </select>
                    </div>
                  ))}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Buscar proceso..."
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <i className="fas fa-search absolute left-3 top-3 text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabla */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900">Procesos Activos</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {["Proceso", "Cliente", "Estado", "Candidatos", "Progreso", "Responsable", "Acciones"].map((h) => (
                          <th key={h} className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${h === "Acciones" ? "text-right" : "text-left"}`}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {processes.map((p) => (
                        <tr key={p.id} className="table-row">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{p.title}</p>
                              <p className="text-xs text-gray-500">ID: {p.processId}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.client}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                p.status === "active"
                                  ? "bg-green-100 text-green-800"
                                  : p.status === "paused"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {p.status === "active" ? "Activo" : p.status === "paused" ? "Pausado" : "Completado"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {p.candidates.current} / {p.candidates.target}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div className="bg-primary-600 h-2 rounded-full" style={{ width: `${p.progress}%` }} />
                            </div>
                            <span className="text-xs text-gray-500 mt-1 inline-block">{p.progress}%</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.responsible}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <button onClick={() => viewProcessDetails(p.id)} className="text-blue-600 hover:text-blue-900 p-1 rounded" title="Ver detalles">
                                <i className="fas fa-eye" />
                              </button>
                              <button onClick={() => info(`Editando proceso ${p.id}...`)} className="text-green-600 hover:text-green-900 p-1 rounded" title="Editar">
                                <i className="fas fa-edit" />
                              </button>
                              <button onClick={() => warning(`Pausando proceso ${p.id}...`)} className="text-red-600 hover:text-red-900 p-1 rounded" title="Pausar">
                                <i className="fas fa-pause" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* CANDIDATES */}
          {currentView === "candidates" && (
            <div className="p-6">
              <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Gestión de Candidatos</h2>
                  <p className="text-gray-600 mt-1">Visualiza y administra todos los candidatos en el sistema</p>
                </div>
                <div className="mt-4 sm:mt-0 flex space-x-3">
                  <button onClick={exportCandidates} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                    <i className="fas fa-download mr-2" />
                    Exportar
                  </button>
                  <button onClick={openUploadCVModal} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                    <i className="fas fa-upload mr-2" />
                    Subir CV
                  </button>
                  <button onClick={() => setShowCandidateForm(true)} className="px-4 py-2 btn-primary text-white rounded-lg">
                    <i className="fas fa-user-plus mr-2" />
                    Agregar Candidato
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="card-hover bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-blue-100">
                      <i className="fas fa-user-tie text-blue-600 text-xl" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Candidatos</p>
                      <p className="text-2xl font-bold text-gray-900">1,247</p>
                    </div>
                  </div>
                </div>
                <div className="card-hover bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-green-100">
                      <i className="fas fa-check-circle text-green-600 text-xl" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Aprobados</p>
                      <p className="text-2xl font-bold text-gray-900">289</p>
                    </div>
                  </div>
                </div>
                <div className="card-hover bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-yellow-100">
                      <i className="fas fa-clock text-yellow-600 text-xl" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">En Proceso</p>
                      <p className="text-2xl font-bold text-gray-900">156</p>
                    </div>
                  </div>
                </div>
                <div className="card-hover bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-purple-100">
                      <i className="fas fa-star text-purple-600 text-xl" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Top Rated</p>
                      <p className="text-2xl font-bold text-gray-900">67</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid candidatos */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {candidates.map((c) => (
                  <div key={c.id} className="card-hover bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        <img
                          className="h-12 w-12 rounded-full border-2 border-gray-200"
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=3b82f6&color=fff`}
                          alt={c.name}
                        />
                        <div className="ml-3">
                          <h3 className="text-sm font-semibold text-gray-900">{c.name}</h3>
                          <p className="text-xs text-gray-500">{c.position}</p>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          c.score >= 90 ? "bg-green-100 text-green-800" : c.score >= 80 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"
                        }`}
                      >
                        {c.score}%
                      </span>
                    </div>
                    <div className="space-y-2 mb-4 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Email:</span>
                        <span className="text-gray-900">{c.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Teléfono:</span>
                        <span className="text-gray-900">{c.phone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Experiencia:</span>
                        <span className="text-gray-900">{c.experience}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex space-x-2">
                        <button onClick={() => viewCandidateDetails(c.id)} className="text-blue-600 hover:text-blue-700 p-1 rounded" title="Ver detalles">
                          <i className="fas fa-eye text-sm" />
                        </button>
                        <button onClick={() => downloadDocument(c.id)} className="text-green-600 hover:text-green-700 p-1 rounded" title="Descargar CV">
                          <i className="fas fa-download text-sm" />
                        </button>
                        <button onClick={() => info(`Contactando candidato ${c.id}...`)} className="text-purple-600 hover:text-purple-700 p-1 rounded" title="Contactar">
                          <i className="fas fa-envelope text-sm" />
                        </button>
                      </div>
                      <span className="text-xs text-gray-500">{c.uploadedAt}</span>
                    </div>
                  </div>
                ))}

                {candidates.length === 0 && (
                  <div className="col-span-full text-center py-12 empty-state">
                    <i className="fas fa-user-tie text-6xl text-gray-300 mb-4" />
                    <p className="text-gray-500">No hay candidatos registrados</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* APPLICATIONS */}
          {currentView === "applications" && (
            <div className="p-6">
              <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Aplicaciones de Candidatos</h2>
                  <p className="text-gray-600 mt-1">Gestiona y da seguimiento a todas las aplicaciones de candidatos</p>
                </div>
                <div className="mt-4 sm:mt-0 flex space-x-3">
                  <button onClick={() => info("Exportando aplicaciones...")} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                    <i className="fas fa-download mr-2" />
                    Exportar
                  </button>
                  <button onClick={() => setShowApplicationForm(true)} className="px-4 py-2 btn-primary text-white rounded-lg">
                    <i className="fas fa-plus mr-2" />
                    Nueva Aplicación
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="card-hover bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-blue-100">
                      <i className="fas fa-briefcase text-blue-600 text-xl" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Aplicaciones</p>
                      <p className="text-2xl font-bold text-gray-900">324</p>
                    </div>
                  </div>
                </div>
                <div className="card-hover bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-green-100">
                      <i className="fas fa-check-circle text-green-600 text-xl" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Preseleccionados</p>
                      <p className="text-2xl font-bold text-gray-900">89</p>
                    </div>
                  </div>
                </div>
                <div className="card-hover bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-yellow-100">
                      <i className="fas fa-clock text-yellow-600 text-xl" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">En Revisión</p>
                      <p className="text-2xl font-bold text-gray-900">156</p>
                    </div>
                  </div>
                </div>
                <div className="card-hover bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-purple-100">
                      <i className="fas fa-percentage text-purple-600 text-xl" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Tasa Conversión</p>
                      <p className="text-2xl font-bold text-gray-900">27%</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Aplicaciones Recientes</h3>
                  <div className="flex space-x-3">
                    <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                      <option>Todos los estados</option>
                      <option>En Revisión</option>
                      <option>Preseleccionado</option>
                      <option>Rechazado</option>
                    </select>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Candidato</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Posición</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Compatibilidad</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      <tr className="table-row">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">JP</div>
                            <div className="ml-4">
                              <p className="font-medium text-gray-900">Juan Pérez García</p>
                              <p className="text-gray-500">juan.perez@email.com</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-gray-900">Desarrollador Full Stack Senior</p>
                          <p className="text-gray-500">Tecnología</p>
                        </td>
                        <td className="px-6 py-4 text-gray-900">01 Nov 2024</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                              <div className="bg-green-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                            </div>
                            <span className="text-sm font-medium text-green-600">85%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Preseleccionado</span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button className="text-blue-600 hover:text-blue-900"><i className="fas fa-eye" /></button>
                          <button className="text-green-600 hover:text-green-900"><i className="fas fa-edit" /></button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* DOCUMENTS */}
          {currentView === "documents" && (
            <div className="p-6">
              <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Documentos de Candidatos</h2>
                  <p className="text-gray-600 mt-1">Gestiona todos los documentos y archivos de candidatos</p>
                </div>
                <div className="mt-4 sm:mt-0 flex space-x-3">
                  <button onClick={() => info("Buscando documentos...")} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                    <i className="fas fa-search mr-2" />
                    Buscar
                  </button>
                  <button onClick={() => info("Subiendo documento...")} className="px-4 py-2 btn-primary text-white rounded-lg">
                    <i className="fas fa-upload mr-2" />
                    Subir Documento
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="card-hover bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-red-100">
                      <i className="fas fa-file-pdf text-red-600 text-xl" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">CVs</p>
                      <p className="text-2xl font-bold text-gray-900">1,247</p>
                    </div>
                  </div>
                </div>
                <div className="card-hover bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-green-100">
                      <i className="fas fa-certificate text-green-600 text-xl" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Certificados</p>
                      <p className="text-2xl font-bold text-gray-900">89</p>
                    </div>
                  </div>
                </div>
                <div className="card-hover bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-purple-100">
                      <i className="fas fa-folder text-purple-600 text-xl" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Portafolios</p>
                      <p className="text-2xl font-bold text-gray-900">156</p>
                    </div>
                  </div>
                </div>
                <div className="card-hover bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-blue-100">
                      <i className="fas fa-file-alt text-blue-600 text-xl" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Referencias</p>
                      <p className="text-2xl font-bold text-gray-900">67</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Documentos Recientes</h3>
                  <div className="flex space-x-3">
                    <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                      <option>Todos los tipos</option>
                      <option>CVs</option>
                      <option>Certificados</option>
                      <option>Portafolios</option>
                    </select>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Documento</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Candidato</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tamaño</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      <tr className="table-row">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <i className="fas fa-file-pdf text-red-500 text-xl mr-3" />
                            <div>
                              <p className="font-medium text-gray-900">CV_Juan_Perez_2024.pdf</p>
                              <p className="text-gray-500">Currículum actualizado</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">JP</div>
                            <div className="ml-3">
                              <p className="text-gray-900">Juan Pérez García</p>
                              <p className="text-gray-500">juan.perez@email.com</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800">CV</span>
                        </td>
                        <td className="px-6 py-4 text-gray-900">2.3 MB</td>
                        <td className="px-6 py-4 text-gray-900">01 Nov 2024</td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button className="text-blue-600 hover:text-blue-900"><i className="fas fa-eye" /></button>
                          <button className="text-green-600 hover:text-green-900"><i className="fas fa-download" /></button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Modal Formulario Nueva Aplicación */}
          {showApplicationForm && (
            <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden">
                <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-blue-800 text-white p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                        <i className="fas fa-user-plus text-2xl" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">Nueva Aplicación</h2>
                        <p className="text-blue-100 text-sm">Registrar candidato en proceso de selección</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowApplicationForm(false)}
                      className="text-white hover:text-blue-200 bg-white bg-opacity-20 hover:bg-opacity-30 p-2 rounded-lg transition-all duration-200"
                    >
                      <i className="fas fa-times text-xl" />
                    </button>
                  </div>
                </div>

                <div className="p-8 bg-gradient-to-br from-gray-50 to-white overflow-y-auto max-h-[calc(95vh-100px)]">
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    // Aquí se manejará el envío del formulario
                    success("Aplicación creada exitosamente");
                    setShowApplicationForm(false);
                    setShowRejectReason(false);
                    setApplicationForm({
                      candidato: '',
                      perfil: '',
                      estadoAplicacion: 'Aplicó',
                      fechaAplicacion: '',
                      porcentajeCoincidencia: '',
                      calificacionGeneral: '',
                      notas: '',
                      fechaEntrevista: '',
                      horaEntrevista: '',
                      fechaOferta: '',
                      horaOferta: '',
                      razonRechazo: ''
                    });
                  }} className="space-y-8">
                    
                    {/* Sección Aplicación */}
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                            <i className="fas fa-clipboard-list text-lg" />
                          </div>
                          <h3 className="text-lg font-semibold">Información de Aplicación</h3>
                        </div>
                      </div>
                      
                      <div className="p-8 bg-gradient-to-br from-slate-50 to-blue-50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          {/* Campo Candidato */}
                          <div className="bg-white p-5 rounded-xl border-2 border-blue-200 shadow-md space-y-3">
                            <label className="block text-sm font-bold text-gray-800 mb-3">
                              <i className="fas fa-user mr-2 text-blue-600" />
                              Candidato <span className="text-red-500">*</span>
                            </label>
                            <div className="flex shadow-lg rounded-xl overflow-hidden border-2 border-blue-300">
                              <input
                                type="text"
                                value={applicationForm.candidato}
                                onChange={(e) => setApplicationForm({...applicationForm, candidato: e.target.value})}
                                className="flex-1 px-4 py-4 focus:outline-none focus:bg-blue-50 transition-all duration-200 text-gray-800 font-medium"
                                placeholder="Nombre del candidato"
                                required
                              />
                              <button
                                type="button"
                                className="px-5 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 transition-all duration-200"
                              >
                                <i className="fas fa-plus text-lg" />
                              </button>
                              <button
                                type="button"
                                className="px-5 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
                              >
                                <i className="fas fa-eye text-lg" />
                              </button>
                            </div>
                          </div>

                          {/* Campo Perfil */}
                          <div className="bg-white p-5 rounded-xl border-2 border-blue-200 shadow-md space-y-3">
                            <label className="block text-sm font-bold text-gray-800 mb-3">
                              <i className="fas fa-briefcase mr-2 text-blue-600" />
                              Perfil <span className="text-red-500">*</span>
                            </label>
                            <div className="flex shadow-lg rounded-xl overflow-hidden border-2 border-blue-300">
                              <select
                                value={applicationForm.perfil}
                                onChange={(e) => setApplicationForm({...applicationForm, perfil: e.target.value})}
                                className="flex-1 px-4 py-4 focus:outline-none focus:bg-blue-50 transition-all duration-200 bg-white text-gray-800 font-medium"
                                required
                              >
                                <option value="">Seleccionar perfil...</option>
                                <option value="desarrollador-frontend">Desarrollador Frontend</option>
                                <option value="desarrollador-backend">Desarrollador Backend</option>
                                <option value="desarrollador-fullstack">Desarrollador Full Stack</option>
                                <option value="qa-engineer">QA Engineer</option>
                                <option value="devops">DevOps Engineer</option>
                              </select>
                              <button
                                type="button"
                                className="px-5 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 transition-all duration-200"
                              >
                                <i className="fas fa-plus text-lg" />
                              </button>
                              <button
                                type="button"
                                className="px-5 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
                              >
                                <i className="fas fa-eye text-lg" />
                              </button>
                            </div>
                          </div>

                          {/* Campo Estado */}
                          <div className="bg-white p-5 rounded-xl border-2 border-blue-200 shadow-md space-y-3">
                            <label className="block text-sm font-bold text-gray-800 mb-3">
                              <i className="fas fa-flag mr-2 text-blue-600" />
                              Estado de la Aplicación
                            </label>
                            <div className="shadow-lg rounded-xl overflow-hidden border-2 border-blue-300">
                              <select
                                value={applicationForm.estadoAplicacion}
                                onChange={(e) => {
                                  setApplicationForm({...applicationForm, estadoAplicacion: e.target.value});
                                  // Mostrar automáticamente el campo de rechazo si se selecciona "Rechazado"
                                  if (e.target.value === 'Rechazado') {
                                    setShowRejectReason(true);
                                  }
                                }}
                                className="w-full px-4 py-4 focus:outline-none focus:bg-blue-50 transition-all duration-200 bg-white text-gray-800 font-medium"
                              >
                                <option value="Aplicó">🔄 Aplicó</option>
                                <option value="Preseleccionado">⭐ Preseleccionado</option>
                                <option value="Entrevista">🎯 Entrevista</option>
                                <option value="Oferta">💼 Oferta</option>
                                <option value="Contratado">✅ Contratado</option>
                                <option value="Rechazado">❌ Rechazado</option>
                              </select>
                            </div>
                          </div>

                          {/* Campo Fecha */}
                          <div className="bg-white p-5 rounded-xl border-2 border-blue-200 shadow-md space-y-3">
                            <label className="block text-sm font-bold text-gray-800 mb-3">
                              <i className="fas fa-calendar mr-2 text-blue-600" />
                              Fecha de Aplicación
                            </label>
                            <div className="shadow-lg rounded-xl overflow-hidden border-2 border-blue-300">
                              <input
                                type="date"
                                value={applicationForm.fechaAplicacion}
                                onChange={(e) => setApplicationForm({...applicationForm, fechaAplicacion: e.target.value})}
                                className="w-full px-4 py-4 focus:outline-none focus:bg-blue-50 transition-all duration-200 text-gray-800 font-medium"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Sección Evaluación */}
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                            <i className="fas fa-chart-line text-lg" />
                          </div>
                          <h3 className="text-lg font-semibold">Evaluación del Candidato</h3>
                        </div>
                      </div>

                      <div className="p-8 bg-gradient-to-br from-slate-50 to-purple-50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          {/* Campo Porcentaje */}
                          <div className="bg-white p-5 rounded-xl border-2 border-purple-200 shadow-md space-y-3">
                            <label className="block text-sm font-bold text-gray-800 mb-3">
                              <i className="fas fa-percentage mr-2 text-purple-600" />
                              Porcentaje de Coincidencia
                            </label>
                            <div className="relative shadow-lg rounded-xl overflow-hidden border-2 border-purple-300">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={applicationForm.porcentajeCoincidencia}
                                onChange={(e) => setApplicationForm({...applicationForm, porcentajeCoincidencia: e.target.value})}
                                className="w-full px-4 py-4 pr-12 focus:outline-none focus:bg-purple-50 transition-all duration-200 text-gray-800 font-medium"
                                placeholder="85"
                              />
                              <div className="absolute inset-y-0 right-0 flex items-center pr-4 bg-purple-100">
                                <span className="text-purple-700 font-bold text-lg">%</span>
                              </div>
                            </div>
                            <p className="text-xs text-purple-600 flex items-center font-medium bg-purple-50 px-3 py-2 rounded-lg">
                              <i className="fas fa-info-circle mr-2" />
                              Rango: 0-100
                            </p>
                          </div>

                          {/* Campo Calificación */}
                          <div className="bg-white p-5 rounded-xl border-2 border-purple-200 shadow-md space-y-3">
                            <label className="block text-sm font-bold text-gray-800 mb-3">
                              <i className="fas fa-star mr-2 text-purple-600" />
                              Calificación General
                            </label>
                            <div className="relative shadow-lg rounded-xl overflow-hidden border-2 border-purple-300">
                              <input
                                type="number"
                                min="0"
                                max="5"
                                step="0.1"
                                value={applicationForm.calificacionGeneral}
                                onChange={(e) => setApplicationForm({...applicationForm, calificacionGeneral: e.target.value})}
                                className="w-full px-4 py-4 pr-16 focus:outline-none focus:bg-purple-50 transition-all duration-200 text-gray-800 font-medium"
                                placeholder="4.5"
                              />
                              <div className="absolute inset-y-0 right-0 flex items-center pr-4 bg-purple-100">
                                <span className="text-purple-700 font-bold text-lg">★</span>
                              </div>
                            </div>
                            <p className="text-xs text-purple-600 flex items-center font-medium bg-purple-50 px-3 py-2 rounded-lg">
                              <i className="fas fa-info-circle mr-2" />
                              Rango: 0.0 - 5.0
                            </p>
                          </div>

                          {/* Campo Notas */}
                          <div className="md:col-span-2 bg-white p-5 rounded-xl border-2 border-purple-200 shadow-md space-y-3">
                            <label className="block text-sm font-bold text-gray-800 mb-3">
                              <i className="fas fa-comment-alt mr-2 text-purple-600" />
                              Notas y Comentarios
                            </label>
                            <div className="shadow-lg rounded-xl overflow-hidden border-2 border-purple-300">
                              <textarea
                                value={applicationForm.notas}
                                onChange={(e) => setApplicationForm({...applicationForm, notas: e.target.value})}
                                rows={5}
                                className="w-full px-4 py-4 focus:outline-none focus:bg-purple-50 transition-all duration-200 resize-none text-gray-800 font-medium"
                                placeholder="Agregar observaciones, puntos fuertes, áreas de mejora, comentarios del entrevistador..."
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Sección Fechas */}
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                            <i className="fas fa-calendar-alt text-lg" />
                          </div>
                          <h3 className="text-lg font-semibold">Programación de Fechas</h3>
                        </div>
                      </div>

                      <div className="p-8 bg-gradient-to-br from-slate-50 to-emerald-50">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          {/* Sección Entrevista */}
                          <div className="bg-white p-6 rounded-2xl border-2 border-emerald-200 shadow-lg">
                            <div className="flex items-center space-x-3 mb-6 pb-4 border-b-2 border-emerald-100">
                              <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-3 rounded-xl shadow-lg">
                                <i className="fas fa-comments text-white text-xl" />
                              </div>
                              <h4 className="text-xl font-bold text-gray-800">Entrevista</h4>
                            </div>
                            
                            <div className="space-y-6">
                              {/* Fecha Entrevista */}
                              <div className="bg-emerald-50 p-4 rounded-xl border-2 border-emerald-200">
                                <label className="block text-sm font-bold text-gray-800 mb-3">
                                  <i className="fas fa-calendar mr-2 text-emerald-600" />
                                  Fecha:
                                </label>
                                <div className="flex gap-3">
                                  <div className="flex-1 shadow-md rounded-lg overflow-hidden border-2 border-emerald-300">
                                    <input
                                      type="date"
                                      value={applicationForm.fechaEntrevista}
                                      onChange={(e) => setApplicationForm({...applicationForm, fechaEntrevista: e.target.value})}
                                      className="w-full px-4 py-3 focus:outline-none focus:bg-emerald-100 transition-all duration-200 text-gray-800 font-medium"
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const today = new Date().toISOString().split('T')[0];
                                      setApplicationForm({...applicationForm, fechaEntrevista: today});
                                    }}
                                    className="px-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 shadow-lg flex items-center space-x-2 font-bold"
                                  >
                                    <span className="text-sm">Hoy</span>
                                    <i className="fas fa-calendar" />
                                  </button>
                                </div>
                              </div>
                              
                              {/* Hora Entrevista */}
                              <div className="bg-emerald-50 p-4 rounded-xl border-2 border-emerald-200">
                                <label className="block text-sm font-bold text-gray-800 mb-3">
                                  <i className="fas fa-clock mr-2 text-emerald-600" />
                                  Hora:
                                </label>
                                <div className="flex gap-3">
                                  <div className="flex-1 shadow-md rounded-lg overflow-hidden border-2 border-emerald-300">
                                    <input
                                      type="time"
                                      value={applicationForm.horaEntrevista}
                                      onChange={(e) => setApplicationForm({...applicationForm, horaEntrevista: e.target.value})}
                                      className="w-full px-4 py-3 focus:outline-none focus:bg-emerald-100 transition-all duration-200 text-gray-800 font-medium"
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const now = new Date();
                                      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
                                      setApplicationForm({...applicationForm, horaEntrevista: currentTime});
                                    }}
                                    className="px-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 shadow-lg flex items-center space-x-2 font-bold"
                                  >
                                    <span className="text-sm">Ahora</span>
                                    <i className="fas fa-clock" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Sección Oferta */}
                          <div className="bg-white p-6 rounded-2xl border-2 border-blue-200 shadow-lg">
                            <div className="flex items-center space-x-3 mb-6 pb-4 border-b-2 border-blue-100">
                              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-3 rounded-xl shadow-lg">
                                <i className="fas fa-handshake text-white text-xl" />
                              </div>
                              <h4 className="text-xl font-bold text-gray-800">Oferta Laboral</h4>
                            </div>
                            
                            <div className="space-y-6">
                              {/* Fecha Oferta */}
                              <div className="bg-blue-50 p-4 rounded-xl border-2 border-blue-200">
                                <label className="block text-sm font-bold text-gray-800 mb-3">
                                  <i className="fas fa-calendar mr-2 text-blue-600" />
                                  Fecha:
                                </label>
                                <div className="flex gap-3">
                                  <div className="flex-1 shadow-md rounded-lg overflow-hidden border-2 border-blue-300">
                                    <input
                                      type="date"
                                      value={applicationForm.fechaOferta}
                                      onChange={(e) => setApplicationForm({...applicationForm, fechaOferta: e.target.value})}
                                      className="w-full px-4 py-3 focus:outline-none focus:bg-blue-100 transition-all duration-200 text-gray-800 font-medium"
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const today = new Date().toISOString().split('T')[0];
                                      setApplicationForm({...applicationForm, fechaOferta: today});
                                    }}
                                    className="px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg flex items-center space-x-2 font-bold"
                                  >
                                    <span className="text-sm">Hoy</span>
                                    <i className="fas fa-calendar" />
                                  </button>
                                </div>
                              </div>
                              
                              {/* Hora Oferta */}
                              <div className="bg-blue-50 p-4 rounded-xl border-2 border-blue-200">
                                <label className="block text-sm font-bold text-gray-800 mb-3">
                                  <i className="fas fa-clock mr-2 text-blue-600" />
                                  Hora:
                                </label>
                                <div className="flex gap-3">
                                  <div className="flex-1 shadow-md rounded-lg overflow-hidden border-2 border-blue-300">
                                    <input
                                      type="time"
                                      value={applicationForm.horaOferta}
                                      onChange={(e) => setApplicationForm({...applicationForm, horaOferta: e.target.value})}
                                      className="w-full px-4 py-3 focus:outline-none focus:bg-blue-100 transition-all duration-200 text-gray-800 font-medium"
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const now = new Date();
                                      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
                                      setApplicationForm({...applicationForm, horaOferta: currentTime});
                                    }}
                                    className="px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg flex items-center space-x-2 font-bold"
                                  >
                                    <span className="text-sm">Ahora</span>
                                    <i className="fas fa-clock" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Campo Razón de Rechazo - Solo se muestra si el estado es "Rechazado" o si se hace clic en "Mostrar" */}
                    {(applicationForm.estadoAplicacion === 'Rechazado' || showRejectReason) && (
                      <div className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-red-200">
                        <div className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                                <i className="fas fa-times-circle text-lg" />
                              </div>
                              <h3 className="text-lg font-semibold">Rechazo</h3>
                            </div>
                            {applicationForm.estadoAplicacion !== 'Rechazado' && (
                              <button
                                type="button"
                                onClick={() => setShowRejectReason(false)}
                                className="text-white hover:text-red-200 bg-white bg-opacity-20 hover:bg-opacity-30 p-1 rounded-lg transition-all duration-200"
                              >
                                (Ocultar)
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="p-8 bg-gradient-to-br from-slate-50 to-red-50">
                          <div className="bg-white p-5 rounded-xl border-2 border-red-200 shadow-md space-y-3">
                            <label className="block text-sm font-bold text-gray-800 mb-3">
                              <i className="fas fa-comment-times mr-2 text-red-600" />
                              Razón de Rechazo:
                            </label>
                            <div className="shadow-lg rounded-xl overflow-hidden border-2 border-red-300">
                              <textarea
                                value={applicationForm.razonRechazo}
                                onChange={(e) => setApplicationForm({...applicationForm, razonRechazo: e.target.value})}
                                rows={4}
                                className="w-full px-4 py-4 focus:outline-none focus:bg-red-50 transition-all duration-200 resize-none text-gray-800 font-medium"
                                placeholder="Especificar las razones por las cuales se rechaza al candidato..."
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Botones de acción */}
                    <div className="bg-gradient-to-r from-gray-50 to-white p-6 border-t-2 border-gray-100">
                      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        {/* Botón Cancelar / Mostrar Rechazo */}
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => setShowApplicationForm(false)}
                            className="px-6 py-3 text-gray-600 bg-white border-2 border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm flex items-center space-x-2"
                          >
                            <i className="fas fa-times" />
                            <span>Cancelar</span>
                          </button>
                          
                          {applicationForm.estadoAplicacion !== 'Rechazado' && !showRejectReason && (
                            <button
                              type="button"
                              onClick={() => setShowRejectReason(true)}
                              className="px-6 py-3 text-red-600 bg-white border-2 border-red-200 rounded-lg hover:bg-red-50 hover:border-red-300 transition-all duration-200 shadow-sm flex items-center space-x-2"
                            >
                              <i className="fas fa-eye" />
                              <span>Mostrar Rechazo</span>
                            </button>
                          )}
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-3">
                          <button
                            type="button"
                            className="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all duration-200 shadow-lg flex items-center space-x-2"
                          >
                            <i className="fas fa-save" />
                            <span>Guardar</span>
                          </button>
                          <button
                            type="button"
                            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg flex items-center space-x-2"
                          >
                            <i className="fas fa-plus-circle" />
                            <span>Guardar y Agregar Otro</span>
                          </button>
                          <button
                            type="submit"
                            className="px-8 py-3 bg-gradient-to-r from-blue-700 via-blue-800 to-blue-900 text-white rounded-lg hover:from-blue-800 hover:via-blue-900 hover:to-blue-950 transition-all duration-200 shadow-xl flex items-center space-x-2 font-semibold"
                          >
                            <i className="fas fa-check-double" />
                            <span>Guardar y Continuar</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* NOTES */}
          {currentView === "notes" && (
            <div className="p-6">
              <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Notas de Candidatos</h2>
                  <p className="text-gray-600 mt-1">Gestiona notas, observaciones y comentarios sobre candidatos</p>
                </div>
                <div className="mt-4 sm:mt-0 flex space-x-3">
                  <button onClick={() => info("Filtrando notas...")} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                    <i className="fas fa-filter mr-2" />
                    Filtrar
                  </button>
                  <button onClick={() => info("Nueva nota...")} className="px-4 py-2 btn-primary text-white rounded-lg">
                    <i className="fas fa-plus mr-2" />
                    Nueva Nota
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="card-hover bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-blue-100">
                      <i className="fas fa-sticky-note text-blue-600 text-xl" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Notas</p>
                      <p className="text-2xl font-bold text-gray-900">456</p>
                    </div>
                  </div>
                </div>
                <div className="card-hover bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-green-100">
                      <i className="fas fa-comment text-green-600 text-xl" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Entrevistas</p>
                      <p className="text-2xl font-bold text-gray-900">123</p>
                    </div>
                  </div>
                </div>
                <div className="card-hover bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-yellow-100">
                      <i className="fas fa-exclamation-triangle text-yellow-600 text-xl" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Preocupaciones</p>
                      <p className="text-2xl font-bold text-gray-900">23</p>
                    </div>
                  </div>
                </div>
                <div className="card-hover bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-purple-100">
                      <i className="fas fa-flag text-purple-600 text-xl" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Referencias</p>
                      <p className="text-2xl font-bold text-gray-900">89</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Entrevista técnica completada</h3>
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Entrevista</span>
                  </div>
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">JP</div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">Juan Pérez García</p>
                      <p className="text-xs text-gray-500">Hace 2 horas</p>
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm mb-4">El candidato demostró excelentes conocimientos en React y Node.js. Resolvió los problemas de algoritmos correctamente y mostró buena comunicación.</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">#entrevista</span>
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">#técnica</span>
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">#react</span>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Referencias verificadas</h3>
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">Referencia</span>
                  </div>
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-medium">MG</div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">María González López</p>
                      <p className="text-xs text-gray-500">Hace 1 día</p>
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm mb-4">Se contactó con dos referencias previas. Ambas confirmaron el excelente desempeño de la candidata en gestión de productos y liderazgo de equipos.</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">#referencias</span>
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">#liderazgo</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CANDIDATE HISTORY */}
          {currentView === "history" && (
            <div className="p-6">
              <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Historial de Candidatos</h2>
                  <p className="text-gray-600 mt-1">Seguimiento completo del proceso de reclutamiento por candidato</p>
                </div>
                <div className="mt-4 sm:mt-0 flex space-x-3">
                  <button onClick={() => info("Exportando historial...")} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                    <i className="fas fa-download mr-2" />
                    Exportar Reporte
                  </button>
                  <button onClick={() => info("Filtrando historial...")} className="px-4 py-2 btn-primary text-white rounded-lg">
                    <i className="fas fa-filter mr-2" />
                    Filtros Avanzados
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="card-hover bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-blue-100">
                      <i className="fas fa-users text-blue-600 text-xl" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Candidatos</p>
                      <p className="text-2xl font-bold text-gray-900">1,247</p>
                    </div>
                  </div>
                </div>
                <div className="card-hover bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-green-100">
                      <i className="fas fa-check-circle text-green-600 text-xl" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Contratados</p>
                      <p className="text-2xl font-bold text-gray-900">289</p>
                    </div>
                  </div>
                </div>
                <div className="card-hover bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-yellow-100">
                      <i className="fas fa-clock text-yellow-600 text-xl" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">En Proceso</p>
                      <p className="text-2xl font-bold text-gray-900">156</p>
                    </div>
                  </div>
                </div>
                <div className="card-hover bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-purple-100">
                      <i className="fas fa-chart-line text-purple-600 text-xl" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Tasa Éxito</p>
                      <p className="text-2xl font-bold text-gray-900">23%</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline de candidatos */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Línea de Tiempo Reciente</h3>
                  <div className="flex space-x-3">
                    <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                      <option>Últimos 30 días</option>
                      <option>Última semana</option>
                      <option>Hoy</option>
                    </select>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flow-root">
                    <ul className="-mb-8">
                      <li>
                        <div className="relative pb-8">
                          <div className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"></div>
                          <div className="relative flex space-x-3">
                            <div>
                              <span className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center ring-8 ring-white">
                                <i className="fas fa-user-check text-white text-sm" />
                              </span>
                            </div>
                            <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                              <div>
                                <p className="text-sm text-gray-900">
                                  <strong>Juan Pérez García</strong> fue contratado para 
                                  <span className="font-medium text-gray-900"> Desarrollador Full Stack Senior</span>
                                </p>
                                <p className="mt-0.5 text-sm text-gray-500">
                                  Proceso completado en 21 días • Cliente: TechCorp
                                </p>
                              </div>
                              <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                <time>Hace 2 horas</time>
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>

                      <li>
                        <div className="relative pb-8">
                          <div className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"></div>
                          <div className="relative flex space-x-3">
                            <div>
                              <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                                <i className="fas fa-comments text-white text-sm" />
                              </span>
                            </div>
                            <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                              <div>
                                <p className="text-sm text-gray-900">
                                  <strong>María González López</strong> completó entrevista técnica para 
                                  <span className="font-medium text-gray-900"> Product Manager Senior</span>
                                </p>
                                <p className="mt-0.5 text-sm text-gray-500">
                                  Puntuación: 4.2/5 • Supervisor: Ana Rodríguez
                                </p>
                              </div>
                              <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                <time>Hace 4 horas</time>
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>

                      <li>
                        <div className="relative pb-8">
                          <div className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"></div>
                          <div className="relative flex space-x-3">
                            <div>
                              <span className="h-8 w-8 rounded-full bg-yellow-500 flex items-center justify-center ring-8 ring-white">
                                <i className="fas fa-file-alt text-white text-sm" />
                              </span>
                            </div>
                            <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                              <div>
                                <p className="text-sm text-gray-900">
                                  <strong>Carlos Mendoza</strong> subió documentos adicionales para 
                                  <span className="font-medium text-gray-900"> Diseñador UX/UI</span>
                                </p>
                                <p className="mt-0.5 text-sm text-gray-500">
                                  3 archivos: Portfolio, certificados, referencias
                                </p>
                              </div>
                              <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                <time>Hace 1 día</time>
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>

                      <li>
                        <div className="relative pb-8">
                          <div className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"></div>
                          <div className="relative flex space-x-3">
                            <div>
                              <span className="h-8 w-8 rounded-full bg-red-500 flex items-center justify-center ring-8 ring-white">
                                <i className="fas fa-times-circle text-white text-sm" />
                              </span>
                            </div>
                            <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                              <div>
                                <p className="text-sm text-gray-900">
                                  <strong>Ana Martínez</strong> fue rechazada para 
                                  <span className="font-medium text-gray-900"> Data Analyst</span>
                                </p>
                                <p className="mt-0.5 text-sm text-gray-500">
                                  Motivo: No cumple con experiencia mínima en SQL
                                </p>
                              </div>
                              <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                <time>Hace 2 días</time>
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>

                      <li>
                        <div className="relative">
                          <div className="relative flex space-x-3">
                            <div>
                              <span className="h-8 w-8 rounded-full bg-purple-500 flex items-center justify-center ring-8 ring-white">
                                <i className="fas fa-user-plus text-white text-sm" />
                              </span>
                            </div>
                            <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                              <div>
                                <p className="text-sm text-gray-900">
                                  <strong>Roberto Silva</strong> se registró como nuevo candidato
                                </p>
                                <p className="mt-0.5 text-sm text-gray-500">
                                  Aplicó para: Desarrollador Backend • Fuente: LinkedIn
                                </p>
                              </div>
                              <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                <time>Hace 3 días</time>
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Estadísticas por etapa */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribución por Etapa del Proceso</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                        <span className="text-sm text-gray-600">Aplicación Recibida</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium text-gray-900">324</span>
                        <span className="text-xs text-gray-500 ml-1">(26%)</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                        <span className="text-sm text-gray-600">Revisión Inicial</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium text-gray-900">189</span>
                        <span className="text-xs text-gray-500 ml-1">(15%)</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                        <span className="text-sm text-gray-600">Entrevista Técnica</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium text-gray-900">156</span>
                        <span className="text-xs text-gray-500 ml-1">(12%)</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
                        <span className="text-sm text-gray-600">Entrevista Final</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium text-gray-900">89</span>
                        <span className="text-xs text-gray-500 ml-1">(7%)</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                        <span className="text-sm text-gray-600">Contratado</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium text-gray-900">67</span>
                        <span className="text-xs text-gray-500 ml-1">(5%)</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Tiempo Promedio por Etapa</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Revisión Inicial</span>
                      <div className="text-right">
                        <span className="text-sm font-medium text-gray-900">2.3 días</span>
                        <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                          <div className="bg-blue-500 h-2 rounded-full" style={{ width: '23%' }}></div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Entrevista Técnica</span>
                      <div className="text-right">
                        <span className="text-sm font-medium text-gray-900">5.7 días</span>
                        <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                          <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '57%' }}></div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Entrevista Final</span>
                      <div className="text-right">
                        <span className="text-sm font-medium text-gray-900">8.2 días</span>
                        <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                          <div className="bg-purple-500 h-2 rounded-full" style={{ width: '82%' }}></div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Decisión Final</span>
                      <div className="text-right">
                        <span className="text-sm font-medium text-gray-900">4.1 días</span>
                        <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: '41%' }}></div>
                        </div>
                      </div>
                    </div>
                    <div className="border-t border-gray-200 pt-3 mt-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">Tiempo Total Promedio</span>
                        <span className="text-lg font-bold text-blue-600">20.3 días</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CLIENTS */}
          {currentView === "clients" && (
            <div className="p-6">
              <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Gestión de Clientes</h2>
                  <p className="text-gray-600 mt-1">Administra la información y proyectos de tus clientes</p>
                </div>
                <div className="mt-4 sm:mt-0 flex space-x-3">
                  <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                    <i className="fas fa-filter mr-2" />
                    Filtros
                  </button>
                  <button onClick={addNewClient} className="px-4 py-2 btn-primary text-white rounded-lg">
                    <i className="fas fa-plus mr-2" />
                    Nuevo Cliente
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {clients.map((cl) => (
                  <div key={cl.id} className="card-hover bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                          <i className="fas fa-building text-blue-600 text-lg" />
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-semibold text-gray-900">{cl.name}</h3>
                          <p className="text-sm text-gray-500">{cl.industry}</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Activo</span>
                    </div>

                    <div className="space-y-3 mb-4 text-sm">
                      <div className="flex items-center">
                        <i className="fas fa-user-tie text-gray-400 w-4" />
                        <span className="ml-2 text-gray-600">Contacto:</span>
                        <span className="ml-2 text-gray-900">{cl.contact}</span>
                      </div>
                      <div className="flex items-center">
                        <i className="fas fa-envelope text-gray-400 w-4" />
                        <span className="ml-2 text-gray-600">Email:</span>
                        <span className="ml-2 text-gray-900">{cl.email}</span>
                      </div>
                      <div className="flex items-center">
                        <i className="fas fa-phone text-gray-400 w-4" />
                        <span className="ml-2 text-gray-600">Teléfono:</span>
                        <span className="ml-2 text-gray-900">{cl.phone}</span>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Procesos Activos</span>
                        <span className="text-sm font-semibold text-gray-900">{cl.activeProcesses}</span>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Candidatos Totales</span>
                        <span className="text-sm font-semibold text-gray-900">{cl.totalCandidates}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Última Actividad</span>
                        <span className="text-sm text-gray-500">{cl.lastActivity}</span>
                      </div>
                    </div>

                    <div className="flex space-x-2 mt-4 pt-4 border-t border-gray-100">
                      <button onClick={() => viewClientDetails(cl.id)} className="flex-1 px-3 py-2 text-sm bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100">
                        Ver Detalles
                      </button>
                      <button className="px-3 py-2 text-sm bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100">
                        <i className="fas fa-edit" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TEAM */}
          {currentView === "team" && (
            <div className="p-6">
              <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Gestión de Equipo</h2>
                  <p className="text-gray-600 mt-1">Administra tu equipo de recursos humanos y sus asignaciones</p>
                </div>
                <div className="mt-4 sm:mt-0 flex space-x-3">
                  <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                    <i className="fas fa-chart-bar mr-2" />
                    Performance
                  </button>
                  <button onClick={addTeamMember} className="px-4 py-2 btn-primary text-white rounded-lg">
                    <i className="fas fa-user-plus mr-2" />
                    Agregar Miembro
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {teamMembers.map((m) => (
                  <div key={m.id} className="card-hover bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center mb-4">
                      <img
                        className="h-16 w-16 rounded-full border-2 border-primary-200"
                        src={`https://ui-avatars.com/api/?name=${m.avatar}&background=3b82f6&color=fff`}
                        alt={m.name}
                      />
                      <div className="ml-4">
                        <h3 className="text-lg font-semibold text-gray-900">{m.name}</h3>
                        <p className="text-sm text-gray-500">{m.role}</p>
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 mt-1 inline-block">
                          Activo
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3 mb-4 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Procesos Asignados</span>
                        <span className="font-semibold text-gray-900">{m.assignedProcesses}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Candidatos Gestionados</span>
                        <span className="font-semibold text-gray-900">{m.managedCandidates}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tasa de Éxito</span>
                        <span className="font-semibold text-green-600">{m.successRate}%</span>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-4">
                      <div className="flex space-x-2">
                        <button onClick={() => viewTeamMemberProfile(m.id)} className="flex-1 px-3 py-2 text-sm bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100">
                          Ver Perfil
                        </button>
                        <button className="px-3 py-2 text-sm bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100">
                          <i className="fas fa-envelope" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* APPROVALS */}
          {currentView === "approvals" && (
            <div className="p-6">
              <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Centro de Aprobaciones</h2>
                  <p className="text-gray-600 mt-1">Gestiona todas las aprobaciones pendientes del sistema</p>
                </div>
                <div className="mt-4 sm:mt-0 flex space-x-3">
                  <button onClick={filterApprovals} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                    <i className="fas fa-filter mr-2" />
                    Filtrar
                  </button>
                  <button onClick={approveAllPending} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                    <i className="fas fa-check-double mr-2" />
                    Aprobar Todas
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                {[
                  { icon: "fas fa-clock", label: "Pendientes", value: "12", bg: "bg-red-100", ic: "text-red-600" },
                  { icon: "fas fa-check", label: "Aprobadas Hoy", value: "8", bg: "bg-green-100", ic: "text-green-600" },
                  { icon: "fas fa-exclamation-triangle", label: "Urgentes", value: "3", bg: "bg-yellow-100", ic: "text-yellow-600" },
                ].map((s) => (
                  <div key={s.label} className="card-hover bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center">
                      <div className={`p-3 rounded-full ${s.bg}`}>
                        <i className={`${s.icon} ${s.ic} text-xl`} />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">{s.label}</p>
                        <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Lista ejemplo */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900">Aprobaciones Pendientes</h3>
                </div>
                <div className="divide-y divide-gray-200">
                  <div className="p-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-start space-x-4">
                        <img
                          className="h-12 w-12 rounded-full border-2 border-gray-200"
                          src="https://ui-avatars.com/api/?name=Carlos+Lopez&background=random"
                          alt="Carlos López"
                        />
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">Carlos López</h4>
                          <p className="text-sm text-gray-500">Desarrollador Frontend - TechCorp</p>
                          <div className="flex items-center mt-2 space-x-4">
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Score: 95%</span>
                            <span className="text-xs text-gray-500">Supervisado por: Ana García</span>
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Urgente</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-3">
                        <button onClick={() => success("Aprobado")} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500">
                          <i className="fas fa-check mr-2" />
                          Aprobar
                        </button>
                        <button onClick={() => warning("Rechazado")} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500">
                          <i className="fas fa-times mr-2" />
                          Rechazar
                        </button>
                        <button onClick={() => info("Ver detalle")} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                          <i className="fas fa-eye" />
                        </button>
                      </div>
                    </div>
                  </div>
                  {/* ...más items si quieres... */}
                </div>
              </div>
            </div>
          )}

          {/* REPORTS */}
          {currentView === "reports" && (
            <div className="p-6">
              <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Centro de Reportes</h2>
                  <p className="text-gray-600 mt-1">Analiza métricas y genera reportes detallados del sistema</p>
                </div>
                <div className="mt-4 sm:mt-0 flex space-x-3">
                  <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                    <i className="fas fa-calendar mr-2" />
                    Período
                  </button>
                  <button onClick={exportAllReports} className="px-4 py-2 btn-primary text-white rounded-lg">
                    <i className="fas fa-download mr-2" />
                    Exportar Todo
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div className="card-hover bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Reporte Mensual</h3>
                      <p className="text-sm text-gray-500">Actividad del mes actual</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <i className="fas fa-chart-line text-blue-600 text-lg" />
                    </div>
                  </div>
                  <div className="space-y-2 mb-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Procesos Completados</span>
                      <span className="font-semibold text-gray-900">25</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Candidatos Procesados</span>
                      <span className="font-semibold text-gray-900">156</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tasa de Éxito</span>
                      <span className="font-semibold text-green-600">85%</span>
                    </div>
                  </div>
                  <button onClick={generateMonthlyReport} className="w-full px-4 py-2 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100">
                    <i className="fas fa-download mr-2" />
                    Generar Reporte
                  </button>
                </div>
                {/* ...otros cards si deseas... */}
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Tendencias de Reclutamiento</h3>
                <div style={{ height: 300 }} className="flex items-center justify-center bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <i className="fas fa-chart-area text-4xl text-gray-400 mb-4" />
                    <p className="text-gray-500">Gráfico de tendencias se cargará aquí</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AVANCE DE CLIENTE */}
          {currentView === "client-progress" && (
            <div className="p-6">
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                      <i className="fas fa-chart-line mr-3 text-blue-600" />
                      Avance de Cliente
                    </h2>
                    <p className="text-gray-600">
                      Visualiza el progreso de los procesos de reclutamiento para cada cliente
                    </p>
                  </div>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      alert('¡Enlace del dashboard copiado al portapapeles!');
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 font-medium flex items-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <i className="fas fa-share-alt mr-2" />
                    Compartir Dashboard
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Lista de Clientes */}
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">Clientes Activos</h3>
                    </div>
                    <div className="divide-y divide-gray-200">
                      {[
                        { id: 1, name: 'Proyecto TechCorp', company: 'TechCorp Industries', progress: 60, phase: 3, assignedTo: 'Juan Pérez' },
                        { id: 2, name: 'Reclutamiento StartupXYZ', company: 'StartupXYZ', progress: 40, phase: 2, assignedTo: 'María García' },
                        { id: 3, name: 'Expansión GlobalTech', company: 'GlobalTech Solutions', progress: 80, phase: 4, assignedTo: 'Carlos Rodríguez' },
                      ].map((client) => (
                        <div key={client.id} className="p-4 hover:bg-gray-50 cursor-pointer transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 mb-1">{client.name}</h4>
                              <p className="text-sm text-gray-600 mb-2 flex items-center">
                                <i className="fas fa-building w-3 h-3 mr-2" />
                                {client.company}
                              </p>
                              <p className="text-xs text-gray-500 flex items-center">
                                <i className="fas fa-user-tie w-3 h-3 mr-2" />
                                {client.assignedTo}
                              </p>
                            </div>
                            <div className="ml-4 text-right">
                              <div className="text-2xl font-bold text-blue-600">{client.progress}%</div>
                              <div className="text-xs text-gray-500">Completado</div>
                            </div>
                          </div>
                          
                          {/* Barra de progreso */}
                          <div className="mt-3">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${client.progress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Estadísticas rápidas */}
                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                      <div className="text-3xl font-bold text-green-600 mb-1">3</div>
                      <div className="text-sm text-gray-600">Clientes Activos</div>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                      <div className="text-3xl font-bold text-blue-600 mb-1">60%</div>
                      <div className="text-sm text-gray-600">Progreso Promedio</div>
                    </div>
                  </div>
                </div>

                {/* Timeline de Progreso */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    {/* Header */}
                    <div className="mb-8 pb-6 border-b border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900">Proyecto TechCorp</h3>
                          <p className="text-gray-600 flex items-center mt-1">
                            <i className="fas fa-building w-4 h-4 mr-2" />
                            TechCorp Industries
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-4xl font-bold text-blue-600">60%</div>
                          <div className="text-sm text-gray-500">Progreso Total</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <i className="fas fa-calendar-alt w-4 h-4 mr-2 text-gray-400" />
                          Inicio: 15 Ene 2025
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <i className="fas fa-user-tie w-4 h-4 mr-2 text-gray-400" />
                          Asignado a: Juan Pérez
                        </div>
                      </div>
                    </div>

                    {/* Timeline de Fases */}
                    <div className="space-y-6">
                      {[
                        { 
                          id: 1, 
                          name: 'Definición de Necesidades', 
                          icon: 'fas fa-lightbulb', 
                          status: 'completed', 
                          date: '15/01/2025', 
                          description: 'Análisis inicial y definición de requisitos del cliente',
                          details: {
                            duration: '5 días',
                            participants: ['Director de Proyecto', 'Cliente', 'Analista de Negocio'],
                            deliverables: ['Documento de Requisitos', 'Perfil del Candidato Ideal', 'Plan de Reclutamiento'],
                            notes: 'Se realizaron 3 reuniones con el cliente para definir las necesidades específicas del puesto.'
                          }
                        },
                        { 
                          id: 2, 
                          name: 'Búsqueda y Selección', 
                          icon: 'fas fa-users', 
                          status: 'completed', 
                          date: '25/01/2025', 
                          description: 'Reclutamiento activo y filtrado de candidatos',
                          details: {
                            duration: '10 días',
                            participants: ['Reclutador', 'Coordinador de Talento'],
                            deliverables: ['Base de Candidatos (50+)', 'Pre-filtro Inicial', 'Shortlist (15 candidatos)'],
                            notes: 'Se utilizaron múltiples canales: LinkedIn, bolsas de trabajo, referidos internos.'
                          }
                        },
                        { 
                          id: 3, 
                          name: 'Evaluación', 
                          icon: 'fas fa-chart-bar', 
                          status: 'in-progress', 
                          date: null, 
                          description: 'Entrevistas y evaluaciones técnicas',
                          details: {
                            duration: '15 días (estimado)',
                            participants: ['Panel de Entrevistadores', 'Evaluador Técnico', 'Psicólogo Organizacional'],
                            deliverables: ['Reportes de Entrevistas', 'Evaluaciones Técnicas', 'Perfiles Psicométricos'],
                            notes: 'Proceso en curso: 8 entrevistas completadas, 7 pendientes. 3 candidatos en evaluación técnica.'
                          }
                        },
                        { 
                          id: 4, 
                          name: 'Proceso de Onboarding', 
                          icon: 'fas fa-cog', 
                          status: 'pending', 
                          date: null, 
                          description: 'Integración y capacitación del personal',
                          details: {
                            duration: '20 días (estimado)',
                            participants: ['RH del Cliente', 'Responsable de Capacitación', 'Mentor Asignado'],
                            deliverables: ['Plan de Onboarding', 'Material de Capacitación', 'Evaluación 30-60-90 días'],
                            notes: 'Pendiente de iniciar una vez se seleccione al candidato final.'
                          }
                        },
                        { 
                          id: 5, 
                          name: 'Cierre y Seguimiento', 
                          icon: 'fas fa-bullseye', 
                          status: 'pending', 
                          date: null, 
                          description: 'Finalización del proyecto y seguimiento post-colocación',
                          details: {
                            duration: '90 días (seguimiento)',
                            participants: ['Director de Proyecto', 'Cliente', 'Supervisor del Candidato'],
                            deliverables: ['Reporte de Cierre', 'Encuesta de Satisfacción', 'Plan de Seguimiento'],
                            notes: 'Se realizará seguimiento mensual durante los primeros 3 meses.'
                          }
                        },
                      ].map((phase, index, array) => {
                        const isExpanded = expandedPhases.has(phase.id);
                        
                        return (
                          <div key={phase.id} className="relative">
                            {/* Línea conectora */}
                            {index < array.length - 1 && (
                              <div
                                className={`absolute left-8 top-16 w-0.5 h-full ${
                                  phase.status === 'completed' ? 'bg-green-300' : 'bg-gray-300'
                                }`}
                              />
                            )}

                            <div className="flex items-start">
                              {/* Icono de fase */}
                              <div
                                className={`relative z-10 flex items-center justify-center w-16 h-16 rounded-full border-4 ${
                                  phase.status === 'completed'
                                    ? 'text-green-600 bg-green-100 border-green-300'
                                    : phase.status === 'in-progress'
                                    ? 'text-blue-600 bg-blue-100 border-blue-300'
                                    : 'text-gray-400 bg-gray-100 border-gray-300'
                                }`}
                              >
                                <i className={`${phase.icon} text-2xl`} />
                              </div>

                              {/* Contenido de la fase */}
                              <div className="ml-6 flex-1">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="text-lg font-semibold text-gray-900">{phase.name}</h4>
                                  <div className="flex items-center gap-3">
                                    <i
                                      className={`fas ${
                                        phase.status === 'completed'
                                          ? 'fa-check-circle text-green-600'
                                          : phase.status === 'in-progress'
                                          ? 'fa-spinner fa-spin text-blue-600'
                                          : 'fa-circle text-gray-400'
                                      } w-5 h-5`}
                                    />
                                    <span
                                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                        phase.status === 'completed'
                                          ? 'bg-green-100 text-green-800'
                                          : phase.status === 'in-progress'
                                          ? 'bg-blue-100 text-blue-800'
                                          : 'bg-gray-100 text-gray-600'
                                      }`}
                                    >
                                      {phase.status === 'completed'
                                        ? 'Completado'
                                        : phase.status === 'in-progress'
                                        ? 'En Progreso'
                                        : 'Pendiente'}
                                    </span>
                                    <button
                                      onClick={() => {
                                        const newExpanded = new Set(expandedPhases);
                                        if (isExpanded) {
                                          newExpanded.delete(phase.id);
                                        } else {
                                          newExpanded.add(phase.id);
                                        }
                                        setExpandedPhases(newExpanded);
                                      }}
                                      className="px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors flex items-center gap-1"
                                    >
                                      <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'}`} />
                                      Ver Detalle
                                    </button>
                                  </div>
                                </div>
                                
                                <p className="text-gray-600 text-sm mb-3">{phase.description}</p>
                                
                                {phase.date && (
                                  <p className="text-xs text-gray-500 flex items-center">
                                    <i className="fas fa-check-circle w-3 h-3 mr-2 text-green-600" />
                                    Completado el {phase.date}
                                  </p>
                                )}

                                {/* Detalles adicionales para fase en progreso */}
                                {phase.status === 'in-progress' && !isExpanded && (
                                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                    <p className="text-sm font-semibold text-blue-900 mb-2">Acciones Actuales:</p>
                                    <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                                      <li>Revisión de perfiles en progreso</li>
                                      <li>3 entrevistas programadas esta semana</li>
                                      <li>Evaluación técnica pendiente</li>
                                    </ul>
                                  </div>
                                )}

                                {/* Sección expandida con detalles completos */}
                                {isExpanded && (
                                  <div className="mt-4 space-y-4 animate-fade-in">
                                    <div className="bg-gray-50 rounded-lg border border-gray-200 p-5">
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Duración */}
                                        <div>
                                          <div className="flex items-center mb-3">
                                            <i className="fas fa-clock text-indigo-600 w-5 h-5 mr-2" />
                                            <h5 className="font-semibold text-gray-900">Duración</h5>
                                          </div>
                                          <p className="text-gray-700 text-sm pl-7">{phase.details.duration}</p>
                                        </div>

                                        {/* Participantes */}
                                        <div>
                                          <div className="flex items-center mb-3">
                                            <i className="fas fa-users text-purple-600 w-5 h-5 mr-2" />
                                            <h5 className="font-semibold text-gray-900">Participantes</h5>
                                          </div>
                                          <ul className="text-sm text-gray-700 space-y-1 pl-7">
                                            {phase.details.participants.map((p, idx) => (
                                              <li key={idx} className="flex items-center">
                                                <i className="fas fa-user-circle w-3 h-3 mr-2 text-purple-400" />
                                                {p}
                                              </li>
                                            ))}
                                          </ul>
                                        </div>

                                        {/* Entregables */}
                                        <div className="md:col-span-2">
                                          <div className="flex items-center mb-3">
                                            <i className="fas fa-file-alt text-green-600 w-5 h-5 mr-2" />
                                            <h5 className="font-semibold text-gray-900">Entregables</h5>
                                          </div>
                                          <ul className="text-sm text-gray-700 space-y-1 pl-7">
                                            {phase.details.deliverables.map((d, idx) => (
                                              <li key={idx} className="flex items-center">
                                                <i className="fas fa-check-square w-3 h-3 mr-2 text-green-500" />
                                                {d}
                                              </li>
                                            ))}
                                          </ul>
                                        </div>

                                        {/* Notas */}
                                        <div className="md:col-span-2">
                                          <div className="flex items-center mb-3">
                                            <i className="fas fa-sticky-note text-amber-600 w-5 h-5 mr-2" />
                                            <h5 className="font-semibold text-gray-900">Notas</h5>
                                          </div>
                                          <p className="text-sm text-gray-700 pl-7 leading-relaxed">
                                            {phase.details.notes}
                                          </p>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Botón de acción adicional en el detalle expandido */}
                                    {phase.status === 'in-progress' && (
                                      <div className="flex gap-3">
                                        <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center">
                                          <i className="fas fa-tasks mr-2" />
                                          Ver Tareas Pendientes
                                        </button>
                                        <button className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium flex items-center justify-center">
                                          <i className="fas fa-calendar-plus mr-2" />
                                          Programar Reunión
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Footer con botón de acción */}
                    <div className="mt-8 pt-6 border-t border-gray-200 flex justify-between items-center">
                      <button className="px-6 py-2.5 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors font-medium">
                        Ver Detalles Completos
                      </button>
                      <button className="px-6 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium flex items-center">
                        <i className="fas fa-trophy mr-2" />
                        Generar Reporte
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DOCUMENTS */}
          {currentView === "documents" && (
            <div className="p-6">
              <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Gestión de Documentos</h2>
                  <p className="text-gray-600 mt-1">Organiza y gestiona todos los documentos del sistema</p>
                </div>
                <div className="mt-4 sm:mt-0 flex space-x-3">
                  <button onClick={searchDocuments} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                    <i className="fas fa-search mr-2" />
                    Buscar
                  </button>
                  <button onClick={uploadDocument} className="px-4 py-2 btn-primary text-white rounded-lg">
                    <i className="fas fa-cloud-upload-alt mr-2" />
                    Subir Documento
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {[
                  { icon: "fas fa-file-pdf", title: "CVs", count: "1,247 documentos", wrap: "bg-blue-100 text-blue-600", btn: "bg-blue-50 text-blue-600 hover:bg-blue-100" },
                  { icon: "fas fa-file-contract", title: "Contratos", count: "89 documentos", wrap: "bg-green-100 text-green-600", btn: "bg-green-50 text-green-600 hover:bg-green-100" },
                  { icon: "fas fa-file-alt", title: "Reportes", count: "156 documentos", wrap: "bg-purple-100 text-purple-600", btn: "bg-purple-50 text-purple-600 hover:bg-purple-100" },
                  { icon: "fas fa-folder", title: "Otros", count: "67 documentos", wrap: "bg-yellow-100 text-yellow-600", btn: "bg-yellow-50 text-yellow-600 hover:bg-yellow-100" },
                ].map((c) => (
                  <div key={c.title} className="card-hover bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center">
                    <div className={`w-12 h-12 ${c.wrap.split(" ").slice(0,1).join(" ")} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                      <i className={`${c.icon} ${c.wrap.split(" ").slice(1).join(" ")} text-xl`} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{c.title}</h3>
                    <p className="text-sm text-gray-500 mb-4">{c.count}</p>
                    <button className={`w-full px-4 py-2 rounded-lg ${c.btn}`}>Ver Todos</button>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900">Documentos Recientes</h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {documents.map((d) => (
                    <div key={d.id} className="p-6 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                            <i className="fas fa-file-pdf text-red-600" />
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900">{d.name}</h4>
                            <p className="text-xs text-gray-500">
                              Subido por {d.uploadedBy} • {d.uploadedAt} • {d.size}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button onClick={() => viewDocument(d.id)} className="text-blue-600 hover:text-blue-700 p-2 rounded" title="Ver">
                            <i className="fas fa-eye" />
                          </button>
                          <button onClick={() => downloadDocument(d.id)} className="text-green-600 hover:text-green-700 p-2 rounded" title="Descargar">
                            <i className="fas fa-download" />
                          </button>
                          <button onClick={() => deleteDocument(d.id)} className="text-red-600 hover:text-red-700 p-2 rounded" title="Eliminar">
                            <i className="fas fa-trash" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {/* ...otros items si deseas... */}
                </div>
              </div>
            </div>
          )}

          {/* TAREAS DE SISTEMA (CELERY) */}
          {currentView === "tasks" && (
            <div className="p-6">
              <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Tareas de Sistema</h2>
                  <p className="text-gray-600 mt-1">Monitoreo y gestión de tareas asíncronas del sistema</p>
                </div>
                <div className="mt-4 sm:mt-0 flex space-x-3">
                  <button onClick={refreshCeleryData} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                    <i className="fas fa-sync-alt mr-2" />
                    Actualizar
                  </button>
                  <button onClick={() => info("Abriendo configuración...")} className="px-4 py-2 btn-primary text-white rounded-lg">
                    <i className="fas fa-cog mr-2" />
                    Configurar
                  </button>
                </div>
              </div>

              {/* Estadísticas generales */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <i className="fas fa-tasks text-blue-600 text-xl" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-sm font-medium text-gray-500">Tareas Activas</h3>
                      <p className="text-2xl font-bold text-gray-900">
                        {celeryData ? celeryData.active_tasks.count : "0"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <i className="fas fa-check-circle text-green-600 text-xl" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-sm font-medium text-gray-500">Completadas (7d)</h3>
                      <p className="text-2xl font-bold text-gray-900">
                        {celeryData ? celeryData.statistics.successful_tasks : "0"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <i className="fas fa-exclamation-triangle text-red-600 text-xl" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-sm font-medium text-gray-500">Fallidas (7d)</h3>
                      <p className="text-2xl font-bold text-gray-900">
                        {celeryData ? celeryData.statistics.failed_tasks : "0"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <i className="fas fa-clock text-yellow-600 text-xl" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-sm font-medium text-gray-500">En Cola</h3>
                      <p className="text-2xl font-bold text-gray-900">
                        {celeryData ? celeryData.scheduled_tasks.count : "0"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Grupos de tareas */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Grupos de Tareas</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Servicios de IA */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <i className="fas fa-brain text-purple-600 text-lg mr-3" />
                        <h4 className="font-medium text-gray-900">Servicios de IA</h4>
                      </div>
                      <span className="px-2 py-1 bg-purple-100 text-purple-600 text-xs rounded-full">23 tareas</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">Análisis de CVs, matching y generación de perfiles</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Exitosas:</span>
                        <span className="font-medium text-green-600">18 (78%)</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Fallidas:</span>
                        <span className="font-medium text-red-600">2 (9%)</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">En proceso:</span>
                        <span className="font-medium text-blue-600">3 (13%)</span>
                      </div>
                    </div>
                  </div>

                  {/* Generación de documentos */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <i className="fas fa-file-pdf text-red-600 text-lg mr-3" />
                        <h4 className="font-medium text-gray-900">Documentos</h4>
                      </div>
                      <span className="px-2 py-1 bg-red-100 text-red-600 text-xs rounded-full">15 tareas</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">Generación de PDFs y reportes</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Exitosas:</span>
                        <span className="font-medium text-green-600">14 (93%)</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Fallidas:</span>
                        <span className="font-medium text-red-600">0 (0%)</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">En proceso:</span>
                        <span className="font-medium text-blue-600">1 (7%)</span>
                      </div>
                    </div>
                  </div>

                  {/* Notificaciones */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <i className="fas fa-bell text-green-600 text-lg mr-3" />
                        <h4 className="font-medium text-gray-900">Notificaciones</h4>
                      </div>
                      <span className="px-2 py-1 bg-green-100 text-green-600 text-xs rounded-full">45 tareas</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">Envío de emails y notificaciones</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Exitosas:</span>
                        <span className="font-medium text-green-600">42 (93%)</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Fallidas:</span>
                        <span className="font-medium text-red-600">1 (2%)</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">En proceso:</span>
                        <span className="font-medium text-blue-600">2 (5%)</span>
                      </div>
                    </div>
                  </div>

                  {/* Tareas del sistema */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <i className="fas fa-cogs text-gray-600 text-lg mr-3" />
                        <h4 className="font-medium text-gray-900">Sistema</h4>
                      </div>
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">8 tareas</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">Mantenimiento y limpieza automática</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Exitosas:</span>
                        <span className="font-medium text-green-600">8 (100%)</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Fallidas:</span>
                        <span className="font-medium text-red-600">0 (0%)</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">En proceso:</span>
                        <span className="font-medium text-blue-600">0 (0%)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tareas recientes */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Actividad Reciente</h3>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarea</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Iniciada</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duración</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trabajador</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {[
                          { id: 1, name: "analyze_cv_task", status: "SUCCESS", started: "2024-01-15 14:30", duration: "2.4s", worker: "worker-1" },
                          { id: 2, name: "generate_document_task", status: "SUCCESS", started: "2024-01-15 14:28", duration: "5.1s", worker: "worker-2" },
                          { id: 3, name: "send_notification_task", status: "SUCCESS", started: "2024-01-15 14:25", duration: "0.8s", worker: "worker-1" },
                          { id: 4, name: "profile_matching_task", status: "FAILURE", started: "2024-01-15 14:20", duration: "15.2s", worker: "worker-2" },
                          { id: 5, name: "send_bulk_notifications", status: "PROCESSING", started: "2024-01-15 14:32", duration: "30s+", worker: "worker-1" },
                        ].map((task) => (
                          <tr key={task.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{task.name}</div>
                              <div className="text-sm text-gray-500">ID: {task.id}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                task.status === 'SUCCESS' ? 'bg-green-100 text-green-800' :
                                task.status === 'FAILURE' ? 'bg-red-100 text-red-800' :
                                task.status === 'PROCESSING' ? 'bg-blue-100 text-blue-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {task.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {task.started}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {task.duration}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {task.worker}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Workers status */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado de Workers</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { name: "worker-1", status: "active", tasks: 5, uptime: "2d 14h", memory: "45%" },
                    { name: "worker-2", status: "active", tasks: 3, uptime: "2d 14h", memory: "38%" },
                    { name: "worker-3", status: "idle", tasks: 0, uptime: "2d 14h", memory: "22%" },
                  ].map((worker) => (
                    <div key={worker.name} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-gray-900">{worker.name}</h4>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          worker.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {worker.status}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Tareas activas:</span>
                          <span className="font-medium">{worker.tasks}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Tiempo activo:</span>
                          <span className="font-medium">{worker.uptime}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Memoria:</span>
                          <span className="font-medium">{worker.memory}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* LISTA DE CLIENTES */}
          {currentView === "client-list" && (
            <div className="p-6">
              <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Gestión de Clientes</h2>
                  <p className="text-gray-600 mt-1">Administra empresas y organizaciones clientes</p>
                </div>
                <div className="mt-4 sm:mt-0 flex space-x-3">
                  <button onClick={() => loadClientsData()} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                    <i className="fas fa-sync-alt mr-2" />
                    Actualizar
                  </button>
                  <button onClick={() => info("Abriendo formulario de nuevo cliente...")} className="px-4 py-2 btn-primary text-white rounded-lg">
                    <i className="fas fa-plus mr-2" />
                    Nuevo Cliente
                  </button>
                </div>
              </div>

              {/* Estadísticas de clientes */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <i className="fas fa-building text-blue-600 text-xl" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-sm font-medium text-gray-500">Total Clientes</h3>
                      <p className="text-2xl font-bold text-gray-900">{clientsData.length}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <i className="fas fa-check-circle text-green-600 text-xl" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-sm font-medium text-gray-500">Activos</h3>
                      <p className="text-2xl font-bold text-gray-900">
                        {clientsData.filter(c => c.is_active).length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <i className="fas fa-briefcase text-yellow-600 text-xl" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-sm font-medium text-gray-500">Industrias</h3>
                      <p className="text-2xl font-bold text-gray-900">
                        {new Set(clientsData.map(c => c.industry)).size}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <i className="fas fa-users text-purple-600 text-xl" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-sm font-medium text-gray-500">Contactos</h3>
                      <p className="text-2xl font-bold text-gray-900">
                        {clientsData.reduce((sum, client) => sum + (client.contacts?.length || 0), 0)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabla de clientes */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Industria</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contacto</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asignado a</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {clientsData.map((client) => (
                        <tr key={client.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center">
                                  <i className="fas fa-building text-gray-500" />
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{client.company_name}</div>
                                <div className="text-sm text-gray-500">{client.rfc}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{client.industry}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{client.contact_name}</div>
                            <div className="text-sm text-gray-500">{client.contact_email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              client.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {client.is_active ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {client.assigned_to_name || 'Sin asignar'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button onClick={() => info(`Viendo cliente ${client.id}`)} className="text-blue-600 hover:text-blue-900 mr-3">
                              <i className="fas fa-eye" />
                            </button>
                            <button onClick={() => info(`Editando cliente ${client.id}`)} className="text-green-600 hover:text-green-900 mr-3">
                              <i className="fas fa-edit" />
                            </button>
                            <button onClick={() => deleteClient(client.id)} className="text-red-600 hover:text-red-900">
                              <i className="fas fa-trash" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {clientsData.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                            <i className="fas fa-building text-4xl mb-4 block text-gray-300" />
                            No hay clientes registrados
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* LISTA DE CONTACTOS */}
          {currentView === "client-contacts" && (
            <div className="p-6">
              <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Gestión de Contactos</h2>
                  <p className="text-gray-600 mt-1">Administra contactos de clientes y prospectos</p>
                </div>
                <div className="mt-4 sm:mt-0 flex space-x-3">
                  <button onClick={() => loadContactsData()} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                    <i className="fas fa-sync-alt mr-2" />
                    Actualizar
                  </button>
                  <button onClick={() => info("Abriendo formulario de nuevo contacto...")} className="px-4 py-2 btn-primary text-white rounded-lg">
                    <i className="fas fa-plus mr-2" />
                    Nuevo Contacto
                  </button>
                </div>
              </div>

              {/* Estadísticas de contactos */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <i className="fas fa-address-book text-blue-600 text-xl" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-sm font-medium text-gray-500">Total Contactos</h3>
                      <p className="text-2xl font-bold text-gray-900">{contactsData.length}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <i className="fas fa-star text-green-600 text-xl" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-sm font-medium text-gray-500">Primarios</h3>
                      <p className="text-2xl font-bold text-gray-900">
                        {contactsData.filter(c => c.is_primary).length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <i className="fas fa-envelope text-yellow-600 text-xl" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-sm font-medium text-gray-500">Con Email</h3>
                      <p className="text-2xl font-bold text-gray-900">
                        {contactsData.filter(c => c.email).length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <i className="fas fa-phone text-purple-600 text-xl" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-sm font-medium text-gray-500">Con Teléfono</h3>
                      <p className="text-2xl font-bold text-gray-900">
                        {contactsData.filter(c => c.phone).length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabla de contactos */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contacto</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Puesto</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {contactsData.map((contact) => (
                        <tr key={contact.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                  <i className="fas fa-user text-gray-500" />
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{contact.name}</div>
                                <div className="text-sm text-gray-500">ID: {contact.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {clientsData.find(c => c.id === contact.client)?.company_name || `Cliente #${contact.client}`}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{contact.position}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{contact.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{contact.phone}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              contact.is_primary ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {contact.is_primary ? 'Primario' : 'Secundario'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button onClick={() => info(`Viendo contacto ${contact.id}`)} className="text-blue-600 hover:text-blue-900 mr-3">
                              <i className="fas fa-eye" />
                            </button>
                            <button onClick={() => info(`Editando contacto ${contact.id}`)} className="text-green-600 hover:text-green-900 mr-3">
                              <i className="fas fa-edit" />
                            </button>
                            <button onClick={() => deleteContact(contact.id)} className="text-red-600 hover:text-red-900">
                              <i className="fas fa-trash" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {contactsData.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                            <i className="fas fa-address-book text-4xl mb-4 block text-gray-300" />
                            No hay contactos registrados
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Modal Formulario Agregar Candidato - DISEÑO MEJORADO */}
        {showCandidateForm && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              {/* Header Limpio */}
              <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Agregar Candidato</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Registrar nuevo candidato en el sistema</p>
                  </div>
                  <button
                    onClick={() => setShowCandidateForm(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <i className="fas fa-times text-xl" />
                  </button>
                </div>
              </div>

              {/* Formulario con scroll */}
              <div className="overflow-y-auto max-h-[calc(90vh-140px)] bg-gray-50">
                <form onSubmit={(e) => {
                  e.preventDefault();
                  success("Candidato agregado exitosamente");
                  setShowCandidateForm(false);
                  setShowSocialNetworks(false);
                  setShowAIAnalysis(false);
                  setShowMetadata(false);
                  setCandidateForm({
                    nombres: '', apellidos: '', fullName: '', correoElectronico: '', telefono: '', telefonoAlternativo: '',
                    ciudad: '', estado: '', pais: 'México', direccionCompleta: '',
                    posicionActual: '', empresaActual: '', anosExperiencia: 0, nivelEstudios: '', universidad: '', carreraTitulo: '', habilidades: '', idiomas: '', certificaciones: '',
                    expectativaSalarialMinima: '', expectativaSalarialMaxima: '', moneda: 'MXN', salaryExpectationRange: 'No especificado',
                    disponibleDesde: '', diasPreviso: '',
                    estadoCandidato: 'Nuevo', asignadoA: '', fuenteReclutamiento: '', notasInternas: '',
                    linkedin: '', portfolio: '', github: '',
                    resumenGeneradoIA: '', puntuacionCoincidenciaIA: '', analisisCompletoIA: '',
                    creadoPor: '', fechaCreacion: '', ultimaActualizacion: '', activeApplications: ''
                  });
                }} className="p-6 space-y-6">

                  {/* 1. INFORMACIÓN PERSONAL */}
                  <div className="bg-white rounded-lg border border-gray-200 p-5">
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                      <i className="fas fa-user text-blue-600"></i>
                      <h3 className="font-semibold text-gray-900">Información Personal</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre(s) *</label>
                        <input
                          type="text"
                          value={candidateForm.nombres}
                          onChange={(e) => setCandidateForm({...candidateForm, nombres: e.target.value})}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Apellido(s) *</label>
                        <input
                          type="text"
                          value={candidateForm.apellidos}
                          onChange={(e) => setCandidateForm({...candidateForm, apellidos: e.target.value})}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Correo Electrónico *</label>
                        <input
                          type="email"
                          value={candidateForm.correoElectronico}
                          onChange={(e) => setCandidateForm({...candidateForm, correoElectronico: e.target.value})}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Teléfono *</label>
                        <input
                          type="tel"
                          value={candidateForm.telefono}
                          onChange={(e) => setCandidateForm({...candidateForm, telefono: e.target.value})}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          required
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Teléfono Alternativo</label>
                        <input
                          type="tel"
                          value={candidateForm.telefonoAlternativo}
                          onChange={(e) => setCandidateForm({...candidateForm, telefonoAlternativo: e.target.value})}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 2. UBICACIÓN */}
                  <div className="bg-white rounded-lg border border-gray-200 p-5">
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                      <i className="fas fa-map-marker-alt text-green-600"></i>
                      <h3 className="font-semibold text-gray-900">Ubicación</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Ciudad</label>
                        <input
                          type="text"
                          value={candidateForm.ciudad}
                          onChange={(e) => setCandidateForm({...candidateForm, ciudad: e.target.value})}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Estado</label>
                        <input
                          type="text"
                          value={candidateForm.estado}
                          onChange={(e) => setCandidateForm({...candidateForm, estado: e.target.value})}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">País</label>
                        <input
                          type="text"
                          value={candidateForm.pais}
                          onChange={(e) => setCandidateForm({...candidateForm, pais: e.target.value})}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Dirección Completa</label>
                        <textarea
                          value={candidateForm.direccionCompleta}
                          onChange={(e) => setCandidateForm({...candidateForm, direccionCompleta: e.target.value})}
                          rows={2}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 3. INFORMACIÓN PROFESIONAL */}
                  <div className="bg-white rounded-lg border border-gray-200 p-5">
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                      <i className="fas fa-briefcase text-purple-600"></i>
                      <h3 className="font-semibold text-gray-900">Información Profesional</h3>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Posición Actual</label>
                        <input
                          type="text"
                          value={candidateForm.posicionActual}
                          onChange={(e) => setCandidateForm({...candidateForm, posicionActual: e.target.value})}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Empresa Actual</label>
                        <input
                          type="text"
                          value={candidateForm.empresaActual}
                          onChange={(e) => setCandidateForm({...candidateForm, empresaActual: e.target.value})}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Años de Experiencia</label>
                        <input
                          type="number"
                          min="0"
                          value={candidateForm.anosExperiencia}
                          onChange={(e) => setCandidateForm({...candidateForm, anosExperiencia: parseInt(e.target.value) || 0})}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Nivel de Estudios</label>
                        <select
                          value={candidateForm.nivelEstudios}
                          onChange={(e) => setCandidateForm({...candidateForm, nivelEstudios: e.target.value})}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        >
                          <option value="">Seleccionar...</option>
                          <option value="Secundaria">Secundaria</option>
                          <option value="Bachillerato">Bachillerato</option>
                          <option value="Licenciatura">Licenciatura</option>
                          <option value="Maestría">Maestría</option>
                          <option value="Doctorado">Doctorado</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Universidad</label>
                        <input
                          type="text"
                          value={candidateForm.universidad}
                          onChange={(e) => setCandidateForm({...candidateForm, universidad: e.target.value})}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Carrera/Título</label>
                        <input
                          type="text"
                          value={candidateForm.carreraTitulo}
                          onChange={(e) => setCandidateForm({...candidateForm, carreraTitulo: e.target.value})}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Habilidades</label>
                        <textarea
                          value={candidateForm.habilidades}
                          onChange={(e) => setCandidateForm({...candidateForm, habilidades: e.target.value})}
                          rows={3}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                          placeholder="Lista de habilidades del candidato"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Idiomas</label>
                        <textarea
                          value={candidateForm.idiomas}
                          onChange={(e) => setCandidateForm({...candidateForm, idiomas: e.target.value})}
                          rows={3}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Certificaciones</label>
                        <textarea
                          value={candidateForm.certificaciones}
                          onChange={(e) => setCandidateForm({...candidateForm, certificaciones: e.target.value})}
                          rows={3}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 4. EXPECTATIVAS SALARIALES */}
                  <div className="bg-white rounded-lg border border-gray-200 p-5">
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                      <i className="fas fa-dollar-sign text-emerald-600"></i>
                      <h3 className="font-semibold text-gray-900">Expectativas Salariales</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Expectativa Salarial Mínima</label>
                        <input
                          type="number"
                          value={candidateForm.expectativaSalarialMinima}
                          onChange={(e) => setCandidateForm({...candidateForm, expectativaSalarialMinima: e.target.value})}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Expectativa Salarial Máxima</label>
                        <input
                          type="number"
                          value={candidateForm.expectativaSalarialMaxima}
                          onChange={(e) => setCandidateForm({...candidateForm, expectativaSalarialMaxima: e.target.value})}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Moneda</label>
                        <select
                          value={candidateForm.moneda}
                          onChange={(e) => setCandidateForm({...candidateForm, moneda: e.target.value})}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        >
                          <option value="MXN">MXN - Peso Mexicano</option>
                          <option value="USD">USD - Dólar Americano</option>
                          <option value="EUR">EUR - Euro</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* 5. DISPONIBILIDAD */}
                  <div className="bg-white rounded-lg border border-gray-200 p-5">
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                      <i className="fas fa-calendar-check text-orange-600"></i>
                      <h3 className="font-semibold text-gray-900">Disponibilidad</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Disponible desde</label>
                        <div className="flex gap-2">
                          <input
                            type="date"
                            value={candidateForm.disponibleDesde}
                            onChange={(e) => setCandidateForm({...candidateForm, disponibleDesde: e.target.value})}
                            className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const today = new Date().toISOString().split('T')[0];
                              setCandidateForm({...candidateForm, disponibleDesde: today});
                            }}
                            className="px-4 py-2 bg-orange-600 text-white text-sm rounded-md hover:bg-orange-700 transition-colors"
                          >
                            Hoy
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Días de Preaviso</label>
                        <input
                          type="number"
                          value={candidateForm.diasPreviso}
                          onChange={(e) => setCandidateForm({...candidateForm, diasPreviso: e.target.value})}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 6. REDES SOCIALES */}
                  <div className={`bg-white rounded-lg border border-gray-200 p-5 ${showSocialNetworks ? 'block' : 'hidden'}`}>
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                      <div className="flex items-center gap-2">
                        <i className="fas fa-share-alt text-indigo-600"></i>
                        <h3 className="font-semibold text-gray-900">Redes Sociales</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowSocialNetworks(false)}
                        className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
                      >
                        (Ocultar)
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">LinkedIn</label>
                        <input
                          type="url"
                          value={candidateForm.linkedin}
                          onChange={(e) => setCandidateForm({...candidateForm, linkedin: e.target.value})}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          placeholder="https://linkedin.com/in/usuario"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Portafolio</label>
                        <input
                          type="url"
                          value={candidateForm.portfolio}
                          onChange={(e) => setCandidateForm({...candidateForm, portfolio: e.target.value})}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          placeholder="https://miportafolio.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">GitHub</label>
                        <input
                          type="url"
                          value={candidateForm.github}
                          onChange={(e) => setCandidateForm({...candidateForm, github: e.target.value})}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          placeholder="https://github.com/usuario"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 7. ANÁLISIS DE IA */}
                  <div className={`bg-white rounded-lg border border-gray-200 p-5 ${showAIAnalysis ? 'block' : 'hidden'}`}>
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                      <div className="flex items-center gap-2">
                        <i className="fas fa-brain text-violet-600"></i>
                        <h3 className="font-semibold text-gray-900">Análisis de IA</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowAIAnalysis(false)}
                        className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
                      >
                        (Ocultar)
                      </button>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Resumen generado por IA</label>
                        <textarea
                          value={candidateForm.resumenGeneradoIA}
                          onChange={(e) => setCandidateForm({...candidateForm, resumenGeneradoIA: e.target.value})}
                          rows={3}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                          placeholder="Resumen automático generado por IA..."
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Puntuación de Coincidencia IA</label>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={candidateForm.puntuacionCoincidenciaIA}
                              onChange={(e) => setCandidateForm({...candidateForm, puntuacionCoincidenciaIA: e.target.value})}
                              className="w-full px-3 py-2 pr-10 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                              placeholder="85"
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                              <span className="text-gray-500 text-sm">%</span>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500">Puntuación de 0 a 100</p>
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Análisis Completo de IA</label>
                          <textarea
                            value={candidateForm.analisisCompletoIA}
                            onChange={(e) => setCandidateForm({...candidateForm, analisisCompletoIA: e.target.value})}
                            rows={3}
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                            placeholder="Análisis detallado generado por IA..."
                          />
                          <p className="text-xs text-gray-500">Análisis detallado generado por IA</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 8. METADATOS */}
                  <div className={`bg-white rounded-lg border border-gray-200 p-5 ${showMetadata ? 'block' : 'hidden'}`}>
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                      <div className="flex items-center gap-2">
                        <i className="fas fa-info-circle text-gray-600"></i>
                        <h3 className="font-semibold text-gray-900">Metadatos</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowMetadata(false)}
                        className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
                      >
                        (Ocultar)
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Creado por</label>
                        <div className="flex">
                          <select
                            value={candidateForm.creadoPor}
                            onChange={(e) => setCandidateForm({...candidateForm, creadoPor: e.target.value})}
                            className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          >
                            <option value="">Seleccionar usuario...</option>
                            <option value="director">Director</option>
                            <option value="supervisor">Supervisor</option>
                            <option value="reclutador">Reclutador</option>
                          </select>
                          <button type="button" className="px-3 py-2 bg-green-500 text-white hover:bg-green-600 transition-colors">
                            <i className="fas fa-plus" />
                          </button>
                          <button type="button" className="px-3 py-2 bg-red-500 text-white hover:bg-red-600 transition-colors">
                            <i className="fas fa-times" />
                          </button>
                          <button type="button" className="px-3 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 transition-colors">
                            <i className="fas fa-eye" />
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Fecha de Creación</label>
                          <input
                            type="text"
                            value={candidateForm.fechaCreacion}
                            onChange={(e) => setCandidateForm({...candidateForm, fechaCreacion: e.target.value})}
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            placeholder="-"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Última Actualización</label>
                          <input
                            type="text"
                            value={candidateForm.ultimaActualizacion}
                            onChange={(e) => setCandidateForm({...candidateForm, ultimaActualizacion: e.target.value})}
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            placeholder="-"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Active applications</label>
                        <input
                          type="text"
                          value={candidateForm.activeApplications}
                          onChange={(e) => setCandidateForm({...candidateForm, activeApplications: e.target.value})}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          placeholder="-"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 9. GESTIÓN */}
                  <div className="bg-white rounded-lg border border-gray-200 p-5">
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                      <i className="fas fa-cogs text-red-600"></i>
                      <h3 className="font-semibold text-gray-900">Gestión</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Estado</label>
                        <select
                          value={candidateForm.estadoCandidato}
                          onChange={(e) => setCandidateForm({...candidateForm, estadoCandidato: e.target.value})}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        >
                          <option value="Nuevo">Nuevo</option>
                          <option value="En Proceso">En Proceso</option>
                          <option value="Calificado">Calificado</option>
                          <option value="No Calificado">No Calificado</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Asignado a</label>
                        <select
                          value={candidateForm.asignadoA}
                          onChange={(e) => setCandidateForm({...candidateForm, asignadoA: e.target.value})}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        >
                          <option value="">Seleccionar...</option>
                          <option value="director">Director</option>
                          <option value="supervisor">Supervisor</option>
                          <option value="reclutador">Reclutador</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Fuente de Reclutamiento</label>
                        <input
                          type="text"
                          value={candidateForm.fuenteReclutamiento}
                          onChange={(e) => setCandidateForm({...candidateForm, fuenteReclutamiento: e.target.value})}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          placeholder="Ej: LinkedIn, Portal de empleo, Referido, etc."
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Notas Internas</label>
                        <textarea
                          value={candidateForm.notasInternas}
                          onChange={(e) => setCandidateForm({...candidateForm, notasInternas: e.target.value})}
                          rows={3}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 10. APLICACIONES DE CANDIDATOS */}
                  <div className="bg-white rounded-lg border border-gray-200 p-5">
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                      <i className="fas fa-clipboard-list text-teal-600"></i>
                      <h3 className="font-semibold text-gray-900">Aplicaciones de Candidatos</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Perfil</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Estado de la Aplicación</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">% Coincidencia</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Calificación</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Fecha de Aplicación</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                              <i className="fas fa-inbox text-3xl mb-2 block text-gray-400" />
                              <p className="text-sm">No hay aplicaciones registradas</p>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <button type="button" className="text-teal-600 hover:text-teal-700 text-sm font-medium flex items-center transition-colors">
                        <i className="fas fa-plus mr-2" />
                        Agregar Aplicación de Candidato
                      </button>
                    </div>
                  </div>

                  {/* 11. DOCUMENTOS DE CANDIDATOS */}
                  <div className="bg-white rounded-lg border border-gray-200 p-5">
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                      <i className="fas fa-file-alt text-blue-600"></i>
                      <h3 className="font-semibold text-gray-900">Documentos de Candidatos</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Tipo de Documento</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Archivo</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Enlace</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Descripción</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Subido por</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Fecha</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-gray-100">
                            <td className="px-4 py-3">
                              <select className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm">
                                <option>Curriculum Vitae</option>
                                <option>Carta de Presentación</option>
                                <option>Certificados</option>
                                <option>Portafolio</option>
                              </select>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center">
                                <button className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm mr-2 hover:bg-blue-700 transition-colors">
                                  Elegir archivo
                                </button>
                                <span className="text-xs text-gray-500">No hay archivo</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-gray-400 text-sm">-</span>
                            </td>
                            <td className="px-4 py-3">
                              <input type="text" className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-gray-400 text-sm">-</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-gray-400 text-sm">-</span>
                            </td>
                            <td className="px-4 py-3">
                              <button className="text-red-500 hover:text-red-700 transition-colors">
                                <i className="fas fa-times-circle" />
                              </button>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <button type="button" className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center transition-colors">
                        <i className="fas fa-plus mr-2" />
                        Agregar Documento
                      </button>
                    </div>
                  </div>

                  {/* 12. NOTAS DE CANDIDATOS */}
                  <div className="bg-white rounded-lg border border-gray-200 p-5">
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                      <i className="fas fa-sticky-note text-purple-600"></i>
                      <h3 className="font-semibold text-gray-900">Notas de Candidatos</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Nota</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Importante</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Creado por</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Fecha</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-gray-100">
                            <td className="px-4 py-3">
                              <textarea 
                                rows={2}
                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                                placeholder="Agregar nota..."
                              />
                            </td>
                            <td className="px-4 py-3 text-center">
                              <input type="checkbox" className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-2 focus:ring-purple-500" />
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-gray-400 text-sm">-</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-gray-400 text-sm">-</span>
                            </td>
                            <td className="px-4 py-3">
                              <button className="text-red-500 hover:text-red-700 transition-colors">
                                <i className="fas fa-times-circle" />
                              </button>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <button type="button" className="text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center transition-colors">
                        <i className="fas fa-plus mr-2" />
                        Agregar Nota
                      </button>
                    </div>
                  </div>

                  {/* 13. HISTORIAL DE ESTADOS */}
                  <div className="bg-white rounded-lg border border-gray-200 p-5">
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                      <i className="fas fa-history text-slate-600"></i>
                      <h3 className="font-semibold text-gray-900">Historial de Estados</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Notas</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Estado Anterior</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Estado Nuevo</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Cambiado por</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Fecha del Cambio</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                              <i className="fas fa-clock text-3xl mb-2 block text-gray-400" />
                              <p className="text-sm">No hay historial de cambios</p>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Botones para Mostrar Secciones Opcionales */}
                  <div className="bg-gray-50 px-5 py-4 rounded-lg border border-gray-200">
                    <div className="flex flex-wrap gap-3">
                      {!showSocialNetworks && (
                        <button
                          type="button"
                          onClick={() => {
                            console.log('Mostrando Redes Sociales');
                            setShowSocialNetworks(true);
                          }}
                          className="px-4 py-2 text-indigo-600 bg-white border border-indigo-300 rounded-md hover:bg-indigo-50 transition-colors text-sm font-medium"
                        >
                          <i className="fas fa-share-alt mr-2"></i>
                          Redes Sociales
                        </button>
                      )}
                      {!showAIAnalysis && (
                        <button
                          type="button"
                          onClick={() => {
                            console.log('Mostrando Análisis de IA');
                            setShowAIAnalysis(true);
                          }}
                          className="px-4 py-2 text-violet-600 bg-white border border-violet-300 rounded-md hover:bg-violet-50 transition-colors text-sm font-medium"
                        >
                          <i className="fas fa-brain mr-2"></i>
                          Análisis de IA
                        </button>
                      )}
                      {!showMetadata && (
                        <button
                          type="button"
                          onClick={() => {
                            console.log('Mostrando Metadatos');
                            setShowMetadata(true);
                          }}
                          className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium"
                        >
                          <i className="fas fa-info-circle mr-2"></i>
                          Metadatos
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Botones de acción finales */}
                  <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-between items-center shadow-lg">
                    <button
                      type="button"
                      onClick={() => setShowCandidateForm(false)}
                      className="px-6 py-2.5 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors font-medium"
                    >
                      <i className="fas fa-times mr-2"></i>
                      Cancelar
                    </button>
                    <div className="flex space-x-3">
                      <button
                        type="button"
                        className="px-6 py-2.5 bg-slate-600 text-white rounded-md hover:bg-slate-700 transition-colors font-medium shadow-sm"
                      >
                        <i className="fas fa-save mr-2"></i>
                        Guardar
                      </button>
                      <button
                        type="button"
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium shadow-sm"
                      >
                        <i className="fas fa-plus mr-2"></i>
                        Guardar y Agregar Otro
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium shadow-sm"
                      >
                        <i className="fas fa-check mr-2"></i>
                        Guardar y Continuar
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
