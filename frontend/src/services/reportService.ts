/**
 * Report Service
 * Handles all report-related API calls for Team@Once platform
 * Uses the reports table for content moderation
 */

import { apiClient } from '@/lib/api-client';

/**
 * Report Types - matches backend schema
 */
export enum ReportType {
  USER = 'user',
  JOB = 'job',
  PROJECT = 'project',
  GIG = 'gig',
  MESSAGE = 'message',
}

export enum ReportReason {
  SPAM = 'spam',
  INAPPROPRIATE = 'inappropriate',
  FRAUD = 'fraud',
  HARASSMENT = 'harassment',
  OTHER = 'other',
}

export enum ReportStatus {
  PENDING = 'pending',
  REVIEWING = 'reviewing',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed',
}

export enum ReportResolution {
  CONTENT_REMOVED = 'content_removed',
  USER_WARNED = 'user_warned',
  USER_BANNED = 'user_banned',
  NO_ACTION = 'no_action',
}

/**
 * DTOs matching backend report DTOs
 */
export interface CreateReportDto {
  reportType: ReportType;
  targetId: string;
  targetUserId?: string;
  reason: ReportReason;
  description?: string;
  evidenceUrls?: string[];
  metadata?: Record<string, any>;
}

export interface UpdateReportDto {
  status?: ReportStatus;
  resolution?: ReportResolution;
  resolutionNotes?: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  report_type: ReportType;
  target_id: string;
  target_user_id?: string;
  reason: ReportReason;
  description?: string;
  evidence_urls?: string[];
  status: ReportStatus;
  resolution?: ReportResolution;
  resolution_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ReportFilters {
  status?: ReportStatus;
  reportType?: ReportType;
  reason?: ReportReason;
}

/**
 * Report Service Class
 */
class ReportService {
  /**
   * Create a new report
   */
  async createReport(reportData: CreateReportDto): Promise<Report> {
    const response = await apiClient.post('/teamatonce/contract/report', reportData);
    return response.data;
  }

  /**
   * Get all reports for a target (project, user, etc.)
   */
  async getReportsByTarget(targetId: string, filters?: { status?: string; reason?: string }): Promise<Report[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.reason) params.append('reason', filters.reason);

    const queryString = params.toString();
    const url = `/teamatonce/contract/report/target/${targetId}${queryString ? `?${queryString}` : ''}`;

    try {
      const response = await apiClient.get(url);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching reports:', error);
      return [];
    }
  }

  /**
   * Get all reports (admin)
   */
  async getAllReports(filters?: ReportFilters): Promise<Report[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.reportType) params.append('reportType', filters.reportType);
    if (filters?.reason) params.append('reason', filters.reason);

    const queryString = params.toString();
    const url = `/teamatonce/contract/report/all${queryString ? `?${queryString}` : ''}`;

    try {
      const response = await apiClient.get(url);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching all reports:', error);
      return [];
    }
  }

  /**
   * Get report by ID
   */
  async getReportById(reportId: string): Promise<Report> {
    const response = await apiClient.get(`/teamatonce/contract/report/${reportId}`);
    return response.data;
  }

  /**
   * Update report (admin review)
   */
  async updateReport(reportId: string, updates: UpdateReportDto): Promise<Report> {
    const response = await apiClient.put(`/teamatonce/contract/report/${reportId}`, updates);
    return response.data;
  }

  /**
   * Delete report
   */
  async deleteReport(reportId: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete(`/teamatonce/contract/report/${reportId}`);
    return response.data;
  }

  /**
   * Get reports submitted by current user
   */
  async getMyReports(): Promise<Report[]> {
    try {
      const response = await apiClient.get('/teamatonce/contract/report/user/my-reports');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching user reports:', error);
      return [];
    }
  }

  /**
   * Get reports filed against current user (warnings/bans)
   */
  async getReportsAgainstMe(): Promise<Report[]> {
    try {
      const response = await apiClient.get('/teamatonce/contract/report/user/against-me');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching reports against user:', error);
      return [];
    }
  }

  /**
   * Helper to get reason label
   */
  getReasonLabel(reason: ReportReason): string {
    switch (reason) {
      case ReportReason.SPAM:
        return 'Spam';
      case ReportReason.INAPPROPRIATE:
        return 'Inappropriate Content';
      case ReportReason.FRAUD:
        return 'Fraud';
      case ReportReason.HARASSMENT:
        return 'Harassment';
      case ReportReason.OTHER:
        return 'Other';
      default:
        return reason;
    }
  }

  /**
   * Helper to get status color
   */
  getStatusColor(status: ReportStatus): string {
    switch (status) {
      case ReportStatus.PENDING:
        return 'yellow';
      case ReportStatus.REVIEWING:
        return 'blue';
      case ReportStatus.RESOLVED:
        return 'green';
      case ReportStatus.DISMISSED:
        return 'gray';
      default:
        return 'gray';
    }
  }

  /**
   * Helper to get report type label
   */
  getReportTypeLabel(type: ReportType): string {
    switch (type) {
      case ReportType.USER:
        return 'User';
      case ReportType.JOB:
        return 'Job';
      case ReportType.PROJECT:
        return 'Project';
      case ReportType.GIG:
        return 'Gig';
      case ReportType.MESSAGE:
        return 'Message';
      default:
        return type;
    }
  }

  /**
   * Helper to get resolution label
   */
  getResolutionLabel(resolution: ReportResolution): string {
    switch (resolution) {
      case ReportResolution.CONTENT_REMOVED:
        return 'Content Removed';
      case ReportResolution.USER_WARNED:
        return 'User Warned';
      case ReportResolution.USER_BANNED:
        return 'User Banned';
      case ReportResolution.NO_ACTION:
        return 'No Action Taken';
      default:
        return resolution;
    }
  }
}

// Export singleton instance
export const reportService = new ReportService();
export default reportService;
