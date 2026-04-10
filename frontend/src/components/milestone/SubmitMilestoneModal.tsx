/**
 * SubmitMilestoneModal Component
 *
 * Modal for developers to submit milestones for client review.
 * Includes optional notes field and submission confirmation.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Send, FileCheck, Upload, File } from 'lucide-react';
import { Milestone } from '@/types/milestone';

export interface SubmitMilestoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (notes?: string, file?: File) => void | Promise<void>;
  milestone: Milestone;
  loading?: boolean;
}

export const SubmitMilestoneModal: React.FC<SubmitMilestoneModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  milestone,
  loading = false,
}) => {
  const [notes, setNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset notes and file when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setNotes('');
      setSelectedFile(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onSubmit(notes.trim() || undefined, selectedFile || undefined);
      // Modal will be closed by parent component on successful submission
    } catch (error) {
      console.error('Failed to submit milestone:', error);
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting && !loading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 via-blue-100 to-blue-50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                  <FileCheck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Submit Milestone for Review
                  </h2>
                  <p className="text-sm text-gray-600 mt-0.5">
                    Ready to show your work?
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleClose}
                disabled={isSubmitting || loading}
                className="p-2 hover:bg-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-5 h-5 text-gray-500" />
              </motion.button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="px-6 py-6 space-y-5 overflow-y-auto flex-1">
                {/* Milestone Info */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {milestone.title}
                      </h3>
                      {milestone.description && (
                        <div
                          className="text-sm text-gray-600 line-clamp-2 prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: milestone.description }}
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <p className="text-gray-700 text-sm leading-relaxed">
                    This will notify the client that you've completed the work and it's ready for review.
                    The client will be able to review your deliverables and provide feedback.
                  </p>
                </div>

                {/* File Upload */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Upload Deliverable
                  </label>
                  {!selectedFile ? (
                    <div className="relative">
                      <input
                        type="file"
                        onChange={handleFileChange}
                        disabled={isSubmitting || loading}
                        className="hidden"
                        id="file-upload"
                      />
                      <label
                        htmlFor="file-upload"
                        className="flex flex-col items-center justify-center w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer"
                      >
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <p className="text-sm font-semibold text-gray-700">
                          Click to upload file
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Any file type accepted
                        </p>
                      </label>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between px-4 py-3 border-2 border-blue-300 bg-blue-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <File className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {selectedFile.name}
                          </p>
                          <p className="text-xs text-gray-600">
                            {(selectedFile.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handleRemoveFile}
                        disabled={isSubmitting || loading}
                        className="p-2 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <X className="w-4 h-4 text-red-600" />
                      </motion.button>
                    </div>
                  )}
                </div>

                {/* Notes Textarea */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all resize-none"
                    placeholder="Add notes about what you've completed, any highlights, or important information for the client..."
                    rows={4}
                    disabled={isSubmitting || loading}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Let the client know about any key accomplishments or items they should review
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleClose}
                  disabled={isSubmitting || loading}
                  className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isSubmitting || loading}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/40 transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting || loading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-5 h-5 border-3 border-white border-t-transparent rounded-full"
                      />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Submit for Review</span>
                    </>
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

export default SubmitMilestoneModal;
