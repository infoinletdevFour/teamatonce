/**
 * NotificationItem Component
 *
 * Individual notification item for the notification dropdown
 */

import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  CheckCircle,
  CreditCard,
  MessageSquare,
  AlertTriangle,
  Shield,
  Star,
  TrendingUp,
  Users,
  Zap,
  ExternalLink,
} from 'lucide-react';
import { AppNotification, NotificationType, NotificationPriority } from '../../services/notificationService';
type Notification = AppNotification;

interface NotificationItemProps {
  notification: Notification;
  onClick: () => void;
  onViewClick?: () => void;
}

// Helper to strip HTML tags
const stripHtml = (html: string): string => {
  if (!html) return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
};

// Get icon based on notification type
const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'PROJECT':
      return Star;
    case 'MILESTONE':
      return CheckCircle;
    case 'PAYMENT':
      return CreditCard;
    case 'MESSAGE':
      return MessageSquare;
    case 'DISPUTE':
      return AlertTriangle;
    case 'SECURITY':
      return Shield;
    case 'ACHIEVEMENT':
      return Star;
    case 'UPDATE':
      return TrendingUp;
    case 'SOCIAL':
      return Users;
    case 'REMINDER':
      return Star;
    case 'SYSTEM':
      return Zap;
    default:
      return Star;
  }
};

// Get icon color based on priority
const getPriorityColor = (priority: NotificationPriority): string => {
  switch (priority) {
    case 'URGENT':
      return 'text-red-600';
    case 'HIGH':
      return 'text-orange-500';
    case 'NORMAL':
      return 'text-sky-600';
    case 'LOW':
      return 'text-gray-500';
    default:
      return 'text-sky-600';
  }
};

// Get background color for unread notifications
const getTypeBackground = (type: NotificationType): string => {
  switch (type) {
    case 'PAYMENT':
      return 'bg-green-50';
    case 'DISPUTE':
      return 'bg-red-50';
    case 'MILESTONE':
      return 'bg-blue-50';
    case 'MESSAGE':
      return 'bg-purple-50';
    default:
      return 'bg-sky-50';
  }
};

export const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onClick, onViewClick }) => {
  const Icon = getNotificationIcon(notification.type);
  const priorityColor = getPriorityColor(notification.priority);
  const hasActionUrl = !!notification.action_url;

  const handleViewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onViewClick) {
      onViewClick();
    } else {
      onClick();
    }
  };

  return (
    <div
      onClick={onClick}
      className={`
        flex items-start gap-3 p-4 cursor-pointer transition-all duration-200
        hover:bg-gray-50 border-b border-gray-100 last:border-b-0
        ${!notification.is_read ? getTypeBackground(notification.type) : 'bg-white'}
      `}
    >
      {/* Icon */}
      <div className={`mt-0.5 flex-shrink-0 ${priorityColor}`}>
        <Icon className="h-5 w-5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4
            className={`
              text-sm line-clamp-1
              ${!notification.is_read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}
            `}
          >
            {notification.title}
          </h4>
          {/* Unread indicator */}
          {!notification.is_read && (
            <div className="h-2 w-2 rounded-full bg-sky-600 flex-shrink-0 mt-1.5" />
          )}
        </div>

        {/* Message */}
        {notification.message && (
          <p className="text-sm text-gray-600 line-clamp-2 mt-1">
            {stripHtml(notification.message)}
          </p>
        )}

        {/* Timestamp, Priority, and View Button */}
        <div className="flex items-center justify-between gap-2 mt-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">
              {notification.created_at
                ? formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })
                : 'Just now'}
            </span>
            {notification.priority === 'URGENT' && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-medium">
                Urgent
              </span>
            )}
            {notification.priority === 'HIGH' && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 font-medium">
                High Priority
              </span>
            )}
          </div>

          {/* View Button */}
          {hasActionUrl && (
            <button
              onClick={handleViewClick}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-sky-600 bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              View
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationItem;
