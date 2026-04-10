import { Injectable, NotFoundException, BadRequestException, Logger, Inject, forwardRef } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { NotificationsGateway } from './notifications.gateway';
import { FirebaseService } from './firebase.service';
import { DeviceTokenService } from './device-token.service';
import {
  CreateNotificationDto,
  UpdatePreferencesDto,
  NotificationQueryDto,
  SubscribePushDto,
  UnsubscribePushDto,
  BulkActionDto,
  NotificationResponseDto,
  PaginatedNotificationsDto,
  NotificationType,
  NotificationPriority
} from './dto';

export interface NotificationPreferences {
  user_id: string;
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

export interface PushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  device_info: Record<string, any>;
  notification_types: string[];
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly db: DatabaseService,
    @Inject(forwardRef(() => NotificationsGateway))
    private readonly notificationsGateway: NotificationsGateway,
    @Inject(forwardRef(() => FirebaseService))
    private readonly firebaseService: FirebaseService,
    @Inject(forwardRef(() => DeviceTokenService))
    private readonly deviceTokenService: DeviceTokenService,
  ) {}

  // =============================================
  // NOTIFICATION OPERATIONS
  // =============================================

  async sendNotification(createNotificationDto: CreateNotificationDto): Promise<NotificationResponseDto | NotificationResponseDto[]> {
    try {
      const { user_id, user_ids, send_push, send_email, push_config, email_config, ...notificationData } = createNotificationDto;

      // Determine target users
      const targetUsers = user_ids || (user_id ? [user_id] : []);
      
      if (targetUsers.length === 0) {
        throw new BadRequestException('Must specify at least one user_id or user_ids');
      }

      const results: NotificationResponseDto[] = [];

      for (const userId of targetUsers) {
        // Check user preferences before sending
        const preferences = await this.getNotificationPreferences(userId);
        const shouldSend = await this.shouldSendNotification(userId, createNotificationDto, preferences);

        if (!shouldSend) {
          this.logger.warn(`Notification blocked by user preferences for user ${userId}`);
          continue;
        }

        // Create in-app notification
        const inAppNotification = await this.createInAppNotification(userId, notificationData);
        results.push(inAppNotification);

        // Send push notification if enabled
        if (send_push && preferences.global.push) {
          await this.sendPushNotification(userId, createNotificationDto, push_config);
        }

        // Send email notification if enabled
        if (send_email && preferences.global.email) {
          await this.sendEmailNotification(userId, createNotificationDto, email_config);
        }

        // Emit real-time notification via WebSocket
        await this.emitRealtimeNotification(userId, inAppNotification);
      }

      return results.length === 1 ? results[0] : results;
    } catch (error) {
      this.logger.error(`Failed to send notification: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to send notification: ${error.message}`);
    }
  }

  async getNotifications(userId: string, query: NotificationQueryDto): Promise<PaginatedNotificationsDto> {
    try {
      const { page = 1, limit = 20, sort_by = 'created_at', sort_order = 'desc', ...filters } = query;
      const offset = (page - 1) * limit;

      // Use SDK's query builder for better query construction
      const queryBuilder = this.db.table('notifications')
        .where('user_id', userId);

      if (filters.type) {
        queryBuilder.where('type', filters.type);
      }

      if (filters.types && filters.types.length > 0) {
        queryBuilder.in('type', filters.types);
      }

      if (filters.is_read !== undefined) {
        queryBuilder.where('is_read', filters.is_read);
      }

      // is_archived filter removed - column doesn't exist in schema

      if (filters.priority) {
        queryBuilder.where('priority', filters.priority);
      }

      if (filters.start_date) {
        queryBuilder.gte('created_at', new Date(filters.start_date));
      }

      if (filters.end_date) {
        queryBuilder.lte('created_at', new Date(filters.end_date + 'T23:59:59.999Z'));
      }

      if (filters.search) {
        // Use OR for search across title and message
        queryBuilder.or(
          (qb) => qb.ilike('title', `%${filters.search}%`),
          (qb) => qb.ilike('message', `%${filters.search}%`)
        );
      }

      if (filters.has_action !== undefined) {
        if (filters.has_action) {
          queryBuilder.isNotNull('action_url');
        } else {
          queryBuilder.isNull('action_url');
        }
      }

      // expires_at filter removed - column doesn't exist in schema

      // Apply sorting and pagination
      queryBuilder
        .orderBy(sort_by, sort_order as 'asc' | 'desc')
        .limit(limit)
        .offset(offset);

      // Execute query
      const result = await queryBuilder.execute();
      const notifications = result.data;

      // Get total count with same filters but without pagination
      const countQuery = this.db.table('notifications')
        .where('user_id', userId);

      // Apply same filters for count
      if (filters.type) countQuery.where('type', filters.type);
      if (filters.types && filters.types.length > 0) countQuery.in('type', filters.types);
      if (filters.is_read !== undefined) countQuery.where('is_read', filters.is_read);
      if (filters.priority) countQuery.where('priority', filters.priority);
      if (filters.start_date) countQuery.gte('created_at', new Date(filters.start_date));
      if (filters.end_date) countQuery.lte('created_at', new Date(filters.end_date + 'T23:59:59.999Z'));
      if (filters.search) {
        countQuery.or(
          (qb) => qb.ilike('title', `%${filters.search}%`),
          (qb) => qb.ilike('message', `%${filters.search}%`)
        );
      }
      if (filters.has_action !== undefined) {
        if (filters.has_action) {
          countQuery.isNotNull('action_url');
        } else {
          countQuery.isNull('action_url');
        }
      }
      // expires_at filter removed - column doesn't exist in schema

      const totalCount = await countQuery.count();

      // Get unread count
      const unreadCount = await this.getUnreadCount(userId);

      return {
        data: notifications.map(this.formatNotification),
        total: totalCount,
        page,
        limit,
        total_pages: Math.ceil(totalCount / limit),
        unread_count: unreadCount,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch notifications: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to fetch notifications: ${error.message}`);
    }
  }

  async markAsRead(userId: string, notificationId: string): Promise<NotificationResponseDto> {
    try {
      const notification = await this.db.findOne('notifications', {
        id: notificationId,
        user_id: userId,
      });

      if (!notification) {
        throw new NotFoundException('Notification not found');
      }

      const readAt = new Date().toISOString();
      const updatedNotification = await this.db.update('notifications', notificationId, {
        is_read: true,
        read_at: readAt,
      });

      // Emit real-time read status update
      await this.notificationsGateway.emitNotificationReadToUser(userId, notificationId, true, readAt);

      return this.formatNotification(updatedNotification);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to mark notification as read: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to mark notification as read: ${error.message}`);
    }
  }

  async markAsUnread(userId: string, notificationId: string): Promise<NotificationResponseDto> {
    try {
      const notification = await this.db.findOne('notifications', {
        id: notificationId,
        user_id: userId,
      });

      if (!notification) {
        throw new NotFoundException('Notification not found');
      }

      const updatedNotification = await this.db.update('notifications', notificationId, {
        is_read: false,
        read_at: null,
      });

      // Emit real-time read status update
      await this.notificationsGateway.emitNotificationReadToUser(userId, notificationId, false);

      return this.formatNotification(updatedNotification);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to mark notification as unread: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to mark notification as unread: ${error.message}`);
    }
  }

  async deleteNotification(userId: string, notificationId: string): Promise<void> {
    try {
      const notification = await this.db.findOne('notifications', {
        id: notificationId,
        user_id: userId,
      });

      if (!notification) {
        throw new NotFoundException('Notification not found');
      }

      await this.db.delete('notifications', notificationId);

      // Emit real-time deletion event
      await this.notificationsGateway.emitNotificationDeletedToUser(userId, notificationId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to delete notification: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to delete notification: ${error.message}`);
    }
  }

  async bulkMarkAsRead(userId: string, bulkActionDto: BulkActionDto): Promise<{ success: number; failed: number }> {
    try {
      let success = 0;
      let failed = 0;
      const successfulIds: string[] = [];

      for (const notificationId of bulkActionDto.notification_ids) {
        try {
          await this.markAsRead(userId, notificationId);
          success++;
          successfulIds.push(notificationId);
        } catch (error) {
          this.logger.warn(`Failed to mark notification ${notificationId} as read: ${error.message}`);
          failed++;
        }
      }

      // Emit bulk update event
      if (successfulIds.length > 0) {
        await this.notificationsGateway.emitBulkNotificationUpdate(userId, successfulIds, 'read');
      }

      return { success, failed };
    } catch (error) {
      this.logger.error(`Failed to bulk mark as read: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to bulk mark as read: ${error.message}`);
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<{ updated: number }> {
    try {
      // Get all unread notifications for the user
      const unreadNotifications = await this.db.findMany('notifications', {
        user_id: userId,
        is_read: false,
      });

      if (unreadNotifications.length === 0) {
        return { updated: 0 };
      }

      const readAt = new Date().toISOString();
      const notificationIds: string[] = [];

      // Update all unread notifications
      for (const notification of unreadNotifications) {
        await this.db.update('notifications', notification.id, {
          is_read: true,
          read_at: readAt,
        });
        notificationIds.push(notification.id);
      }

      // Emit bulk update event
      await this.notificationsGateway.emitBulkNotificationUpdate(userId, notificationIds, 'read');

      return { updated: notificationIds.length };
    } catch (error) {
      this.logger.error(`Failed to mark all as read: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to mark all as read: ${error.message}`);
    }
  }

  /**
   * Clear all read notifications for a user (permanently delete)
   */
  async clearAllReadNotifications(userId: string): Promise<void> {
    try {
      // Find all read notifications
      const readNotifications = await this.db.findMany('notifications', {
        user_id: userId,
        is_read: true,
      });

      if (readNotifications.length === 0) {
        return;
      }

      const notificationIds: string[] = [];

      // Delete all read notifications
      for (const notification of readNotifications) {
        await this.db.delete('notifications', notification.id);
        notificationIds.push(notification.id);
      }

      // Emit bulk update event
      await this.notificationsGateway.emitBulkNotificationUpdate(userId, notificationIds, 'deleted');

      this.logger.log(`Deleted ${notificationIds.length} read notifications for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to clear read notifications: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to clear read notifications: ${error.message}`);
    }
  }

  // =============================================
  // NOTIFICATION PREFERENCES
  // =============================================

  async getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
    // TODO: Re-enable when health_metrics table is available
    // For now, skip the database query and just return default preferences
    // This ensures notifications are not blocked due to missing table
    const defaults = this.getDefaultPreferences(userId);
    console.log(`[NotificationsService] Using default preferences for user ${userId}, global.in_app: ${defaults.global?.in_app}`);
    return defaults;
  }

  async updateNotificationPreferences(userId: string, updatePreferencesDto: UpdatePreferencesDto): Promise<NotificationPreferences> {
    try {
      const currentPreferences = await this.getNotificationPreferences(userId);
      
      // Merge with new preferences
      const mergedTypes = { ...currentPreferences.types };
      
      // Handle type-specific preferences merge
      if (updatePreferencesDto.types) {
        Object.keys(updatePreferencesDto.types).forEach(type => {
          const typePrefs = updatePreferencesDto.types![type as keyof typeof updatePreferencesDto.types];
          if (typePrefs) {
            mergedTypes[type] = {
              push: typePrefs.push ?? mergedTypes[type]?.push ?? true,
              email: typePrefs.email ?? mergedTypes[type]?.email ?? false,
              in_app: typePrefs.in_app ?? mergedTypes[type]?.in_app ?? true,
            };
          }
        });
      }

      const updatedPreferences: NotificationPreferences = {
        ...currentPreferences,
        ...updatePreferencesDto,
        user_id: userId,
        global: {
          ...currentPreferences.global,
          ...updatePreferencesDto.global,
        },
        types: mergedTypes,
        metadata: {
          ...currentPreferences.metadata,
          ...updatePreferencesDto.metadata,
        },
      };

      // Look for existing preferences record
      const existingRecord = await this.db.findOne('health_metrics', {
        user_id: userId,
        metric_type: 'notification_preferences',
      });

      if (existingRecord) {
        await this.db.update('health_metrics', existingRecord.id, {
          metadata: updatedPreferences,
          updated_at: new Date().toISOString(),
        });
      } else {
        await this.db.insert('health_metrics', {
          user_id: userId,
          metric_type: 'notification_preferences',
          value: 1,
          unit: 'preferences',
          metadata: updatedPreferences,
        });
      }

      return updatedPreferences;
    } catch (error) {
      this.logger.error(`Failed to update notification preferences: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to update notification preferences: ${error.message}`);
    }
  }

  // =============================================
  // PUSH SUBSCRIPTION MANAGEMENT
  // =============================================

  async subscribeToPush(userId: string, subscribePushDto: SubscribePushDto): Promise<{ success: boolean; subscription_id: string }> {
    try {
      const subscriptionData: Omit<PushSubscription, 'id' | 'created_at' | 'updated_at'> = {
        user_id: userId,
        endpoint: subscribePushDto.subscription.endpoint,
        keys: subscribePushDto.subscription.keys,
        device_info: subscribePushDto.device_info || {},
        notification_types: subscribePushDto.notification_types || Object.values(NotificationType),
        enabled: subscribePushDto.enabled ?? true,
      };

      // Check if subscription already exists
      const userSubscriptions = await this.db.findMany('health_metrics', {
        user_id: userId,
        metric_type: 'push_subscription',
      });
      // Filter by endpoint in code (JSONB dot notation not supported in queries)
      const existingSubscription = userSubscriptions.find(
        (sub: any) => sub.metadata?.endpoint === subscribePushDto.subscription.endpoint
      );

      let subscriptionId: string;

      if (existingSubscription) {
        // Update existing subscription
        subscriptionId = existingSubscription.id;
        await this.db.update('health_metrics', subscriptionId, {
          metadata: subscriptionData,
          updated_at: new Date().toISOString(),
        });
      } else {
        // Create new subscription
        const result = await this.db.insert('health_metrics', {
          user_id: userId,
          metric_type: 'push_subscription',
          value: 1,
          unit: 'subscription',
          metadata: subscriptionData,
        });
        subscriptionId = result.id;
      }

      this.logger.log(`Push subscription created/updated for user ${userId}`);
      return { success: true, subscription_id: subscriptionId };
    } catch (error) {
      this.logger.error(`Failed to subscribe to push: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to subscribe to push: ${error.message}`);
    }
  }

  async unsubscribeFromPush(userId: string, unsubscribePushDto: UnsubscribePushDto): Promise<{ success: boolean }> {
    try {
      const userSubscriptions = await this.db.findMany('health_metrics', {
        user_id: userId,
        metric_type: 'push_subscription',
      });
      // Filter by endpoint in code (JSONB dot notation not supported in queries)
      const subscription = userSubscriptions.find(
        (sub: any) => sub.metadata?.endpoint === unsubscribePushDto.endpoint
      );

      if (!subscription) {
        throw new NotFoundException('Push subscription not found');
      }

      // Disable the subscription instead of deleting it
      await this.db.update('health_metrics', subscription.id, {
        metadata: {
          ...subscription.metadata,
          enabled: false,
          unsubscribed_at: new Date().toISOString(),
          unsubscribe_reason: unsubscribePushDto.reason || 'user_request',
        },
        updated_at: new Date().toISOString(),
      });

      this.logger.log(`Push subscription disabled for user ${userId}`);
      return { success: true };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to unsubscribe from push: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to unsubscribe from push: ${error.message}`);
    }
  }

  // =============================================
  // HELPER METHODS
  // =============================================

  private async createInAppNotification(userId: string, notificationData: Partial<CreateNotificationDto>): Promise<NotificationResponseDto> {
    const notification = await this.db.insert('notifications', {
      user_id: userId,
      notification_type: notificationData.type,
      title: notificationData.title,
      message: notificationData.message || '',
      action_url: notificationData.action_url || null,
      action_data: notificationData.data || {},
      priority: notificationData.priority || NotificationPriority.NORMAL,
      is_read: false,
    });

    return this.formatNotification(notification);
  }

  private async sendPushNotification(userId: string, notificationData: CreateNotificationDto, config?: Record<string, any>): Promise<void> {
    try {
      // First, try Firebase FCM for mobile push notifications
      if (this.firebaseService.isInitialized()) {
        await this.sendFCMNotification(userId, notificationData, config);
      }

      // Also try database push (web push subscriptions)
      const allSubscriptions = await this.db.findMany('health_metrics', {
        user_id: userId,
        metric_type: 'push_subscription',
      });
      // Filter enabled subscriptions in code (JSONB dot notation not supported in queries)
      const subscriptions = allSubscriptions.filter(
        (sub: any) => sub.metadata?.enabled === true
      );

      if (subscriptions.length > 0) {
        const pushData = {
          title: notificationData.title,
          body: notificationData.message || '',
          data: {
            ...notificationData.data,
            action_url: notificationData.action_url,
            type: notificationData.type,
          },
          ...config,
        };

        await /* TODO: use Firebase */ this.db.sendPushNotification(userId, pushData.title, pushData.body, pushData.data);
        this.logger.log(`Web push notification sent to user ${userId}`);
      }
    } catch (error) {
      this.logger.error(`Failed to send push notification: ${error.message}`, error.stack);
      // Don't throw error here as it shouldn't block the main notification flow
    }
  }

  /**
   * Send FCM push notification to user's mobile devices
   */
  private async sendFCMNotification(userId: string, notificationData: CreateNotificationDto, config?: Record<string, any>): Promise<void> {
    try {
      // Get user's FCM device tokens
      const tokens = await this.deviceTokenService.getActiveTokensForUser(userId);

      if (tokens.length === 0) {
        this.logger.debug(`No FCM tokens found for user ${userId}`);
        return;
      }

      // Prepare data payload (all values must be strings for FCM)
      const dataPayload: Record<string, string> = {
        type: notificationData.type || '',
        action_url: notificationData.action_url || '',
        priority: notificationData.priority || NotificationPriority.NORMAL,
      };

      // Add custom data if provided
      if (notificationData.data) {
        Object.keys(notificationData.data).forEach((key) => {
          const value = notificationData.data![key];
          dataPayload[key] = typeof value === 'string' ? value : JSON.stringify(value);
        });
      }

      // Send FCM notification
      const result = await this.firebaseService.sendToMultipleTokens(
        tokens,
        {
          title: notificationData.title,
          body: notificationData.message || '',
        },
        dataPayload,
      );

      // Cleanup invalid tokens
      if (result.invalidTokens.length > 0) {
        await this.deviceTokenService.deactivateInvalidTokens(result.invalidTokens);
      }

      if (result.successCount > 0) {
        this.logger.log(`FCM notification sent to ${result.successCount} devices for user ${userId}`);
      }
    } catch (error) {
      this.logger.error(`Failed to send FCM notification: ${error.message}`, error.stack);
      // Don't throw - FCM failure shouldn't block other notifications
    }
  }

  /**
   * Send FCM push notification to multiple users
   */
  async sendFCMToUsers(
    userIds: string[],
    notification: { title: string; body: string },
    data?: Record<string, string>,
  ): Promise<{ successCount: number; failureCount: number }> {
    if (!this.firebaseService.isInitialized()) {
      this.logger.warn('Firebase not initialized. Cannot send FCM notifications.');
      return { successCount: 0, failureCount: 0 };
    }

    try {
      // Get all tokens for all users
      const allTokens = await this.deviceTokenService.getAllTokensForUsers(userIds);

      if (allTokens.length === 0) {
        return { successCount: 0, failureCount: 0 };
      }

      const result = await this.firebaseService.sendToMultipleTokens(
        allTokens,
        notification,
        data,
      );

      // Cleanup invalid tokens
      if (result.invalidTokens.length > 0) {
        await this.deviceTokenService.deactivateInvalidTokens(result.invalidTokens);
      }

      return {
        successCount: result.successCount,
        failureCount: result.failureCount,
      };
    } catch (error) {
      this.logger.error(`Failed to send FCM to users: ${error.message}`, error.stack);
      return { successCount: 0, failureCount: 0 };
    }
  }

  private async sendEmailNotification(userId: string, notificationData: CreateNotificationDto, config?: Record<string, any>): Promise<void> {
    try {
      // Get user email from auth system
      const user = await this.db.getUserById(userId);
      
      if (!user?.email) {
        this.logger.warn(`No email found for user ${userId}`);
        return;
      }

      const emailContent = this.buildEmailContent(notificationData, config);
      
      await /* TODO: use EmailService */ this.db.sendEmail(
        user.email,
        notificationData.title,
        emailContent.html,
        emailContent.text
      );

      this.logger.log(`Email notification sent to user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to send email notification: ${error.message}`, error.stack);
      // Don't throw error here as it shouldn't block the main notification flow
    }
  }

  private async emitRealtimeNotification(userId: string, notification: NotificationResponseDto): Promise<void> {
    try {
      // Emit via Socket.io gateway for real-time delivery
      await this.notificationsGateway.emitNotificationToUser(userId, notification);

      this.logger.log(`Real-time notification emitted for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to emit real-time notification: ${error.message}`, error.stack);
      // Don't throw error here as it shouldn't block the main notification flow
    }
  }

  private async shouldSendNotification(
    userId: string,
    notificationData: CreateNotificationDto,
    preferences: NotificationPreferences
  ): Promise<boolean> {
    try {
      console.log(`[NotificationsService] shouldSendNotification - Checking for user ${userId}, type: ${notificationData.type}`);
      console.log(`[NotificationsService] shouldSendNotification - Preferences global.in_app: ${preferences.global?.in_app}`);

      // Check global preferences
      if (!preferences.global?.in_app) {
        console.log(`[NotificationsService] shouldSendNotification - Blocked: global.in_app is false or undefined`);
        return false;
      }

      // Check type-specific preferences
      const typePrefs = preferences.types?.[notificationData.type];
      console.log(`[NotificationsService] shouldSendNotification - Type prefs for ${notificationData.type}: ${JSON.stringify(typePrefs)}`);
      if (typePrefs && !typePrefs.in_app) {
        console.log(`[NotificationsService] shouldSendNotification - Blocked: type-specific in_app is false`);
        return false;
      }

      // Check quiet hours
      if (preferences.quiet_hours && this.isInQuietHours(preferences.quiet_hours)) {
        // Allow urgent notifications during quiet hours
        if (notificationData.priority !== NotificationPriority.URGENT) {
          console.log(`[NotificationsService] shouldSendNotification - Blocked: quiet hours active`);
          return false;
        }
      }

      // Daily limit check removed - no limit on notifications

      console.log(`[NotificationsService] shouldSendNotification - Notification ALLOWED for user ${userId}`);
      return true;
    } catch (error) {
      this.logger.error(`Error checking notification preferences: ${error.message}`, error.stack);
      return true; // Default to allow if there's an error
    }
  }

  private async getUnreadCount(userId: string): Promise<number> {
    try {
      const unreadNotifications = await this.db.findMany('notifications', {
        user_id: userId,
        is_read: false,
      });
      return unreadNotifications.length;
    } catch (error) {
      this.logger.error(`Failed to get unread count: ${error.message}`, error.stack);
      return 0;
    }
  }

  private async getTodayNotificationCount(userId: string): Promise<number> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Use SDK query builder for date comparison
      const query = this.db.table('notifications')
        .where('user_id', userId)
        .gte('created_at', today);
      
      const result = await query.execute();
      const notifications = result.data;
      
      return notifications.length;
    } catch (error) {
      this.logger.error(`Failed to get today's notification count: ${error.message}`, error.stack);
      return 0;
    }
  }

  private isInQuietHours(quietHours: NotificationPreferences['quiet_hours']): boolean {
    if (!quietHours) return false;

    try {
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
      const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

      // Check if current day is in quiet hours days
      if (!quietHours.days.includes(currentDay)) {
        return false;
      }

      // Simple time comparison (assumes same day, doesn't handle overnight ranges perfectly)
      return currentTime >= quietHours.start && currentTime <= quietHours.end;
    } catch (error) {
      this.logger.error(`Error checking quiet hours: ${error.message}`);
      return false;
    }
  }

  private buildEmailContent(notificationData: CreateNotificationDto, config?: Record<string, any>): { html: string; text: string } {
    const text = `${notificationData.title}${notificationData.message ? '\n\n' + notificationData.message : ''}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">${notificationData.title}</h2>
        ${notificationData.message ? `<p style="color: #666;">${notificationData.message}</p>` : ''}
        ${notificationData.action_url ? `<a href="${notificationData.action_url}" style="display: inline-block; background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">View Details</a>` : ''}
      </div>
    `;

    return { html, text };
  }

  private getDefaultPreferences(userId: string): NotificationPreferences {
    const defaultChannelPrefs = {
      push: true,
      email: false,
      in_app: true,
    };

    return {
      user_id: userId,
      global: defaultChannelPrefs,
      types: Object.values(NotificationType).reduce((acc, type) => {
        acc[type] = defaultChannelPrefs;
        return acc;
      }, {} as Record<string, { push: boolean; email: boolean; in_app: boolean }>),
      daily_limit: 50,
      grouping: {
        group_similar: true,
        group_by_type: true,
        max_group_size: 5,
      },
      language: 'en',
      metadata: {},
    };
  }

  private formatNotification(notification: any): NotificationResponseDto {
    return {
      id: notification.id,
      user_id: notification.user_id,
      type: notification.notification_type,
      title: notification.title,
      message: notification.message,
      data: notification.action_data || {},
      is_read: notification.is_read,
      is_archived: false, // Not in schema, always false
      action_url: notification.action_url,
      priority: notification.priority,
      expires_at: null, // Not in schema
      read_at: notification.read_at,
      created_at: notification.created_at,
    };
  }
}