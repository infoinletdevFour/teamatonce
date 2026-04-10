/**
 * Hire Request Service
 *
 * Service layer for hire request API calls
 * Handles direct hire requests from clients to sellers
 */

import { apiClient } from '@/lib/api-client';

export type PaymentType = 'hourly' | 'fixed';

export type HireRequestStatus = 'pending' | 'negotiating' | 'accepted' | 'rejected' | 'withdrawn' | 'expired';

export interface CreateHireRequestData {
  companyId: string;
  projectId?: string; // Optional: Link to existing project (if not provided, new project will be created)
  title: string;
  description: string;
  category: string;
  paymentType: PaymentType;
  hourlyRate?: number;
  estimatedHours?: number;
  fixedBudget?: number;
  startDate: string;
  duration: string;
  additionalDetails?: string;
  attachmentUrls?: string[];
}

export interface UpdateHireRequestData {
  title?: string;
  description?: string;
  category?: string;
  paymentType?: PaymentType;
  hourlyRate?: number;
  estimatedHours?: number;
  fixedBudget?: number;
  startDate?: string;
  duration?: string;
  additionalDetails?: string;
  attachmentUrls?: string[];
}

export interface ReviewHireRequestData {
  status: 'accepted' | 'rejected';
  responseMessage?: string;
}

export interface HireRequest {
  id: string;
  clientId: string;
  companyId: string;
  projectId?: string; // Linked project ID
  title: string;
  description: string;
  category: string;
  paymentType: PaymentType;
  hourlyRate?: number;
  estimatedHours?: number;
  fixedBudget?: number;
  totalBudget: number;
  startDate: string;
  duration: string;
  additionalDetails?: string;
  attachmentUrls?: string[];
  status: HireRequestStatus;
  responseMessage?: string;
  respondedAt?: string;
  createdAt: string;
  updatedAt: string;
  client?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  company?: {
    id: string;
    name: string;
    logo?: string;
  };
}

export interface HireRequestsResponse {
  hireRequests: HireRequest[];
  total: number;
}

/**
 * Create a new hire request (Client -> Seller)
 */
export const createHireRequest = async (
  data: CreateHireRequestData
): Promise<HireRequest> => {
  try {
    const response = await apiClient.post<HireRequest>('/hire-requests', data);
    return response.data;
  } catch (error: any) {
    console.error('Error creating hire request:', error);
    throw new Error(error.response?.data?.message || 'Failed to create hire request');
  }
};

/**
 * Get all hire requests sent by the current client
 */
export const getClientHireRequests = async (): Promise<HireRequest[]> => {
  try {
    const response = await apiClient.get<HireRequestsResponse>('/hire-requests/client');
    return response.data.hireRequests || [];
  } catch (error: any) {
    console.error('Error fetching client hire requests:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch hire requests');
  }
};

/**
 * Get all hire requests for a company (Seller view)
 */
export const getCompanyHireRequests = async (
  companyId: string
): Promise<HireRequest[]> => {
  try {
    const response = await apiClient.get<HireRequestsResponse>(
      `/hire-requests/company/${companyId}`
    );
    return response.data.hireRequests || [];
  } catch (error: any) {
    console.error('Error fetching company hire requests:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch hire requests');
  }
};

/**
 * Get single hire request by ID
 */
export const getHireRequest = async (hireRequestId: string): Promise<HireRequest> => {
  try {
    const response = await apiClient.get<HireRequest>(`/hire-requests/${hireRequestId}`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching hire request:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch hire request');
  }
};

/**
 * Update hire request before response (Client only)
 */
export const updateHireRequest = async (
  hireRequestId: string,
  data: UpdateHireRequestData
): Promise<HireRequest> => {
  try {
    const response = await apiClient.put<HireRequest>(
      `/hire-requests/${hireRequestId}`,
      data
    );
    return response.data;
  } catch (error: any) {
    console.error('Error updating hire request:', error);
    throw new Error(error.response?.data?.message || 'Failed to update hire request');
  }
};

/**
 * Review hire request - accept or reject (Seller)
 */
export const reviewHireRequest = async (
  hireRequestId: string,
  data: ReviewHireRequestData
): Promise<HireRequest> => {
  try {
    const response = await apiClient.put<HireRequest>(
      `/hire-requests/${hireRequestId}/review`,
      data
    );
    return response.data;
  } catch (error: any) {
    console.error('Error reviewing hire request:', error);
    throw new Error(error.response?.data?.message || 'Failed to review hire request');
  }
};

/**
 * Withdraw hire request (Client only)
 */
export const withdrawHireRequest = async (hireRequestId: string): Promise<HireRequest> => {
  try {
    const response = await apiClient.delete<HireRequest>(`/hire-requests/${hireRequestId}`);
    return response.data;
  } catch (error: any) {
    console.error('Error withdrawing hire request:', error);
    throw new Error(error.response?.data?.message || 'Failed to withdraw hire request');
  }
};

/**
 * Export all service functions
 */
export const hireRequestService = {
  createHireRequest,
  getClientHireRequests,
  getCompanyHireRequests,
  getHireRequest,
  updateHireRequest,
  reviewHireRequest,
  withdrawHireRequest,
};

export default hireRequestService;
