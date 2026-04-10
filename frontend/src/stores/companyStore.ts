/**
 * Company Store - Zustand state management for Company data
 * Manages company state, members, invitations, and statistics
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  Company,
  CompanyStats,
  CompanyMember,
  Invitation,
  CreateCompanyData,
  UpdateCompanyData,
  UpdateCompanySettingsData,
  UpdateMemberData,
  CreateInvitationData,
  MemberFilters,
  InvitationFilters,
} from '../types/company';
import companyService from '../services/companyService';

// ============================================================================
// State Interface
// ============================================================================

interface CompanyState {
  // Current company data
  currentCompany: Company | null;
  companies: Company[];
  companyStats: CompanyStats | null;

  // Members data
  members: CompanyMember[];
  currentMembership: CompanyMember | null;

  // Invitations data
  invitations: Invitation[];

  // Loading states
  isLoading: boolean;
  isLoadingStats: boolean;
  isLoadingMembers: boolean;
  isLoadingInvitations: boolean;

  // Error states
  error: string | null;

  // Actions - Company CRUD
  fetchUserCompanies: () => Promise<void>;
  fetchCompany: (companyId: string) => Promise<void>;
  createCompany: (data: CreateCompanyData) => Promise<Company>;
  updateCompany: (companyId: string, data: UpdateCompanyData) => Promise<void>;
  deleteCompany: (companyId: string) => Promise<void>;
  setCurrentCompany: (company: Company | null) => void;

  // Actions - Settings & Stats
  updateCompanySettings: (companyId: string, data: UpdateCompanySettingsData) => Promise<void>;
  fetchCompanyStats: (companyId: string) => Promise<void>;

  // Actions - Members
  fetchCompanyMembers: (companyId: string, filters?: MemberFilters) => Promise<void>;
  fetchCurrentUserMembership: (companyId: string) => Promise<void>;
  updateMember: (companyId: string, memberId: string, data: UpdateMemberData) => Promise<void>;
  removeMember: (companyId: string, memberId: string) => Promise<void>;

  // Actions - Invitations
  fetchCompanyInvitations: (companyId: string, filters?: InvitationFilters) => Promise<void>;
  createInvitation: (companyId: string, data: CreateInvitationData) => Promise<Invitation>;
  cancelInvitation: (companyId: string, invitationId: string) => Promise<void>;
  resendInvitation: (companyId: string, invitationId: string) => Promise<void>;

  // Utility actions
  clearError: () => void;
  reset: () => void;
}

// ============================================================================
// Initial State
// ============================================================================

const initialState = {
  currentCompany: null,
  companies: [],
  companyStats: null,
  members: [],
  currentMembership: null,
  invitations: [],
  isLoading: false,
  isLoadingStats: false,
  isLoadingMembers: false,
  isLoadingInvitations: false,
  error: null,
};

// ============================================================================
// Store Implementation
// ============================================================================

export const useCompanyStore = create<CompanyState>()(
  persist(
    (set) => ({
      ...initialState,

      // ======================================================================
      // Company CRUD Operations
      // ======================================================================

      fetchUserCompanies: async () => {
        set({ isLoading: true, error: null });
        try {
          const companies = await companyService.getUserCompanies();
          set({ companies, isLoading: false });
        } catch (error: any) {
          set({
            error: error.message || 'Failed to fetch companies',
            isLoading: false
          });
          throw error;
        }
      },

      fetchCompany: async (companyId: string) => {
        set({ isLoading: true, error: null });
        try {
          const company = await companyService.getCompanyById(companyId);
          set({ currentCompany: company, isLoading: false });
        } catch (error: any) {
          set({
            error: error.message || 'Failed to fetch company',
            isLoading: false
          });
          throw error;
        }
      },

      createCompany: async (data: CreateCompanyData) => {
        set({ isLoading: true, error: null });
        try {
          const company = await companyService.createCompany(data);
          set((state) => ({
            companies: [...state.companies, company],
            currentCompany: company,
            isLoading: false,
          }));
          return company;
        } catch (error: any) {
          set({
            error: error.message || 'Failed to create company',
            isLoading: false
          });
          throw error;
        }
      },

      updateCompany: async (companyId: string, data: UpdateCompanyData) => {
        set({ isLoading: true, error: null });
        try {
          const updatedCompany = await companyService.updateCompany(companyId, data);
          set((state) => ({
            companies: state.companies.map((c) =>
              c.id === companyId ? updatedCompany : c
            ),
            currentCompany: state.currentCompany?.id === companyId
              ? updatedCompany
              : state.currentCompany,
            isLoading: false,
          }));
        } catch (error: any) {
          set({
            error: error.message || 'Failed to update company',
            isLoading: false
          });
          throw error;
        }
      },

      deleteCompany: async (companyId: string) => {
        set({ isLoading: true, error: null });
        try {
          await companyService.deleteCompany(companyId);
          set((state) => ({
            companies: state.companies.filter((c) => c.id !== companyId),
            currentCompany: state.currentCompany?.id === companyId
              ? null
              : state.currentCompany,
            isLoading: false,
          }));
        } catch (error: any) {
          set({
            error: error.message || 'Failed to delete company',
            isLoading: false
          });
          throw error;
        }
      },

      setCurrentCompany: (company: Company | null) => {
        set({ currentCompany: company });
      },

      // ======================================================================
      // Settings & Stats
      // ======================================================================

      updateCompanySettings: async (companyId: string, data: UpdateCompanySettingsData) => {
        set({ isLoading: true, error: null });
        try {
          const updatedCompany = await companyService.updateCompanySettings(companyId, data);
          set((state) => ({
            currentCompany: state.currentCompany?.id === companyId
              ? updatedCompany
              : state.currentCompany,
            isLoading: false,
          }));
        } catch (error: any) {
          set({
            error: error.message || 'Failed to update settings',
            isLoading: false
          });
          throw error;
        }
      },

      fetchCompanyStats: async (companyId: string) => {
        set({ isLoadingStats: true, error: null });
        try {
          const stats = await companyService.getCompanyStats(companyId);
          set({ companyStats: stats, isLoadingStats: false });
        } catch (error: any) {
          set({
            error: error.message || 'Failed to fetch stats',
            isLoadingStats: false
          });
          throw error;
        }
      },

      // ======================================================================
      // Members Management
      // ======================================================================

      fetchCompanyMembers: async (companyId: string, filters?: MemberFilters) => {
        set({ isLoadingMembers: true, error: null });
        try {
          const members = await companyService.getCompanyMembers(companyId, filters);
          set({ members, isLoadingMembers: false });
        } catch (error: any) {
          set({
            error: error.message || 'Failed to fetch members',
            isLoadingMembers: false
          });
          throw error;
        }
      },

      fetchCurrentUserMembership: async (companyId: string) => {
        set({ isLoadingMembers: true, error: null });
        try {
          const membership = await companyService.getCurrentUserMembership(companyId);
          set({ currentMembership: membership, isLoadingMembers: false });
        } catch (error: any) {
          set({
            error: error.message || 'Failed to fetch membership',
            isLoadingMembers: false
          });
          throw error;
        }
      },

      updateMember: async (companyId: string, memberId: string, data: UpdateMemberData) => {
        set({ isLoadingMembers: true, error: null });
        try {
          const updatedMember = await companyService.updateMember(companyId, memberId, data);
          set((state) => ({
            members: state.members.map((m) =>
              m.id === memberId ? updatedMember : m
            ),
            isLoadingMembers: false,
          }));
        } catch (error: any) {
          set({
            error: error.message || 'Failed to update member',
            isLoadingMembers: false
          });
          throw error;
        }
      },

      removeMember: async (companyId: string, memberId: string) => {
        set({ isLoadingMembers: true, error: null });
        try {
          await companyService.removeMember(companyId, memberId);
          set((state) => ({
            members: state.members.filter((m) => m.id !== memberId),
            isLoadingMembers: false,
          }));
        } catch (error: any) {
          set({
            error: error.message || 'Failed to remove member',
            isLoadingMembers: false
          });
          throw error;
        }
      },

      // ======================================================================
      // Invitations Management
      // ======================================================================

      fetchCompanyInvitations: async (companyId: string, filters?: InvitationFilters) => {
        set({ isLoadingInvitations: true, error: null });
        try {
          const invitations = await companyService.getCompanyInvitations(companyId, filters);
          set({ invitations, isLoadingInvitations: false });
        } catch (error: any) {
          set({
            error: error.message || 'Failed to fetch invitations',
            isLoadingInvitations: false
          });
          throw error;
        }
      },

      createInvitation: async (companyId: string, data: CreateInvitationData) => {
        set({ isLoadingInvitations: true, error: null });
        try {
          const invitation = await companyService.createInvitation(companyId, data);
          set((state) => ({
            invitations: [...state.invitations, invitation],
            isLoadingInvitations: false,
          }));
          return invitation;
        } catch (error: any) {
          set({
            error: error.message || 'Failed to create invitation',
            isLoadingInvitations: false
          });
          throw error;
        }
      },

      cancelInvitation: async (companyId: string, invitationId: string) => {
        set({ isLoadingInvitations: true, error: null });
        try {
          await companyService.cancelInvitation(companyId, invitationId);
          set((state) => ({
            invitations: state.invitations.filter((i) => i.id !== invitationId),
            isLoadingInvitations: false,
          }));
        } catch (error: any) {
          set({
            error: error.message || 'Failed to cancel invitation',
            isLoadingInvitations: false
          });
          throw error;
        }
      },

      resendInvitation: async (companyId: string, invitationId: string) => {
        set({ isLoadingInvitations: true, error: null });
        try {
          const updatedInvitation = await companyService.resendInvitation(companyId, invitationId);
          set((state) => ({
            invitations: state.invitations.map((i) =>
              i.id === invitationId ? updatedInvitation : i
            ),
            isLoadingInvitations: false,
          }));
        } catch (error: any) {
          set({
            error: error.message || 'Failed to resend invitation',
            isLoadingInvitations: false
          });
          throw error;
        }
      },

      // ======================================================================
      // Utility Actions
      // ======================================================================

      clearError: () => {
        set({ error: null });
      },

      reset: () => {
        set(initialState);
      },
    }),
    {
      name: 'company-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentCompany: state.currentCompany,
        companies: state.companies,
      }),
    }
  )
);

export default useCompanyStore;
