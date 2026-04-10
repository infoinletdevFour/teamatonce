import React, { useEffect, useRef } from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCompanyStore } from '../../stores/companyStore';
import { TokenManager } from '../../lib/api';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'client' | 'seller' | 'designer' | 'project-manager' | 'admin' | 'super_admin';
  requireCompany?: boolean; // New prop to control company validation
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  requireCompany = true, // Default to true for backward compatibility
}) => {
  // Admin routes should never require company
  const isAdminRoute = requiredRole === 'admin' || requiredRole === 'super_admin';
  const shouldRequireCompany = isAdminRoute ? false : requireCompany;
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { companyId, projectId } = useParams<{ companyId?: string; projectId?: string }>();
  const { companies, fetchUserCompanies, isLoading: companyLoading, currentCompany } = useCompanyStore();
  const location = useLocation();

  // Track if we've already attempted to fetch companies to prevent infinite loops
  const hasFetchedCompanies = useRef(false);

  // Check if this is a project route - developers may access projects in companies they're assigned to
  const isProjectRoute = location.pathname.includes('/project/') && projectId;

  // Fetch companies on mount if authenticated and not already loaded
  useEffect(() => {
    if (isAuthenticated && !authLoading && companies.length === 0 && !companyLoading && !hasFetchedCompanies.current && !isAdminRoute) {
      hasFetchedCompanies.current = true;
      fetchUserCompanies();
    }
  }, [isAuthenticated, authLoading, companies.length, companyLoading, fetchUserCompanies, isAdminRoute]);

  // While checking auth or company status, show loading
  if (authLoading || (shouldRequireCompany && companyLoading && companies.length === 0)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Special case: Onboarding with role selection (tempToken scenario)
  // Allow access if there's a token even if user data isn't fully loaded
  const searchParams = new URLSearchParams(location.search);
  const needsRole = searchParams.get('needsRole') === 'true';
  const isOnboardingWithRole = location.pathname === '/onboarding/company' && needsRole;
  const hasToken = !!TokenManager.getToken();

  console.log('[ProtectedRoute] Auth check:', {
    isAuthenticated,
    hasToken,
    isOnboardingWithRole,
    pathname: location.pathname,
  });

  // If not authenticated after loading, redirect to login
  // EXCEPT: If onboarding with role selection and has token (tempToken case)
  if (!isAuthenticated) {
    if (isOnboardingWithRole && hasToken) {
      console.log('[ProtectedRoute] Allowing access to onboarding with tempToken');
      // Allow access - user has tempToken and needs to select role
    } else {
      console.log('[ProtectedRoute] No auth, redirecting to login');
      // Save the attempted location so we can redirect back after login
      return <Navigate to="/auth/login" state={{ from: location }} replace />;
    }
  }

  // Company validation logic (only if shouldRequireCompany is true)
  if (shouldRequireCompany) {
    // If companies are loaded, check company status
    if (!companyLoading) {
      // No companies exist - redirect to onboarding
      if (companies.length === 0) {
        return <Navigate to="/onboarding/company" replace />;
      }

      // Company ID in URL but user doesn't have access to it
      // EXCEPTION: For project routes, allow access - the ProjectProvider will handle authorization
      // This allows developers to access projects in client companies they're assigned to
      if (companyId && !companies.find(c => c.id === companyId)) {
        if (!isProjectRoute) {
          console.warn(`User does not have access to company ${companyId}`);
          return <Navigate to="/select-company" replace />;
        }
        // For project routes, let the ProjectProvider handle authorization
        console.log(`Allowing project route access for company ${companyId} - authorization will be checked by ProjectProvider`);
      }

      // No company ID in URL but user has companies - redirect to first company
      if (!companyId) {
        const targetCompany = currentCompany || companies[0];
        const section = user?.role === 'seller' ? 'seller' : 'client';
        console.log(`No company in URL, redirecting to /company/${targetCompany.id}/${section}/dashboard`);
        return <Navigate to={`/company/${targetCompany.id}/${section}/dashboard`} replace />;
      }
    }
  }

  // Check role if required
  if (requiredRole) {
    // Get user role - check both user.role and metadata for admin roles
    const userRole = user?.role;
    const metadataRole = (user as unknown as { metadata?: { role?: string } })?.metadata?.role;
    const effectiveRole = metadataRole || userRole;

    // For admin routes, check if user has admin or super_admin role
    if (isAdminRoute) {
      const isAdmin = effectiveRole === 'admin' || effectiveRole === 'super_admin';
      if (!isAdmin) {
        // Non-admin trying to access admin routes - redirect to their dashboard
        const section = userRole === 'seller' ? 'seller' : 'client';
        if (currentCompany) {
          return <Navigate to={`/company/${currentCompany.id}/${section}/dashboard`} replace />;
        } else if (companies.length > 0) {
          return <Navigate to={`/company/${companies[0].id}/${section}/dashboard`} replace />;
        } else {
          return <Navigate to="/select-company" replace />;
        }
      }
    } else {
      // Non-admin role check
      // Treat 'user' role as 'client' for client routes (common default role)
      const isClientRole = requiredRole === 'client' && (userRole === 'client' || userRole === 'user');
      const isSellerRole = requiredRole === 'seller' && userRole === 'seller';

      if (!isClientRole && !isSellerRole && userRole !== requiredRole) {
        const section = userRole === 'seller' ? 'seller' : 'client';

        if (companyId) {
          return <Navigate to={`/company/${companyId}/${section}/dashboard`} replace />;
        } else if (currentCompany) {
          return <Navigate to={`/company/${currentCompany.id}/${section}/dashboard`} replace />;
        } else {
          // Fallback to company selection
          return <Navigate to="/select-company" replace />;
        }
      }
    }
  }

  // User is authenticated and has valid company context (or no company needed for admin), render the protected content
  return <>{children}</>;
};

export default ProtectedRoute;
