// app/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";
import ApplicationFormModal from "@/components/ApplicationFormModal";
import DirectorCandidateFormModal from "@/components/DirectorCandidateFormModal";
import CandidateDocumentFormModal from "@/components/CandidateDocumentFormModal";
import CandidateNoteFormModal from "@/components/CandidateNoteFormModal";
import ClientFormModal from "@/components/ClientFormModal";
import EvaluationsMain from "@/components/evaluations/EvaluationsMain";
import ProfilesMain from "@/components/profiles/ProfilesMain";
import CandidatesMain from "@/components/candidates/CandidatesMain";
import ClientsMain from "@/components/clients/ClientsMain";
import ProfilesStatusDashboard from '@/components/ProfilesStatusDashboard';
import CandidatesStatusDashboard from '@/components/CandidatesStatusDashboard';
import ShortlistedCandidatesDashboard from '@/components/ShortlistedCandidatesDashboard';
import SelectedCandidatesDashboard from '@/components/SelectedCandidatesDashboard';
import ReportsDashboard from '@/components/ReportsDashboard';
import IndividualReportsHub from '@/components/reports/IndividualReportsHub';
import DirectorReportsHub from '@/components/reports/DirectorReportsHub';

type Stats = {
  activeProcesses: number;
  completedCandidates: number;
  successRate: number;
  clientSatisfaction: number;
  activeProfiles: number;
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

interface DashboardData {
  overview: {
    total_profiles: number;
    active_profiles: number;
    total_candidates: number;
    active_candidates: number;
    total_clients: number;
    active_clients: number;
    success_rate: number;
  };
  this_month: {
    new_profiles: number;
    completed_profiles: number;
    hired_candidates: number;
    new_clients: number;
    cv_analyses: number;
    documents_generated: number;
  };
  profiles: {
    by_status: { [key: string]: number };
    by_priority: Array<{ priority: string; count: number }>;
    pending_approval: number;
    near_deadline: number;
  };
  candidates: {
    total: number;
    active: number;
    in_interview: number;
    with_offer: number;
    hired_this_month: number;
  };
  alerts: {
    pending_approval: number;
    near_deadline: number;
    pending_review: number;
  };
  pipeline: {
    total_positions: number;
    in_sourcing: number;
    in_screening: number;
    in_evaluation: number;
    in_interview: number;
    with_offer: number;
    hired: number;
  };
}

interface ProcessByStatus {
  status: string;
  count: number;
  color: string;
  label: string;
}

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
  // Intentar restaurar la vista desde localStorage, si no existe usar "dashboard"
  const [currentView, setCurrentView] = useState<
    "dashboard" | "processes" | "candidates" | "clients" | "team" | "approvals" | "reports" | "documents" | "applications" | "notes" | "history" | "tasks" | "client-list" | "client-contacts" | "client-progress" | "evaluations" | "profiles" | "profiles-status" | "candidates-status" | "shortlisted-candidates" | "selected-candidates" | "individual-reports"
  >("dashboard");

// Restaurar vista guardada al montar el componente (PRIMERO)
  useEffect(() => {
    const savedView = localStorage.getItem('directorCurrentView');
    if (savedView) {
      setCurrentView(savedView as any);
    }
  }, []);

  // Guardar la vista actual en localStorage cada vez que cambie (DESPUÉS)
  useEffect(() => {
    localStorage.setItem('directorCurrentView', currentView);
    console.log('💾 Vista guardada:', currentView);
  }, [currentView]);


  
  const [loading, setLoading] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [stats, setStats] = useState<Stats>({
    activeProcesses: 0,
    completedCandidates: 0,
    successRate: 0,
    clientSatisfaction: 0,
    activeProfiles: 0,
  });

  const [notifications, setNotifications] = useState<{ unread: number; items: NotificationItem[] }>({
    unread: 0,
    items: [],
  });

  const [pendingApprovals, setPendingApprovals] = useState<Approval[]>([]);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [candidatesOverview, setCandidatesOverview] = useState<any>(null);
  const [clients, setClients] = useState<ClientCard[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [documents, setDocuments] = useState<DocItem[]>([]);

  // Estado para tareas de Celery
  const [celeryData, setCeleryData] = useState<any>(null);
  const [celeryGroups, setCeleryGroups] = useState<any>(null);

  // Estado para clientes
  const [clientsData, setClientsData] = useState<Client[]>([]);
  const [contactsData, setContactsData] = useState<ContactPerson[]>([]);
  // Estado para aplicaciones
  const [applicationsData, setApplicationsData] = useState({
    total: 0,
    active: 0,
    shortlisted: 0,
    rejected: 0,
    recent: [] as any[],
    loading: true
  });

  //Estados para el DashBoard Principal
  const [processesByStatus, setProcessesByStatus] = useState<ProcessByStatus[]>([]);
  const [lastMonthData, setLastMonthData] = useState({
    profiles: 0,
    candidates: 0,
    success_rate: 0,
    client_satisfaction: 0
  });
  

  // Estado para documentos
  const [documentsData, setDocumentsData] = useState({
    total: 0,
    by_type: {
      cv: 0,
      contract: 0,  // Contratos
      report: 0,    // Reportes
      other: 0
    },
    recent: [] as any[],
    loading: true
  });

  // Estado para notas
  const [notesData, setNotesData] = useState({
    total: 0,
    by_type: {
      interview: 0,
      evaluation: 0,
      concern: 0,
      general: 0,
      reference: 0
    },
    recent: [] as any[],
    loading: true
  });

  // Estado para historial
  const [historyData, setHistoryData] = useState({
    total_candidates: 0,
    hired: 0,
    in_process: 0,
    rejected: 0,
    success_rate: 0,
    loading: true
  });
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Dropdowns
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [candidatesMenuOpen, setCandidatesMenuOpen] = useState(false);
  const [clientsMenuOpen, setClientsMenuOpen] = useState(false);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [showRejectReason, setShowRejectReason] = useState(false);
  const [showCandidateForm, setShowCandidateForm] = useState(false);
  const [showDocumentForm, setShowDocumentForm] = useState(false);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [showClientForm, setShowClientForm] = useState(false);
  
  // Estado para manejar navegación desde aplicaciones a perfiles
    const [profileToOpen, setProfileToOpen] = useState<{id: number | null, action: 'view' | 'edit' | null}>({
      id: null,
      action: null
    });
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

// Manejar parámetros de URL para navegación desde aplicaciones
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const view = params.get('view');
    const profileId = params.get('profile');
    const editProfileId = params.get('edit');
    
    if (view === 'profiles') {
      setCurrentView('profiles');
      if (profileId) {
        setProfileToOpen({ id: parseInt(profileId), action: 'view' });
      } else if (editProfileId) {
        setProfileToOpen({ id: parseInt(editProfileId), action: 'edit' });
      }
      
      // Limpiar los parámetros URL después de usarlos
      window.history.replaceState({}, '', '/director');
    }
  }, []);

  // Inicializar sidebar después de hidratación (evita hydration mismatch)
useEffect(() => {
  setMounted(true);
  
  // Detectar si es desktop
  const isDesktop = window.innerWidth >= 1024;
  
  if (isDesktop) {
    // En desktop, siempre abierto
    setSidebarOpen(true);
  } else {
    // En móvil, recuperar de localStorage
    const saved = localStorage.getItem('sidebarOpen');
    setSidebarOpen(saved === 'true');
  }
}, []);

// Listener para resize de ventana
useEffect(() => {
  if (!mounted) return;

  const handleResize = () => {
    const isDesktop = window.innerWidth >= 1024;
    if (isDesktop) {
      setSidebarOpen(true);
      localStorage.setItem('sidebarOpen', 'true');
    }
  };

  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, [mounted]);

  // ====== Chart.js ======
  const processChartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<any>(null);

  // ====== Carga inicial ======
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    
    const initializeDashboard = async () => {
      setLoading(true);
      try {
        await loadDashboardData();
        await loadApplicationsData();
        await loadDocumentsData();
        await loadNotesData();
        setupCharts();
      } catch (e) {
        console.error(e);
        error("Error cargando el dashboard");
      } finally {
        setLoading(false);
      }
    };
    
    initializeDashboard();
    
    // Configurar intervalo SOLO si estamos en dashboard
    if (currentView === 'dashboard') {
      intervalId = setInterval(() => {
        loadDashboardData();
      }, 30000);
    }
    
    // ✅ Cleanup correcto
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);


  // Intervalo inteligente: solo activo cuando estamos en la vista dashboard
useEffect(() => {
  let intervalId: NodeJS.Timeout | null = null;
  
  if (currentView === 'dashboard') {
    intervalId = setInterval(() => {
      console.log('⏰ Actualizando dashboard (intervalo de 30s)');
      loadDashboardData();
    }, 30000);
  }
  
  return () => {
    if (intervalId) {
      clearInterval(intervalId);
    }
  };
}, [currentView]);



  useEffect(() => {
    if (currentView === 'candidates' && !loading) {
      loadCandidatesData();
    }
  }, [currentView]);

  // Cargar datos de Celery cuando la vista sea "tasks"
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (currentView === "tasks") {
      loadCeleryData();
      interval = setInterval(loadCeleryData, 10000);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
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
    setDashboardLoading(true);
    
    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        router.push('/auth');
        return;
      }

      console.log('🔵 Cargando dashboard del Director...');

      // Llamada al endpoint del backend
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/director/dashboard/`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          console.error('❌ Token inválido o expirado');
          localStorage.removeItem('authToken');
          router.push('/auth');
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      
      const data: DashboardData = await response.json();
      console.log('✅ Datos del dashboard recibidos:', data);

      // ========================================
      // CALCULAR DATOS DEL MES ANTERIOR (para comparaciones)
      // ========================================
      const lastMonth = {
        profiles: Math.round(data.overview.active_profiles * 0.85),
        candidates: Math.round((data.candidates?.hired_this_month || 0) * 0.92),
        success_rate: (data.overview.success_rate || 0) * 0.97,
        client_satisfaction: 4.7
      };
      setLastMonthData(lastMonth);

      // ========================================
      // MAPEAR DATOS DEL BACKEND A STATS
      // ========================================
      setStats({
        activeProcesses: data.overview?.active_profiles || 0,
        completedCandidates: data.candidates?.hired_this_month || 0,
        successRate: data.overview?.success_rate || 0,
        clientSatisfaction: 4.7, // TODO: Agregar al backend
        activeProfiles: data.overview?.active_profiles || 0,
      });

      // ========================================
      // PROCESOS POR ESTADO - MAPEO COMPLETO
      // ========================================
      const statusMapping: { [key: string]: { label: string; color: string } } = {
        'pending': { label: 'Pendiente', color: '#F59E0B' },
        'approved': { label: 'Aprobado', color: '#3B82F6' },
        'in_progress': { label: 'En Proceso', color: '#8B5CF6' },
        'candidates_found': { label: 'Candidatos Encontrados', color: '#06B6D4' },
        'in_evaluation': { label: 'En Evaluación', color: '#F97316' },
        'in_interview': { label: 'En Entrevista', color: '#EC4899' },
        'finalists': { label: 'Finalistas', color: '#6366F1' },
        'completed': { label: 'Completado', color: '#10B981' },
        'on_hold': { label: 'En Pausa', color: '#6B7280' },
        'cancelled': { label: 'Cancelado', color: '#EF4444' },
      };

      const processesStatus: ProcessByStatus[] = Object.entries(data.profiles?.by_status || {})
        .map(([status, count]) => ({
          status,
          count: count as number,
          label: statusMapping[status]?.label || status,
          color: statusMapping[status]?.color || '#6B7280',
        }))
        .filter(item => item.count > 0)
        .sort((a, b) => b.count - a.count);

      setProcessesByStatus(processesStatus);

      // ========================================
      // NOTIFICACIONES
      // ========================================
      const alertsData = data.alerts || {};
      const notificationsList: NotificationItem[] = [];
      
      if (alertsData.pending_approval > 0) {
        notificationsList.push({
          id: 1,
          message: `${alertsData.pending_approval} perfil(es) requieren aprobación`,
          time: 'Pendiente',
          icon: 'fas fa-user-check'
        });
      }
      
      if (alertsData.near_deadline > 0) {
        notificationsList.push({
          id: 2,
          message: `${alertsData.near_deadline} perfil(es) próximos a vencer`,
          time: 'Urgente',
          icon: 'fas fa-exclamation-triangle'
        });
      }
      
      if (alertsData.pending_review > 0) {
        notificationsList.push({
          id: 3,
          message: `${alertsData.pending_review} evaluación(es) pendientes de revisión`,
          time: 'Hoy',
          icon: 'fas fa-clipboard-check'
        });
      }

      setNotifications({
        unread: notificationsList.length,
        items: notificationsList
      });

      // ========================================
      // ACTIVIDAD RECIENTE - MEJORADA
      // ========================================
      const activityList: Activity[] = [];

      // 1. Nuevos perfiles este mes
      if (data.this_month?.new_profiles > 0) {
        activityList.push({
          id: activityList.length + 1,
          type: 'info',
          icon: 'fas fa-briefcase',
          message: 'Nuevos Perfiles Creados',
          details: `${data.this_month.new_profiles} nuevo(s) perfil(es) de reclutamiento este mes`,
          time: 'Este mes'
        });
      }

      // 2. Perfiles completados
      if (data.this_month?.completed_profiles > 0) {
        activityList.push({
          id: activityList.length + 1,
          type: 'success',
          icon: 'fas fa-check-circle',
          message: 'Procesos Completados',
          details: `${data.this_month.completed_profiles} proceso(s) de reclutamiento finalizado(s)`,
          time: 'Este mes'
        });
      }

      // 3. Análisis de CVs con IA
      if (data.this_month?.cv_analyses > 0) {
        activityList.push({
          id: activityList.length + 1,
          type: 'purple',
          icon: 'fas fa-robot',
          message: 'Análisis de CVs con IA',
          details: `${data.this_month.cv_analyses} CV(s) analizados automáticamente`,
          time: 'Este mes'
        });
      }

      // 4. Nuevos clientes
      if (data.this_month?.new_clients > 0) {
        activityList.push({
          id: activityList.length + 1,
          type: 'info',
          icon: 'fas fa-building',
          message: 'Nuevos Clientes',
          details: `${data.this_month.new_clients} nuevo(s) cliente(s) agregado(s) al sistema`,
          time: 'Este mes'
        });
      }

      // 5. Contrataciones realizadas
      if (data.candidates?.hired_this_month > 0) {
        activityList.push({
          id: activityList.length + 1,
          type: 'success',
          icon: 'fas fa-user-tie',
          message: 'Candidatos Contratados',
          details: `${data.candidates.hired_this_month} candidato(s) contratado(s) exitosamente`,
          time: 'Este mes'
        });
      }

      // Si NO hay actividad, agregar mensaje informativo
      if (activityList.length === 0) {
        activityList.push({
          id: 1,
          type: 'info',
          icon: 'fas fa-info-circle',
          message: 'No hay actividad reciente',
          details: 'Comienza creando un nuevo perfil de reclutamiento',
          time: 'Hoy'
        });
      }

      setRecentActivity(activityList.slice(0, 5));

      // Limitar a las 5 actividades más recientes
      setRecentActivity(activityList.slice(0, 5));

      // ========================================
      // PROCESOS ACTIVOS
      // ========================================
      // Nota: Los procesos individuales requieren otro endpoint
      // Por ahora mantenemos los datos de ejemplo o los cargamos desde otro endpoint
      console.log('⚠️ Los procesos individuales requieren cargar desde /api/director/profiles/overview/');

      // ========================================
      // CARGAR CANDIDATOS
      // ========================================
      await loadCandidatesData();

      console.log('✅ Dashboard cargado exitosamente');

    } catch (err) {
      console.error('❌ Error al cargar dashboard:', err);
      error('Error al cargar los datos del dashboard');
    } finally {
      setDashboardLoading(false);
    }
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
  const addNewClient = () => setShowClientForm(true);
  const viewClientDetails = (id: number) => info(`Viendo detalles del cliente ${id}...`);
  const addTeamMember = () => info("Abriendo formulario para agregar miembro...");
  const viewTeamMemberProfile = (id: number) => info(`Viendo perfil del miembro ${id}...`);
  const approveAllPending = () => info("Aprobando todas las solicitudes pendientes...");
  const filterApprovals = () => info("Aplicando filtros de aprobaciones...");
  const generateMonthlyReport = () => info("Generando reporte mensual...");
  const exportAllReports = () => info("Exportando todos los reportes...");
  const uploadDocument = () => setShowDocumentForm(true);
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

  const loadCandidatesData = async () => {
  try {
    console.log('🔵 Cargando candidatos y estadísticas del director...');
    
    // Cargar candidatos y overview en paralelo
    const [candidatesResponse, overviewResponse] = await Promise.all([
      apiClient.getCandidates({ search: searchQuery }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/director/candidates/overview/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
      }).then(res => res.json())
    ]);
    
    console.log('🟢 Candidatos recibidos:', candidatesResponse);
    console.log('🟢 Overview recibido:', overviewResponse);
    
    // Procesar candidatos
    const typedCandidatesResponse = candidatesResponse as { results?: Candidate[] } | Candidate[];
    const candidatesList = Array.isArray(typedCandidatesResponse)
      ? typedCandidatesResponse
      : typedCandidatesResponse.results || [];
    
    setCandidates(candidatesList);
    setCandidatesOverview(overviewResponse);

    // ✅ VALIDAR overviewResponse
    if (!overviewResponse || typeof overviewResponse !== 'object') {
      console.warn('⚠️ overviewResponse es null, usando valores por defecto');
      setHistoryData({
        total_candidates: candidatesList.length,
        hired: 0,
        in_process: candidatesList.length,
        rejected: 0,
        success_rate: 0,
        loading: false
      });
      return;
    }

    // ✅ Calcular estadísticas (DENTRO del try, usando overviewResponse)
    const totalCandidates = overviewResponse.total || 0;
    const hired = overviewResponse.by_status?.hired || 0;
    const rejected = overviewResponse.by_status?.rejected || 0;
    const inProcess = 
      (overviewResponse.by_status?.screening || 0) +
      (overviewResponse.by_status?.qualified || 0) +
      (overviewResponse.by_status?.interview || 0) +
      (overviewResponse.by_status?.offer || 0);

    const successRate = totalCandidates > 0 
      ? Math.round((hired / totalCandidates) * 100)
      : 0;

    setHistoryData({
      total_candidates: totalCandidates,
      hired,
      in_process: inProcess,
      rejected,
      success_rate: successRate,
      loading: false
    });

  } catch (error: any) {
    console.error('❌ Error loading candidates:', error);
    
    setCandidates([]);
    setCandidatesOverview(null);
    setHistoryData({
      total_candidates: 0,
      hired: 0,
      in_process: 0,
      rejected: 0,
      success_rate: 0,
      loading: false
    });
    
    if (error?.status === 401) {
      warning('Sesión expirada. Redirigiendo al login...');
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      router.push('/auth');
    } else {
      error('Error al cargar candidatos');
    }
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

  /**
 * Cargar datos de aplicaciones desde el backend
 */
const loadApplicationsData = async () => {
  try {
    setApplicationsData(prev => ({ ...prev, loading: true }));
    
    console.log('🔵 Cargando aplicaciones desde el backend...');
    const response = await apiClient.getCandidateApplications();
    
    // El backend puede devolver datos en .results (paginado) o directamente
    const applications = (response as any)?.results || (response as any) || [];
    
    console.log('✅ Aplicaciones cargadas:', applications.length);

     // ← AGREGAR ESTE LOG PARA VER LOS DATOS
    console.log('📊 Primera aplicación completa:', applications[0]);
    console.log('📊 ¿Tiene candidate_name?', applications[0]?.candidate_name);
    console.log('📊 ¿Tiene candidate_email?', applications[0]?.candidate_email);
    
    // Calcular estadísticas
    const stats = {
      total: applications.length,
      active: applications.filter((app: any) => 
        !['rejected', 'withdrawn', 'accepted'].includes(app.status)
      ).length,
      shortlisted: applications.filter((app: any) => 
        app.status === 'shortlisted'
      ).length,
      rejected: applications.filter((app: any) => 
        ['rejected', 'withdrawn'].includes(app.status)
      ).length,
      recent: applications.slice(0, 5),
      loading: false
    };
    
    setApplicationsData(stats);
    console.log('📊 Estadísticas de aplicaciones:', stats);
    
  } catch (error: any) {
    console.error('❌ Error al cargar aplicaciones:', error);
    setApplicationsData({
      total: 0,
      active: 0,
      shortlisted: 0,
      rejected: 0,
      recent: [],
      loading: false
    });
  }

};


  /**
   * Cargar datos de documentos desde el backend
   */
  const loadDocumentsData = async () => {
    try {
      setDocumentsData(prev => ({ ...prev, loading: true }));
      
      console.log('🔵 Cargando documentos desde el backend...');
      const response = await apiClient.getCandidateDocuments();
      
      const documents = (response as any)?.results || (response as any) || [];
      
      console.log('✅ Documentos cargados:', documents.length);
      
      const stats = {
        total: documents.length,
        by_type: {
          cv: documents.filter((d: any) => d.document_type === 'cv').length,
          contract: documents.filter((d: any) => 
            d.document_type === 'contract' || d.document_type === 'cover_letter'
          ).length,
          report: documents.filter((d: any) => d.document_type === 'certificate').length,
          other: documents.filter((d: any) => 
            !['cv', 'contract', 'cover_letter', 'certificate'].includes(d.document_type)
          ).length,
        },
        recent: documents.slice(0, 5),  // ← AGREGAR ESTA LÍNEA: Tomar los 5 más recientes
        loading: false
      };
      
      setDocumentsData(stats);
      console.log('📊 Estadísticas de documentos:', stats);
      
    } catch (error: any) {
      console.error('❌ Error al cargar documentos:', error);
      setDocumentsData({
        total: 0,
        by_type: { cv: 0, contract: 0, report: 0, other: 0 },
        recent: [],  // ← AGREGAR ESTA LÍNEA
        loading: false
      });
    }
  };

  /**
   * Cargar datos de notas desde el backend
   */
  const loadNotesData = async () => {
    try {
      setNotesData(prev => ({ ...prev, loading: true }));
      
      console.log('🔵 Cargando notas desde el backend...');
      const response = await apiClient.getCandidateNotes();
      
      const notes = (response as any)?.results || (response as any) || [];
      
      console.log('✅ Notas cargadas:', notes.length);
      
      // Contar por tipo de nota
      const stats = {
        total: notes.length,
        by_type: {
          interview: notes.filter((n: any) => n.note_type === 'interview').length,
          evaluation: notes.filter((n: any) => n.note_type === 'evaluation').length,
          concern: notes.filter((n: any) => n.note_type === 'concern').length,
          general: notes.filter((n: any) => n.note_type === 'general').length,
          reference: notes.filter((n: any) => n.note_type === 'reference').length,
        },
        recent: notes, // ← TODAS las notas (no solo 2)
        loading: false
      };
      
      setNotesData(stats);
      console.log('📊 Estadísticas de notas:', stats);
      
    } catch (error: any) {
      console.error('❌ Error al cargar notas:', error);
      setNotesData({
        total: 0,
        by_type: { interview: 0, evaluation: 0, concern: 0, general: 0, reference: 0 },
        recent: [],
        loading: false
      });
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
    localStorage.removeItem("directorCurrentView");
    setTimeout(() => router.push("/auth"), 300);
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
  <div className="min-h-screen bg-gray-50 fixed inset-0 overflow-y-auto" onClick={() => {}}>
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
      <header className="bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo y Título */}
            <div className="flex items-center">
              <button 
                onClick={() => {
                  const newState = !sidebarOpen;
                  setSidebarOpen(newState);
                  localStorage.setItem('sidebarOpen', String(newState));
                }}
                className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title={sidebarOpen ? "Ocultar menú" : "Mostrar menú"}
              >
                <i className={`fas ${sidebarOpen ? 'fa-times' : 'fa-bars'} text-xl`}></i>
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

      {/* Overlay cuando sidebar está abierta */}
      {sidebarOpen && (
        <div
          className="fixed top-16 left-0 right-0 bottom-0 bg-black bg-opacity-50 z-20 transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Layout: Sidebar + Main Content */}
      <div className="flex">
        {/* Sidebar */}
        <aside className={`fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-gray-200 ${
          mounted ? 'transition-transform duration-300' : ''
        } ease-in-out z-30 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          {/* 🔧 WRAPPER PRINCIPAL - Controla el layout */}
          <div className="h-full flex flex-col">
            
            {/* Sidebar Header - Fijo arriba */}
            <div className="p-6 border-b border-gray-100 flex-shrink-0">
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

            {/* Navigation - Con scroll independiente */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4">
                <ul className="space-y-1">
                  {/* 1. DASHBOARD */}
                  <li>
                    <button onClick={() => {
                      setCurrentView("dashboard");
                      if (window.innerWidth < 1024) {
                        setSidebarOpen(false);
                      }
                    }} className={`sidebar-item flex items-center px-3 py-2 text-sm font-medium rounded-lg cursor-pointer transition-all w-full ${getNavItemClass("dashboard")}`}>
                      <i className="fas fa-chart-line mr-3 w-5" />
                      Dashboard
                    </button>
                  </li>

                  {/* 2. CLIENTES */}
                  <li>
                    <button 
                      onClick={() => {
                        setCurrentView("clients");
                        if (window.innerWidth < 1024) {
                          setSidebarOpen(false);
                        }
                      }} 
                      className={`sidebar-item flex items-center px-3 py-2 text-sm font-medium rounded-lg cursor-pointer transition-all w-full ${getNavItemClass("clients")}`}
                    >
                      <i className="fas fa-building mr-3 w-5" />
                      Clientes
                    </button>
                  </li>

                  {/* 3. PERFILES DE RECLUTAMIENTO */}
                  <li>
                    <button 
                      onClick={() => {
                        setCurrentView("profiles");
                        if (window.innerWidth < 1024) {
                          setSidebarOpen(false);
                        }
                      }} 
                      className={`sidebar-item flex items-center px-3 py-2 text-sm font-medium rounded-lg cursor-pointer transition-all w-full ${getNavItemClass("profiles")}`}
                    >
                      <i className="fas fa-briefcase mr-3 w-5" />
                      Perfiles de Reclutamiento
                      {stats.activeProfiles > 0 && (
                        <span className="ml-auto bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                          {stats.activeProfiles}
                        </span>
                      )}
                    </button>
                  </li>

                  {/* 4. CANDIDATOS */}
                  <li>
                    <button 
                      onClick={() => {
                        setCurrentView("candidates");
                        if (window.innerWidth < 1024) {
                          setSidebarOpen(false);
                        }
                      }} 
                      className={`sidebar-item flex items-center px-3 py-2 text-sm font-medium rounded-lg cursor-pointer transition-all w-full ${getNavItemClass("candidates")}`}
                    >
                      <i className="fas fa-user-tie mr-3 w-5" />
                      Candidatos
                    </button>
                  </li>

                  {/* 5. SISTEMA DE EVALUACIONES */}
                  <li>
                    <button 
                      onClick={() => {
                        setCurrentView("evaluations");
                        if (window.innerWidth < 1024) {
                          setSidebarOpen(false);
                        }
                      }} 
                      className={`sidebar-item flex items-center px-3 py-2 text-sm font-medium rounded-lg cursor-pointer transition-all w-full ${getNavItemClass("evaluations")}`}
                    >
                      <i className="fas fa-clipboard-check mr-3 w-5" />
                      Sistema de Evaluaciones
                    </button>
                  </li>

                  {/* 6. AVANCE DE CLIENTE - DESACTIVADO */}
                  <li>
                    <button 
                      disabled
                      className="sidebar-item flex items-center px-3 py-2 text-sm font-medium rounded-lg cursor-not-allowed transition-all w-full opacity-50 bg-gray-100 text-gray-500"
                    >
                      <i className="fas fa-chart-area mr-3 w-5" />
                      Avance de Cliente
                      <i className="fas fa-lock ml-auto text-xs"></i>
                    </button>
                  </li>

                  {/* REPORTES */}
                  <li>
                    <button 
                      onClick={() => setCurrentView("reports")}
                      className={`sidebar-item flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all w-full ${
                        currentView === "reports"
                          ? "bg-primary-600 text-white"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <i className="fas fa-chart-bar mr-3 w-5" />
                      Reportes
                    </button>
                  </li>

                  {/* 8. ESTADO DE PERFILES */}
                  <li>
                    <button 
                      onClick={() => {
                        setCurrentView("profiles-status");
                        if (window.innerWidth < 1024) {
                          setSidebarOpen(false);
                        }
                      }} 
                      className={`sidebar-item flex items-center px-3 py-2 text-sm font-medium rounded-lg cursor-pointer transition-all w-full ${getNavItemClass("profiles-status")}`}
                    >
                      <i className="fas fa-tasks mr-3 w-5" />
                      Estado de Perfiles
                    </button>
                  </li>

                  {/* 9. ESTADO DE CANDIDATOS */}
                  <li>
                    <button 
                      onClick={() => {
                        setCurrentView("candidates-status");
                        if (window.innerWidth < 1024) {
                          setSidebarOpen(false);
                        }
                      }} 
                      className={`sidebar-item flex items-center px-3 py-2 text-sm font-medium rounded-lg cursor-pointer transition-all w-full ${getNavItemClass("candidates-status")}`}
                    >
                      <i className="fas fa-user-check mr-3 w-5" />
                      Estado de Candidatos
                    </button>
                  </li>

                  {/* 10. PRESELECCIONADOS */}
                  <li>
                    <button 
                      onClick={() => {
                        setCurrentView("shortlisted-candidates");
                        if (window.innerWidth < 1024) {
                          setSidebarOpen(false);
                        }
                      }} 
                      className={`sidebar-item flex items-center px-3 py-2 text-sm font-medium rounded-lg cursor-pointer transition-all w-full ${getNavItemClass("shortlisted-candidates")}`}
                    >
                      <i className="fas fa-star mr-3 w-5" />
                      Preseleccionados
                    </button>
                  </li>

                  {/* 11. CANDIDATOS SELECCIONADOS */}
                  <li>
                    <button 
                      onClick={() => {
                        setCurrentView("selected-candidates");
                        if (window.innerWidth < 1024) {
                          setSidebarOpen(false);
                        }
                      }} 
                      className={`sidebar-item flex items-center px-3 py-2 text-sm font-medium rounded-lg cursor-pointer transition-all w-full ${getNavItemClass("selected-candidates")}`}
                    >
                      <i className="fas fa-user-check mr-3 w-5" />
                      Candidatos Seleccionados
                    </button>
                  </li>

                  {/* 12. REPORTES INDIVIDUALES */}
                  <li>
                    <button 
                      onClick={() => {
                        setCurrentView("individual-reports");
                        if (window.innerWidth < 1024) {
                          setSidebarOpen(false);
                        }
                      }} 
                      className={`sidebar-item flex items-center px-3 py-2 text-sm font-medium rounded-lg cursor-pointer transition-all w-full ${getNavItemClass("individual-reports")}`}
                    >
                      <i className="fas fa-file-alt mr-3 w-5" />
                      Reportes Individuales
                    </button>
                  </li>
                </ul>
              </div>
            </div>
        </div>
        </aside>

        {/* Main Content */}
        <main className={`flex-1 pt-16 bg-gray-50 transition-all duration-300 relative z-25 min-h-screen ${
          sidebarOpen ? 'lg:ml-64' : 'ml-0'
        }`}>
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
                      <p className="text-3xl font-bold text-gray-900 mt-2">{candidates.length}</p>
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

          {currentView === "candidates" && (
            <CandidatesMain />
          )}

          {/* OLD CANDIDATES VIEW - DISABLED */}
          {false && (
            <div className="p-6">
              <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Gestión de Candidatos</h2>
                  <p className="text-gray-600 mt-1">Visualiza y administra todos los candidatos en el sistema</p>
                </div>
                <div className="mt-4 sm:mt-0 flex space-x-3">
                  <button 
                    onClick={async () => {
                      setLoading(true);
                      await loadCandidatesData();
                      setLoading(false);
                      success("Datos actualizados correctamente");
                    }} 
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    disabled={loading}
                  >
                    <i className={`fas fa-sync mr-2 ${loading ? 'fa-spin' : ''}`} />
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
              {/* Total Candidatos */}
              <div className="card-hover bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-blue-100">
                    <i className="fas fa-users text-blue-600 text-xl" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Candidatos</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {candidatesOverview?.total || candidates.length || 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* Candidatos Activos */}
              <div className="card-hover bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-green-100">
                    <i className="fas fa-check-circle text-green-600 text-xl" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Activos</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {candidatesOverview?.by_status?.find((s: any) => s.status === 'qualified')?.count || 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* En Evaluación */}
              <div className="card-hover bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-yellow-100">
                    <i className="fas fa-clipboard-check text-yellow-600 text-xl" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">En Evaluación</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {candidatesOverview?.by_status?.find((s: any) => s.status === 'screening')?.count || 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contratados */}
              <div className="card-hover bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-purple-100">
                    <i className="fas fa-user-check text-purple-600 text-xl" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Contratados</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {candidatesOverview?.by_status?.find((s: any) => s.status === 'hired')?.count || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>

              {/* Grid candidatos */}
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {loading ? (
                    <div className="col-span-full flex justify-center items-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                      <span className="ml-3 text-gray-600">Cargando candidatos...</span>
                    </div>
                  ) : candidates.length === 0 ? (
                    <div className="col-span-full text-center py-12 empty-state">
                      <i className="fas fa-user-tie text-6xl text-gray-300 mb-4" />
                      <p className="text-gray-500">No hay candidatos registrados</p>
                    </div>
                  ) : (
                    candidates.map((c: any) => (
                      <div key={c.id} className="card-hover bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center">
                            <img
                              className="h-12 w-12 rounded-full border-2 border-gray-200"
                              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(c.full_name || `${c.first_name} ${c.last_name}`)}&background=3b82f6&color=fff`}
                              alt={c.full_name || `${c.first_name} ${c.last_name}`}
                            />
                            <div className="ml-3">
                              <h3 className="text-sm font-semibold text-gray-900">
                                {c.full_name || `${c.first_name} ${c.last_name}`}
                              </h3>
                              <p className="text-xs text-gray-500">{c.current_position || 'Sin posición'}</p>
                            </div>
                          </div>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            c.status === 'hired' ? 'bg-green-100 text-green-800' :
                            c.status === 'qualified' ? 'bg-blue-100 text-blue-800' :
                            c.status === 'interview' ? 'bg-purple-100 text-purple-800' :
                            c.status === 'screening' ? 'bg-yellow-100 text-yellow-800' :
                            c.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {c.status_display || c.status || 'Nuevo'}
                          </span>
                        </div>
                        <div className="space-y-2 mb-4 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Email:</span>
                            <span className="text-gray-900 truncate ml-2">{c.email}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Teléfono:</span>
                            <span className="text-gray-900">{c.phone || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Experiencia:</span>
                            <span className="text-gray-900">{c.years_experience || 0} años</span>
                          </div>
                          {c.current_company && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Empresa:</span>
                              <span className="text-gray-900 truncate ml-2">{c.current_company}</span>
                            </div>
                          )}
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
                          <span className="text-xs text-gray-500">
                            {new Date(c.created_at).toLocaleDateString('es-MX')}
                          </span>
                        </div>
                      </div>
                    ))
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
                      {applicationsData.loading ? (
                        <div className="animate-pulse">
                          <div className="h-8 bg-gray-200 rounded w-16 mt-2"></div>
                        </div>
                      ) : (
                        <p className="text-2xl font-bold text-gray-900">{applicationsData.total}</p>
                      )}
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
                      {applicationsData.loading ? (
                        <div className="animate-pulse">
                          <div className="h-8 bg-gray-200 rounded w-12 mt-2"></div>
                        </div>
                      ) : (
                        <p className="text-2xl font-bold text-gray-900">{applicationsData.shortlisted}</p>
                      )}
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
                      {applicationsData.loading ? (
                        <div className="animate-pulse">
                          <div className="h-8 bg-gray-200 rounded w-12 mt-2"></div>
                        </div>
                      ) : (
                        <p className="text-2xl font-bold text-gray-900">{applicationsData.active}</p>
                      )}
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
                      {applicationsData.loading ? (
                        <div className="animate-pulse">...</div>
                      ) : (
                        <p className="text-2xl font-bold text-gray-900">
                          {applicationsData.total > 0 
                            ? Math.round((applicationsData.shortlisted / applicationsData.total) * 100) 
                            : 0}%
                        </p>
                      )}
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
                      {applicationsData.loading ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <p className="mt-2 text-gray-500">Cargando aplicaciones...</p>
                          </td>
                        </tr>
                      ) : applicationsData.total === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center">
                            <div className="text-gray-400">
                              <i className="fas fa-inbox text-5xl mb-4"></i>
                              <p className="text-lg font-medium text-gray-900">No hay aplicaciones registradas</p>
                              <p className="text-gray-500 mt-1">Las aplicaciones aparecerán aquí cuando se agreguen</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        // Mostrar aplicaciones reales
                        applicationsData.recent.map((app: any) => {
                          // Calcular tiempo transcurrido
                          const appliedDate = new Date(app.applied_at);
                          const now = new Date();
                          const diffMs = now.getTime() - appliedDate.getTime();
                          const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                          const diffDays = Math.floor(diffHours / 24);
                          
                          let timeAgo = '';
                          if (diffHours < 1) timeAgo = 'Hace menos de 1 hora';
                          else if (diffHours < 24) timeAgo = `Hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
                          else if (diffDays === 1) timeAgo = 'Hace 1 día';
                          else timeAgo = `Hace ${diffDays} días`;

                          // Configuración de badge según estado
                          const getStatusBadge = (status: string) => {
                            const configs: Record<string, { color: string; label: string; icon: string }> = {
                              applied: { color: 'bg-blue-100 text-blue-800', label: 'Aplicó', icon: 'fa-clock' },
                              screening: { color: 'bg-yellow-100 text-yellow-800', label: 'En Revisión', icon: 'fa-eye' },
                              shortlisted: { color: 'bg-green-100 text-green-800', label: 'Preseleccionado', icon: 'fa-check-circle' },
                              interview_scheduled: { color: 'bg-purple-100 text-purple-800', label: 'Entrevista Programada', icon: 'fa-calendar-alt' },
                              interviewed: { color: 'bg-indigo-100 text-indigo-800', label: 'Entrevistado', icon: 'fa-user' },
                              offered: { color: 'bg-orange-100 text-orange-800', label: 'Oferta Extendida', icon: 'fa-briefcase' },
                              accepted: { color: 'bg-green-100 text-green-800', label: 'Aceptado', icon: 'fa-check-circle' },
                              rejected: { color: 'bg-red-100 text-red-800', label: 'Rechazado', icon: 'fa-times-circle' },
                              withdrawn: { color: 'bg-gray-100 text-gray-800', label: 'Retirado', icon: 'fa-times' },
                            };
                            return configs[status] || configs.applied;
                          };

                          const statusConfig = getStatusBadge(app.status);

                          // Obtener nombre del candidato
                          const candidateName = app.candidate_name || 'Candidato sin nombre';
                          const candidateEmail = app.candidate_email || 'Sin email';

                          // Iniciales para avatar
                          const initials = candidateName.split(' ')
                            .map((n: string) => n[0])
                            .slice(0, 2)
                            .join('')
                            .toUpperCase();

                          return (
                            <tr key={app.id} className="table-row hover:bg-gray-50">
                              {/* Candidato */}
                              <td className="px-6 py-4">
                                <div className="flex items-center">
                                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                                    {initials}
                                  </div>
                                  <div className="ml-3">
                                    <p className="text-sm font-medium text-gray-900">{candidateName}</p>
                                    <p className="text-sm text-gray-500">{candidateEmail}</p>
                                  </div>
                                </div>
                              </td>

                              {/* Posición */}
                              <td className="px-6 py-4">
                                <p className="text-sm font-medium text-gray-900">
                                  {app.profile_title || app.profile?.position_title || 'Posición no especificada'}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {app.profile_client || app.profile?.client_name || 'Cliente no especificado'}
                                </p>
                              </td>

                              {/* Fecha */}
                              <td className="px-6 py-4">
                                <p className="text-sm text-gray-900">{timeAgo}</p>
                                <p className="text-xs text-gray-500">
                                  {appliedDate.toLocaleDateString('es-MX', { 
                                    day: '2-digit', 
                                    month: 'short', 
                                    year: 'numeric' 
                                  })}
                                </p>
                              </td>

                              {/* Compatibilidad */}
                              <td className="px-6 py-4">
                                {app.match_percentage !== null && app.match_percentage !== undefined ? (
                                  <div className="flex items-center">
                                    <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                                      <div 
                                        className={`h-2 rounded-full ${
                                          app.match_percentage >= 80 ? 'bg-green-500' :
                                          app.match_percentage >= 60 ? 'bg-yellow-500' :
                                          'bg-red-500'
                                        }`}
                                        style={{ width: `${app.match_percentage}%` }}
                                      ></div>
                                    </div>
                                    <span className="text-sm font-medium text-gray-900">
                                      {Math.round(app.match_percentage)}%
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-sm text-gray-400">No calculado</span>
                                )}
                              </td>

                              {/* Estado */}
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
                                  <i className={`fas ${statusConfig.icon} mr-1.5`}></i>
                                  {statusConfig.label}
                                </span>
                              </td>

                              {/* Acciones */}
                              <td className="px-6 py-4 text-right space-x-2">
                                <button 
                                  onClick={() => router.push(`/director/candidates/applications`)}
                                  className="text-blue-600 hover:text-blue-900"
                                  title="Ver detalles"
                                >
                                  <i className="fas fa-eye"></i>
                                </button>
                                <button 
                                  onClick={() => {
                                    console.log('Editar aplicación:', app.id);
                                    info('Funcionalidad de edición en construcción');
                                  }}
                                  className="text-green-600 hover:text-green-900"
                                  title="Editar"
                                >
                                  <i className="fas fa-edit"></i>
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          

          {/* Modal Formulario Nueva Aplicación */}
          <ApplicationFormModal
            isOpen={showApplicationForm}
            onClose={() => setShowApplicationForm(false)}
            onSubmit={(data) => {
              console.log("Datos del formulario:", data);
              // Aquí se manejará el envío al backend
            }}
            onSuccess={success}
          />

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
                  <button onClick={() => setShowNoteForm(true)} className="px-4 py-2 btn-primary text-white rounded-lg">
                    <i className="fas fa-plus mr-2" />
                    Nueva Nota
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                <i className="fas fa-sticky-note text-gray-300 text-6xl mb-4"></i>
                <p className="text-lg font-medium text-gray-900">Sección de Notas</p>
                <p className="text-gray-500 mt-1">
                  Las notas detalladas están en: Candidatos → Notas
                </p>
                <button
                  onClick={() => router.push('/director/candidates/notes')}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <i className="fas fa-arrow-right mr-2"></i>
                  Ir a Notas
                </button>
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
                {historyData.loading ? (
                  // Loading skeleton
                  [1, 2, 3, 4].map((i) => (
                    <div key={i} className="card-hover bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                      <div className="animate-pulse">
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                          <div className="ml-4 flex-1">
                            <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                            <div className="h-6 bg-gray-200 rounded w-16"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <>
                    {/* Total Candidatos */}
                    <div className="card-hover bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                      <div className="flex items-center">
                        <div className="p-3 rounded-full bg-blue-100">
                          <i className="fas fa-users text-blue-600 text-xl" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Total Candidatos</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {historyData.total_candidates.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Contratados */}
                    <div className="card-hover bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                      <div className="flex items-center">
                        <div className="p-3 rounded-full bg-green-100">
                          <i className="fas fa-check-circle text-green-600 text-xl" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Contratados</p>
                          <p className="text-2xl font-bold text-gray-900">{historyData.hired}</p>
                        </div>
                      </div>
                    </div>

                    {/* En Proceso */}
                    <div className="card-hover bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                      <div className="flex items-center">
                        <div className="p-3 rounded-full bg-yellow-100">
                          <i className="fas fa-clock text-yellow-600 text-xl" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">En Proceso</p>
                          <p className="text-2xl font-bold text-gray-900">{historyData.in_process}</p>
                        </div>
                      </div>
                    </div>

                    {/* Tasa de Éxito */}
                    <div className="card-hover bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                      <div className="flex items-center">
                        <div className="p-3 rounded-full bg-purple-100">
                          <i className="fas fa-chart-line text-purple-600 text-xl" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Tasa Éxito</p>
                          <p className="text-2xl font-bold text-gray-900">{historyData.success_rate}%</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
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
                      {historyData.loading ? (
                        // Loading skeleton
                        [1, 2, 3].map((i) => (
                          <li key={i}>
                            <div className="relative pb-8">
                              {i < 3 && <div className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"></div>}
                              <div className="relative flex space-x-3">
                                <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                                <div className="flex-1 space-y-2">
                                  <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                                  <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                                </div>
                              </div>
                            </div>
                          </li>
                        ))
                      ) : candidates.length === 0 ? (
                        <li className="text-center py-12">
                          <i className="fas fa-inbox text-gray-300 text-5xl mb-4"></i>
                          <p className="text-gray-500">No hay actividad reciente</p>
                        </li>
                      ) : (
                        candidates.slice(0, 5).map((candidate: any, index: number) => {
                          // Determinar icono y color según estado
                          const getStatusConfig = (status: string) => {
                            const configs: Record<string, { icon: string; color: string; bgColor: string; label: string }> = {
                              hired: { icon: 'fa-user-check', color: 'text-white', bgColor: 'bg-green-500', label: 'fue contratado' },
                              interview: { icon: 'fa-comments', color: 'text-white', bgColor: 'bg-blue-500', label: 'está en entrevista' },
                              qualified: { icon: 'fa-check-circle', color: 'text-white', bgColor: 'bg-purple-500', label: 'fue calificado' },
                              new: { icon: 'fa-user-plus', color: 'text-white', bgColor: 'bg-indigo-500', label: 'se registró' },
                              screening: { icon: 'fa-search', color: 'text-white', bgColor: 'bg-yellow-500', label: 'está en revisión' },
                              rejected: { icon: 'fa-times-circle', color: 'text-white', bgColor: 'bg-red-500', label: 'fue rechazado' },
                            };
                            return configs[status] || configs.new;
                          };

                          const config = getStatusConfig(candidate.status);

                          // Calcular tiempo transcurrido
                          const updatedDate = new Date(candidate.updated_at || candidate.created_at);
                          const now = new Date();
                          const diffMs = now.getTime() - updatedDate.getTime();
                          const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                          const diffDays = Math.floor(diffHours / 24);
                          
                          let timeAgo = '';
                          if (diffHours < 1) timeAgo = 'Hace menos de 1 hora';
                          else if (diffHours < 24) timeAgo = `Hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
                          else if (diffDays === 1) timeAgo = 'Hace 1 día';
                          else timeAgo = `Hace ${diffDays} días`;

                          return (
                            <li key={candidate.id}>
                              <div className="relative pb-8">
                                {index < candidates.length - 1 && (
                                  <div className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"></div>
                                )}
                                <div className="relative flex space-x-3">
                                  <div>
                                    <span className={`h-8 w-8 rounded-full ${config.bgColor} flex items-center justify-center ring-8 ring-white`}>
                                      <i className={`fas ${config.icon} ${config.color} text-sm`} />
                                    </span>
                                  </div>
                                  <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                    <div>
                                      <p className="text-sm text-gray-900">
                                        <strong>{candidate.full_name || `${candidate.first_name} ${candidate.last_name}`}</strong> {config.label}
                                        {candidate.current_position && (
                                          <span className="font-medium text-gray-900"> para {candidate.current_position}</span>
                                        )}
                                      </p>
                                      <p className="mt-0.5 text-sm text-gray-500">
                                        {candidate.email}
                                        {candidate.years_experience && ` • ${candidate.years_experience} años de experiencia`}
                                      </p>
                                    </div>
                                    <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                      <time>{timeAgo}</time>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </li>
                          );
                        })
                      )}
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

          {/* CLIENTS - Using new ClientsMain component */}
          {currentView === "clients" && <ClientsMain />}

          {/* OLD CLIENTS VIEW - DISABLED */}
          {false && (
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

          {/* REPORTES - CENTRO DE INTELIGENCIA */}
          {currentView === "reports" && <DirectorReportsHub />}

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
                {documentsData.loading ? (
                  // Loading skeleton para 4 tarjetas
                  [1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <div className="animate-pulse">
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                        </div>
                        <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                        <div className="h-6 bg-gray-200 rounded w-32"></div>
                      </div>
                    </div>
                  ))
                ) : (
                  [
                    { 
                      icon: "fas fa-file-pdf", 
                      title: "CVs", 
                      count: documentsData.by_type.cv, 
                      wrap: "bg-blue-100 text-blue-600", 
                      btn: "bg-blue-50 text-blue-600 hover:bg-blue-100" 
                    },
                    { 
                      icon: "fas fa-file-contract", 
                      title: "Contratos", 
                      count: documentsData.by_type.contract, 
                      wrap: "bg-green-100 text-green-600", 
                      btn: "bg-green-50 text-green-600 hover:bg-green-100" 
                    },
                    { 
                      icon: "fas fa-file-alt", 
                      title: "Reportes", 
                      count: documentsData.by_type.report, 
                      wrap: "bg-purple-100 text-purple-600", 
                      btn: "bg-purple-50 text-purple-600 hover:bg-purple-100" 
                    },
                    { 
                      icon: "fas fa-folder", 
                      title: "Otros", 
                      count: documentsData.by_type.other, 
                      wrap: "bg-yellow-100 text-yellow-600", 
                      btn: "bg-yellow-50 text-yellow-600 hover:bg-yellow-100" 
                    },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className={`w-12 h-12 ${item.wrap} rounded-lg flex items-center justify-center`}>
                          <i className={`${item.icon} text-xl`} />
                        </div>
                      </div>
                      <h3 className="text-gray-600 text-sm font-medium mb-1">{item.title}</h3>
                      <p className="text-2xl font-bold text-gray-900">{item.count}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {item.count === 1 ? 'documento' : 'documentos'}
                      </p>
                    </div>
                  ))
                )}
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Documentos Recientes</h2>
                </div>
                
                <div className="divide-y divide-gray-200">
                  {documentsData.loading ? (
                    // Loading skeleton
                    [1, 2].map((i) => (
                      <div key={i} className="px-6 py-4 animate-pulse">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : documentsData.recent.length === 0 ? (
                    // No hay documentos
                    <div className="px-6 py-12 text-center">
                      <div className="text-gray-400">
                        <i className="fas fa-inbox text-5xl mb-4"></i>
                        <p className="text-lg font-medium text-gray-900">No hay documentos recientes</p>
                        <p className="text-gray-500 mt-1">Los documentos aparecerán aquí cuando se suban</p>
                      </div>
                    </div>
                  ) : (
                    // Lista de documentos reales
                    documentsData.recent.map((doc: any) => {
                      // Calcular hace cuánto tiempo
                      const uploadedDate = new Date(doc.uploaded_at);
                      const now = new Date();
                      const diffMs = now.getTime() - uploadedDate.getTime();
                      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                      const diffDays = Math.floor(diffHours / 24);
                      
                      let timeAgo = '';
                      if (diffHours < 1) timeAgo = 'Hace menos de 1 hora';
                      else if (diffHours < 24) timeAgo = `Hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
                      else if (diffDays === 1) timeAgo = 'Hace 1 día';
                      else timeAgo = `Hace ${diffDays} días`;
                      
                      // Determinar icono según tipo
                      const getIcon = (type: string) => {
                        switch(type) {
                          case 'cv': return { icon: 'fa-file-pdf', color: 'text-red-500' };
                          case 'certificate': return { icon: 'fa-certificate', color: 'text-green-500' };
                          case 'portfolio': return { icon: 'fa-folder', color: 'text-purple-500' };
                          case 'cover_letter': return { icon: 'fa-file-alt', color: 'text-blue-500' };
                          default: return { icon: 'fa-file', color: 'text-gray-500' };
                        }
                      };
                      
                      const iconConfig = getIcon(doc.document_type);
                      
                      // Calcular tamaño del archivo
                      const fileSize = doc.file_size 
                        ? `${(doc.file_size / (1024 * 1024)).toFixed(1)} MB`
                        : 'Tamaño desconocido';
                      
                      return (
                        <div key={doc.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between">
                            {/* Icono y nombre */}
                            <div className="flex items-center space-x-4 flex-1 min-w-0">
                              <div className="flex-shrink-0">
                                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                  <i className={`fas ${iconConfig.icon} ${iconConfig.color} text-lg`}></i>
                                </div>
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {doc.original_filename || 'Documento sin nombre'}
                                </p>
                                <p className="text-sm text-gray-500">
                                  Subido por {doc.uploaded_by_name || 'Usuario'} • {timeAgo} • {fileSize}
                                </p>
                              </div>
                            </div>
                            
                            {/* Acciones */}
                            <div className="flex items-center space-x-2 ml-4">
                              <button
                                onClick={() => window.open(doc.file_url, '_blank')}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Ver documento"
                              >
                                <i className="fas fa-eye"></i>
                              </button>
                              <button
                                onClick={() => {
                                  const link = document.createElement('a');
                                  link.href = doc.file_url;
                                  link.download = doc.original_filename;
                                  link.click();
                                }}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Descargar"
                              >
                                <i className="fas fa-download"></i>
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm('¿Estás seguro de que deseas eliminar este documento?')) {
                                    console.log('Eliminar documento:', doc.id);
                                    // Aquí puedes agregar la lógica de eliminación
                                  }
                                }}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Eliminar"
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                
                {/* Footer con link a ver todos */}
                {documentsData.recent.length > 0 && (
                  <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                    <button 
                      onClick={() => router.push('/director/candidates/documents')}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Ver todos los documentos ({documentsData.total}) →
                    </button>
                  </div>
                )}
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

        {/* SISTEMA DE EVALUACIONES */}
        {currentView === "evaluations" && <EvaluationsMain />}

        {currentView === "profiles" && (
          <ProfilesMain 
            initialProfileId={profileToOpen.id}
            initialAction={profileToOpen.action || undefined}
          />
        )}

        {currentView === "candidates-status" && <CandidatesStatusDashboard />}

        {currentView === "shortlisted-candidates" && <ShortlistedCandidatesDashboard />}

        {currentView === "selected-candidates" && <SelectedCandidatesDashboard />}
        
        {currentView === "individual-reports" && <IndividualReportsHub />}

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
                  <button onClick={addNewClient} className="px-4 py-2 btn-primary text-white rounded-lg">
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

          {currentView === "profiles-status" && <ProfilesStatusDashboard />}

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

        {/* Modal Formulario Agregar Candidato */}
        <DirectorCandidateFormModal 
          isOpen={showCandidateForm}
          onClose={() => setShowCandidateForm(false)}
          onSuccess={success}
        />

        {/* Modal Formulario Agregar Documento */}
        <CandidateDocumentFormModal 
          isOpen={showDocumentForm}
          onClose={() => setShowDocumentForm(false)}
          onSuccess={success}
        />

        {/* Modal Formulario Agregar Nota */}
        <CandidateNoteFormModal 
          isOpen={showNoteForm}
          onClose={() => setShowNoteForm(false)}
          onSuccess={success}
        />

        {/* Modal Formulario Agregar Cliente */}
        <ClientFormModal 
          isOpen={showClientForm}
          onClose={() => setShowClientForm(false)}
          onSuccess={success}
        />
      </div>
    </div>
  );
}
