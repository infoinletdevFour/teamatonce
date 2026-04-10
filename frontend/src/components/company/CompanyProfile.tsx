/**
 * Company Profile Component
 * Form for creating/editing company profile
 * Uses React Hook Form for validation and Sonner for toasts
 */

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  Company,
  CreateCompanyData,
  UpdateCompanyData,
  AccountType,
  BusinessType,
  CompanySize,
} from '../../types/company';
import { useCompanyStore } from '../../stores/companyStore';

// ============================================================================
// Component Props
// ============================================================================

interface CompanyProfileProps {
  company?: Company | null;
  onSuccess?: (company: Company) => void;
  onCancel?: () => void;
}

interface CompanyFormData {
  account_type: AccountType;
  display_name: string;
  company_name?: string;
  business_type?: BusinessType;
  tax_id?: string;
  company_size?: CompanySize;
  website?: string;
  description?: string;
  business_email?: string;
  business_phone?: string;
  street?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  timezone?: string;
  currency?: string;
  language?: string;
}

// ============================================================================
// Component
// ============================================================================

export const CompanyProfile: React.FC<CompanyProfileProps> = ({
  company,
  onSuccess,
  onCancel,
}) => {
  const { createCompany, updateCompany, isLoading } = useCompanyStore();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm<CompanyFormData>({
    defaultValues: {
      account_type: company?.account_type || AccountType.SOLO,
      display_name: company?.display_name || '',
      company_name: company?.company_name || '',
      business_type: company?.business_type || BusinessType.INDIVIDUAL,
      tax_id: company?.tax_id || '',
      company_size: company?.company_size || CompanySize.SOLO,
      website: company?.website || '',
      description: company?.description || '',
      business_email: company?.business_email || '',
      business_phone: company?.business_phone || '',
      street: company?.business_address?.street || '',
      city: company?.business_address?.city || '',
      state: company?.business_address?.state || '',
      postal_code: company?.business_address?.postal_code || '',
      country: company?.business_address?.country || '',
      timezone: company?.timezone || 'UTC',
      currency: company?.currency || 'USD',
      language: company?.language || 'en',
    },
  });

  const accountType = watch('account_type');
  const isEditMode = !!company;

  // Reset form when company changes
  useEffect(() => {
    if (company) {
      reset({
        account_type: company.account_type,
        display_name: company.display_name,
        company_name: company.company_name,
        business_type: company.business_type,
        tax_id: company.tax_id,
        company_size: company.company_size,
        website: company.website,
        description: company.description,
        business_email: company.business_email,
        business_phone: company.business_phone,
        street: company.business_address?.street,
        city: company.business_address?.city,
        state: company.business_address?.state,
        postal_code: company.business_address?.postal_code,
        country: company.business_address?.country,
        timezone: company.timezone,
        currency: company.currency,
        language: company.language,
      });
    }
  }, [company, reset]);

  const onSubmit = async (data: CompanyFormData) => {
    try {
      // Filter out empty strings and undefined values to avoid validation errors
      const companyData: any = {
        account_type: data.account_type,
        display_name: data.display_name,
      };

      // Only add fields if they have valid values
      if (data.company_name) companyData.company_name = data.company_name;
      if (data.business_type) companyData.business_type = data.business_type;
      if (data.tax_id) companyData.tax_id = data.tax_id;
      if (data.company_size) companyData.company_size = data.company_size;
      if (data.website && data.website.trim()) companyData.website = data.website.trim();
      if (data.description) companyData.description = data.description;
      if (data.business_email && data.business_email.trim()) companyData.business_email = data.business_email.trim();
      if (data.business_phone) companyData.business_phone = data.business_phone;
      if (data.timezone) companyData.timezone = data.timezone;
      if (data.currency) companyData.currency = data.currency;
      if (data.language) companyData.language = data.language;

      // Only include business_address if at least one field is filled
      if (data.street || data.city || data.state || data.postal_code || data.country) {
        companyData.business_address = {
          street: data.street || '',
          city: data.city || '',
          state: data.state || '',
          postal_code: data.postal_code || '',
          country: data.country || '',
        };
      }

      let result: Company;

      if (isEditMode && company) {
        await updateCompany(company.id, companyData as UpdateCompanyData);
        toast.success('Company updated successfully');
        result = { ...company, ...companyData } as Company;
      } else {
        result = await createCompany(companyData as CreateCompanyData);
        toast.success('Company created successfully');
      }

      if (onSuccess) {
        onSuccess(result);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to save company');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Account Type Selection */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Type</h3>
          <div className="space-y-3">
            <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition">
              <input
                type="radio"
                value={AccountType.SOLO}
                {...register('account_type', { required: 'Account type is required' })}
                className="w-4 h-4 text-blue-600"
              />
              <div className="ml-3">
                <div className="font-medium text-gray-900">Solo Developer</div>
                <div className="text-sm text-gray-500">Working independently on projects</div>
              </div>
            </label>

            <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition">
              <input
                type="radio"
                value={AccountType.TEAM}
                {...register('account_type')}
                className="w-4 h-4 text-blue-600"
              />
              <div className="ml-3">
                <div className="font-medium text-gray-900">Team</div>
                <div className="text-sm text-gray-500">Small team of 2-10 developers</div>
              </div>
            </label>

            <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition">
              <input
                type="radio"
                value={AccountType.COMPANY}
                {...register('account_type')}
                className="w-4 h-4 text-blue-600"
              />
              <div className="ml-3">
                <div className="font-medium text-gray-900">Company</div>
                <div className="text-sm text-gray-500">Registered company or agency</div>
              </div>
            </label>
          </div>
          {errors.account_type && (
            <p className="mt-2 text-sm text-red-600">{errors.account_type.message}</p>
          )}
        </div>

        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Display Name *
              </label>
              <input
                type="text"
                {...register('display_name', {
                  required: 'Display name is required',
                  minLength: { value: 2, message: 'Minimum 2 characters' },
                  maxLength: { value: 100, message: 'Maximum 100 characters' },
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="John Doe Development"
              />
              {errors.display_name && (
                <p className="mt-1 text-sm text-red-600">{errors.display_name.message}</p>
              )}
            </div>

            {(accountType === AccountType.TEAM || accountType === AccountType.COMPANY) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Official Company Name
                </label>
                <input
                  type="text"
                  {...register('company_name', {
                    minLength: { value: 2, message: 'Minimum 2 characters' },
                    maxLength: { value: 200, message: 'Maximum 200 characters' },
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Acme Development LLC"
                />
                {errors.company_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.company_name.message}</p>
                )}
              </div>
            )}

            {accountType === AccountType.COMPANY && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business Type
                  </label>
                  <select
                    {...register('business_type')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={BusinessType.INDIVIDUAL}>Individual</option>
                    <option value={BusinessType.LLC}>LLC</option>
                    <option value={BusinessType.CORPORATION}>Corporation</option>
                    <option value={BusinessType.PARTNERSHIP}>Partnership</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tax ID / EIN
                  </label>
                  <input
                    type="text"
                    {...register('tax_id')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="12-3456789"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Size</label>
              <select
                {...register('company_size')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={CompanySize.SOLO}>Solo (1 person)</option>
                <option value={CompanySize.SMALL}>Small (2-10)</option>
                <option value={CompanySize.MEDIUM}>Medium (11-50)</option>
                <option value={CompanySize.LARGE}>Large (51-200)</option>
                <option value={CompanySize.ENTERPRISE}>Enterprise (201+)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
              <input
                type="url"
                {...register('website', {
                  pattern: {
                    value: /^https?:\/\/.+/i,
                    message: 'Invalid URL format',
                  },
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://acmedev.com"
              />
              {errors.website && (
                <p className="mt-1 text-sm text-red-600">{errors.website.message}</p>
              )}
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              {...register('description', {
                maxLength: { value: 2000, message: 'Maximum 2000 characters' },
              })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Tell clients about your company and expertise..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Email</label>
              <input
                type="email"
                {...register('business_email', {
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="contact@acmedev.com"
              />
              {errors.business_email && (
                <p className="mt-1 text-sm text-red-600">{errors.business_email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Phone</label>
              <input
                type="tel"
                {...register('business_phone')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+1-555-123-4567"
              />
            </div>
          </div>
        </div>

        {/* Business Address */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Address</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
              <input
                type="text"
                {...register('street')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="123 Main St"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                {...register('city')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="San Francisco"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State/Province</label>
              <input
                type="text"
                {...register('state')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="CA"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
              <input
                type="text"
                {...register('postal_code')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="94102"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <input
                type="text"
                {...register('country')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="United States"
              />
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
              <select
                {...register('timezone')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York</option>
                <option value="America/Los_Angeles">America/Los_Angeles</option>
                <option value="Europe/London">Europe/London</option>
                <option value="Europe/Paris">Europe/Paris</option>
                <option value="Asia/Tokyo">Asia/Tokyo</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <select
                {...register('currency')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="JPY">JPY - Japanese Yen</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
              <select
                {...register('language')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="en">English</option>
                <option value="de">German</option>
                <option value="fr">French</option>
                <option value="es">Spanish</option>
                <option value="ja">Japanese</option>
              </select>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              disabled={isLoading}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isLoading || !isDirty}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Saving...' : isEditMode ? 'Update Company' : 'Create Company'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CompanyProfile;
