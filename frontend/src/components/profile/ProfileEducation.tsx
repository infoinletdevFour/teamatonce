/**
 * Profile Education Tab
 * Educational background with degrees and fields of study
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, Plus, Trash2, X, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { ProfileTabProps, Education } from '@/types/profile';

const ProfileEducation: React.FC<ProfileTabProps> = ({
  profile,
  editedProfile,
  isEditing,
  setEditedProfile
}) => {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newEducation, setNewEducation] = useState<Education>({
    school: '',
    degree: '',
    field: '',
    startYear: '',
    endYear: '',
    description: ''
  });

  const addEducation = () => {
    if (!newEducation.school.trim()) {
      toast.error('School/University name is required');
      return;
    }
    if (!newEducation.degree.trim()) {
      toast.error('Degree type is required');
      return;
    }
    if (!newEducation.field.trim()) {
      toast.error('Field of study is required');
      return;
    }
    if (!newEducation.startYear) {
      toast.error('Start year is required');
      return;
    }
    if (!newEducation.endYear) {
      toast.error('End year is required');
      return;
    }

    // Validate years
    const start = parseInt(newEducation.startYear);
    const end = parseInt(newEducation.endYear);
    if (start > end) {
      toast.error('End year must be after start year');
      return;
    }

    setEditedProfile({
      ...editedProfile,
      education: [...editedProfile.education, { ...newEducation, id: Date.now().toString() }]
    });

    setNewEducation({
      school: '',
      degree: '',
      field: '',
      startYear: '',
      endYear: '',
      description: ''
    });
    setIsAddingNew(false);
    toast.success('Education added');
  };

  const removeEducation = (id: string) => {
    setEditedProfile({
      ...editedProfile,
      education: editedProfile.education.filter(e => e.id !== id)
    });
    toast.success('Education removed');
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <GraduationCap className="w-7 h-7 text-blue-600" />
          Education
        </h3>
        {isEditing && !isAddingNew && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsAddingNew(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-xl font-semibold"
          >
            <Plus className="w-5 h-5" />
            Add Education
          </motion.button>
        )}
      </div>

      {/* Add New Education Form */}
      <AnimatePresence>
        {isAddingNew && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-blue-200"
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold text-gray-900">Add Education</h4>
              <button onClick={() => setIsAddingNew(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">School/University *</label>
                <input
                  type="text"
                  value={newEducation.school}
                  onChange={(e) => setNewEducation({ ...newEducation, school: e.target.value })}
                  placeholder="E.g., Stanford University, MIT"
                  className="w-full bg-white border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Degree *</label>
                <input
                  type="text"
                  value={newEducation.degree}
                  onChange={(e) => setNewEducation({ ...newEducation, degree: e.target.value })}
                  placeholder="E.g., Bachelor of Science, Master's"
                  className="w-full bg-white border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Field of Study *</label>
                <input
                  type="text"
                  value={newEducation.field}
                  onChange={(e) => setNewEducation({ ...newEducation, field: e.target.value })}
                  placeholder="E.g., Computer Science, Engineering"
                  className="w-full bg-white border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Start Year *</label>
                <input
                  type="number"
                  value={newEducation.startYear}
                  onChange={(e) => setNewEducation({ ...newEducation, startYear: e.target.value })}
                  placeholder="2015"
                  min="1950"
                  max="2100"
                  className="w-full bg-white border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">End Year *</label>
                <input
                  type="number"
                  value={newEducation.endYear}
                  onChange={(e) => setNewEducation({ ...newEducation, endYear: e.target.value })}
                  placeholder="2019"
                  min="1950"
                  max="2100"
                  className="w-full bg-white border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Description (optional)</label>
              <textarea
                value={newEducation.description || ''}
                onChange={(e) => setNewEducation({ ...newEducation, description: e.target.value })}
                placeholder="Relevant coursework, achievements, honors, activities..."
                rows={4}
                className="w-full bg-white border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 outline-none resize-none"
              />
            </div>

            <div className="flex gap-3 mt-4">
              <button
                onClick={addEducation}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-bold"
              >
                Add Education
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

      {/* Education List */}
      {editedProfile.education.length > 0 ? (
        <div className="space-y-6">
          {editedProfile.education.map((edu) => (
            <motion.div
              key={edu.id}
              whileHover={{ scale: 1.01 }}
              className="relative pl-8 pb-6 border-l-2 border-blue-200 last:border-l-0"
            >
              {/* Timeline Dot */}
              <div className="absolute left-0 top-0 w-4 h-4 bg-blue-600 rounded-full -translate-x-[9px] ring-4 ring-white" />

              <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 border-2 border-gray-200">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-gray-900">{edu.degree} in {edu.field}</h4>
                    <p className="text-lg text-blue-700 font-semibold">{edu.school}</p>
                  </div>
                  {isEditing && (
                    <button
                      onClick={() => edu.id && removeEducation(edu.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                  <Calendar className="w-4 h-4" />
                  {edu.startYear} - {edu.endYear}
                </div>

                {edu.description && (
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{edu.description}</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <GraduationCap className="w-20 h-20 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg font-semibold">No education added yet</p>
          <p className="text-gray-400 text-sm mt-2">
            {isEditing ? 'Click "Add Education" to showcase your academic background' : 'Add your education to build credibility'}
          </p>
        </div>
      )}
    </div>
  );
};

export default ProfileEducation;
