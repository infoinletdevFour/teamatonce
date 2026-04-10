import React from 'react';
import { motion } from 'framer-motion';
import { Search, Star } from 'lucide-react';
import { mockDevelopers } from '@/lib/landing-data';

/**
 * SearchMockup Component
 * Visual representation of the AI-powered developer search feature
 */
export const SearchMockup: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative"
    >
      <div className="bg-white rounded-3xl p-8 border-4 border-blue-200 shadow-2xl">
        <div className="flex items-center space-x-3 mb-6">
          <Search className="w-6 h-6 text-blue-600" />
          <input
            type="text"
            placeholder="Need React developer for e-commerce app..."
            className="flex-1 bg-blue-50 border-2 border-blue-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-500 outline-none font-medium"
            disabled
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg"
          >
            Find
          </motion.button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
          {mockDevelopers.map((dev, i) => (
            <motion.div
              key={i}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 + i * 0.2 }}
              className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-4 flex items-center space-x-4"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {dev.name[0]}
              </div>
              <div className="flex-1">
                <div className="font-bold text-gray-900 mb-1">{dev.name}</div>
                <div className="text-sm text-gray-600">{dev.role} • {dev.rate}</div>
              </div>
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default SearchMockup;
