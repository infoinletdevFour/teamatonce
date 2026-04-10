import React from 'react';
import { motion } from 'framer-motion';
import { Rocket } from 'lucide-react';
import { TimelineStep } from './TimelineStep';
import { timelineSteps } from '@/lib/timeline-data';

export const HowItWorksSection: React.FC = () => {
  return (
    <section id="how-it-works" className="py-32 px-4 sm:px-6 lg:px-8 bg-white relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 opacity-50" />

      <div className="max-w-7xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full px-6 py-3 mb-6">
            <Rocket className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-bold text-blue-900">Simple 5-Step Process</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black mb-6">
            From Idea to
            <br />
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Delivered Project
            </span>
          </h2>
          <p className="text-base text-gray-600 max-w-3xl mx-auto">
            We've streamlined the entire process. Post, match, collaborate, and pay - all in one platform.
          </p>
        </motion.div>

        <div className="relative">
          {/* Central Timeline Line */}
          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-600 via-purple-600 to-pink-600 transform -translate-x-1/2" />

          <div className="space-y-24">
            {timelineSteps.map((step, index) => (
              <TimelineStep
                key={index}
                number={step.number}
                title={step.title}
                description={step.description}
                icon={step.icon}
                color={step.color}
                mockup={step.mockup}
                index={index}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
