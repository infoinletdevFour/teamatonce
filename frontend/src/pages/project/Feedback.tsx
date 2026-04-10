import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Star,
  Send,
  CheckCircle,
  AlertCircle,
  ThumbsUp,
  MessageSquare,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';
import { ProjectPageLayout } from '@/layouts/ProjectPageLayout';
import {
  submitProjectFeedback,
  getProjectFeedback,
  getFeedbackStatus,
  getProject,
} from '@/services/projectService';

interface FeedbackData {
  rating: number;
  title: string;
  content: string;
  positiveAspects: string[];
  areasOfImprovement: string[];
  isPublic: boolean;
}

const POSITIVE_ASPECTS_OPTIONS = [
  'Great communication',
  'Delivered on time',
  'High quality work',
  'Professional attitude',
  'Exceeded expectations',
  'Easy to work with',
  'Responsive',
  'Creative solutions',
];

const IMPROVEMENT_AREAS_OPTIONS = [
  'Communication could be better',
  'Timeline management',
  'Code quality',
  'Documentation',
  'Testing',
  'Understanding requirements',
  'Meeting deadlines',
  'Responsiveness',
];

export const Feedback: React.FC = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { companyId, loading: companyLoading } = useCompany();

  // State
  const [feedbackStatus, setFeedbackStatus] = useState<{
    canSubmitFeedback: boolean;
    hasSubmittedFeedback: boolean;
    isCompleted: boolean;
    userRole: 'client' | 'developer';
  } | null>(null);
  const [existingFeedback, setExistingFeedback] = useState<any[]>([]);
  const [projectName, setProjectName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [formData, setFormData] = useState<FeedbackData>({
    rating: 0,
    title: '',
    content: '',
    positiveAspects: [],
    areasOfImprovement: [],
    isPublic: true,
  });

  // Hover state for star rating
  const [hoverRating, setHoverRating] = useState(0);

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      if (!projectId) return;

      try {
        setLoading(true);
        setError(null);

        const [statusData, feedbackData, projectData] = await Promise.all([
          getFeedbackStatus(projectId),
          getProjectFeedback(projectId).catch(() => ({ feedback: [] })),
          getProject(projectId),
        ]);

        setFeedbackStatus({
          canSubmitFeedback: statusData.canSubmitFeedback,
          hasSubmittedFeedback: statusData.hasSubmittedFeedback,
          isCompleted: statusData.isCompleted,
          userRole: statusData.userRole,
        });
        setExistingFeedback(feedbackData.feedback || []);
        setProjectName(projectData.name || 'Project');
      } catch (err: any) {
        console.error('Failed to load feedback data:', err);
        setError(err.message || 'Failed to load feedback data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!projectId) return;

    if (formData.rating === 0) {
      setError('Please select a rating');
      return;
    }

    if (!formData.content.trim()) {
      setError('Please provide feedback content');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await submitProjectFeedback(projectId, {
        rating: formData.rating,
        title: formData.title || undefined,
        content: formData.content,
        positiveAspects: formData.positiveAspects,
        areasOfImprovement: formData.areasOfImprovement,
        isPublic: formData.isPublic,
      });

      setSuccess(true);
      // Refresh feedback status
      const statusData = await getFeedbackStatus(projectId);
      setFeedbackStatus({
        canSubmitFeedback: statusData.canSubmitFeedback,
        hasSubmittedFeedback: statusData.hasSubmittedFeedback,
        isCompleted: statusData.isCompleted,
        userRole: statusData.userRole,
      });
    } catch (err: any) {
      console.error('Failed to submit feedback:', err);
      setError(err.message || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle selection in array
  const toggleArrayItem = (array: string[], item: string, setter: (arr: string[]) => void) => {
    if (array.includes(item)) {
      setter(array.filter((i) => i !== item));
    } else {
      setter([...array, item]);
    }
  };

  // Loading state
  if (companyLoading || loading) {
    return (
      <ProjectPageLayout title="Project Feedback" subtitle="Loading...">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </ProjectPageLayout>
    );
  }

  // Error state
  if (error && !feedbackStatus) {
    return (
      <ProjectPageLayout title="Project Feedback" subtitle="Error loading feedback">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-700 font-semibold">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </ProjectPageLayout>
    );
  }

  // Project not completed
  if (feedbackStatus && !feedbackStatus.isCompleted) {
    return (
      <ProjectPageLayout title="Project Feedback" subtitle="Project in progress">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center max-w-2xl mx-auto">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Project Not Yet Completed</h2>
          <p className="text-gray-600 mb-6">
            Feedback can only be submitted after the project has been marked as completed.
          </p>
          <button
            onClick={() => navigate(`/company/${companyId}/project/${projectId}/dashboard`)}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors inline-flex items-center space-x-2"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </button>
        </div>
      </ProjectPageLayout>
    );
  }

  // Success state
  if (success || (feedbackStatus && feedbackStatus.hasSubmittedFeedback)) {
    return (
      <ProjectPageLayout title="Project Feedback" subtitle="Thank you for your feedback">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-green-50 border border-green-200 rounded-xl p-8 text-center max-w-2xl mx-auto"
        >
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Feedback Submitted!</h2>
          <p className="text-gray-600 mb-6">
            Thank you for taking the time to share your experience. Your feedback helps us improve!
          </p>
          <button
            onClick={() => navigate(`/company/${companyId}/project/${projectId}/dashboard`)}
            className="px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors inline-flex items-center space-x-2"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </button>
        </motion.div>

        {/* Show existing feedback */}
        {existingFeedback.length > 0 && (
          <div className="mt-8 max-w-2xl mx-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Project Reviews</h3>
            <div className="space-y-4">
              {existingFeedback.map((fb) => (
                <div key={fb.id} className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center space-x-1 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-5 h-5 ${
                          star <= fb.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  {fb.title && <h4 className="font-bold text-gray-900 mb-2">{fb.title}</h4>}
                  <p className="text-gray-600">{fb.content}</p>
                  <p className="text-sm text-gray-400 mt-2">
                    {new Date(fb.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </ProjectPageLayout>
    );
  }

  // Feedback form
  return (
    <ProjectPageLayout
      title="Project Feedback"
      subtitle={`Share your experience working on ${projectName}`}
    >
      <div className="max-w-3xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Rating */}
          <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <Star className="w-6 h-6 text-yellow-500" />
              <span>Overall Rating</span>
            </h3>
            <div className="flex items-center justify-center space-x-2 py-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFormData({ ...formData, rating: star })}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-12 h-12 transition-colors ${
                      star <= (hoverRating || formData.rating)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-center text-gray-600">
              {formData.rating === 0 && 'Click to rate'}
              {formData.rating === 1 && 'Poor'}
              {formData.rating === 2 && 'Fair'}
              {formData.rating === 3 && 'Good'}
              {formData.rating === 4 && 'Very Good'}
              {formData.rating === 5 && 'Excellent'}
            </p>
          </div>

          {/* Title */}
          <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <MessageSquare className="w-6 h-6 text-blue-500" />
              <span>Feedback Title (Optional)</span>
            </h3>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Summarize your experience in a few words..."
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Content */}
          <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <MessageSquare className="w-6 h-6 text-purple-500" />
              <span>Your Feedback</span>
            </h3>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Share your detailed experience with the project..."
              rows={5}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors resize-none"
              required
            />
          </div>

          {/* Positive Aspects */}
          <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <ThumbsUp className="w-6 h-6 text-green-500" />
              <span>What went well? (Optional)</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {POSITIVE_ASPECTS_OPTIONS.map((aspect) => (
                <button
                  key={aspect}
                  type="button"
                  onClick={() =>
                    toggleArrayItem(formData.positiveAspects, aspect, (arr) =>
                      setFormData({ ...formData, positiveAspects: arr })
                    )
                  }
                  className={`px-4 py-2 rounded-full border-2 font-medium transition-all ${
                    formData.positiveAspects.includes(aspect)
                      ? 'bg-green-100 border-green-400 text-green-700'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-green-300'
                  }`}
                >
                  {aspect}
                </button>
              ))}
            </div>
          </div>

          {/* Areas of Improvement */}
          <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <AlertCircle className="w-6 h-6 text-orange-500" />
              <span>Areas for Improvement (Optional)</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {IMPROVEMENT_AREAS_OPTIONS.map((area) => (
                <button
                  key={area}
                  type="button"
                  onClick={() =>
                    toggleArrayItem(formData.areasOfImprovement, area, (arr) =>
                      setFormData({ ...formData, areasOfImprovement: arr })
                    )
                  }
                  className={`px-4 py-2 rounded-full border-2 font-medium transition-all ${
                    formData.areasOfImprovement.includes(area)
                      ? 'bg-orange-100 border-orange-400 text-orange-700'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-orange-300'
                  }`}
                >
                  {area}
                </button>
              ))}
            </div>
          </div>

          {/* Public/Private Toggle */}
          <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900">Make feedback public</h3>
                <p className="text-sm text-gray-600">
                  Public feedback may be displayed on profiles to help others
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isPublic: !formData.isPublic })}
                className={`w-14 h-8 rounded-full transition-colors relative ${
                  formData.isPublic ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                    formData.isPublic ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate(`/company/${companyId}/project/${projectId}/dashboard`)}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Submit Feedback</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </ProjectPageLayout>
  );
};

export default Feedback;
