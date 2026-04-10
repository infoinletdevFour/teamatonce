/**
 * FeedbackModal Component
 *
 * Modal component for clients to request changes on submitted milestones.
 * Features:
 * - Warning/alert style design (orange/yellow theme)
 * - Required feedback textarea
 * - Displays milestone information
 * - Framer Motion animations
 * - Loading state support
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, Send } from 'lucide-react';
import type { Milestone } from '@/types/milestone';

// ==================== TYPES ====================

export interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedback: string) => void | Promise<void>;
  milestone: Milestone;
  loading?: boolean;
}

// ==================== COMPONENT ====================

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  milestone,
  loading = false,
}) => {
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFeedback('');
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Validate feedback
  const isValid = feedback.trim().length > 0;

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!isValid) {
      setError('Please provide feedback on what needs to be changed');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await onSubmit(feedback.trim());
      // Don't close here - let parent component handle it
    } catch (err: any) {
      setError(err.message || 'Failed to submit feedback');
      setIsSubmitting(false);
    }
  };

  // Handle close
  const handleClose = () => {
    if (!isSubmitting && !loading) {
      onClose();
    }
  };

  const isDisabled = isSubmitting || loading;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-start justify-between px-6 py-5 border-b border-orange-100 bg-gradient-to-r from-orange-50 to-amber-50">
              <div className="flex items-start gap-4 flex-1">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400/20 to-amber-400/20 flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">
                    Request Changes
                  </h2>
                  <p className="text-sm text-gray-600">
                    Provide feedback on what needs to be changed or improved.
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleClose}
                disabled={isDisabled}
                className="ml-2 p-2 rounded-xl bg-white hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Milestone Info */}
              <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-xl">
                <h3 className="text-sm font-semibold text-gray-700 mb-1">
                  Milestone
                </h3>
                <p className="text-base font-bold text-gray-900">
                  {milestone.title}
                </p>
                {milestone.description && (
                  <div
                    className="text-sm text-gray-600 mt-1 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: milestone.description }}
                  />
                )}
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-50 border-2 border-red-200 rounded-xl"
                >
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <p className="text-sm font-medium text-red-700">{error}</p>
                  </div>
                </motion.div>
              )}

              {/* Feedback Textarea */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Feedback <span className="text-orange-600">*</span>
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => {
                    setFeedback(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Describe the changes needed..."
                  rows={6}
                  disabled={isDisabled}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-200 outline-none transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50"
                  required
                />
                <p className="text-xs text-gray-500 mt-2">
                  Be specific about what needs to be changed or improved in this milestone.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-gray-200">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleClose}
                  disabled={isDisabled}
                  className="flex-1 px-6 py-3 bg-white border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="submit"
                  whileHover={{ scale: isValid && !isDisabled ? 1.02 : 1 }}
                  whileTap={{ scale: isValid && !isDisabled ? 0.98 : 1 }}
                  disabled={!isValid || isDisabled}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-bold shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  {isSubmitting || loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-5 h-5 border-3 border-white border-t-transparent rounded-full"
                      />
                      <span>Sending...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <Send className="w-5 h-5" />
                      <span>Send Feedback</span>
                    </div>
                  )}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FeedbackModal;
