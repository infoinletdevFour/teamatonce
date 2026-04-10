/**
 * Company Settings Page
 * Manage company profile and view statistics
 * Includes company selector for users with multiple companies
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  ChevronDown,
  BarChart3,
  Settings,
  Loader2,
  AlertCircle,
  ChevronRight,
  Home,
} from 'lucide-react';
import { CompanyProfile } from '../../components/company/CompanyProfile';
import { CompanyStats } from '../../components/company/CompanyStats';
import { useCompanyStore } from '../../stores/companyStore';
import { Company } from '../../types/company';

/**
 * Company Settings Page Component
 */
export const CompanySettings: React.FC = () => {
  const {
    companies,
    currentCompany,
    fetchUserCompanies,
    setCurrentCompany,
    isLoading,
    error,
  } = useCompanyStore();

  const [activeTab, setActiveTab] = useState<'profile' | 'statistics'>('profile');
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Fetch companies on mount
  useEffect(() => {
    const loadCompanies = async () => {
      try {
        await fetchUserCompanies();
        setMounted(true);
      } catch (err) {
        console.error('Error loading companies:', err);
        setMounted(true);
      }
    };

    loadCompanies();
  }, []);

  // Auto-select first company if none selected
  useEffect(() => {
    if (mounted && companies.length > 0 && !currentCompany) {
      setCurrentCompany(companies[0]);
    }
  }, [mounted, companies, currentCompany]);

  const handleCompanySelect = (company: Company) => {
    setCurrentCompany(company);
    setShowCompanyDropdown(false);
  };

  const handleProfileSuccess = (updatedCompany: Company) => {
    // Company is already updated in the store
    console.log('Company profile updated successfully:', updatedCompany);
  };

  // Loading state
  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading companies...</p>
        </motion.div>
      </div>
    );
  }

  // Error state
  if (error && companies.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-red-800 font-semibold text-lg mb-1">
                  Error Loading Companies
                </h3>
                <p className="text-red-600 text-sm">{error}</p>
                <button
                  onClick={() => fetchUserCompanies()}
                  className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // No companies state
  if (companies.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Companies Found</h3>
            <p className="text-gray-600 mb-6">
              You need to create a company first before accessing settings.
            </p>
            <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all">
              Create Company
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: Settings },
    { id: 'statistics', label: 'Statistics', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-sm text-gray-600 mb-6"
        >
          <Home className="w-4 h-4" />
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-400">Settings</span>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 font-medium">Company</span>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Company Settings
          </h1>
          <p className="text-gray-600">Manage your company profile and view performance statistics</p>
        </motion.div>

        {/* Company Selector - Only show if user has multiple companies */}
        {companies.length > 1 && currentCompany && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Select Company
            </label>
            <div className="relative">
              <button
                onClick={() => setShowCompanyDropdown(!showCompanyDropdown)}
                className="w-full md:w-96 px-4 py-3 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-500 focus:border-blue-500 focus:outline-none transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-gray-900">
                      {currentCompany.display_name}
                    </div>
                    <div className="text-sm text-gray-500">{currentCompany.account_type}</div>
                  </div>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-gray-400 transition-transform ${
                    showCompanyDropdown ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Dropdown */}
              {showCompanyDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute z-10 w-full md:w-96 mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-xl overflow-hidden"
                >
                  {companies.map((company) => (
                    <button
                      key={company.id}
                      onClick={() => handleCompanySelect(company)}
                      className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                        currentCompany.id === company.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          currentCompany.id === company.id
                            ? 'bg-gradient-to-br from-blue-500 to-purple-500'
                            : 'bg-gray-200'
                        }`}
                      >
                        <Building2
                          className={`w-5 h-5 ${
                            currentCompany.id === company.id ? 'text-white' : 'text-gray-600'
                          }`}
                        />
                      </div>
                      <div className="text-left flex-1">
                        <div
                          className={`font-semibold ${
                            currentCompany.id === company.id ? 'text-blue-600' : 'text-gray-900'
                          }`}
                        >
                          {company.display_name}
                        </div>
                        <div className="text-sm text-gray-500">{company.account_type}</div>
                      </div>
                      {currentCompany.id === company.id && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {/* Tabs and Content */}
        <div className="grid grid-cols-12 gap-6">
          {/* Tab Navigation */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="col-span-12 md:col-span-3"
          >
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-gray-200 p-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as 'profile' | 'statistics')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-semibold">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Tab Content */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="col-span-12 md:col-span-9"
          >
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-gray-200 p-8">
              {activeTab === 'profile' && currentCompany && (
                <CompanyProfile
                  company={currentCompany}
                  onSuccess={handleProfileSuccess}
                />
              )}

              {activeTab === 'statistics' && currentCompany && (
                <CompanyStats companyId={currentCompany.id} autoLoad={true} />
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default CompanySettings;
