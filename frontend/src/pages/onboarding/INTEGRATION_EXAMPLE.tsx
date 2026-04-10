/**
 * Company Onboarding Integration Example
 *
 * This file shows how to integrate the CompanyOnboarding component
 * into your React Router setup.
 *
 * NOTE: This is a documentation/example file. The components referenced here
 * (LoginPage, ClientDashboard, etc.) are placeholders showing how you would
 * integrate the CompanyOnboarding component in your own application.
 */

import React, { useEffect, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, RouteObject } from 'react-router-dom';
import { CompanyOnboarding } from '@/pages';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { getUserCompanies } from '@/services/companyService';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from 'sonner';

// ============================================================================
// Placeholder Components (These would be your actual components)
// ============================================================================

// These are example placeholders - replace with your actual components
const LoginPage = () => <div>Login Page</div>;
const SignupPageComponent = () => <div>Signup Page</div>;
const ClientDashboard = () => <div>Client Dashboard</div>;
const DeveloperTeam = () => <div>Developer Team</div>;
const ProfileOnboarding = () => <div>Profile Onboarding</div>;
const Signup = () => <div>Signup</div>;
const Login = () => <div>Login</div>;

// Simple error boundary component (replace with your own if you have one)
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong.</div>;
    }
    return this.props.children;
  }
}

// ============================================================================
// Example 1: Basic Integration
// ============================================================================

export function BasicIntegration() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public onboarding page */}
        <Route path="/onboarding/company" element={<CompanyOnboarding />} />
      </Routes>
    </BrowserRouter>
  );
}

// ============================================================================
// Example 2: Protected Route (Recommended)
// ============================================================================

export function ProtectedIntegration() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Protected onboarding - requires authentication */}
        <Route
          path="/onboarding/company"
          element={
            <ProtectedRoute>
              <CompanyOnboarding />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

// ============================================================================
// Example 3: Full App Integration with Signup Flow
// ============================================================================

export function FullAppIntegration() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Routes */}
        <Route path="/auth/signup" element={<SignupPageComponent />} />
        <Route path="/auth/login" element={<LoginPage />} />

        {/* Onboarding Routes */}
        <Route
          path="/onboarding/company"
          element={
            <ProtectedRoute>
              <CompanyOnboarding />
            </ProtectedRoute>
          }
        />

        {/* Client Dashboard */}
        <Route
          path="/client/dashboard"
          element={
            <ProtectedRoute>
              <ClientDashboard />
            </ProtectedRoute>
          }
        />

        {/* Developer Dashboard */}
        <Route
          path="/developer/team"
          element={
            <ProtectedRoute>
              <DeveloperTeam />
            </ProtectedRoute>
          }
        />

        {/* Redirect root to appropriate dashboard */}
        <Route path="/" element={<Navigate to="/auth/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

// ============================================================================
// Example 4: Signup Page with Onboarding Redirect
// ============================================================================

export function SignupPage() {
  const navigate = useNavigate();
  const { signup } = useAuth();

  const handleSignup = async (email: string, password: string, name: string, role: 'client' | 'developer') => {
    try {
      // Create user account
      await signup(email, password, name, role);

      // Redirect to company onboarding after successful signup
      navigate('/onboarding/company');
    } catch (error) {
      console.error('Signup failed:', error);
    }
  };

  return (
    <div>
      {/* Your signup form here */}
      <button onClick={() => handleSignup('user@example.com', 'password123', 'John Doe', 'client')}>
        Sign Up
      </button>
    </div>
  );
}

// ============================================================================
// Example 5: Custom Onboarding Wrapper with Additional Logic
// ============================================================================

export function OnboardingWrapper() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    checkExistingCompany();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const checkExistingCompany = async () => {
    try {
      // Check if user already has a company
      const companies = await getUserCompanies();

      if (companies.length > 0) {
        // User already has a company, redirect to dashboard
        if (user?.role === 'client') {
          navigate('/client/dashboard', { replace: true });
        } else if (user?.role === 'developer') {
          navigate('/developer/team', { replace: true });
        }
      }
    } catch (error) {
      console.error('Failed to check existing companies:', error);
    }
  };

  return <CompanyOnboarding />;
}

// ============================================================================
// Example 6: Route Configuration with TypeScript
// ============================================================================

export const onboardingRoutes: RouteObject[] = [
  {
    path: '/onboarding',
    children: [
      {
        path: 'company',
        element: (
          <ProtectedRoute>
            <CompanyOnboarding />
          </ProtectedRoute>
        ),
      },
      // Add more onboarding steps if needed
      {
        path: 'profile',
        element: (
          <ProtectedRoute>
            <ProfileOnboarding />
          </ProtectedRoute>
        ),
      },
    ],
  },
];

// Usage in main router
export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {onboardingRoutes.map((route, index) => (
          <Route key={index} path={route.path}>
            {route.children?.map((childRoute, childIndex) => (
              <Route key={childIndex} path={childRoute.path} element={childRoute.element} />
            ))}
          </Route>
        ))}
      </Routes>
    </BrowserRouter>
  );
}

// ============================================================================
// Example 7: With Loading State and Error Boundary
// ============================================================================

export function OnboardingWithErrorHandling() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingSpinner />}>
        <CompanyOnboarding />
      </Suspense>
    </ErrorBoundary>
  );
}

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
}

// ============================================================================
// Example 8: App.tsx Complete Example
// ============================================================================

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Auth Routes */}
          <Route path="/auth/signup" element={<Signup />} />
          <Route path="/auth/login" element={<Login />} />

          {/* Onboarding Route */}
          <Route
            path="/onboarding/company"
            element={
              <ProtectedRoute>
                <CompanyOnboarding />
              </ProtectedRoute>
            }
          />

          {/* Client Routes */}
          <Route
            path="/client/dashboard"
            element={
              <ProtectedRoute>
                <ClientDashboard />
              </ProtectedRoute>
            }
          />

          {/* Developer Routes */}
          <Route
            path="/developer/team"
            element={
              <ProtectedRoute>
                <DeveloperTeam />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>

      {/* Toast notifications */}
      <Toaster position="top-right" richColors />
    </AuthProvider>
  );
}

// ============================================================================
// Notes:
// ============================================================================

/**
 * 1. RECOMMENDED FLOW:
 *    Signup → Company Onboarding → Dashboard
 *
 * 2. AUTHENTICATION:
 *    Always wrap onboarding in ProtectedRoute to ensure user is authenticated
 *
 * 3. USER ROLES:
 *    - Client: Redirects to /client/dashboard after onboarding
 *    - Developer: Redirects to /developer/team after onboarding
 *
 * 4. ERROR HANDLING:
 *    Component handles all errors internally with toast notifications
 *
 * 5. COMPANY CHECK:
 *    Consider checking if user already has a company before showing onboarding
 *
 * 6. ACCESSIBILITY:
 *    Component is fully keyboard accessible and screen reader friendly
 *
 * 7. MOBILE RESPONSIVE:
 *    Works on all screen sizes from mobile to desktop
 */
