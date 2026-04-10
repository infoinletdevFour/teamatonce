/**
 * Milestone Service
 * Handles all milestone-related API calls for Team@Once platform
 */

import { apiClient } from '@/lib/api-client';
import type { Milestone, MilestoneStatus, CreateMilestoneData as MilestoneCreateData } from '@/types/milestone';

/**
 * DTOs for milestone operations
 */
export interface UpdateMilestoneData {
  name?: string;
  description?: string;
  milestoneType?: string;
  dueDate?: string;
  milestoneAmount?: number;
  deliverables?: string[];
  acceptanceCriteria?: string[];
  estimatedHours?: number;
}

export interface ApproveMilestoneData {
  approved: boolean;
  feedback?: string;
  rating?: number;
}

/**
 * Milestone Service Class
 * Note: Backend routes are at /projects/:projectId/milestones
 */
class MilestoneService {
  /**
   * Get all milestones for a project
   */
  async getProjectMilestones(_companyId: string, projectId: string): Promise<{ milestones: Milestone[] }> {
    // Backend route: /projects/:id/milestones
    const response = await apiClient.get(`/projects/${projectId}/milestones`);
    return response.data;
  }

  /**
   * Get a specific milestone by ID
   */
  async getMilestone(_companyId: string, milestoneId: string): Promise<Milestone> {
    // Backend route: /projects/milestones/:milestoneId
    const response = await apiClient.get(`/projects/milestones/${milestoneId}`);
    return response.data;
  }

  /**
   * Create a new milestone for a project
   */
  async createMilestone(
    _companyId: string,
    projectId: string,
    data: MilestoneCreateData
  ): Promise<Milestone> {
    // Backend route: /projects/:id/milestones
    const response = await apiClient.post(`/projects/${projectId}/milestones`, data);
    return response.data;
  }

  /**
   * Update an existing milestone
   */
  async updateMilestone(
    _companyId: string,
    milestoneId: string,
    data: UpdateMilestoneData
  ): Promise<Milestone> {
    // Backend route: /projects/milestones/:milestoneId
    const response = await apiClient.put(`/projects/milestones/${milestoneId}`, data);
    return response.data;
  }

  /**
   * Delete a milestone
   */
  async deleteMilestone(_companyId: string, milestoneId: string): Promise<{ success: boolean; message: string }> {
    // Backend route: /projects/milestones/:milestoneId
    const response = await apiClient.delete(`/projects/milestones/${milestoneId}`);
    return response.data;
  }

  /**
   * Update milestone status
   */
  async updateMilestoneStatus(
    _companyId: string,
    milestoneId: string,
    status: MilestoneStatus
  ): Promise<Milestone> {
    // Backend route: /projects/milestones/:milestoneId/status
    const response = await apiClient.put(`/projects/milestones/${milestoneId}/status`, { status });
    return response.data;
  }

  /**
   * Submit milestone for client review (Developer/Team Lead only)
   */
  async submitMilestone(
    _companyId: string,
    milestoneId: string,
    notes?: string
  ): Promise<Milestone> {
    // Backend route: /projects/milestones/:milestoneId/submit
    const response = await apiClient.put(`/projects/milestones/${milestoneId}/submit`, {
      notes
    });
    return response.data;
  }

  /**
   * Submit milestone with file upload for client review
   */
  async submitMilestoneWithFile(
    projectId: string,
    milestoneId: string,
    notes?: string,
    file?: File
  ): Promise<Milestone> {
    const formData = new FormData();

    if (notes) {
      formData.append('notes', notes);
    }

    if (file) {
      formData.append('file', file);
    }

    // Don't set Content-Type header - browser will auto-set with boundary for FormData
    const response = await apiClient.post(
      `/projects/${projectId}/milestones/${milestoneId}/deliverables/upload`,
      formData
    );
    return response.data;
  }

  /**
   * Approve a milestone (Client only)
   */
  async approveMilestone(
    _companyId: string,
    milestoneId: string,
    data: ApproveMilestoneData
  ): Promise<Milestone> {
    // Backend route: /projects/milestones/:milestoneId/approve
    const response = await apiClient.put(`/projects/milestones/${milestoneId}/approve`, data);
    return response.data;
  }

  /**
   * Request changes on submitted milestone (Client only)
   */
  async requestMilestoneFeedback(
    _companyId: string,
    milestoneId: string,
    feedback: string
  ): Promise<Milestone> {
    // Backend route: /projects/milestones/:milestoneId/request-feedback
    const response = await apiClient.put(
      `/projects/milestones/${milestoneId}/request-feedback`,
      { feedback }
    );
    return response.data;
  }

  /**
   * Update milestone payment status
   */
  async updateMilestonePayment(
    _companyId: string,
    milestoneId: string,
    paymentStatus: string,
    paymentDate?: string
  ): Promise<Milestone> {
    // Backend route: /projects/milestones/:milestoneId/payment
    const response = await apiClient.put(`/projects/milestones/${milestoneId}/payment`, {
      paymentStatus,
      paymentDate,
    });
    return response.data;
  }

  /**
   * Get milestones by status
   */
  async getMilestonesByStatus(
    _companyId: string,
    projectId: string,
    status: MilestoneStatus
  ): Promise<Milestone[]> {
    // Backend route: /projects/:id/milestones
    const response = await apiClient.get(`/projects/${projectId}/milestones`, {
      params: { status }
    });
    return response.data.milestones || [];
  }

  /**
   * Calculate milestone progress percentage
   */
  calculateProgress(milestone: Milestone): number {
    // Return the progress value from the milestone if available
    if (milestone.progress !== undefined && milestone.progress !== null) {
      return milestone.progress;
    }

    // Fallback calculation based on status
    if (milestone.status === 'completed' || milestone.status === 'approved') return 100;
    if (milestone.status === 'pending') return 0;
    if (milestone.status === 'in_progress') {
      // Calculate based on time elapsed if dueDate is available
      if (milestone.dueDate) {
        const due = new Date(milestone.dueDate).getTime();
        const now = Date.now();

        if (now > due) return 95; // Cap at 95% until actually completed

        // If we don't have a start date, estimate based on creation date
        const start = new Date(milestone.createdAt).getTime();
        const progress = ((now - start) / (due - start)) * 100;
        return Math.min(Math.round(progress), 95); // Cap at 95% until actually completed
      }
      return 50; // Default to 50% if no due date
    }
    if (milestone.status === 'submitted') return 90;
    if (milestone.status === 'feedback_required') return 70;
    return 0;
  }

  /**
   * Check if milestone is overdue
   */
  isOverdue(milestone: Milestone): boolean {
    if (milestone.status === 'completed' || milestone.status === 'approved') return false;
    if (!milestone.dueDate) return false;
    const dueDate = new Date(milestone.dueDate);
    return dueDate < new Date();
  }

  /**
   * Get days remaining until milestone due date
   */
  getDaysRemaining(milestone: Milestone): number {
    if (!milestone.dueDate) return 0;
    const dueDate = new Date(milestone.dueDate);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  /**
   * Format milestone status for display
   */
  formatStatus(status: MilestoneStatus): string {
    const statusMap: Record<MilestoneStatus, string> = {
      pending: 'Pending',
      in_progress: 'In Progress',
      submitted: 'Submitted',
      feedback_required: 'Feedback Required',
      completed: 'Completed',
      approved: 'Approved',
    };
    return statusMap[status] || status;
  }
}

// Export singleton instance
export const milestoneService = new MilestoneService();
export default milestoneService;
