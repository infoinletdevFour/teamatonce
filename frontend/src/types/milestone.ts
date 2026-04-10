/**
 * Milestone Types - Matches Backend API Response EXACTLY
 *
 * These types match the MilestoneResponseDto from backend
 * File: backend/src/modules/teamatonce/project/dto/project.dto.ts
 */

export type MilestoneStatus = 'pending' | 'in_progress' | 'submitted' | 'feedback_required' | 'completed' | 'approved';
export type MilestoneType = 'planning' | 'design' | 'development' | 'testing' | 'deployment' | 'maintenance';

/**
 * Deliverable file metadata interface
 * Used when files are uploaded for milestones
 */
export interface DeliverableFile {
  title: string;
  description?: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  uploadedBy: string;
}

/**
 * Milestone API Response Interface
 * Matches backend MilestoneResponseDto exactly - NO MAPPING NEEDED
 */
export interface Milestone {
  id: string;
  title: string;                      // NOTE: Backend uses 'title' not 'name'
  description: string;
  status: MilestoneStatus;
  dueDate: string | null;             // ISO date string
  progress: number;                    // 0-100
  amount: number | null;               // Payment amount
  deliverables: (string | DeliverableFile)[];  // Array of deliverables (string or file object)
  acceptanceCriteria: string[];        // Array of acceptance criteria
  estimatedHours: number | null;       // Estimated hours to complete
  createdAt: string;                   // ISO timestamp
  updatedAt: string;                   // ISO timestamp
  milestoneType?: string;              // Optional milestone type
  orderIndex?: number;                 // Optional order index
  paymentStatus?: string;              // Optional payment status
  feedback?: string;                   // Client feedback when changes requested
  submissionCount?: number;            // Number of times submitted for review
  submittedAt?: string;                // ISO timestamp when milestone was submitted for review
}

/**
 * API Response Wrapper
 */
export interface MilestonesResponse {
  milestones: Milestone[];
}

/**
 * Create Milestone Form Data
 * Used for creating/updating milestones
 */
export interface CreateMilestoneData {
  name: string;                        // Will be converted to 'title' by backend
  description?: string;
  milestoneType: MilestoneType;
  orderIndex: number;
  deliverables?: string[];
  acceptanceCriteria?: string[];
  estimatedHours?: number;
  dueDate?: string;                    // yyyy-MM-dd format
  milestoneAmount?: number;            // Will be converted to 'amount' by backend
}

/**
 * Milestone Form Data for Modal
 * Used in MilestoneFormModal component
 */
export interface MilestoneFormData {
  name: string;
  description: string;
  milestoneType: MilestoneType;
  orderIndex: number;
  deliverables: string[];
  acceptanceCriteria: string[];
  estimatedHours?: number;
  dueDate?: string;
  milestoneAmount?: number;
}
