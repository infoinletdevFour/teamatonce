/**
 * Notification Service for Team@Once
 *
 * Handles all notification-related API calls
 */

import { apiClient } from '../lib/api-client';

// Notification types matching backend
export type NotificationType =
  | 'SYSTEM'
  | 'REMINDER'
  | 'ACHIEVEMENT'
  | 'HEALTH'
  | 'FITNESS'
  | 'FINANCE'
  | 'TRAVEL'
  | 'MEDITATION'
  | 'SOCIAL'
  | 'SECURITY'
  | 'UPDATE'
  | 'PROMOTIONAL'
  | 'PROJECT'
  | 'MILESTONE'
  | 'PAYMENT'
  | 'MESSAGE'
  | 'DISPUTE'
  | 'OTHER';

export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export interface AppNotification {
  id: string;
  user_id: string;
  type: NotificationType; // Backend returns 'type' not 'notification_type'
  title: string;
  message?: string;
  action_url?: string;
  data?: Record<string, any>; // Backend returns 'data' not 'action_data'
  priority: NotificationPriority;
  is_read: boolean;
  is_archived?: boolean;
  read_at?: string;
  created_at: string;
  expires_at?: string | null;
}

// Alias for backward compatibility
export type Notification = AppNotification;

export interface NotificationPreferences {
  global: {
    push: boolean;
    email: boolean;
    in_app: boolean;
  };
  types: Record<string, {
    push: boolean;
    email: boolean;
    in_app: boolean;
  }>;
  quiet_hours?: {
    start?: string;
    end?: string;
    days?: string[];
    timezone?: string;
  };
  daily_limit: number;
  grouping: Record<string, any>;
  language: string;
  metadata: Record<string, any>;
}

export interface NotificationFilters {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  type?: NotificationType;
  types?: NotificationType[];
  is_read?: boolean;
  priority?: NotificationPriority;
  start_date?: string;
  end_date?: string;
  search?: string;
  has_action?: boolean;
  include_expired?: boolean;
}

export interface NotificationsResponse {
  data: AppNotification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  unread_count: number;
}

export interface UnreadCountResponse {
  count: number;
}

class NotificationService {
  private baseUrl = '/notifications';

  /**
   * Get notifications with filtering and pagination
   */
  async getNotifications(filters?: NotificationFilters): Promise<NotificationsResponse> {
    try {
      const params = new URLSearchParams();

      if (filters) {
        if (filters.page) params.append('page', filters.page.toString());
        if (filters.limit) params.append('limit', filters.limit.toString());
        if (filters.sort_by) params.append('sort_by', filters.sort_by);
        if (filters.sort_order) params.append('sort_order', filters.sort_order);
        if (filters.type) params.append('type', filters.type);
        if (filters.types) params.append('types', filters.types.join(','));
        if (filters.is_read !== undefined) params.append('is_read', filters.is_read.toString());
        if (filters.priority) params.append('priority', filters.priority);
        if (filters.start_date) params.append('start_date', filters.start_date);
        if (filters.end_date) params.append('end_date', filters.end_date);
        if (filters.search) params.append('search', filters.search);
        if (filters.has_action !== undefined) params.append('has_action', filters.has_action.toString());
        if (filters.include_expired !== undefined) params.append('include_expired', filters.include_expired.toString());
      }

      const response = await apiClient.get(`${this.baseUrl}?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<UnreadCountResponse> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/unread-count`);
      return response.data;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      throw error;
    }
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      await apiClient.put(`${this.baseUrl}/${notificationId}/read`);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark a notification as unread
   */
  async markAsUnread(notificationId: string): Promise<void> {
    try {
      await apiClient.put(`${this.baseUrl}/${notificationId}/unread`);
    } catch (error) {
      console.error('Error marking notification as unread:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<{ updated: number }> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/mark-all-read`);
      return response.data;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Mark multiple notifications as read
   */
  async markBulkAsRead(notificationIds: string[]): Promise<void> {
    try {
      await apiClient.post(`${this.baseUrl}/bulk-read`, { notification_ids: notificationIds });
    } catch (error) {
      console.error('Error marking bulk notifications as read:', error);
      throw error;
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}/${notificationId}`);
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  /**
   * Clear all read notifications
   */
  async clearAllRead(): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}/clear-all`);
    } catch (error) {
      console.error('Error clearing all read notifications:', error);
      throw error;
    }
  }

  /**
   * Get notification preferences
   */
  async getPreferences(): Promise<NotificationPreferences> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/preferences`);
      return response.data;
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      throw error;
    }
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    try {
      const response = await apiClient.put(`${this.baseUrl}/preferences`, preferences);
      return response.data;
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw error;
    }
  }

  /**
   * Subscribe to push notifications
   */
  async subscribeToPush(subscription: PushSubscription): Promise<void> {
    try {
      await apiClient.post(`${this.baseUrl}/subscribe`, {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.toJSON().keys?.p256dh,
          auth: subscription.toJSON().keys?.auth,
        },
      });
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribeFromPush(endpoint: string): Promise<void> {
    try {
      await apiClient.post(`${this.baseUrl}/unsubscribe`, { endpoint });
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
export default notificationService;
