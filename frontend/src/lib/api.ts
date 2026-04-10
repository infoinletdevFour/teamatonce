/**
 * Centralized API Client for Team@Once
 * Production-ready API client with TypeScript support, token management, and error handling
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

// ============================================================================
// Configuration
// ============================================================================

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';
const TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

// ============================================================================
// TypeScript Interfaces
// ============================================================================

// Authentication Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  email: string;
  password: string;
  name: string;
  role?: 'client' | 'seller' | 'designer' | 'project-manager';
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'client' | 'seller' | 'designer' | 'project-manager' | 'admin';
  companyId?: string;
  timezone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

// Company Types
export interface Company {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  website?: string;
  industry?: string;
  size?: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  address?: string;
  country?: string;
  timezone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCompanyData {
  name: string;
  description?: string;
  logo?: string;
  website?: string;
  industry?: string;
  size?: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  address?: string;
  country?: string;
  timezone?: string;
}

export interface UpdateCompanyData extends Partial<CreateCompanyData> {}

export interface CompanyStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalTeamMembers: number;
  totalSpent: number;
  pendingInvoices: number;
  upcomingMilestones: number;
}

// Team Member Types
export interface TeamMember {
  id: string;
  userId: string;
  companyId: string;
  user: User;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  permissions?: string[];
  status: 'active' | 'inactive' | 'pending';
  joinedAt: string;
  updatedAt: string;
}

export interface AddTeamMemberData {
  userId?: string;
  email?: string;
  role: 'admin' | 'member' | 'viewer';
  permissions?: string[];
}

export interface UpdateTeamMemberData {
  role?: 'admin' | 'member' | 'viewer';
  permissions?: string[];
  status?: 'active' | 'inactive';
}

// Invitation Types
export interface Invitation {
  id: string;
  companyId: string;
  email: string;
  role: 'admin' | 'member' | 'viewer';
  token: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  invitedBy: string;
  invitedByUser?: User;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface SendInvitationData {
  email: string;
  role: 'admin' | 'member' | 'viewer';
  permissions?: string[];
  message?: string;
}

export interface AcceptInvitationData {
  token: string;
  name?: string;
  password?: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
  statusCode?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================================================
// Token Management
// ============================================================================

class TokenManager {
  static getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  }

  static setToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TOKEN_KEY, token);
  }

  static removeToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
  }

  static getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  static setRefreshToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  }

  static removeRefreshToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  static clearAll(): void {
    this.removeToken();
    this.removeRefreshToken();
  }
}

// ============================================================================
// Axios Instance Configuration
// ============================================================================

class ApiClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (reason?: any) => void;
  }> = [];

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor - attach token
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = TokenManager.getToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - handle errors and token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
          _retry?: boolean;
        };

        // Handle 401 errors (token expiration)
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // Queue failed requests while refreshing
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then(() => {
                return this.client(originalRequest);
              })
              .catch((err) => {
                return Promise.reject(err);
              });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          const refreshToken = TokenManager.getRefreshToken();

          if (!refreshToken) {
            this.handleLogout();
            return Promise.reject(error);
          }

          try {
            const response = await this.client.post<RefreshTokenResponse>(
              '/auth/refresh',
              { refreshToken }
            );

            const { accessToken, refreshToken: newRefreshToken } = response.data;

            TokenManager.setToken(accessToken);
            TokenManager.setRefreshToken(newRefreshToken);

            // Retry all queued requests
            this.failedQueue.forEach((promise) => {
              promise.resolve();
            });
            this.failedQueue = [];

            return this.client(originalRequest);
          } catch (refreshError) {
            this.failedQueue.forEach((promise) => {
              promise.reject(refreshError);
            });
            this.failedQueue = [];
            this.handleLogout();
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(this.handleError(error));
      }
    );
  }

  private handleError(error: AxiosError): ApiError {
    if (error.response) {
      // Server responded with error
      const data = error.response.data as any;
      return {
        success: false,
        message: data?.message || 'An error occurred',
        errors: data?.errors,
        statusCode: error.response.status,
      };
    } else if (error.request) {
      // Request made but no response
      return {
        success: false,
        message: 'No response from server. Please check your connection.',
        statusCode: 0,
      };
    } else {
      // Error setting up request
      return {
        success: false,
        message: error.message || 'An unexpected error occurred',
      };
    }
  }

  private handleLogout(): void {
    TokenManager.clearAll();
    // DO NOT redirect here - let AuthContext handle navigation
    // The 401 error will be caught by components and AuthContext will redirect properly
    console.warn('[API Client] User logged out - tokens cleared');
  }

  // ============================================================================
  // Authentication Endpoints
  // ============================================================================

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/auth/login', credentials);
    const { accessToken, refreshToken } = response.data;
    TokenManager.setToken(accessToken);
    TokenManager.setRefreshToken(refreshToken);
    return response.data;
  }

  async signup(credentials: SignupCredentials): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/auth/register', credentials);
    const { accessToken, refreshToken } = response.data;
    TokenManager.setToken(accessToken);
    TokenManager.setRefreshToken(refreshToken);
    return response.data;
  }

  async logout(): Promise<void> {
    try {
      await this.client.post('/auth/logout');
    } finally {
      TokenManager.clearAll();
    }
  }

  async resetPassword(data: ResetPasswordRequest): Promise<{ message: string }> {
    const response = await this.client.post<{ message: string }>(
      '/auth/forgot-password',
      data
    );
    return response.data;
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.client.get<{ user: User }>('/auth/me');
    return response.data.user;
  }

  async refreshToken(): Promise<RefreshTokenResponse> {
    const refreshToken = TokenManager.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await this.client.post<RefreshTokenResponse>('/auth/refresh', {
      refreshToken,
    });

    const { accessToken, refreshToken: newRefreshToken } = response.data;
    TokenManager.setToken(accessToken);
    TokenManager.setRefreshToken(newRefreshToken);

    return response.data;
  }

  // ============================================================================
  // Company Management Endpoints
  // ============================================================================

  async createCompany(data: CreateCompanyData): Promise<Company> {
    const response = await this.client.post<Company>('/companies', data);
    return response.data;
  }

  async getCompany(companyId: string): Promise<Company> {
    const response = await this.client.get<Company>(`/companies/${companyId}`);
    return response.data;
  }

  async updateCompany(companyId: string, data: UpdateCompanyData): Promise<Company> {
    const response = await this.client.patch<Company>(`/companies/${companyId}`, data);
    return response.data;
  }

  async getCompanyStats(companyId: string): Promise<CompanyStats> {
    const response = await this.client.get<CompanyStats>(
      `/companies/${companyId}/stats`
    );
    return response.data;
  }

  async deleteCompany(companyId: string): Promise<{ message: string }> {
    const response = await this.client.delete<{ message: string }>(
      `/companies/${companyId}`
    );
    return response.data;
  }

  // ============================================================================
  // Team Member Endpoints
  // ============================================================================

  async getTeamMembers(companyId: string): Promise<TeamMember[]> {
    const response = await this.client.get<TeamMember[]>(
      `/companies/${companyId}/team-members`
    );
    return response.data;
  }

  async addTeamMember(companyId: string, data: AddTeamMemberData): Promise<TeamMember> {
    const response = await this.client.post<TeamMember>(
      `/companies/${companyId}/team-members`,
      data
    );
    return response.data;
  }

  async updateTeamMember(
    memberId: string,
    data: UpdateTeamMemberData
  ): Promise<TeamMember> {
    const response = await this.client.patch<TeamMember>(
      `/team-members/${memberId}`,
      data
    );
    return response.data;
  }

  async removeTeamMember(memberId: string): Promise<{ message: string }> {
    const response = await this.client.delete<{ message: string }>(
      `/team-members/${memberId}`
    );
    return response.data;
  }

  async getTeamMember(memberId: string): Promise<TeamMember> {
    const response = await this.client.get<TeamMember>(`/team-members/${memberId}`);
    return response.data;
  }

  // ============================================================================
  // Invitation Endpoints
  // ============================================================================

  async sendInvitation(
    companyId: string,
    data: SendInvitationData
  ): Promise<Invitation> {
    const response = await this.client.post<Invitation>(
      `/companies/${companyId}/invitations`,
      data
    );
    return response.data;
  }

  async getInvitations(companyId: string): Promise<Invitation[]> {
    const response = await this.client.get<Invitation[]>(
      `/companies/${companyId}/invitations`
    );
    return response.data;
  }

  async acceptInvitation(data: AcceptInvitationData): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>(
      '/invitations/accept',
      data
    );
    const { accessToken, refreshToken } = response.data;
    TokenManager.setToken(accessToken);
    TokenManager.setRefreshToken(refreshToken);
    return response.data;
  }

  async revokeInvitation(invitationId: string): Promise<{ message: string }> {
    const response = await this.client.delete<{ message: string }>(
      `/invitations/${invitationId}`
    );
    return response.data;
  }

  async resendInvitation(invitationId: string): Promise<Invitation> {
    const response = await this.client.post<Invitation>(
      `/invitations/${invitationId}/resend`
    );
    return response.data;
  }

  async getInvitationByToken(token: string): Promise<Invitation> {
    const response = await this.client.get<Invitation>(`/invitations/token/${token}`);
    return response.data;
  }

  // ============================================================================
  // Social Authentication Endpoints
  // ============================================================================

  async getSocialAuthUrl(
    provider: string
  ): Promise<{ authUrl: string; state?: string }> {
    // Get database OAuth URL from backend
    const response = await this.client.get<{ oauthUrl: string; provider: string }>(
      `/auth/social/${provider}/url`
    );
    return { authUrl: response.data.oauthUrl };
  }

  async handleSocialAuthCallback(
    provider: string,
    code: string,
    state: string
  ): Promise<AuthResponse & { isNewUser: boolean }> {
    const response = await this.client.post<AuthResponse & { isNewUser: boolean }>(
      `/auth/social/${provider}/callback`,
      {
        code,
        state,
      }
    );

    const { accessToken, refreshToken } = response.data;
    TokenManager.setToken(accessToken);
    TokenManager.setRefreshToken(refreshToken);

    return response.data;
  }

  async linkSocialAccount(
    email: string,
    password: string,
    provider: string,
    socialToken: string
  ): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/auth/social/link', {
      email,
      password,
      provider,
      socialToken,
    });

    const { accessToken, refreshToken } = response.data;
    TokenManager.setToken(accessToken);
    TokenManager.setRefreshToken(refreshToken);

    return response.data;
  }

  async unlinkSocialAccount(provider: string): Promise<{ message: string }> {
    const response = await this.client.delete<{ message: string }>(
      `/auth/social/unlink/${provider}`
    );
    return response.data;
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  getClient(): AxiosInstance {
    return this.client;
  }

  isAuthenticated(): boolean {
    return !!TokenManager.getToken();
  }

  getAuthToken(): string | null {
    return TokenManager.getToken();
  }

  setAuthToken(token: string): void {
    TokenManager.setToken(token);
  }

  clearAuth(): void {
    TokenManager.clearAll();
  }
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

const api = new ApiClient();

export default api;

// Export utility functions
export { TokenManager };

// Export the ApiClient class for testing purposes
export { ApiClient };
