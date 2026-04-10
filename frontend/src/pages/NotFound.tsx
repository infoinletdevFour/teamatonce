import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Search, ArrowLeft, AlertTriangle, Compass } from 'lucide-react';

/**
 * NotFound Component
 * 404 Error Page with gradient background and navigation options
 * Features:
 * - Animated 404 illustration
 * - Multiple navigation options
 * - Gradient background matching landing page
 * - Responsive design
 */

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Animated Background Gradient Orbs */}
      <div className="absolute inset-0 -z-10">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute top-0 left-1/4 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [90, 0, 90],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute top-0 right-1/4 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30"
        />
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, -90, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30"
        />
      </div>

      <div className="max-w-4xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          {/* 404 Illustration */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mb-8"
          >
            <div className="relative inline-block">
              {/* Large 404 Text */}
              <h1 className="text-[180px] md:text-[240px] font-black leading-none bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent select-none">
                404
              </h1>

              {/* Floating Icons */}
              <motion.div
                animate={{
                  y: [0, -20, 0],
                }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute top-1/4 -left-12 md:-left-20"
              >
                <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-2xl shadow-2xl flex items-center justify-center">
                  <Search className="w-8 h-8 md:w-10 md:h-10 text-blue-600" />
                </div>
              </motion.div>

              <motion.div
                animate={{
                  y: [0, -15, 0],
                }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                className="absolute top-1/4 -right-12 md:-right-20"
              >
                <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-2xl shadow-2xl flex items-center justify-center">
                  <Compass className="w-8 h-8 md:w-10 md:h-10 text-purple-600" />
                </div>
              </motion.div>

              <motion.div
                animate={{
                  y: [0, -10, 0],
                }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                className="absolute bottom-1/4 left-1/2 -translate-x-1/2"
              >
                <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-2xl shadow-2xl flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 md:w-10 md:h-10 text-pink-600" />
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Error Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mb-8"
          >
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
              Oops! Page Not Found
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              The page you're looking for seems to have wandered off into the digital void.
              Don't worry, we'll help you find your way back!
            </p>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            {/* Back to Home */}
            <Link to="/">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-2xl font-bold text-lg flex items-center space-x-3 shadow-2xl"
              >
                <Home className="w-6 h-6" />
                <span>Back to Home</span>
              </motion.button>
            </Link>

            {/* Go Back */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.history.back()}
              className="border-3 border-gray-300 bg-white/80 backdrop-blur-sm text-gray-900 px-8 py-4 rounded-2xl font-bold text-lg flex items-center space-x-3 shadow-xl"
            >
              <ArrowLeft className="w-6 h-6" />
              <span>Go Back</span>
            </motion.button>
          </motion.div>

          {/* Helpful Links */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="mt-12"
          >
            <p className="text-sm text-gray-600 mb-4">You might want to check out:</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                to="/client/dashboard"
                className="text-blue-600 hover:text-purple-600 font-semibold text-sm transition-colors"
              >
                Client Dashboard
              </Link>
              <span className="text-gray-400">•</span>
              <Link
                to="/developer/dashboard"
                className="text-blue-600 hover:text-purple-600 font-semibold text-sm transition-colors"
              >
                Developer Dashboard
              </Link>
              <span className="text-gray-400">•</span>
              <Link
                to="/auth/login"
                className="text-blue-600 hover:text-purple-600 font-semibold text-sm transition-colors"
              >
                Login
              </Link>
              <span className="text-gray-400">•</span>
              <Link
                to="/help"
                className="text-blue-600 hover:text-purple-600 font-semibold text-sm transition-colors"
              >
                Help Center
              </Link>
            </div>
          </motion.div>

          {/* Error Code */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.6 }}
            className="mt-12 text-xs text-gray-400"
          >
            <p>Error Code: 404 - Resource Not Found</p>
            <p className="mt-1">
              If you believe this is a mistake, please{' '}
              <a href="mailto:support@teamatonce.com" className="text-blue-600 hover:underline">
                contact support
              </a>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFound;
