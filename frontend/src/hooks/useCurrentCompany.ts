/**
 * Custom hook to access current company information
 * Provides centralized access to company state from Zustand store
 */

import { useEffect, useState } from 'react';
import { useCompanyStore } from '@/stores/companyStore';
import { useAuth } from '@/contexts/AuthContext';

export const useCurrentCompany = () => {
  const { user } = useAuth();
  const { currentCompany, companies, fetchUserCompanies } = useCompanyStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCompany = async () => {
      // Don't load if we already have a current company
      if (currentCompany) {
        return;
      }

      // Don't load if user is not authenticated
      if (!user) {
        return;
      }

      // If no companies loaded yet, fetch them
      if (companies.length === 0) {
        setLoading(true);
        setError(null);
        try {
          await fetchUserCompanies();
        } catch (err: any) {
          console.error('Failed to fetch user companies:', err);
          setError(err.message || 'Failed to load companies');
        } finally {
          setLoading(false);
        }
      }
    };

    loadCompany();
  }, [user, currentCompany, companies.length, fetchUserCompanies]);

  return {
    company: currentCompany,
    companyId: currentCompany?.id || null,
    companies,
    loading,
    error,
    hasCompany: !!currentCompany,
  };
};
