import { createContext, useContext, useEffect, useRef, ReactNode } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useCompanyStore } from '@/stores/companyStore';
import { Company, CompanyMember } from '@/types/company';
import { setCompanyId as setApiCompanyId } from '@/lib/api-client';

interface CompanyContextValue {
  company: Company | null;
  companyId: string | null;
  companies: Company[];
  currentMembership: CompanyMember | null;
  loading: boolean;
  error: string | null;
  hasCompany: boolean;
  switchCompany: (companyId: string) => void;
  refreshCompanies: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextValue | undefined>(undefined);

interface CompanyProviderProps {
  children: ReactNode;
}

export function CompanyProvider({ children }: CompanyProviderProps) {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    currentCompany,
    companies,
    currentMembership,
    setCurrentCompany,
    fetchUserCompanies,
    fetchCurrentUserMembership,
    isLoading,
    error
  } = useCompanyStore();

  // Track if we've already attempted to fetch companies to prevent infinite loops
  const hasFetchedCompanies = useRef(false);

  // Load companies on mount if not already loaded
  useEffect(() => {
    if (companies.length === 0 && !isLoading && !hasFetchedCompanies.current) {
      hasFetchedCompanies.current = true;
      fetchUserCompanies();
    }
  }, [companies.length, isLoading, fetchUserCompanies]);

  // Check if this is a project route - developers may access projects in companies they're assigned to
  const isProjectRoute = location.pathname.includes('/project/');

  // Sync URL companyId with store
  useEffect(() => {
    if (!companyId || companies.length === 0) return;

    const company = companies.find(c => c.id === companyId);

    if (company) {
      // Valid company in URL - sync with store if different
      // IMPORTANT: Only update if the company ID is actually different to prevent infinite loops
      if (currentCompany?.id !== companyId) {
        setCurrentCompany(company);
        // Set company ID in API client for multi-tenant requests
        setApiCompanyId(companyId);
      }

      // Fetch current user's membership info for this company
      if (!currentMembership || currentMembership.company_id !== companyId) {
        fetchCurrentUserMembership(companyId).catch(_err => {
          // Non-critical error, continue anyway
        });
      }
    } else if (!isProjectRoute) {
      // Invalid company ID in URL - redirect to company selection
      // EXCEPTION: For project routes, allow access - the ProjectProvider will handle authorization
      // This allows developers to access projects in client companies they're assigned to
      navigate('/select-company', { replace: true });
    } else {
      // For project routes with unknown company, just set the API company ID
      // Authorization will be handled by the ProjectProvider/backend
      setApiCompanyId(companyId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, companies, isProjectRoute]);

  // Handle case where companyId is missing from URL but we have companies
  useEffect(() => {
    // Don't redirect if we're on onboarding or company selection pages
    const excludedPaths = ['/onboarding', '/select-company', '/auth'];
    const isExcludedPath = excludedPaths.some(path => location.pathname.startsWith(path));

    if (isExcludedPath || !companies.length || companyId || isLoading) {
      return;
    }

    // If user has companies but no companyId in URL, redirect to first company
    const targetCompany = currentCompany || companies[0];
    const currentSection = location.pathname.split('/')[1] || 'dashboard';

    navigate(`/company/${targetCompany.id}/${currentSection}`, { replace: true });
  }, [companyId, companies, currentCompany, isLoading, location.pathname, navigate]);

  const switchCompany = (newCompanyId: string) => {
    const company = companies.find(c => c.id === newCompanyId);
    if (!company) {
      return;
    }

    setCurrentCompany(company);
    // Set company ID in API client for multi-tenant requests
    setApiCompanyId(newCompanyId);

    // Navigate to new company context, preserve current section if possible
    const pathParts = location.pathname.split('/');
    const section = pathParts[3] || 'dashboard'; // Get section after /company/:companyId/

    navigate(`/company/${newCompanyId}/${section}`);
  };

  const refreshCompanies = async () => {
    await fetchUserCompanies();
  };

  const value: CompanyContextValue = {
    company: currentCompany,
    companyId: companyId || null,
    companies,
    currentMembership,
    loading : isLoading,
    error,
    hasCompany: !!currentCompany && !!companyId,
    switchCompany,
    refreshCompanies,
  };

  // Show loading state while companies are being fetched
  if (isLoading && companies.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  );
}

/**
 * Hook to access company context from URL parameters
 *
 * Must be used within CompanyProvider
 * Automatically syncs with URL params and Zustand store
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { company, companyId, loading, hasCompany } = useCompany();
 *
 *   if (loading) return <Loading />;
 *   if (!hasCompany) return <NoCompany />;
 *
 *   return <div>Company: {company.display_name}</div>;
 * }
 * ```
 */

export function useCompany() {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompany must be used within CompanyProvider');
  }
  return context;
}

/**
 * Optional company context hook
 * Returns null if used outside CompanyProvider instead of throwing error
 * Use this in components that should work both with and without company context
 */
export function useCompanyOptional() {
  const context = useContext(CompanyContext);
  return context || null;
}
