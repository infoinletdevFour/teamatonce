import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { sectionPaths, extractRouteContext } from '@/lib/navigation-utils';
import {
  Plus,
  Search,
  Grid,
  List,
  ArrowUpDown,
  Loader2,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import ProjectCard from '../../components/client/ProjectCard';
import { Project as BackendProject, ProjectStatus } from '@/types/project';
import { getClientProjects } from '@/services/projectService';
import { Project as ClientProject } from '../../types/client';
import { useCompanyStore } from '@/stores/companyStore';

const MyProjects: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams();
  const { companyId } = extractRouteContext(params);
  const { isLoading: companyLoading } = useCompanyStore();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ProjectStatus>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'budget' | 'progress'>('recent');
  const [projects, setProjects] = useState<BackendProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load projects from backend when companyId is available from URL
  useEffect(() => {
    if (!companyId) return;
    loadProjects();
  }, [companyId]);

  const loadProjects = async () => {
    if (!companyId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await getClientProjects(companyId);
      setProjects(data);
    } catch (err: any) {
      console.error('Error loading projects:', err);
      setError(err?.response?.data?.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  // Convert backend project to client project format for display
  const convertToClientProject = (project: any): ClientProject => {
    // Map status from backend string to frontend string
    let status: 'active' | 'pending' | 'completed' | 'cancelled' = 'active';
    const projectStatus = (project.status || '').toLowerCase();
    if (projectStatus === 'planning') status = 'pending';
    else if (projectStatus === 'in_progress' || projectStatus === 'active') status = 'active';
    else if (projectStatus === 'completed') status = 'completed';
    else if (projectStatus === 'cancelled') status = 'cancelled';

    return {
      id: project.id,
      name: project.name,
      description: project.description || '',
      status,
      // Convert string values to numbers
      budget: Number(project.budget) || Number(project.estimated_cost) || 0,
      spentAmount: Number(project.spentAmount) || Number(project.actual_cost) || 0,
      startDate: project.startDate ? new Date(project.startDate) :
                 project.start_date ? new Date(project.start_date) : new Date(),
      endDate: project.endDate ? new Date(project.endDate) :
               project.expected_completion_date ? new Date(project.expected_completion_date) : new Date(),
      progress: Number(project.progress) || Number(project.progress_percentage) || 0,
      technologies: (project.technologies || project.tech_stack || []).map((tech: any) =>
        typeof tech === 'string'
          ? { name: tech, category: 'technology' }
          : tech
      ),
      team: project.team || [],
      milestones: project.milestones || [],
      category: project.category || project.project_type || 'General',
      createdAt: new Date(project.createdAt || project.created_at),
      updatedAt: new Date(project.updatedAt || project.updated_at)
    };
  };

  // Use real data from backend
  const allProjects: ClientProject[] = projects.map(convertToClientProject);

  // Filter and sort projects
  const filteredProjects = allProjects
    .filter(project => {
      const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           project.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'budget':
          return b.budget - a.budget;
        case 'progress':
          return b.progress - a.progress;
        case 'recent':
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });

  const projectCounts = {
    all: allProjects.length,
    active: allProjects.filter(p => p.status === 'active').length,
    pending: allProjects.filter(p => p.status === 'pending').length,
    completed: allProjects.filter(p => p.status === 'completed').length,
    cancelled: allProjects.filter(p => p.status === 'cancelled').length
  };

  return (
    <div className="min-h-screen">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center space-x-4 mb-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(sectionPaths.client({ companyId }, 'dashboard'))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </motion.button>
            <div className="flex-1 flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-black text-gray-900 mb-2">My Projects</h1>
                <p className="text-lg text-gray-600">
                  Manage and track all your projects in one place
                </p>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(sectionPaths.client({ companyId }, 'post-project'))}
                className="bg-gradient-to-r from-sky-800 via-sky-700 to-sky-600 text-white px-6 py-3 rounded-xl font-bold flex items-center space-x-2 shadow-lg hover:from-sky-900 hover:via-sky-800 hover:to-sky-700 transition-all"
              >
                <Plus className="w-5 h-5" />
                <span>New Project</span>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Status Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center space-x-2 mb-6 overflow-x-auto pb-2"
        >
          {[
            { key: 'all', label: 'All Projects', count: projectCounts.all },
            { key: 'active', label: 'Active', count: projectCounts.active },
            { key: 'pending', label: 'Pending', count: projectCounts.pending },
            { key: 'completed', label: 'Completed', count: projectCounts.completed },
            { key: 'cancelled', label: 'Cancelled', count: projectCounts.cancelled }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key as any)}
              className={`px-6 py-3 rounded-xl font-bold whitespace-nowrap transition-all ${
                statusFilter === tab.key
                  ? 'bg-gradient-to-r from-sky-800 via-sky-700 to-sky-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
              }`}
            >
              {tab.label}
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                statusFilter === tab.key
                  ? 'bg-white/20'
                  : 'bg-gray-200'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-4 shadow-lg border-2 border-gray-100 mb-6"
        >
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects by name or description..."
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-sky-500 focus:outline-none transition-colors"
              />
            </div>

            {/* Sort */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="appearance-none pl-4 pr-10 py-3 border-2 border-gray-200 rounded-xl focus:border-sky-500 focus:outline-none transition-colors font-semibold bg-white cursor-pointer"
              >
                <option value="recent">Most Recent</option>
                <option value="name">Name (A-Z)</option>
                <option value="budget">Budget (High to Low)</option>
                <option value="progress">Progress</option>
              </select>
              <ArrowUpDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>

            {/* View Mode */}
            <div className="flex items-center space-x-2 bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white text-sky-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white text-sky-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Loading State */}
        {(loading || companyLoading) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <Loader2 className="w-12 h-12 text-sky-600 animate-spin mb-4" />
            <p className="text-lg font-semibold text-gray-600">
              {companyLoading ? 'Loading company information...' : 'Loading your projects...'}
            </p>
          </motion.div>
        )}

        {/* No Company State */}
        {!companyLoading && !companyId && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-2">No Company Found</h3>
            <p className="text-gray-600 mb-6">You need to be part of a company to view projects</p>
          </motion.div>
        )}

        {/* Error State */}
        {error && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 text-center"
          >
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-red-900 mb-2">Error Loading Projects</h3>
            <p className="text-red-700 mb-4">{error}</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={loadProjects}
              className="px-6 py-3 bg-gradient-to-r from-sky-800 via-sky-700 to-sky-600 text-white rounded-xl font-bold hover:from-sky-900 hover:via-sky-800 hover:to-sky-700 transition-all shadow-lg"
            >
              Try Again
            </motion.button>
          </motion.div>
        )}

        {/* Projects Grid/List */}
        {!loading && !error && filteredProjects.length > 0 && (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : 'space-y-4'}>
            {filteredProjects.map((project, index) => (
              <ProjectCard
                key={project.id}
                project={project}
                delay={0.3 + index * 0.05}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredProjects.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center py-20"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-2">No projects found</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery
                ? `No projects match "${searchQuery}"`
                : statusFilter !== 'all'
                ? `No ${statusFilter} projects`
                : 'Get started by posting your first project'}
            </p>
            {statusFilter === 'all' && !searchQuery && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(sectionPaths.client({ companyId }, 'post-project'))}
                className="bg-gradient-to-r from-sky-800 via-sky-700 to-sky-600 text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:from-sky-900 hover:via-sky-800 hover:to-sky-700 transition-all"
              >
                Post Your First Project
              </motion.button>
            )}
          </motion.div>
        )}

        {/* Summary Stats */}
        {!loading && !error && filteredProjects.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4"
          >
            <div className="bg-white border-2 border-gray-100 rounded-xl p-6 hover:border-sky-200 transition-colors">
              <div className="text-sm font-semibold text-gray-600 mb-1">Total Projects</div>
              <div className="text-3xl font-black text-gray-900">{filteredProjects.length}</div>
            </div>
            <div className="bg-white border-2 border-gray-100 rounded-xl p-6 hover:border-sky-200 transition-colors">
              <div className="text-sm font-semibold text-gray-600 mb-1">Total Budget</div>
              <div className="text-3xl font-black text-gray-900">
                ${filteredProjects.reduce((sum, p) => sum + p.budget, 0).toLocaleString()}
              </div>
            </div>
            <div className="bg-white border-2 border-gray-100 rounded-xl p-6 hover:border-sky-200 transition-colors">
              <div className="text-sm font-semibold text-gray-600 mb-1">Team Members</div>
              <div className="text-3xl font-black text-gray-900">
                {filteredProjects.reduce((sum, p) => sum + p.team.length, 0)}
              </div>
            </div>
            <div className="bg-white border-2 border-gray-100 rounded-xl p-6 hover:border-sky-200 transition-colors">
              <div className="text-sm font-semibold text-gray-600 mb-1">Avg Progress</div>
              <div className="text-3xl font-black text-gray-900">
                {Math.round(filteredProjects.reduce((sum, p) => sum + p.progress, 0) / filteredProjects.length)}%
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default MyProjects;
