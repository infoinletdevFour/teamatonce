/**
 * Team Member Profile Page
 *
 * Displays detailed profile information for a team member
 * Works for both client and developer/seller team members
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  MapPin,
  Clock,
  Calendar,
  Star,
  Briefcase,
  Code,
  Shield,
  Crown,
  Palette,
  Bug,
  Globe,
  Github,
  Linkedin,
  CheckCircle,
  Activity,
  TrendingUp,
  Award,
  Target,
  Users,
} from 'lucide-react';
import { ProjectPageLayout } from '@/layouts/ProjectPageLayout';
import { useCompany } from '@/contexts/CompanyContext';
import teamMemberService from '@/services/teamMemberService';
import type { TeamMember, TeamRole } from '@/types/teamMember';

export const TeamMemberProfile: React.FC = () => {
  const { projectId, memberId } = useParams<{ projectId: string; memberId: string }>();
  const { companyId } = useCompany();
  const navigate = useNavigate();

  const [member, setMember] = useState<TeamMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (projectId && memberId) {
      loadMemberProfile();
    }
  }, [projectId, memberId]);

  const loadMemberProfile = async () => {
    if (!projectId || !memberId) return;

    setLoading(true);
    setError(null);
    try {
      // Try to get the member from the project team
      const members = await teamMemberService.getProjectTeam(projectId);
      const foundMember = members.find(m => m.id === memberId || m.user_id === memberId);

      if (foundMember) {
        setMember(foundMember);
      } else {
        setError('Team member not found');
      }
    } catch (err: any) {
      console.error('Failed to load member profile:', err);
      setError(err.message || 'Failed to load member profile');
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role: TeamRole) => {
    switch (role) {
      case 'owner':
        return Crown;
      case 'admin':
        return Shield;
      case 'designer':
        return Palette;
      case 'qa':
        return Bug;
      case 'developer':
      default:
        return Code;
    }
  };

  const getRoleColor = (role: TeamRole) => {
    switch (role) {
      case 'owner':
        return 'from-yellow-500 to-orange-500';
      case 'admin':
        return 'from-indigo-500 to-purple-500';
      case 'designer':
        return 'from-pink-500 to-rose-500';
      case 'qa':
        return 'from-green-500 to-emerald-500';
      case 'developer':
      default:
        return 'from-blue-500 to-cyan-500';
    }
  };

  const getRoleLabel = (role: TeamRole) => {
    switch (role) {
      case 'owner':
        return 'Owner';
      case 'admin':
        return 'Admin';
      case 'designer':
        return 'Designer';
      case 'qa':
        return 'QA Engineer';
      case 'developer':
      default:
        return 'Developer';
    }
  };

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available':
        return 'bg-green-500';
      case 'busy':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getAvailabilityLabel = (availability: string) => {
    switch (availability) {
      case 'available':
        return 'Available';
      case 'busy':
        return 'Busy';
      default:
        return 'Offline';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Header actions
  const headerActions = (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => navigate(`/company/${companyId}/project/${projectId}/team`)}
      className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl font-semibold transition-colors"
    >
      <ArrowLeft className="w-4 h-4" />
      <span>Back to Team</span>
    </motion.button>
  );

  if (loading) {
    return (
      <ProjectPageLayout title="Team Member Profile" headerActions={headerActions}>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"
            />
            <p className="text-gray-600 font-semibold">Loading profile...</p>
          </div>
        </div>
      </ProjectPageLayout>
    );
  }

  if (error || !member) {
    return (
      <ProjectPageLayout title="Team Member Profile" headerActions={headerActions}>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Member Not Found</h3>
            <p className="text-gray-600 mb-6">{error || 'The team member could not be found.'}</p>
            <button
              onClick={() => navigate(`/company/${companyId}/project/${projectId}/team`)}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
            >
              Back to Team
            </button>
          </div>
        </div>
      </ProjectPageLayout>
    );
  }

  const RoleIcon = getRoleIcon(member.role);

  return (
    <ProjectPageLayout
      title="Team Member Profile"
      subtitle={`Viewing ${member.name}'s profile`}
      headerActions={headerActions}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Main Profile Card */}
        <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
          >
            {/* Header Gradient */}
            <div className={`h-32 bg-gradient-to-r ${getRoleColor(member.role)} relative`}>
              <div className="absolute inset-0 opacity-20">
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-white rounded-full" />
              </div>
              {member.online_status && (
                <div className="absolute top-4 right-4 flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-white text-sm font-semibold">Online</span>
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="p-6 -mt-16">
              {/* Avatar */}
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 border-4 border-white shadow-xl flex items-center justify-center text-white text-3xl font-black">
                    {member.avatar ? (
                      <img src={member.avatar} alt={member.name} className="w-full h-full rounded-2xl object-cover" />
                    ) : (
                      member.name.split(' ').map(n => n[0]).join('')
                    )}
                  </div>
                  <div className={`absolute -bottom-2 -right-2 w-10 h-10 ${getAvailabilityColor(member.availability)} rounded-full border-4 border-white flex items-center justify-center`}>
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>

              {/* Name & Role */}
              <div className="text-center mb-6">
                <h2 className="text-2xl font-black text-gray-900 mb-1">{member.name}</h2>
                <p className="text-gray-600 mb-3">{member.title || getRoleLabel(member.role)}</p>
                <div className="flex items-center justify-center space-x-2">
                  <span className={`px-3 py-1.5 rounded-xl text-sm font-bold bg-gradient-to-r ${getRoleColor(member.role)} text-white flex items-center space-x-1`}>
                    <RoleIcon className="w-4 h-4" />
                    <span>{getRoleLabel(member.role)}</span>
                  </span>
                  <span className={`px-3 py-1.5 rounded-xl text-sm font-bold ${
                    member.availability === 'available'
                      ? 'bg-green-100 text-green-700'
                      : member.availability === 'busy'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-700'
                  }`}>
                    {getAvailabilityLabel(member.availability)}
                  </span>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center space-x-3 text-gray-600">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <span className="text-sm">{member.email}</span>
                </div>
                {member.location && (
                  <div className="flex items-center space-x-3 text-gray-600">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <span className="text-sm">{member.location}</span>
                  </div>
                )}
                {member.timezone && (
                  <div className="flex items-center space-x-3 text-gray-600">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <span className="text-sm">{member.timezone}</span>
                  </div>
                )}
                <div className="flex items-center space-x-3 text-gray-600">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <span className="text-sm">Joined {formatDate(member.joined_date || member.created_at)}</span>
                </div>
              </div>

              {/* Social Links */}
              {member.social_links && (
                <div className="flex items-center justify-center space-x-3 pt-4 border-t border-gray-200">
                  {member.social_links.github && (
                    <a
                      href={member.social_links.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors"
                    >
                      <Github className="w-5 h-5 text-gray-700" />
                    </a>
                  )}
                  {member.social_links.linkedin && (
                    <a
                      href={member.social_links.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 bg-blue-100 hover:bg-blue-200 rounded-xl flex items-center justify-center transition-colors"
                    >
                      <Linkedin className="w-5 h-5 text-blue-700" />
                    </a>
                  )}
                  {member.social_links.website && (
                    <a
                      href={member.social_links.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 bg-purple-100 hover:bg-purple-200 rounded-xl flex items-center justify-center transition-colors"
                    >
                      <Globe className="w-5 h-5 text-purple-700" />
                    </a>
                  )}
                </div>
              )}

            </div>
          </motion.div>
        </div>

        {/* Right Column - Stats & Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: 'Workload',
                value: `${member.workload_percentage}%`,
                icon: Activity,
                color: member.workload_percentage >= 80 ? 'from-red-500 to-orange-500' : 'from-blue-500 to-cyan-500',
              },
              {
                label: 'Projects',
                value: member.current_projects,
                icon: Briefcase,
                color: 'from-purple-500 to-indigo-500',
              },
              {
                label: 'Completed',
                value: member.projects_completed || 0,
                icon: CheckCircle,
                color: 'from-green-500 to-emerald-500',
              },
              {
                label: 'Rating',
                value: member.rating ? `${member.rating.toFixed(1)}` : 'N/A',
                icon: Star,
                color: 'from-yellow-500 to-orange-500',
              },
            ].map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-2xl p-4 shadow-lg border border-gray-200"
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
                <div className="text-2xl font-black text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-600 font-semibold">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Workload Progress */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <span>Current Workload</span>
            </h3>
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-gray-600 font-semibold">Utilization</span>
              <span className={`font-bold ${member.workload_percentage >= 100 ? 'text-red-600' : 'text-gray-900'}`}>
                {member.workload_percentage}%
              </span>
            </div>
            <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(member.workload_percentage, 100)}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className={`h-full ${
                  member.workload_percentage >= 100
                    ? 'bg-red-500'
                    : member.workload_percentage >= 80
                      ? 'bg-yellow-500'
                      : member.workload_percentage >= 50
                        ? 'bg-blue-500'
                        : 'bg-green-500'
                }`}
              />
            </div>
            {member.workload_percentage > 100 && (
              <p className="text-sm text-red-600 mt-2 font-semibold">
                Overbooked by {member.workload_percentage - 100}%
              </p>
            )}
          </motion.div>

          {/* Skills */}
          {member.skills && member.skills.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <Code className="w-5 h-5 text-purple-600" />
                <span>Skills & Technologies</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {member.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl text-sm font-semibold"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </motion.div>
          )}

          {/* Expertise/Specializations */}
          {member.expertise && member.expertise.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <Award className="w-5 h-5 text-yellow-600" />
                <span>Areas of Expertise</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {member.expertise.map((exp, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-xl text-sm font-semibold"
                  >
                    {exp}
                  </span>
                ))}
              </div>
            </motion.div>
          )}

          {/* Current Projects */}
          {member.current_project_names && member.current_project_names.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <Target className="w-5 h-5 text-green-600" />
                <span>Current Projects ({member.current_project_names.length})</span>
              </h3>
              <div className="space-y-2">
                {member.current_project_names.map((project, idx) => (
                  <div
                    key={idx}
                    className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl"
                  >
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <span className="text-gray-700 font-medium">{project}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Hourly Rate */}
          {member.hourly_rate && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-6 shadow-lg text-white"
            >
              <h3 className="text-lg font-bold mb-2">Hourly Rate</h3>
              <div className="text-4xl font-black">${member.hourly_rate}/hr</div>
            </motion.div>
          )}
        </div>
      </div>
    </ProjectPageLayout>
  );
};

export default TeamMemberProfile;
