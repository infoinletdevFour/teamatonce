/**
 * Project Team Page
 *
 * Displays and manages team members assigned to a specific project
 * Supports both client and developer roles with proper permissions
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Users,
  UserPlus,
  AlertCircle,
  Shield,
  Activity,
  CheckCircle,
  Briefcase,
  Search,
  Filter,
  Grid,
  List,
} from 'lucide-react';
import { ProjectPageLayout } from '@/layouts/ProjectPageLayout';
import TeamMemberCard from '@/components/team/TeamMemberCard';
import { AssignTeamMemberModal } from '@/components/team/AssignTeamMemberModal';
import { AccessDenied, AccessLoading } from '@/components/project';
import teamMemberService from '@/services/teamMemberService';
import { getProject } from '@/services/projectService';
import { useCompany } from '@/contexts/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import { useProjectRole } from '@/hooks/useProjectRole';
import type { TeamMember } from '@/types/teamMember';
import type { Project } from '@/types/project';

export const Team: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { companyId, currentMembership } = useCompany();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Check project membership
  const { hasAccess, loading: roleLoading } = useProjectRole(projectId);

  // State management
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);

  // View and filter state
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');

  // Load project and team members
  useEffect(() => {
    if (projectId) {
      loadProjectAndTeam();
    }
  }, [projectId]);

  const loadProjectAndTeam = async () => {
    if (!projectId) return;

    setLoading(true);
    setError(null);
    try {
      // Fetch project details to get client_id
      const projectData = await getProject(projectId);
      setProject(projectData);

      // Fetch team members
      const members = await teamMemberService.getProjectTeam(projectId);
      setTeamMembers(members);
    } catch (err: any) {
      console.error('Failed to load project team:', err);
      setError(err.message || 'Failed to load project team');
      setTeamMembers([]);
    } finally {
      setLoading(false);
    }
  };


  // Calculate team statistics
  const stats = {
    totalMembers: teamMembers.length,
    onlineMembers: teamMembers.filter(m => m.online_status).length,
    availableMembers: teamMembers.filter(m => m.availability === 'available').length,
    avgUtilization: teamMembers.length > 0
      ? Math.round(teamMembers.reduce((acc, m) => acc + (m.workload_percentage || 0), 0) / teamMembers.length)
      : 0,
  };

  const statsCards = [
    {
      label: 'Team Members',
      value: stats.totalMembers,
      icon: Users,
      color: 'from-blue-600 to-blue-500',
      subtitle: `${stats.onlineMembers} online`,
    },
    {
      label: 'Available',
      value: stats.availableMembers,
      icon: CheckCircle,
      color: 'from-green-600 to-green-500',
      subtitle: 'Ready for tasks',
    },
    {
      label: 'Avg Workload',
      value: `${stats.avgUtilization}%`,
      icon: Activity,
      color: stats.avgUtilization > 80 ? 'from-red-600 to-red-500' : 'from-purple-600 to-purple-500',
      subtitle: 'Team utilization',
    },
    {
      label: 'Roles',
      value: new Set(teamMembers.map(m => m.role)).size,
      icon: Briefcase,
      color: 'from-indigo-600 to-indigo-500',
      subtitle: 'Different roles',
    },
  ];

  // Filter team members
  const filteredMembers = teamMembers.filter(member => {
    const matchesRole = filterRole === 'all' || member.role === filterRole;
    const matchesSearch =
      member.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (member.title?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (member.skills && Array.isArray(member.skills) && member.skills.some(skill => skill?.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchesRole && matchesSearch;
  });

  // Check if user is the project client (creator) - only they can manage team
  const isProjectClient = user?.id && project?.client_id === user.id;

  // canManageTeam now only allows the project client to manage team members
  const canManageTeam = isProjectClient;

  // Get already assigned member IDs
  const assignedMemberIds = teamMembers.map(m => m.id);

  // Handlers
  const handleAssignSuccess = async () => {
    setShowAssignModal(false);
    await loadProjectAndTeam();
  };

  const handleRemoveMember = async (member: TeamMember) => {
    if (!projectId) return;

    try {
      // Get the user_id from the member object
      const userId = member.user_id || (member as any).userId;

      if (!userId) {
        throw new Error('User ID not found');
      }

      await teamMemberService.removeProjectMember(projectId, userId);
      await loadProjectAndTeam();
    } catch (err: any) {
      console.error('Failed to remove team member:', err);
      setError(err.message || 'Failed to remove team member');
    }
  };

  const handleViewMember = (member: TeamMember) => {
    // Navigate to member profile page
    navigate(`/company/${companyId}/project/${projectId}/team/member/${member.id}`);
  };

  // Header actions
  const headerActions = canManageTeam ? (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => setShowAssignModal(true)}
      className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-shadow"
    >
      <UserPlus className="w-5 h-5" />
      <span>Assign Team Member</span>
    </motion.button>
  ) : null;

  // Access check
  if (roleLoading) {
    return <AccessLoading />;
  }

  if (!hasAccess) {
    return <AccessDenied message="You don't have permission to access the team for this project." />;
  }

  return (
    <ProjectPageLayout
      title="Project Team"
      subtitle="Manage and collaborate with your project team members"
      headerActions={headerActions}
    >
      {/* Team Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-gray-200 mb-8">
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
                onClick={loadProjectAndTeam}
                className="mt-3 px-4 py-2 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Team Members Grid/List */}
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
                    onRemove={canManageTeam ? handleRemoveMember : undefined}
                    onView={handleViewMember}
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
                  : 'No team members have been assigned to this project yet'}
              </p>
              {!searchQuery && filterRole === 'all' && canManageTeam && (
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-shadow"
                >
                  <UserPlus className="w-5 h-5" />
                  <span>Assign Team Member</span>
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Permission Notice for non-managers */}
      {!canManageTeam && teamMembers.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-6 bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start space-x-3"
        >
          <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-blue-800">
              You are viewing the project team. Only project owners and administrators can manage team members.
            </p>
          </div>
        </motion.div>
      )}

      {/* Assign Team Member Modal */}
      {canManageTeam && projectId && companyId && (
        <AssignTeamMemberModal
          isOpen={showAssignModal}
          onClose={() => setShowAssignModal(false)}
          onSuccess={handleAssignSuccess}
          projectId={projectId}
          assignedMemberIds={assignedMemberIds}
          companyId={companyId}
          currentMembership={currentMembership}
        />
      )}
    </ProjectPageLayout>
  );
};

export default Team;
