/**
 * Profile Experience Tab
 * Work experience timeline
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Plus, Trash2, X, Calendar, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { ProfileTabProps, Experience } from '@/types/profile';

const ProfileExperience: React.FC<ProfileTabProps> = ({
  profile,
  editedProfile,
  isEditing,
  setEditedProfile
}) => {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newExperience, setNewExperience] = useState<Experience>({
    company: '',
    title: '',
    location: '',
    startDate: '',
    endDate: '',
    current: false,
    description: ''
  });

  const addExperience = () => {
    if (!newExperience.company.trim()) {
      toast.error('Company name is required');
      return;
    }
    if (!newExperience.title.trim()) {
      toast.error('Job title is required');
      return;
    }
    if (!newExperience.startDate) {
      toast.error('Start date is required');
      return;
    }

    setEditedProfile({
      ...editedProfile,
      experience: [...editedProfile.experience, { ...newExperience, id: Date.now().toString() }]
    });

    setNewExperience({
      company: '',
      title: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      description: ''
    });
    setIsAddingNew(false);
    toast.success('Experience added');
  };

  const removeExperience = (id: string) => {
    setEditedProfile({
      ...editedProfile,
      experience: editedProfile.experience.filter(e => e.id !== id)
    });
    toast.success('Experience removed');
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <Building2 className="w-7 h-7 text-blue-600" />
          Work Experience
        </h3>
        {isEditing && !isAddingNew && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsAddingNew(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-xl font-semibold"
          >
            <Plus className="w-5 h-5" />
            Add Experience
          </motion.button>
        )}
      </div>

      {/* Add New Experience Form */}
      <AnimatePresence>
        {isAddingNew && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-blue-200"
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold text-gray-900">Add Work Experience</h4>
              <button onClick={() => setIsAddingNew(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Company *</label>
                <input
                  type="text"
                  value={newExperience.company}
                  onChange={(e) => setNewExperience({ ...newExperience, company: e.target.value })}
                  placeholder="E.g., Google, Microsoft"
                  className="w-full bg-white border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Job Title *</label>
                <input
                  type="text"
                  value={newExperience.title}
                  onChange={(e) => setNewExperience({ ...newExperience, title: e.target.value })}
                  placeholder="E.g., Senior Developer"
                  className="w-full bg-white border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  value={newExperience.location}
                  onChange={(e) => setNewExperience({ ...newExperience, location: e.target.value })}
                  placeholder="E.g., New York, USA"
                  className="w-full bg-white border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date *</label>
                <input
                  type="month"
                  value={newExperience.startDate}
                  onChange={(e) => setNewExperience({ ...newExperience, startDate: e.target.value })}
                  className="w-full bg-white border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
                <input
                  type="month"
                  value={newExperience.endDate}
                  onChange={(e) => setNewExperience({ ...newExperience, endDate: e.target.value })}
                  disabled={newExperience.current}
                  className="w-full bg-white border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 outline-none disabled:bg-gray-100"
                />
              </div>
              <div className="flex items-center pt-8">
                <input
                  type="checkbox"
                  id="current"
                  checked={newExperience.current}
                  onChange={(e) => setNewExperience({ ...newExperience, current: e.target.checked, endDate: e.target.checked ? '' : newExperience.endDate })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="current" className="ml-2 text-sm font-semibold text-gray-700">
                  I currently work here
                </label>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
              <textarea
                value={newExperience.description || ''}
                onChange={(e) => setNewExperience({ ...newExperience, description: e.target.value })}
                placeholder="Describe your responsibilities, achievements, and key projects..."
                rows={4}
                className="w-full bg-white border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 outline-none resize-none"
              />
            </div>

            <div className="flex gap-3 mt-4">
              <button
                onClick={addExperience}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-bold"
              >
                Add Experience
              </button>
              <button
                onClick={() => setIsAddingNew(false)}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Experience Timeline */}
      {editedProfile.experience.length > 0 ? (
        <div className="space-y-6">
          {editedProfile.experience.map((exp) => (
            <motion.div
              key={exp.id}
              whileHover={{ scale: 1.01 }}
              className="relative pl-8 pb-6 border-l-2 border-blue-200 last:border-l-0"
            >
              {/* Timeline Dot */}
              <div className="absolute left-0 top-0 w-4 h-4 bg-blue-600 rounded-full -translate-x-[9px] ring-4 ring-white" />

              <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 border-2 border-gray-200">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-gray-900">{exp.title}</h4>
                    <p className="text-lg text-blue-700 font-semibold">{exp.company}</p>
                  </div>
                  {isEditing && (
                    <button
                      onClick={() => exp.id && removeExperience(exp.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formatDate(exp.startDate)} - {exp.current ? 'Present' : formatDate(exp.endDate)}
                  </div>
                  {exp.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {exp.location}
                    </div>
                  )}
                </div>

                {exp.description && (
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{exp.description}</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Building2 className="w-20 h-20 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg font-semibold">No work experience added yet</p>
          <p className="text-gray-400 text-sm mt-2">
            {isEditing ? 'Click "Add Experience" to showcase your career' : 'Add your work experience to build credibility'}
          </p>
        </div>
      )}
    </div>
  );
};

export default ProfileExperience;
