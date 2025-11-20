/**
 * API client utilities for the recruitment system
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResponse {
  access: string;
  refresh: string;
  user: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    full_name: string;
    role: string;
    role_display: string;
    is_active: boolean;
  };
}

interface ApiError {
  message: string;
  status: number;
  details?: any;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  /**
   * Make a HTTP request with proper error handling
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    // AGREGAR ESTE LOG TEMPORAL
  console.log('🌐 API Request:', {
    url,
    method: options.method || 'GET',
    hasToken: !!token
  });

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw {
          message: errorData.message || 'Error en la solicitud',
          status: response.status,
          details: errorData,
        } as ApiError;
      }

      return await response.json();
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) {
        throw error;
      }
      
      throw {
        message: 'Error de conexión con el servidor',
        status: 0,
        details: error,
      } as ApiError;
    }
  }

  /**
   * Login user with email and password
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    return this.makeRequest<LoginResponse>('/api/auth/token/', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(refreshToken: string): Promise<{ access: string }> {
    return this.makeRequest<{ access: string }>('/api/auth/token/refresh/', {
      method: 'POST',
      body: JSON.stringify({ refresh: refreshToken }),
    });
  }

  /**
   * Get current user information
   */
  async getCurrentUser() {
    return this.makeRequest('/api/accounts/users/me/');
  }

  /**
   * Get candidates list
   */
  async getCandidates(params?: any) {
    // Filtrar parámetros vacíos
    if (params) {
      const filteredParams: any = {};
      Object.keys(params).forEach(key => {
        if (params[key] && params[key] !== '' && params[key] !== 'all') {
          filteredParams[key] = params[key];
        }
      });
      
      const queryString = Object.keys(filteredParams).length > 0 
        ? '?' + new URLSearchParams(filteredParams).toString()
        : '';
      
      return this.makeRequest(`/api/candidates/candidates/${queryString}`);
    }
    
    return this.makeRequest('/api/candidates/candidates/');
  }

  /**
   * Get candidate by ID
   */
  async getCandidate(id: number) {
    return this.makeRequest(`/api/candidates/candidates/${id}/`);
  }

  /**
   * Create new candidate
   */
  async createCandidate(candidateData: any) {
    return this.makeRequest('/api/candidates/candidates/', {
      method: 'POST',
      body: JSON.stringify(candidateData),
    });
  }

  /**
   * Update candidate
   */
  async updateCandidate(id: number, candidateData: any) {
    return this.makeRequest(`/api/candidates/candidates/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(candidateData),
    });
  }

  /**
   * Delete candidate
   */
  async deleteCandidate(id: number) {
    return this.makeRequest(`/api/candidates/candidates/${id}/`, {
      method: 'DELETE',
    });
  }

  /**
   * Get candidate applications
   */
  async getCandidateApplications(candidateId?: number) {
    const endpoint = candidateId 
      ? `/api/candidates/applications/?candidate=${candidateId}` 
      : '/api/candidates/applications/';
    return this.makeRequest(endpoint);
  }

  /**
   * Create candidate application
   */
  async createCandidateApplication(applicationData: any) {
    return this.makeRequest('/api/candidates/applications/', {
      method: 'POST',
      body: JSON.stringify(applicationData),
    });
  }

  /**
   * Get candidate documents
   */
  async getCandidateDocuments(candidateId?: number) {
    const endpoint = candidateId 
      ? `/api/candidates/documents/?candidate=${candidateId}` 
      : '/api/candidates/documents/';
    return this.makeRequest(endpoint);
  }

  /**
   * Upload candidate document
   */
  async uploadCandidateDocument(formData: FormData) {
    return this.makeRequest('/api/candidates/documents/', {
      method: 'POST',
      body: formData,
      headers: {}, // Don't set Content-Type for FormData
    });
  }

  /**
   * Get candidate notes
   */
  async getCandidateNotes(candidateId?: number) {
    const endpoint = candidateId 
      ? `/api/candidates/notes/?candidate=${candidateId}` 
      : '/api/candidates/notes/';
    return this.makeRequest(endpoint);
  }

  /**
   * Create candidate note
   */
  async createCandidateNote(noteData: any) {
    return this.makeRequest('/api/candidates/notes/', {
      method: 'POST',
      body: JSON.stringify(noteData),
    });
  }

  /**
   * Logout user (clear tokens)
   */
  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
  }

  /**
   * Get Celery tasks status and statistics
   */
  async getCeleryTasksStatus(): Promise<any> {
    return this.makeRequest<any>('/api/director/celery-tasks/');
  }

  /**
   * Get Celery task groups information
   */
  async getCeleryTaskGroups(): Promise<any> {
    return this.makeRequest<any>('/api/director/celery-groups/');
  }

  // ====== CLIENTS ENDPOINTS ======
  
  /**
   * Get all clients
   */
  async getClients(params?: any): Promise<any> {
    const queryString = params ? `?${new URLSearchParams(params)}` : '';
    return this.makeRequest<any>(`/api/clients${queryString}`);
  }

  /**
   * Get single client by ID
   */
  async getClient(id: number): Promise<any> {
    return this.makeRequest<any>(`/api/clients/${id}/`);
  }

  /**
   * Create new client
   */
  async createClient(clientData: any): Promise<any> {
    return this.makeRequest<any>('/api/clients/', {
      method: 'POST',
      body: JSON.stringify(clientData),
    });
  }

  /**
   * Update client
   */
  async updateClient(id: number, clientData: any): Promise<any> {
    return this.makeRequest<any>(`/api/clients/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(clientData),
    });
  }

  /**
   * Delete client
   */
  async deleteClient(id: number): Promise<any> {
    return this.makeRequest<any>(`/api/clients/${id}/`, {
      method: 'DELETE',
    });
  }

  // ====== CONTACTS ENDPOINTS ======
  
  /**
   * Get all contacts
   */
  async getContacts(params?: any): Promise<any> {
    const queryString = params ? `?${new URLSearchParams(params)}` : '';
    return this.makeRequest<any>(`/api/clients/contacts${queryString}`);
  }

  /**
   * Get single contact by ID
   */
  async getContact(id: number): Promise<any> {
    return this.makeRequest<any>(`/api/clients/contacts/${id}/`);
  }

  /**
   * Create new contact
   */
  async createContact(contactData: any): Promise<any> {
    return this.makeRequest<any>('/api/clients/contacts/', {
      method: 'POST',
      body: JSON.stringify(contactData),
    });
  }

  /**
   * Update contact
   */
  async updateContact(id: number, contactData: any): Promise<any> {
    return this.makeRequest<any>(`/api/clients/contacts/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(contactData),
    });
  }

  /**
   * Delete contact
   */
  async deleteContact(id: number): Promise<any> {
    return this.makeRequest<any>(`/api/clients/contacts/${id}/`, {
      method: 'DELETE',
    });
  }

  // ====== PROFILES ENDPOINTS ======

  /**
   * Get all profiles
   */
  async getProfiles(params?: Record<string, string>): Promise<any> {
    const queryString = params ? `?${new URLSearchParams(params)}` : '';
    return this.makeRequest<any>(`/api/profiles/profiles/${queryString}`);
  }

  /**
   * Get single profile by ID
   */
  async getProfile(id: number): Promise<any> {
    return this.makeRequest<any>(`/api/profiles/profiles/${id}/`);
  }

  // ====== ADMIN DASHBOARD ======

/**
 * Get admin dashboard statistics
 */
async getAdminDashboard(): Promise<AdminDashboardStats> {
  try {
    // Cargar datos en paralelo
    const [users, clients, profiles, candidates, activities]: [any, any, any, any, any] = await Promise.all([
      this.getUsers(),
      this.getClients(),
      this.getProfiles(),
      this.getCandidates(),
      this.getUserActivities({ limit: 10 })
    ]);

    // Procesar usuarios
    const usersList = users.results || users;
    const usersStats = {
      total: usersList.length,
      active: usersList.filter((u: User) => u.is_active).length,
      inactive: usersList.filter((u: User) => !u.is_active).length,
      by_role: {
        admin: usersList.filter((u: User) => u.role === 'admin').length,
        director: usersList.filter((u: User) => u.role === 'director').length,
        supervisor: usersList.filter((u: User) => u.role === 'supervisor').length,
      }
    };

    // Procesar clientes
    const clientsList = clients.results || clients;
    const clientsStats = {
      total: clientsList.length,
      active: clientsList.filter((c: Client) => c.is_active).length,
      inactive: clientsList.filter((c: Client) => !c.is_active).length,
    };

    // Procesar perfiles
    const profilesList = profiles.results || profiles;
    const profilesStats = {
      total: profilesList.length,
      by_status: profilesList.reduce((acc: Record<string, number>, p: Profile) => {
        acc[p.status] = (acc[p.status] || 0) + 1;
        return acc;
      }, {})
    };

    // Procesar candidatos
    const candidatesList = candidates.results || candidates;
    const candidatesStats = {
      total: candidatesList.length,
      by_status: candidatesList.reduce((acc: Record<string, number>, c: Candidate) => {
        acc[c.status] = (acc[c.status] || 0) + 1;
        return acc;
      }, {})
    };

    return {
      users: usersStats,
      clients: clientsStats,
      profiles: profilesStats,
      candidates: candidatesStats,
      recent_activities: activities.results || activities
    };
  } catch (error) {
    console.error('Error loading admin dashboard:', error);
    throw error;
  }
}

// ====== USERS MANAGEMENT ======

/**
 * Get all users with optional filters
 */
async getUsers(params?: Record<string, string>): Promise<any> {
  const queryString = params ? `?${new URLSearchParams(params)}` : '';
  return this.makeRequest<any>(`/api/accounts/users/${queryString}`);
}

/**
 * Get single user by ID
 */
async getUser(id: number): Promise<User> {
  return this.makeRequest<User>(`/api/accounts/users/${id}/`);
}

/**
 * Create new user
 */
async createUser(userData: CreateUserData): Promise<User> {
  return this.makeRequest<User>('/api/accounts/users/', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
}

/**
 * Create new profile
 */
async createProfile(profileData: Partial<Profile>): Promise<Profile> {
  return this.makeRequest<Profile>('/api/profiles/profiles/', {
    method: 'POST',
    body: JSON.stringify(profileData),
  });
}

/**
 * Update profile
 */
async updateProfile(id: number, profileData: Partial<Profile>): Promise<Profile> {
  return this.makeRequest<Profile>(`/api/profiles/profiles/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(profileData),
  });
}

/**
 * Delete profile
 */
async deleteProfile(id: number): Promise<void> {
  return this.makeRequest<void>(`/api/profiles/profiles/${id}/`, {
    method: 'DELETE',
  });
}

/**
 * Update user
 */
async updateUser(id: number, userData: UpdateUserData): Promise<User> {
  return this.makeRequest<User>(`/api/accounts/users/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(userData),
  });
}

/**
 * Delete user (soft delete - set inactive)
 */
async deleteUser(id: number): Promise<void> {
  return this.makeRequest<void>(`/api/accounts/users/${id}/`, {
    method: 'DELETE',
  });
}

/**
 * Toggle user active status
 */
async toggleUserStatus(id: number, isActive: boolean): Promise<User> {
  return this.updateUser(id, { is_active: isActive });
}

/**
 * Get user activities
 */
async getUserActivities(params?: Record<string, any>): Promise<any> {
  const queryParams = params ? `?${new URLSearchParams(params)}` : '';
  return this.makeRequest<any>(`/api/accounts/activities/${queryParams}`);
}

/**
 * Get activities for specific user
 */
async getUserActivityById(userId: number): Promise<UserActivity[]> {
  return this.makeRequest<UserActivity[]>(`/api/accounts/users/${userId}/activities/`);
}

// ====== SYSTEM STATS ======

/**
 * Get system statistics
 */
async getSystemStats(): Promise<any> {
  return this.makeRequest<any>('/api/accounts/users/stats/');
}

}



export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: 'admin' | 'director' | 'supervisor';
  role_display: string;
  phone?: string;
  avatar?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}


export interface UserActivity {
  id: number;
  user: number;
  user_email: string;
  user_name: string;
  action: string;
  description: string;
  ip_address: string;
  timestamp: string;
}

export interface Client {
  id: number;
  name: string;
  industry: string;
  size: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  country: string;
  phone?: string;
  email?: string;
  assigned_to?: number;
  assigned_to_name?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: number;
  client: number;
  client_name: string;
  position_title: string;
  status: string;
  status_display: string;
  priority: string;
  service_type: string;
  assigned_to?: number;
  assigned_to_name?: string;
  created_at: string;
  updated_at: string;
}

export interface Candidate {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone?: string;
  status: string;
  status_display: string;
  current_position?: string;
  current_company?: string;
  years_experience?: number;
  created_at: string;
  updated_at: string;
}

export interface AdminDashboardStats {
  users: {
    total: number;
    active: number;
    inactive: number;
    by_role: {
      admin: number;
      director: number;
      supervisor: number;
    };
  };
  clients: {
    total: number;
    active: number;
    inactive: number;
  };
  profiles: {
    total: number;
    by_status: Record<string, number>;
  };
  candidates: {
    total: number;
    by_status: Record<string, number>;
  };
  recent_activities: UserActivity[];
}

export interface CreateUserData {
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'director' | 'supervisor';
  phone?: string;
}



export interface UpdateUserData {
  email?: string;
  first_name?: string;
  last_name?: string;
  role?: 'admin' | 'director' | 'supervisor';
  phone?: string;
  is_active?: boolean;
}

// Create and export a default instance
export const apiClient = new ApiClient();

// Export types for use in components
export type { LoginCredentials, LoginResponse, ApiError,  };





