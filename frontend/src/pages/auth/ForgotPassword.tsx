import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Mail,
  Zap,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Send
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const ForgotPassword: React.FC = () => {
  const { t } = useTranslation();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validateEmail = (email: string) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError(t('auth.errors.emailRequired'));
      return;
    }

    if (!validateEmail(email)) {
      setError(t('auth.errors.validEmail'));
      return;
    }

    try {
      setIsLoading(true);
      await resetPassword(email);
      setIsSuccess(true);
    } catch (err: any) {
      // Error is handled by AuthContext with toast
      // Only set local error if needed for UI display
      setError(err?.message || 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-sky-100 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Animated Background Blobs */}
        <div className="absolute inset-0 -z-10">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute top-0 left-1/4 w-96 h-96 bg-sky-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [90, 0, 90],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute top-0 right-1/4 w-96 h-96 bg-sky-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30"
        />
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, -90, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute bottom-0 left-1/2 w-96 h-96 bg-sky-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30"
        />
        </div>

        <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-6 md:p-8 border border-gray-200"
        >
          {/* Logo */}
          <Link to="/" className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-sky-800 via-sky-700 to-sky-600 rounded-2xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-black bg-gradient-to-r from-sky-800 via-sky-700 to-sky-600 bg-clip-text text-transparent">
              Team@Once
            </span>
          </Link>

          {!isSuccess ? (
            <>
              {/* Header */}
              <div className="text-center mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center"
                >
                  <Send className="w-10 h-10 text-sky-700" />
                </motion.div>
                <h2 className="text-xl font-black text-gray-900 mb-2">{t('auth.forgotPassword.title')}</h2>
                <p className="text-gray-600">
                  {t('auth.forgotPassword.subtitle')}
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('auth.forgotPassword.email')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError('');
                      }}
                      className={`w-full pl-12 pr-4 py-2.5 bg-gray-50 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-700 transition-all ${
                        error ? 'border-red-500' : 'border-gray-200'
                      }`}
                      placeholder={t('auth.forgotPassword.emailPlaceholder')}
                      autoFocus
                    />
                  </div>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2 text-sm text-red-600"
                    >
                      {error}
                    </motion.p>
                  )}
                </div>

                {/* Submit Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-sky-800 via-sky-700 to-sky-600 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-sky-500/30 hover:shadow-xl hover:shadow-sky-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-6 h-6 border-3 border-white border-t-transparent rounded-full"
                      />
                      <span>{t('auth.forgotPassword.sending')}</span>
                    </>
                  ) : (
                    <>
                      <span>{t('auth.forgotPassword.sendResetLink')}</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </motion.button>
              </form>

              {/* Back to Login Link */}
              <div className="mt-6">
                <Link
                  to="/auth/login"
                  className="flex items-center justify-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors group"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  <span className="font-semibold">{t('auth.forgotPassword.backToSignIn')}</span>
                </Link>
              </div>
            </>
          ) : (
            /* Success State */
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center"
              >
                <CheckCircle2 className="w-12 h-12 text-green-600" />
              </motion.div>

              <h2 className="text-xl font-black text-gray-900 mb-3">{t('auth.forgotPassword.checkEmail')}</h2>

              <p className="text-gray-600 mb-2">
                {t('auth.forgotPassword.emailSentTo')}
              </p>

              <p className="text-lg font-bold text-gray-900 mb-6">
                {email}
              </p>

              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
                <p className="text-sm text-gray-700 leading-relaxed">
                  {t('auth.forgotPassword.didntReceive')}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setIsSuccess(false);
                    setEmail('');
                  }}
                  className="w-full bg-gradient-to-r from-sky-800 via-sky-700 to-sky-600 text-white py-3 rounded-xl font-bold flex items-center justify-center space-x-2 shadow-lg shadow-sky-500/30"
                >
                  <Send className="w-5 h-5" />
                  <span>{t('auth.forgotPassword.resendEmail')}</span>
                </motion.button>

                <Link
                  to="/auth/login"
                  className="block w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                >
                  {t('auth.forgotPassword.backToSignIn')}
                </Link>
              </div>
            </motion.div>
          )}

          {/* Help Text */}
          {!isSuccess && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-200"
            >
              <p className="text-sm text-gray-600 text-center">
                <span className="font-semibold text-gray-900">{t('auth.forgotPassword.needHelp')}</span> {t('auth.forgotPassword.contactSupport')}{' '}
                <a href="mailto:support@teamatonce.com" className="text-sky-700 hover:text-sky-800 underline font-semibold">
                  support@teamatonce.com
                </a>
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* Trust Badge */}
        {!isSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-6 text-center"
          >
            <div className="inline-flex items-center space-x-2 bg-white/50 backdrop-blur-sm rounded-full px-6 py-3 border border-gray-200">
              <Sparkles className="w-4 h-4 text-sky-700" />
              <span className="text-sm text-gray-600">
                {t('auth.forgotPassword.dataSecure')} <span className="font-bold text-gray-900">{t('auth.forgotPassword.secure')}</span> {t('auth.forgotPassword.withUs')}
              </span>
            </div>
          </motion.div>
        )}
        </div>
      </div>
    </>
  );
};

export default ForgotPassword;
