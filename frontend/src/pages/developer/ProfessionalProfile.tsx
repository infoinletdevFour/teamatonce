/**
 * Professional Seller Profile - Production Ready
 * Complete Fiverr/Upwork-style professional profile with all features
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  User, MapPin, Star, Briefcase, Edit2, Save, X,
  Upload, Camera, Clock, CheckCircle2,
  Award, GraduationCap, Building2, DollarSign, Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { apiClient } from '@/lib/api-client';
import { SellerProfile } from '@/types/profile';

// Import tab components
import ProfileOverview from '@/components/profile/ProfileOverview';
import ProfilePortfolio from '@/components/profile/ProfilePortfolio';
import ProfileExperience from '@/components/profile/ProfileExperience';
import ProfileEducation from '@/components/profile/ProfileEducation';
import ProfileCertifications from '@/components/profile/ProfileCertifications';

// ============================================================================
// Main Component
// ============================================================================

const ProfessionalProfile: React.FC = () => {
  const { user } = useAuth();
  const { company } = useCompany();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'portfolio' | 'experience' | 'education' | 'certifications'>('overview');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const coverInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Create profile with COMPANY data (each company has its own profile)
  // Each company is a separate business entity with its own professional identity
  const createDefaultProfile = (): SellerProfile => {
    // Extract location from business_address
    const location = company?.business_address
      ? [
          company.business_address.city,
          company.business_address.state,
          company.business_address.country
        ].filter(Boolean).join(', ')
      : '';

    return {
      id: company?.id || '',
      name: company?.display_name || company?.company_name || '',  // Company name, not user name
      email: company?.business_email || user?.email || '',  // Company email preferred, user email as fallback
      phone: company?.business_phone || '',  // Company phone
      title: '',
      tagline: '',
      bio: company?.description || '',  // Use company description as initial bio
      avatar: company?.logo_url || '',  // Company logo, not user avatar
      coverImage: '',
      hourlyRate: 50,
      availability: 'available',
      responseTime: 'within 24 hours',
      location: location,  // Company location from business_address
      timezone: company?.timezone || '',  // Company timezone
      rating: 0,
      totalReviews: 0,
      totalEarnings: 0,
      completedProjects: 0,
      successRate: 100,
      onTimeDelivery: 100,
      skills: [],
      languages: [],
      education: [],
      certifications: [],
      experience: [],
      portfolioItems: [],
      socialLinks: { website: company?.website },  // Include company website
      joinedDate: company?.created_at || new Date().toISOString(),  // Company creation date
      verified: company?.is_verified || false,  // Company verification status
      topRated: false,
    };
  };

  const [profile, setProfile] = useState<SellerProfile>(() => createDefaultProfile());
  const [editedProfile, setEditedProfile] = useState<SellerProfile>(() => createDefaultProfile());

  // Load profile when company changes
  useEffect(() => {
    if (company?.id) {
      loadProfile();
    }
  }, [company?.id]);

  const loadProfile = async () => {
    if (!company?.id) return;

    try {
      setLoading(true);
      const response = await apiClient.get(`/company/${company.id}/profile`);

      // If profile exists in database, use it
      if (response.data.data) {
        setProfile(response.data.data);
        setEditedProfile(response.data.data);
      } else {
        // If no profile data, use company defaults
        const defaultProfile = createDefaultProfile();
        setProfile(defaultProfile);
        setEditedProfile(defaultProfile);
      }
    } catch (error: any) {
      console.error('Error loading profile:', error);
      // If profile doesn't exist (404), initialize with company data
      if (error.response?.status === 404) {
        const defaultProfile = createDefaultProfile();
        setProfile(defaultProfile);
        setEditedProfile(defaultProfile);
      }
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // Image Upload Handlers
  // ============================================================================

  const uploadImage = async (file: File, type: 'cover' | 'avatar' | 'portfolio'): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const response = await apiClient.post(`/company/${company?.id}/upload-image`, formData);
    return response.data.data.url;
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    try {
      toast.loading('Uploading cover photo...');
      const imageUrl = await uploadImage(file, 'cover');
      setEditedProfile({ ...editedProfile, coverImage: imageUrl });
      toast.dismiss();
      toast.success('Cover photo uploaded');
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to upload cover photo');
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size should be less than 2MB');
      return;
    }

    try {
      toast.loading('Uploading profile photo...');
      const imageUrl = await uploadImage(file, 'avatar');
      setEditedProfile({ ...editedProfile, avatar: imageUrl });
      toast.dismiss();
      toast.success('Profile photo uploaded');
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to upload profile photo');
    }
  };

  // ============================================================================
  // Save Profile
  // ============================================================================

  const handleSave = async () => {
    // Validation
    if (!editedProfile.name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (!editedProfile.title.trim()) {
      toast.error('Professional title is required');
      return;
    }
    if (editedProfile.hourlyRate <= 0) {
      toast.error('Please set a valid hourly rate');
      return;
    }

    try {
      setSaving(true);

      // Only send editable fields, exclude read-only fields
      const updateData = {
        name: editedProfile.name,
        email: editedProfile.email,
        phone: editedProfile.phone,
        title: editedProfile.title,
        tagline: editedProfile.tagline,
        bio: editedProfile.bio,
        avatar: editedProfile.avatar,
        coverImage: editedProfile.coverImage,
        hourlyRate: Number(editedProfile.hourlyRate) || 0,
        availability: editedProfile.availability,
        responseTime: editedProfile.responseTime,
        location: editedProfile.location,
        timezone: editedProfile.timezone,
        skills: editedProfile.skills,
        languages: editedProfile.languages,
        education: editedProfile.education,
        certifications: editedProfile.certifications,
        experience: editedProfile.experience,
        portfolioItems: editedProfile.portfolioItems,
        socialLinks: editedProfile.socialLinks,
      };

      await apiClient.put(`/company/${company?.id}/profile`, updateData);
      setProfile(editedProfile);
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast.error(error.response?.data?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedProfile(profile);
    setIsEditing(false);
  };

  // ============================================================================
  // Helper Functions
  // ============================================================================

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available': return 'bg-green-500';
      case 'busy': return 'bg-orange-500';
      default: return 'bg-red-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-12">
      {/* Header with Edit Button */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 mb-2">Professional Profile</h1>
          <p className="text-gray-600">Showcase your expertise and attract more clients</p>
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
              className="flex items-center space-x-2 bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-bold"
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

      {/* Profile Card with Cover Photo */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden mb-6"
      >
        {/* Cover Photo */}
        <div className="relative h-64 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
          {editedProfile.coverImage && (
            <img
              src={editedProfile.coverImage}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent" />

          {/* Badges */}
          <div className="absolute top-6 left-6 flex items-center gap-3">
            {profile.topRated && (
              <div className="bg-yellow-500 text-white px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 shadow-lg">
                <Star className="w-4 h-4 fill-white" />
                Top Rated Seller
              </div>
            )}
            {profile.verified && (
              <div className="bg-blue-600 text-white px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 shadow-lg">
                <CheckCircle2 className="w-4 h-4" />
                Verified
              </div>
            )}
          </div>

          {/* Upload Cover Button */}
          {isEditing && (
            <>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                onChange={handleCoverUpload}
                className="hidden"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={() => coverInputRef.current?.click()}
                className="absolute top-6 right-6 bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-xl font-semibold flex items-center space-x-2 hover:bg-white/30 transition-colors"
              >
                <Upload className="w-4 h-4" />
                <span>Change Cover</span>
              </motion.button>
            </>
          )}
        </div>

        {/* Profile Info */}
        <div className="px-8 pb-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between -mt-20 relative z-10">
            {/* Avatar and Name */}
            <div className="flex items-end gap-6 mb-6 lg:mb-0">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                {editedProfile.avatar ? (
                  <img
                    src={editedProfile.avatar}
                    alt={profile.name}
                    className="w-40 h-40 rounded-3xl border-4 border-white shadow-2xl object-cover"
                  />
                ) : (
                  <div className="w-40 h-40 rounded-3xl bg-gradient-to-br from-blue-500 to-purple-500 border-4 border-white shadow-2xl flex items-center justify-center text-white text-5xl font-black">
                    {profile.name ? profile.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : <User className="w-20 h-20" />}
                  </div>
                )}
                {isEditing && (
                  <>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      onClick={() => avatarInputRef.current?.click()}
                      className="absolute bottom-2 right-2 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700"
                    >
                      <Camera className="w-6 h-6" />
                    </motion.button>
                  </>
                )}
              </div>

              {/* Name and Title */}
              <div className="pt-24">
                {isEditing ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editedProfile.name || ''}
                      onChange={(e) => setEditedProfile({ ...editedProfile, name: e.target.value })}
                      placeholder="Full Name"
                      className="text-3xl font-black text-gray-900 bg-gray-50 border-2 border-gray-300 rounded-xl px-4 py-2 w-full focus:border-blue-500 outline-none"
                    />
                    <input
                      type="text"
                      value={editedProfile.title || ''}
                      onChange={(e) => setEditedProfile({ ...editedProfile, title: e.target.value })}
                      placeholder="Professional Title (e.g., Senior Full-Stack Developer)"
                      className="text-xl text-gray-600 bg-gray-50 border-2 border-gray-300 rounded-xl px-4 py-2 w-full focus:border-blue-500 outline-none"
                    />
                    <input
                      type="text"
                      value={editedProfile.tagline || ''}
                      onChange={(e) => setEditedProfile({ ...editedProfile, tagline: e.target.value })}
                      placeholder="One-line tagline (e.g., Building scalable web apps with React & Node.js)"
                      className="text-base text-gray-500 bg-gray-50 border-2 border-gray-300 rounded-xl px-4 py-2 w-full focus:border-blue-500 outline-none"
                    />
                  </div>
                ) : (
                  <>
                    <h2 className="text-4xl font-black text-gray-900 mb-1">{profile.name}</h2>
                    <p className="text-xl font-bold text-gray-700 mb-2">{profile.title || 'Add your professional title'}</p>
                    <p className="text-base text-gray-600">{profile.tagline || 'Add a tagline to showcase your expertise'}</p>
                  </>
                )}

                {/* Quick Stats */}
                <div className="flex items-center gap-4 mt-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-5 h-5 ${
                            i < Math.floor(profile.rating)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="font-bold text-gray-900">{profile.rating || '0.0'}</span>
                    <span className="text-gray-600">({profile.totalReviews || 0} reviews)</span>
                  </div>

                  {isEditing ? (
                    <select
                      value={editedProfile.availability || 'available'}
                      onChange={(e) => setEditedProfile({ ...editedProfile, availability: e.target.value as any })}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full ${getAvailabilityColor(editedProfile.availability)} text-white font-semibold`}
                    >
                      <option value="available">Available Now</option>
                      <option value="busy">Busy</option>
                      <option value="away">Away</option>
                    </select>
                  ) : (
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${getAvailabilityColor(profile.availability)} text-white font-semibold`}>
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      {profile.availability === 'available' && 'Available Now'}
                      {profile.availability === 'busy' && 'Busy'}
                      {profile.availability === 'away' && 'Away'}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-6 border-2 border-gray-200 shadow-lg">
              <div className="text-center">
                <div className="text-3xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  ${profile.totalEarnings >= 1000 ? `${(profile.totalEarnings / 1000).toFixed(0)}K+` : profile.totalEarnings}
                </div>
                <div className="text-sm text-gray-600 font-semibold">Total Earned</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {profile.completedProjects || 0}
                </div>
                <div className="text-sm text-gray-600 font-semibold">Projects Done</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-black bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  {profile.successRate || 100}%
                </div>
                <div className="text-sm text-gray-600 font-semibold">Success Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-black bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                  {profile.onTimeDelivery || 100}%
                </div>
                <div className="text-sm text-gray-600 font-semibold">On-Time</div>
              </div>
            </div>
          </div>

          {/* Contact Info Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-8 border-t-2 border-gray-100">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-xs text-gray-500 font-semibold">Location</div>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedProfile.location || ''}
                    onChange={(e) => setEditedProfile({ ...editedProfile, location: e.target.value })}
                    placeholder="City, Country"
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg px-2 py-1 text-sm font-bold"
                  />
                ) : (
                  <div className="font-bold text-gray-900">{profile.location || 'Add location'}</div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-purple-600 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-xs text-gray-500 font-semibold">Timezone</div>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedProfile.timezone || ''}
                    onChange={(e) => setEditedProfile({ ...editedProfile, timezone: e.target.value })}
                    placeholder="UTC+5, EST, etc."
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg px-2 py-1 text-sm font-bold"
                  />
                ) : (
                  <div className="font-bold text-gray-900">{profile.timezone || 'Add timezone'}</div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-yellow-600 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-xs text-gray-500 font-semibold">Response Time</div>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedProfile.responseTime || ''}
                    onChange={(e) => setEditedProfile({ ...editedProfile, responseTime: e.target.value })}
                    placeholder="e.g., within 1 hour"
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg px-2 py-1 text-sm font-bold"
                  />
                ) : (
                  <div className="font-bold text-gray-900">{profile.responseTime}</div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-xs text-gray-500 font-semibold">Hourly Rate</div>
                {isEditing ? (
                  <div className="flex items-center">
                    <span className="text-sm font-bold mr-1">$</span>
                    <input
                      type="number"
                      value={editedProfile.hourlyRate || 0}
                      onChange={(e) => setEditedProfile({ ...editedProfile, hourlyRate: Number(e.target.value) })}
                      className="w-20 bg-gray-50 border border-gray-300 rounded-lg px-2 py-1 text-sm font-bold"
                    />
                    <span className="text-sm font-bold ml-1">/hr</span>
                  </div>
                ) : (
                  <div className="font-bold text-gray-900">${profile.hourlyRate}/hr</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl shadow-lg border border-gray-200 p-2 mb-6"
      >
        <div className="flex overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview', icon: User },
            { id: 'portfolio', label: 'Portfolio', icon: Briefcase },
            { id: 'experience', label: 'Experience', icon: Building2 },
            { id: 'education', label: 'Education', icon: GraduationCap },
            { id: 'certifications', label: 'Certifications', icon: Award },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center justify-center space-x-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${
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

      {/* Tab Content - Overview */}
      {activeTab === 'overview' && (
        <ProfileOverview
          profile={profile}
          editedProfile={editedProfile}
          isEditing={isEditing}
          setEditedProfile={setEditedProfile}
        />
      )}

      {/* Portfolio Tab */}
      {activeTab === 'portfolio' && (
        <ProfilePortfolio
          profile={profile}
          editedProfile={editedProfile}
          isEditing={isEditing}
          setEditedProfile={setEditedProfile}
          companyId={company?.id || ''}
        />
      )}

      {/* Experience Tab */}
      {activeTab === 'experience' && (
        <ProfileExperience
          profile={profile}
          editedProfile={editedProfile}
          isEditing={isEditing}
          setEditedProfile={setEditedProfile}
        />
      )}

      {/* Education Tab */}
      {activeTab === 'education' && (
        <ProfileEducation
          profile={profile}
          editedProfile={editedProfile}
          isEditing={isEditing}
          setEditedProfile={setEditedProfile}
        />
      )}

      {/* Certifications Tab */}
      {activeTab === 'certifications' && (
        <ProfileCertifications
          profile={profile}
          editedProfile={editedProfile}
          isEditing={isEditing}
          setEditedProfile={setEditedProfile}
        />
      )}
    </div>
  );
};

export default ProfessionalProfile;
