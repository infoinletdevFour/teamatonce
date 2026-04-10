export interface Developer {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  title: string;
  hourlyRate: number;
  rating: number;
  totalReviews: number;
  totalEarnings: number;
  skills: Skill[];
  bio: string;
  location: string;
  timezone: string;
  availability: 'available' | 'busy' | 'unavailable';
  languages: string[];
  portfolioItems: PortfolioItem[];
  reviews: Review[];
  verifiedSkills: string[];
  joinedDate: string;
}

export interface Skill {
  name: string;
  level: 'beginner' | 'intermediate' | 'expert';
  verified: boolean;
  yearsOfExperience?: number;
}

export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  imageUrl?: string;
  projectUrl?: string;
  completedDate: string;
}

export interface Review {
  id: string;
  clientName: string;
  clientAvatar?: string;
  rating: number;
  comment: string;
  projectTitle: string;
  date: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  clientName: string;
  clientAvatar?: string;
  clientRating: number;
  budget: {
    min: number;
    max: number;
    type: 'fixed' | 'hourly';
  };
  duration: string;
  requiredSkills: string[];
  matchPercentage?: number;
  postedDate: string;
  proposalsCount: number;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  category: string;
  experienceLevel: 'entry' | 'intermediate' | 'expert';
  projectType: 'one-time' | 'ongoing';
}

export interface ActiveProject extends Project {
  startDate: string;
  milestones: Milestone[];
  totalBudget: number;
  paidAmount: number;
  timeTracked: number;
  filesShared: number;
  messagesCount: number;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  amount: number;
  status: 'pending' | 'in_progress' | 'submitted' | 'approved' | 'released';
  dueDate: string;
  completedDate?: string;
}

export interface EarningStats {
  thisMonth: number;
  lastMonth: number;
  total: number;
  pending: number;
  available: number;
  growth: number;
}

export interface TimeEntry {
  id: string;
  projectId: string;
  projectTitle: string;
  date: string;
  hours: number;
  description: string;
  approved: boolean;
}

export interface Notification {
  id: string;
  type: 'project_match' | 'message' | 'payment' | 'milestone' | 'review';
  title: string;
  message: string;
  date: string;
  read: boolean;
  actionUrl?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'Lead' | 'Developer' | 'Designer' | 'QA' | 'Backend' | 'Frontend';
  skills: string[];
  availability: 'available' | 'busy' | 'unavailable';
  workloadPercentage: number; // 0-100+
  currentProjects: number;
  hourlyRate?: number;
}

export interface ProjectAssignment {
  projectId: string;
  teamMembers: TeamMember[];
  assignedDate: string;
  projectRole?: 'Lead' | 'Developer' | 'Designer' | 'QA';
}
