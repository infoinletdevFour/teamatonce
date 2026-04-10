import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useParams } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

// Auth Context
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CompanyProvider } from './contexts/CompanyContext';
import { ProjectProvider } from './contexts/ProjectContext';
import { VideoCallProvider } from './contexts/VideoCallContext';
import BrowseProjectsLayout from './layouts/BrowseProjectsLayout';
import { ModalProvider } from './components/ui/Modal';

// Role-based Dashboard Redirect Component
const RoleDashboardRedirect: React.FC = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const { user } = useAuth();

  // Redirect based on user role
  const section = user?.role === 'seller' ? 'seller' : 'client';
  return <Navigate to={`/company/${companyId}/${section}/dashboard`} replace />;
};

// Layouts
import MinimalLayout from './layouts/MinimalLayout';
import AdminLayout from './layouts/AdminLayout';

// Auth Components
import ProtectedRoute from './components/auth/ProtectedRoute';

// Public Pages
import LandingPage from './pages/public/LandingPage';
import NewLandingPage from './pages/public/NewLandingPage';
import BrowsePage from './pages/public/BrowsePage';
import FindJobsPage from './pages/public/FindJobsPage';
import TalentDetailPage from './pages/public/TalentDetailPage';
import JobDetailPage from './pages/public/JobDetailPage';
import PricingPage from './pages/public/PricingPage';
import PrivacyPage from './pages/public/PrivacyPage';
import TermsPage from './pages/public/TermsPage';
import CookiePage from './pages/public/CookiePage';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import ForgotPassword from './pages/auth/ForgotPassword';
import SocialAuthCallback from './components/auth/SocialAuthCallback';
import AuthSuccess from './pages/auth/AuthSuccess';
import AuthError from './pages/auth/AuthError';
import NotFound from './pages/NotFound';
import UserProfile from './pages/public/UserProfile';
import HireDeveloper from './pages/HireDeveloper';
import HelpSupport from './pages/HelpSupport';

// Admin Pages
import AdminDashboardPage from './pages/admin/Dashboard';
import AdminUsersPage from './pages/admin/Users';
import AdminUserDetailPage from './pages/admin/UserDetail';
import AdminJobsPage from './pages/admin/Jobs';
import AdminJobDetailPage from './pages/admin/JobDetail';
import AdminProjectsPage from './pages/admin/Projects';
import AdminProjectDetailPage from './pages/admin/ProjectDetail';
import AdminReportsPage from './pages/admin/Reports';
import AdminReportDetailPage from './pages/admin/ReportDetail';
import AdminCommunicationsPage from './pages/admin/Communications';
import AdminComposeEmailPage from './pages/admin/ComposeEmail';
import AdminComposeNotificationPage from './pages/admin/ComposeNotification';
import AdminEmailCampaignsPage from './pages/admin/EmailCampaigns';
import AdminFaqsPage from './pages/admin/Faqs';
import AdminFaqFormPage from './pages/admin/FaqForm';
import AdminSettingsPage from './pages/admin/Settings';

// Data Engine Pages
import AdminDataEngine from './pages/admin/DataEngine';
import DataEngineDashboard from './pages/admin/data-engine/Dashboard';
import DataEngineCrawling from './pages/admin/data-engine/Crawling';
import DataEngineData from './pages/admin/data-engine/Data';
import DataEngineEntities from './pages/admin/data-engine/Entities';
import DataEngineEntityProfile from './pages/admin/data-engine/EntityProfile';
import DataEngineMatching from './pages/admin/data-engine/Matching';
import DataEngineOutreach from './pages/admin/data-engine/Outreach';
import DataEngineSettings from './pages/admin/data-engine/Settings';
import DataEnginePipelines from './pages/admin/data-engine/Pipelines';
import DataEngineCompanies from './pages/admin/data-engine/Companies';
import DataEngineCompanyProfile from './pages/admin/data-engine/CompanyProfile';

// Client Pages
import ClientDashboard from './pages/client/Dashboard';
import MyProjects from './pages/client/MyProjects';
import PostProject from './pages/client/PostProject';
import ProjectDetail from './pages/client/ProjectDetail';
import ClientMessages from './pages/client/Messages';
import ClientContracts from './pages/client/Contracts';
import ClientPayments from './pages/client/Payments';
import ClientSettings from './pages/client/Settings';
import ClientProfile from './pages/client/Profile';
import ClientHireRequests from './pages/client/HireRequests';

// Developer Pages
import DeveloperDashboard from './pages/developer/DeveloperDashboard';
import BrowseProjects from './pages/developer/BrowseProjects';
import DeveloperProjects from './pages/developer/Projects';
import DeveloperTeam from './pages/developer/Team';
import DeveloperMessages from './pages/developer/Messages';
import DeveloperCalendar from './pages/developer/Calendar';
import DeveloperPerformance from './pages/developer/Performance';
import DeveloperSettings from './pages/developer/Settings';
import DeveloperProfile from './pages/developer/Profile';
import ProfessionalProfile from './pages/developer/ProfessionalProfile';
import MyGigs from './pages/developer/MyGigs';
import CreateGig from './pages/developer/CreateGig';
import HireRequests from './pages/developer/HireRequests';

// Gig Pages (Public)
import BrowseGigs from './pages/gigs/BrowseGigs';
import GigDetail from './pages/gigs/GigDetail';

// Onboarding Pages
import CompanyOnboarding from './pages/onboarding/CompanyOnboarding';
import { CompanySelectionPage } from './pages/company/CompanySelectionPage';
import CompanyOverview from './pages/company/CompanyOverview';
import BillingSubscription from './pages/company/BillingSubscription';
import CompanyNotifications from './pages/company/Notifications';

// Invitation Pages
import AcceptInvitation from './pages/invitation/Accept';

// Settings Pages
import CompanySettings from './pages/settings/CompanySettings';
import TeamManagement from './pages/settings/TeamManagement';
import { NotificationSettings } from './pages/settings';
import AccountReports from './pages/settings/AccountReports';

// Payment & Contract Pages
import ContractReview from './pages/contract/Review';
import { ContractView, ContractSign } from './pages/contract';
import PaymentDashboard from './pages/payment/Dashboard';
import MilestoneManagement from './pages/payment/Milestones';
import InvoicePage from './pages/payment/Invoice';
import { PaymentSuccess, PaymentFailed, PaymentCheckout } from './pages/payment';
import StripeConnectCallback from './pages/payment/StripeConnectCallback';

// Project Pages
import ProjectDashboard from './pages/project/Dashboard';
import ProjectProposals from './pages/project/Proposals';
import CommunicationHub from './pages/project/CommunicationHub';
import ProjectTeam from './pages/project/Team';
import TeamMemberProfile from './pages/project/TeamMemberProfile';
import MilestoneApproval from './pages/project/MilestoneApproval';
import MilestonePlanning from './pages/project/MilestonePlanning';
import MilestonePlanReview from './pages/project/MilestonePlanReview';
import MilestoneKanban from './pages/project/MilestoneKanban';
import ContractPayment from './pages/project/ContractPayment';
import ProjectDefinition from './pages/project/ProjectDefinition';
import { Notes as ProjectNotes, Files as ProjectFiles, Payments as ProjectPayments, Feedback as ProjectFeedback, ReportIssue } from './pages/project';
import { VideoCall } from './pages/project/VideoCall';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <VideoCallProvider>
          <ModalProvider>
            <Router>
              <div className="App">
              <Routes>
                {/* ========== PUBLIC ROUTES ========== */}
                <Route path="/" element={<NewLandingPage />} />
                <Route path="/landing-old" element={<LandingPage />} />
                <Route path="/browse-talent" element={<BrowsePage />} />
                <Route path="/browse-talent/:categorySlug" element={<BrowsePage />} />
                <Route path="/browse-jobs" element={<FindJobsPage />} />
                <Route path="/developer/:developerId" element={<TalentDetailPage />} />
                <Route path="/developer/:developerId/hire" element={<HireDeveloper />} />
                <Route path="/job/:jobId" element={<JobDetailPage />} />
                {/* Job applications now handled by modal in JobDetailPage */}
                <Route path="/search" element={<BrowsePage />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/cookies" element={<CookiePage />} />
                <Route path="/auth/login" element={<Login />} />
                <Route path="/auth/signup" element={<Signup />} />
                <Route path="/auth/forgot-password" element={<ForgotPassword />} />
                <Route path="/auth/callback" element={<SocialAuthCallback />} />
                <Route path="/auth/success" element={<AuthSuccess />} />
                <Route path="/auth/error" element={<AuthError />} />

                {/* Stripe Connect Callback Routes */}
                <Route path="/developer/stripe/callback" element={<StripeConnectCallback />} />
                <Route path="/developer/stripe/refresh" element={<StripeConnectCallback />} />

                {/* ========== PUBLIC GIG ROUTES ========== */}
                <Route path="/gigs" element={<BrowseGigs />} />
                <Route path="/gigs/:gigId" element={<GigDetail />} />

                {/* ========== PUBLIC USER PROFILE ========== */}
                <Route path="/user/:userId" element={<UserProfile />} />

                {/* ========== ONBOARDING (Protected, No Company Required) ========== */}
                <Route
                  path="/onboarding/company"
                  element={
                    <ProtectedRoute requireCompany={false}>
                      <CompanyOnboarding />
                    </ProtectedRoute>
                  }
                />

                {/* ========== COMPANY SELECTION (Protected, No Company Required) ========== */}
                <Route
                  path="/select-company"
                  element={
                    <ProtectedRoute requireCompany={false}>
                      <CompanySelectionPage />
                    </ProtectedRoute>
                  }
                />

                {/* ========== INVITATION (May not require auth depending on implementation) ========== */}
                <Route path="/invitation/accept" element={<AcceptInvitation />} />
                <Route path="/invite/:token" element={<AcceptInvitation />} />

                {/* ========== COMPANY-LEVEL PAGES - Uses MinimalLayout (no sidebar) ========== */}
                {/* These are accessed from SimpleMegaMenu company dropdown */}
                <Route
                  path="/company/:companyId"
                  element={
                    <ProtectedRoute>
                      <CompanyProvider>
                        <MinimalLayout>
                          <Outlet />
                        </MinimalLayout>
                      </CompanyProvider>
                    </ProtectedRoute>
                  }
                >
                  {/* Company Management Pages */}
                  <Route path="overview" element={<CompanyOverview />} />
                  <Route path="billing" element={<BillingSubscription />} />
                  <Route path="notifications" element={<CompanyNotifications />} />

                  {/* Settings Routes */}
                  <Route path="settings">
                    <Route index element={<Navigate to="company" replace />} />
                    <Route path="company" element={<CompanySettings />} />
                    <Route path="team" element={<TeamManagement />} />
                    <Route path="notifications" element={<NotificationSettings />} />
                    <Route path="reports" element={<AccountReports />} />
                  </Route>

                  {/* Account Routes (alias for settings) */}
                  <Route path="account">
                    <Route path="reports" element={<AccountReports />} />
                  </Route>

                  {/* Browse Projects for sellers only - has its own sidebar */}
                  <Route
                    path="seller/browse-projects"
                    element={
                      <ProtectedRoute requiredRole="seller">
                        <BrowseProjectsLayout>
                          <BrowseProjects />
                        </BrowseProjectsLayout>
                      </ProtectedRoute>
                    }
                  />
                </Route>

                {/* ========== CLIENT ROUTES - Uses MinimalLayout (no sidebar) ========== */}
                <Route
                  path="/company/:companyId/client/*"
                  element={
                    <ProtectedRoute requiredRole="client">
                      <CompanyProvider>
                        <MinimalLayout>
                          <Outlet />
                        </MinimalLayout>
                      </CompanyProvider>
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<ClientDashboard />} />
                  <Route path="projects" element={<MyProjects />} />
                  <Route path="projects/:projectId" element={<ProjectDetail />} />
                  <Route path="post-project" element={<PostProject />} />
                  <Route path="hire-requests" element={<ClientHireRequests />} />
                  <Route path="messages" element={<ClientMessages />} />
                  <Route path="contracts" element={<ClientContracts />} />
                  <Route path="payments" element={<ClientPayments />} />
                  <Route path="settings" element={<ClientSettings />} />
                  <Route path="profile" element={<ClientProfile />} />
                </Route>

                {/* ========== SELLER ROUTES - Uses MinimalLayout (no sidebar) ========== */}
                <Route
                  path="/company/:companyId/seller/*"
                  element={
                    <ProtectedRoute requiredRole="seller">
                      <CompanyProvider>
                        <MinimalLayout>
                          <Outlet />
                        </MinimalLayout>
                      </CompanyProvider>
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<DeveloperDashboard />} />
                  <Route path="projects" element={<DeveloperProjects />} />
                  <Route path="team" element={<DeveloperTeam />} />
                  <Route path="messages" element={<DeveloperMessages />} />
                  <Route path="calendar" element={<DeveloperCalendar />} />
                  <Route path="performance" element={<DeveloperPerformance />} />
                  <Route path="settings" element={<DeveloperSettings />} />
                  <Route path="profile" element={<ProfessionalProfile />} />
                  <Route path="gigs" element={<MyGigs />} />
                  <Route path="gigs/create" element={<CreateGig />} />
                  <Route path="gigs/:gigId/edit" element={<CreateGig />} />
                  <Route path="hire-requests" element={<HireRequests />} />
                </Route>

                {/* ========== VIDEO CALL ROUTE - Fullscreen without header ========== */}
                <Route
                  path="/company/:companyId/project/:projectId/video/:sessionId"
                  element={
                    <ProtectedRoute>
                      <CompanyProvider>
                        <ProjectProvider>
                          <VideoCall />
                        </ProjectProvider>
                      </CompanyProvider>
                    </ProtectedRoute>
                  }
                />

                {/* ========== PROJECT ROUTES - Uses MinimalLayout (no sidebar) ========== */}
                <Route
                  path="/company/:companyId/project/:projectId/*"
                  element={
                    <ProtectedRoute>
                      <CompanyProvider>
                        <ProjectProvider>
                          <MinimalLayout>
                            <Outlet />
                          </MinimalLayout>
                        </ProjectProvider>
                      </CompanyProvider>
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<ProjectDashboard />} />
                  <Route path="proposals" element={<ProjectProposals />} />
                  <Route path="team" element={<ProjectTeam />} />
                  <Route path="team/member/:memberId" element={<TeamMemberProfile />} />
                  <Route path="messages" element={<DeveloperMessages />} />
                  <Route path="calendar" element={<DeveloperCalendar />} />
                  <Route path="milestone-approval" element={<MilestoneApproval />} />
                  <Route path="milestone-planning" element={<MilestonePlanning />} />
                  <Route path="milestone-plan-review" element={<MilestonePlanReview />} />
                  <Route path="milestone/:milestoneId/tasks" element={<MilestoneKanban />} />
                  <Route path="communication-hub" element={<CommunicationHub />} />
                  <Route path="contract-payment" element={<ContractPayment />} />
                  <Route path="project-definition" element={<ProjectDefinition />} />
                  <Route path="notes" element={<ProjectNotes />} />
                  <Route path="files" element={<ProjectFiles />} />
                  <Route path="payments" element={<ProjectPayments />} />
                  <Route path="feedback" element={<ProjectFeedback />} />
                  <Route path="report-issue" element={<ReportIssue />} />
                  {/* Browse Projects - sellers only, accessible from within project context */}
                  <Route
                    path="seller/browse-projects"
                    element={
                      <ProtectedRoute requiredRole="seller">
                        <BrowseProjectsLayout>
                          <BrowseProjects />
                        </BrowseProjectsLayout>
                      </ProtectedRoute>
                    }
                  />

                  {/* Payment Routes */}
                  <Route path="payment">
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={<PaymentDashboard />} />
                    <Route path="milestones" element={<MilestoneManagement />} />
                    <Route path="invoice/:invoiceId" element={<InvoicePage />} />
                    <Route path="checkout/:invoiceId" element={<PaymentCheckout />} />
                    <Route path="success" element={<PaymentSuccess />} />
                    <Route path="failed" element={<PaymentFailed />} />
                  </Route>

                  {/* Contract Routes */}
                  <Route path="contract">
                    <Route path=":contractId/review" element={<ContractReview />} />
                    <Route path=":contractId/view" element={<ContractView />} />
                    <Route path=":contractId/sign" element={<ContractSign />} />
                  </Route>

                  {/* Default dashboard redirect based on role */}
                  <Route
                    path="dashboard"
                    element={<RoleDashboardRedirect />}
                  />
                  <Route index element={<Navigate to="dashboard" replace />} />
                </Route>

                {/* ========== CLIENT HIRE REQUESTS (standalone, no company context needed) ========== */}
                <Route
                  path="/client/hire-requests"
                  element={
                    <ProtectedRoute requireCompany={false}>
                      <MinimalLayout>
                        <ClientHireRequests />
                      </MinimalLayout>
                    </ProtectedRoute>
                  }
                />

                {/* ========== ACCOUNT ROUTES (standalone, no company context needed) ========== */}
                <Route
                  path="/account/reports"
                  element={
                    <ProtectedRoute requireCompany={false}>
                      <AccountReports />
                    </ProtectedRoute>
                  }
                />

                {/* ========== LEGACY REDIRECTS (for backward compatibility) ========== */}
                {/* Redirect old routes to company-scoped routes */}
                <Route path="/client/*" element={<Navigate to="/select-company" replace />} />
                <Route path="/developer/*" element={<Navigate to="/select-company" replace />} />
                <Route path="/seller/*" element={<Navigate to="/select-company" replace />} />
                <Route path="/project/:projectId/*" element={<Navigate to="/select-company" replace />} />
                <Route path="/settings/*" element={<Navigate to="/select-company" replace />} />
                <Route path="/payment/*" element={<Navigate to="/select-company" replace />} />
                <Route path="/contract/*" element={<Navigate to="/select-company" replace />} />

                {/* ========== ADMIN ROUTES - Global Admin Panel ========== */}
                <Route
                  path="/admin/*"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminLayout>
                        <Outlet />
                      </AdminLayout>
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<AdminDashboardPage />} />

                  {/* User Management */}
                  <Route path="users" element={<AdminUsersPage />} />
                  <Route path="users/:userId" element={<AdminUserDetailPage />} />

                  {/* Job Management */}
                  <Route path="jobs" element={<AdminJobsPage />} />
                  <Route path="jobs/:jobId" element={<AdminJobDetailPage />} />

                  {/* Project Management */}
                  <Route path="projects" element={<AdminProjectsPage />} />
                  <Route path="projects/:projectId" element={<AdminProjectDetailPage />} />

                  {/* Content Moderation */}
                  <Route path="reports" element={<AdminReportsPage />} />
                  <Route path="reports/:reportId" element={<AdminReportDetailPage />} />

                  {/* Communications */}
                  <Route path="communications" element={<AdminCommunicationsPage />} />
                  <Route path="communications/compose" element={<AdminComposeEmailPage />} />
                  <Route path="communications/notification" element={<AdminComposeNotificationPage />} />
                  <Route path="communications/campaigns" element={<AdminEmailCampaignsPage />} />

                  {/* FAQ Management */}
                  <Route path="faqs" element={<AdminFaqsPage />} />
                  <Route path="faqs/create" element={<AdminFaqFormPage />} />
                  <Route path="faqs/:faqId/edit" element={<AdminFaqFormPage />} />

                  {/* Data Engine */}
                  <Route path="data-engine" element={<AdminDataEngine />}>
                    <Route index element={<DataEngineDashboard />} />
                    <Route path="crawling" element={<DataEngineCrawling />} />
                    <Route path="pipelines" element={<DataEnginePipelines />} />
                    <Route path="data" element={<DataEngineData />} />
                    <Route path="entities" element={<DataEngineEntities />} />
                    <Route path="entities/:entityId" element={<DataEngineEntityProfile />} />
                    <Route path="companies" element={<DataEngineCompanies />} />
                    <Route path="companies/:companyId" element={<DataEngineCompanyProfile />} />
                    <Route path="matching" element={<DataEngineMatching />} />
                    <Route path="outreach" element={<DataEngineOutreach />} />
                    <Route path="settings" element={<DataEngineSettings />} />
                  </Route>

                  {/* Settings */}
                  <Route path="settings" element={<AdminSettingsPage />} />
                </Route>

                {/* ========== HELP & SUPPORT ========== */}
                <Route path="/help" element={<HelpSupport />} />

                {/* ========== 404 NOT FOUND ========== */}
                <Route path="/404" element={<NotFound />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
              <Toaster position="top-right" richColors />
            </Router>
          </ModalProvider>
        </VideoCallProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
