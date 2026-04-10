import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User, Calendar, Briefcase, MapPin,
  Clock, CheckCircle, Star, Building2,
  Globe, Loader2, MessageSquare, ThumbsUp,
  ArrowLeft,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface FeedbackItem {
  id: string;
  rating: number;
  title?: string;
  content: string;
  feedbackType: string;
  createdAt: string;
  project?: {
    id: string;
    name: string;
  };
}

interface UserProfileData {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  role?: string;
  createdAt?: string;
  // Client-specific info
  projectsPosted?: number;
  projectsCompleted?: number;
  totalSpent?: number;
  // Feedback/Rating info
  averageRatingGiven?: number | null;
  totalFeedbacksGiven?: number;
  ratingDistribution?: { 1: number; 2: number; 3: number; 4: number; 5: number };
  recentFeedbacks?: FeedbackItem[];
  // Additional profile info
  location?: string;
  timezone?: string;
  bio?: string;
  company?: string;
}

const UserProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      loadUserProfile();
    }
  }, [userId]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get(`/users/${userId}/public-profile`);
      setProfile(response.data);
    } catch (err: any) {
      console.error('Error loading user profile:', err);
      setError(err.response?.data?.message || 'Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  };

  const formatFeedbackDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = {
      sm: 'w-3 h-3',
      md: 'w-4 h-4',
      lg: 'w-5 h-5',
    };
    return (
      <div className="flex items-center space-x-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClasses[size]} ${
              star <= rating
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="text-gray-600 font-medium">Loading profile...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Not Found</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 mb-4 font-medium text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Profile Header Card */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Cover/Banner */}
            <div className="h-32 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600" />

            {/* Profile Info */}
            <div className="px-6 pb-6">
              <div className="flex flex-col sm:flex-row sm:items-end -mt-12 sm:-mt-16 mb-4">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {profile?.avatar ? (
                    <img
                      src={profile.avatar}
                      alt={profile.name}
                      className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl border-4 border-white shadow-lg object-cover"
                    />
                  ) : (
                    <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl border-4 border-white shadow-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <User className="w-12 h-12 sm:w-16 sm:h-16 text-white" />
                    </div>
                  )}
                </div>

                {/* Name & Role */}
                <div className="mt-4 sm:mt-0 sm:ml-6 sm:pb-2">
                  <h1 className="text-2xl sm:text-3xl font-black text-gray-900">
                    {profile?.name || 'Unknown User'}
                  </h1>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold capitalize">
                      {profile?.role || 'Client'}
                    </span>
                    {profile?.createdAt && (
                      <span className="text-gray-500 text-sm flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        Member since {formatDate(profile.createdAt)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Bio */}
              {profile?.bio && (
                <p className="text-gray-600 mt-4">{profile.bio}</p>
              )}

              {/* Quick Info */}
              <div className="flex flex-wrap gap-4 mt-4">
                {profile?.company && (
                  <div className="flex items-center text-gray-600">
                    <Building2 className="w-4 h-4 mr-2" />
                    <span>{profile.company}</span>
                  </div>
                )}
                {profile?.location && (
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span>{profile.location}</span>
                  </div>
                )}
                {profile?.timezone && (
                  <div className="flex items-center text-gray-600">
                    <Globe className="w-4 h-4 mr-2" />
                    <span>{profile.timezone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-black text-gray-900">
                    {profile?.projectsPosted ?? 0}
                  </div>
                  <div className="text-sm text-gray-500">Projects Posted</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-black text-gray-900">
                    {profile?.projectsCompleted ?? 0}
                  </div>
                  <div className="text-sm text-gray-500">Completed</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Star className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-black text-gray-900">
                    ${(profile?.totalSpent ?? 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">Total Invested</div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Client Ratings Card */}
          {(profile?.totalFeedbacksGiven ?? 0) > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center">
                  <ThumbsUp className="w-5 h-5 mr-2 text-blue-600" />
                  Client Rating History
                </h3>
                <div className="flex items-center space-x-2">
                  {profile?.averageRatingGiven && (
                    <>
                      <span className="text-2xl font-black text-gray-900">
                        {profile.averageRatingGiven}
                      </span>
                      {renderStars(Math.round(profile.averageRatingGiven), 'md')}
                    </>
                  )}
                </div>
              </div>

              {/* Rating Distribution */}
              {profile?.ratingDistribution && (
                <div className="mb-6">
                  <p className="text-sm text-gray-500 mb-3">
                    Based on {profile.totalFeedbacksGiven} feedback{profile.totalFeedbacksGiven !== 1 ? 's' : ''} given
                  </p>
                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map((rating) => {
                      const count = profile.ratingDistribution?.[rating as 1 | 2 | 3 | 4 | 5] ?? 0;
                      const percentage = profile.totalFeedbacksGiven
                        ? (count / profile.totalFeedbacksGiven) * 100
                        : 0;
                      return (
                        <div key={rating} className="flex items-center space-x-2">
                          <span className="text-xs text-gray-600 w-12 flex items-center">
                            {rating} <Star className="w-3 h-3 ml-0.5 text-yellow-400 fill-yellow-400" />
                          </span>
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 w-8 text-right">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recent Feedbacks */}
              {profile?.recentFeedbacks && profile.recentFeedbacks.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <MessageSquare className="w-4 h-4 mr-1.5" />
                    Recent Feedback Given
                  </h4>
                  <div className="space-y-3">
                    {profile.recentFeedbacks.map((feedback) => (
                      <div
                        key={feedback.id}
                        className="p-3 bg-gray-50 rounded-lg border border-gray-100"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            {renderStars(feedback.rating, 'sm')}
                            <span className="text-xs text-gray-500">
                              {formatFeedbackDate(feedback.createdAt)}
                            </span>
                          </div>
                          {feedback.project && (
                            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                              {feedback.project.name}
                            </span>
                          )}
                        </div>
                        {feedback.title && (
                          <p className="text-sm font-medium text-gray-900 mb-1">
                            {feedback.title}
                          </p>
                        )}
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {feedback.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Additional Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-4">About this Client</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <span className="font-medium text-gray-900">Verified Account</span>
                  <p className="text-sm text-gray-500">Email and identity verified</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Clock className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <span className="font-medium text-gray-900">Active Client</span>
                  <p className="text-sm text-gray-500">Regularly posts and manages projects</p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default UserProfile;
