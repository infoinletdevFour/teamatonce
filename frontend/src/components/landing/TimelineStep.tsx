import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface TimelineStepProps {
  number: string;
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  mockup: React.ReactNode;
  index: number;
}

export const TimelineStep: React.FC<TimelineStepProps> = ({
  number,
  title,
  description,
  icon: Icon,
  color,
  mockup,
  index
}) => {
  const isEven = index % 2 === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ delay: index * 0.2 }}
      className={`flex flex-col lg:flex-row items-center gap-12 ${
        isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'
      }`}
    >
      {/* Content Side */}
      <div className={`flex-1 ${isEven ? 'lg:text-right' : 'lg:text-left'}`}>
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-3xl p-8 shadow-2xl border-2 border-gray-100"
        >
          <div className={`flex items-center gap-4 mb-6 ${isEven ? 'lg:flex-row-reverse lg:justify-end' : 'lg:justify-start'}`}>
            <div className={`text-6xl font-black bg-gradient-to-r ${color} bg-clip-text text-transparent`}>
              {number}
            </div>
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}>
              <Icon className="w-8 h-8 text-white" />
            </div>
          </div>
          <h3 className="text-3xl font-black text-gray-900 mb-4">{title}</h3>
          <p className="text-lg text-gray-600 leading-relaxed">{description}</p>
        </motion.div>
      </div>

      {/* Center Circle */}
      <div className="lg:w-32 flex justify-center relative z-10">
        <motion.div
          whileHover={{ scale: 1.2, rotate: 180 }}
          transition={{ duration: 0.5 }}
          className={`w-24 h-24 rounded-full bg-gradient-to-br ${color} flex items-center justify-center shadow-2xl border-8 border-white`}
        >
          <Icon className="w-12 h-12 text-white" />
        </motion.div>
      </div>

      {/* Visual Mockup Side */}
      <div className="flex-1">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          whileHover={{ y: -5 }}
        >
          {mockup}
        </motion.div>
      </div>
    </motion.div>
  );
};
