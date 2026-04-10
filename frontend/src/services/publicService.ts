/**
 * Public Service
 * Handles all public-facing API calls (no authentication required)
 * For landing pages, browse pages, and public profiles
 */

import { apiClient } from '@/lib/api-client';

// ============================================
// Types
// ============================================

export interface PublicDeveloper {
  id: string;
  name: string;
  title: string;
  tagline?: string;
  avatar?: string;
  coverImage?: string;
  rating: number;
  reviewsCount: number;
  hourlyRate: number;
  skills: (string | { name: string; level?: string; yearsOfExperience?: number; verified?: boolean })[];
  location: string;
  availability: 'available' | 'busy' | 'away';
  completedProjects: number;
  totalEarnings?: number;
  bio?: string;
  languages?: (string | { name: string; proficiency?: string })[];
  responseTime?: string;
  timezone?: string;
  successRate?: number;
  onTimeDelivery?: number;
  verified?: boolean;
  topRated?: boolean;
  joinedDate?: string;
}

export interface PublicDeveloperDetail extends PublicDeveloper {
  reviews: PublicReview[];
  portfolio?: PortfolioItem[];
  certifications?: Certification[];
  education?: Education[];
  experience?: Experience[];
  socialLinks?: SocialLinks;
}

export interface Education {
  id?: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  description?: string;
}

export interface Experience {
  id?: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description?: string;
}

export interface SocialLinks {
  github?: string;
  linkedin?: string;
  twitter?: string;
  website?: string;
  portfolio?: string;
}

export interface PublicReview {
  id: string;
  clientName: string;
  clientAvatar?: string;
  rating: number;
  comment: string;
  date: string;
  projectTitle?: string;
}

export interface PortfolioItem {
  id?: string;
  title: string;
  description: string;
  imageUrl?: string;
  projectUrl?: string;
  technologies: string[];
  completedDate?: string;
}

export interface Certification {
  id?: string;
  name: string;
  issuer: string;
  date: string;
  expiresAt?: string;
  url?: string;
}

export interface PublicJob {
  id: string;
  title: string;
  company: string;
  companyLogo?: string;
  description: string;
  type: 'full-time' | 'part-time' | 'contract' | 'freelance';
  location: string;
  remote: boolean;
  salary?: {
    min: number;
    max: number;
    currency: string;
    period: 'hourly' | 'monthly' | 'yearly';
  };
  skills: string[];
  postedAt: string;
  deadline?: string;
  applicationsCount?: number;
}

export interface PublicJobDetail extends PublicJob {
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
  companyDescription?: string;
  hasApplied?: boolean; // Whether the current user has already applied to this job
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  subcategories?: SubCategory[];
  developersCount?: number;
  jobsCount?: number;
}

export interface SubCategory {
  id: string;
  name: string;
  slug: string;
}

export interface SearchParams {
  query?: string;
  skills?: string[];
  location?: string;
  minRate?: number;
  maxRate?: number;
  availability?: string;
  minRating?: number;
  category?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  company?: string;
  avatar?: string;
  rating: number;
  content: string;
  title?: string;
  projectName?: string;
  createdAt: string;
}

export interface PublicFaq {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================
// Public Service Class
// ============================================

class PublicService {
  // ============================================
  // Developer/Talent Endpoints
  // ============================================

  /**
   * Get featured developers for landing page
   */
  async getFeaturedDevelopers(limit = 8): Promise<PublicDeveloper[]> {
    try {
      const response = await apiClient.get('/public/developers/featured', {
        params: { limit },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching featured developers:', error);
      return [];
    }
  }

  /**
   * Search and browse developers
   */
  async searchDevelopers(params: SearchParams): Promise<PaginatedResponse<PublicDeveloper>> {
    try {
      const response = await apiClient.get('/public/developers/search', { params });
      return response.data;
    } catch (error) {
      console.error('Error searching developers:', error);
      return { data: [], total: 0, page: 1, limit: 20, totalPages: 0 };
    }
  }

  /**
   * Get developer by ID (public profile)
   */
  async getDeveloperById(developerId: string): Promise<PublicDeveloperDetail | null> {
    try {
      const response = await apiClient.get(`/public/developers/${developerId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching developer:', error);
      return null;
    }
  }

  /**
   * Get developers by skill/category
   */
  async getDevelopersByCategory(
    categorySlug: string,
    page = 1,
    limit = 20
  ): Promise<PaginatedResponse<PublicDeveloper>> {
    try {
      const response = await apiClient.get(`/public/developers/category/${categorySlug}`, {
        params: { page, limit },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching developers by category:', error);
      return { data: [], total: 0, page: 1, limit: 20, totalPages: 0 };
    }
  }

  // ============================================
  // Job Endpoints
  // ============================================

  /**
   * Get featured jobs for landing page
   */
  async getFeaturedJobs(limit = 6): Promise<PublicJob[]> {
    try {
      const response = await apiClient.get('/public/jobs/featured', {
        params: { limit },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching featured jobs:', error);
      return [];
    }
  }

  /**
   * Search and browse jobs
   */
  async searchJobs(params: SearchParams): Promise<PaginatedResponse<PublicJob>> {
    try {
      const response = await apiClient.get('/public/jobs/search', { params });
      return response.data;
    } catch (error) {
      console.error('Error searching jobs:', error);
      return { data: [], total: 0, page: 1, limit: 20, totalPages: 0 };
    }
  }

  /**
   * Get job by ID
   */
  async getJobById(jobId: string): Promise<PublicJobDetail | null> {
    try {
      const response = await apiClient.get(`/public/jobs/${jobId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching job:', error);
      return null;
    }
  }

  /**
   * Get jobs by category
   */
  async getJobsByCategory(
    categorySlug: string,
    page = 1,
    limit = 20
  ): Promise<PaginatedResponse<PublicJob>> {
    try {
      const response = await apiClient.get(`/public/jobs/category/${categorySlug}`, {
        params: { page, limit },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching jobs by category:', error);
      return { data: [], total: 0, page: 1, limit: 20, totalPages: 0 };
    }
  }

  // ============================================
  // Category Endpoints
  // ============================================

  /**
   * Get featured categories for landing page
   */
  async getFeaturedCategories(limit = 8): Promise<Category[]> {
    try {
      const response = await apiClient.get('/public/categories/featured', {
        params: { limit },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching featured categories:', error);
      return [];
    }
  }

  /**
   * Get all categories
   */
  async getAllCategories(): Promise<Category[]> {
    try {
      const response = await apiClient.get('/public/categories');
      return response.data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  }

  /**
   * Get category by slug
   */
  async getCategoryBySlug(slug: string): Promise<Category | null> {
    try {
      const response = await apiClient.get(`/public/categories/${slug}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching category:', error);
      return null;
    }
  }

  // ============================================
  // Stats Endpoints (for landing page)
  // ============================================

  /**
   * Get platform statistics for landing page
   */
  async getPlatformStats(): Promise<{
    totalDevelopers: number;
    totalProjects: number;
    totalClients: number;
    successRate: number;
  }> {
    try {
      const response = await apiClient.get('/public/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching platform stats:', error);
      return {
        totalDevelopers: 0,
        totalProjects: 0,
        totalClients: 0,
        successRate: 0,
      };
    }
  }

  // ============================================
  // Testimonials Endpoints
  // ============================================

  /**
   * Get testimonials for landing page
   */
  async getTestimonials(limit = 6): Promise<Testimonial[]> {
    try {
      const response = await apiClient.get('/public/testimonials', {
        params: { limit },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching testimonials:', error);
      return [];
    }
  }

  // ============================================
  // FAQ Endpoints
  // ============================================

  /**
   * Get published FAQs for landing page
   */
  async getFaqs(category?: string): Promise<PublicFaq[]> {
    try {
      const response = await apiClient.get('/public/faqs', {
        params: category ? { category } : {},
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching FAQs:', error);
      return [];
    }
  }
}

// Export singleton instance
export const publicService = new PublicService();
export default publicService;
