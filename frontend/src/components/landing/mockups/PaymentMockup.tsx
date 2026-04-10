import React from 'react';
import { motion } from 'framer-motion';
import { Lock, CheckCircle2 } from 'lucide-react';
import { mockMilestones } from '@/lib/landing-data';

/**
 * PaymentMockup Component
 * Visual representation of secure milestone-based payment system
 */
export const PaymentMockup: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative"
    >
      <div className="bg-white rounded-3xl p-8 border-4 border-emerald-200 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg">Secure Escrow</span>
          </div>
          <CheckCircle2 className="w-8 h-8 text-green-500" />
        </div>

        <div className="space-y-4">
          {mockMilestones.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + idx * 0.2 }}
              className={`bg-gradient-to-r from-${item.color}-50 to-${item.color}-100 border-2 border-${item.color}-200 rounded-xl p-4 flex items-center justify-between`}
            >
              <div>
                <div className="font-bold text-gray-900 text-lg mb-1">{item.milestone}</div>
                <div className={`text-sm font-semibold ${
                  item.status === 'Released' ? 'text-green-600' :
                  item.status === 'In Progress' ? 'text-blue-600' : 'text-gray-500'
                }`}>{item.status}</div>
              </div>
              <div className="text-2xl font-black text-gray-900">{item.amount}</div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="mt-6 pt-6 border-t-2 border-gray-200 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-teal-50 p-4 rounded-xl"
        >
          <div className="text-lg font-bold text-gray-900">Total Project Value</div>
          <div className="text-3xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">$9,000</div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default PaymentMockup;
