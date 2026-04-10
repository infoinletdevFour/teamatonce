/**
 * Proposal Types
 * Types for project bidding/proposal system
 */

export type ProposalStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';

export interface ProposedMilestone {
  name: string;
  description?: string;
  estimatedHours: number;
  dueDate?: string;
  amount: number;
  deliverables?: string[];
}

export interface TeamMember {
  name: string;
  role: string;
}

export interface SimilarProject {
  name: string;
  description: string;
}

export interface CreateProposalData {
  projectId: string;
  coverLetter?: string;
  proposedCost: number;
  currency?: string;
  proposedDurationDays: number;
  proposedStartDate?: string;
  proposedMilestones?: ProposedMilestone[];
  teamComposition?: TeamMember[];
  similarProjects?: SimilarProject[];
}

export interface UpdateProposalData {
  coverLetter?: string;
  proposedCost?: number;
  proposedDurationDays?: number;
  proposedStartDate?: string;
  proposedMilestones?: ProposedMilestone[];
  teamComposition?: TeamMember[];
}

export interface ReviewProposalData {
  status: 'accepted' | 'rejected';
  reviewNotes?: string;
}

export interface Proposal {
  id: string;
  projectId: string;
  companyId: string;
  submittedBy: string;
  coverLetter?: string;
  proposedCost: number;
  currency: string;
  proposedDurationDays: number;
  proposedStartDate?: string;
  status: ProposalStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  proposedMilestones?: ProposedMilestone[];
  teamComposition?: TeamMember[];
  similarProjects?: SimilarProject[];
  createdAt: string;
  updatedAt: string;
  company?: {
    id: string;
    name: string;
    logo?: string;
  };
  project?: {
    id: string;
    name: string;
    description: string;
    estimatedCost: number;
  };
  /** Company name (populated for client view) */
  company_name?: string;
  /** AI-calculated match score based on seller skills vs required skills (0-100) */
  matchScore?: number;
  /** Matched skills between seller and project requirements */
  matchedSkills?: string[];
  /** Skills required by project that seller is missing */
  missingSkills?: string[];
  /** Seller's skills */
  sellerSkills?: string[];
}

export interface BrowseableProject {
  id: string;
  name: string;
  description: string;
  projectType: string;
  status: string;
  estimatedCost: number;
  currency: string;
  estimatedDurationDays: number;
  startDate?: string;
  expectedCompletionDate?: string;
  techStack: string[];
  frameworks: string[];
  features: string[];
  requirements: Record<string, any>;
  clientId: string;
  proposalsCount: number;
  hasProposal: boolean;
  /** AI-calculated match score based on seller skills vs required skills (0-100) */
  matchScore: number;
  /** Matched skills between seller and project requirements */
  matchedSkills?: string[];
  /** Skills required by project that seller is missing */
  missingSkills?: string[];
  createdAt: string;
  updatedAt: string;
  client?: {
    id: string;
    name?: string;
    avatar?: string;
  };
}

export interface ProposalsResponse {
  proposals: Proposal[];
  total: number;
}

export interface BrowseableProjectsResponse {
  projects: BrowseableProject[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}
