import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: LucideIcon;
  gradient: string;
  trend?: 'up' | 'down';
  subtitle?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  change,
  icon: Icon,
  gradient,
  trend,
  subtitle,
}) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      className={`relative overflow-hidden bg-gradient-to-br ${gradient} rounded-2xl p-6 shadow-xl`}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white rounded-full" />
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-white rounded-full" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-white/80 text-sm font-semibold mb-1">{title}</p>
            <h3 className="text-3xl font-black text-white">{value}</h3>
            {subtitle && (
              <p className="text-white/70 text-xs mt-1">{subtitle}</p>
            )}
          </div>
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>

        {change !== undefined && (
          <div className="flex items-center space-x-2">
            <div
              className={`text-sm font-bold ${
                trend === 'up' ? 'text-green-200' : 'text-red-200'
              }`}
            >
              {trend === 'up' ? '↑' : '↓'} {Math.abs(change)}%
            </div>
            <div className="text-white/70 text-xs">from last month</div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default StatsCard;
