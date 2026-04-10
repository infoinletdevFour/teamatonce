import React from 'react';
import { motion } from 'framer-motion';
import { Globe, Video } from 'lucide-react';
import { mockLocations } from '@/lib/landing-data';

/**
 * GlobalMockup Component
 * Visual representation of global team collaboration across timezones
 */
export const GlobalMockup: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative"
    >
      <div className="bg-white rounded-3xl p-8 border-4 border-orange-200 shadow-2xl">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center">
            <Globe className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold text-gray-900 text-lg">Global Team</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {mockLocations.map((location, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + idx * 0.15 }}
              className={`bg-gradient-to-br from-${location.color}-50 to-${location.color}-100 border-2 border-${location.color}-200 rounded-xl p-4 text-center`}
            >
              <div className="text-4xl mb-3">{location.flag}</div>
              <div className="font-bold text-gray-900 mb-1">{location.name}</div>
              <div className="text-sm font-semibold text-gray-700">{location.time}</div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="mt-6 flex items-center justify-center space-x-3 bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-xl border-2 border-orange-200"
        >
          <Video className="w-5 h-5 text-orange-600" />
          <span className="font-bold text-gray-900">Team meeting in 30 minutes</span>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default GlobalMockup;
