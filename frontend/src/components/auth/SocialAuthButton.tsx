/**
 * SocialAuthButton Component
 * Single social authentication button with loading states and animations
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { SocialAuthButtonProps } from '../../types/social-auth';
import { getProviderConfig } from '../../config/social-auth-config';

const SocialAuthButton: React.FC<SocialAuthButtonProps> = ({
  provider,
  mode = 'login',
  userType,
  variant = 'default',
  size = 'md',
  fullWidth = false,
  disabled = false,
  showIcon = true,
  showText = true,
  className = '',
  onError,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const config = getProviderConfig(provider);

  // Handle click - redirect directly to backend OAuth endpoint (like imagitar)
  const handleClick = () => {
    if (disabled || isLoading) return;

    setIsLoading(true);

    // Store userType in localStorage for use after OAuth callback
    if (userType) {
      localStorage.setItem('oauth_signup_role', userType);
    }

    // Get API URL from environment
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

    // Get current frontend URL to pass to backend for correct redirect
    const frontendUrl = encodeURIComponent(window.location.origin);

    // Redirect directly to backend OAuth endpoint
    // Backend will handle database OAuth URL generation and redirect
    switch (provider) {
      case 'github':
        window.location.href = `${apiUrl}/auth/oauth/github?frontendUrl=${frontendUrl}`;
        break;
      case 'google':
        window.location.href = `${apiUrl}/auth/oauth/google?frontendUrl=${frontendUrl}`;
        break;
      default:
        console.error(`${provider} OAuth not yet implemented`);
        setIsLoading(false);
        onError?.(new Error(`${provider} OAuth not yet implemented`));
    }
  };

  // Size classes
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-6 py-4 text-lg',
  };

  // Icon sizes
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  // Variant classes
  const variantClasses = {
    default: `${config.bgColor} border-2 ${config.borderColor} ${config.hoverBorderColor} ${config.textColor}`,
    outline: `bg-transparent border-2 ${config.borderColor} ${config.hoverBorderColor} ${config.textColor}`,
    ghost: `bg-transparent border-none ${config.textColor}`,
  };

  const Icon = config.icon;

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      disabled={disabled || isLoading || !config.enabled}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`
        flex items-center justify-center space-x-2
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${fullWidth ? 'w-full' : ''}
        rounded-xl font-semibold
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
        ${className}
      `}
      aria-label={`Sign ${mode === 'login' ? 'in' : 'up'} with ${config.displayName}`}
      aria-busy={isLoading}
    >
      {/* Loading State */}
      {isLoading ? (
        <>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <Loader2 className={iconSizes[size]} />
          </motion.div>
          {showText && <span>Connecting...</span>}
        </>
      ) : (
        <>
          {/* Icon */}
          {showIcon && (
            <motion.div
              animate={isHovered ? { scale: 1.1 } : { scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <Icon className={iconSizes[size]} />
            </motion.div>
          )}

          {/* Text */}
          {showText && <span>{config.displayName}</span>}
        </>
      )}
    </motion.button>
  );
};

export default SocialAuthButton;
