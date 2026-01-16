export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'recruiter' | 'candidate';
  avatar?: string;
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

export interface Application {
  id: string;
  jobId: string;
  candidateId: string;
  appliedAt: Date;
  status: 'pending' | 'reviewed' | 'interviewing' | 'hired' | 'rejected';
  notes?: string;
}
