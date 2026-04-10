/**
 * Activity Feed Widget
 * Enhanced version with loading states and real-time updates
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  CheckCircle2,
  DollarSign,
  Users,
  FileText,
  Clock,
} from 'lucide-react';
import { Activity } from '@/types/client';

interface ActivityFeedProps {
  activities: Activity[];
  maxItems?: number;
  loading?: boolean;
  onActivityClick?: (activity: Activity) => void;
}

const ActivitySkeleton: React.FC<{ index: number }> = ({ index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white rounded-xl p-4 border-2 border-gray-100"
    >
      <div className="animate-pulse flex items-start space-x-4">
        <div className="w-10 h-10 bg-gray-200 rounded-xl flex-shrink-0" />
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start justify-between">
            <div className="w-32 h-4 bg-gray-200 rounded" />
            <div className="w-12 h-3 bg-gray-200 rounded" />
          </div>
          <div className="w-full h-3 bg-gray-200 rounded" />
          <div className="w-20 h-5 bg-gray-200 rounded-full" />
        </div>
      </div>
    </motion.div>
  );
};

const getActivityIcon = (type: Activity['type']) => {
  switch (type) {
    case 'message':
      return MessageSquare;
    case 'milestone':
      return CheckCircle2;
    case 'payment':
      return DollarSign;
    case 'team':
      return Users;
    case 'file':
      return FileText;
    default:
      return Clock;
  }
};

const getActivityColor = (type: Activity['type']) => {
  switch (type) {
    case 'message':
      return 'from-blue-500 to-cyan-500';
    case 'milestone':
      return 'from-green-500 to-emerald-500';
    case 'payment':
      return 'from-purple-500 to-pink-500';
    case 'team':
      return 'from-orange-500 to-amber-500';
    case 'file':
      return 'from-indigo-500 to-blue-500';
    default:
      return 'from-gray-500 to-slate-500';
  }
};

const formatTimestamp = (timestamp: Date) => {
  const now = new Date();
  const diff = now.getTime() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

const ActivityItem: React.FC<{
  activity: Activity;
  index: number;
  onActivityClick?: (activity: Activity) => void;
}> = ({ activity, index, onActivityClick }) => {
  const Icon = getActivityIcon(activity.type);
  const color = getActivityColor(activity.type);

  const handleClick = () => {
    if (onActivityClick) {
      onActivityClick(activity);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ x: 5 }}
      onClick={handleClick}
      className="bg-white rounded-xl p-4 border-2 border-gray-100 hover:border-blue-200 transition-all cursor-pointer group"
    >
      <div className="flex items-start space-x-4">
        <div
          className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-sm`}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1">
            <h4 className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
              {activity.title}
            </h4>
            <span className="text-xs text-gray-500 ml-2 flex-shrink-0 font-medium">
              {formatTimestamp(activity.timestamp)}
            </span>
          </div>
          <p className="text-sm text-gray-600 line-clamp-2 mb-2">
            {activity.description}
          </p>
          {activity.projectName && (
            <div className="mt-2">
              <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full font-semibold">
                {activity.projectName}
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  activities,
  maxItems = 5,
  loading = false,
  onActivityClick,
}) => {
  const displayActivities = activities.slice(0, maxItems);

  if (loading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2, 3, 4].slice(0, maxItems).map((index) => (
          <ActivitySkeleton key={index} index={index} />
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-12 bg-gray-50 rounded-xl"
      >
        <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 font-medium">No recent activity</p>
        <p className="text-sm text-gray-400 mt-1">
          Activity will appear here as your projects progress
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-3">
      {displayActivities.map((activity, index) => (
        <ActivityItem
          key={activity.id}
          activity={activity}
          index={index}
          onActivityClick={onActivityClick}
        />
      ))}

      {activities.length > maxItems && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center pt-2"
        >
          <button className="text-sm text-blue-600 font-semibold hover:text-blue-700 transition-colors">
            View all activities ({activities.length})
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default ActivityFeed;
