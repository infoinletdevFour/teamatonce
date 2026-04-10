import React from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign, Clock, Star, Users, Calendar,
  Bookmark, TrendingUp, Award
} from 'lucide-react';
import { Project } from '@/types/developer';

interface ProjectCardProps {
  project: Project;
  onApply?: (projectId: string) => void;
  onSave?: (projectId: string) => void;
  isSaved?: boolean;
  showMatchPercentage?: boolean;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onApply,
  onSave,
  isSaved = false,
  showMatchPercentage = false,
}) => {
  const getBudgetDisplay = () => {
    if (project.budget.type === 'fixed') {
      return `$${project.budget.min.toLocaleString()} - $${project.budget.max.toLocaleString()}`;
    }
    return `$${project.budget.min}/hr - $${project.budget.max}/hr`;
  };

  const getExperienceBadgeColor = () => {
    switch (project.experienceLevel) {
      case 'entry':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'intermediate':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'expert':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
      className="bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-lg relative overflow-hidden group"
    >
      {/* Match Percentage Badge */}
      {showMatchPercentage && project.matchPercentage && (
        <div className="absolute top-4 right-4 z-10">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg flex items-center space-x-2"
          >
            <TrendingUp className="w-4 h-4" />
            <span>{project.matchPercentage}% Match</span>
          </motion.div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-xl font-bold text-gray-900">{project.title}</h3>
            {project.projectType === 'ongoing' && (
              <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-semibold">
                Ongoing
              </span>
            )}
          </div>
          <p className="text-gray-600 line-clamp-2 mb-3">{project.description}</p>
        </div>
      </div>

      {/* Client Info */}
      <div className="flex items-center space-x-3 mb-4 pb-4 border-b border-gray-100">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white font-bold">
          {project.clientName[0]}
        </div>
        <div className="flex-1">
          <div className="font-semibold text-gray-900">{project.clientName}</div>
          <div className="flex items-center space-x-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm text-gray-600">
              {project.clientRating.toFixed(1)} rating
            </span>
          </div>
        </div>
        <button
          onClick={() => onSave?.(project.id)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Bookmark
            className={`w-5 h-5 ${
              isSaved ? 'fill-blue-600 text-blue-600' : 'text-gray-400'
            }`}
          />
        </button>
      </div>

      {/* Skills Required */}
      <div className="mb-4">
        <div className="text-xs font-semibold text-gray-500 mb-2">Required Skills</div>
        <div className="flex flex-wrap gap-2">
          {project.requiredSkills.slice(0, 6).map((skill, idx) => (
            <span
              key={idx}
              className="bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold border border-blue-200"
            >
              {skill}
            </span>
          ))}
          {project.requiredSkills.length > 6 && (
            <span className="text-blue-600 text-xs font-semibold px-2 py-1">
              +{project.requiredSkills.length - 6} more
            </span>
          )}
        </div>
      </div>

      {/* Project Details Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center space-x-2 text-sm">
          <DollarSign className="w-4 h-4 text-green-600" />
          <div>
            <div className="text-gray-500 text-xs">Budget</div>
            <div className="font-bold text-gray-900">{getBudgetDisplay()}</div>
          </div>
        </div>
        <div className="flex items-center space-x-2 text-sm">
          <Clock className="w-4 h-4 text-blue-600" />
          <div>
            <div className="text-gray-500 text-xs">Duration</div>
            <div className="font-bold text-gray-900">{project.duration}</div>
          </div>
        </div>
        <div className="flex items-center space-x-2 text-sm">
          <Users className="w-4 h-4 text-purple-600" />
          <div>
            <div className="text-gray-500 text-xs">Proposals</div>
            <div className="font-bold text-gray-900">{project.proposalsCount}</div>
          </div>
        </div>
        <div className="flex items-center space-x-2 text-sm">
          <Award className="w-4 h-4 text-orange-600" />
          <div>
            <div className="text-gray-500 text-xs">Level</div>
            <div className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${getExperienceBadgeColor()}`}>
              {project.experienceLevel}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Calendar className="w-4 h-4" />
          <span>Posted {new Date(project.postedDate).toLocaleDateString()}</span>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onApply?.(project.id)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg hover:shadow-xl transition-shadow"
        >
          Apply Now
        </motion.button>
      </div>
    </motion.div>
  );
};

export default ProjectCard;
