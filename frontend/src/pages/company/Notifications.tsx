/**
 * Notifications Page for Team@Once
 *
 * Full page view for managing all user notifications with filtering,
 * bulk actions, and detailed notification display
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Trash2,
  Filter,
  Search,
  RefreshCw,
  Loader2,
  Mail,
  MailOpen,
  Calendar,
  AlertCircle,
  Info,
  Star,
  DollarSign,
  MessageSquare,
  FolderKanban,
  Target,
  Shield,
  Megaphone,
  X,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  notificationService,
  type AppNotification,
  type NotificationType,
  type NotificationPriority,
  type NotificationFilters,
} from '@/services/notificationService';
import { useCompanyStore } from '@/stores/companyStore';
import { formatDistanceToNow } from 'date-fns';

type TabType = 'all' | 'unread' | 'read';

// Notification type icons and colors
const notificationTypeConfig: Record<
  NotificationType,
  { icon: React.ElementType; color: string; bgColor: string }
> = {
  SYSTEM: { icon: Info, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  REMINDER: { icon: Clock, color: 'text-amber-600', bgColor: 'bg-amber-100' },
  ACHIEVEMENT: { icon: Star, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  HEALTH: { icon: AlertCircle, color: 'text-green-600', bgColor: 'bg-green-100' },
  FITNESS: { icon: Target, color: 'text-orange-600', bgColor: 'bg-orange-100' },
  FINANCE: { icon: DollarSign, color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
  TRAVEL: { icon: Calendar, color: 'text-cyan-600', bgColor: 'bg-cyan-100' },
  MEDITATION: { icon: Star, color: 'text-purple-600', bgColor: 'bg-purple-100' },
  SOCIAL: { icon: MessageSquare, color: 'text-pink-600', bgColor: 'bg-pink-100' },
  SECURITY: { icon: Shield, color: 'text-red-600', bgColor: 'bg-red-100' },
  UPDATE: { icon: RefreshCw, color: 'text-indigo-600', bgColor: 'bg-indigo-100' },
  PROMOTIONAL: { icon: Megaphone, color: 'text-violet-600', bgColor: 'bg-violet-100' },
  PROJECT: { icon: FolderKanban, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  MILESTONE: { icon: Target, color: 'text-purple-600', bgColor: 'bg-purple-100' },
  PAYMENT: { icon: DollarSign, color: 'text-green-600', bgColor: 'bg-green-100' },
  MESSAGE: { icon: MessageSquare, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  DISPUTE: { icon: AlertCircle, color: 'text-red-600', bgColor: 'bg-red-100' },
  OTHER: { icon: Bell, color: 'text-gray-600', bgColor: 'bg-gray-100' },
};

const priorityColors: Record<NotificationPriority, string> = {
  LOW: 'bg-gray-100 text-gray-600',
  NORMAL: 'bg-blue-100 text-blue-600',
  HIGH: 'bg-orange-100 text-orange-600',
  URGENT: 'bg-red-100 text-red-600',
};

export default function Notifications() {
  const navigate = useNavigate();
  const { companyId: urlCompanyId } = useParams<{ companyId: string }>();
  const { currentCompany, companies } = useCompanyStore();

  // Use URL company ID first, then fall back to store's current company, then first company in list
  // This ensures we always use the logged-in user's company context, not the notification sender's
  const companyId = urlCompanyId || currentCompany?.id || companies?.[0]?.id;

  // State
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [selectedType, setSelectedType] = useState<NotificationType | 'all'>('all');
  const [selectedPriority, setSelectedPriority] = useState<NotificationPriority | 'all'>('all');
  const [unreadCount, setUnreadCount] = useState(0);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // Fetch notifications
  const fetchNotifications = async (showRefresh = false, page = pagination.page) => {
    if (showRefresh) {
      setIsRefreshing(true);
    }

    try {
      const filters: NotificationFilters = {
        page,
        limit: pagination.limit,
        sort_by: 'created_at',
        sort_order: 'desc',
      };

      // Apply tab filter
      if (activeTab === 'unread') {
        filters.is_read = false;
      } else if (activeTab === 'read') {
        filters.is_read = true;
      }

      // Apply type filter
      if (selectedType !== 'all') {
        filters.type = selectedType;
      }

      // Apply priority filter
      if (selectedPriority !== 'all') {
        filters.priority = selectedPriority;
      }

      // Apply search
      if (searchQuery.trim()) {
        filters.search = searchQuery.trim();
      }

      const response = await notificationService.getNotifications(filters);
      setNotifications(response.data || []);
      setPagination({
        page: response.pagination?.page ?? page,
        limit: response.pagination?.limit ?? pagination.limit,
        total: response.pagination?.total ?? 0,
        totalPages: response.pagination?.totalPages ?? 0,
      });
      setUnreadCount(response.unread_count || 0);
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Initial fetch and refetch when filters change
  useEffect(() => {
    fetchNotifications(false, 1); // Reset to page 1 when filters change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedType, selectedPriority, searchQuery]);

  // Handle refresh
  const handleRefresh = () => {
    fetchNotifications(true);
  };

  // Handle mark as read
  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      toast.success('Marked as read');
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  // Handle mark as unread
  const handleMarkAsUnread = async (id: string) => {
    try {
      await notificationService.markAsUnread(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: false, read_at: undefined } : n))
      );
      setUnreadCount((prev) => prev + 1);
      toast.success('Marked as unread');
    } catch (error) {
      toast.error('Failed to mark as unread');
    }
  };

  // Handle delete notification
  const handleDelete = async (id: string) => {
    try {
      await notificationService.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setSelectedIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      toast.success('Notification deleted');
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  // Handle bulk mark as read
  const handleBulkMarkAsRead = async () => {
    if (selectedIds.size === 0) return;

    try {
      await notificationService.markBulkAsRead(Array.from(selectedIds));
      setNotifications((prev) =>
        prev.map((n) =>
          selectedIds.has(n.id) ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
        )
      );
      const unreadSelectedCount = notifications.filter(
        (n) => selectedIds.has(n.id) && !n.is_read
      ).length;
      setUnreadCount((prev) => Math.max(0, prev - unreadSelectedCount));
      setSelectedIds(new Set());
      toast.success(`${selectedIds.size} notifications marked as read`);
    } catch (error) {
      toast.error('Failed to mark selected as read');
    }
  };

  // Handle clear all read notifications
  const handleClearAllRead = async () => {
    try {
      await notificationService.clearAllRead();
      setNotifications((prev) => prev.filter((n) => !n.is_read));
      toast.success('Cleared all read notifications');
    } catch (error) {
      toast.error('Failed to clear read notifications');
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification: AppNotification) => {
    if (!notification.is_read) {
      handleMarkAsRead(notification.id);
    }

    if (notification.action_url) {
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

  // Toggle selection
  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Select all visible
  const selectAll = () => {
    if (selectedIds.size === notifications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(notifications.map((n) => n.id)));
    }
  };

  // Format time
  const formatTime = (date: string) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch {
      return 'Unknown';
    }
  };

  // Get icon for notification type
  const getNotificationIcon = (type: NotificationType) => {
    const config = notificationTypeConfig[type] || notificationTypeConfig.OTHER;
    const Icon = config.icon;
    return (
      <div className={`w-10 h-10 rounded-full ${config.bgColor} flex items-center justify-center`}>
        <Icon className={`w-5 h-5 ${config.color}`} />
      </div>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Notifications</h1>
                  <p className="text-sm text-muted-foreground">
                    {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              {unreadCount > 0 && (
                <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
                  <CheckCheck className="w-4 h-4 mr-2" />
                  Mark All Read
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6">
        {/* Tabs and Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
            {(['all', 'unread', 'read'] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === tab
                    ? 'bg-background shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {tab === 'unread' && unreadCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {unreadCount}
                  </Badge>
                )}
              </button>
            ))}
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <Button
              variant={showFilters ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {(selectedType !== 'all' || selectedPriority !== 'all') && (
                <Badge variant="secondary" className="ml-2">
                  {[selectedType !== 'all', selectedPriority !== 'all'].filter(Boolean).length}
                </Badge>
              )}
            </Button>
          </div>
        </div>

        {/* Filter Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <Card className="mb-6">
                <CardContent className="pt-4">
                  <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[200px]">
                      <label className="text-sm font-medium mb-2 block">Type</label>
                      <select
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value as NotificationType | 'all')}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      >
                        <option value="all">All Types</option>
                        {Object.keys(notificationTypeConfig).map((type) => (
                          <option key={type} value={type}>
                            {type.charAt(0) + type.slice(1).toLowerCase()}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1 min-w-[200px]">
                      <label className="text-sm font-medium mb-2 block">Priority</label>
                      <select
                        value={selectedPriority}
                        onChange={(e) =>
                          setSelectedPriority(e.target.value as NotificationPriority | 'all')
                        }
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      >
                        <option value="all">All Priorities</option>
                        <option value="LOW">Low</option>
                        <option value="NORMAL">Normal</option>
                        <option value="HIGH">High</option>
                        <option value="URGENT">Urgent</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedType('all');
                          setSelectedPriority('all');
                          setSearchQuery('');
                        }}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Clear Filters
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bulk Actions */}
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-primary/5 border border-primary/20 rounded-lg p-3 mb-4 flex items-center justify-between"
          >
            <span className="text-sm font-medium">
              {selectedIds.size} notification{selectedIds.size > 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleBulkMarkAsRead}>
                <Check className="w-4 h-4 mr-2" />
                Mark as Read
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
                <X className="w-4 h-4 mr-2" />
                Clear Selection
              </Button>
            </div>
          </motion.div>
        )}

        {/* Notifications List */}
        <div className="space-y-2">
          {/* Select All */}
          {notifications.length > 0 && (
            <div className="flex items-center gap-3 px-4 py-2 text-sm text-muted-foreground">
              <Checkbox
                checked={selectedIds.size === notifications.length && notifications.length > 0}
                onCheckedChange={selectAll}
              />
              <span>Select all</span>
            </div>
          )}

          {/* Notification Items */}
          {notifications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <BellOff className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No notifications</h3>
              <p className="text-muted-foreground">
                {activeTab === 'unread'
                  ? "You're all caught up!"
                  : activeTab === 'read'
                  ? 'No read notifications yet'
                  : 'No notifications to display'}
              </p>
            </motion.div>
          ) : (
            <AnimatePresence>
              {notifications.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.02 }}
                >
                  <Card
                    className={`transition-all hover:shadow-md ${
                      !notification.is_read ? 'bg-primary/5 border-primary/20' : ''
                    } ${selectedIds.has(notification.id) ? 'ring-2 ring-primary' : ''}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <Checkbox
                          checked={selectedIds.has(notification.id)}
                          onCheckedChange={() => toggleSelection(notification.id)}
                          onClick={(e) => e.stopPropagation()}
                        />

                        <div
                          className="flex-1 cursor-pointer"
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="flex items-start gap-4">
                            {getNotificationIcon(notification.type)}

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h4
                                    className={`font-medium ${
                                      !notification.is_read ? 'text-foreground' : 'text-muted-foreground'
                                    }`}
                                  >
                                    {notification.title}
                                  </h4>
                                  {notification.message && (
                                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                      {notification.message}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <Badge className={priorityColors[notification.priority]}>
                                    {notification.priority.toLowerCase()}
                                  </Badge>
                                  {!notification.is_read && (
                                    <div className="w-2 h-2 rounded-full bg-primary" />
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-4 mt-3">
                                <span className="text-xs text-muted-foreground">
                                  {formatTime(notification.created_at)}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {notification.type.toLowerCase()}
                                </Badge>
                                {notification.action_url && (
                                  <span className="text-xs text-primary flex items-center gap-1">
                                    <ExternalLink className="w-3 h-3" />
                                    View details
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          {notification.is_read ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsUnread(notification.id);
                              }}
                              title="Mark as unread"
                            >
                              <Mail className="w-4 h-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsRead(notification.id);
                              }}
                              title="Mark as read"
                            >
                              <MailOpen className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(notification.id);
                            }}
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}{' '}
              notifications
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchNotifications(false, pagination.page - 1)}
                disabled={pagination.page === 1}
              >
                Previous
              </Button>
              <span className="text-sm">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchNotifications(false, pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        {notifications.some((n) => n.is_read) && (
          <div className="mt-6 pt-4 border-t text-center">
            <Button variant="ghost" size="sm" onClick={handleClearAllRead} className="text-destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All Read Notifications
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
