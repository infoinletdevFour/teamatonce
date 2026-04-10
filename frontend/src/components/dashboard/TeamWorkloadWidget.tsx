import React from 'react';
import { motion } from 'framer-motion';
import { Users, TrendingUp, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { MemberWorkload } from '@/types/company';

interface TeamWorkloadWidgetProps {
  teamMembers: MemberWorkload[];
  onMemberClick?: (memberId: string) => void;
}

export const TeamWorkloadWidget: React.FC<TeamWorkloadWidgetProps> = ({
  teamMembers,
  onMemberClick,
}) => {
  // Ensure teamMembers is an array and transform data
  const members = Array.isArray(teamMembers)
    ? teamMembers.map(m => ({
        id: m.member_id,
        name: m.member_name,
        role: 'Team Member',
        workload: m.capacity_percentage,
        projects: m.current_projects,
      }))
    : [];

  const getWorkloadColor = (workload: number): string => {
    if (workload < 60) return 'bg-green-500';
    if (workload < 80) return 'bg-yellow-500';
    if (workload <= 100) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getWorkloadTextColor = (workload: number): string => {
    if (workload < 60) return 'text-green-600';
    if (workload < 80) return 'text-yellow-600';
    if (workload <= 100) return 'text-orange-600';
    return 'text-red-600';
  };

  const getWorkloadStatus = (workload: number): { icon: React.ElementType; label: string } => {
    if (workload < 60) return { icon: CheckCircle, label: 'Available' };
    if (workload < 80) return { icon: Clock, label: 'Moderate' };
    if (workload <= 100) return { icon: AlertCircle, label: 'Busy' };
    return { icon: AlertCircle, label: 'Overloaded' };
  };

  const averageWorkload = members.length > 0
    ? members.reduce((sum, member) => sum + member.workload, 0) / members.length
    : 0;
  const availableMembers = members.filter(m => m.workload < 80).length;
  const busyMembers = members.filter(m => m.workload >= 80).length;

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Team Workload</h3>
              <p className="text-sm text-gray-600">Real-time capacity overview</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-gray-900">{Math.round(averageWorkload)}%</div>
            <div className="text-xs text-gray-600">Average Load</div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl p-3 border border-gray-200">
            <div className="text-lg font-bold text-green-600">{availableMembers}</div>
            <div className="text-xs text-gray-600">Available</div>
          </div>
          <div className="bg-white rounded-xl p-3 border border-gray-200">
            <div className="text-lg font-bold text-orange-600">{busyMembers}</div>
            <div className="text-xs text-gray-600">Busy</div>
          </div>
          <div className="bg-white rounded-xl p-3 border border-gray-200">
            <div className="text-lg font-bold text-blue-600">{members.length}</div>
            <div className="text-xs text-gray-600">Total</div>
          </div>
        </div>
      </div>

      {/* Team Members List */}
      <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto">
        {members.map((member, index) => {
          const status = getWorkloadStatus(member.workload);
          const StatusIcon = status.icon;

          return (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => onMemberClick?.(member.id)}
              className="bg-gray-50 rounded-xl p-4 border border-gray-200 cursor-pointer hover:shadow-md transition-all"
            >
              {/* Member Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white font-bold">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </div>

                  {/* Name & Role */}
                  <div>
                    <div className="font-bold text-gray-900">{member.name}</div>
                    <div className="text-xs text-gray-600">{member.role}</div>
                  </div>
                </div>

                {/* Status Badge */}
                <div className={`flex items-center space-x-1 px-2 py-1 rounded-full ${
                  member.workload < 60 ? 'bg-green-100' :
                  member.workload < 80 ? 'bg-yellow-100' :
                  member.workload <= 100 ? 'bg-orange-100' : 'bg-red-100'
                }`}>
                  <StatusIcon className={`w-3 h-3 ${getWorkloadTextColor(member.workload)}`} />
                  <span className={`text-xs font-semibold ${getWorkloadTextColor(member.workload)}`}>
                    {status.label}
                  </span>
                </div>
              </div>

              {/* Workload Progress */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600">Workload</span>
                  <span className={`font-bold ${getWorkloadTextColor(member.workload)}`}>
                    {member.workload}%
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(member.workload, 100)}%` }}
                    transition={{ duration: 0.8, delay: index * 0.1 }}
                    className={`h-full ${getWorkloadColor(member.workload)} relative`}
                  >
                    {member.workload > 100 && (
                      <div className="absolute right-0 top-0 h-full w-1 bg-red-700 animate-pulse" />
                    )}
                  </motion.div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="flex items-center justify-between text-xs text-gray-600">
                <div className="flex items-center space-x-4">
                  <span className="flex items-center space-x-1">
                    <TrendingUp className="w-3 h-3" />
                    <span>{member.projects} projects</span>
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-gray-600">Under 60%</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="text-gray-600">60-80%</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <span className="text-gray-600">80-100%</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-gray-600">Over 100%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamWorkloadWidget;
