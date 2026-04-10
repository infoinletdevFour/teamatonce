/**
 * Edit Team Member Modal Component
 *
 * Modal form for editing existing team member information
 */

import React, { useState, useEffect } from 'react';
import { FormModal } from '@/components/ui/Modal';
import type {
  TeamMember,
  TeamRole,
  UpdateTeamMemberData,
  TeamMemberPermissions,
  TeamMemberAvailability,
} from '@/types/teamMember';

interface EditTeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UpdateTeamMemberData) => Promise<void>;
  member: TeamMember | null;
}

const EditTeamMemberModal: React.FC<EditTeamMemberModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  member,
}) => {
  const [role, setRole] = useState<TeamRole>('developer');
  const [title, setTitle] = useState('');
  const [skills, setSkills] = useState('');
  const [workloadPercentage, setWorkloadPercentage] = useState('0');
  const [availability, setAvailability] = useState<TeamMemberAvailability>('available');
  const [hourlyRate, setHourlyRate] = useState('');
  const [location, setLocation] = useState('');
  const [timezone, setTimezone] = useState('');
  const [permissions, setPermissions] = useState<TeamMemberPermissions>({
    canManageTeam: false,
    canManageProjects: false,
    canManageBilling: false,
    canViewReports: false,
    canAssignTasks: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form with member data
  useEffect(() => {
    if (member) {
      setRole(member.role);
      setTitle(member.title || '');
      setSkills(member.skills?.join(', ') || '');
      setWorkloadPercentage(member.workload_percentage?.toString() || '0');
      setAvailability(member.availability);
      setHourlyRate(member.hourly_rate?.toString() || '');
      setLocation(member.location || '');
      setTimezone(member.timezone || '');
      setPermissions(member.permissions || {
        canManageTeam: false,
        canManageProjects: false,
        canManageBilling: false,
        canViewReports: false,
        canAssignTasks: false,
      });
    }
  }, [member]);

  const handlePermissionChange = (key: keyof TeamMemberPermissions) => {
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async () => {
    if (!member) return;

    setError(null);

    // Validation
    const workload = parseFloat(workloadPercentage);
    if (isNaN(workload) || workload < 0) {
      setError('Workload must be a valid number greater than or equal to 0');
      return;
    }

    setIsLoading(true);
    try {
      const data: UpdateTeamMemberData = {
        role,
        title: title.trim() || undefined,
        skills: skills ? skills.split(',').map(s => s.trim()).filter(Boolean) : [],
        workload_percentage: workload,
        availability,
        hourly_rate: hourlyRate ? parseFloat(hourlyRate) : undefined,
        location: location.trim() || undefined,
        timezone: timezone.trim() || undefined,
        permissions,
      };

      await onSubmit(data);
    } catch (err: any) {
      setError(err.message || 'Failed to update team member');
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleDescription = (role: TeamRole) => {
    switch (role) {
      case 'owner':
        return 'Full control over team and projects';
      case 'admin':
        return 'Can manage team members and projects';
      case 'developer':
        return 'Can work on assigned projects';
      case 'designer':
        return 'UI/UX design specialist';
      case 'qa':
        return 'Quality assurance and testing specialist';
      default:
        return '';
    }
  };

  if (!member) return null;

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Edit Team Member"
      description={`Update information for ${member.name}`}
      submitText="Save Changes"
      cancelText="Cancel"
      size="lg"
      isLoading={isLoading}
    >
      <div className="space-y-6">
        {/* Error message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-600 font-semibold">{error}</p>
          </div>
        )}

        {/* Member Info (Read-only) */}
        <div className="p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-lg font-black">
              {member.avatar ? (
                <img src={member.avatar} alt={member.name} className="w-full h-full rounded-xl object-cover" />
              ) : (
                member.name.split(' ').map(n => n[0]).join('')
              )}
            </div>
            <div>
              <div className="font-bold text-gray-900">{member.name}</div>
              <div className="text-sm text-gray-600">{member.email}</div>
            </div>
          </div>
        </div>

        {/* Role */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Role
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as TeamRole)}
            disabled={member.is_owner}
            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="developer">Developer</option>
            <option value="admin">Admin</option>
            <option value="designer">Designer (UI/UX)</option>
            <option value="qa">QA Engineer</option>
            {member.is_owner && <option value="owner">Owner</option>}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            {getRoleDescription(role)}
          </p>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Job Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Senior Frontend Developer"
            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Skills */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Skills
          </label>
          <input
            type="text"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            placeholder="React, Node.js, TypeScript (comma-separated)"
            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter skills separated by commas
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Workload Percentage */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Workload Percentage
            </label>
            <div className="relative">
              <input
                type="number"
                value={workloadPercentage}
                onChange={(e) => setWorkloadPercentage(e.target.value)}
                placeholder="0"
                min="0"
                max="200"
                step="5"
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 font-bold">
                %
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Current workload (0-100%, can exceed)
            </p>
          </div>

          {/* Availability */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Availability
            </label>
            <select
              value={availability}
              onChange={(e) => setAvailability(e.target.value as TeamMemberAvailability)}
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors font-semibold"
            >
              <option value="available">Available</option>
              <option value="busy">Busy</option>
              <option value="offline">Offline</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Hourly Rate */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Hourly Rate
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 font-bold">
                $
              </span>
              <input
                type="number"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                placeholder="100"
                min="0"
                step="5"
                className="w-full pl-8 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., San Francisco, CA"
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* Timezone */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Timezone
          </label>
          <input
            type="text"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            placeholder="e.g., PST (UTC-8)"
            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Permissions */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-3">
            Permissions
          </label>
          <div className="space-y-3 bg-gray-50 p-4 rounded-xl border-2 border-gray-200">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={permissions.canManageTeam || false}
                onChange={() => handlePermissionChange('canManageTeam')}
                disabled={member.is_owner}
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
              <div className="flex-1">
                <div className="font-semibold text-gray-900">Manage Team</div>
                <div className="text-xs text-gray-600">Can add, edit, and remove team members</div>
              </div>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={permissions.canManageProjects || false}
                onChange={() => handlePermissionChange('canManageProjects')}
                disabled={member.is_owner}
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
              <div className="flex-1">
                <div className="font-semibold text-gray-900">Manage Projects</div>
                <div className="text-xs text-gray-600">Can create and manage projects</div>
              </div>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={permissions.canAssignTasks || false}
                onChange={() => handlePermissionChange('canAssignTasks')}
                disabled={member.is_owner}
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
              <div className="flex-1">
                <div className="font-semibold text-gray-900">Assign Tasks</div>
                <div className="text-xs text-gray-600">Can assign tasks to team members</div>
              </div>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={permissions.canViewReports || false}
                onChange={() => handlePermissionChange('canViewReports')}
                disabled={member.is_owner}
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
              <div className="flex-1">
                <div className="font-semibold text-gray-900">View Reports</div>
                <div className="text-xs text-gray-600">Can access analytics and reports</div>
              </div>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={permissions.canManageBilling || false}
                onChange={() => handlePermissionChange('canManageBilling')}
                disabled={member.is_owner}
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
              <div className="flex-1">
                <div className="font-semibold text-gray-900">Manage Billing</div>
                <div className="text-xs text-gray-600">Can view and manage billing information</div>
              </div>
            </label>
          </div>
        </div>
      </div>
    </FormModal>
  );
};

export default EditTeamMemberModal;
