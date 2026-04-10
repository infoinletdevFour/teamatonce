import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, MapPin, Globe, Calendar, Star,
  Briefcase, Edit2, Save, X, Plus,
  Upload, Camera, Link as LinkIcon,
  Clock, Code, CheckCircle2, Trash2
} from 'lucide-react';
import { Developer } from '@/types/developer';
import {
  getDeveloperProfile,
  updateDeveloperProfile,
} from '@/services/developerService';
import { searchSkills, SKILL_CATEGORIES, getCategoryForSkill } from '@/constants/skills';

const DeveloperProfile: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'portfolio' | 'reviews' | 'skills'>('overview');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [skillSuggestions, setSkillSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const skillInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Developer data loaded from API - start with empty defaults
  const [developer, setDeveloper] = useState<Developer>({
    id: '',
    name: '',
    email: '',
    title: '',
    hourlyRate: 0,
    rating: 0,
    totalReviews: 0,
    totalEarnings: 0,
    bio: '',
    location: '',
    timezone: '',
    availability: 'available',
    languages: [],
    joinedDate: new Date().toISOString(),
    skills: [],
    portfolioItems: [],
    reviews: [],
    verifiedSkills: [],
  });

  const [editedDeveloper, setEditedDeveloper] = useState(developer);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      const profileData = await getDeveloperProfile();
      setDeveloper(profileData);
      setEditedDeveloper(profileData);
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const updatedProfile = await updateDeveloperProfile(editedDeveloper);
      setDeveloper(updatedProfile);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedDeveloper(developer);
    setIsEditing(false);
  };

  // Handle skill input change and show suggestions
  const handleSkillInputChange = (value: string) => {
    setNewSkill(value);
    setSelectedSuggestionIndex(-1);

    if (value.trim().length >= 2) {
      // Get existing skill names to filter out
      const existingSkillNames = editedDeveloper.skills.map((s) => s.name.toLowerCase());

      // Search for matching skills and filter out existing ones
      const suggestions = searchSkills(value, 15).filter(
        (skill) => !existingSkillNames.includes(skill.toLowerCase())
      );

      setSkillSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } else {
      setSkillSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Handle selecting a skill from suggestions
  const handleSelectSuggestion = (skill: string) => {
    const skillExists = editedDeveloper.skills.some(
      (s) => s.name.toLowerCase() === skill.toLowerCase()
    );

    if (!skillExists) {
      setEditedDeveloper({
        ...editedDeveloper,
        skills: [
          ...editedDeveloper.skills,
          {
            name: skill,
            level: 'beginner',
            verified: false,
            yearsOfExperience: 1,
          },
        ],
      });
    }

    setNewSkill('');
    setSkillSuggestions([]);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    skillInputRef.current?.focus();
  };

  // Handle keyboard navigation in suggestions
  const handleSkillInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions) {
      if (e.key === 'Enter' && newSkill.trim()) {
        e.preventDefault();
        handleSelectSuggestion(newSkill.trim());
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex((prev) =>
          prev < skillSuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0 && skillSuggestions[selectedSuggestionIndex]) {
          handleSelectSuggestion(skillSuggestions[selectedSuggestionIndex]);
        } else if (newSkill.trim()) {
          handleSelectSuggestion(newSkill.trim());
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        skillInputRef.current &&
        !skillInputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get category color for skill badge
  const getCategoryColor = (skillName: string): string => {
    const category = getCategoryForSkill(skillName);
    if (!category) return 'from-gray-500 to-gray-600';

    const colorMap: Record<string, string> = {
      'graphics-design': 'from-pink-500 to-rose-500',
      'digital-marketing': 'from-orange-500 to-amber-500',
      'writing-translation': 'from-emerald-500 to-green-500',
      'video-animation': 'from-red-500 to-pink-500',
      'music-audio': 'from-purple-500 to-violet-500',
      'programming-tech': 'from-blue-500 to-cyan-500',
      'business': 'from-indigo-500 to-blue-500',
      'data-analytics': 'from-teal-500 to-cyan-500',
      'photography': 'from-amber-500 to-yellow-500',
      'lifestyle': 'from-rose-500 to-pink-500',
      'ai-services': 'from-violet-500 to-purple-500',
    };

    return colorMap[category.id] || 'from-gray-500 to-gray-600';
  };

  const getAvailabilityColor = (availability: Developer['availability']) => {
    switch (availability) {
      case 'available':
        return 'bg-green-500';
      case 'busy':
        return 'bg-orange-500';
      default:
        return 'bg-red-500';
    }
  };

  const getAvailabilityText = (availability: Developer['availability']) => {
    switch (availability) {
      case 'available':
        return 'Available for Work';
      case 'busy':
        return 'Partially Available';
      default:
        return 'Not Available';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black text-gray-900 mb-2">Developer Profile</h1>
            <p className="text-gray-600">Manage your professional profile and portfolio</p>
          </div>
          {!isEditing ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsEditing(true)}
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg"
            >
              <Edit2 className="w-5 h-5" />
              <span>Edit Profile</span>
            </motion.button>
          ) : (
            <div className="flex items-center space-x-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCancel}
                disabled={saving}
                className="flex items-center space-x-2 bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-bold disabled:opacity-50"
              >
                <X className="w-5 h-5" />
                <span>Cancel</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSave}
                disabled={saving}
                className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Save Changes</span>
                  </>
                )}
              </motion.button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Profile Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-3xl shadow-xl border-2 border-gray-100 overflow-hidden mb-6"
      >
        {/* Cover Image */}
        <div className="h-48 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 relative">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-white rounded-full" />
            <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-white rounded-full" />
          </div>
          {isEditing && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-xl font-semibold flex items-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span>Change Cover</span>
            </motion.button>
          )}
        </div>

        {/* Profile Info */}
        <div className="px-8 pb-8">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between -mt-16">
            <div className="flex items-end space-x-6">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 border-4 border-white shadow-xl flex items-center justify-center text-white text-4xl font-black">
                  {developer.name ? developer.name.split(' ').map(n => n[0]).join('').slice(0, 2) : <User className="w-12 h-12" />}
                </div>
                {isEditing && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    className="absolute bottom-0 right-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg"
                  >
                    <Camera className="w-5 h-5" />
                  </motion.button>
                )}
              </div>

              {/* Name and Title */}
              <div className="pt-16 pb-4">
                {isEditing ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editedDeveloper.name}
                      onChange={(e) => setEditedDeveloper({ ...editedDeveloper, name: e.target.value })}
                      className="text-3xl font-black text-gray-900 bg-gray-100 border-2 border-gray-300 rounded-xl px-4 py-2 w-full"
                    />
                    <input
                      type="text"
                      value={editedDeveloper.title}
                      onChange={(e) => setEditedDeveloper({ ...editedDeveloper, title: e.target.value })}
                      className="text-xl text-gray-600 bg-gray-100 border-2 border-gray-300 rounded-xl px-4 py-2 w-full"
                    />
                  </div>
                ) : (
                  <>
                    <h2 className="text-3xl font-black text-gray-900">{developer.name || 'Developer'}</h2>
                    <p className="text-xl text-gray-600">{developer.title || 'No title set'}</p>
                  </>
                )}
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center space-x-1">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-bold text-gray-900">{developer.rating}</span>
                    <span className="text-gray-600">({developer.totalReviews} reviews)</span>
                  </div>
                  <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${getAvailabilityColor(developer.availability)} text-white`}>
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    <span className="text-sm font-semibold">{getAvailabilityText(developer.availability)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-6 mt-6 md:mt-0">
              <div className="text-center">
                <div className="text-2xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  ${developer.totalEarnings.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Total Earned</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {developer.portfolioItems.length}
                </div>
                <div className="text-sm text-gray-600">Projects</div>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="grid md:grid-cols-3 gap-4 mt-6 pt-6 border-t-2 border-gray-100">
            <div className="flex items-center space-x-3">
              <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-500">Location</div>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedDeveloper.location || ''}
                    onChange={(e) => setEditedDeveloper({ ...editedDeveloper, location: e.target.value })}
                    placeholder="Enter location"
                    className="w-full bg-gray-100 border border-gray-300 rounded-lg px-2 py-1 text-sm font-semibold text-gray-900"
                  />
                ) : (
                  <div className="font-semibold text-gray-900">{developer.location || 'Not specified'}</div>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-purple-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-500">Timezone</div>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedDeveloper.timezone || ''}
                    onChange={(e) => setEditedDeveloper({ ...editedDeveloper, timezone: e.target.value })}
                    placeholder="e.g., UTC+5, EST"
                    className="w-full bg-gray-100 border border-gray-300 rounded-lg px-2 py-1 text-sm font-semibold text-gray-900"
                  />
                ) : (
                  <div className="font-semibold text-gray-900">{developer.timezone || 'Not specified'}</div>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-orange-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-500">Joined</div>
                <div className="font-semibold text-gray-900">
                  {developer.joinedDate ? new Date(developer.joinedDate).toLocaleDateString() : 'N/A'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 p-2 mb-6"
      >
        <div className="flex space-x-2">
          {[
            { id: 'overview', label: 'Overview', icon: User },
            { id: 'skills', label: 'Skills', icon: Code },
            { id: 'portfolio', label: 'Portfolio', icon: Briefcase },
            { id: 'reviews', label: 'Reviews', icon: Star },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center space-x-2 px-6 py-3 rounded-xl font-bold transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">About Me</h3>
            {isEditing ? (
              <textarea
                value={editedDeveloper.bio}
                onChange={(e) => setEditedDeveloper({ ...editedDeveloper, bio: e.target.value })}
                rows={6}
                className="w-full bg-gray-100 border-2 border-gray-300 rounded-xl px-4 py-3 text-gray-900 resize-none"
              />
            ) : (
              <p className="text-gray-600 leading-relaxed mb-6">
                {developer.bio || 'No bio added yet. Click Edit Profile to add your bio.'}
              </p>
            )}

            <div className="mt-8">
              <h4 className="text-xl font-bold text-gray-900 mb-4">Languages</h4>
              {developer.languages.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {developer.languages.map((lang, idx) => (
                    <div
                      key={idx}
                      className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 px-4 py-2 rounded-xl font-semibold text-blue-700"
                    >
                      <Globe className="w-4 h-4 inline mr-2" />
                      {lang}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">No languages specified</p>
              )}
            </div>
          </div>
        )}

        {/* Skills Tab */}
        {activeTab === 'skills' && (
          <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Technical Skills</h3>
            </div>

            {/* Add Skill Input with Autocomplete - Only show in edit mode */}
            {isEditing && (
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-blue-200">
                <div className="relative">
                  <div className="flex items-center space-x-3">
                    <div className="flex-1 relative">
                      <input
                        ref={skillInputRef}
                        type="text"
                        value={newSkill}
                        onChange={(e) => handleSkillInputChange(e.target.value)}
                        onKeyDown={handleSkillInputKeyDown}
                        onFocus={() => {
                          if (skillSuggestions.length > 0) {
                            setShowSuggestions(true);
                          }
                        }}
                        placeholder="Start typing to search skills (e.g., React, UI Design, Marketing)"
                        className="w-full bg-white border-2 border-gray-300 rounded-xl px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none"
                      />

                      {/* Suggestions Dropdown */}
                      <AnimatePresence>
                        {showSuggestions && skillSuggestions.length > 0 && (
                          <motion.div
                            ref={suggestionsRef}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute z-50 left-0 right-0 top-full mt-1 bg-white rounded-xl border-2 border-gray-200 shadow-xl max-h-64 overflow-y-auto"
                          >
                            {skillSuggestions.map((suggestion, index) => {
                              const category = getCategoryForSkill(suggestion);
                              return (
                                <button
                                  key={suggestion}
                                  onClick={() => handleSelectSuggestion(suggestion)}
                                  className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors flex items-center justify-between group ${
                                    index === selectedSuggestionIndex
                                      ? 'bg-blue-50'
                                      : ''
                                  } ${index === 0 ? 'rounded-t-xl' : ''} ${
                                    index === skillSuggestions.length - 1 ? 'rounded-b-xl' : ''
                                  }`}
                                >
                                  <div className="flex items-center space-x-3">
                                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${getCategoryColor(suggestion)} flex items-center justify-center`}>
                                      <Code className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                      <span className="font-semibold text-gray-900">{suggestion}</span>
                                      {category && (
                                        <span className="block text-xs text-gray-500">
                                          {category.name}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <Plus className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                                </button>
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        if (newSkill.trim()) {
                          handleSelectSuggestion(newSkill.trim());
                        }
                      }}
                      className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-xl font-semibold"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add</span>
                    </motion.button>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Type to search from {SKILL_CATEGORIES.length} categories with 500+ skills. Press Enter or click Add to add a custom skill.
                </p>

                {/* Category Quick Links */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {SKILL_CATEGORIES.slice(0, 6).map((category) => (
                    <button
                      key={category.id}
                      onClick={() => {
                        setNewSkill('');
                        setSkillSuggestions(
                          category.skills
                            .filter(
                              (skill) =>
                                !editedDeveloper.skills.some(
                                  (s) => s.name.toLowerCase() === skill.toLowerCase()
                                )
                            )
                            .slice(0, 15)
                        );
                        setShowSuggestions(true);
                        skillInputRef.current?.focus();
                      }}
                      className="text-xs px-3 py-1.5 rounded-full bg-white border border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(isEditing ? editedDeveloper.skills : developer.skills).length > 0 ? (
              <div className="grid md:grid-cols-2 gap-4">
                {(isEditing ? editedDeveloper.skills : developer.skills).map((skill, idx) => {
                  const category = getCategoryForSkill(skill.name);
                  return (
                    <motion.div
                      key={idx}
                      whileHover={{ scale: 1.02 }}
                      className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 border-2 border-gray-200"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 bg-gradient-to-br ${getCategoryColor(skill.name)} rounded-lg flex items-center justify-center`}>
                            <Code className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-gray-900">{skill.name}</span>
                              {skill.verified && (
                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                              )}
                            </div>
                            <div className="text-sm text-gray-600">
                              <span className="capitalize">{skill.level}</span>
                              {skill.yearsOfExperience && skill.yearsOfExperience > 0 && <span> • {skill.yearsOfExperience}+ years</span>}
                              {category && <span className="text-gray-400"> • {category.name}</span>}
                            </div>
                          </div>
                        </div>
                        {isEditing && (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => {
                              setEditedDeveloper({
                                ...editedDeveloper,
                                skills: editedDeveloper.skills.filter((_, i) => i !== idx),
                              });
                            }}
                            className="w-8 h-8 bg-red-100 text-red-600 rounded-lg flex items-center justify-center hover:bg-red-200 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Code className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No skills added yet</p>
                <p className="text-gray-400 text-sm mt-2">
                  {isEditing ? 'Add your technical skills using the input above' : 'Add your technical skills to showcase your expertise'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Portfolio Tab */}
        {activeTab === 'portfolio' && (
          <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Portfolio Projects</h3>
              <p className="text-sm text-gray-500">Completed projects are automatically added here</p>
            </div>

            {developer.portfolioItems.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-6">
                {developer.portfolioItems.map((item) => (
                  <motion.div
                    key={item.id}
                    whileHover={{ y: -4 }}
                    className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-6 border-2 border-gray-200 shadow-lg"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <h4 className="text-xl font-bold text-gray-900">{item.title}</h4>
                      {item.projectUrl && (
                        <a
                          href={item.projectUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <LinkIcon className="w-5 h-5" />
                        </a>
                      )}
                    </div>
                    <p className="text-gray-600 mb-4">{item.description}</p>
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
                    <div className="text-sm text-gray-500">
                      Completed: {new Date(item.completedDate).toLocaleDateString()}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No portfolio projects yet</p>
                <p className="text-gray-400 text-sm mt-2">Your completed projects will appear here</p>
              </div>
            )}
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Client Reviews</h3>
            {developer.reviews.length > 0 ? (
              <div className="space-y-4">
                {developer.reviews.map((review) => (
                  <motion.div
                    key={review.id}
                    whileHover={{ scale: 1.01 }}
                    className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 border-2 border-gray-200"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white font-bold">
                          {review.clientName[0]}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">{review.clientName}</div>
                          <div className="text-sm text-gray-600">{review.projectTitle}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-5 h-5 ${
                              i < Math.floor(review.rating)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-700 mb-3">"{review.comment}"</p>
                    <div className="text-sm text-gray-500">
                      {new Date(review.date).toLocaleDateString()}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No reviews yet</p>
                <p className="text-gray-400 text-sm mt-2">Complete projects to receive client reviews</p>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default DeveloperProfile;
