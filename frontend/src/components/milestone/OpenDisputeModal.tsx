/**
 * Open Dispute Modal Component
 *
 * Allows users (client or developer) to open a dispute on a milestone
 * with detailed reason and evidence submission.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Upload, FileText, Trash2 } from 'lucide-react';
import type { Milestone } from '@/types/milestone';

export interface OpenDisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    reason: string;
    description: string;
    evidence?: string[];
    requestedResolution?: string;
  }) => Promise<void>;
  milestone: Milestone;
  loading?: boolean;
}

const DISPUTE_REASONS = [
  { value: 'not_delivered', label: 'Work Not Delivered' },
  { value: 'quality_issues', label: 'Quality Issues' },
  { value: 'incomplete', label: 'Incomplete Work' },
  { value: 'not_as_specified', label: 'Not As Specified' },
  { value: 'technical_issues', label: 'Technical Issues' },
  { value: 'deadline_missed', label: 'Deadline Missed' },
  { value: 'other', label: 'Other' },
];

export const OpenDisputeModal: React.FC<OpenDisputeModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  milestone,
  loading = false,
}) => {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [requestedResolution, setRequestedResolution] = useState('');
  const [evidenceFiles, setEvidenceFiles] = useState<string[]>([]);
  const [evidenceUrl, setEvidenceUrl] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason || !description) {
      return;
    }

    try {
      await onSubmit({
        reason,
        description,
        evidence: evidenceFiles.length > 0 ? evidenceFiles : undefined,
        requestedResolution: requestedResolution || undefined,
      });

      // Reset form
      setReason('');
      setDescription('');
      setRequestedResolution('');
      setEvidenceFiles([]);
      setEvidenceUrl('');
    } catch (error) {
      console.error('Error submitting dispute:', error);
    }
  };

  const handleAddEvidence = () => {
    if (evidenceUrl.trim()) {
      setEvidenceFiles([...evidenceFiles, evidenceUrl.trim()]);
      setEvidenceUrl('');
    }
  };

  const handleRemoveEvidence = (index: number) => {
    setEvidenceFiles(evidenceFiles.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Open Dispute</h2>
                <p className="text-sm text-gray-600">{milestone.title}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Warning Notice */}
            <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
              <div className="flex gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-900">
                  <p className="font-semibold mb-1">Important Notice</p>
                  <p>
                    Opening a dispute will pause the milestone and initiate a formal resolution process.
                    Both parties will have 7 days to negotiate before platform mediation.
                  </p>
                </div>
              </div>
            </div>

            {/* Reason Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Dispute Reason *
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="">Select a reason...</option>
                {DISPUTE_REASONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Detailed Description *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={5}
                placeholder="Explain the issue in detail. Be specific and provide all relevant information..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              />
              <p className="mt-2 text-xs text-gray-500">
                Minimum 50 characters. Be clear and professional.
              </p>
            </div>

            {/* Evidence Files */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Supporting Evidence (Optional)
              </label>
              <div className="space-y-3">
                {/* Add Evidence Input */}
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={evidenceUrl}
                    onChange={(e) => setEvidenceUrl(e.target.value)}
                    placeholder="Enter URL to screenshot, document, or file..."
                    className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleAddEvidence}
                    disabled={!evidenceUrl.trim()}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Add
                  </button>
                </div>

                {/* Evidence List */}
                {evidenceFiles.length > 0 && (
                  <div className="space-y-2">
                    {evidenceFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <FileText className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        <span className="flex-1 text-sm text-gray-700 truncate">{file}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveEvidence(index)}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Add links to screenshots, documents, or any evidence supporting your case.
              </p>
            </div>

            {/* Requested Resolution */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Requested Resolution (Optional)
              </label>
              <textarea
                value={requestedResolution}
                onChange={(e) => setRequestedResolution(e.target.value)}
                rows={3}
                placeholder="What outcome are you seeking? (e.g., full refund, partial payment, rework with extended deadline)"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !reason || !description || description.length < 50}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Opening Dispute...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-5 h-5" />
                    Open Dispute
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OpenDisputeModal;
