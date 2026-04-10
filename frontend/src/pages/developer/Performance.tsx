import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Star, DollarSign, Target,
  Calendar, CheckCircle, ThumbsUp,
  Trophy, Zap, ArrowUp, ArrowDown, Download,
  Shield, ChevronRight
} from 'lucide-react';
import {
  getPerformanceMetrics,
  getDeveloperReviews,
  getAchievements,
  getSkillRatings,
  type PerformanceMetrics,
  type Review,
  type Achievement as AchievementType,
  type SkillRating,
} from '@/services/developerService';

const Performance: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [recentReviews, setRecentReviews] = useState<Review[]>([]);
  const [achievements, setAchievements] = useState<AchievementType[]>([]);
  const [skillRatings, setSkillRatings] = useState<SkillRating[]>([]);

  useEffect(() => {
    loadPerformanceData();
  }, []);

  const loadPerformanceData = async () => {
    try {
      setLoading(true);
      const [metricsData, reviewsData, achievementsData, skillsData] = await Promise.all([
        getPerformanceMetrics(),
        getDeveloperReviews(3),
        getAchievements(),
        getSkillRatings(),
      ]);

      setMetrics(metricsData);
      setRecentReviews(reviewsData);
      setAchievements(achievementsData);
      setSkillRatings(skillsData);
    } catch (error) {
      console.error('Error loading performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAchievementIcon = (iconName: string) => {
    const iconMap: Record<string, any> = {
      'trophy': Trophy,
      'zap': Zap,
      'thumbs-up': ThumbsUp,
      'shield': Shield,
      'target': Target,
      'check-circle': CheckCircle,
    };
    return iconMap[iconName] || Trophy;
  };

  if (loading || !metrics) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading performance data...</p>
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: 'Overall Rating',
      value: metrics.rating.toFixed(1),
      change: '+0.2 this month',
      trend: 'up',
      icon: Star,
      color: 'from-yellow-600 to-yellow-500',
    },
    {
      label: 'Projects Completed',
      value: metrics.projectsCompleted,
      change: '+5 this month',
      trend: 'up',
      icon: CheckCircle,
      color: 'from-green-600 to-green-500',
    },
    {
      label: 'Total Earnings',
      value: `$${(metrics.totalEarnings / 1000).toFixed(1)}k`,
      change: '+12% this month',
      trend: 'up',
      icon: DollarSign,
      color: 'from-blue-600 to-blue-500',
    },
    {
      label: 'Client Satisfaction',
      value: `${metrics.clientSatisfaction}%`,
      change: '+3% this month',
      trend: 'up',
      icon: ThumbsUp,
      color: 'from-purple-600 to-purple-500',
    },
  ];

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Performance & Analytics
          </h1>
          <p className="text-gray-600 text-lg">
            Track your performance metrics, reviews, and earnings
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors font-semibold"
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="year">Last Year</option>
          </select>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg"
          >
            <Download className="w-5 h-5" />
            <span>Export Report</span>
          </motion.button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const TrendIcon = stat.trend === 'up' ? ArrowUp : ArrowDown;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4 }}
              className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-gray-200 cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <TrendIcon className={`w-5 h-5 ${stat.trend === 'up' ? 'text-green-500' : 'text-red-500'}`} />
              </div>
              <div className="text-3xl font-black text-gray-900 mb-1">{stat.value}</div>
              <div className="text-sm text-gray-600 mb-1">{stat.label}</div>
              <div className={`text-xs font-semibold ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {stat.change}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Earnings Chart */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Monthly Earnings</h3>
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-gray-600">Total:</span>
              <span className="font-bold text-green-600">${metrics.totalEarnings.toLocaleString()}</span>
            </div>
          </div>
          <div className="relative h-64">
            <div className="absolute inset-0 flex items-end justify-between space-x-2">
              {metrics.monthlyEarnings.map((earning, index) => {
                const maxEarning = Math.max(...metrics.monthlyEarnings);
                const height = (earning / maxEarning) * 100;
                return (
                  <motion.div
                    key={index}
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ delay: index * 0.05, duration: 0.5 }}
                    className="flex-1 bg-gradient-to-t from-blue-600 to-purple-600 rounded-t-lg cursor-pointer hover:opacity-80 transition-opacity relative group"
                  >
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                      ${earning.toLocaleString()}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
          <div className="flex justify-between mt-4 text-xs text-gray-600">
            {months.map((month, index) => (
              <span key={index} className={index % 2 === 0 ? '' : 'hidden sm:inline'}>{month}</span>
            ))}
          </div>
        </div>

        {/* Hours Worked Chart */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Hours Worked</h3>
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-gray-600">Total:</span>
              <span className="font-bold text-blue-600">{metrics.hoursWorked.reduce((a, b) => a + b, 0)}h</span>
            </div>
          </div>
          <div className="relative h-64">
            <svg className="w-full h-full">
              <polyline
                points={metrics.hoursWorked
                  .map((hours, index) => {
                    const x = (index / (metrics.hoursWorked.length - 1)) * 100;
                    const maxHours = Math.max(...metrics.hoursWorked);
                    const y = 100 - (hours / maxHours) * 100;
                    return `${x}%,${y}%`;
                  })
                  .join(' ')}
                fill="none"
                stroke="url(#gradient)"
                strokeWidth="3"
                className="drop-shadow-lg"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#9333EA" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="flex justify-between mt-4 text-xs text-gray-600">
            {months.map((month, index) => (
              <span key={index} className={index % 2 === 0 ? '' : 'hidden sm:inline'}>{month}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Performance Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">On-Time Delivery</span>
              <span className="text-lg font-bold text-gray-900">{metrics.onTimeDelivery}%</span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${metrics.onTimeDelivery}%` }}
                transition={{ duration: 1, delay: 0.2 }}
                className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Code Quality</span>
              <span className="text-lg font-bold text-gray-900">{metrics.codeQuality}%</span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${metrics.codeQuality}%` }}
                transition={{ duration: 1, delay: 0.3 }}
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Client Satisfaction</span>
              <span className="text-lg font-bold text-gray-900">{metrics.clientSatisfaction}%</span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${metrics.clientSatisfaction}%` }}
                transition={{ duration: 1, delay: 0.4 }}
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Skill Ratings */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Skill Ratings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {skillRatings.map((skill, index) => (
            <motion.div
              key={skill.skill}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-4 border border-gray-200"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-gray-900">{skill.skill}</h4>
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-bold text-gray-900">{skill.rating}</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>{skill.reviews} reviews</span>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3 h-3 ${
                        i < Math.floor(skill.rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Achievements */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Achievements & Badges</h3>
          <span className="text-sm text-gray-600">{achievements.length} earned</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((achievement, index) => {
            const Icon = getAchievementIcon(achievement.icon);
            return (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-4 border-2 border-gray-200 cursor-pointer"
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${achievement.color} flex items-center justify-center mb-3`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h4 className="font-bold text-gray-900 mb-1">{achievement.title}</h4>
                <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <Calendar className="w-3 h-3" />
                  <span>Earned {new Date(achievement.earned).toLocaleDateString()}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Recent Reviews */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Recent Reviews</h3>
          <motion.button
            whileHover={{ scale: 1.05 }}
            className="flex items-center space-x-2 text-blue-600 hover:text-purple-600 font-semibold"
          >
            <span>View All</span>
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        </div>
        <div className="space-y-4">
          {recentReviews.map((review, index) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white font-bold">
                    {review.clientName[0]}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">{review.clientName}</div>
                    <div className="text-sm text-gray-600">{review.projectTitle}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(review.rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-gray-700 mb-4">"{review.comment}"</p>
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-2">
                  {review.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-blue-100 border border-blue-200 text-blue-700 rounded-full text-xs font-semibold"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(review.date).toLocaleDateString()}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Performance;
