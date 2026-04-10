// Admin Panel Types

export interface AdminDashboardStats {
  totalUsers: number;
  pendingApprovals: number;
  activeProjects: number;
  pendingJobs: number;
  openReports: number;
  totalRevenue: number;
  monthlyRevenue: number;
  totalClients: number;
  totalSellers: number;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  role: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  isBanned: boolean;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  metadata?: Record<string, unknown>;
}

export interface AdminJob {
  id: string;
  name: string;
  description: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  companyId?: string;
  companyName?: string;
  projectType: string;
  status: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvalRejectionReason?: string;
  budgetMin?: number;
  budgetMax?: number;
  estimatedCost?: number;
  currency: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminProject {
  id: string;
  name: string;
  description: string;
  clientId: string;
  clientName: string;
  assignedCompanyId?: string;
  assignedCompanyName?: string;
  status: string;
  progressPercentage: number;
  estimatedCost?: number;
  actualCost: number;
  currency: string;
  startDate?: string;
  expectedCompletionDate?: string;
  actualCompletionDate?: string;
  forceClosedAt?: string;
  forceClosedBy?: string;
  forceCloseReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminMilestone {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  milestoneType: string;
  orderIndex: number;
  status: string;
  milestoneAmount?: number;
  paymentStatus: string;
  startDate?: string;
  dueDate?: string;
  completedDate?: string;
  createdAt: string;
}

export interface Report {
  id: string;
  reporterId: string;
  reporterName?: string;
  reporterEmail?: string;
  reportType: 'user' | 'job' | 'project' | 'gig' | 'message';
  targetId: string;
  targetUserId?: string;
  targetUserName?: string;
  reason: 'spam' | 'inappropriate' | 'fraud' | 'harassment' | 'other';
  description?: string;
  evidenceUrls: string[];
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  resolution?: 'content_removed' | 'user_warned' | 'user_banned' | 'no_action';
  resolutionNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category?: string;
  orderIndex: number;
  isPublished: boolean;
  createdBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  contentHtml: string;
  contentText?: string;
  targetAudience: 'all' | 'clients' | 'sellers' | 'pending_approval';
  targetFilters?: Record<string, unknown>;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
  scheduledAt?: string;
  sentAt?: string;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Request/Response DTOs
export interface CreateFaqRequest {
  question: string;
  answer: string;
  category?: string;
  isPublished?: boolean;
}

export interface UpdateFaqRequest {
  question?: string;
  answer?: string;
  category?: string;
  isPublished?: boolean;
}

export interface ReviewReportRequest {
  resolution: 'content_removed' | 'user_warned' | 'user_banned' | 'no_action';
  notes?: string;
}

export interface BulkEmailRequest {
  name: string;
  subject: string;
  contentHtml: string;
  contentText?: string;
  targetAudience: 'all' | 'clients' | 'sellers' | 'pending_approval' | 'individual';
  targetFilters?: Record<string, unknown>;
  scheduledAt?: string;
  individualEmails?: string[];
}

export interface BulkNotificationRequest {
  title: string;
  message: string;
  targetAudience: 'all' | 'clients' | 'sellers';
  actionUrl?: string;
  priority?: 'low' | 'normal' | 'high';
  individualEmails?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminActivityLog {
  id: string;
  userId: string;
  userName?: string;
  activityType: string;
  entityType?: string;
  entityId?: string;
  action: string;
  changes?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}
