/**
 * Recent Projects Widget
 * Displays a list of recent projects with quick actions
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Users,
  Calendar,
  DollarSign,
  MessageSquare,
  ExternalLink,
  Clock,
  Target,
  UsersRound,
} from 'lucide-react';
import { Project } from '@/types/client';

interface RecentProjectsProps {
  projects: Project[];
  loading?: boolean;
  onProjectClick?: (projectId: string) => void;
  companyId?: string;
}

const ProjectSkeleton: React.FC<{ index: number }> = ({ index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 + index * 0.1 }}
      className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-200"
    >
      <div className="animate-pulse">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="w-48 h-6 bg-gray-200 rounded mb-2" />
            <div className="w-full h-4 bg-gray-200 rounded" />
          </div>
          <div className="w-20 h-6 bg-gray-200 rounded-full" />
        </div>
        <div className="space-y-2 mb-4">
          <div className="w-full h-2 bg-gray-200 rounded" />
          <div className="flex justify-between">
            <div className="w-16 h-4 bg-gray-200 rounded" />
            <div className="w-16 h-4 bg-gray-200 rounded" />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <div className="w-8 h-8 bg-gray-200 rounded-full" />
            <div className="w-8 h-8 bg-gray-200 rounded-full" />
          </div>
          <div className="flex space-x-2">
            <div className="w-20 h-8 bg-gray-200 rounded-lg" />
            <div className="w-20 h-8 bg-gray-200 rounded-lg" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const ProjectCard: React.FC<{
  project: Project;
  index: number;
  onProjectClick?: (projectId: string) => void;
  companyId?: string;
}> = ({ project, index, onProjectClick, companyId }) => {
  const navigate = useNavigate();

  // Strip HTML tags from description
  const getPlainTextDescription = (html: string) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'planning':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'awarded':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'active':
      case 'in_progress':
        return 'bg-sky-100 text-sky-700 border-sky-200';
      case 'pending':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const handleProjectClick = () => {
    if (onProjectClick) {
      onProjectClick(project.id);
    } else if (companyId) {
      navigate(`/company/${companyId}/project/${project.id}/dashboard`);
    }
  };

  const handleMessageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (companyId) {
      navigate(`/company/${companyId}/client/messages?project=${project.id}`);
    }
  };

  const handleMilestonesClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (companyId) {
      navigate(`/company/${companyId}/project/${project.id}/milestones`);
    }
  };

  const handleTeamClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (companyId) {
      navigate(`/company/${companyId}/project/${project.id}/team`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 + index * 0.1 }}
      whileHover={{ y: -5, scale: 1.01 }}
      onClick={handleProjectClick}
      className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100 hover:border-sky-300 transition-all cursor-pointer group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 mr-4">
          <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-sky-600 transition-colors">
            {project.name}
          </h3>
          <p className="text-sm text-gray-600 line-clamp-2">
            {getPlainTextDescription(project.description)}
          </p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-bold border-2 whitespace-nowrap ${getStatusColor(
            project.status
          )}`}
        >
          {project.status.replace(/_/g, ' ').charAt(0).toUpperCase() + project.status.replace(/_/g, ' ').slice(1)}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-600">Progress</span>
          <span className="text-xs font-bold text-gray-900">
            {project.progress}%
          </span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${project.progress}%` }}
            transition={{ delay: 0.8 + index * 0.1, duration: 0.6 }}
            className="h-full bg-gradient-to-r from-sky-800 via-sky-700 to-sky-600"
          />
        </div>
      </div>

      {/* Project Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4 pb-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-sky-100 rounded-lg flex items-center justify-center">
            <DollarSign className="w-4 h-4 text-sky-600" />
          </div>
          <div>
            <div className="text-xs text-gray-500">Budget</div>
            <div className="text-sm font-bold text-gray-900">
              ${project.budget >= 10000
                ? `${(project.budget / 1000).toFixed(0)}K`
                : project.budget.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-sky-100 rounded-lg flex items-center justify-center">
            <Users className="w-4 h-4 text-sky-600" />
          </div>
          <div>
            <div className="text-xs text-gray-500">Team</div>
            <div className="text-sm font-bold text-gray-900">
              {project.team?.length || 0}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-sky-100 rounded-lg flex items-center justify-center">
            <Calendar className="w-4 h-4 text-sky-600" />
          </div>
          <div>
            <div className="text-xs text-gray-500">Timeline</div>
            <div className="text-sm font-bold text-gray-900">
              {Math.ceil(
                (project.endDate.getTime() - new Date().getTime()) /
                  (1000 * 60 * 60 * 24)
              )}
              d
            </div>
          </div>
        </div>
      </div>

      {/* Team Members and Actions */}
      <div className="flex items-center justify-between">
        {/* Team Avatars */}
        <div className="flex -space-x-2">
          {(project.team || []).slice(0, 3).map((member) => (
            <div
              key={member.id}
              className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-800 via-sky-700 to-sky-600 flex items-center justify-center text-white text-xs font-bold border-2 border-white shadow-sm"
              title={member.name || 'Team Member'}
            >
              {(member.name || 'TM')
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </div>
          ))}
          {(project.team?.length || 0) > 3 && (
            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 text-xs font-bold border-2 border-white shadow-sm">
              +{(project.team?.length || 0) - 3}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex items-center space-x-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleMessageClick}
            className="p-2 bg-sky-100 text-sky-600 rounded-lg hover:bg-sky-200 transition-colors"
            title="Messages"
          >
            <MessageSquare className="w-4 h-4" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleMilestonesClick}
            className="p-2 bg-sky-100 text-sky-600 rounded-lg hover:bg-sky-200 transition-colors"
            title="Milestones"
          >
            <Target className="w-4 h-4" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleTeamClick}
            className="p-2 bg-sky-100 text-sky-600 rounded-lg hover:bg-sky-200 transition-colors"
            title="Team"
          >
            <UsersRound className="w-4 h-4" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleProjectClick}
            className="p-2 bg-sky-100 text-sky-600 rounded-lg hover:bg-sky-200 transition-colors"
            title="View Project"
          >
            <ExternalLink className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {/* Technologies */}
      {project.technologies && project.technologies.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            {project.technologies.slice(0, 4).map((tech, idx) => (
              <span
                key={idx}
                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-md"
              >
                {tech.name}
              </span>
            ))}
            {project.technologies.length > 4 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-md">
                +{project.technologies.length - 4} more
              </span>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export const RecentProjects: React.FC<RecentProjectsProps> = ({
  projects,
  loading = false,
  onProjectClick,
  companyId,
}) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="space-y-6">
        {[0, 1, 2].map((index) => (
          <ProjectSkeleton key={index} index={index} />
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-12 shadow-lg border-2 border-gray-200 text-center"
      >
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          No Projects Yet
        </h3>
        <p className="text-gray-600 mb-6">
          Start your first project to see it here
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            if (companyId) {
              navigate(`/company/${companyId}/client/post-project`);
            } else {
              navigate('/select-company');
            }
          }}
          className="px-6 py-3 bg-gradient-to-r from-sky-800 via-sky-700 to-sky-600 text-white rounded-xl font-semibold hover:from-sky-900 hover:via-sky-800 hover:to-sky-700 hover:shadow-lg transition-all"
        >
          Post New Project
        </motion.button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Show max 4 projects in 2x2 grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {projects.slice(0, 4).map((project, index) => (
          <ProjectCard
            key={project.id}
            project={project}
            index={index}
            onProjectClick={onProjectClick}
            companyId={companyId}
          />
        ))}
      </div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        whileHover={{ scale: 1.02 }}
        onClick={() => {
          if (companyId) {
            navigate(`/company/${companyId}/client/projects`);
          } else {
            navigate('/select-company');
          }
        }}
        className="w-full py-4 bg-white border-2 border-dashed border-gray-300 rounded-2xl text-gray-600 font-bold hover:border-sky-400 hover:text-sky-600 transition-colors flex items-center justify-center space-x-2"
      >
        <span>View All Projects</span>
        <ArrowRight className="w-5 h-5" />
      </motion.button>
    </div>
  );
};

export default RecentProjects;
