/**
 * Google Analytics 4 Integration
 *
 * This utility provides GA4 tracking functions for Team@Once.
 * It only tracks when GA_MEASUREMENT_ID is configured in production.
 */

// Get GA4 Measurement ID from environment or use default
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-L80MBT221E';

// Check if analytics is enabled
const isAnalyticsEnabled = (): boolean => {
  return Boolean(GA_MEASUREMENT_ID && GA_MEASUREMENT_ID !== 'G-XXXXXXXXXX');
};

// Google Analytics global object (gtag)
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

/**
 * Initialize Google Analytics
 * Call this once when the app starts
 */
export const initializeAnalytics = (): void => {
  if (!isAnalyticsEnabled()) {
    return;
  }

  // gtag is loaded via script tag in index.html
};

/**
 * Track page views
 * Call this on route changes
 */
export const trackPageView = (page_path: string, page_title?: string): void => {
  if (!isAnalyticsEnabled() || !window.gtag) return;

  window.gtag('event', 'page_view', {
    page_path,
    page_title: page_title || document.title,
  });
};

/**
 * Track custom events
 * Use this for user interactions like button clicks, form submissions, etc.
 */
export const trackEvent = (
  eventName: string,
  eventParams?: Record<string, unknown>
): void => {
  if (!isAnalyticsEnabled() || !window.gtag) return;

  window.gtag('event', eventName, eventParams);
};

/**
 * Track user sign-up conversions
 */
export const trackSignUp = (method: 'email' | 'google' | 'github' = 'email'): void => {
  trackEvent('sign_up', {
    method,
  });
};

/**
 * Track user login
 */
export const trackLogin = (method: 'email' | 'google' | 'github' = 'email'): void => {
  trackEvent('login', {
    method,
  });
};

/**
 * Track project created
 */
export const trackProjectCreated = (projectType?: string): void => {
  trackEvent('project_created', {
    project_type: projectType,
    event_category: 'engagement',
  });
};

/**
 * Track developer hired
 */
export const trackDeveloperHired = (developerRole?: string, projectId?: string): void => {
  trackEvent('developer_hired', {
    developer_role: developerRole,
    project_id: projectId,
    event_category: 'conversion',
  });
};

/**
 * Track milestone completed
 */
export const trackMilestoneCompleted = (projectId: string, milestoneName?: string): void => {
  trackEvent('milestone_completed', {
    project_id: projectId,
    milestone_name: milestoneName,
    event_category: 'engagement',
  });
};

/**
 * Track payment made
 */
export const trackPaymentMade = (amount: number, currency: string, paymentType?: string): void => {
  trackEvent('payment_made', {
    value: amount,
    currency,
    payment_type: paymentType,
    event_category: 'conversion',
  });
};

/**
 * Track contract signed
 */
export const trackContractSigned = (projectId: string, contractValue?: number): void => {
  trackEvent('contract_signed', {
    project_id: projectId,
    contract_value: contractValue,
    event_category: 'conversion',
  });
};

/**
 * Track proposal submitted
 */
export const trackProposalSubmitted = (projectId: string): void => {
  trackEvent('proposal_submitted', {
    project_id: projectId,
    event_category: 'engagement',
  });
};

/**
 * Track gig posted
 */
export const trackGigPosted = (gigCategory?: string, budget?: number): void => {
  trackEvent('gig_posted', {
    gig_category: gigCategory,
    budget,
    event_category: 'engagement',
  });
};

/**
 * Track gig application
 */
export const trackGigApplication = (gigId: string): void => {
  trackEvent('gig_application', {
    gig_id: gigId,
    event_category: 'engagement',
  });
};

/**
 * Track team member invited
 */
export const trackTeamMemberInvited = (teamSize?: number): void => {
  trackEvent('team_member_invited', {
    current_team_size: teamSize,
    event_category: 'engagement',
  });
};

/**
 * Track message sent
 */
export const trackMessageSent = (conversationType?: string): void => {
  trackEvent('message_sent', {
    conversation_type: conversationType,
    event_category: 'engagement',
  });
};

/**
 * Track task completed
 */
export const trackTaskCompleted = (projectId: string): void => {
  trackEvent('task_completed', {
    project_id: projectId,
    event_category: 'engagement',
  });
};

/**
 * Track profile viewed
 */
export const trackProfileViewed = (profileType: 'developer' | 'company', profileId: string): void => {
  trackEvent('profile_viewed', {
    profile_type: profileType,
    profile_id: profileId,
    event_category: 'engagement',
  });
};

/**
 * Track search performed
 */
export const trackSearch = (searchType: string, searchTerm: string, resultsCount: number): void => {
  trackEvent('search', {
    search_type: searchType,
    search_term: searchTerm,
    results_count: resultsCount,
    event_category: 'engagement',
  });
};

/**
 * Track subscription/plan selection
 */
export const trackPlanSelected = (plan: string, billing: 'monthly' | 'yearly'): void => {
  trackEvent('select_plan', {
    plan_name: plan,
    billing_cycle: billing,
    event_category: 'conversion',
  });
};

/**
 * Track feature usage
 */
export const trackFeatureUsed = (feature: string): void => {
  trackEvent('feature_used', {
    feature_name: feature,
    event_category: 'engagement',
  });
};

/**
 * Track file uploads
 */
export const trackFileUpload = (fileType: string, fileSize: number): void => {
  trackEvent('file_upload', {
    file_type: fileType,
    file_size: fileSize,
    event_category: 'engagement',
  });
};

/**
 * Track errors for monitoring
 */
export const trackError = (errorMessage: string, errorLocation: string): void => {
  trackEvent('exception', {
    description: errorMessage,
    fatal: false,
    location: errorLocation,
  });
};

/**
 * Track outbound link clicks
 */
export const trackOutboundLink = (url: string, label?: string): void => {
  trackEvent('click', {
    event_category: 'outbound',
    event_label: label || url,
    value: url,
  });
};

/**
 * Track CTA button clicks
 */
export const trackCTAClick = (ctaName: string, location: string): void => {
  trackEvent('cta_click', {
    cta_name: ctaName,
    page_location: location,
    event_category: 'engagement',
  });
};

/**
 * Track browse talent page usage
 */
export const trackBrowseTalent = (category?: string, filters?: Record<string, unknown>): void => {
  trackEvent('browse_talent', {
    category,
    ...filters,
    event_category: 'engagement',
  });
};

/**
 * Track workspace created
 */
export const trackWorkspaceCreated = (workspaceName?: string): void => {
  trackEvent('workspace_created', {
    workspace_name: workspaceName,
    event_category: 'engagement',
  });
};

/**
 * Set user properties (for logged-in users)
 */
export const setUserProperties = (properties: Record<string, unknown>): void => {
  if (!isAnalyticsEnabled() || !window.gtag) return;

  window.gtag('set', 'user_properties', properties);
};

/**
 * Set user ID (for logged-in users)
 */
export const setUserId = (userId: string): void => {
  if (!isAnalyticsEnabled() || !window.gtag) return;

  window.gtag('config', GA_MEASUREMENT_ID, {
    user_id: userId,
  });
};

export default {
  initializeAnalytics,
  trackPageView,
  trackEvent,
  trackSignUp,
  trackLogin,
  trackProjectCreated,
  trackDeveloperHired,
  trackMilestoneCompleted,
  trackPaymentMade,
  trackContractSigned,
  trackProposalSubmitted,
  trackGigPosted,
  trackGigApplication,
  trackTeamMemberInvited,
  trackMessageSent,
  trackTaskCompleted,
  trackProfileViewed,
  trackSearch,
  trackPlanSelected,
  trackFeatureUsed,
  trackFileUpload,
  trackError,
  trackOutboundLink,
  trackCTAClick,
  trackBrowseTalent,
  trackWorkspaceCreated,
  setUserProperties,
  setUserId,
};
