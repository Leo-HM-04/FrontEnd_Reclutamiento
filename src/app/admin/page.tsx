'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Mock data
const mockStats = {
  totalUsers: 25,
  activeUsers: 18,
  activeSessions: 8,
  todaySessions: 15,
  systemAlerts: 3,
  criticalAlerts: 0,
  diskUsage: 45,
  diskUsed: '450GB',
  diskTotal: '1TB',
  cpuUsage: 52,
  memoryUsage: 62,
  requestsPerMinute: 125
};

const mockUsers = [
  {
    id: 1,
    name: 'Juan Director',
    initials: 'JD',
    email: 'juan@company.com',
    role: 'director',
    status: 'active',
    lastLogin: 'Hace 2 horas'
  },
  {
    id: 2,
    name: 'María Admin',
    initials: 'MA',
    email: 'maria.admin@company.com',
    role: 'admin',
    status: 'active',
    lastLogin: 'Hace 1 hora'
  },
  {
    id: 3,
    name: 'Carlos Supervisor',
    initials: 'CS',
    email: 'carlos@company.com',
    role: 'supervisor',
    status: 'active',
    lastLogin: 'Ayer'
  }
];

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  // Data states
  const [stats, setStats] = useState(mockStats);
  const [users, setUsers] = useState(mockUsers);
  const [notifications, setNotifications] = useState([]);
  
  // Form states
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    role: '',
    password: '',
    active: true
  });

  const [userFilters, setUserFilters] = useState({
    search: '',
    role: '',
    status: ''
  });

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/auth');
      return;
    }

    // Load data
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, [router]);

  // Navigation helpers
  const getNavItemClass = (view: string) => {
    return currentView === view 
      ? 'bg-blue-50 text-blue-700'
      : 'text-gray-700 hover:bg-gray-50';
  };

  // Role helpers
  const getRoleBadgeClass = (role: string) => {
    const classes = {
      'director': 'bg-blue-100 text-blue-800',
      'admin': 'bg-blue-100 text-blue-800',
      'supervisor': 'bg-green-100 text-green-800'
    };
    return classes[role as keyof typeof classes] || 'bg-gray-100 text-gray-800';
  };

  const getRoleLabel = (role: string) => {
    const labels = {
      'director': 'Director',
      'admin': 'Admin',
      'supervisor': 'Supervisor'
    };
    return labels[role as keyof typeof labels] || role;
  };

  // User management
  const openUserModal = (user: any = null) => {
    if (user) {
      setEditingUser(user);
      setUserForm({
        name: user.name,
        email: user.email,
        role: user.role,
        password: '',
        active: user.status === 'active'
      });
    } else {
      setEditingUser(null);
      setUserForm({
        name: '',
        email: '',
        role: '',
        password: '',
        active: true
      });
    }
    setShowUserModal(true);
  };

  const saveUser = () => {
    console.log('Saving user:', userForm);
    setShowUserModal(false);
    alert(editingUser ? 'Usuario actualizado' : 'Usuario creado');
  };

  const toggleUserStatus = (user: any) => {
    const updatedUsers = users.map(u => 
      u.id === user.id 
        ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' }
        : u
    );
    setUsers(updatedUsers);
    alert(`Usuario ${user.status === 'active' ? 'desactivado' : 'activado'}`);
  };

  const deleteUser = (user: any) => {
    if (confirm(`¿Eliminar usuario ${user.name}?`)) {
      setUsers(users.filter(u => u.id !== user.id));
      alert('Usuario eliminado');
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    router.push('/auth');
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando panel de administración...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Font Awesome CSS */}
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
      
      <div className="min-h-screen bg-gray-50 font-sans antialiased">
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
                    <i className="fas fa-cog text-white text-sm"></i>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
                    <p className="text-xs text-gray-500">Sistema de Reclutamiento</p>
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
                      placeholder="Buscar..." 
                      className="w-64 px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <i className="fas fa-search absolute left-3 top-3 text-gray-400"></i>
                  </div>
                </div>

                {/* Notifications */}
                <div className="relative">
                  <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <i className="fas fa-bell text-xl"></i>
                    {notifications.length > 0 && (
                      <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                    )}
                  </button>
                  
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                      <div className="px-4 py-2 border-b border-gray-200">
                        <h3 className="font-semibold text-gray-900">Notificaciones</h3>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 && (
                          <div className="px-4 py-8 text-center text-gray-500">
                            <i className="fas fa-bell text-3xl mb-2"></i>
                            <p>No hay notificaciones</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Menu */}
                <div className="relative">
                  <button 
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">MA</span>
                    </div>
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-medium text-gray-900">María Admin</p>
                      <p className="text-xs text-gray-500">Administradora</p>
                    </div>
                    <i className="fas fa-chevron-down text-gray-400 text-xs"></i>
                  </button>

                  {showUserMenu && (
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
                  <i className="fas fa-tools text-white text-sm"></i>
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold text-gray-900 truncate">Administración</h2>
                  <p className="text-xs text-gray-500 truncate">Panel de Control</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="p-4">
              <ul className="space-y-1">
                <li>
                  <button
                    onClick={() => setCurrentView('dashboard')}
                    className={`sidebar-item flex items-center px-3 py-2 text-sm font-medium rounded-lg cursor-pointer transition-all w-full text-left ${getNavItemClass('dashboard')}`}
                  >
                    <i className="fas fa-chart-pie mr-3 w-5"></i>
                    Dashboard
                  </button>
                </li>
                
                {/* Gestión de Usuarios */}
                <li className="pt-4 pb-2">
                  <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Usuarios</p>
                </li>
                <li>
                  <button
                    onClick={() => setCurrentView('users')}
                    className={`sidebar-item flex items-center px-3 py-2 text-sm font-medium rounded-lg cursor-pointer transition-all w-full text-left ${getNavItemClass('users')}`}
                  >
                    <i className="fas fa-users mr-3 w-5"></i>
                    Usuarios
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setCurrentView('roles')}
                    className={`sidebar-item flex items-center px-3 py-2 text-sm font-medium rounded-lg cursor-pointer transition-all w-full text-left ${getNavItemClass('roles')}`}
                  >
                    <i className="fas fa-shield-alt mr-3 w-5"></i>
                    Roles y Permisos
                  </button>
                </li>
                
                {/* Comunicaciones */}
                <li className="pt-4 pb-2">
                  <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Comunicaciones</p>
                </li>
                <li>
                  <button
                    onClick={() => setCurrentView('email-templates')}
                    className={`sidebar-item flex items-center px-3 py-2 text-sm font-medium rounded-lg cursor-pointer transition-all w-full text-left ${getNavItemClass('email-templates')}`}
                  >
                    <i className="fas fa-envelope mr-3 w-5"></i>
                    Plantillas Email
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setCurrentView('email-logs')}
                    className={`sidebar-item flex items-center px-3 py-2 text-sm font-medium rounded-lg cursor-pointer transition-all w-full text-left ${getNavItemClass('email-logs')}`}
                  >
                    <i className="fas fa-paper-plane mr-3 w-5"></i>
                    Logs de Emails
                  </button>
                </li>
                
                {/* Sistema */}
                <li className="pt-4 pb-2">
                  <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Sistema</p>
                </li>
                <li>
                  <button
                    onClick={() => setCurrentView('config')}
                    className={`sidebar-item flex items-center px-3 py-2 text-sm font-medium rounded-lg cursor-pointer transition-all w-full text-left ${getNavItemClass('config')}`}
                  >
                    <i className="fas fa-cog mr-3 w-5"></i>
                    Configuración
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setCurrentView('logs')}
                    className={`sidebar-item flex items-center px-3 py-2 text-sm font-medium rounded-lg cursor-pointer transition-all w-full text-left ${getNavItemClass('logs')}`}
                  >
                    <i className="fas fa-list-alt mr-3 w-5"></i>
                    Logs del Sistema
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setCurrentView('backups')}
                    className={`sidebar-item flex items-center px-3 py-2 text-sm font-medium rounded-lg cursor-pointer transition-all w-full text-left ${getNavItemClass('backups')}`}
                  >
                    <i className="fas fa-database mr-3 w-5"></i>
                    Backups
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setCurrentView('monitoring')}
                    className={`sidebar-item flex items-center px-3 py-2 text-sm font-medium rounded-lg cursor-pointer transition-all w-full text-left ${getNavItemClass('monitoring')}`}
                  >
                    <i className="fas fa-server mr-3 w-5"></i>
                    Monitoreo
                  </button>
                </li>
              </ul>
            </nav>

            {/* System Status */}
            <div className="p-4 m-4 bg-linear-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-blue-700">Estado del Sistema</span>
                <span className="flex h-2 w-2">
                  <span className="animate-ping absolute h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative rounded-full h-2 w-2 bg-green-500"></span>
                </span>
              </div>
              <p className="text-xs text-gray-600">Todo funcionando correctamente</p>
            </div>
          </aside>

          {/* Main Content */}
          <main className={`flex-1 mt-16 p-6 ${sidebarOpen ? 'ml-64' : 'ml-0 lg:ml-64'}`}
                onClick={() => setSidebarOpen(false)}>
            
            {/* Dashboard View */}
            {currentView === 'dashboard' && (
              <div className="space-y-6">
                {/* Page Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900">Panel de Administración</h2>
                    <p className="text-gray-600 mt-1">Monitoreo y gestión del sistema</p>
                  </div>
                  <div className="mt-4 sm:mt-0 flex space-x-3">
                    <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <i className="fas fa-sync mr-2"></i>Actualizar
                    </button>
                  </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Total Users */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Usuarios</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalUsers}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          <span className="text-green-600 font-medium">{stats.activeUsers}</span> activos
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-linear-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
                        <i className="fas fa-users text-white text-xl"></i>
                      </div>
                    </div>
                  </div>

                  {/* Active Sessions */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Sesiones Activas</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">{stats.activeSessions}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          <span className="text-blue-600 font-medium">{stats.todaySessions}</span> hoy
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-linear-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
                        <i className="fas fa-server text-white text-xl"></i>
                      </div>
                    </div>
                  </div>

                  {/* System Alerts */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Alertas Sistema</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">{stats.systemAlerts}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          <span className={`font-medium ${stats.criticalAlerts > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {stats.criticalAlerts}
                          </span> críticas
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-linear-to-br from-red-500 to-red-700 rounded-lg flex items-center justify-center">
                        <i className="fas fa-exclamation-triangle text-white text-xl"></i>
                      </div>
                    </div>
                  </div>

                  {/* Disk Usage */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Uso de Disco</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">{stats.diskUsage}%</p>
                        <p className="text-sm text-gray-500 mt-1">
                          <span className="text-gray-600 font-medium">{stats.diskUsed}</span> / {stats.diskTotal}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-linear-to-br from-yellow-500 to-yellow-700 rounded-lg flex items-center justify-center">
                        <i className="fas fa-hdd text-white text-xl"></i>
                      </div>
                    </div>
                  </div>
                </div>

                {/* System Monitoring Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* CPU & Memory Usage */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Uso de Recursos</h3>
                      <button className="text-gray-400 hover:text-gray-600">
                        <i className="fas fa-refresh"></i>
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      {/* CPU Usage */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">CPU</span>
                          <span className="text-sm text-gray-500">{stats.cpuUsage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                            style={{width: `${stats.cpuUsage}%`}}
                          ></div>
                        </div>
                      </div>
                      
                      {/* Memory Usage */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Memoria</span>
                          <span className="text-sm text-gray-500">{stats.memoryUsage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                            style={{width: `${stats.memoryUsage}%`}}
                          ></div>
                        </div>
                      </div>
                      
                      {/* Disk Usage */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Disco</span>
                          <span className="text-sm text-gray-500">{stats.diskUsage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-yellow-500 h-2 rounded-full transition-all duration-300" 
                            style={{width: `${stats.diskUsage}%`}}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Request Statistics */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Tráfico de Red</h3>
                      <span className="text-2xl font-bold text-blue-600">{stats.requestsPerMinute}</span>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">Requests por minuto</p>
                    
                    {/* Simple chart representation */}
                    <div className="flex items-end space-x-1 h-24">
                      {[45, 52, 48, 61, 55, 67, 73, 69, 76, 82, 79, 85, 91, 88, 94, 97, 92, 89, 95, 125].map((value, index) => (
                        <div 
                          key={index}
                          className="bg-blue-200 rounded-t flex-1 transition-all duration-300 hover:bg-blue-300"
                          style={{height: `${(value / 125) * 100}%`}}
                        ></div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Actividad Reciente</h3>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <i className="fas fa-user-plus text-green-600 text-sm"></i>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">Nuevo usuario registrado</p>
                          <p className="text-xs text-gray-500">Ana García se registró como candidata</p>
                          <p className="text-xs text-gray-400 mt-1">Hace 5 minutos</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <i className="fas fa-briefcase text-blue-600 text-sm"></i>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">Nueva oferta de trabajo publicada</p>
                          <p className="text-xs text-gray-500">Desarrollador Full Stack - Remote</p>
                          <p className="text-xs text-gray-400 mt-1">Hace 15 minutos</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                          <i className="fas fa-envelope text-yellow-600 text-sm"></i>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">Email masivo enviado</p>
                          <p className="text-xs text-gray-500">Newsletter semanal enviada a 156 suscriptores</p>
                          <p className="text-xs text-gray-400 mt-1">Hace 1 hora</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Users View */}
            {currentView === 'users' && (
              <div className="space-y-6">
                {/* Page Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h2>
                    <p className="text-gray-600 mt-1">Administra usuarios y sus permisos</p>
                  </div>
                  <div className="mt-4 sm:mt-0">
                    <button 
                      onClick={() => openUserModal()}
                      className="px-4 py-2 bg-linear-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <i className="fas fa-user-plus mr-2"></i>Crear Usuario
                    </button>
                  </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <input 
                        type="text" 
                        value={userFilters.search}
                        onChange={(e) => setUserFilters({...userFilters, search: e.target.value})}
                        placeholder="Buscar por nombre o email..." 
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <select 
                        value={userFilters.role}
                        onChange={(e) => setUserFilters({...userFilters, role: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Todos los roles</option>
                        <option value="director">Director</option>
                        <option value="supervisor">Supervisor</option>
                        <option value="admin">Administrador</option>
                      </select>
                    </div>
                    <div>
                      <select 
                        value={userFilters.status}
                        onChange={(e) => setUserFilters({...userFilters, status: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Todos los estados</option>
                        <option value="active">Activo</option>
                        <option value="inactive">Inactivo</option>
                      </select>
                    </div>
                    <div>
                      <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        <i className="fas fa-filter mr-2"></i>Filtrar
                      </button>
                    </div>
                  </div>
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Último Acceso</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => (
                          <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                                  <span className="text-white text-sm font-medium">{user.initials}</span>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{user.email}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeClass(user.role)}`}>
                                <span>{getRoleLabel(user.role)}</span>
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                <i className={`fas fa-circle mr-1 text-xs ${user.status === 'active' ? 'text-green-600' : 'text-gray-600'}`}></i>
                                <span>{user.status === 'active' ? 'Activo' : 'Inactivo'}</span>
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.lastLogin}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                              <button 
                                onClick={() => openUserModal(user)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                              <button 
                                onClick={() => toggleUserStatus(user)}
                                className="text-yellow-600 hover:text-yellow-900"
                              >
                                <i className={`fas ${user.status === 'active' ? 'fa-pause' : 'fa-play'}`}></i>
                              </button>
                              <button 
                                onClick={() => deleteUser(user)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <i className="fas fa-trash"></i>
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

            {/* Config View */}
            {currentView === 'config' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Configuración del Sistema</h2>
                  <p className="text-gray-600 mt-1">Ajusta los parámetros globales del sistema</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuración General</h3>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del Sistema</label>
                      <input 
                        type="text" 
                        defaultValue="Sistema de Reclutamiento"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Idioma por Defecto</label>
                      <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="es">Español</option>
                        <option value="en">English</option>
                      </select>
                    </div>
                    <div className="pt-4">
                      <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        Guardar Cambios
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Other views can be implemented similarly */}

          </main>
        </div>

        {/* User Modal */}
        {showUserModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-lg bg-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingUser ? 'Editar Usuario' : 'Crear Usuario'}
                </h3>
                <button 
                  onClick={() => setShowUserModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              
              <form onSubmit={(e) => { e.preventDefault(); saveUser(); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                  <input 
                    type="text" 
                    value={userForm.name}
                    onChange={(e) => setUserForm({...userForm, name: e.target.value})}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input 
                    type="email" 
                    value={userForm.email}
                    onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                  <select 
                    value={userForm.role}
                    onChange={(e) => setUserForm({...userForm, role: e.target.value})}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar rol</option>
                    <option value="director">Director</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                
                {!editingUser && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                    <input 
                      type="password" 
                      value={userForm.password}
                      onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                      required={!editingUser}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
                
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    checked={userForm.active}
                    onChange={(e) => setUserForm({...userForm, active: e.target.checked})}
                    id="userActive"
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="userActive" className="ml-2 block text-sm text-gray-900">
                    Usuario Activo
                  </label>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button 
                    type="button" 
                    onClick={() => setShowUserModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}