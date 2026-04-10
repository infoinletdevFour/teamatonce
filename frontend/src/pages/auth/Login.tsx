import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Zap,
  ArrowRight,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import SocialAuthGroup from '../../components/auth/SocialAuthGroup';
import SocialAuthErrorBoundary from '../../components/auth/SocialAuthErrorBoundary';

const Login: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [banMessage, setBanMessage] = useState<string | null>(null);

  // Check for auth error (e.g., banned user) on mount
  useEffect(() => {
    const authError = localStorage.getItem('authError');
    if (authError) {
      setBanMessage(authError);
      localStorage.removeItem('authError');
    }
  }, []);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = t('auth.errors.emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = t('auth.errors.emailInvalid');
    }

    if (!password) {
      newErrors.password = t('auth.errors.passwordRequired');
    } else if (password.length < 6) {
      newErrors.password = t('auth.errors.passwordLength');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);

      // Call real authentication API and get user data
      const user = await login(email, password);

      // Check if user is admin and redirect to admin dashboard
      const userRole = user?.role || (user as any)?.metadata?.role || (user as any)?.app_metadata?.role;
      if (userRole === 'admin' || userRole === 'super_admin') {
        navigate('/admin/dashboard');
        return;
      }

      // Redirect to select company page - ProtectedRoute will handle the rest
      // It will either show company selection or redirect to appropriate dashboard
      navigate('/select-company');

    } catch (error: any) {
      console.error('Login failed:', error);
      setIsLoading(false);

      // Check if user is banned
      const errorMessage = error?.response?.data?.message || error?.message || '';
      if (errorMessage.toLowerCase().includes('banned')) {
        setBanMessage(errorMessage);
      }
    }
  };

  return (
    <>
      <SocialAuthErrorBoundary>
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

        <div className="w-full max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 md:p-10 border border-gray-200 max-w-md mx-auto"
        >
          {/* Logo */}
          <Link to="/" className="flex items-center justify-center mb-8">
            <motion.img
              src="/assets/logo.png"
              alt="Team@Once Logo"
              className="h-12 w-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            />
          </Link>

          <div className="text-center mb-8">
            <motion.h1
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-3xl md:text-4xl font-black text-gray-900 mb-3"
            >
              {t('auth.login.title')}
            </motion.h1>
            <motion.p
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-gray-600 text-base"
            >
              {t('auth.login.subtitle')}
            </motion.p>
          </div>

          {/* Ban Message Banner */}
          {banMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl"
            >
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-red-800">{t('auth.login.accountBanned')}</h3>
                  <p className="text-sm text-red-600 mt-1">{banMessage}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Social Login Buttons */}
          <SocialAuthGroup
            mode="login"
            providers={['google', 'github']}
            onSuccess={(user) => {
              const role = user.role || (user as any)?.metadata?.role || (user as any)?.app_metadata?.role;
              if (role === 'admin' || role === 'super_admin') {
                navigate('/admin/dashboard');
              } else {
                navigate('/select-company');
              }
            }}
            onError={(error) => {
              toast.error('Login Failed', {
                description: error.message
              });
            }}
          />

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                {t('auth.login.email')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full pl-12 pr-4 py-2.5 bg-gray-50 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-700 transition-all ${
                    errors.email ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder={t('auth.login.emailPlaceholder')}
                />
              </div>
              {errors.email && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-sm text-red-600 flex items-center space-x-1"
                >
                  <span>{errors.email}</span>
                </motion.p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                {t('auth.login.password')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full pl-12 pr-12 py-2.5 bg-gray-50 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-700 transition-all ${
                    errors.password ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder={t('auth.login.passwordPlaceholder')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-sm text-red-600 flex items-center space-x-1"
                >
                  <span>{errors.password}</span>
                </motion.p>
              )}
            </div>

            {/* Forgot Password */}
            <div className="flex items-center justify-end">
              <Link
                to="/auth/forgot-password"
                className="text-sm font-semibold text-sky-700 hover:text-sky-800 transition-colors"
              >
                {t('auth.login.forgotPassword')}
              </Link>
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
                  <span>{t('auth.login.signingIn')}</span>
                </>
              ) : (
                <>
                  <span>{t('auth.login.signIn')}</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 text-base">
              {t('auth.login.noAccount')}{' '}
              <Link
                to="/auth/signup"
                className="font-bold text-sky-700 hover:text-sky-800 underline underline-offset-4 transition-all"
              >
                {t('auth.login.signUp')}
              </Link>
            </p>
          </div>

{/* Trust Badge - removed for now */}
        </motion.div>
        </div>
        </div>
      </SocialAuthErrorBoundary>
    </>
  );
};

export default Login;
