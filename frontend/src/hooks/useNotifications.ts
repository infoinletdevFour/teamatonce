/**
 * useNotifications Hook
 *
 * Real-time notification management hook with WebSocket integration
 * Provides notifications state, actions, and real-time updates
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { socketClient } from '../lib/websocket-client';
import { notificationService, AppNotification, NotificationFilters } from '../services/notificationService';
import { useAuth } from '../contexts/AuthContext';

export interface UseNotificationsOptions {
  /** Auto mark notifications as read after viewing */
  autoMarkAsRead?: boolean;
  /** Maximum notifications to keep in state */
  maxNotifications?: number;
  /** Show toast for new notifications */
  showToast?: boolean;
  /** Show desktop notifications */
  showDesktopNotification?: boolean;
  /** Custom toast handler */
  onNewNotification?: (notification: AppNotification) => void;
}

export interface UseNotificationsReturn {
  // State
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  isConnected: boolean;
  error: string | null;

  // Actions
  loadNotifications: (filters?: NotificationFilters) => Promise<void>;
  loadUnreadCount: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAsUnread: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  clearAllRead: () => Promise<void>;

  // Utilities
  requestPermission: () => Promise<boolean>;
  getNotificationsByType: (type: string) => AppNotification[];
  getRecentNotifications: (count?: number) => AppNotification[];
}

export const useNotifications = (options: UseNotificationsOptions = {}): UseNotificationsReturn => {
  const {
    autoMarkAsRead = false,
    maxNotifications = 50,
    showToast = true,
    showDesktopNotification = true,
    onNewNotification,
  } = options;

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const autoMarkTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Strip HTML from message
  const stripHtml = (html: string): string => {
    if (!html) return '';
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  };

  // Show desktop notification
  const showDesktopNotificationHandler = useCallback((notification: AppNotification) => {
    if (!showDesktopNotification) return;

    if ('Notification' in window && Notification.permission === 'granted') {
      const notif = new window.Notification(notification.title, {
        body: stripHtml(notification.message || ''),
        icon: '/assets/logo.png',
        tag: notification.id,
        requireInteraction: notification.priority === 'URGENT' || notification.priority === 'HIGH',
      });

      notif.onclick = () => {
        window.focus();
        if (notification.action_url) {
          // Use full page navigation for company routes to properly reinitialize context
          if (notification.action_url.startsWith('/company/')) {
            window.location.href = notification.action_url;
          } else {
            navigate(notification.action_url);
          }
        }
        notif.close();
      };

      // Auto close after 10 seconds for non-urgent
      if (notification.priority !== 'URGENT' && notification.priority !== 'HIGH') {
        setTimeout(() => notif.close(), 10000);
      }
    }
  }, [navigate, showDesktopNotification]);

  // Load notifications from API
  const loadNotifications = useCallback(async (filters?: NotificationFilters) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await notificationService.getNotifications({
        limit: maxNotifications,
        sort_by: 'created_at',
        sort_order: 'desc',
        ...filters,
      });

      setNotifications(response.data || []);
      setUnreadCount(response.unread_count || 0);
    } catch (err: any) {
      console.error('Failed to load notifications:', err);
      setError(err.message || 'Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  }, [maxNotifications]);

  // Load unread count only
  const loadUnreadCount = useCallback(async () => {
    try {
      const response = await notificationService.getUnreadCount();
      setUnreadCount(response.count || 0);
    } catch (err: any) {
      console.error('Failed to load unread count:', err);
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);

      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err: any) {
      console.error('Failed to mark as read:', err);
      toast.error('Failed to mark notification as read');
    }
  }, []);

  // Mark notification as unread
  const markAsUnread = useCallback(async (notificationId: string) => {
    try {
      await notificationService.markAsUnread(notificationId);

      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, is_read: false, read_at: undefined } : n))
      );
      setUnreadCount(prev => prev + 1);
    } catch (err: any) {
      console.error('Failed to mark as unread:', err);
      toast.error('Failed to mark notification as unread');
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();

      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (err: any) {
      console.error('Failed to mark all as read:', err);
      toast.error('Failed to mark all notifications as read');
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const notification = notifications.find(n => n.id === notificationId);
      await notificationService.deleteNotification(notificationId);

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      if (notification && !notification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err: any) {
      console.error('Failed to delete notification:', err);
      toast.error('Failed to delete notification');
    }
  }, [notifications]);

  // Clear all read notifications
  const clearAllRead = useCallback(async () => {
    try {
      await notificationService.clearAllRead();

      setNotifications(prev => prev.filter(n => !n.is_read));
      toast.success('All read notifications cleared');
    } catch (err: any) {
      console.error('Failed to clear read notifications:', err);
      toast.error('Failed to clear notifications');
    }
  }, []);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }, []);

  // Get notifications by type
  const getNotificationsByType = useCallback((type: string): AppNotification[] => {
    return notifications.filter(n => n.type === type);
  }, [notifications]);

  // Get recent notifications
  const getRecentNotifications = useCallback((count: number = 5): AppNotification[] => {
    return notifications.slice(0, count);
  }, [notifications]);

  // Handle new notification from WebSocket
  const handleNewNotification = useCallback((data: any) => {
    const notification = data.data || data;

    if (!notification || !notification.title) {
      return;
    }

    // Update state
    setNotifications(prev => {
      const exists = prev.some(n => n.id === notification.id);
      if (exists) return prev;
      return [notification, ...prev.slice(0, maxNotifications - 1)];
    });
    setUnreadCount(prev => prev + 1);

    // Show toast
    if (showToast) {
      toast(notification.title, {
        description: stripHtml(notification.message || ''),
        duration: 5000,
        action: notification.action_url
          ? {
              label: 'View',
              onClick: () => {
                // Use full page navigation for company routes to properly reinitialize context
                if (notification.action_url.startsWith('/company/')) {
                  window.location.href = notification.action_url;
                } else {
                  navigate(notification.action_url);
                }
              },
            }
          : undefined,
      });
    }

    // Show desktop notification
    showDesktopNotificationHandler(notification);

    // Custom handler
    if (onNewNotification) {
      onNewNotification(notification);
    }

    // Auto mark as read after delay
    if (autoMarkAsRead) {
      if (autoMarkTimerRef.current) {
        clearTimeout(autoMarkTimerRef.current);
      }
      autoMarkTimerRef.current = setTimeout(() => {
        markAsRead(notification.id);
      }, 3000);
    }
  }, [
    maxNotifications,
    showToast,
    navigate,
    showDesktopNotificationHandler,
    onNewNotification,
    autoMarkAsRead,
    markAsRead,
  ]);

  // Handle notification read event from WebSocket
  const handleNotificationRead = useCallback((data: any) => {
    const notificationId = data.notification_id || data.id;

    setNotifications(prev =>
      prev.map(n => (n.id === notificationId ? { ...n, is_read: true } : n))
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  // Handle notification deleted event from WebSocket
  const handleNotificationDeleted = useCallback((data: any) => {
    const notificationId = data.notification_id || data.id;

    setNotifications(prev => {
      const notification = prev.find(n => n.id === notificationId);
      if (notification && !notification.is_read) {
        setUnreadCount(count => Math.max(0, count - 1));
      }
      return prev.filter(n => n.id !== notificationId);
    });
  }, []);

  // WebSocket connection and event handling
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setIsConnected(false);
      return;
    }

    const socket = socketClient.getSocket();

    // Check if socket is connected
    const checkConnection = () => {
      const connected = socketClient.isConnected();
      setIsConnected(connected);
      return connected;
    };

    // Initial connection check
    if (!checkConnection()) {
      // Try to connect
      socketClient.connect(user.id);
    }

    // Setup event listeners
    if (socket) {
      socket.on('connect', () => setIsConnected(true));
      socket.on('disconnect', () => setIsConnected(false));
      socket.on('notification', handleNewNotification);
      socket.on('notification:event', handleNewNotification);
      socket.on('notification_read', handleNotificationRead);
      socket.on('notification_deleted', handleNotificationDeleted);
    }

    // Initial load
    loadNotifications();
    requestPermission();

    // Periodic unread count refresh
    const countInterval = setInterval(loadUnreadCount, 60000);

    return () => {
      clearInterval(countInterval);

      if (autoMarkTimerRef.current) {
        clearTimeout(autoMarkTimerRef.current);
      }

      if (socket) {
        socket.off('connect');
        socket.off('disconnect');
        socket.off('notification', handleNewNotification);
        socket.off('notification:event', handleNewNotification);
        socket.off('notification_read', handleNotificationRead);
        socket.off('notification_deleted', handleNotificationDeleted);
      }
    };
  }, [
    isAuthenticated,
    user,
    handleNewNotification,
    handleNotificationRead,
    handleNotificationDeleted,
    loadNotifications,
    loadUnreadCount,
    requestPermission,
  ]);

  return {
    // State
    notifications,
    unreadCount,
    isLoading,
    isConnected,
    error,

    // Actions
    loadNotifications,
    loadUnreadCount,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    deleteNotification,
    clearAllRead,

    // Utilities
    requestPermission,
    getNotificationsByType,
    getRecentNotifications,
  };
};

export default useNotifications;
