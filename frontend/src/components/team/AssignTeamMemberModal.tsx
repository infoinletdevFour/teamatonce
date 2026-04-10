/**
 * Assign Team Member Modal
 *
 * Modal for assigning team members from the user's company to a project
 * Allows selection of team member, role, allocation percentage, and hourly rate
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Briefcase, Percent, Loader2, Search, AlertCircle } from 'lucide-react';
import { CompanyMember } from '@/types/company';
import { getCompanyMembers } from '@/services/companyService';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';

// Local member type for display in the assignment modal
interface AssignableMember {
  id: string;
  company_id: string;
  user_id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  avatar_url?: string;
}

interface AssignTeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projectId: string;
  assignedMemberIds: string[]; // Already assigned member IDs to filter out
  companyId?: string;
  currentMembership?: CompanyMember | null; // User's membership in the company
}

const PROJECT_ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'developer', label: 'Developer' },
  { value: 'designer', label: 'Designer' },
  { value: 'qa', label: 'QA Engineer' },
];

export const AssignTeamMemberModal: React.FC<AssignTeamMemberModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  projectId,
  assignedMemberIds,
  companyId,
  currentMembership,
}) => {
  const [availableMembers, setAvailableMembers] = useState<AssignableMember[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [projectRole, setProjectRole] = useState<string>('developer');
  const [allocationPercentage, setAllocationPercentage] = useState<number>(100);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && companyId) {
      loadAvailableMembers();
    }
  }, [isOpen, companyId]);


  const loadAvailableMembers = async () => {
    if (!companyId) {
      setError('Company ID is required');
      return;
    }

    try {
      setLoadingMembers(true);
      setError(null);
      const companyMembers = await getCompanyMembers(companyId);

      // Convert CompanyMember to AssignableMember format for display
      const members: AssignableMember[] = companyMembers.map((cm: CompanyMember) => ({
        id: cm.id,
        company_id: cm.company_id,
        user_id: cm.user_id,
        name: cm.user?.name || 'Unknown User',
        email: cm.user?.email || '',
        role: cm.role,
        status: cm.status,
        avatar_url: cm.user?.avatar,
      }));

      // Filter out already assigned members
      const available = members.filter(
        member => !assignedMemberIds.includes(member.id) && member.status === 'active'
      );

      setAvailableMembers(available);

      // Auto-select first available member
      if (available.length > 0) {
        setSelectedMemberId(available[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load team members:', err);
      setError(err.message || 'Failed to load team members');
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedMemberId) {
      toast.error('Please select a team member');
      return;
    }

    if (!projectRole) {
      toast.error('Please select a project role');
      return;
    }

    if (allocationPercentage <= 0 || allocationPercentage > 100) {
      toast.error('Allocation percentage must be between 1 and 100');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Call PUT /api/v1/projects/{id}/assign-team
      // This will add the member to both projects.assigned_team and project_members table
      await apiClient.put(`/projects/${projectId}/assign-team`, {
        teamMemberIds: [selectedMemberId],
        projectRole: projectRole, // Send the selected role (admin, developer, designer, qa)
        // Optional: set as team lead based on role
        teamLeadId: projectRole === 'admin' ? selectedMemberId : undefined,
      });

      toast.success('Team member assigned successfully');
      onSuccess();
      handleClose();
    } catch (err: any) {
      console.error('Failed to assign team member:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to assign team member';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedMemberId('');
    setProjectRole('developer');
    setAllocationPercentage(100);
    setSearchQuery('');
    setError(null);
    onClose();
  };

  const filteredMembers = availableMembers.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedMember = availableMembers.find(m => m.id === selectedMemberId);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {currentMembership?.role === 'owner' || currentMembership?.role === 'admin'
                      ? 'Assign Team Member'
                      : 'Assign Developer Company'}
                  </h2>
                  <p className="text-sm text-blue-100">
                    {currentMembership?.role === 'owner' || currentMembership?.role === 'admin'
                      ? 'Add a team member to this project'
                      : 'Assign this project to a developer company'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              {error && (
                <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-red-900">Error</h4>
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              )}

              {loadingMembers ? (
                <div className="py-12 text-center">
                  <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                  <p className="text-gray-600">Loading team members...</p>
                </div>
              ) : availableMembers.length === 0 ? (
                <div className="py-12 text-center">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No Available Team Members
                  </h3>
                  <p className="text-gray-600 mb-4">
                    All team members are already assigned to this project or no active members are available.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Search */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Search Team Members
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by name, email, or role..."
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Member Selection */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Select Team Member *
                    </label>
                    <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto border-2 border-gray-200 rounded-xl p-3">
                      {filteredMembers.length === 0 ? (
                        <p className="text-center text-gray-500 py-4">No members found</p>
                      ) : (
                        filteredMembers.map((member) => (
                          <button
                            key={member.id}
                            onClick={() => setSelectedMemberId(member.id)}
                            className={`p-4 rounded-xl border-2 transition-all text-left ${
                              selectedMemberId === member.id
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                                {member.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-900 truncate">
                                  {member.name}
                                </h4>
                                <p className="text-sm text-gray-600 truncate">{member.email}</p>
                                <div className="flex items-center space-x-2 mt-1">
                                  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                                    {member.role}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Project Role */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <Briefcase className="w-4 h-4 inline mr-2" />
                      Project Role *
                    </label>
                    <select
                      value={projectRole}
                      onChange={(e) => setProjectRole(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    >
                      {PROJECT_ROLES.map((role) => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Allocation Percentage */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <Percent className="w-4 h-4 inline mr-2" />
                      Allocation Percentage *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={allocationPercentage}
                      onChange={(e) => setAllocationPercentage(Number(e.target.value))}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="100"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Percentage of time allocated to this project (1-100%)
                    </p>
                  </div>

                  {/* Selected Member Preview */}
                  {selectedMember && (
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl">
                      <h4 className="font-semibold text-gray-900 mb-2">Assignment Preview</h4>
                      <div className="space-y-1 text-sm">
                        <p>
                          <span className="text-gray-600">Member:</span>{' '}
                          <span className="font-semibold">{selectedMember.name}</span>
                        </p>
                        <p>
                          <span className="text-gray-600">Role:</span>{' '}
                          <span className="font-semibold">
                            {PROJECT_ROLES.find(r => r.value === projectRole)?.label}
                          </span>
                        </p>
                        <p>
                          <span className="text-gray-600">Allocation:</span>{' '}
                          <span className="font-semibold">{allocationPercentage}%</span>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            {availableMembers.length > 0 && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end space-x-3">
                <button
                  onClick={handleClose}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssign}
                  disabled={loading || !selectedMemberId}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                  <span>{loading ? 'Assigning...' : 'Assign Member'}</span>
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
