/**
 * Invitation Service
 * Service for managing team invitations
 */

import { apiClient, ApiResponse } from '@/lib/api-client';
import {
  Invitation,
  SendInvitationData,
  AcceptInvitationData,
  InvitationDetails,
  ResendInvitationResponse,
  RevokeInvitationResponse,
} from '@/types/invitation';

/**
 * Send team invitation
 * @param companyId - Company ID to send invitation for
 * @param data - Invitation data
 * @returns Promise with created invitation
 */
export const sendInvitation = async (
  companyId: string,
  data: SendInvitationData
): Promise<Invitation> => {
  try {
    const response = await apiClient.post<ApiResponse<Invitation>>(
      `/company/${companyId}/invitations`,
      data
    );
    return response.data.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to send invitation');
  }
};

/**
 * Get all invitations for a company
 * @param companyId - Company ID
 * @returns Promise with array of invitations
 */
export const getInvitations = async (companyId: string): Promise<Invitation[]> => {
  try {
    const response = await apiClient.get<Invitation[]>(
      `/company/${companyId}/invitations`
    );
    // Backend returns array directly, not wrapped in ApiResponse
    return Array.isArray(response.data) ? response.data : [];
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch invitations');
  }
};

/**
 * Get invitation details by token
 * @param token - Invitation token
 * @returns Promise with invitation details
 */
export const getInvitationByToken = async (token: string): Promise<InvitationDetails> => {
  try {
    const response = await apiClient.get<any>(
      `/invitations/${token}`
    );
    // Backend returns {success: true, invitation: {...}}
    // Not wrapped in the standard ApiResponse format
    return response.data.invitation || response.data.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch invitation details');
  }
};

/**
 * Accept invitation
 * @param data - Accept invitation data with token
 * @returns Promise with success response
 */
export const acceptInvitation = async (data: AcceptInvitationData): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await apiClient.post<ApiResponse<{ success: boolean; message: string }>>(
      `/invitations/${data.token}/accept`,
      {}
    );
    return response.data.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to accept invitation');
  }
};

/**
 * Decline invitation
 * @param token - Invitation token
 * @returns Promise with success response
 */
export const declineInvitation = async (token: string): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await apiClient.post<ApiResponse<{ success: boolean; message: string }>>(
      `/invitations/${token}/decline`,
      {}
    );
    return response.data.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to decline invitation');
  }
};

/**
 * Revoke invitation
 * @param companyId - Company ID
 * @param invitationId - Invitation ID to revoke
 * @returns Promise with revoke response
 */
export const revokeInvitation = async (
  companyId: string,
  invitationId: string
): Promise<RevokeInvitationResponse> => {
  try {
    const response = await apiClient.delete<ApiResponse<RevokeInvitationResponse>>(
      `/company/${companyId}/invitations/${invitationId}`
    );
    return response.data.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to revoke invitation');
  }
};

/**
 * Resend invitation
 * @param companyId - Company ID
 * @param invitationId - Invitation ID to resend
 * @returns Promise with resend response
 */
export const resendInvitation = async (
  companyId: string,
  invitationId: string
): Promise<ResendInvitationResponse> => {
  try {
    const response = await apiClient.post<ApiResponse<ResendInvitationResponse>>(
      `/company/${companyId}/invitations/${invitationId}/resend`,
      {}
    );
    return response.data.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to resend invitation');
  }
};

/**
 * Check if invitation is expired
 * @param expiresAt - Expiration date string
 * @returns Boolean indicating if invitation is expired
 */
export const isInvitationExpired = (expiresAt: string): boolean => {
  return new Date(expiresAt) < new Date();
};

/**
 * Get time remaining for invitation
 * @param expiresAt - Expiration date string
 * @returns String representation of time remaining
 */
export const getTimeRemaining = (expiresAt: string): string => {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diff = expiry.getTime() - now.getTime();

  if (diff <= 0) {
    return 'Expired';
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} remaining`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} remaining`;
  } else {
    return `${minutes} minute${minutes > 1 ? 's' : ''} remaining`;
  }
};

export default {
  sendInvitation,
  getInvitations,
  getInvitationByToken,
  acceptInvitation,
  declineInvitation,
  revokeInvitation,
  resendInvitation,
  isInvitationExpired,
  getTimeRemaining,
};
