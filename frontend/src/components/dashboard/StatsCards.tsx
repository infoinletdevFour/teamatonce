/**
 * Stats Cards Component
 * Displays dashboard statistics in beautiful card format
 */

import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface StatCardData {
  title: string;
  value: string | number;
  icon: LucideIcon;
  gradient: string;
  bgColor?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

interface StatsCardsProps {
  statsConfig: StatCardData[];
  loading?: boolean;
}

const StatCard: React.FC<{
  data: StatCardData;
  index: number;
}> = ({ data, index }) => {
  const Icon = data.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -5, scale: 1.02 }}
      className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100 relative overflow-hidden group hover:border-sky-200 transition-colors"
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-sky-50 rounded-full -mr-16 -mt-16 opacity-50" />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-sky-800 via-sky-700 to-sky-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Icon className="w-6 h-6 text-white" />
          </div>
          {data.trend && (
            <div
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                data.trend.isPositive
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {data.trend.isPositive ? '+' : ''}
              {data.trend.value}%
            </div>
          )}
        </div>

        <div className="text-3xl font-black text-gray-900 mb-1">
          {data.value}
        </div>
        <div className="text-sm text-gray-600 font-medium">{data.title}</div>
      </div>
    </motion.div>
  );
};

const SkeletonCard: React.FC<{ index: number }> = ({ index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-200"
    >
      <div className="animate-pulse">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 bg-gray-200 rounded-xl" />
          <div className="w-16 h-6 bg-gray-200 rounded-full" />
        </div>
        <div className="w-24 h-8 bg-gray-200 rounded mb-2" />
        <div className="w-32 h-4 bg-gray-200 rounded" />
      </div>
    </motion.div>
  );
};

export const StatsCards: React.FC<StatsCardsProps> = ({
  statsConfig,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[0, 1, 2, 3].map((index) => (
          <SkeletonCard key={index} index={index} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsConfig.map((config, index) => (
        <StatCard key={config.title} data={config} index={index} />
      ))}
    </div>
  );
};

export default StatsCards;
