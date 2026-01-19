/** Roles disponibles en el sistema */
export type UserRole = 'admin' | 'recruiter' | 'candidate' | 'director';

/** Información del usuario autenticado */
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  createdAt?: Date;
  lastLogin?: Date;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: 'full-time' | 'part-time' | 'contract' | 'remote';
  salary?: string;
  description: string;
  requirements: string[];
  postedAt: Date;
  status: 'active' | 'closed' | 'draft';
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone?: string;
  resume?: string;
  skills: string[];
  experience: number;
  appliedJobs: string[];
  status: 'active' | 'hired' | 'rejected';
}

/** Estados posibles de una aplicación */
export type ApplicationStatus = 'pending' | 'reviewed' | 'interviewing' | 'hired' | 'rejected';

/** Aplicación de un candidato a un empleo */
export interface Application {
  id: string;
  jobId: string;
  candidateId: string;
  appliedAt: Date;
  status: ApplicationStatus;
  notes?: string;
  updatedAt?: Date;
  reviewedBy?: string;
}

/** Respuesta paginada de la API */
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
