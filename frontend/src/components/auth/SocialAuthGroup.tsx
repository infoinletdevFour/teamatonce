/**
 * SocialAuthGroup Component
 * Group of social authentication buttons with divider
 */

import React from 'react';
import { motion } from 'framer-motion';
import { SocialAuthGroupProps, SocialProvider } from '../../types/social-auth';
import { getEnabledProviders } from '../../config/social-auth-config';
import SocialAuthButton from './SocialAuthButton';

const SocialAuthGroup: React.FC<SocialAuthGroupProps> = ({
  mode,
  userType,
  providers,
  orientation = 'horizontal',
  dividerText = 'Or continue with email',
  showDivider = true,
  className = '',
  onSuccess,
  onError,
}) => {
  // Get enabled providers
  const enabledProviders = getEnabledProviders();

  // Filter providers if specific ones are requested
  const availableProviders = providers
    ? enabledProviders.filter((config) => providers.includes(config.id))
    : enabledProviders;

  // If no providers are enabled, don't render anything
  if (availableProviders.length === 0) {
    return null;
  }

  // Layout classes
  const layoutClasses = {
    horizontal: 'grid grid-cols-2 gap-4',
    vertical: 'flex flex-col space-y-3',
  };

  return (
    <div className={className}>
      {/* Social Auth Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={layoutClasses[orientation]}
      >
        {availableProviders.map((config, index) => (
          <motion.div
            key={config.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
          >
            <SocialAuthButton
              provider={config.id as SocialProvider}
              mode={mode}
              userType={userType}
              fullWidth
              onSuccess={onSuccess}
              onError={onError}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Divider */}
      {showDivider && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          className="relative my-6"
        >
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500 font-medium">
              {dividerText}
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default SocialAuthGroup;
