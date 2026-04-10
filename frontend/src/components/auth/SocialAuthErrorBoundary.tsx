/**
 * SocialAuthErrorBoundary Component
 * Error boundary for OAuth flows with user-friendly error messages
 */

import React, { Component, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, RefreshCw, Mail } from 'lucide-react';
import { SocialAuthErrorCode } from '../../types/social-auth';
import { getSocialAuthErrorMessage } from '../../config/social-auth-config';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class SocialAuthErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Social Auth Error Boundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  getErrorDetails(error: Error): {
    title: string;
    message: string;
    code: string;
  } {
    const errorMessage = error.message.toLowerCase();

    // Access denied - user cancelled
    if (errorMessage.includes('access_denied') || errorMessage.includes('cancelled')) {
      return {
        title: 'Authentication Cancelled',
        message: getSocialAuthErrorMessage(SocialAuthErrorCode.ACCESS_DENIED),
        code: SocialAuthErrorCode.ACCESS_DENIED,
      };
    }

    // Invalid state - CSRF protection
    if (errorMessage.includes('state') || errorMessage.includes('csrf')) {
      return {
        title: 'Invalid Request',
        message: getSocialAuthErrorMessage(SocialAuthErrorCode.INVALID_STATE),
        code: SocialAuthErrorCode.INVALID_STATE,
      };
    }

    // Email already exists
    if (errorMessage.includes('email') || errorMessage.includes('exists')) {
      return {
        title: 'Account Exists',
        message: getSocialAuthErrorMessage(SocialAuthErrorCode.EMAIL_ALREADY_EXISTS),
        code: SocialAuthErrorCode.EMAIL_ALREADY_EXISTS,
      };
    }

    // Network error
    if (errorMessage.includes('network') || errorMessage.includes('connection')) {
      return {
        title: 'Connection Issue',
        message: getSocialAuthErrorMessage(SocialAuthErrorCode.NETWORK_ERROR),
        code: SocialAuthErrorCode.NETWORK_ERROR,
      };
    }

    // Invalid code
    if (errorMessage.includes('code') || errorMessage.includes('invalid')) {
      return {
        title: 'Invalid Code',
        message: getSocialAuthErrorMessage(SocialAuthErrorCode.INVALID_CODE),
        code: SocialAuthErrorCode.INVALID_CODE,
      };
    }

    // Provider error
    if (errorMessage.includes('provider')) {
      return {
        title: 'Provider Error',
        message: getSocialAuthErrorMessage(SocialAuthErrorCode.PROVIDER_ERROR),
        code: SocialAuthErrorCode.PROVIDER_ERROR,
      };
    }

    // Unknown error
    return {
      title: 'Authentication Error',
      message: getSocialAuthErrorMessage(SocialAuthErrorCode.UNKNOWN_ERROR),
      code: SocialAuthErrorCode.UNKNOWN_ERROR,
    };
  }

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset);
      }

      // Default error UI
      const errorDetails = this.getErrorDetails(this.state.error);

      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 md:p-12 border border-gray-200 max-w-md w-full text-center"
          >
            {/* Error Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center"
            >
              <AlertCircle className="w-10 h-10 text-red-600" />
            </motion.div>

            {/* Error Message */}
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {errorDetails.title}
            </h2>
            <p className="text-gray-600 mb-8">{errorDetails.message}</p>

            {/* Actions */}
            <div className="space-y-3">
              {/* Try Again Button */}
              <button
                onClick={this.handleReset}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-shadow flex items-center justify-center space-x-2"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Try Again</span>
              </button>

              {/* Use Email Instead */}
              {errorDetails.code !== SocialAuthErrorCode.EMAIL_ALREADY_EXISTS && (
                <a
                  href="/auth/login"
                  className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2 block"
                >
                  <Mail className="w-5 h-5" />
                  <span>Use Email Instead</span>
                </a>
              )}

              {/* Link Account (for email exists error) */}
              {errorDetails.code === SocialAuthErrorCode.EMAIL_ALREADY_EXISTS && (
                <a
                  href="/auth/login"
                  className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2 block"
                >
                  <Mail className="w-5 h-5" />
                  <span>Sign In to Link Account</span>
                </a>
              )}
            </div>

            {/* Help Text */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Need help?{' '}
                <a
                  href="/help"
                  className="font-semibold text-blue-600 hover:text-blue-700 underline"
                >
                  Contact Support
                </a>
              </p>
            </div>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default SocialAuthErrorBoundary;
