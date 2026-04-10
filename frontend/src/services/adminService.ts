import { apiClient } from '@/lib/api-client';
import {
  AdminDashboardStats,
  AdminUser,
  AdminJob,
  AdminProject,
  AdminMilestone,
  Report,
  FAQ,
  EmailCampaign,
  CreateFaqRequest,
  UpdateFaqRequest,
  ReviewReportRequest,
  BulkEmailRequest,
  BulkNotificationRequest,
  PaginatedResponse,
  AdminActivityLog,
} from '@/types/admin';

// Helper to normalize paginated responses from backend
// Backend returns { users/jobs/projects/etc: [], total, page, limit }
// Frontend expects { data: [], total, page, limit, totalPages }
function normalizePaginatedResponse<T>(
  rawData: any,
  dataKey: string = 'data'
): PaginatedResponse<T> {
  // Try to find the data array (could be 'users', 'jobs', 'projects', 'data', etc.)
  const possibleKeys = [dataKey, 'users', 'jobs', 'projects', 'reports', 'campaigns', 'logs', 'data'];
  let items: T[] = [];

  for (const key of possibleKeys) {
    if (Array.isArray(rawData[key])) {
      items = rawData[key];
      break;
    }
  }

  // If rawData itself is an array, use it directly
  if (Array.isArray(rawData)) {
    items = rawData;
  }

  const total = rawData.total || items.length;
  const limit = rawData.limit || 20;
  const page = rawData.page || 1;

  return {
    data: items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

// ============================================
// DASHBOARD
// ============================================

export const getAdminDashboard = async (): Promise<AdminDashboardStats> => {
  const response = await apiClient.get('/admin/dashboard');
  return response.data.data || response.data;
};

// ============================================
// USER MANAGEMENT
// ============================================

export const getAdminUsers = async (params: {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  approvalStatus?: string;
  isBanned?: boolean;
}): Promise<PaginatedResponse<AdminUser>> => {
  const response = await apiClient.get('/admin/users', { params });
  const rawData = response.data.data || response.data;
  return normalizePaginatedResponse<AdminUser>(rawData, 'users');
};

export const getAdminUser = async (userId: string): Promise<AdminUser> => {
  const response = await apiClient.get(`/admin/users/${userId}`);
  return response.data.data || response.data;
};

export const updateAdminUser = async (userId: string, data: Partial<AdminUser>): Promise<AdminUser> => {
  const response = await apiClient.put(`/admin/users/${userId}`, data);
  return response.data.data || response.data;
};

export const getPendingApprovals = async (params: {
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<AdminUser>> => {
  const response = await apiClient.get('/admin/users/pending-approval', { params });
  const rawData = response.data.data || response.data;
  return normalizePaginatedResponse<AdminUser>(rawData, 'users');
};

export const approveUser = async (userId: string, notes?: string): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.post(`/admin/users/${userId}/approve`, { notes });
  return response.data;
};

export const rejectUser = async (userId: string, reason: string): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.post(`/admin/users/${userId}/reject`, { reason });
  return response.data;
};

export const banUser = async (userId: string, reason: string): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.post(`/admin/users/${userId}/ban`, { reason });
  return response.data;
};

export const unbanUser = async (userId: string): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.post(`/admin/users/${userId}/unban`, {});
  return response.data;
};

export const suspendUser = async (userId: string, reason: string, until?: string): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.post(`/admin/users/${userId}/suspend`, { reason, until });
  return response.data;
};

export const reactivateUser = async (userId: string): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.post(`/admin/users/${userId}/reactivate`, {});
  return response.data;
};

export const changeUserRole = async (userId: string, role: string): Promise<{ success: boolean; message: string; role: string }> => {
  const response = await apiClient.post(`/admin/users/${userId}/role`, { role });
  return response.data.data || response.data;
};

// ============================================
// JOB MANAGEMENT
// ============================================

export const getAdminJobs = async (params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  approvalStatus?: string;
}): Promise<PaginatedResponse<AdminJob>> => {
  const response = await apiClient.get('/admin/jobs', { params });
  const rawData = response.data.data || response.data;
  return normalizePaginatedResponse<AdminJob>(rawData, 'jobs');
};

export const getAdminJob = async (jobId: string): Promise<AdminJob> => {
  const response = await apiClient.get(`/admin/jobs/${jobId}`);
  return response.data.data || response.data;
};

export const getPendingJobs = async (params: {
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<AdminJob>> => {
  const response = await apiClient.get('/admin/jobs/pending-approval', { params });
  const rawData = response.data.data || response.data;
  return normalizePaginatedResponse<AdminJob>(rawData, 'jobs');
};

export const approveJob = async (jobId: string): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.post(`/admin/jobs/${jobId}/approve`, {});
  return response.data;
};

export const rejectJob = async (jobId: string, reason: string): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.post(`/admin/jobs/${jobId}/reject`, { reason });
  return response.data;
};

// ============================================
// PROJECT MANAGEMENT
// ============================================

export const getAdminProjects = async (params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}): Promise<PaginatedResponse<AdminProject>> => {
  const response = await apiClient.get('/admin/projects', { params });
  const rawData = response.data.data || response.data;
  return normalizePaginatedResponse<AdminProject>(rawData, 'projects');
};

export const getAdminProject = async (projectId: string): Promise<AdminProject> => {
  const response = await apiClient.get(`/admin/projects/${projectId}`);
  return response.data.data || response.data;
};

export const getProjectMilestones = async (projectId: string): Promise<AdminMilestone[]> => {
  const response = await apiClient.get(`/admin/projects/${projectId}/milestones`);
  return response.data.data || response.data;
};

export const forceCloseProject = async (projectId: string, reason: string): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.post(`/admin/projects/${projectId}/force-close`, { reason });
  return response.data;
};

// ============================================
// CONTENT MODERATION (REPORTS)
// ============================================

export const getReports = async (params: {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
  reason?: string;
}): Promise<PaginatedResponse<Report>> => {
  const response = await apiClient.get('/admin/reports', { params });
  const rawData = response.data.data || response.data;
  return normalizePaginatedResponse<Report>(rawData, 'reports');
};

export const getReport = async (reportId: string): Promise<Report> => {
  const response = await apiClient.get(`/admin/reports/${reportId}`);
  return response.data.data || response.data;
};

export const reviewReport = async (reportId: string, data: ReviewReportRequest): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.post(`/admin/reports/${reportId}/review`, data);
  return response.data;
};

export const removeContent = async (
  contentType: string,
  contentId: string,
  reason: string
): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.delete(`/admin/content/${contentType}/${contentId}`, {
    data: { reason }
  });
  return response.data;
};

// ============================================
// FAQ MANAGEMENT
// ============================================

export const getFaqs = async (params?: {
  category?: string;
  includeUnpublished?: boolean;
}): Promise<FAQ[]> => {
  const response = await apiClient.get('/admin/faqs', { params });
  return response.data.data || response.data;
};

export const getFaq = async (faqId: string): Promise<FAQ> => {
  const response = await apiClient.get(`/admin/faqs/${faqId}`);
  return response.data.data || response.data;
};

export const createFaq = async (data: CreateFaqRequest): Promise<FAQ> => {
  const response = await apiClient.post('/admin/faqs', data);
  return response.data.data || response.data;
};

export const updateFaq = async (faqId: string, data: UpdateFaqRequest): Promise<FAQ> => {
  const response = await apiClient.put(`/admin/faqs/${faqId}`, data);
  return response.data.data || response.data;
};

export const deleteFaq = async (faqId: string): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.delete(`/admin/faqs/${faqId}`);
  return response.data;
};

export const reorderFaqs = async (ids: string[]): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.put('/admin/faqs/reorder', { ids });
  return response.data;
};

// ============================================
// BULK COMMUNICATIONS
// ============================================

export const sendBulkEmail = async (data: BulkEmailRequest): Promise<EmailCampaign> => {
  const response = await apiClient.post('/admin/communications/email', data);
  return response.data.data || response.data;
};

export const sendBulkNotification = async (data: BulkNotificationRequest): Promise<{ success: boolean; message: string; sentCount: number }> => {
  const response = await apiClient.post('/admin/communications/notification', data);
  return response.data;
};

export const getEmailCampaigns = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
}): Promise<PaginatedResponse<EmailCampaign>> => {
  const response = await apiClient.get('/admin/communications/campaigns', { params });
  const rawData = response.data.data || response.data;
  return normalizePaginatedResponse<EmailCampaign>(rawData, 'campaigns');
};

export const getEmailCampaign = async (campaignId: string): Promise<EmailCampaign> => {
  const response = await apiClient.get(`/admin/communications/campaigns/${campaignId}`);
  return response.data.data || response.data;
};

// ============================================
// ACTIVITY LOGS
// ============================================

export const getActivityLogs = async (params?: {
  page?: number;
  limit?: number;
  userId?: string;
  activityType?: string;
  entityType?: string;
}): Promise<PaginatedResponse<AdminActivityLog>> => {
  const response = await apiClient.get('/admin/activity-logs', { params });
  return response.data.data || response.data;
};

// ============================================
// ANALYTICS
// ============================================

export const getAnalyticsOverview = async (): Promise<Record<string, unknown>> => {
  const response = await apiClient.get('/admin/analytics/overview');
  return response.data.data || response.data;
};

export const getRevenueAnalytics = async (params?: {
  startDate?: string;
  endDate?: string;
}): Promise<Record<string, unknown>> => {
  const response = await apiClient.get('/admin/analytics/revenue', { params });
  return response.data.data || response.data;
};

// Default export for convenience
const adminService = {
  // Dashboard
  getAdminDashboard,

  // Users
  getAdminUsers,
  getAdminUser,
  updateAdminUser,
  getPendingApprovals,
  approveUser,
  rejectUser,
  banUser,
  unbanUser,
  suspendUser,
  reactivateUser,

  // Jobs
  getAdminJobs,
  getAdminJob,
  getPendingJobs,
  approveJob,
  rejectJob,

  // Projects
  getAdminProjects,
  getAdminProject,
  getProjectMilestones,
  forceCloseProject,

  // Reports
  getReports,
  getReport,
  reviewReport,
  removeContent,

  // FAQs
  getFaqs,
  getFaq,
  createFaq,
  updateFaq,
  deleteFaq,
  reorderFaqs,

  // Communications
  sendBulkEmail,
  sendBulkNotification,
  getEmailCampaigns,
  getEmailCampaign,

  // Activity Logs
  getActivityLogs,

  // Analytics
  getAnalyticsOverview,
  getRevenueAnalytics,
};

export default adminService;
