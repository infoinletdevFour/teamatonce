/**
 * Add Team Member Modal Component
 *
 * Modal form for adding new team members to the company
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, X } from 'lucide-react';
import type { TeamRole, CreateTeamMemberData } from '@/types/teamMember';

interface AddTeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTeamMemberData) => Promise<void>;
}

const AddTeamMemberModal: React.FC<AddTeamMemberModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<TeamRole>('developer');
  const [skills, setSkills] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);

    // Validation
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      const data: CreateTeamMemberData = {
        email: email.trim(),
        role,
        skills: skills ? skills.split(',').map(s => s.trim()).filter(Boolean) : undefined,
        hourly_rate: hourlyRate ? parseFloat(hourlyRate) : undefined,
      };

      await onSubmit(data);

      // Reset form
      setEmail('');
      setRole('developer');
      setSkills('');
      setHourlyRate('');
    } catch (err: any) {
      setError(err.message || 'Failed to add team member');
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

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-gray-900">Invite Team Member</h2>
                  <p className="text-gray-600 mt-1">Send an invitation to join your team</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>
            </div>

            <div className="p-6">
      <div className="space-y-6">
        {/* Error message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-600 font-semibold">{error}</p>
          </div>
        )}

        {/* Email */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Email Address <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="team.member@example.com"
              required
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            An invitation will be sent to this email address
          </p>
        </div>

        {/* Role */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Role <span className="text-red-500">*</span>
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as TeamRole)}
            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors font-semibold"
          >
            <option value="developer">Developer</option>
            <option value="admin">Admin</option>
            <option value="designer">Designer (UI/UX)</option>
            <option value="qa">QA Engineer</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            {getRoleDescription(role)}
          </p>
        </div>

        {/* Skills */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Skills / Specializations (Optional)
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

        {/* Hourly Rate */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Hourly Rate (Optional)
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
          <p className="text-xs text-gray-500 mt-1">
            Internal hourly rate for project planning
          </p>
        </div>
      </div>

      <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
        <button
          onClick={onClose}
          disabled={isLoading}
          className="flex-1 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
        >
          {isLoading ? 'Sending...' : 'Send Invitation'}
        </button>
      </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddTeamMemberModal;
