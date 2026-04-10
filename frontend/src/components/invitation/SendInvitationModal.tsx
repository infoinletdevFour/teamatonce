/**
 * Send Invitation Modal Component
 * Modal for sending team invitations
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, X, Send, AlertCircle, CheckCircle } from 'lucide-react';
import { sendInvitation } from '@/services/invitationService';
import { SendInvitationData, TeamRole } from '@/types/invitation';

interface SendInvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  onSuccess?: () => void;
}

const SendInvitationModal: React.FC<SendInvitationModalProps> = ({
  isOpen,
  onClose,
  companyId,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<SendInvitationData>({
    email: '',
    role: 'developer',
    message: '',
    initial_skills: [],
    hourly_rate: undefined,
  });
  const [skillsInput, setSkillsInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Parse skills from comma-separated string
      const skills = skillsInput
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const invitationData: SendInvitationData = {
        ...formData,
        initial_skills: skills.length > 0 ? skills : undefined,
      };

      await sendInvitation(companyId, invitationData);

      setSuccess(true);

      // Reset form after successful submission
      setTimeout(() => {
        setFormData({
          email: '',
          role: 'developer',
          message: '',
          initial_skills: [],
          hourly_rate: undefined,
        });
        setSkillsInput('');
        setSuccess(false);
        onSuccess?.();
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to send invitation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        email: '',
        role: 'developer',
        message: '',
        initial_skills: [],
        hourly_rate: undefined,
      });
      setSkillsInput('');
      setError(null);
      setSuccess(false);
      onClose();
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

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Invite Team Member
            </h2>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Success Message */}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center space-x-3"
            >
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <p className="text-sm text-green-700 font-semibold">
                Invitation sent successfully!
              </p>
            </motion.div>
          )}

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-3"
            >
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-700 font-semibold">{error}</p>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="team.member@example.com"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Role *
              </label>
              <select
                required
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as TeamRole })}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors font-semibold"
                disabled={isSubmitting}
              >
                <option value="developer">Developer</option>
                <option value="admin">Admin</option>
                <option value="designer">Designer (UI/UX)</option>
                <option value="qa">QA Engineer</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {getRoleDescription(formData.role)}
              </p>
            </div>

            {/* Skills */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Skills / Specializations
              </label>
              <input
                type="text"
                value={skillsInput}
                onChange={(e) => setSkillsInput(e.target.value)}
                placeholder="React, Node.js, TypeScript (comma-separated)"
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                disabled={isSubmitting}
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
                  min="0"
                  step="1"
                  value={formData.hourly_rate || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      hourly_rate: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  placeholder="100"
                  className="w-full pl-8 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Custom Message */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Custom Message (Optional)
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Add a personal message to the invitation..."
                rows={3}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors resize-none"
                disabled={isSubmitting}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3 pt-2">
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </motion.button>
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isSubmitting || !formData.email}
                className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Send Invitation</span>
                  </>
                )}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SendInvitationModal;
