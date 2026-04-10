// TypeScript interfaces for client dashboard

export type ProjectStatus = 'active' | 'pending' | 'completed' | 'cancelled';
export type MilestoneStatus = 'pending' | 'in_progress' | 'completed' | 'approved' | 'paid';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  email: string;
  hourlyRate: number;
  skills: string[];
  availability: 'available' | 'busy' | 'offline';
}

export interface Technology {
  name: string;
  category: string;
  icon?: string;
}

export interface Milestone {
  id: string;
  name: string;
  description: string;
  status: MilestoneStatus;
  amount: number;
  startDate: Date;
  dueDate: Date;
  completedDate?: Date;
  progress: number;
  deliverables: string[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  budget: number;
  spentAmount: number;
  startDate: Date;
  endDate: Date;
  progress: number;
  technologies: Technology[];
  team: TeamMember[];
  milestones: Milestone[];
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Activity {
  id: string;
  type: 'message' | 'milestone' | 'payment' | 'team' | 'file';
  title: string;
  description: string;
  timestamp: Date;
  user?: TeamMember;
  projectId?: string;
  projectName?: string;
}

export interface DashboardStats {
  activeProjects: number;
  totalSpent: number;
  developersHired: number;
  completedProjects: number;
  averageRating: number;
  totalHoursTracked: number;
  totalProjects?: number;
  totalReviews?: number;
}

export interface ProjectFormData {
  name: string;
  description: string;
  category: string;
  technologies: Technology[];
  budget: {
    min: number;
    max: number;
    type: 'fixed' | 'hourly';
  };
  timeline: {
    startDate: Date;
    estimatedDuration: number; // in weeks
  };
  requirements: string[];
  files: File[];
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: Date;
  attachments?: {
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
  }[];
}

export interface FileAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedBy: string;
  uploadedAt: Date;
  projectId: string;
}
