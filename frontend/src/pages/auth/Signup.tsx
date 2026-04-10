import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Zap,
  ArrowRight,
  CheckCircle2,
  Briefcase,
  Check,
  Users,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { acceptInvitation } from '@/services/invitationService';
import SocialAuthGroup from '../../components/auth/SocialAuthGroup';
import SocialAuthErrorBoundary from '../../components/auth/SocialAuthErrorBoundary';

type UserType = 'client' | 'seller' | null;

const Signup: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [searchParams] = useSearchParams();

  // Get invitation parameters from URL
  const invitationToken = searchParams.get('token');
  const prefilledEmail = searchParams.get('email');

  const [userType, setUserType] = useState<UserType>(invitationToken ? 'seller' : null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: prefilledEmail || '',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isLoading = isSubmitting;

  // Set user type to seller if coming from invitation
  useEffect(() => {
    if (invitationToken) {
      setUserType('seller');
    }
  }, [invitationToken]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!userType) {
      newErrors.userType = t('auth.errors.selectAccountType');
    }

    if (!formData.name.trim()) {
      newErrors.name = t('auth.errors.nameRequired');
    } else if (formData.name.trim().length < 2) {
      newErrors.name = t('auth.errors.nameMin');
    }

    if (!formData.email) {
      newErrors.email = t('auth.errors.emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('auth.errors.emailInvalid');
    }

    if (!formData.password) {
      newErrors.password = t('auth.errors.passwordRequired');
    } else if (formData.password.length < 8) {
      newErrors.password = t('auth.errors.passwordMin8');
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t('auth.errors.confirmPasswordRequired');
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('auth.errors.passwordsMismatch');
    }

    if (!formData.acceptTerms) {
      newErrors.acceptTerms = t('auth.errors.acceptTerms');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!userType) {
      setErrors({ userType: t('auth.errors.selectAccountType') });
      return;
    }

    try {
      setIsSubmitting(true);

      // Call the real signup API through AuthContext
      await signup(
        formData.email,
        formData.password,
        formData.name,
        userType
      );

      // If there's an invitation token, accept the invitation
      if (invitationToken) {
        try {
          await acceptInvitation({ token: invitationToken });
        } catch (inviteError: any) {
          console.error('Failed to accept invitation:', inviteError);
          // Continue even if invitation acceptance fails
        }
      }

      // Navigate to company onboarding - user needs to create/join a company
      navigate('/onboarding/company');
    } catch (error: any) {
      // Error handling is done in AuthContext with toast notifications
      console.error('Signup failed:', error);

      // Optionally set form-level error for display
      if (error?.message) {
        setErrors({ submit: error.message });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
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
          className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 md:p-10 border border-gray-200 max-w-2xl mx-auto"
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
              {invitationToken ? t('auth.signup.invitationTitle') : t('auth.signup.title')}
            </motion.h1>
            <motion.p
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-gray-600 text-base"
            >
              {invitationToken
                ? t('auth.signup.invitationSubtitle')
                : t('auth.signup.subtitle')}
            </motion.p>
          </div>

          {/* Invitation Notice */}
          {invitationToken && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-sky-50 border border-sky-200 rounded-xl flex items-start space-x-3"
            >
              <CheckCircle2 className="w-5 h-5 text-sky-700 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-sky-900">{t('auth.signup.invitationNotice')}</p>
                <p className="text-xs text-sky-700 mt-1">
                  {t('auth.signup.invitationMessage')}
                </p>
              </div>
            </motion.div>
          )}

          {/* User Type Selection */}
          <AnimatePresence mode="wait">
            {!userType ? (
              <motion.div
                key="user-type-selection"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4 mb-8"
              >
                <p className="text-center text-lg font-bold text-gray-800 mb-8">{t('auth.signup.selectType')}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Client Card */}
                  <motion.button
                    whileHover={{ scale: 1.03, y: -8 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setUserType('client')}
                    className="relative p-7 bg-gradient-to-br from-blue-50 via-blue-50 to-blue-100 border-2 border-blue-200 rounded-2xl hover:border-blue-500 hover:shadow-2xl transition-all duration-300 group"
                  >
                    {/* Icon with animated background */}
                    <div className="relative mb-4">
                      <div className="absolute inset-0 bg-blue-400 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
                      <div className="relative w-16 h-16 mx-auto bg-gradient-to-br from-blue-600 to-blue-500 rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                        <Briefcase className="w-8 h-8 text-white" />
                      </div>
                    </div>

                    <h3 className="text-2xl font-black text-gray-900 mb-2">{t('auth.signup.client')}</h3>
                    <p className="text-sm text-gray-600 mb-4 font-medium leading-relaxed">
                      {t('auth.signup.clientDescription')}
                    </p>
                    <div className="space-y-2.5">
                      {[t('auth.signup.clientFeatures.feature1'), t('auth.signup.clientFeatures.feature2'), t('auth.signup.clientFeatures.feature3')].map((feature, idx) => (
                        <div key={idx} className="flex items-start space-x-2.5 text-sm text-gray-700">
                          <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </motion.button>

                  {/* Seller Card */}
                  <motion.button
                    whileHover={{ scale: 1.03, y: -8 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setUserType('seller')}
                    className="relative p-7 bg-gradient-to-br from-emerald-50 via-emerald-50 to-emerald-100 border-2 border-emerald-200 rounded-2xl hover:border-emerald-500 hover:shadow-2xl transition-all duration-300 group"
                  >
                    {/* Icon with animated background */}
                    <div className="relative mb-4">
                      <div className="absolute inset-0 bg-emerald-400 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
                      <div className="relative w-16 h-16 mx-auto bg-gradient-to-br from-emerald-600 to-emerald-500 rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                        <Users className="w-8 h-8 text-white" />
                      </div>
                    </div>

                    <h3 className="text-2xl font-black text-gray-900 mb-2">{t('auth.signup.seller')}</h3>
                    <p className="text-sm text-gray-600 mb-4 font-medium leading-relaxed">
                      {t('auth.signup.sellerDescription')}
                    </p>
                    <div className="space-y-2.5">
                      {[t('auth.signup.sellerFeatures.feature1'), t('auth.signup.sellerFeatures.feature2'), t('auth.signup.sellerFeatures.feature3')].map((feature, idx) => (
                        <div key={idx} className="flex items-start space-x-2.5 text-sm text-gray-700">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </motion.button>
                </div>
                {errors.userType && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-red-600 text-center"
                  >
                    {errors.userType}
                  </motion.p>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="signup-form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {/* Selected User Type Badge */}
                <div className="flex items-center justify-center mb-8">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`inline-flex items-center space-x-3 px-6 py-3 rounded-full shadow-lg ${
                      userType === 'client'
                        ? 'bg-gradient-to-r from-blue-50 via-blue-100 to-blue-50 text-blue-800 border-2 border-blue-300'
                        : 'bg-gradient-to-r from-emerald-50 via-emerald-100 to-emerald-50 text-emerald-800 border-2 border-emerald-300'
                    }`}
                  >
                    {userType === 'client' ? (
                      <Briefcase className="w-5 h-5" />
                    ) : (
                      <Users className="w-5 h-5" />
                    )}
                    <span className="font-bold text-base">{userType === 'client' ? t('auth.signup.client') : t('auth.signup.seller')} {t('auth.signup.accountType')}</span>
                    <button
                      onClick={() => setUserType(null)}
                      className="ml-2 text-sm underline hover:no-underline transition-all font-semibold"
                      type="button"
                    >
                      {t('auth.signup.change')}
                    </button>
                  </motion.div>
                </div>

                {/* Social Signup Buttons */}
                <SocialAuthGroup
                  mode="signup"
                  userType={userType || undefined}
                  providers={['google', 'github']}
                  onSuccess={() => {
                    navigate('/onboarding/company');
                  }}
                  onError={(error) => {
                    toast.error('Signup Failed', {
                      description: error.message
                    });
                  }}
                />

                {/* Signup Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Name Field */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                      {t('auth.signup.fullName')}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <User className="w-5 h-5 text-gray-400" />
                      </div>
                      <input
                        id="name"
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className={`w-full pl-12 pr-4 py-2.5 bg-gray-50 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-700 transition-all ${
                          errors.name ? 'border-red-500' : 'border-gray-200'
                        }`}
                        placeholder={t('auth.signup.fullNamePlaceholder')}
                      />
                    </div>
                    {errors.name && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-2 text-sm text-red-600"
                      >
                        {errors.name}
                      </motion.p>
                    )}
                  </div>

                  {/* Email Field */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                      {t('auth.signup.email')}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail className="w-5 h-5 text-gray-400" />
                      </div>
                      <input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        disabled={!!invitationToken}
                        className={`w-full pl-12 pr-4 py-2.5 bg-gray-50 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-700 transition-all ${
                          errors.email ? 'border-red-500' : 'border-gray-200'
                        } ${invitationToken ? 'opacity-60 cursor-not-allowed' : ''}`}
                        placeholder={t('auth.signup.emailPlaceholder')}
                      />
                    </div>
                    {errors.email && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-2 text-sm text-red-600"
                      >
                        {errors.email}
                      </motion.p>
                    )}
                  </div>

                  {/* Password Field */}
                  <div>
                    <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                      {t('auth.signup.password')}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="w-5 h-5 text-gray-400" />
                      </div>
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        className={`w-full pl-12 pr-12 py-2.5 bg-gray-50 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-700 transition-all ${
                          errors.password ? 'border-red-500' : 'border-gray-200'
                        }`}
                        placeholder={t('auth.signup.passwordPlaceholder')}
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
                        className="mt-2 text-sm text-red-600"
                      >
                        {errors.password}
                      </motion.p>
                    )}
                  </div>

                  {/* Confirm Password Field */}
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                      {t('auth.signup.confirmPassword')}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="w-5 h-5 text-gray-400" />
                      </div>
                      <input
                        id="confirmPassword"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        className={`w-full pl-12 pr-4 py-2.5 bg-gray-50 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-700 transition-all ${
                          errors.confirmPassword ? 'border-red-500' : 'border-gray-200'
                        }`}
                        placeholder={t('auth.signup.confirmPasswordPlaceholder')}
                      />
                    </div>
                    {errors.confirmPassword && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-2 text-sm text-red-600"
                      >
                        {errors.confirmPassword}
                      </motion.p>
                    )}
                  </div>

                  {/* Terms Acceptance */}
                  <div>
                    <label className="flex items-start space-x-3 cursor-pointer group">
                      <div className="relative flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.acceptTerms}
                          onChange={(e) => handleInputChange('acceptTerms', e.target.checked)}
                          className="w-5 h-5 rounded border-gray-300 text-sky-700 focus:ring-sky-700 cursor-pointer"
                        />
                        {formData.acceptTerms && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute inset-0 flex items-center justify-center pointer-events-none"
                          >
                            <Check className="w-4 h-4 text-white" />
                          </motion.div>
                        )}
                      </div>
                      <span className="text-sm text-gray-700 leading-tight">
                        {t('auth.signup.termsAgreement')}{' '}
                        <a href="#" className="font-semibold text-sky-700 hover:text-sky-800 underline">
                          {t('auth.signup.termsOfService')}
                        </a>{' '}
                        {t('auth.signup.and')}{' '}
                        <a href="#" className="font-semibold text-sky-700 hover:text-sky-800 underline">
                          {t('auth.signup.privacyPolicy')}
                        </a>
                      </span>
                    </label>
                    {errors.acceptTerms && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-2 text-sm text-red-600"
                      >
                        {errors.acceptTerms}
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
                        <span>{t('auth.signup.creatingAccount')}</span>
                      </>
                    ) : (
                      <>
                        <span>{t('auth.signup.createAccount')}</span>
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </motion.button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sign In Link */}
          <div className="mt-8 text-center">
            <p className="text-gray-600 text-base">
              {t('auth.signup.haveAccount')}{' '}
              <Link
                to="/auth/login"
                className="font-bold text-sky-700 hover:text-sky-800 underline underline-offset-4 transition-all"
              >
                {t('auth.signup.signIn')}
              </Link>
            </p>
          </div>

          {/* Trust Badge */}
{/* User count badge - removed for now */}
        </motion.div>
        </div>
        </div>
      </SocialAuthErrorBoundary>
    </>
  );
};

export default Signup;
