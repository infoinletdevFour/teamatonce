import React from 'react';
import { motion } from 'framer-motion';
import { Layers, Bell, Settings, Clock, Users } from 'lucide-react';
import { mockDashboardColumns } from '@/lib/landing-data';

/**
 * DashboardMockup Component
 * Visual representation of the all-in-one project management dashboard
 */
export const DashboardMockup: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative"
    >
      <div className="bg-white rounded-3xl p-6 border-4 border-purple-200 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Layers className="w-6 h-6 text-purple-600" />
            <span className="font-bold text-gray-900 text-lg">Project Dashboard</span>
          </div>
          <div className="flex space-x-2">
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center cursor-pointer"
            >
              <Bell className="w-5 h-5 text-purple-600" />
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center cursor-pointer"
            >
              <Settings className="w-5 h-5 text-purple-600" />
            </motion.div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          {mockDashboardColumns.map((col, idx) => (
            <motion.div
              key={col.status}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + idx * 0.1 }}
              className={`bg-gradient-to-br from-${col.color}-50 to-${col.color}-100 rounded-xl p-4 border-2 border-${col.color}-200`}
            >
              <div className="text-sm font-bold text-gray-900 mb-3">{col.status}</div>
              <div className="space-y-2">
                {col.tasks.map((task, i) => (
                  <div key={i} className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                    <div className="text-sm font-semibold text-gray-800 mb-1">{task}</div>
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span>2h</span>
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 border-2 border-white" />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="flex items-center justify-between bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border-2 border-purple-200">
          <div className="flex items-center space-x-2 text-gray-900">
            <Clock className="w-5 h-5 text-purple-600" />
            <span className="font-semibold">24h tracked this week</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-900">
            <Users className="w-5 h-5 text-purple-600" />
            <span className="font-semibold">5 members</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default DashboardMockup;
