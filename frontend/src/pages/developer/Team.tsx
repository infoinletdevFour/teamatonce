/**
 * Team Management Page
 *
 * Manages company team members with real backend integration
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Users, Search, Filter, Grid, List, UserPlus, Activity,
  CheckCircle, Briefcase, AlertCircle, Building2,
} from 'lucide-react';
import { useModal } from '@/components/ui/Modal';
import { useCompany } from '@/contexts/CompanyContext';
import TeamMemberCard from '@/components/team/TeamMemberCard';
import AddTeamMemberModal from '@/components/team/AddTeamMemberModal';
import EditTeamMemberModal from '@/components/team/EditTeamMemberModal';
import companyService from '@/services/companyService';
import teamMemberService from '@/services/teamMemberService';
import type { CompanyMember } from '@/types/company';
import type { TeamMember, TeamRole, CreateTeamMemberData, UpdateTeamMemberData } from '@/types/teamMember';

const Team: React.FC = () => {
  const navigate = useNavigate();

  // Get current company from context
  const { companyId, loading: companyLoading, error } = useCompany();
  const companyError = error;

  // View and filter state
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  // Data state
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal context for confirmations
  const { confirm, alert } = useModal();

  // Load team members when company ID is available
  useEffect(() => {
    if (companyId) {
      loadTeamMembers();
    }
  }, [companyId]);

  const loadTeamMembers = async () => {
    if (!companyId) return;

    setLoading(true);
    try {
      const members = await companyService.getCompanyMembers(companyId);
      // Convert CompanyMember to TeamMember format for compatibility
      const teamMembers: TeamMember[] = members.map((member: CompanyMember) => ({
        id: member.id,
        user_id: member.user_id,
        company_id: member.company_id,
        name: member.user?.name || 'Unknown',
        email: member.user?.email || '',
        role: member.role.toLowerCase() as TeamRole,
        avatar: member.user?.avatar || undefined,
        permissions: {},
        skills: [],
        workload_percentage: 0,
        availability: 'available' as const,
        online_status: false,
        current_projects: 0,
        hourly_rate: 0,
        timezone: 'UTC',
        joined_date: member.joined_at,
        created_at: member.created_at,
        updated_at: member.updated_at,
      }));
      setTeamMembers(teamMembers);
    } catch (err: any) {
      console.error('Failed to load team members:', err);
      // For development: If API fails, show empty state instead of error
      setTeamMembers([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats
  const stats = {
    totalMembers: teamMembers.length,
    onlineMembers: teamMembers.filter(m => m.online_status).length,
    availableMembers: teamMembers.filter(m => m.availability === 'available').length,
    activeProjects: teamMembers.reduce((acc, m) => acc + m.current_projects, 0),
    avgUtilization: teamMembers.length > 0
      ? Math.round(teamMembers.reduce((acc, m) => acc + m.workload_percentage, 0) / teamMembers.length)
      : 0,
  };

  const statsCards = [
    {
      label: 'Total Members',
      value: stats.totalMembers,
      icon: Users,
      color: 'from-blue-600 to-blue-500',
      subtitle: `${stats.onlineMembers} online`,
    },
    {
      label: 'Active Projects',
      value: stats.activeProjects,
      icon: Briefcase,
      color: 'from-purple-600 to-purple-500',
      subtitle: 'Across team',
    },
    {
      label: 'Team Capacity',
      value: `${stats.avgUtilization}%`,
      icon: Activity,
      color: stats.avgUtilization > 80 ? 'from-red-600 to-red-500' : 'from-green-600 to-green-500',
      subtitle: 'Avg utilization',
    },
    {
      label: 'Available',
      value: stats.availableMembers,
      icon: CheckCircle,
      color: 'from-emerald-600 to-emerald-500',
      subtitle: 'Ready for work',
    },
  ];

  // Filter members
  const filteredMembers = teamMembers.filter(member => {
    const matchesRole = filterRole === 'all' || member.role === filterRole;
    const matchesSearch =
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (member.title?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      member.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesRole && matchesSearch;
  });

  // Handlers
  const handleAddMember = async (data: CreateTeamMemberData) => {
    if (!companyId) return;
    try {
      await teamMemberService.addTeamMember(companyId, data);
      await alert('Team member invitation sent successfully!', 'Success', { type: 'success' });
      setShowAddModal(false);
      await loadTeamMembers();
    } catch (err: any) {
      throw new Error(err.message || 'Failed to add team member');
    }
  };

  const handleEditMember = (member: TeamMember) => {
    setSelectedMember(member);
    setShowEditModal(true);
  };

  const handleUpdateMember = async (data: UpdateTeamMemberData) => {
    if (!selectedMember || !companyId) return;

    try {
      await teamMemberService.updateTeamMember(companyId, selectedMember.id, data);
      await alert('Team member updated successfully!', 'Success', { type: 'success' });
      setShowEditModal(false);
      setSelectedMember(null);
      await loadTeamMembers();
    } catch (err: any) {
      throw new Error(err.message || 'Failed to update team member');
    }
  };

  const handleRemoveMember = async (member: TeamMember) => {
    if (!companyId) return;

    const confirmed = await confirm(
      `Are you sure you want to remove ${member.name} from the team? This action cannot be undone.`,
      'Remove Team Member',
      {
        confirmText: 'Remove',
        confirmVariant: 'danger',
      }
    );

    if (confirmed) {
      try {
        await teamMemberService.removeTeamMember(companyId, member.id);
        await alert(`${member.name} has been removed from the team.`, 'Member Removed', {
          type: 'success',
        });
        await loadTeamMembers();
      } catch (err: any) {
        await alert(err.message || 'Failed to remove team member', 'Error', { type: 'error' });
      }
    }
  };

  const handleViewMember = (member: TeamMember) => {
    // TODO: Navigate to member detail page or show detail modal
    console.log('View member:', member);
  };

  const handleAssignMember = (member: TeamMember) => {
    // TODO: Show project assignment modal
    console.log('Assign member:', member);
  };

  // Show loading state while fetching company
  if (companyLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading company information...</p>
        </div>
      </div>
    );
  }

  // Show error if company couldn't be loaded
  if (companyError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Company</h2>
          <p className="text-gray-600 mb-6">{companyError}</p>
          <button
            onClick={() => navigate('/client/dashboard')}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Show message if no company is selected
  if (!companyId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Company Selected</h2>
          <p className="text-gray-600 mb-6">
            You need to select or create a company to manage team members.
          </p>
          <button
            onClick={() => navigate('/onboarding/company')}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors"
          >
            Create Company
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            My Company Team
          </h1>
          <p className="text-gray-600 text-lg">
            Manage your development team members and track their availability
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-shadow"
        >
          <UserPlus className="w-5 h-5" />
          <span>Add Team Member</span>
        </motion.button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-md`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black text-gray-900">{stat.value}</div>
                  <div className="text-sm font-semibold text-gray-600">{stat.label}</div>
                </div>
              </div>
              {stat.subtitle && <div className="text-xs text-gray-500 text-right">{stat.subtitle}</div>}
            </motion.div>
          );
        })}
      </div>

      {/* Filters and Search */}
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search team members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors font-semibold"
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
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-3 rounded-xl transition-colors ${
                viewMode === 'grid'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-3 rounded-xl transition-colors ${
                viewMode === 'list'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"
            />
            <p className="text-gray-600 font-semibold">Loading team members...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-red-50 border border-red-200 rounded-2xl p-6"
        >
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-bold text-red-900 mb-1">Failed to load team members</h3>
              <p className="text-red-700">{error}</p>
              <button
                onClick={loadTeamMembers}
                className="mt-3 px-4 py-2 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Team Members Grid */}
      {!loading && !error && (
        <AnimatePresence mode="wait">
          {filteredMembers.length > 0 ? (
            <motion.div
              key={viewMode}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}
            >
              {filteredMembers.map((member, index) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <TeamMemberCard
                    member={member}
                    onEdit={handleEditMember}
                    onRemove={handleRemoveMember}
                    onView={handleViewMember}
                    onAssign={handleAssignMember}
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center"
            >
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No team members found</h3>
              <p className="text-gray-600 mb-6">
                {searchQuery || filterRole !== 'all'
                  ? 'Try adjusting your filters or search query'
                  : 'Get started by adding your first team member'}
              </p>
              {!searchQuery && filterRole === 'all' && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-shadow"
                >
                  <UserPlus className="w-5 h-5" />
                  <span>Add Team Member</span>
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Add Team Member Modal */}
      <AddTeamMemberModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddMember}
      />

      {/* Edit Team Member Modal */}
      <EditTeamMemberModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedMember(null);
        }}
        onSubmit={handleUpdateMember}
        member={selectedMember}
      />
    </div>
  );
};

export default Team;
