/**
 * Team Members Management Page
 * Complete team member management interface with invitations
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  UserPlus,
  Mail,
  AlertCircle,
  Filter,
  X,
  Building2,
  RefreshCw,
} from 'lucide-react';

// Components
import SendInvitationModal from '@/components/invitation/SendInvitationModal';
import InvitationList from '@/components/invitation/InvitationList';

// Services
import {
  getUserCompanies,
  getCompanyMembers,
  getCompanyStats,
  getCurrentUserMembership,
} from '@/services/companyService';
import type { Company, CompanyMember, CompanyStats } from '@/types/company';
import { TeamRole } from '@/types/invitation';

// ============================================================================
// Main Component
// ============================================================================

const MembersPage: React.FC = () => {
  // ============================================================================
  // State Management
  // ============================================================================

  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [members, setMembers] = useState<CompanyMember[]>([]);
  const [stats, setStats] = useState<CompanyStats | null>(null);
  const [currentUserMembership, setCurrentUserMembership] = useState<CompanyMember | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Modal states
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Filter states
  const [roleFilter, setRoleFilter] = useState<TeamRole | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);

  // ============================================================================
  // Initial Data Loading
  // ============================================================================

  useEffect(() => {
    loadCompanies();
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      loadCompanyData();
    }
  }, [selectedCompany]);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      setError(null);
      const companiesData = await getUserCompanies();
      setCompanies(companiesData);

      // Auto-select first company if available
      if (companiesData.length > 0) {
        setSelectedCompany(companiesData[0]);
      }
    } catch (err: any) {
      console.error('Error loading companies:', err);
      setError(err.message || 'Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  const loadCompanyData = async () => {
    if (!selectedCompany) return;

    try {
      setLoading(true);
      setError(null);

      // Load in parallel
      const [membersData, statsData, membershipData] = await Promise.all([
        getCompanyMembers(selectedCompany.id),
        getCompanyStats(selectedCompany.id),
        getCurrentUserMembership(selectedCompany.id),
      ]);

      setMembers(membersData);
      setStats(statsData);
      setCurrentUserMembership(membershipData);
    } catch (err: any) {
      console.error('Error loading company data:', err);
      setError(err.message || 'Failed to load company data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCompanyData();
    setRefreshing(false);
  };

  // ============================================================================
  // Permission Checks
  // ============================================================================

  const canManageTeam = (): boolean => {
    if (!currentUserMembership) return false;
    return currentUserMembership.role === 'owner' || currentUserMembership.role === 'admin';
  };

  // ============================================================================
  // Filtering
  // ============================================================================

  const filteredMembers = members.filter((member) => {
    if (roleFilter !== 'all' && member.role !== roleFilter) {
      return false;
    }
    return true;
  });

  // ============================================================================
  // Render: Loading State
  // ============================================================================

  if (loading && companies.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 shadow-lg border border-gray-200">
            <div className="flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="ml-3 text-gray-600 font-semibold">Loading team data...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // Render: Error State
  // ============================================================================

  if (error && !selectedCompany) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 shadow-lg border border-gray-200">
            <div className="flex items-center space-x-3 text-red-600 mb-4">
              <AlertCircle className="w-6 h-6" />
              <p className="font-semibold">{error}</p>
            </div>
            <button
              onClick={loadCompanies}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // Render: No Companies State
  // ============================================================================

  if (companies.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-12 shadow-lg border border-gray-200 text-center">
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Company Found</h2>
            <p className="text-gray-600">You need to create a company before managing team members.</p>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // Render: Main UI
  // ============================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Team Members
            </h1>
            <p className="text-gray-600">Manage your team members and invitations</p>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-3 bg-white hover:bg-gray-50 rounded-xl shadow-md border border-gray-200 transition-colors disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw className={`w-5 h-5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </motion.div>

        {/* Stats Cards */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {/* Total Members */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 shadow-lg text-white">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-8 h-8 opacity-80" />
                <span className="text-3xl font-black">{stats.total_members}</span>
              </div>
              <p className="text-blue-100 font-semibold">Total Members</p>
            </div>

            {/* Active Members */}
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 shadow-lg text-white">
              <div className="flex items-center justify-between mb-2">
                <UserPlus className="w-8 h-8 opacity-80" />
                <span className="text-3xl font-black">{stats.active_members}</span>
              </div>
              <p className="text-green-100 font-semibold">Active Members</p>
            </div>

            {/* Pending Invitations - Only show for admins/owners */}
            {canManageTeam() && (
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 shadow-lg text-white">
                <div className="flex items-center justify-between mb-2">
                  <Mail className="w-8 h-8 opacity-80" />
                  <span className="text-3xl font-black">{stats.pending_invitations}</span>
                </div>
                <p className="text-purple-100 font-semibold">Pending Invitations</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Action Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-gray-200"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Filters */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition-colors"
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
                {roleFilter !== 'all' && (
                  <span className="w-2 h-2 bg-blue-600 rounded-full" />
                )}
              </button>

              {/* Active Filters Display */}
              <AnimatePresence>
                {roleFilter !== 'all' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex items-center space-x-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg"
                  >
                    <span className="text-sm font-semibold capitalize">{roleFilter}</span>
                    <button
                      onClick={() => setRoleFilter('all')}
                      className="hover:bg-blue-200 rounded p-0.5 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Invite Button */}
            {canManageTeam() && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowInviteModal(true)}
                className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
              >
                <UserPlus className="w-5 h-5" />
                <span>Invite Member</span>
              </motion.button>
            )}
          </div>

          {/* Filter Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t border-gray-200"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Role</label>
                    <select
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value as TeamRole | 'all')}
                      className="w-full px-4 py-2 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                    >
                      <option value="all">All Roles</option>
                      <option value="owner">Owner</option>
                      <option value="admin">Admin</option>
                      <option value="developer">Developer</option>
                      <option value="designer">Designer</option>
                      <option value="qa">QA Engineer</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Active Members Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <Users className="w-6 h-6 text-blue-600" />
            <span>Active Members ({filteredMembers.length})</span>
          </h2>

          {loading ? (
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 shadow-lg border border-gray-200">
              <div className="flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span className="ml-3 text-gray-600 font-semibold">Loading members...</span>
              </div>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-12 shadow-lg border border-gray-200 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 font-semibold">No team members found</p>
              <p className="text-sm text-gray-500 mt-1">
                {roleFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Invite team members to get started'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMembers.map((member) => (
                <div
                  key={member.id}
                  className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow"
                >
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-lg font-bold">
                      {member.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900">{member.name}</h3>
                      <p className="text-sm text-gray-600">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold capitalize">
                      {member.role}
                    </span>
                    <span className="text-xs text-gray-500">
                      Joined {new Date(member.joined_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Pending Invitations Section - Only show for admins/owners */}
        {selectedCompany && canManageTeam() && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
              <Mail className="w-6 h-6 text-purple-600" />
              <span>Pending Invitations</span>
            </h2>

            <InvitationList companyId={selectedCompany.id} onUpdate={loadCompanyData} />
          </motion.div>
        )}

        {/* Invite Modal */}
        {selectedCompany && (
          <SendInvitationModal
            isOpen={showInviteModal}
            onClose={() => setShowInviteModal(false)}
            companyId={selectedCompany.id}
            onSuccess={loadCompanyData}
          />
        )}
      </div>
    </div>
  );
};

export default MembersPage;
