/**
 * NotificationBell Component
 *
 * Bell icon with dropdown showing notifications
 * Includes real-time updates via WebSocket using useNotifications hook
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, Loader2, X, Wifi, WifiOff } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { AppNotification } from '../../services/notificationService';
import { NotificationItem } from './NotificationItem';
import { useCompanyStore } from '../../stores/companyStore';

interface NotificationBellProps {
  className?: string;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { companyId: urlCompanyId } = useParams<{ companyId?: string }>();
  const { currentCompany, companies } = useCompanyStore();

  // Use URL company ID first, then fall back to store's current company, then first company in list
  // This ensures we always use the logged-in user's company context, not the notification sender's
  const companyId = urlCompanyId || currentCompany?.id || companies?.[0]?.id;

  // Use the notifications hook for real-time updates
  const {
    notifications,
    unreadCount,
    isLoading,
    isConnected,
    markAsRead,
    markAllAsRead: handleMarkAllAsRead,
    loadNotifications,
  } = useNotifications({
    maxNotifications: 10,
    showToast: true,
    showDesktopNotification: true,
  });

  // Handle notification click
  const handleNotificationClick = async (notification: AppNotification) => {
    // Mark as read if unread
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    // Navigate to action URL if exists
    if (notification.action_url) {
      setIsOpen(false);

      // For project-related notifications, use the current user's company context
      // This handles cases where clients and developers have different company IDs
      const notificationData = notification.data as { projectId?: string; eventId?: string } | undefined;
      if (notificationData?.projectId && companyId) {
        // Extract the path after /project/ and construct with current company context
        const projectPath = notification.action_url.match(/\/project\/[^/]+\/(.*)/)?.[1] || '';
        const targetUrl = `/company/${companyId}/project/${notificationData.projectId}/${projectPath}`;
        window.location.href = targetUrl;
        return;
      }

      // Use full page navigation for routes that need to exit company context
      if (
        notification.action_url.startsWith('/company/') ||
        notification.action_url.startsWith('/account/') ||
        notification.action_url.startsWith('/admin/')
      ) {
        window.location.href = notification.action_url;
      } else {
        navigate(notification.action_url);
      }
    }
  };

  // Load notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      loadNotifications({ limit: 10 });
    }
  }, [isOpen, loadNotifications]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Bell Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-xl transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 text-gray-600" />
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs font-bold text-white bg-red-500 rounded-full"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.span>
        )}
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-sky-600 to-sky-700">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-white">Notifications</h3>
                {/* Connection status indicator */}
                <div
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                    isConnected
                      ? 'bg-green-500/20 text-green-100'
                      : 'bg-red-500/20 text-red-100'
                  }`}
                  title={isConnected ? 'Real-time updates active' : 'Reconnecting...'}
                >
                  {isConnected ? (
                    <Wifi className="h-3 w-3" />
                  ) : (
                    <WifiOff className="h-3 w-3" />
                  )}
                  {isConnected ? 'Live' : 'Offline'}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs text-white/80 hover:text-white flex items-center gap-1 transition-colors"
                  >
                    <Check className="h-3 w-3" />
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-[400px] overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                  <Bell className="h-12 w-12 text-gray-300 mb-3" />
                  <p className="text-sm text-gray-500 font-medium">No notifications yet</p>
                  <p className="text-xs text-gray-400 mt-1">
                    We'll notify you when something important happens
                  </p>
                </div>
              ) : (
                <div>
                  {notifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onClick={() => handleNotificationClick(notification)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="border-t border-gray-200 p-2">
                <button
                  onClick={() => {
                    if (companyId) {
                      navigate(`/company/${companyId}/notifications`);
                    }
                    setIsOpen(false);
                  }}
                  className="w-full py-2 text-sm font-medium text-sky-600 hover:text-sky-700 hover:bg-sky-50 rounded-lg transition-colors"
                >
                  View all notifications
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
