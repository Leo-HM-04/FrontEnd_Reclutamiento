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
    const queryString = params ? new URLSearchParams(params).toString() : '';
    return this.makeRequest(`/api/candidates/candidates/${queryString ? `?${queryString}` : ''}`);
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
}

// Create and export a default instance
export const apiClient = new ApiClient();

// Export types for use in components
export type { LoginCredentials, LoginResponse, ApiError };