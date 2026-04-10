import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  Globe,
  Calendar,
  DollarSign,
  Star,
  Edit,
  Camera,
  Users,
  FolderKanban,
  Zap,
  Loader2,
  Save,
  X,
  Briefcase,
} from 'lucide-react';
import { dashboardService, UserProfile, ClientReview } from '../../services/dashboardService';
import { DashboardStats } from '../../types/client';
import { useCompany } from '@/contexts/CompanyContext';
import { toast } from 'sonner';

/**
 * Profile Page
 * Client profile with company details and statistics
 */

export const Profile: React.FC = () => {
  const { companyId } = useCompany();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editForm, setEditForm] = useState<Partial<UserProfile>>({});
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [reviews, setReviews] = useState<ClientReview[]>([]);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Fetch profile data on mount
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!companyId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const [profileData, statsData, reviewsData] = await Promise.all([
          dashboardService.getUserProfile(),
          dashboardService.getClientStats(companyId),
          dashboardService.getClientReviews(companyId)
        ]);

        setProfile(profileData);
        setStats(statsData);
        setReviews(reviewsData);
      } catch (err: any) {
        console.error('Error fetching profile data:', err);
        setError(err.message || 'Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [companyId]);

  // Start editing - populate edit form with current profile data
  const handleStartEditing = () => {
    if (profile) {
      // Use the full name from profile, or combine firstName + lastName if name is not available
      const fullName = profile.name || `${profile.firstName || ''} ${profile.lastName || ''}`.trim();
      setEditForm({
        name: fullName,
        phone: profile.phone || '',
        company: profile.company || '',
        title: profile.title || '',
        location: profile.location || '',
        website: profile.website || '',
        bio: profile.bio || '',
      });
      setAvatarPreview(null);
      setAvatarFile(null);
      setIsEditing(true);
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm({});
    setAvatarFile(null);
    setAvatarPreview(null);
    setError(null);
  };

  // Handle profile save
  const handleSaveProfile = async () => {
    if (!profile) return;

    try {
      setSaving(true);
      setError(null);

      let avatarUrl = profile.avatar;

      // Upload avatar if changed
      if (avatarFile) {
        try {
          avatarUrl = await dashboardService.uploadAvatar(avatarFile);
        } catch (avatarErr: any) {
          console.error('Error uploading avatar:', avatarErr);
          toast.error('Failed to upload avatar');
        }
      }

      // Prepare update data - map to backend field names
      const updateData: any = {
        name: editForm.name?.trim() || '',
        bio: editForm.bio,
        location: editForm.location,
        website: editForm.website,
        phone: editForm.phone,
        company: editForm.company,
        title: editForm.title,
        avatar: avatarUrl,
      };

      // Update profile on backend
      await dashboardService.updateUserProfile(updateData);

      // Update local profile state with the edit form values
      // Merge backend response with form values (in case backend doesn't return all fields)
      const nameParts = (editForm.name || '').trim().split(' ');
      const newFirstName = nameParts[0] || '';
      const newLastName = nameParts.slice(1).join(' ') || '';
      setProfile(prev => prev ? {
        ...prev,
        name: editForm.name || prev.name,
        firstName: newFirstName || prev.firstName,
        lastName: newLastName || prev.lastName,
        phone: editForm.phone || prev.phone,
        company: editForm.company || prev.company,
        title: editForm.title || prev.title,
        location: editForm.location || prev.location,
        website: editForm.website || prev.website,
        bio: editForm.bio || prev.bio,
        avatar: avatarUrl || prev.avatar,
      } : prev);
      setIsEditing(false);
      setEditForm({});
      setAvatarFile(null);
      setAvatarPreview(null);
      toast.success('Profile updated successfully');
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setError(err.message || 'Failed to save profile');
      toast.error(err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  // Handle avatar change
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }

      // Validate file type
      if (!file.type.match(/^image\/(jpeg|jpg|png|gif|webp)$/)) {
        toast.error('Please upload a valid image file (JPEG, PNG, GIF, or WebP)');
        return;
      }

      setAvatarFile(file);
      // Preview avatar
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle form field change
  const handleFieldChange = (field: keyof UserProfile, value: string) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading profile...</p>
        </motion.div>
      </div>
    );
  }

  if (error || !profile || !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-gray-200 p-8"
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Failed to load profile</h2>
          <p className="text-gray-600 mb-6">{error || 'Profile data is not available'}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            Try Again
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Profile
              </h1>
              <p className="text-gray-600">Your professional profile and project history</p>
            </div>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm"
              >
                {error}
              </motion.div>
            )}
            <div className="flex items-center space-x-3">
              {isEditing && (
                <button
                  onClick={handleCancelEdit}
                  disabled={saving}
                  className="flex items-center space-x-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                  <span>Cancel</span>
                </button>
              )}
              <button
                onClick={isEditing ? handleSaveProfile : handleStartEditing}
                disabled={saving}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    {isEditing ? <Save className="w-5 h-5" /> : <Edit className="w-5 h-5" />}
                    <span>{isEditing ? 'Save Profile' : 'Edit Profile'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-gray-200 mb-8"
        >
          {/* Cover Image */}
          <div className="h-32 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 relative rounded-t-2xl overflow-hidden">
            <div className="absolute inset-0 bg-black/20"></div>
          </div>

          {/* Profile Info */}
          <div className="pt-8 px-8 pb-8 relative z-10">
            <div className="flex items-start justify-between -mt-16 mb-6">
              <div className="flex flex-col md:flex-row md:items-end md:space-x-6">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  {(avatarPreview || profile.avatar) ? (
                    <img
                      src={avatarPreview || profile.avatar}
                      alt={`${profile.firstName} ${profile.lastName}`}
                      className="w-32 h-32 rounded-2xl object-cover border-4 border-white shadow-xl"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-5xl font-black border-4 border-white shadow-xl">
                      {profile.firstName.charAt(0)}
                      {profile.lastName.charAt(0)}
                    </div>
                  )}
                  {isEditing && (
                    <label className="absolute bottom-2 right-2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 transition-colors cursor-pointer">
                      <Camera className="w-5 h-5 text-gray-600" />
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* Name and Title */}
                <div className="mt-4 md:mt-0 md:pb-4">
                  {isEditing ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editForm.name || ''}
                        onChange={(e) => handleFieldChange('name', e.target.value)}
                        placeholder="Full Name"
                        className="w-full px-4 py-2 text-xl font-bold border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                      />
                      <div className="flex items-center space-x-2">
                        <Briefcase className="w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={editForm.title || ''}
                          onChange={(e) => handleFieldChange('title', e.target.value)}
                          placeholder="Job Title"
                          className="flex-1 px-3 py-1.5 text-gray-600 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2 flex-1">
                          <Building2 className="w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            value={editForm.company || ''}
                            onChange={(e) => handleFieldChange('company', e.target.value)}
                            placeholder="Company"
                            className="flex-1 px-3 py-1.5 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                        <div className="flex items-center space-x-2 flex-1">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            value={editForm.location || ''}
                            onChange={(e) => handleFieldChange('location', e.target.value)}
                            placeholder="Location"
                            className="flex-1 px-3 py-1.5 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h2 className="text-3xl font-black text-gray-900 mb-1">
                        {profile.name || `${profile.firstName} ${profile.lastName}`.trim()}
                      </h2>
                      <p className="text-lg text-gray-600 mb-2">{profile.title}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Building2 className="w-4 h-4" />
                          <span>{profile.company}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-4 h-4" />
                          <span>{profile.location}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>
                            Member since{' '}
                            {profile.memberSince.toLocaleDateString('en-US', {
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Rating Badge */}
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center mb-1">
                  <Star className="w-8 h-8 text-yellow-400 fill-yellow-400" />
                </div>
                <div className="text-3xl font-black text-gray-900">{stats.averageRating?.toFixed(1) || '0.0'}</div>
                <div className="text-xs text-gray-600">{stats.totalReviews || 0} reviews</div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-3 gap-6 mb-6">
              {/* Email - Always Read Only */}
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="text-xs text-gray-500">Email</div>
                  <div className="font-semibold text-gray-900">{profile.email}</div>
                  {isEditing && (
                    <div className="text-xs text-gray-400 italic">Email cannot be changed</div>
                  )}
                </div>
              </div>

              {/* Phone - Editable */}
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Phone className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <div className="text-xs text-gray-500">Phone</div>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={editForm.phone || ''}
                      onChange={(e) => handleFieldChange('phone', e.target.value)}
                      placeholder="Enter phone number"
                      className="w-full px-2 py-1 font-semibold border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                    />
                  ) : (
                    <div className="font-semibold text-gray-900">{profile.phone || 'Not set'}</div>
                  )}
                </div>
              </div>

              {/* Website - Editable */}
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Globe className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <div className="text-xs text-gray-500">Website</div>
                  {isEditing ? (
                    <input
                      type="url"
                      value={editForm.website || ''}
                      onChange={(e) => handleFieldChange('website', e.target.value)}
                      placeholder="https://example.com"
                      className="w-full px-2 py-1 font-semibold border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none"
                    />
                  ) : (
                    <div className="font-semibold text-gray-900">{profile.website || 'Not set'}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Bio */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3">About</h3>
              {isEditing ? (
                <textarea
                  value={editForm.bio || ''}
                  onChange={(e) => handleFieldChange('bio', e.target.value)}
                  placeholder="Tell us about yourself..."
                  rows={4}
                  className="w-full px-4 py-3 text-gray-700 leading-relaxed border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none resize-none"
                />
              ) : (
                <p className="text-gray-700 leading-relaxed">{profile.bio || 'No bio available'}</p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          {[
            {
              label: 'Total Projects',
              value: stats.totalProjects ?? (stats.activeProjects + stats.completedProjects),
              icon: FolderKanban,
              color: 'from-blue-500 to-cyan-500',
              bgColor: 'bg-blue-100',
            },
            {
              label: 'Active Projects',
              value: stats.activeProjects || 0,
              icon: Zap,
              color: 'from-purple-500 to-pink-500',
              bgColor: 'bg-purple-100',
            },
            {
              label: 'Total Spent',
              value: (stats.totalSpent || 0) >= 1000
                ? `$${((stats.totalSpent || 0) / 1000).toFixed(1)}K`
                : `$${(stats.totalSpent || 0).toFixed(0)}`,
              icon: DollarSign,
              color: 'from-green-500 to-emerald-500',
              bgColor: 'bg-green-100',
            },
            {
              label: 'Developers Hired',
              value: stats.developersHired || 0,
              icon: Users,
              color: 'from-orange-500 to-amber-500',
              bgColor: 'bg-orange-100',
            },
          ].map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.1 }}
                className="bg-white/80 backdrop-blur-lg rounded-xl p-6 shadow-lg border border-gray-200"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-gray-700" />
                  </div>
                </div>
                <div className="text-3xl font-black text-gray-900 mb-1">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </motion.div>
            );
          })}
        </div>

        {/* Developer Reviews Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-gray-200 p-8"
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Developer Reviews</h3>
          {reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((review) => (
                <motion.div
                  key={review.id}
                  whileHover={{ scale: 1.01 }}
                  className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 border-2 border-gray-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white font-bold">
                        {review.developerName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">{review.developerName}</div>
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
                  {review.title && (
                    <h4 className="font-semibold text-gray-800 mb-2">{review.title}</h4>
                  )}
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
              <p className="text-gray-400 text-sm mt-2">Developer reviews will appear here after project completion</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;
