import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCompanyStore } from '@/stores/companyStore';
import { useAuth } from '@/contexts/AuthContext';
import { Building2, Plus, Users, Calendar, AlertCircle } from 'lucide-react';

export function CompanySelectionPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const hasFetched = useRef(false);
  const {
    companies,
    fetchUserCompanies,
    setCurrentCompany,
    isLoading,
    error
  } = useCompanyStore();

  useEffect(() => {
    // Prevent multiple fetches
    if (hasFetched.current) return;
    hasFetched.current = true;

    fetchUserCompanies().catch((err) => {
      console.error('Failed to fetch companies:', err);
    });
  }, []);

  const handleSelectCompany = (companyId: string) => {
    const company = companies.find(c => c.id === companyId);
    if (company) {
      setCurrentCompany(company);
      // Navigate to company dashboard based on user role
      const section = user?.role === 'developer' ? 'developer' : 'client';
      navigate(`/company/${companyId}/${section}/dashboard`);
    }
  };

  const handleCreateCompany = () => {
    navigate('/onboarding/company');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-sky-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-sky-100 flex items-center justify-center p-4">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl p-12 text-center border-2 border-red-200 max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => {
              hasFetched.current = false;
              fetchUserCompanies().catch(console.error);
            }}
            className="px-6 py-3 bg-sky-600 text-white font-bold rounded-xl hover:bg-sky-700 transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-sky-100 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Choose a company to continue or create a new one
          </h1>
          <p className="text-lg text-gray-600">
            Select your workspace to access your projects and team
          </p>
        </div>

        {companies.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl p-16 text-center border-2 border-gray-200">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-sky-600 to-sky-700 flex items-center justify-center mx-auto mb-6">
              <Building2 className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              No Companies Yet
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
              Create your first company to get started with Team@Once and access all features
            </p>
            <button
              onClick={handleCreateCompany}
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-sky-800 via-sky-700 to-sky-600 text-white font-bold rounded-2xl hover:from-sky-900 hover:via-sky-800 hover:to-sky-700 transition-all shadow-2xl hover:shadow-3xl"
            >
              <Plus className="w-6 h-6 mr-2" />
              Create Company
            </button>
          </div>
        ) : (
          <>
            <div className={`grid gap-6 mb-8 ${companies.length === 1 ? 'max-w-md mx-auto' : 'md:grid-cols-2 lg:grid-cols-3'}`}>
              {companies.map((company) => (
                <div
                  key={company.id}
                  className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all cursor-pointer border-2 border-gray-200 hover:border-sky-600 group"
                  onClick={() => handleSelectCompany(company.id)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-sky-600 to-sky-700 flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                        <Building2 className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-sky-700 transition-colors">
                          {company.display_name}
                        </h3>
                        {company.company_name && (
                          <p className="text-sm text-gray-500">
                            {company.company_name}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-700 uppercase">
                      {company.account_type || 'TEAM'}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {company.business_type && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Building2 className="w-4 h-4 mr-2" />
                        {company.business_type}
                      </div>
                    )}
                    {company.company_size && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="w-4 h-4 mr-2" />
                        {company.company_size} employees
                      </div>
                    )}
                    {company.created_at && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        Created {new Date(company.created_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <button
                      className="w-full px-4 py-3 text-sm font-bold text-white bg-gradient-to-r from-sky-800 via-sky-700 to-sky-600 hover:from-sky-900 hover:via-sky-800 hover:to-sky-700 rounded-xl transition-all shadow-lg hover:shadow-xl"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectCompany(company.id);
                      }}
                    >
                      Select Company
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-8">
              <button
                onClick={handleCreateCompany}
                className="inline-flex items-center px-8 py-4 bg-white/80 backdrop-blur-xl text-gray-700 font-bold rounded-2xl border-2 border-gray-300 hover:border-sky-600 hover:text-sky-700 hover:shadow-xl transition-all"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Another Company
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
