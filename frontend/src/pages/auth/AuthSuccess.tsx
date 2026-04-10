import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const AuthSuccess: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const hasProcessed = useRef(false);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    // Prevent multiple executions using a ref
    if (hasProcessed.current) {
      return;
    }

    const handleAuthSuccess = async () => {
      hasProcessed.current = true;
      const token = searchParams.get('token');
      const refreshToken = searchParams.get('refreshToken');

      if (!token || !refreshToken) {
        // No token found, redirect to login
        navigate('/auth/login', { replace: true });
        return;
      }

      // Store tokens
      localStorage.setItem('accessToken', token);
      localStorage.setItem('refreshToken', refreshToken);

      // Dispatch event so AuthContext can pick up the new token
      window.dispatchEvent(new Event('auth-token-stored'));

      try {
        // Small delay to ensure token is available
        await new Promise(resolve => setTimeout(resolve, 200));

        // Try to refresh user data from the API
        try {
          await refreshUser();
        } catch (_userError) {
          // Could not refresh user data, continuing with token data
        }

        // Small delay to ensure state is updated
        await new Promise(resolve => setTimeout(resolve, 300));

        // Redirect to company selection page after successful login
        setTimeout(() => {
          navigate('/select-company', { replace: true });
        }, 1000);
      } catch (error) {
        console.error('Error during auth success flow:', error);
        // Even if there's an error, if we have tokens, redirect to company selection
        setTimeout(() => {
          navigate('/select-company', { replace: true });
        }, 1000);
      } finally {
        setIsProcessing(false);
      }
    };

    handleAuthSuccess();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl text-center space-y-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="flex justify-center"
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="text-2xl font-bold text-white mb-2">{t('auth.authSuccess.title')}</h2>
              <p className="text-gray-300">
                {t('auth.authSuccess.message')}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex justify-center space-x-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthSuccess;
