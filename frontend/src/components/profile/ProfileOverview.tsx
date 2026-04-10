/**
 * Profile Overview Tab
 * About, Skills, Languages, Social Links sections
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Code, Globe, CheckCircle2, Trash2, Plus,
  FileText, Languages as LanguagesIcon, Link as LinkIcon,
  Linkedin, Github, Twitter
} from 'lucide-react';
import { toast } from 'sonner';
import { ProfileTabProps, Skill, Language } from '@/types/profile';

const ProfileOverview: React.FC<ProfileTabProps> = ({
  profile,
  editedProfile,
  isEditing,
  setEditedProfile
}) => {
  const [newSkill, setNewSkill] = useState('');
  const [newLanguage, setNewLanguage] = useState({ name: '', proficiency: 'conversational' as const });

  // Skill handlers
  const addSkill = () => {
    if (!newSkill.trim()) return;

    const skillExists = editedProfile.skills.some(s => s.name.toLowerCase() === newSkill.toLowerCase());
    if (skillExists) {
      toast.error('Skill already added');
      return;
    }

    setEditedProfile({
      ...editedProfile,
      skills: [...editedProfile.skills, { name: newSkill, level: 'intermediate', yearsOfExperience: 1, verified: false }]
    });
    setNewSkill('');
  };

  const removeSkill = (index: number) => {
    setEditedProfile({
      ...editedProfile,
      skills: editedProfile.skills.filter((_, i) => i !== index)
    });
  };

  const updateSkill = (index: number, field: keyof Skill, value: any) => {
    const newSkills = [...editedProfile.skills];
    newSkills[index] = { ...newSkills[index], [field]: value };
    setEditedProfile({ ...editedProfile, skills: newSkills });
  };

  // Language handlers
  const addLanguage = () => {
    if (!newLanguage.name.trim()) return;

    const languageExists = editedProfile.languages.some(l => l.name.toLowerCase() === newLanguage.name.toLowerCase());
    if (languageExists) {
      toast.error('Language already added');
      return;
    }

    setEditedProfile({
      ...editedProfile,
      languages: [...editedProfile.languages, newLanguage]
    });
    setNewLanguage({ name: '', proficiency: 'conversational' });
  };

  const removeLanguage = (index: number) => {
    setEditedProfile({
      ...editedProfile,
      languages: editedProfile.languages.filter((_, i) => i !== index)
    });
  };

  // Helper functions
  const getSkillLevelColor = (level: string) => {
    switch (level) {
      case 'expert': return 'from-purple-600 to-pink-600';
      case 'advanced': return 'from-blue-600 to-cyan-600';
      case 'intermediate': return 'from-green-600 to-emerald-600';
      default: return 'from-gray-600 to-gray-700';
    }
  };

  const getProficiencyLabel = (proficiency: string) => {
    const labels = {
      native: 'Native',
      fluent: 'Fluent',
      conversational: 'Conversational',
      basic: 'Basic'
    };
    return labels[proficiency as keyof typeof labels] || proficiency;
  };

  return (
    <div className="space-y-6">
      {/* About Section */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
          <FileText className="w-7 h-7 text-blue-600" />
          About Me
        </h3>
        {isEditing ? (
          <textarea
            value={editedProfile.bio || ''}
            onChange={(e) => setEditedProfile({ ...editedProfile, bio: e.target.value })}
            placeholder="Tell clients about yourself, your experience, and what you do best...&#10;&#10;Example:&#10;• 8+ years of experience&#10;• Specializations&#10;• What makes you unique&#10;• Why clients should hire you"
            rows={10}
            className="w-full bg-gray-50 border-2 border-gray-300 rounded-xl px-4 py-3 text-gray-900 resize-none focus:border-blue-500 outline-none"
          />
        ) : (
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {profile.bio || 'No bio added yet. Click Edit Profile to add your professional bio.'}
          </p>
        )}
      </div>

      {/* Skills Section */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
          <Code className="w-7 h-7 text-purple-600" />
          Skills & Expertise
        </h3>

        {/* Add Skill - Only in Edit Mode */}
        {isEditing && (
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-blue-200">
            <div className="flex gap-3">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                placeholder="Enter skill name (e.g., React, UI/UX Design, Digital Marketing)"
                className="flex-1 bg-white border-2 border-gray-300 rounded-xl px-4 py-2 focus:border-blue-500 outline-none"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={addSkill}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-xl font-semibold"
              >
                <Plus className="w-5 h-5" />
                Add
              </motion.button>
            </div>
          </div>
        )}

        {/* Skills Grid */}
        {editedProfile.skills.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {editedProfile.skills.map((skill, idx) => (
              <motion.div
                key={idx}
                whileHover={{ scale: 1.02 }}
                className={`bg-gradient-to-r ${getSkillLevelColor(skill.level)} rounded-xl p-4 text-white relative`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-lg">{skill.name}</span>
                      {skill.verified && <CheckCircle2 className="w-4 h-4" />}
                    </div>
                    {isEditing ? (
                      <div className="space-y-2">
                        <select
                          value={skill.level}
                          onChange={(e) => updateSkill(idx, 'level', e.target.value)}
                          className="w-full bg-white/20 text-white border border-white/30 rounded-lg px-2 py-1 text-sm font-semibold"
                        >
                          <option value="beginner">Beginner</option>
                          <option value="intermediate">Intermediate</option>
                          <option value="advanced">Advanced</option>
                          <option value="expert">Expert</option>
                        </select>
                        <input
                          type="number"
                          min="0"
                          max="50"
                          value={skill.yearsOfExperience}
                          onChange={(e) => updateSkill(idx, 'yearsOfExperience', Number(e.target.value))}
                          className="w-full bg-white/20 text-white border border-white/30 rounded-lg px-2 py-1 text-sm font-semibold placeholder-white/50"
                          placeholder="Years"
                        />
                      </div>
                    ) : (
                      <div className="text-sm opacity-90 capitalize">
                        {skill.level} • {skill.yearsOfExperience}+ years
                      </div>
                    )}
                  </div>
                  {isEditing && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => removeSkill(idx)}
                      className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Code className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No skills added yet</p>
            {isEditing && <p className="text-gray-400 text-sm mt-2">Add your skills using the input above</p>}
          </div>
        )}
      </div>

      {/* Languages Section */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
          <LanguagesIcon className="w-7 h-7 text-green-600" />
          Languages
        </h3>

        {/* Add Language - Only in Edit Mode */}
        {isEditing && (
          <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
            <div className="flex gap-3">
              <input
                type="text"
                value={newLanguage.name}
                onChange={(e) => setNewLanguage({ ...newLanguage, name: e.target.value })}
                placeholder="Language name (e.g., English, Spanish, Mandarin)"
                className="flex-1 bg-white border-2 border-gray-300 rounded-xl px-4 py-2 focus:border-green-500 outline-none"
              />
              <select
                value={newLanguage.proficiency}
                onChange={(e) => setNewLanguage({ ...newLanguage, proficiency: e.target.value as any })}
                className="bg-white border-2 border-gray-300 rounded-xl px-4 py-2 focus:border-green-500 outline-none"
              >
                <option value="native">Native</option>
                <option value="fluent">Fluent</option>
                <option value="conversational">Conversational</option>
                <option value="basic">Basic</option>
              </select>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={addLanguage}
                className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-2 rounded-xl font-semibold"
              >
                <Plus className="w-5 h-5" />
                Add
              </motion.button>
            </div>
          </div>
        )}

        {/* Languages List */}
        {editedProfile.languages.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {editedProfile.languages.map((lang, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4"
              >
                <div className="flex items-center gap-3">
                  <Globe className="w-6 h-6 text-green-600" />
                  <div>
                    <div className="font-bold text-gray-900">{lang.name}</div>
                    <div className="text-sm text-gray-600">{getProficiencyLabel(lang.proficiency)}</div>
                  </div>
                </div>
                {isEditing && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => removeLanguage(idx)}
                    className="w-8 h-8 bg-red-100 text-red-600 rounded-lg flex items-center justify-center hover:bg-red-200"
                  >
                    <Trash2 className="w-4 h-4" />
                  </motion.button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Globe className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No languages added yet</p>
            {isEditing && <p className="text-gray-400 text-sm mt-2">Add languages you speak</p>}
          </div>
        )}
      </div>

      {/* Social Links Section */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
          <LinkIcon className="w-7 h-7 text-blue-600" />
          Social Links
        </h3>

        {isEditing ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Linkedin className="w-6 h-6 text-blue-600 flex-shrink-0" />
              <input
                type="url"
                value={editedProfile.socialLinks.linkedin || ''}
                onChange={(e) => setEditedProfile({ ...editedProfile, socialLinks: { ...editedProfile.socialLinks, linkedin: e.target.value } })}
                placeholder="LinkedIn URL"
                className="flex-1 bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="flex items-center gap-3">
              <Github className="w-6 h-6 text-gray-900 flex-shrink-0" />
              <input
                type="url"
                value={editedProfile.socialLinks.github || ''}
                onChange={(e) => setEditedProfile({ ...editedProfile, socialLinks: { ...editedProfile.socialLinks, github: e.target.value } })}
                placeholder="GitHub URL"
                className="flex-1 bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="flex items-center gap-3">
              <Twitter className="w-6 h-6 text-blue-400 flex-shrink-0" />
              <input
                type="url"
                value={editedProfile.socialLinks.twitter || ''}
                onChange={(e) => setEditedProfile({ ...editedProfile, socialLinks: { ...editedProfile.socialLinks, twitter: e.target.value } })}
                placeholder="Twitter URL"
                className="flex-1 bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="flex items-center gap-3">
              <Globe className="w-6 h-6 text-purple-600 flex-shrink-0" />
              <input
                type="url"
                value={editedProfile.socialLinks.website || ''}
                onChange={(e) => setEditedProfile({ ...editedProfile, socialLinks: { ...editedProfile.socialLinks, website: e.target.value } })}
                placeholder="Website URL"
                className="flex-1 bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {profile.socialLinks.linkedin && (
              <a
                href={profile.socialLinks.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-semibold hover:bg-blue-100 transition-colors"
              >
                <Linkedin className="w-5 h-5" />
                LinkedIn
              </a>
            )}
            {profile.socialLinks.github && (
              <a
                href={profile.socialLinks.github}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-gray-100 text-gray-900 px-4 py-2 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              >
                <Github className="w-5 h-5" />
                GitHub
              </a>
            )}
            {profile.socialLinks.twitter && (
              <a
                href={profile.socialLinks.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-blue-50 text-blue-500 px-4 py-2 rounded-lg font-semibold hover:bg-blue-100 transition-colors"
              >
                <Twitter className="w-5 h-5" />
                Twitter
              </a>
            )}
            {profile.socialLinks.website && (
              <a
                href={profile.socialLinks.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-purple-50 text-purple-700 px-4 py-2 rounded-lg font-semibold hover:bg-purple-100 transition-colors"
              >
                <Globe className="w-5 h-5" />
                Website
              </a>
            )}
            {!profile.socialLinks.linkedin && !profile.socialLinks.github && !profile.socialLinks.twitter && !profile.socialLinks.website && (
              <p className="text-gray-500">No social links added yet</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileOverview;
