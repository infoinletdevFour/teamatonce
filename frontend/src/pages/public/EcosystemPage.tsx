import React from 'react';
import { motion } from 'framer-motion';
import {
  Zap,
  Code,
  Users,
  CreditCard,
  MessageSquare,
  FileCheck,
  Briefcase,
  Globe
} from 'lucide-react';
import { Link } from 'react-router-dom';
import UnifiedHeader from '../../components/layout/UnifiedHeader';
import Footer from '../../components/layout/Footer';

const EcosystemPage: React.FC = () => {
  const ecosystemItems = [
    {
      name: 'AI Matching',
      icon: Zap,
      position: { top: '5%', left: '50%', transform: 'translateX(-50%)' },
      color: 'from-sky-600 to-sky-500'
    },
    {
      name: 'Developer Hub',
      icon: Code,
      position: { top: '25%', right: '10%' },
      color: 'from-sky-700 to-sky-600'
    },
    {
      name: 'Team Collaboration',
      icon: Users,
      position: { bottom: '25%', right: '10%' },
      color: 'from-sky-600 to-sky-500'
    },
    {
      name: 'Payment Gateway',
      icon: CreditCard,
      position: { bottom: '5%', left: '50%', transform: 'translateX(-50%)' },
      color: 'from-sky-700 to-sky-600'
    },
    {
      name: 'Communication',
      icon: MessageSquare,
      position: { bottom: '25%', left: '10%' },
      color: 'from-sky-600 to-sky-500'
    },
    {
      name: 'Project Management',
      icon: FileCheck,
      position: { top: '25%', left: '10%' },
      color: 'from-sky-700 to-sky-600'
    },
    {
      name: 'Client Portal',
      icon: Briefcase,
      position: { top: '35%', left: '5%' },
      color: 'from-sky-600 to-sky-500'
    },
    {
      name: 'Global Network',
      icon: Globe,
      position: { top: '35%', right: '5%' },
      color: 'from-sky-700 to-sky-600'
    }
  ];

  return (
    <>
      <UnifiedHeader />
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 relative overflow-hidden pt-20">
        {/* Animated Background */}
        <div className="absolute inset-0">
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                y: [0, -30, 0],
                opacity: [0.1, 0.3, 0.1],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
              className="absolute w-1 h-1 bg-white rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
            />
          ))}
        </div>

        <div className="container mx-auto px-4 py-20 relative z-10">
          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h1 className="text-5xl md:text-6xl font-black text-white mb-4">
              Team@Once Ecosystem
            </h1>
            <p className="text-base text-white/80 max-w-2xl mx-auto">
              A complete platform connecting developers, clients, and projects worldwide
            </p>
          </motion.div>

          {/* Ecosystem Diagram */}
          <div className="relative w-full max-w-6xl mx-auto h-[600px]">
            {/* Connection Lines */}
            {ecosystemItems.map((_, index) => (
              <motion.div
                key={`line-${index}`}
                initial={{ opacity: 0, pathLength: 0 }}
                animate={{ opacity: 0.3, pathLength: 1 }}
                transition={{ duration: 2, delay: index * 0.1 }}
                className="absolute top-1/2 left-1/2 w-1 bg-gradient-to-t from-transparent via-white to-transparent"
                style={{
                  height: '200px',
                  transformOrigin: 'top center',
                  transform: `rotate(${(360 / ecosystemItems.length) * index}deg)`,
                }}
              />
            ))}

            {/* Center Logo */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20"
            >
              <div className="w-64 h-64 rounded-full bg-white flex items-center justify-center shadow-2xl">
                <div className="text-center">
                  <div className="w-32 h-32 mx-auto mb-4 bg-gradient-to-br from-sky-800 via-sky-700 to-sky-600 rounded-3xl flex items-center justify-center shadow-lg">
                    <Zap className="w-20 h-20 text-white" />
                  </div>
                  <h2 className="text-2xl font-black bg-gradient-to-r from-sky-800 via-sky-700 to-sky-600 bg-clip-text text-transparent">
                    Team@Once
                  </h2>
                </div>
              </div>
            </motion.div>

            {/* Ecosystem Items */}
            {ecosystemItems.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.8 + index * 0.1 }}
                whileHover={{ scale: 1.1, y: -5 }}
                className="absolute z-10"
                style={item.position}
              >
                <Link to="/" className="block">
                  <div className="flex flex-col items-center space-y-3 group">
                    <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all`}>
                      <item.icon className="w-10 h-10 text-white" />
                    </div>
                    <div className="bg-sky-900/80 backdrop-blur-sm rounded-full px-4 py-2">
                      <span className="text-white font-bold text-sm whitespace-nowrap">
                        {item.name}
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Features Grid */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.5 }}
            className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto"
          >
            {[
              {
                title: 'Unified Platform',
                description: 'All tools in one place for seamless collaboration'
              },
              {
                title: 'Global Reach',
                description: 'Connect with talent and clients worldwide'
              },
              {
                title: 'Secure & Reliable',
                description: 'Enterprise-grade security and payment protection'
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                whileHover={{ y: -10 }}
                className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20"
              >
                <h3 className="text-lg font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-sm text-white/70">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 2 }}
            className="text-center mt-20"
          >
            <Link to="/auth/signup">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white text-sky-900 px-8 py-3 rounded-2xl font-black text-base shadow-2xl hover:shadow-white/50 transition-all"
              >
                Join the Ecosystem
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default EcosystemPage;
