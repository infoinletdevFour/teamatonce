/**
 * RoleSelectionModal Component
 * Shown to first-time social auth users to select their role (client or seller)
 * Similar to Fiverr's onboarding modal
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Briefcase, Users, Check } from 'lucide-react';

interface RoleSelectionModalProps {
  isOpen: boolean;
  userName?: string;
  onSelectRole: (role: 'client' | 'seller') => void;
  onClose?: () => void;
  isLoading?: boolean;
}

const RoleSelectionModal: React.FC<RoleSelectionModalProps> = ({
  isOpen,
  userName,
  onSelectRole,
  onClose,
  isLoading = false,
}) => {
  const [selectedRole, setSelectedRole] = useState<'client' | 'seller' | null>(null);

  const handleRoleSelect = (role: 'client' | 'seller') => {
    setSelectedRole(role);
  };

  const handleNext = () => {
    if (selectedRole) {
      onSelectRole(selectedRole);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full p-8 md:p-12 relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button (optional) */}
              {onClose && (
                <button
                  onClick={onClose}
                  className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={isLoading}
                >
                  <X className="w-6 h-6" />
                </button>
              )}

              {/* Header */}
              <div className="text-center mb-10">
                <motion.h2
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-3xl md:text-4xl font-black text-gray-900 mb-3"
                >
                  {userName ? `${userName}, your account has been created!` : 'Welcome!'}
                </motion.h2>
                <motion.p
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-lg text-gray-600"
                >
                  What brings you to Team@Once?
                </motion.p>
                <motion.p
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-sm text-gray-500 mt-2"
                >
                  We'll tailor your experience to fit your needs.
                </motion.p>
              </div>

              {/* Role Selection Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Client Card */}
                <motion.button
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  onClick={() => handleRoleSelect('client')}
                  disabled={isLoading}
                  className={`relative p-8 rounded-2xl border-3 transition-all duration-300 text-left ${
                    selectedRole === 'client'
                      ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-200'
                      : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
                  }`}
                >
                  {/* Checkbox */}
                  <div className="absolute top-6 right-6">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        selectedRole === 'client'
                          ? 'bg-blue-500 border-blue-500'
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      {selectedRole === 'client' && (
                        <Check className="w-4 h-4 text-white" />
                      )}
                    </div>
                  </div>

                  {/* Icon */}
                  <div className="mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <Briefcase className="w-8 h-8 text-white" />
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    I am a client
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    I'm looking to hire talented professionals to bring my projects to life.
                  </p>
                </motion.button>

                {/* Seller Card */}
                <motion.button
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  onClick={() => handleRoleSelect('seller')}
                  disabled={isLoading}
                  className={`relative p-8 rounded-2xl border-3 transition-all duration-300 text-left ${
                    selectedRole === 'seller'
                      ? 'border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-200'
                      : 'border-gray-200 bg-white hover:border-emerald-300 hover:shadow-md'
                  }`}
                >
                  {/* Checkbox */}
                  <div className="absolute top-6 right-6">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        selectedRole === 'seller'
                          ? 'bg-emerald-500 border-emerald-500'
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      {selectedRole === 'seller' && (
                        <Check className="w-4 h-4 text-white" />
                      )}
                    </div>
                  </div>

                  {/* Icon */}
                  <div className="mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <Users className="w-8 h-8 text-white" />
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    I'm a seller
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    I'm here to offer my skills and services to clients around the world.
                  </p>
                </motion.button>
              </div>

              {/* Next Button */}
              <motion.button
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                onClick={handleNext}
                disabled={!selectedRole || isLoading}
                className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all ${
                  selectedRole && !isLoading
                    ? 'bg-gradient-to-r from-sky-800 via-sky-700 to-sky-600 text-white shadow-lg hover:shadow-xl hover:scale-[1.02]'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-6 h-6 border-3 border-white border-t-transparent rounded-full"
                    />
                    <span>Setting up your account...</span>
                  </div>
                ) : (
                  'Next'
                )}
              </motion.button>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default RoleSelectionModal;
