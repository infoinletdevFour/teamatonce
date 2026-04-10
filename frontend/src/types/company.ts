/**
 * Company Management Types for Team@Once
 * Matching backend schema from /backend/src/modules/company/dto/company.dto.ts
 */

// ============================================================================
// Enums
// ============================================================================

export enum AccountType {
  SOLO = 'solo',
  TEAM = 'team',
  COMPANY = 'company',
}

export enum BusinessType {
  INDIVIDUAL = 'individual',
  LLC = 'llc',
  CORPORATION = 'corporation',
  PARTNERSHIP = 'partnership',
}

export enum CompanySize {
  SOLO = '1',
  SMALL = '2-10',
  MEDIUM = '11-50',
  LARGE = '51-200',
  ENTERPRISE = '201+',
}

export enum SubscriptionTier {
  FREE = 'free',
  BASIC = 'basic',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  TRIAL = 'trial',
  CANCELLED = 'cancelled',
  PAST_DUE = 'past_due',
}

export enum MemberRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
}

export enum MemberStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum InvitationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  CANCELLED = 'cancelled',
}

// ============================================================================
// Address Types
// ============================================================================

export interface BusinessAddress {
  street?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}

// ============================================================================
// Company Interfaces
// ============================================================================

export interface Company {
  id: string;
  owner_id: string;
  account_type: AccountType;
  company_name: string;
  display_name: string;
  business_type: BusinessType;
  tax_id?: string;
  company_size: CompanySize;
  website?: string;
  description?: string;
  logo_url?: string;
  business_email?: string;
  business_phone?: string;
  business_address: BusinessAddress;
  timezone: string;
  currency: string;
  language: string;
  settings: Record<string, any>;
  subscription_tier: SubscriptionTier;
  subscription_status: SubscriptionStatus;
  stripe_customer_id?: string;
  is_active: boolean;
  is_verified: boolean;
  verified_at?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface CreateCompanyData {
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
  business_address?: BusinessAddress;
  timezone?: string;
  currency?: string;
  language?: string;
}

export interface UpdateCompanyData {
  account_type?: AccountType;
  display_name?: string;
  company_name?: string;
  business_type?: BusinessType;
  tax_id?: string;
  company_size?: CompanySize;
  website?: string;
  description?: string;
  logo_url?: string;
  business_email?: string;
  business_phone?: string;
  business_address?: BusinessAddress;
  is_active?: boolean;
}

export interface UpdateCompanySettingsData {
  timezone?: string;
  currency?: string;
  language?: string;
  settings?: Record<string, any>;
}

// ============================================================================
// Company Stats
// ============================================================================

export interface CompanyStats {
  total_members: number;
  active_members: number;
  pending_invitations: number;
  active_projects: number;
  completed_projects: number;
  total_revenue: number;
  monthly_revenue: number;
  average_rating: number;
  total_hours_worked: number;
  on_time_delivery_rate: number;
}

export interface CompanyOverview extends Company {
  stats: CompanyStats;
}

// ============================================================================
// Company Member Interfaces
// ============================================================================

export interface CompanyMember {
  id: string;
  company_id: string;
  user_id: string;
  role: MemberRole;
  status: MemberStatus;
  permissions: string[];
  joined_at: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

export interface UpdateMemberData {
  role?: MemberRole;
  status?: MemberStatus;
  permissions?: string[];
}

export interface MemberWorkload {
  member_id: string;
  member_name: string;
  current_projects: number;
  total_hours_allocated: number;
  capacity_percentage: number;
  projects: Array<{
    project_id: string;
    project_name: string;
    hours_allocated: number;
    completion_percentage: number;
  }>;
}

export interface TeamWorkload {
  company_id: string;
  total_members: number;
  average_capacity: number;
  members: MemberWorkload[];
}

// ============================================================================
// Invitation Interfaces
// ============================================================================

export interface Invitation {
  id: string;
  company_id: string;
  invited_email: string;
  invited_by: string;
  role: MemberRole;
  status: InvitationStatus;
  token: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
  company?: {
    id: string;
    company_name: string;
    display_name: string;
    logo_url?: string;
  };
  inviter?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CreateInvitationData {
  invited_email: string;
  role: MemberRole;
  message?: string;
}

export interface AcceptInvitationData {
  accept: boolean;
}

// ============================================================================
// Filter & Query Interfaces
// ============================================================================

export interface MemberFilters {
  role?: MemberRole;
  status?: MemberStatus;
}

export interface InvitationFilters {
  status?: InvitationStatus;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface CompanyApiResponse {
  success: boolean;
  data: Company;
  message?: string;
}

export interface CompaniesApiResponse {
  success: boolean;
  data: Company[];
  message?: string;
}

export interface CompanyStatsApiResponse {
  success: boolean;
  data: CompanyStats;
  message?: string;
}

export interface CompanyMemberApiResponse {
  success: boolean;
  data: CompanyMember;
  message?: string;
}

export interface CompanyMembersApiResponse {
  success: boolean;
  data: CompanyMember[];
  message?: string;
}

export interface InvitationApiResponse {
  success: boolean;
  data: Invitation;
  message?: string;
}

export interface InvitationsApiResponse {
  success: boolean;
  data: Invitation[];
  message?: string;
}

// ============================================================================
// Dashboard & Analytics Types (for Developer Dashboard)
// ============================================================================

export interface RevenueData {
  month: string;
  revenue: number;
  projects?: number;
  expenses?: number;
  profit?: number;
}

export interface ActiveProject {
  id: string;
  name: string;
  client: string;
  status: 'active' | 'on-hold' | 'completed' | 'pending';
  budget: number;
  spent: number;
  progress: number;
  teamMembers: string[];
  dueDate: string;
}

export interface Activity {
  id: string;
  type: 'project' | 'milestone' | 'payment' | 'team' | 'task';
  message: string;
  timestamp: string;
  userId?: string;
  projectId?: string;
}

export interface PerformanceMetrics {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  onTimeDelivery: number;
  codeQuality: number;
  clientSatisfaction: number;
  averageRating: number;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  workload: number;
  projects: number;
  status: 'available' | 'busy' | 'away';
}
