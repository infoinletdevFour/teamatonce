/**
 * Support Service
 * Handles all support package, FAQ, and enhancement proposal API calls for Team@Once platform
 */

import { apiClient } from '@/lib/api-client';

/**
 * FAQ types for Help Center
 */
export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  order?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface FAQCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  articleCount?: number;
}

/**
 * Enums matching backend
 */
export enum SupportPackageType {
  BASIC = 'basic',
  STANDARD = 'standard',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise',
}

export enum SupportStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

export enum EnhancementProposalStatus {
  PROPOSED = 'proposed',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

/**
 * DTOs matching backend contract DTOs
 */
export interface CreateSupportPackageDto {
  packageName: string;
  packageType: SupportPackageType;
  monthlyHours: number;
  responseTimeSla?: number;
  includesFeatures?: string[];
  monthlyCost: number;
  currency?: string;
  autoRenew?: boolean;
}

export interface UpdateSupportPackageDto {
  packageName?: string;
  packageType?: SupportPackageType;
  monthlyHours?: number;
  responseTimeSla?: number;
  includesFeatures?: string[];
  monthlyCost?: number;
  autoRenew?: boolean;
  status?: SupportStatus;
}

export interface CreateProjectSupportDto {
  packageId: string;
  startDate: string;
  endDate?: string;
}

export interface UpdateProjectSupportDto {
  usedHours?: number;
  endDate?: string;
  renewalDate?: string;
  autoRenew?: boolean;
  status?: SupportStatus;
}

export interface CreateEnhancementProposalDto {
  title: string;
  description: string;
  estimatedEffort?: number;
  estimatedCost?: number;
  potentialImpact?: string;
  priority?: string;
  tags?: string[];
}

export interface UpdateEnhancementProposalDto {
  title?: string;
  description?: string;
  status?: EnhancementProposalStatus;
  estimatedEffort?: number;
  estimatedCost?: number;
  potentialImpact?: string;
  priority?: string;
  reviewNotes?: string;
  approvedBy?: string;
  approvedAt?: string;
}

/**
 * Response DTOs
 */
export interface SupportPackageResponseDto {
  id: string;
  project_id: string;
  client_id: string;
  package_name: string;
  package_type: SupportPackageType;
  status: SupportStatus;
  monthly_hours: number;
  used_hours: number;
  response_time_sla?: number;
  includes_features?: string[];
  monthly_cost: number;
  currency: string;
  start_date: string;
  end_date?: string;
  renewal_date?: string;
  auto_renew: boolean;
  created_at: string;
  updated_at: string;
}

export interface EnhancementProposalResponseDto {
  id: string;
  project_id: string;
  title: string;
  description: string;
  status: EnhancementProposalStatus;
  estimated_effort?: number;
  estimated_cost?: number;
  potential_impact?: string;
  priority?: string;
  tags?: string[];
  review_notes?: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface TrackSupportHoursDto {
  hours: number;
}

/**
 * Support Service Class
 */
class SupportService {
  private readonly baseUrl = '/teamatonce/contract';

  // ============================================
  // FAQ & HELP CENTER
  // ============================================

  /**
   * Get all FAQs
   */
  async getFAQs(): Promise<FAQItem[]> {
    try {
      const response = await apiClient.get('/public/faq');
      return response.data;
    } catch (error) {
      console.error('Error fetching FAQs:', error);
      // Return empty array on error - frontend can show static FAQs as fallback
      return [];
    }
  }

  /**
   * Get FAQs by category
   */
  async getFAQsByCategory(category: string): Promise<FAQItem[]> {
    try {
      const response = await apiClient.get(`/public/faq/category/${category}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching FAQs by category:', error);
      return [];
    }
  }

  /**
   * Get FAQ categories
   */
  async getFAQCategories(): Promise<FAQCategory[]> {
    try {
      const response = await apiClient.get('/public/faq/categories');
      return response.data;
    } catch (error) {
      console.error('Error fetching FAQ categories:', error);
      return [];
    }
  }

  /**
   * Search FAQs
   */
  async searchFAQs(query: string): Promise<FAQItem[]> {
    try {
      const response = await apiClient.get('/public/faq/search', {
        params: { q: query }
      });
      return response.data;
    } catch (error) {
      console.error('Error searching FAQs:', error);
      return [];
    }
  }

  // ============================================
  // SUPPORT PACKAGE MANAGEMENT (Global Templates)
  // ============================================

  /**
   * Get all available support packages (templates)
   */
  async getSupportPackages(): Promise<SupportPackageResponseDto[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/support/packages`);
      return response.data;
    } catch (error) {
      console.error('Error fetching support packages:', error);
      throw error;
    }
  }

  /**
   * Get support package by ID
   */
  async getSupportPackage(packageId: string): Promise<SupportPackageResponseDto> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/support/package/${packageId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching support package:', error);
      throw error;
    }
  }

  /**
   * Create a support package template (admin only)
   */
  async createSupportPackage(
    projectId: string,
    data: CreateSupportPackageDto
  ): Promise<SupportPackageResponseDto> {
    try {
      const response = await apiClient.post(
        `${this.baseUrl}/support/package/project/${projectId}`,
        data
      );
      return response.data;
    } catch (error) {
      console.error('Error creating support package:', error);
      throw error;
    }
  }

  /**
   * Update support package template
   */
  async updateSupportPackage(
    packageId: string,
    updates: UpdateSupportPackageDto
  ): Promise<SupportPackageResponseDto> {
    try {
      const response = await apiClient.put(`${this.baseUrl}/support/package/${packageId}`, updates);
      return response.data;
    } catch (error) {
      console.error('Error updating support package:', error);
      throw error;
    }
  }

  /**
   * Delete (soft delete) support package
   */
  async deleteSupportPackage(packageId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.delete(`${this.baseUrl}/support/package/${packageId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting support package:', error);
      throw error;
    }
  }

  // ============================================
  // PROJECT SUPPORT SUBSCRIPTION
  // ============================================

  /**
   * Get active support subscription for a project
   */
  async getProjectSupport(projectId: string): Promise<SupportPackageResponseDto | null> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/support/project/${projectId}`);
      return response.data;
    } catch (error: any) {
      // Return null if no support found (404)
      if (error.response?.status === 404) {
        return null;
      }
      console.error('Error fetching project support:', error);
      throw error;
    }
  }

  /**
   * Subscribe project to a support package
   */
  async subscribeToSupport(
    projectId: string,
    data: CreateProjectSupportDto
  ): Promise<SupportPackageResponseDto> {
    try {
      const response = await apiClient.post(
        `${this.baseUrl}/support/project/${projectId}/subscribe`,
        data
      );
      return response.data;
    } catch (error) {
      console.error('Error subscribing to support:', error);
      throw error;
    }
  }

  /**
   * Update project support subscription
   */
  async updateSupport(
    supportId: string,
    updates: UpdateProjectSupportDto
  ): Promise<SupportPackageResponseDto> {
    try {
      const response = await apiClient.put(`${this.baseUrl}/support/${supportId}`, updates);
      return response.data;
    } catch (error) {
      console.error('Error updating support subscription:', error);
      throw error;
    }
  }

  /**
   * Cancel project support subscription
   */
  async cancelSupport(supportId: string): Promise<SupportPackageResponseDto> {
    try {
      const response = await apiClient.put(`${this.baseUrl}/support/${supportId}/cancel`);
      return response.data;
    } catch (error) {
      console.error('Error cancelling support subscription:', error);
      throw error;
    }
  }

  /**
   * Increment used support hours
   */
  async trackSupportHours(supportId: string, hours: number): Promise<SupportPackageResponseDto> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/support/${supportId}/hours/${hours}`);
      return response.data;
    } catch (error) {
      console.error('Error tracking support hours:', error);
      throw error;
    }
  }

  // ============================================
  // ENHANCEMENT PROPOSALS
  // ============================================

  /**
   * Create enhancement proposal for post-project improvements
   */
  async createEnhancementProposal(
    projectId: string,
    proposal: CreateEnhancementProposalDto
  ): Promise<EnhancementProposalResponseDto> {
    try {
      const response = await apiClient.post(
        `${this.baseUrl}/enhancement/project/${projectId}`,
        proposal
      );
      return response.data;
    } catch (error) {
      console.error('Error creating enhancement proposal:', error);
      throw error;
    }
  }

  /**
   * Get all enhancement proposals for a project
   */
  async getEnhancementProposals(projectId: string): Promise<EnhancementProposalResponseDto[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/enhancement/project/${projectId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching enhancement proposals:', error);
      throw error;
    }
  }

  /**
   * Get enhancement proposal by ID
   */
  async getEnhancementProposal(proposalId: string): Promise<EnhancementProposalResponseDto> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/enhancement/${proposalId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching enhancement proposal:', error);
      throw error;
    }
  }

  /**
   * Update enhancement proposal
   */
  async updateEnhancementProposal(
    proposalId: string,
    updates: UpdateEnhancementProposalDto
  ): Promise<EnhancementProposalResponseDto> {
    try {
      const response = await apiClient.put(`${this.baseUrl}/enhancement/${proposalId}`, updates);
      return response.data;
    } catch (error) {
      console.error('Error updating enhancement proposal:', error);
      throw error;
    }
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Helper to check if support package is active
   */
  isSupportActive(supportPackage: SupportPackageResponseDto): boolean {
    if (supportPackage.status !== SupportStatus.ACTIVE) {
      return false;
    }

    if (supportPackage.end_date) {
      const endDate = new Date(supportPackage.end_date);
      return endDate > new Date();
    }

    return true;
  }

  /**
   * Helper to calculate remaining hours
   */
  getRemainingHours(supportPackage: SupportPackageResponseDto): number {
    return Math.max(0, supportPackage.monthly_hours - supportPackage.used_hours);
  }

  /**
   * Helper to calculate hours usage percentage
   */
  getHoursUsagePercentage(supportPackage: SupportPackageResponseDto): number {
    if (supportPackage.monthly_hours === 0) return 0;
    return Math.min(100, (supportPackage.used_hours / supportPackage.monthly_hours) * 100);
  }

  /**
   * Helper to check if hours are exceeded
   */
  isHoursExceeded(supportPackage: SupportPackageResponseDto): boolean {
    return supportPackage.used_hours > supportPackage.monthly_hours;
  }

  /**
   * Helper to format support package for display
   */
  formatSupportPackageForDisplay(pkg: SupportPackageResponseDto) {
    return {
      id: pkg.id,
      name: pkg.package_name,
      type: pkg.package_type,
      status: pkg.status,
      monthlyHours: pkg.monthly_hours,
      usedHours: pkg.used_hours,
      remainingHours: this.getRemainingHours(pkg),
      usagePercentage: this.getHoursUsagePercentage(pkg),
      features: pkg.includes_features || [],
      monthlyCost: pkg.monthly_cost,
      currency: pkg.currency,
      sla: pkg.response_time_sla,
      startDate: new Date(pkg.start_date),
      endDate: pkg.end_date ? new Date(pkg.end_date) : null,
      renewalDate: pkg.renewal_date ? new Date(pkg.renewal_date) : null,
      autoRenew: pkg.auto_renew,
      isActive: this.isSupportActive(pkg),
      isExceeded: this.isHoursExceeded(pkg),
    };
  }

  /**
   * Helper to format enhancement proposal for display
   */
  formatEnhancementProposalForDisplay(proposal: EnhancementProposalResponseDto) {
    return {
      id: proposal.id,
      projectId: proposal.project_id,
      title: proposal.title,
      description: proposal.description,
      status: proposal.status,
      estimatedEffort: proposal.estimated_effort,
      estimatedCost: proposal.estimated_cost,
      potentialImpact: proposal.potential_impact,
      priority: proposal.priority || 'medium',
      tags: proposal.tags || [],
      reviewNotes: proposal.review_notes,
      approvedBy: proposal.approved_by,
      approvedAt: proposal.approved_at ? new Date(proposal.approved_at) : null,
      createdAt: new Date(proposal.created_at),
      updatedAt: new Date(proposal.updated_at),
    };
  }
}

// Export singleton instance
export const supportService = new SupportService();
export default supportService;
