import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  Building2,
  Users,
  User,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Briefcase,
  Building,
  Mail,
  Globe,
  Loader2,
  Check,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCompanyStore } from '../../stores/companyStore';
import { createCompany } from '../../services/companyService';
import { AccountType, BusinessType, CompanySize } from '../../types/company';

// ============================================================================
// Type Definitions
// ============================================================================

interface CompanyFormData {
  account_type: AccountType;
  display_name: string;
  company_name?: string;
  business_type?: BusinessType;
  company_size?: CompanySize;
  business_email?: string;
  website?: string;
}

type Step = 0 | 1 | 2 | 3;

// ============================================================================
// Account Type Card Data
// ============================================================================

const ACCOUNT_TYPES = [
  {
    type: AccountType.SOLO,
    icon: User,
    title: 'Solo',
    description: 'Perfect for individual professionals',
    details: 'Work independently on projects',
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'from-blue-50 to-cyan-50',
    borderColor: 'border-blue-200 hover:border-blue-400',
  },
  {
    type: AccountType.TEAM,
    icon: Users,
    title: 'Team',
    description: 'For small teams (2-10 members)',
    details: 'Collaborate with your team',
    color: 'from-purple-500 to-pink-500',
    bgColor: 'from-purple-50 to-pink-50',
    borderColor: 'border-purple-200 hover:border-purple-400',
  },
  {
    type: AccountType.COMPANY,
    icon: Building2,
    title: 'Company',
    description: 'For larger organizations (11+ members)',
    details: 'Enterprise-grade features',
    color: 'from-orange-500 to-red-500',
    bgColor: 'from-orange-50 to-red-50',
    borderColor: 'border-orange-200 hover:border-orange-400',
  },
];

// ============================================================================
// Main Component
// ============================================================================

const CompanyOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, refreshUser } = useAuth();
  const { setCurrentCompany, fetchUserCompanies } = useCompanyStore();

  // Check if user needs role selection (from social auth)
  const needsRole = searchParams.get('needsRole') === 'true';
  const [selectedRole, setSelectedRole] = useState<'client' | 'seller' | null>(null);
  const [isCompletingRole, setIsCompletingRole] = useState(false);

  const [currentStep, setCurrentStep] = useState<Step>(needsRole ? 0 : 1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<CompanyFormData>({
    defaultValues: {
      account_type: AccountType.SOLO,
      display_name: '',
      company_name: '',
      business_type: BusinessType.INDIVIDUAL,
      company_size: CompanySize.SOLO,
      business_email: user?.email || '',
      website: '',
    },
  });

  const watchedAccountType = watch('account_type');
  const isSolo = watchedAccountType === AccountType.SOLO;

  // ============================================================================
  // Role Selection (for social auth users)
  // ============================================================================

  const handleRoleSelection = async (role: 'client' | 'seller') => {
    try {
      setIsCompletingRole(true);

      const pendingUserId = localStorage.getItem('pendingUserId');
      if (!pendingUserId) {
        throw new Error('User ID not found');
      }

      // Call backend to complete social signup
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';
      const response = await fetch(`${apiUrl}/auth/complete-social-signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: pendingUserId,
          role: role,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to set role');
      }

      const data = await response.json();

      // Store tokens
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);

      // Clear pending data
      localStorage.removeItem('tempToken');
      localStorage.removeItem('pendingUserId');
      localStorage.removeItem('pendingUserEmail');
      localStorage.removeItem('pendingUserName');
      localStorage.removeItem('pendingUserAvatar');

      // Refresh user data
      await refreshUser();

      // Show success message
      toast.success('Role Selected!', {
        description: `You're all set as a ${role}. Let's set up your company.`,
      });

      // Move to next step (account type selection)
      setCurrentStep(1);
    } catch (error: any) {
      console.error('Failed to set role:', error);
      toast.error('Failed to Set Role', {
        description: error.message || 'Please try again.',
      });
    } finally {
      setIsCompletingRole(false);
    }
  };

  // ============================================================================
  // Step Navigation
  // ============================================================================

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep((prev) => (prev + 1) as Step);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step);
    }
  };

  const handleAccountTypeSelect = (type: AccountType) => {
    setValue('account_type', type);

    // Set default company size based on account type
    if (type === AccountType.SOLO) {
      setValue('company_size', CompanySize.SOLO);
      setValue('business_type', BusinessType.INDIVIDUAL);
    } else if (type === AccountType.TEAM) {
      setValue('company_size', CompanySize.SMALL);
    } else if (type === AccountType.COMPANY) {
      setValue('company_size', CompanySize.MEDIUM);
    }

    handleNext();
  };

  // ============================================================================
  // Form Submission
  // ============================================================================

  const onSubmit = async (data: CompanyFormData) => {
    try {
      setIsSubmitting(true);

      // Prepare company data
      const companyData: any = {
        account_type: data.account_type,
        display_name: data.display_name,
        company_name: isSolo ? data.display_name : data.company_name,
        business_type: data.business_type,
        company_size: data.company_size,
        business_email: data.business_email,
      };

      // Only include website if it's not empty
      if (data.website && data.website.trim() !== '') {
        companyData.website = data.website;
      }

      // Create company
      const company = await createCompany(companyData);

      // Update Zustand store with new company
      setCurrentCompany(company);

      // Fetch all companies to update the store
      await fetchUserCompanies();

      // Refresh user to update company info
      await refreshUser();

      // Show success message
      toast.success('Company Created!', {
        description: `${company.display_name} is ready to go!`,
      });

      // Determine section based on user role
      console.log('User role:', user?.role);
      console.log('User object:', user);
      const section = user?.role === 'developer' ? 'developer' : 'client';
      console.log('Navigating to section:', section);

      // Navigate to company-scoped dashboard
      navigate(`/company/${company.id}/${section}/dashboard`);
    } catch (error: any) {
      console.error('Company creation failed:', error);
      toast.error('Failed to Create Company', {
        description: error?.message || 'Please try again later',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================================
  // Progress Indicator
  // ============================================================================

  const ProgressIndicator = () => {
    const steps = needsRole ? [0, 1, 2, 3] : [1, 2, 3];
    return (
      <div className="flex items-center justify-center space-x-2 mb-8">
        {steps.map((step, index) => (
          <React.Fragment key={step}>
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm transition-all ${
                currentStep >= step
                  ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {currentStep > step ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                index + 1
              )}
            </div>
            {index < steps.length - 1 && (
              <div
                className={`w-12 h-1 rounded-full transition-all ${
                  currentStep > step ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-gray-200'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  // ============================================================================
  // Step 0: Role Selection (for social auth users)
  // ============================================================================

  const Step0Content = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">
          Welcome to Team@Once!
        </h2>
        <p className="text-lg text-gray-600">
          What brings you to Team@Once?
        </p>
        <p className="text-sm text-gray-500 mt-2">
          We'll tailor your experience to fit your needs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Client Card */}
        <button
          type="button"
          onClick={() => setSelectedRole('client')}
          disabled={isCompletingRole}
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
        </button>

        {/* Seller Card */}
        <button
          type="button"
          onClick={() => setSelectedRole('seller')}
          disabled={isCompletingRole}
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
        </button>
      </div>

      {/* Next Button */}
      <div className="flex justify-center mt-8">
        <button
          type="button"
          onClick={() => selectedRole && handleRoleSelection(selectedRole)}
          disabled={!selectedRole || isCompletingRole}
          className={`px-8 py-4 rounded-xl font-bold text-lg transition-all ${
            selectedRole && !isCompletingRole
              ? 'bg-gradient-to-r from-sky-800 via-sky-700 to-sky-600 text-white shadow-lg hover:shadow-xl hover:scale-[1.02]'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isCompletingRole ? (
            <div className="flex items-center space-x-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Setting up your account...</span>
            </div>
          ) : (
            'Continue'
          )}
        </button>
      </div>
    </motion.div>
  );

  // ============================================================================
  // Step 1: Account Type Selection
  // ============================================================================

  const Step1Content = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-black text-gray-900 mb-2">
          Choose Your Account Type
        </h2>
        <p className="text-gray-600">
          Select the option that best fits your needs
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ACCOUNT_TYPES.map((account) => {
          const Icon = account.icon;
          return (
            <button
              key={account.type}
              type="button"
              onClick={() => handleAccountTypeSelect(account.type)}
              className={`relative p-6 bg-gradient-to-br ${account.bgColor} border-2 ${account.borderColor} rounded-2xl transition-all duration-200 group hover:scale-[1.02] hover:-translate-y-1 active:scale-[0.98]`}
            >
              <div className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-br ${account.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                <Icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2">
                {account.title}
              </h3>
              <p className="text-sm text-gray-600 mb-2">
                {account.description}
              </p>
              <p className="text-xs text-gray-500">
                {account.details}
              </p>
            </button>
          );
        })}
      </div>
    </motion.div>
  );

  // ============================================================================
  // Step 2: Basic Information
  // ============================================================================

  const Step2Content = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-black text-gray-900 mb-2">
          {isSolo ? 'Tell Us About Yourself' : 'Company Information'}
        </h2>
        <p className="text-gray-600">
          {isSolo ? 'Set up your professional profile' : 'Provide your company details'}
        </p>
      </div>

      <div className="space-y-5">
        {/* Display Name */}
        <div>
          <label htmlFor="display_name" className="block text-sm font-semibold text-gray-700 mb-2">
            {isSolo ? 'Your Name' : 'Display Name'} *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <User className="w-5 h-5 text-gray-400" />
            </div>
            <input
              {...register('display_name', {
                required: 'Display name is required',
                minLength: { value: 2, message: 'Name must be at least 2 characters' },
              })}
              type="text"
              id="display_name"
              className={`w-full pl-12 pr-4 py-3 bg-gray-50 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                errors.display_name ? 'border-red-500' : 'border-gray-200'
              }`}
              placeholder={isSolo ? 'John Doe' : 'Acme Inc.'}
            />
          </div>
          {errors.display_name && (
            <p className="mt-2 text-sm text-red-600">{errors.display_name.message}</p>
          )}
        </div>

        {/* Company Name (only for TEAM/COMPANY) */}
        {!isSolo && (
          <div>
            <label htmlFor="company_name" className="block text-sm font-semibold text-gray-700 mb-2">
              Legal Company Name *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Building className="w-5 h-5 text-gray-400" />
              </div>
              <input
                {...register('company_name', {
                  required: !isSolo ? 'Company name is required' : false,
                })}
                type="text"
                id="company_name"
                className={`w-full pl-12 pr-4 py-3 bg-gray-50 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.company_name ? 'border-red-500' : 'border-gray-200'
                }`}
                placeholder="Acme Corporation LLC"
              />
            </div>
            {errors.company_name && (
              <p className="mt-2 text-sm text-red-600">{errors.company_name.message}</p>
            )}
          </div>
        )}

        {/* Business Email */}
        <div>
          <label htmlFor="business_email" className="block text-sm font-semibold text-gray-700 mb-2">
            Business Email
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail className="w-5 h-5 text-gray-400" />
            </div>
            <input
              {...register('business_email')}
              type="email"
              id="business_email"
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              placeholder="contact@company.com"
            />
          </div>
        </div>

        {/* Website */}
        <div>
          <label htmlFor="website" className="block text-sm font-semibold text-gray-700 mb-2">
            Website (Optional)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Globe className="w-5 h-5 text-gray-400" />
            </div>
            <input
              {...register('website', {
                validate: (value) => {
                  if (!value || value.trim() === '') return true; // Empty is valid
                  try {
                    const url = new URL(value);
                    // Check if it has a proper domain with at least one dot
                    const hostname = url.hostname;
                    return hostname.includes('.') || 'Please enter a valid URL (e.g., https://example.com)';
                  } catch {
                    return 'Please enter a valid URL (e.g., https://example.com)';
                  }
                }
              })}
              type="url"
              id="website"
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              placeholder="https://www.company.com"
            />
            {errors.website && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <span>⚠️</span>
                {errors.website.message}
              </p>
            )}
          </div>
        </div>

        {/* Business Type (only for TEAM/COMPANY) */}
        {!isSolo && (
          <div>
            <label htmlFor="business_type" className="block text-sm font-semibold text-gray-700 mb-2">
              Business Type
            </label>
            <select
              {...register('business_type')}
              id="business_type"
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            >
              <option value={BusinessType.INDIVIDUAL}>Individual</option>
              <option value={BusinessType.LLC}>LLC</option>
              <option value={BusinessType.CORPORATION}>Corporation</option>
              <option value={BusinessType.PARTNERSHIP}>Partnership</option>
            </select>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-6">
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleBack}
          className="flex items-center space-x-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </motion.button>

        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            const displayName = getValues('display_name');
            const companyName = getValues('company_name');

            if (!displayName || displayName.length < 2) {
              toast.error('Validation Error', {
                description: 'Please enter a valid display name',
              });
              return;
            }

            if (!isSolo && (!companyName || companyName.length < 2)) {
              toast.error('Validation Error', {
                description: 'Please enter a valid company name',
              });
              return;
            }

            handleNext();
          }}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
        >
          <span>Continue</span>
          <ArrowRight className="w-5 h-5" />
        </motion.button>
      </div>
    </motion.div>
  );

  // ============================================================================
  // Step 3: Review & Submit
  // ============================================================================

  const Step3Content = () => {
    const formData = getValues();
    const selectedType = ACCOUNT_TYPES.find(t => t.type === formData.account_type);

    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="space-y-6"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-gray-900 mb-2">
            Review Your Information
          </h2>
          <p className="text-gray-600">
            Make sure everything looks good before continuing
          </p>
        </div>

        {/* Review Card */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-2xl p-6 space-y-4">
          {/* Account Type */}
          <div className="flex items-center justify-between pb-4 border-b border-blue-200">
            <span className="text-sm font-semibold text-gray-600">Account Type</span>
            <div className="flex items-center space-x-2">
              {selectedType && <selectedType.icon className="w-5 h-5 text-blue-600" />}
              <span className="font-bold text-gray-900">{selectedType?.title}</span>
            </div>
          </div>

          {/* Display Name */}
          <div className="flex items-center justify-between pb-4 border-b border-blue-200">
            <span className="text-sm font-semibold text-gray-600">
              {isSolo ? 'Your Name' : 'Display Name'}
            </span>
            <span className="font-bold text-gray-900">{formData.display_name}</span>
          </div>

          {/* Company Name */}
          {!isSolo && formData.company_name && (
            <div className="flex items-center justify-between pb-4 border-b border-blue-200">
              <span className="text-sm font-semibold text-gray-600">Company Name</span>
              <span className="font-bold text-gray-900">{formData.company_name}</span>
            </div>
          )}

          {/* Business Email */}
          {formData.business_email && (
            <div className="flex items-center justify-between pb-4 border-b border-blue-200">
              <span className="text-sm font-semibold text-gray-600">Business Email</span>
              <span className="font-bold text-gray-900">{formData.business_email}</span>
            </div>
          )}

          {/* Website */}
          {formData.website && (
            <div className="flex items-center justify-between pb-4 border-b border-blue-200">
              <span className="text-sm font-semibold text-gray-600">Website</span>
              <span className="font-bold text-blue-600 text-sm truncate max-w-xs">
                {formData.website}
              </span>
            </div>
          )}

          {/* Business Type */}
          {!isSolo && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-600">Business Type</span>
              <span className="font-bold text-gray-900 capitalize">
                {formData.business_type}
              </span>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-6">
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleBack}
            disabled={isSubmitting}
            className="flex items-center space-x-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </motion.button>

          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={isSubmitting}
            className="flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Creating...</span>
              </>
            ) : (
              <>
                <span>Create Company</span>
                <CheckCircle2 className="w-5 h-5" />
              </>
            )}
          </motion.button>
        </div>
      </motion.div>
    );
  };

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Blobs */}
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

      {/* Main Content */}
      <div className="w-full max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 md:p-10 border border-gray-200"
        >
          {/* Logo */}
          <div className="flex items-center justify-center space-x-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-2xl flex items-center justify-center">
              <Briefcase className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Team@Once
            </span>
          </div>

          {/* Progress Indicator */}
          <ProgressIndicator />

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)}>
            <AnimatePresence mode="wait">
              {currentStep === 0 && <Step0Content key="step-0" />}
              {currentStep === 1 && <Step1Content key="step-1" />}
              {currentStep === 2 && <Step2Content key="step-2" />}
              {currentStep === 3 && <Step3Content key="step-3" />}
            </AnimatePresence>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default CompanyOnboarding;
