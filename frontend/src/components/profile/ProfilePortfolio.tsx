/**
 * Profile Portfolio Tab
 * Portfolio projects with image upload
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase, Plus, Trash2, Upload, ExternalLink, X, Calendar
} from 'lucide-react';
import { toast } from 'sonner';
import { ProfileTabProps, PortfolioItem } from '@/types/profile';
import { apiClient } from '@/lib/api-client';

interface ProfilePortfolioProps extends ProfileTabProps {
  companyId: string;
}

const ProfilePortfolio: React.FC<ProfilePortfolioProps> = ({
  profile,
  editedProfile,
  isEditing,
  setEditedProfile,
  companyId
}) => {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newPortfolio, setNewPortfolio] = useState<PortfolioItem>({
    title: '',
    description: '',
    technologies: [],
    completedDate: '',
    imageUrl: '',
    projectUrl: ''
  });
  const [newTech, setNewTech] = useState('');
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      toast.error('Image size should be less than 3MB');
      return;
    }

    try {
      toast.loading('Uploading portfolio image...');

      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'portfolio');

      const response = await apiClient.post(`/company/${companyId}/upload-image`, formData);
      const imageUrl = response.data.data.url;

      setNewPortfolio({ ...newPortfolio, imageUrl });
      toast.dismiss();
      toast.success('Image uploaded successfully');
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to upload image');
    }
  };

  const addTechnology = () => {
    if (!newTech.trim()) return;
    if (newPortfolio.technologies.includes(newTech)) {
      toast.error('Technology already added');
      return;
    }
    setNewPortfolio({
      ...newPortfolio,
      technologies: [...newPortfolio.technologies, newTech]
    });
    setNewTech('');
  };

  const removeTechnology = (tech: string) => {
    setNewPortfolio({
      ...newPortfolio,
      technologies: newPortfolio.technologies.filter(t => t !== tech)
    });
  };

  const addPortfolio = () => {
    if (!newPortfolio.title.trim()) {
      toast.error('Project title is required');
      return;
    }
    if (!newPortfolio.description.trim()) {
      toast.error('Project description is required');
      return;
    }
    if (!newPortfolio.completedDate) {
      toast.error('Completion date is required');
      return;
    }

    setEditedProfile({
      ...editedProfile,
      portfolioItems: [...editedProfile.portfolioItems, { ...newPortfolio, id: Date.now().toString() }]
    });

    // Reset form
    setNewPortfolio({
      title: '',
      description: '',
      technologies: [],
      completedDate: '',
      imageUrl: '',
      projectUrl: ''
    });
    setIsAddingNew(false);
    toast.success('Portfolio project added');
  };

  const removePortfolio = (id: string) => {
    setEditedProfile({
      ...editedProfile,
      portfolioItems: editedProfile.portfolioItems.filter(p => p.id !== id)
    });
    toast.success('Portfolio project removed');
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <Briefcase className="w-7 h-7 text-blue-600" />
          Portfolio Projects
        </h3>
        {isEditing && !isAddingNew && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsAddingNew(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-xl font-semibold"
          >
            <Plus className="w-5 h-5" />
            Add Project
          </motion.button>
        )}
      </div>

      {/* Add New Portfolio Form */}
      <AnimatePresence>
        {isAddingNew && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-blue-200"
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold text-gray-900">Add New Project</h4>
              <button
                onClick={() => setIsAddingNew(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Project Image Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Project Image</label>
                <div className="flex items-center gap-4">
                  {newPortfolio.imageUrl ? (
                    <div className="relative">
                      <img
                        src={newPortfolio.imageUrl}
                        alt="Portfolio preview"
                        className="w-32 h-32 object-cover rounded-lg border-2 border-gray-300"
                      />
                      <button
                        onClick={() => setNewPortfolio({ ...newPortfolio, imageUrl: '' })}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <button
                        onClick={() => imageInputRef.current?.click()}
                        className="flex items-center gap-2 bg-white border-2 border-dashed border-gray-300 px-4 py-8 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors w-full"
                      >
                        <Upload className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-600">Click to upload project image</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Project Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Project Title *</label>
                <input
                  type="text"
                  value={newPortfolio.title}
                  onChange={(e) => setNewPortfolio({ ...newPortfolio, title: e.target.value })}
                  placeholder="E.g., E-commerce Website Redesign"
                  className="w-full bg-white border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 outline-none"
                />
              </div>

              {/* Project Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description *</label>
                <textarea
                  value={newPortfolio.description || ''}
                  onChange={(e) => setNewPortfolio({ ...newPortfolio, description: e.target.value })}
                  placeholder="Describe what you built, the challenges, and the results..."
                  rows={4}
                  className="w-full bg-white border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 outline-none resize-none"
                />
              </div>

              {/* Project URL */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Project URL (optional)</label>
                <input
                  type="url"
                  value={newPortfolio.projectUrl}
                  onChange={(e) => setNewPortfolio({ ...newPortfolio, projectUrl: e.target.value })}
                  placeholder="https://example.com"
                  className="w-full bg-white border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 outline-none"
                />
              </div>

              {/* Technologies */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Technologies Used</label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newTech}
                    onChange={(e) => setNewTech(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTechnology())}
                    placeholder="E.g., React, Node.js, MongoDB"
                    className="flex-1 bg-white border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 outline-none"
                  />
                  <button
                    onClick={addTechnology}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {newPortfolio.technologies.map((tech, idx) => (
                    <span
                      key={idx}
                      className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2"
                    >
                      {tech}
                      <button
                        onClick={() => removeTechnology(tech)}
                        className="hover:text-blue-900"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Completion Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Completion Date *</label>
                <input
                  type="date"
                  value={newPortfolio.completedDate}
                  onChange={(e) => setNewPortfolio({ ...newPortfolio, completedDate: e.target.value })}
                  className="w-full bg-white border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 outline-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={addPortfolio}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all"
                >
                  Add to Portfolio
                </button>
                <button
                  onClick={() => setIsAddingNew(false)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Portfolio Grid */}
      {editedProfile.portfolioItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {editedProfile.portfolioItems.map((item) => (
            <motion.div
              key={item.id}
              whileHover={{ y: -4 }}
              className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl overflow-hidden border-2 border-gray-200 shadow-lg"
            >
              {/* Project Image */}
              {item.imageUrl && (
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                </div>
              )}

              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h4 className="text-xl font-bold text-gray-900">{item.title}</h4>
                  <div className="flex items-center gap-2">
                    {item.projectUrl && (
                      <a
                        href={item.projectUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </a>
                    )}
                    {isEditing && (
                      <button
                        onClick={() => item.id && removePortfolio(item.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-gray-700 mb-4 text-sm leading-relaxed">{item.description}</p>

                {/* Technologies */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {item.technologies.map((tech, idx) => (
                    <span
                      key={idx}
                      className="bg-white border border-blue-200 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold"
                    >
                      {tech}
                    </span>
                  ))}
                </div>

                {/* Completion Date */}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  Completed: {new Date(item.completedDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Briefcase className="w-20 h-20 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg font-semibold">No portfolio projects yet</p>
          <p className="text-gray-400 text-sm mt-2">
            {isEditing ? 'Click "Add Project" to showcase your work' : 'Add your completed projects to showcase your expertise'}
          </p>
        </div>
      )}
    </div>
  );
};

export default ProfilePortfolio;
