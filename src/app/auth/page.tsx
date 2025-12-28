'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUsers, 
  faEye, 
  faEyeSlash, 
  faArrowLeft, 
  faSignInAlt, 
  faInfoCircle,
  faCrown,
  faUserTie,
  faCog,
  faChevronRight,
  faCheck,
  faChevronUp,
  faChevronDown,
  faUser,
  faLock,
  faExternalLinkAlt,
  faExclamationTriangle,
  faBug
} from '@fortawesome/free-solid-svg-icons';
import { apiClient, type LoginCredentials, type ApiError } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  
  // State
  const [selectedRole, setSelectedRole] = useState('');
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [redirectProgress, setRedirectProgress] = useState(0);
  const [showCredentials, setShowCredentials] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Form data
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
    remember: false
  });

  // Role selection
  const selectRole = (role: string) => {
    setSelectedRole(role);
    setShowLoginForm(true);
    setErrorMessage('');
    
    // Clear form when selecting a role - user needs to enter real credentials
    setLoginForm({ email: '', password: '', remember: false });
  };

  const goBack = () => {
    setShowLoginForm(false);
    setSelectedRole('');
    setErrorMessage('');
    setLoginForm({ email: '', password: '', remember: false });
  };

  // Role helpers
  const getRoleDisplayName = () => {
    switch(selectedRole) {
      case 'director': return 'Director RH';
      case 'supervisor': return 'Supervisor';
      case 'admin': return 'Administrador';
      default: return '';
    }
  };

  const getRoleIcon = () => {
    switch(selectedRole) {
      case 'director': return faCrown;
      case 'supervisor': return faUserTie;
      case 'admin': return faCog;
      default: return faUser;
    }
  };

  const getRoleIconClass = () => {
    switch(selectedRole) {
      case 'director': return 'bg-linear-to-r from-blue-600 to-blue-700';
      case 'supervisor': return 'bg-linear-to-r from-green-600 to-green-700';
      case 'admin': return 'bg-linear-to-r from-orange-600 to-orange-700';
      default: return 'bg-gray-400';
    }
  };

  // Login handling
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    setLoading(true);
    setErrorMessage('');
    
    try {
      // Validate form
      if (!loginForm.email || !loginForm.password) {
        throw new Error('Por favor, completa todos los campos');
      }

      // Call API
      const credentials: LoginCredentials = {
        email: loginForm.email.trim(),
        password: loginForm.password
      };

      const response = await apiClient.login(credentials);
      
      // Verify user role matches selected role
      if (response.user.role !== selectedRole) {
        throw new Error(`El usuario no tiene el rol de ${getRoleDisplayName()}`);
      }
      
      // Store auth data
      localStorage.setItem('authToken', response.access);
      localStorage.setItem('refreshToken', response.refresh);
      localStorage.setItem('user', JSON.stringify(response.user));
      localStorage.setItem('userRole', response.user.role);
      
      // Show success modal and redirect
      setShowSuccessModal(true);
      startRedirectProgress();
      
    } catch (error) {
      console.error('Login error:', error);
      
      if (error && typeof error === 'object' && 'message' in error) {
        const apiError = error as ApiError;
        
        // Handle specific error cases
        if (apiError.status === 401) {
          setErrorMessage('Credenciales inválidas. Verifica tu email y contraseña.');
        } else if (apiError.status === 0) {
          setErrorMessage('Error de conexión. Verifica que el servidor esté funcionando.');
        } else {
          setErrorMessage(apiError.message || 'Error desconocido');
        }
      } else if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Error inesperado. Intenta nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const startRedirectProgress = () => {
    const interval = setInterval(() => {
      setRedirectProgress(prev => {
        const newProgress = prev + 5;
        if (newProgress >= 100) {
          clearInterval(interval);
          setTimeout(() => redirectToDashboard(), 1000);
        }
        return newProgress;
      });
    }, 150);
  };

  const redirectToDashboard = () => {
    setShowSuccessModal(false);
    
    // Redirect based on role
    switch(selectedRole) {
      case 'director':
        router.push('/director');
        break;
      case 'admin':
        router.push('/admin');
        break;
      case 'supervisor':
        router.push('/supervisor');
        break;
      default:
        router.push('/dashboard');
    }
  };

  return (
    <div className="bg-linear-to-br from-blue-50 via-white to-blue-50 min-h-screen">
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto h-20 w-20 bg-linear-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-2xl mb-6">
              <FontAwesomeIcon icon={faUsers} className="text-white text-2xl" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Sistema de Reclutamiento</h2>
            <p className="text-gray-600">Ingresa a tu cuenta para continuar</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="mt-8 space-y-6">
            <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
              {/* Role Selection */}
              {!showLoginForm && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 text-center mb-6">Selecciona tu rol</h3>
                  <div className="grid gap-4">
                    {/* Director Role */}
                    <div 
                      onClick={() => selectRole('director')}
                      className={`p-4 border-2 border-gray-200 rounded-xl cursor-pointer transition-all group hover:bg-gray-50 ${
                        selectedRole === 'director' ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-linear-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                          <FontAwesomeIcon icon={faCrown} className="text-white text-lg" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Director RH</h4>
                          <p className="text-sm text-gray-600">Acceso completo al sistema</p>
                        </div>
                        <div className="ml-auto">
                          <FontAwesomeIcon icon={faChevronRight} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                        </div>
                      </div>
                    </div>

                    {/* Supervisor Role */}
                    <div 
                      onClick={() => selectRole('supervisor')}
                      className={`p-4 border-2 border-gray-200 rounded-xl cursor-pointer transition-all group hover:bg-gray-50 ${
                        selectedRole === 'supervisor' ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-linear-to-r from-green-600 to-green-700 rounded-lg flex items-center justify-center">
                          <FontAwesomeIcon icon={faUserTie} className="text-white text-lg" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Supervisor</h4>
                          <p className="text-sm text-gray-600">Gestión de procesos y candidatos</p>
                        </div>
                        <div className="ml-auto">
                          <FontAwesomeIcon icon={faChevronRight} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                        </div>
                      </div>
                    </div>

                    {/* Admin Role */}
                    <div 
                      onClick={() => selectRole('admin')}
                      className={`p-4 border-2 border-gray-200 rounded-xl cursor-pointer transition-all group hover:bg-gray-50 ${
                        selectedRole === 'admin' ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-linear-to-r from-orange-600 to-orange-700 rounded-lg flex items-center justify-center">
                          <FontAwesomeIcon icon={faCog} className="text-white text-lg" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Administrador</h4>
                          <p className="text-sm text-gray-600">Configuración del sistema</p>
                        </div>
                        <div className="ml-auto">
                          <FontAwesomeIcon icon={faChevronRight} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Login Form Fields */}
              {showLoginForm && (
                <div className="space-y-6">
                  {/* Back Button */}
                  <button 
                    onClick={goBack} 
                    type="button" 
                    className="flex items-center text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
                    <span className="text-sm">Cambiar rol</span>
                  </button>

                  {/* Selected Role Display */}
                  <div className="flex items-center justify-center space-x-3 py-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getRoleIconClass()}`}>
                      <FontAwesomeIcon icon={getRoleIcon()} className="text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Ingresando como</p>
                      <p className="font-semibold text-gray-900">{getRoleDisplayName()}</p>
                    </div>
                  </div>

                  {/* Email Field */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Correo Electrónico
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FontAwesomeIcon icon={faUser} className="text-gray-400" />
                      </div>
                      <input 
                        id="email" 
                        name="email" 
                        type="email" 
                        required
                        value={loginForm.email}
                        onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="ejemplo@empresa.com"
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                      Contraseña
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FontAwesomeIcon icon={faLock} className="text-gray-400" />
                      </div>
                      <input 
                        id="password" 
                        name="password" 
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                        className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Ingresa tu contraseña"
                      />
                      <button 
                        onClick={() => setShowPassword(!showPassword)} 
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        <FontAwesomeIcon 
                          icon={showPassword ? faEyeSlash : faEye}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                        />
                      </button>
                    </div>
                  </div>

                  {/* Remember Me & Forgot Password */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input 
                        id="remember" 
                        name="remember" 
                        type="checkbox" 
                        checked={loginForm.remember}
                        onChange={(e) => setLoginForm({...loginForm, remember: e.target.checked})}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
                        Recordarme
                      </label>
                    </div>
                    <div className="text-sm">
                      <a href="#" className="text-blue-600 hover:text-blue-700 transition-colors">
                        ¿Olvidaste tu contraseña?
                      </a>
                    </div>
                  </div>

                  {/* Error Message */}
                  {errorMessage && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-500 mr-2" />
                        <span className="text-sm text-red-700">{errorMessage}</span>
                      </div>
                    </div>
                  )}

                  {/* Login Button */}
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-50"
                  >
                    {!loading ? (
                      <span>
                        <FontAwesomeIcon icon={faSignInAlt} className="mr-2" />
                        Iniciar Sesión
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Ingresando...
                      </span>
                    )}
                  </button>
                </div>
              )}
            </div>
          </form>

          {/* Information Panel */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
              <FontAwesomeIcon icon={faInfoCircle} className="text-blue-500 mr-2" />
              Información de Acceso
            </h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>• Usa el correo electrónico y contraseña asignados por el administrador</p>
              <p>• Los usuarios son creados desde el panel de administración de Django</p>
              <p>• Contacta al administrador del sistema si necesitas acceso</p>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Panel de administración: 
                <a href="http://localhost:8000/admin/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 ml-1">
                  Django Admin
                  <FontAwesomeIcon icon={faExternalLinkAlt} className="ml-1 text-xs" />
                </a>
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-gray-500">
            <p>&copy; 2024 Sistema de Reclutamiento. Todos los derechos reservados.</p>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed top-16 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm mx-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-linear-to-r from-green-600 to-green-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <FontAwesomeIcon icon={faCheck} className="text-white text-2xl" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">¡Bienvenido!</h3>
              <p className="text-gray-600 mb-6">Login exitoso. Redirigiendo al dashboard...</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${redirectProgress}%` }}
                ></div>
              </div>
              <button 
                onClick={redirectToDashboard}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FontAwesomeIcon icon={faExternalLinkAlt} className="mr-2" />
                Ir al Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}