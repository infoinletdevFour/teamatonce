import React from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  CheckCircle2,
  DollarSign,
  Users,
  FileText,
  Clock
} from 'lucide-react';
import { Activity } from '../../types/client';

interface ActivityFeedProps {
  activities: Activity[];
  maxItems?: number;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities, maxItems = 5 }) => {
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

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const displayActivities = activities.slice(0, maxItems);

  return (
    <div className="space-y-3">
      {displayActivities.map((activity, index) => {
        const Icon = getActivityIcon(activity.type);
        const color = getActivityColor(activity.type);

        return (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ x: 5 }}
            className="bg-white rounded-xl p-4 border-2 border-gray-100 hover:border-blue-200 transition-all cursor-pointer group"
          >
            <div className="flex items-start space-x-4">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                <Icon className="w-5 h-5 text-white" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-1">
                  <h4 className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {activity.title}
                  </h4>
                  <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                    {formatTimestamp(activity.timestamp)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">
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
      })}

      {activities.length === 0 && (
        <div className="text-center py-12">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No recent activity</p>
        </div>
      )}
    </div>
  );
};

export default ActivityFeed;
