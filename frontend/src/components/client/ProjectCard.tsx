import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Calendar,
  DollarSign,
  Users,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader
} from 'lucide-react';
import { Project } from '../../types/client';
import { extractRouteContext } from '@/lib/navigation-utils';

interface ProjectCardProps {
  project: Project;
  delay?: number;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, delay = 0 }) => {
  const navigate = useNavigate();
  const params = useParams();
  const { companyId } = extractRouteContext(params);

  // Strip HTML tags from description
  const getPlainTextDescription = (html: string) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const getStatusConfig = (status: Project['status']) => {
    switch (status) {
      case 'active':
        return {
          color: 'from-sky-800 via-sky-700 to-sky-600',
          bgColor: 'bg-sky-50',
          textColor: 'text-sky-700',
          icon: Loader,
          label: 'Active'
        };
      case 'pending':
        return {
          color: 'from-yellow-600 to-yellow-500',
          bgColor: 'bg-yellow-50',
          textColor: 'text-yellow-700',
          icon: Clock,
          label: 'Pending'
        };
      case 'completed':
        return {
          color: 'from-green-600 to-green-500',
          bgColor: 'bg-green-50',
          textColor: 'text-green-700',
          icon: CheckCircle2,
          label: 'Completed'
        };
      case 'cancelled':
        return {
          color: 'from-red-600 to-red-500',
          bgColor: 'bg-red-50',
          textColor: 'text-red-700',
          icon: AlertCircle,
          label: 'Cancelled'
        };
      default:
        return {
          color: 'from-gray-600 to-gray-500',
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-700',
          icon: Clock,
          label: 'Unknown'
        };
    }
  };

  const statusConfig = getStatusConfig(project.status);
  const StatusIcon = statusConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ y: -5, scale: 1.02 }}
      onClick={() => navigate(`/company/${companyId}/client/projects/${project.id}`)}
      className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100 hover:border-sky-300 cursor-pointer transition-all relative overflow-hidden group"
    >
      {/* Background Gradient on Hover */}
      <div className={`absolute inset-0 bg-gradient-to-br ${statusConfig.color} opacity-0 group-hover:opacity-5 transition-opacity`} />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-xl font-black text-gray-900 group-hover:text-sky-600 transition-colors">
                {project.name}
              </h3>
              <div className={`px-3 py-1 rounded-full text-xs font-bold ${statusConfig.bgColor} ${statusConfig.textColor} flex items-center space-x-1 whitespace-nowrap`}>
                <StatusIcon className="w-3 h-3" />
                <span>{statusConfig.label}</span>
              </div>
            </div>
            <p className="text-sm text-gray-600 line-clamp-2">
              {getPlainTextDescription(project.description)}
            </p>
          </div>
        </div>

        {/* Technologies */}
        <div className="flex flex-wrap gap-2 mb-4">
          {project.technologies.slice(0, 4).map((tech, idx) => (
            <span
              key={idx}
              className="px-3 py-1 bg-sky-50 text-sky-700 rounded-full text-xs font-semibold border border-sky-200"
            >
              {tech.name}
            </span>
          ))}
          {project.technologies.length > 4 && (
            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
              +{project.technologies.length - 4} more
            </span>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">Progress</span>
            <span className="text-sm font-bold text-gray-900">{project.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${project.progress}%` }}
              transition={{ duration: 1, delay: delay + 0.3 }}
              className={`h-2 rounded-full bg-gradient-to-r ${statusConfig.color}`}
            />
          </div>
        </div>

        {/* Team Members */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Team</span>
          </div>
          <div className="flex -space-x-2">
            {project.team.slice(0, 4).map((member) => (
              <div
                key={member.id}
                className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-800 via-sky-700 to-sky-600 border-2 border-white flex items-center justify-center text-white text-xs font-bold"
                title={member.name}
              >
                {member.avatar ? (
                  <img src={member.avatar} alt={member.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  member.name.charAt(0).toUpperCase()
                )}
              </div>
            ))}
            {project.team.length > 4 && (
              <div className="w-8 h-8 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center text-gray-700 text-xs font-bold">
                +{project.team.length - 4}
              </div>
            )}
          </div>
        </div>

        {/* Footer Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${statusConfig.color} flex items-center justify-center`}>
              <DollarSign className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-xs text-gray-500">Budget</div>
              <div className="text-sm font-bold text-gray-900">
                ${project.budget >= 10000
                  ? `${(project.budget / 1000).toFixed(1)}K`
                  : project.budget.toLocaleString()}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${statusConfig.color} flex items-center justify-center`}>
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-xs text-gray-500">Duration</div>
              <div className="text-sm font-bold text-gray-900">
                {Math.ceil((new Date(project.endDate).getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24 * 7))} weeks
              </div>
            </div>
          </div>
        </div>

        {/* Hover Action */}
        <motion.div
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          className="absolute bottom-4 right-4 bg-gradient-to-r from-sky-800 via-sky-700 to-sky-600 text-white p-2 rounded-full shadow-lg"
        >
          <ArrowRight className="w-4 h-4" />
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ProjectCard;
