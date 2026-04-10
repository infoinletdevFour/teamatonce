import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  Briefcase, DollarSign, Clock, Filter, Search,
  Star, ArrowRight, TrendingUp, CheckCircle, AlertCircle,
  Users, MessageSquare,
  Grid, List, X, UserPlus,
  AlertTriangle, UserCheck, Building2
} from 'lucide-react';
import { ActiveProject, ProjectAssignment, Milestone as UIMilestone, TeamMember } from '@/types/developer';
import { useCompany } from '@/contexts/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import companyService from '@/services/companyService';
import projectService, { getClientProjects } from '@/services/projectService';
import type { Milestone as BackendMilestone } from '@/types/milestone';
import type { Project as BackendProject } from '@/types/project';

const Projects: React.FC = () => {
  const navigate = useNavigate();

  // Get current company and user from contexts
  const { companyId, currentMembership, loading: companyLoading, error } = useCompany();
  const { user } = useAuth();
  const companyError = error;

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [showTeamModal, setShowTeamModal] = useState(false);

  // User account type - in production, this would come from auth context
  const [accountType] = useState<'solo' | 'team' | 'company'>('team'); // 'solo', 'team', or 'company'

  // Team members state
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  // Projects state - replaced mock data with real API
  const [projects, setProjects] = useState<ActiveProject[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [projectsError, setProjectsError] = useState<string | null>(null);

  // Transform backend project data to ActiveProject format
  const transformToActiveProject = (project: BackendProject): ActiveProject | null => {
    try {
      if (!project) return null;

      // Transform project data
      const activeProject: ActiveProject = {
        id: project.id,
        title: project.name || 'Untitled Project',
        description: project.description || '',
        clientName: 'Client', // TODO: Get from project.client relationship
        clientRating: 4.5,
        budget: {
          min: project.estimated_cost || 0,
          max: project.estimated_cost || 0,
          type: 'fixed' as const,
        },
        duration: project.estimated_duration_days
          ? `${Math.ceil(project.estimated_duration_days / 30)} months`
          : 'N/A',
        requiredSkills: project.tech_stack || [],
        matchPercentage: 100,
        postedDate: project.created_at || new Date().toISOString(),
        proposalsCount: 0,
        status: project.status || 'in_progress',
        category: project.project_type || 'General',
        experienceLevel: 'intermediate' as const,
        projectType: 'one-time' as const,
        startDate: project.start_date || project.created_at || new Date().toISOString(),
        milestones: [], // Will be loaded separately
        totalBudget: project.estimated_cost || 0,
        paidAmount: 0, // TODO: Calculate from milestones
        timeTracked: 0, // TODO: Get from time tracking
        filesShared: 0, // TODO: Get from files
        messagesCount: 0, // TODO: Get from messages
      };

      return activeProject;
    } catch (error) {
      console.error('Error transforming project data:', error);
      return null;
    }
  };

  // Load developer's company projects
  const loadDeveloperProjects = async () => {
    if (!companyId) return;

    setLoadingProjects(true);
    setProjectsError(null);

    try {
      // Fetch all projects for the company (includes both owned and assigned projects)
      const projectsData = await getClientProjects(companyId);

      // Transform to ActiveProject format
      const transformedProjects = projectsData
        .map(transformToActiveProject)
        .filter((p): p is ActiveProject => p !== null);

      // Load milestones for each project
      const projectsWithMilestones = await Promise.all(
        transformedProjects.map(async (project) => {
          try {
            const milestonesData = await projectService.getProjectMilestones(project.id);
            const milestones: UIMilestone[] = (milestonesData.milestones || []).map((m: BackendMilestone) => ({
              id: m.id,
              title: m.title || 'Untitled Milestone',
              description: m.description || '',
              amount: Number(m.amount) || 0,
              status: mapMilestoneStatus(m.status),
              dueDate: m.dueDate || '',
            }));

            // Calculate paid amount from approved milestones
            const paidAmount = milestones
              .filter((m) => m.status === 'approved' || m.status === 'released')
              .reduce((sum, m) => sum + m.amount, 0);

            return {
              ...project,
              milestones,
              paidAmount,
            };
          } catch (error) {
            console.error(`Error loading milestones for project ${project.id}:`, error);
            return project;
          }
        })
      );

      setProjects(projectsWithMilestones);
    } catch (error: any) {
      console.error('Error loading developer projects:', error);
      setProjectsError(error.message || 'Failed to load projects');
      setProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  };

  // Map backend milestone status to UI status
  const mapMilestoneStatus = (
    status: string
  ): 'pending' | 'in_progress' | 'submitted' | 'approved' | 'released' => {
    const statusMap: Record<string, 'pending' | 'in_progress' | 'submitted' | 'approved' | 'released'> = {
      'not_started': 'pending',
      'in_progress': 'in_progress',
      'submitted': 'submitted',
      'approved': 'approved',
      'paid': 'released',
      'completed': 'approved',
    };
    return statusMap[status] || 'pending';
  };

  // Load projects when component mounts or companyId changes
  useEffect(() => {
    if (companyId) {
      loadDeveloperProjects();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  // Mock data removed - using real API data above

  // Load team members from backend when company ID is available
  useEffect(() => {
    if (companyId) {
      loadTeamMembers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  const loadTeamMembers = async () => {
    if (!companyId) return; // Skip loading for no company

    try {
      const members = await companyService.getCompanyMembers(companyId);
      // Convert CompanyMember to TeamMember format for compatibility
      const convertedMembers: TeamMember[] = members.map((member: any) => ({
        id: member.id,
        name: member.user?.name || 'Unknown',
        email: member.user?.email || '',
        role: 'Developer' as const,
        avatar: member.user?.avatar_url,
        skills: [],
        availability: 'available' as const,
        workloadPercentage: 0,
        currentProjects: 0,
        hourlyRate: 0,
      }));
      setTeamMembers(convertedMembers);
    } catch (err) {
      console.error('Failed to load team members:', err);
      // Fail silently and use empty array
      setTeamMembers([]);
    }
  };

  // Project assignments - Initialize as empty array, will be fetched from backend
  const [projectAssignments, setProjectAssignments] = useState<ProjectAssignment[]>([]);

  const [selectedTeamMembers, setSelectedTeamMembers] = useState<string[]>([]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'awarded':
        return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'in_progress':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getMilestoneStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-600';
      case 'in_progress':
        return 'text-blue-600';
      case 'submitted':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  const getWorkloadColor = (percentage: number) => {
    if (percentage >= 100) return 'text-red-600 bg-red-50 border-red-200';
    if (percentage >= 70) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const getAssignedTeam = (projectId: string): TeamMember[] => {
    const assignment = projectAssignments.find(a => a.projectId === projectId);
    return assignment?.teamMembers || [];
  };

  // Check if user can assign team to a specific project
  const canUserAssignTeam = (): boolean => {
    // For now, we'll check based on accountType and role

    // Solo accounts don't have team assignment
    if (accountType === 'solo') return false;

    // For mock data: If user has a company membership and is owner/admin, allow assignment
    if (currentMembership) {
      const isAdmin = currentMembership.role === 'owner' || currentMembership.role === 'admin';
      return isAdmin;
    }

    // If no membership but has user, assume they might be a client
    // In real implementation, check project.client_id === user.id
    return false;
  };

  const handleToggleTeamMember = (memberId: string) => {
    setSelectedTeamMembers(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleAssignTeam = () => {
    if (!selectedProject) return;

    const selectedMembers = teamMembers.filter(tm => selectedTeamMembers.includes(tm.id));

    setProjectAssignments(prev => {
      const existing = prev.find(a => a.projectId === selectedProject);
      if (existing) {
        return prev.map(a =>
          a.projectId === selectedProject
            ? { ...a, teamMembers: selectedMembers }
            : a
        );
      } else {
        return [...prev, {
          projectId: selectedProject,
          teamMembers: selectedMembers,
          assignedDate: new Date().toISOString(),
        }];
      }
    });

    setShowTeamModal(false);
    setSelectedTeamMembers([]);
  };

  const openTeamModal = (projectId: string) => {
    setSelectedProject(projectId);
    const currentAssignment = projectAssignments.find(a => a.projectId === projectId);
    setSelectedTeamMembers(currentAssignment?.teamMembers.map(tm => tm.id) || []);
    setShowTeamModal(true);
  };

  const filteredProjects = projects.filter(project => {
    const matchesStatus = filterStatus === 'all' || project.status === filterStatus;
    const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const stats = [
    {
      label: 'Active Projects',
      value: projects.filter(p => p.status === 'in_progress').length,
      change: '+2 this month',
      icon: Briefcase,
      color: 'from-blue-600 to-blue-500',
    },
    {
      label: 'Completed Projects',
      value: projects.filter(p => p.status === 'completed').length,
      change: '+1 this month',
      icon: CheckCircle,
      color: 'from-green-600 to-green-500',
    },
    {
      label: 'Total Earned',
      value: `$${projects.reduce((acc, p) => acc + p.paidAmount, 0).toLocaleString()}`,
      change: '+15% vs last month',
      icon: DollarSign,
      color: 'from-purple-600 to-purple-500',
    },
    {
      label: 'Hours Tracked',
      value: projects.reduce((acc, p) => acc + p.timeTracked, 0),
      change: '+24 this week',
      icon: Clock,
      color: 'from-orange-600 to-orange-500',
    },
  ];

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
            onClick={() => navigate('/developer/dashboard')}
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
            You need to select or create a company to view your projects.
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
            My Projects
          </h1>
          <p className="text-gray-600 text-lg">
            Manage and track all your active and completed projects
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-gray-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div className="text-3xl font-black text-gray-900 mb-1">{stat.value}</div>
              <div className="text-sm text-gray-600 mb-1">{stat.label}</div>
              <div className="text-xs text-green-600 font-semibold">{stat.change}</div>
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
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors font-semibold"
              >
                <option value="all">All Projects</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
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
      {loadingProjects && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your projects...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {projectsError && !loadingProjects && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center"
        >
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-red-900 mb-2">Failed to Load Projects</h3>
          <p className="text-red-700 mb-4">{projectsError}</p>
          <button
            onClick={loadDeveloperProjects}
            className="bg-red-600 text-white px-6 py-2 rounded-xl hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </motion.div>
      )}

      {/* Projects Grid/List */}
      {!loadingProjects && !projectsError && (
        <>
          <AnimatePresence mode="wait">
            {viewMode === 'grid' ? (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {filteredProjects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -4 }}
                className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">{project.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(project.status)}`}>
                          {project.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">{project.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                        {project.clientName[0]}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{project.clientName}</div>
                        <div className="flex items-center space-x-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs text-gray-600">{project.clientRating}</span>
                        </div>
                      </div>
                    </div>

                    {/* Team Members Avatars */}
                    <div className="flex items-center space-x-2">
                      {getAssignedTeam(project.id).length > 0 ? (
                        <>
                          <div className="flex -space-x-2">
                            {getAssignedTeam(project.id).slice(0, 3).map((member) => (
                              <div
                                key={member.id}
                                className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold border-2 border-white"
                                title={member?.name || 'Team Member'}
                              >
                                {member.name ? member?.name.split(' ').map(n => n[0]).join('') : 'TM'}
                              </div>
                            ))}
                            {getAssignedTeam(project.id).length > 3 && (
                              <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center text-white text-xs font-bold border-2 border-white">
                                +{getAssignedTeam(project.id).length - 3}
                              </div>
                            )}
                          </div>
                        </>
                      ) : accountType === 'solo' ? (
                        <div className="text-xs text-gray-500 flex items-center space-x-1">
                          <UserCheck className="w-3 h-3" />
                          <span>You</span>
                        </div>
                      ) : canUserAssignTeam() ? (
                        <button
                          onClick={() => openTeamModal(project.id)}
                          className="text-xs text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                          title={currentMembership?.role === 'owner' || currentMembership?.role === 'admin' ? 'Assign team members to this project' : 'Assign developer company'}
                        >
                          <UserPlus className="w-3 h-3" />
                          <span>Assign</span>
                        </button>
                      ) : (
                        <div className="text-xs text-gray-500 flex items-center space-x-1">
                          <Users className="w-3 h-3" />
                          <span>No team</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 rounded-xl">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Budget</div>
                      <div className="text-lg font-bold text-gray-900">
                        ${project.totalBudget.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Paid</div>
                      <div className="text-lg font-bold text-green-600">
                        ${project.paidAmount.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Hours Tracked</div>
                      <div className="text-lg font-bold text-blue-600">{project.timeTracked}h</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Messages</div>
                      <div className="text-lg font-bold text-purple-600">{project.messagesCount}</div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-600">Overall Progress</span>
                      <span className="font-bold text-blue-600">
                        {Math.round((project.milestones.filter(m => m.status === 'approved').length / project.milestones.length) * 100)}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all"
                        style={{ width: `${(project.milestones.filter(m => m.status === 'approved').length / project.milestones.length) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="text-sm font-semibold text-gray-900 mb-2">Milestones</div>
                    <div className="space-y-2">
                      {project.milestones.slice(0, 3).map((milestone) => (
                        <div key={milestone.id} className="flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${getMilestoneStatusColor(milestone.status)}`} />
                            <span className="text-gray-600">{milestone.title}</span>
                          </div>
                          <span className={`font-semibold ${getMilestoneStatusColor(milestone.status)}`}>
                            {milestone.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.requiredSkills.slice(0, 4).map((skill) => (
                      <span
                        key={skill}
                        className="px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded-full text-xs font-semibold"
                      >
                        {skill}
                      </span>
                    ))}
                    {project.requiredSkills.length > 4 && (
                      <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold">
                        +{project.requiredSkills.length - 4} more
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {accountType !== 'solo' && canUserAssignTeam() && (
                      <button
                        onClick={() => openTeamModal(project.id)}
                        className="flex-1 flex items-center justify-center space-x-2 bg-white border-2 border-blue-600 text-blue-600 px-4 py-3 rounded-xl font-bold hover:bg-blue-50 transition-colors"
                        title={currentMembership?.role === 'owner' || currentMembership?.role === 'admin' ? 'Manage team members' : 'Assign developer company'}
                      >
                        <Users className="w-5 h-5" />
                        <span>{currentMembership?.role === 'owner' || currentMembership?.role === 'admin' ? 'Team' : 'Assign'}</span>
                      </button>
                    )}
                    <Link
                      to={`/company/${companyId}/project/${project.id}/dashboard`}
                      className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-shadow"
                    >
                      <span>View Project</span>
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {filteredProjects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{project.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(project.status)}`}>
                        {project.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-4">{project.description}</p>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-6">
                        <div className="flex items-center space-x-2">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          <span className="text-sm">
                            <span className="font-bold text-gray-900">${project.paidAmount.toLocaleString()}</span>
                            <span className="text-gray-600"> / ${project.totalBudget.toLocaleString()}</span>
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-semibold text-gray-900">{project.timeTracked}h tracked</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MessageSquare className="w-4 h-4 text-purple-600" />
                          <span className="text-sm font-semibold text-gray-900">{project.messagesCount} messages</span>
                        </div>
                      </div>

                      {/* Team Members Avatars in List View */}
                      <div className="flex items-center space-x-3">
                        <span className="text-sm text-gray-600 font-semibold">Team:</span>
                        {getAssignedTeam(project.id).length > 0 ? (
                          <div className="flex -space-x-2">
                            {getAssignedTeam(project.id).slice(0, 4).map((member) => (
                              <div
                                key={member.id}
                                className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold border-2 border-white"
                                title={`${member?.name || 'Team Member'} - ${member?.role || 'Member'}`}
                              >
                                {member?.name ? member.name.split(' ').map(n => n[0]).join('') : 'TM'}
                              </div>
                            ))}
                            {getAssignedTeam(project.id).length > 4 && (
                              <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center text-white text-xs font-bold border-2 border-white">
                                +{getAssignedTeam(project.id).length - 4}
                              </div>
                            )}
                          </div>
                        ) : accountType === 'solo' ? (
                          <span className="text-sm text-gray-600">You</span>
                        ) : canUserAssignTeam() ? (
                          <button
                            onClick={() => openTeamModal(project.id)}
                            className="text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                            title={currentMembership?.role === 'owner' || currentMembership?.role === 'admin' ? 'Assign team members to this project' : 'Assign developer company'}
                          >
                            <UserPlus className="w-4 h-4" />
                            <span>{currentMembership?.role === 'owner' || currentMembership?.role === 'admin' ? 'Assign Team' : 'Assign Company'}</span>
                          </button>
                        ) : (
                          <span className="text-sm text-gray-500">Not assigned</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {project.requiredSkills.map((skill) => (
                        <span
                          key={skill}
                          className="px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded-full text-xs font-semibold"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="ml-6 flex flex-col gap-2">
                    {accountType !== 'solo' && canUserAssignTeam() && (
                      <button
                        onClick={() => openTeamModal(project.id)}
                        className="flex items-center justify-center space-x-2 bg-white border-2 border-blue-600 text-blue-600 px-4 py-2 rounded-xl font-bold hover:bg-blue-50 transition-colors"
                        title={currentMembership?.role === 'owner' || currentMembership?.role === 'admin' ? 'Manage team members' : 'Assign developer company'}
                      >
                        <Users className="w-4 h-4" />
                        <span>{currentMembership?.role === 'owner' || currentMembership?.role === 'admin' ? 'Manage Team' : 'Assign Company'}</span>
                      </button>
                    )}
                    <Link
                      to={`/company/${companyId}/project/${project.id}/dashboard`}
                      className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-shadow"
                    >
                      <span>View Details</span>
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
          </AnimatePresence>

          {filteredProjects.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center"
            >
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No projects found</h3>
              <p className="text-gray-600 mb-6">
                {searchQuery || filterStatus !== 'all'
                  ? 'Try adjusting your filters or search query'
                  : 'You have no assigned projects yet'}
              </p>
            </motion.div>
          )}
        </>
      )}

      {/* Team Assignment Modal */}
      <AnimatePresence>
        {showTeamModal && selectedProject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowTeamModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-black text-gray-900">
                      {currentMembership?.role === 'owner' || currentMembership?.role === 'admin'
                        ? 'Assign Team Members'
                        : 'Assign Developer Company'}
                    </h2>
                    <p className="text-gray-600 mt-1">
                      {projects.find(p => p.id === selectedProject)?.title}
                    </p>
                    {currentMembership?.role === 'owner' || currentMembership?.role === 'admin' ? (
                      <p className="text-sm text-gray-500 mt-1">
                        Select team members from your company to work on this project
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500 mt-1">
                        Assign this project to a developer company
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setShowTeamModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <X className="w-6 h-6 text-gray-600" />
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                <div className="space-y-3">
                  {teamMembers.map((member) => {
                    const isSelected = selectedTeamMembers.includes(member.id);
                    const isOverbooked = member.workloadPercentage >= 100;

                    return (
                      <div
                        key={member.id}
                        className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                        onClick={() => handleToggleTeamMember(member.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleTeamMember(member.id)}
                              className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                            />
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                                  {member.avatar ? (
                                    <img src={member.avatar} alt={member.name} className="w-full h-full rounded-full object-cover" />
                                  ) : (
                                    member.name.split(' ').map(n => n[0]).join('')
                                  )}
                                </div>
                                <div>
                                  <div className="font-bold text-gray-900">{member.name}</div>
                                  <div className="text-sm text-gray-600">{member.role}</div>
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-2 mb-3">
                                {member.skills?.slice(0, 4).map((skill) => (
                                  <span
                                    key={skill}
                                    className="px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold"
                                  >
                                    {skill}
                                  </span>
                                ))}
                                {member.skills && member.skills.length > 4 && (
                                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs">
                                    +{member.skills.length - 4} more
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center space-x-4 text-sm">
                                <div className={`px-3 py-1 rounded-lg font-semibold border ${getWorkloadColor(member.workloadPercentage)}`}>
                                  {member.workloadPercentage}% workload
                                </div>
                                <div className="text-gray-600">
                                  {member.currentProjects} active {member.currentProjects === 1 ? 'project' : 'projects'}
                                </div>
                                {member.hourlyRate && (
                                  <div className="text-gray-600">
                                    ${member.hourlyRate}/hr
                                  </div>
                                )}
                              </div>

                              {isOverbooked && (
                                <div className="flex items-center space-x-2 mt-2 text-red-600 text-sm">
                                  <AlertTriangle className="w-4 h-4" />
                                  <span className="font-semibold">
                                    Warning: This team member is currently overbooked
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    {selectedTeamMembers.length} team {selectedTeamMembers.length === 1 ? 'member' : 'members'} selected
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowTeamModal(false)}
                      className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAssignTeam}
                      disabled={selectedTeamMembers.length === 0}
                      className={`px-6 py-3 rounded-xl font-bold transition-all ${
                        selectedTeamMembers.length === 0
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg'
                      }`}
                    >
                      Assign Team
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Projects;
