/**
 * Dashboard Service
 * Handles all API calls for client dashboard functionality
 */

import { apiClient } from '@/lib/api-client';
import { DashboardStats, Project, Activity } from '@/types/client';

export interface DashboardData {
  stats: DashboardStats;
  recentProjects: Project[];
  recentActivities: Activity[];
  notifications: Notification[];
}

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

export interface UserProfile {
  id: string;
  name?: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  phone?: string;
  company?: string;
  title?: string;
  location?: string;
  website?: string;
  bio?: string;
  timezone?: string;
  language?: string;
  memberSince: Date;
}

export interface UserSettings {
  notifications: {
    email: {
      projectUpdates: boolean;
      milestoneCompletion: boolean;
      paymentReminders: boolean;
      teamMessages: boolean;
      weeklyDigest: boolean;
    };
    push: {
      projectUpdates: boolean;
      teamMessages: boolean;
      urgentAlerts: boolean;
    };
    sms: {
      urgentAlerts: boolean;
      paymentReminders: boolean;
    };
  };
  preferences: {
    theme: 'light' | 'dark' | 'system';
    dashboardView: 'cards' | 'list';
    projectSorting: 'recent' | 'name' | 'status';
    autoSave: boolean;
    compactMode: boolean;
  };
  company: {
    name: string;
    website: string;
    industry: string;
    size: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    taxId: string;
  };
}

/**
 * Dashboard Service Class
 */
class DashboardService {
  /**
   * Get client dashboard statistics
   */
  async getClientStats(companyId: string): Promise<DashboardStats> {
    try {
      const response = await apiClient.get(`/company/${companyId}/dashboard/stats`);
      return response.data;
    } catch (error) {
      console.error('Error fetching client stats:', error);
      throw error;
    }
  }

  /**
   * Get recent projects (limit: 5 by default)
   */
  async getRecentProjects(companyId: string, limit: number = 5): Promise<Project[]> {
    try {
      const response = await apiClient.get(`/company/${companyId}/dashboard/projects/recent`, {
        params: { limit }
      });

      // Backend returns { projects: [], total: 0 }
      const projects = response.data.projects || [];

      // Convert backend format to frontend format
      return projects.map((project: any) => {
        // Map status from backend string to frontend string
        let status: 'active' | 'pending' | 'completed' | 'cancelled' = 'active';
        const projectStatus = (project.status || '').toLowerCase();
        if (projectStatus === 'planning') status = 'pending';
        else if (projectStatus === 'in_progress' || projectStatus === 'active') status = 'active';
        else if (projectStatus === 'completed') status = 'completed';
        else if (projectStatus === 'cancelled') status = 'cancelled';

        return {
          id: project.id,
          name: project.name,
          description: project.description || '',
          status,
          // Convert string values to numbers
          budget: Number(project.budget) || 0,
          spentAmount: Number(project.spentAmount) || 0,
          startDate: project.startDate ? new Date(project.startDate) : new Date(),
          endDate: project.endDate ? new Date(project.endDate) : new Date(),
          progress: Number(project.progress) || 0,
          technologies: (project.technologies || []).map((tech: any) =>
            typeof tech === 'string'
              ? { name: tech, category: 'technology' }
              : tech
          ),
          team: project.team || [],
          milestones: (project.milestones || []).map((m: any) => ({
            id: m.id,
            name: m.name,
            description: m.description || '',
            status: m.status?.toLowerCase() || 'pending',
            amount: Number(m.amount) || 0,
            startDate: m.startDate ? new Date(m.startDate) : new Date(),
            dueDate: m.dueDate ? new Date(m.dueDate) : new Date(),
            completedDate: m.completedDate ? new Date(m.completedDate) : undefined,
            progress: Number(m.progress) || 0,
            deliverables: m.deliverables || []
          })),
          category: project.category || 'General',
          createdAt: new Date(project.createdAt),
          updatedAt: new Date(project.updatedAt)
        };
      });
    } catch (error) {
      console.error('Error fetching recent projects:', error);
      throw error;
    }
  }

  /**
   * Get recent activity feed
   */
  async getRecentActivity(companyId: string, limit: number = 10): Promise<Activity[]> {
    try {
      const response = await apiClient.get(`/company/${companyId}/dashboard/activities/recent`, {
        params: { limit }
      });

      // Backend returns { activities: [] } or just an array
      const activities = response.data.activities || response.data || [];

      // Convert date strings to Date objects
      return activities.map((activity: any) => ({
        ...activity,
        timestamp: new Date(activity.timestamp)
      }));
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      // Return empty array instead of throwing - this endpoint might not exist yet
      return [];
    }
  }

  /**
   * Get user notifications
   */
  async getNotifications(companyId: string, unreadOnly: boolean = false): Promise<Notification[]> {
    try {
      const response = await apiClient.get(`/company/${companyId}/dashboard/notifications`, {
        params: { unreadOnly }
      });

      // Backend returns { notifications: [], unreadCount: 5 }
      const notifications = response.data.notifications || [];

      return notifications.map((notification: any) => ({
        ...notification,
        timestamp: new Date(notification.timestamp)
      }));
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(companyId: string, notificationId: string): Promise<void> {
    try {
      await apiClient.patch(`/company/${companyId}/dashboard/notifications/${notificationId}/read`);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllNotificationsAsRead(companyId: string): Promise<void> {
    try {
      await apiClient.patch(`/company/${companyId}/dashboard/notifications/read-all`);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Get complete dashboard data in one call
   */
  async getDashboardData(companyId: string): Promise<DashboardData> {
    try {
      const response = await apiClient.get(`/company/${companyId}/dashboard`);

      return {
        stats: response.data.stats,
        recentProjects: response.data.recentProjects.map((project: any) => ({
          ...project,
          startDate: new Date(project.startDate),
          endDate: new Date(project.endDate),
          createdAt: new Date(project.createdAt),
          updatedAt: new Date(project.updatedAt)
        })),
        recentActivities: response.data.recentActivities.map((activity: any) => ({
          ...activity,
          timestamp: new Date(activity.timestamp)
        })),
        notifications: response.data.notifications.map((notification: any) => ({
          ...notification,
          timestamp: new Date(notification.timestamp)
        }))
      };
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  }

  /**
   * Get user profile
   */
  async getUserProfile(): Promise<UserProfile> {
    try {
      const response = await apiClient.get('/user/profile');
      return {
        ...response.data,
        memberSince: new Date(response.data.memberSince)
      };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
    try {
      // Only send fields that the backend UpdateUserDto allows
      // Combine firstName and lastName into name
      const updateData: Record<string, any> = {};

      // Combine firstName and lastName into name if provided
      if (profile.firstName !== undefined || profile.lastName !== undefined) {
        const firstName = profile.firstName || '';
        const lastName = profile.lastName || '';
        updateData.name = `${firstName} ${lastName}`.trim();
      }

      // Map allowed fields
      if (profile.email !== undefined) updateData.email = profile.email;
      if (profile.phone !== undefined) updateData.phone = profile.phone;
      if (profile.company !== undefined) updateData.company = profile.company;
      if (profile.title !== undefined) updateData.title = profile.title;
      if (profile.location !== undefined) updateData.location = profile.location;
      if (profile.website !== undefined) updateData.website = profile.website;
      if (profile.bio !== undefined) updateData.bio = profile.bio;
      if (profile.timezone !== undefined) updateData.timezone = profile.timezone;
      if (profile.language !== undefined) updateData.language = profile.language;
      if (profile.avatar !== undefined) updateData.avatar = profile.avatar;

      const response = await apiClient.patch('/user/profile', updateData);
      return {
        ...response.data,
        memberSince: new Date(response.data.memberSince)
      };
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  /**
   * Upload user avatar
   */
  async uploadAvatar(file: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      // Don't set Content-Type header - browser will auto-set with boundary for FormData
      const response = await apiClient.post('/user/avatar', formData);

      return response.data.avatarUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    }
  }

  /**
   * Get user settings
   */
  async getUserSettings(): Promise<UserSettings> {
    try {
      const response = await apiClient.get('/user/settings');
      return response.data;
    } catch (error) {
      console.error('Error fetching user settings:', error);
      throw error;
    }
  }

  /**
   * Update user settings
   */
  async updateUserSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
    try {
      // Transform frontend settings format to backend UserPreferencesDto format
      const updateData: Record<string, any> = {};

      // Map preferences.theme to theme
      if (settings.preferences?.theme !== undefined) {
        updateData.theme = settings.preferences.theme;
      }

      // Transform nested notification preferences to simpler format
      // Backend expects notifications.email as boolean, not as nested object
      if (settings.notifications) {
        updateData.notifications = {
          // If any email notification is enabled, set email to true
          email: Object.values(settings.notifications.email || {}).some(v => v === true),
          // If any push notification is enabled, set push to true
          push: Object.values(settings.notifications.push || {}).some(v => v === true),
          // in_app is always true
          in_app: true,
        };
      }

      const response = await apiClient.patch('/user/settings', updateData);
      return response.data;
    } catch (error) {
      console.error('Error updating user settings:', error);
      throw error;
    }
  }

  /**
   * Update password
   */
  async updatePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      await apiClient.post('/user/password', {
        currentPassword,
        newPassword
      });
    } catch (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  }

  /**
   * Get client reviews from developers
   */
  async getClientReviews(companyId: string, limit: number = 10): Promise<ClientReview[]> {
    try {
      const response = await apiClient.get(`/company/${companyId}/dashboard/reviews`, {
        params: { limit }
      });
      return response.data || [];
    } catch (error) {
      console.error('Error fetching client reviews:', error);
      return [];
    }
  }
}

export interface ClientReview {
  id: string;
  developerName: string;
  rating: number;
  comment: string;
  projectTitle: string;
  date: string;
  title?: string;
}

// Export singleton instance
export const dashboardService = new DashboardService();
export default dashboardService;
