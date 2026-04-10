/**
 * Analytics Service
 * Handles all analytics and reporting API calls
 */

import { apiClient } from '@/lib/api-client';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface ProjectAnalytics {
  projectId: string;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  completionRate: number;
  averageTaskDuration: number;
  estimatedCompletion: string;
  actualProgress: number;
  plannedProgress: number;
  teamEfficiency: number;
  budgetSpent: number;
  budgetRemaining: number;
  budgetTotal: number;
}

export interface TimelineEvent {
  id: string;
  name: string;
  type: 'milestone' | 'task' | 'phase';
  startDate: string;
  endDate: string;
  progress: number;
  status: 'completed' | 'in_progress' | 'pending' | 'delayed';
  assignees?: string[];
  dependencies?: string[];
}

export interface TaskCompletionData {
  milestoneId: string;
  milestoneName: string;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  highPriority: number;
  mediumPriority: number;
  lowPriority: number;
  completionPercentage: number;
}

export interface TeamPerformanceData {
  userId: string;
  name: string;
  avatar?: string;
  role: string;
  tasksCompleted: number;
  tasksInProgress: number;
  averageCompletionTime: number;
  performanceScore: number;
  hoursLogged: number;
  efficiency: number;
}

export interface CompanyAnalytics {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  onHoldProjects: number;
  totalRevenue: number;
  averageProjectValue: number;
  clientSatisfaction: number;
  teamUtilization: number;
  projectSuccessRate: number;
}

export interface RevenueByMonthData {
  month: string;
  revenue: number;
  projects: number;
  expenses: number;
  profit: number;
  previousYearRevenue?: number;
}

export interface ProjectsByStatusData {
  status: string;
  count: number;
  percentage: number;
  totalValue: number;
  color: string;
}

export interface TeamUtilizationData {
  userId: string;
  name: string;
  avatar?: string;
  totalHours: number;
  billableHours: number;
  nonBillableHours: number;
  capacity: number;
  utilization: number;
  projects: {
    projectId: string;
    projectName: string;
    hours: number;
  }[];
}

export interface DeveloperStats {
  userId: string;
  totalTasksCompleted: number;
  totalHoursWorked: number;
  averageTaskCompletionTime: number;
  performanceScore: number;
  onTimeDeliveryRate: number;
  codeQualityScore: number;
  activeProjects: number;
  earnings: number;
}

export interface HoursWorkedData {
  date: string;
  hours: number;
  billableHours: number;
  overtimeHours: number;
  projectBreakdown: {
    projectId: string;
    projectName: string;
    hours: number;
  }[];
}

export interface TasksCompletedData {
  date: string;
  completed: number;
  created: number;
  inProgress: number;
}

export interface PerformanceScoreData {
  date: string;
  score: number;
  qualityScore: number;
  speedScore: number;
  teamAverage: number;
}

export interface BurndownData {
  date: string;
  idealRemaining: number;
  actualRemaining: number;
  totalWork: number;
  completedWork: number;
}

// ============================================
// ANALYTICS SERVICE CLASS
// ============================================

class AnalyticsService {
  // ============================================
  // PROJECT ANALYTICS
  // ============================================

  /**
   * Get comprehensive analytics for a specific project
   */
  async getProjectAnalytics(projectId: string): Promise<ProjectAnalytics> {
    try {
      const response = await apiClient.get(`/analytics/projects/${projectId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching project analytics:', error);
      throw error;
    }
  }

  /**
   * Get project timeline data (Gantt chart)
   */
  async getProjectTimeline(projectId: string): Promise<TimelineEvent[]> {
    try {
      const response = await apiClient.get(`/analytics/projects/${projectId}/timeline`);
      return response.data;
    } catch (error) {
      console.error('Error fetching project timeline:', error);
      throw error;
    }
  }

  /**
   * Get task completion breakdown by milestone
   */
  async getTaskCompletion(projectId: string): Promise<TaskCompletionData[]> {
    try {
      const response = await apiClient.get(`/analytics/projects/${projectId}/task-completion`);
      return response.data;
    } catch (error) {
      console.error('Error fetching task completion data:', error);
      throw error;
    }
  }

  /**
   * Get team performance metrics for a project
   */
  async getTeamPerformance(projectId: string): Promise<TeamPerformanceData[]> {
    try {
      const response = await apiClient.get(`/analytics/projects/${projectId}/team-performance`);
      return response.data;
    } catch (error) {
      console.error('Error fetching team performance:', error);
      throw error;
    }
  }

  /**
   * Get burndown chart data for sprint/milestone
   */
  async getBurndownData(projectId: string, milestoneId?: string): Promise<BurndownData[]> {
    try {
      const url = milestoneId
        ? `/analytics/projects/${projectId}/burndown?milestoneId=${milestoneId}`
        : `/analytics/projects/${projectId}/burndown`;
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching burndown data:', error);
      throw error;
    }
  }

  // ============================================
  // COMPANY ANALYTICS
  // ============================================

  /**
   * Get overall company analytics
   */
  async getCompanyAnalytics(companyId?: string): Promise<CompanyAnalytics> {
    try {
      const url = companyId ? `/analytics/company/${companyId}` : '/analytics/company';
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching company analytics:', error);
      throw error;
    }
  }

  /**
   * Get revenue data by month
   */
  async getRevenueByMonth(
    companyId?: string,
    period: 'monthly' | 'quarterly' | 'yearly' = 'monthly',
    startDate?: string,
    endDate?: string
  ): Promise<RevenueByMonthData[]> {
    try {
      const params = new URLSearchParams();
      params.append('period', period);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const url = companyId
        ? `/analytics/company/${companyId}/revenue?${params.toString()}`
        : `/analytics/company/revenue?${params.toString()}`;

      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching revenue data:', error);
      throw error;
    }
  }

  /**
   * Get projects grouped by status
   */
  async getProjectsByStatus(companyId?: string): Promise<ProjectsByStatusData[]> {
    try {
      const url = companyId
        ? `/analytics/company/${companyId}/projects-by-status`
        : '/analytics/company/projects-by-status';
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching projects by status:', error);
      throw error;
    }
  }

  /**
   * Get team utilization metrics
   */
  async getTeamUtilization(
    companyId?: string,
    startDate?: string,
    endDate?: string
  ): Promise<TeamUtilizationData[]> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const url = companyId
        ? `/analytics/company/${companyId}/team-utilization?${params.toString()}`
        : `/analytics/company/team-utilization?${params.toString()}`;

      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching team utilization:', error);
      throw error;
    }
  }

  // ============================================
  // DEVELOPER ANALYTICS
  // ============================================

  /**
   * Get developer statistics
   */
  async getDeveloperStats(userId: string): Promise<DeveloperStats> {
    try {
      const response = await apiClient.get(`/analytics/developer/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching developer stats:', error);
      throw error;
    }
  }

  /**
   * Get hours worked over a period
   */
  async getHoursWorked(
    userId: string,
    period: 'daily' | 'weekly' | 'monthly' = 'weekly',
    startDate?: string,
    endDate?: string
  ): Promise<HoursWorkedData[]> {
    try {
      const params = new URLSearchParams();
      params.append('period', period);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await apiClient.get(
        `/analytics/developer/${userId}/hours-worked?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching hours worked:', error);
      throw error;
    }
  }

  /**
   * Get tasks completed over a period
   */
  async getTasksCompleted(
    userId: string,
    period: 'daily' | 'weekly' | 'monthly' = 'weekly',
    startDate?: string,
    endDate?: string
  ): Promise<TasksCompletedData[]> {
    try {
      const params = new URLSearchParams();
      params.append('period', period);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await apiClient.get(
        `/analytics/developer/${userId}/tasks-completed?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching tasks completed:', error);
      throw error;
    }
  }

  /**
   * Get performance score over time
   */
  async getPerformanceScore(
    userId: string,
    period: 'daily' | 'weekly' | 'monthly' = 'weekly',
    startDate?: string,
    endDate?: string
  ): Promise<PerformanceScoreData[]> {
    try {
      const params = new URLSearchParams();
      params.append('period', period);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await apiClient.get(
        `/analytics/developer/${userId}/performance-score?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching performance score:', error);
      throw error;
    }
  }

  // ============================================
  // EXPORT FUNCTIONS
  // ============================================

  /**
   * Export analytics data to CSV
   */
  async exportToCSV(
    type: 'project' | 'company' | 'developer',
    id: string,
    dataType: string
  ): Promise<Blob> {
    try {
      const response = await apiClient.get(
        `/analytics/export/${type}/${id}/${dataType}`,
        {
          responseType: 'blob',
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      throw error;
    }
  }

  /**
   * Export analytics data to PDF
   */
  async exportToPDF(
    type: 'project' | 'company' | 'developer',
    id: string,
    dataType: string
  ): Promise<Blob> {
    try {
      const response = await apiClient.get(
        `/analytics/export/${type}/${id}/${dataType}/pdf`,
        {
          responseType: 'blob',
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      throw error;
    }
  }

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  /**
   * Download blob as file
   */
  downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Format date for API calls
   */
  formatDateForAPI(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Get date range for period
   */
  getDateRangeForPeriod(period: 'week' | 'month' | 'quarter' | 'year'): {
    startDate: string;
    endDate: string;
  } {
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case 'week':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
    }

    return {
      startDate: this.formatDateForAPI(startDate),
      endDate: this.formatDateForAPI(endDate),
    };
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();
export default analyticsService;
