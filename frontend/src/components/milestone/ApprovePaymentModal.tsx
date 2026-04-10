/**
 * ApprovePaymentModal Component
 *
 * Client-side modal for approving milestones and releasing payments
 * Displays milestone details, deliverables, acceptance criteria, and payment confirmation
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, X, AlertTriangle, DollarSign, FileCheck, Target } from 'lucide-react';
import type { Milestone } from '@/types/milestone';

interface ApprovePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApprove: (notes?: string) => void | Promise<void>;
  milestone: Milestone;
  loading?: boolean;
}

export const ApprovePaymentModal: React.FC<ApprovePaymentModalProps> = ({
  isOpen,
  onClose,
  onApprove,
  milestone,
  loading = false,
}) => {
  const [notes, setNotes] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleApprove = async () => {
    if (showConfirmation) {
      setIsSubmitting(true);
      try {
        await onApprove(notes.trim() || undefined);
        // Modal will be closed by parent after successful approval
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setShowConfirmation(true);
    }
  };

  const handleClose = () => {
    if (!isSubmitting && !loading) {
      setNotes('');
      setShowConfirmation(false);
      onClose();
    }
  };

  const formatAmount = (amount: number | null) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Approve Milestone</h2>
                      <p className="text-green-100 text-sm">Review and release payment</p>
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    disabled={isSubmitting || loading}
                    className="text-white/80 hover:text-white transition-colors disabled:opacity-50"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex flex-col lg:flex-row max-h-[calc(90vh-200px)]">
                {/* Left Column - Details */}
                <div className="flex-1 p-6 overflow-y-auto">
                  {/* Milestone Overview */}
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{milestone.title}</h3>
                    {milestone.description && (
                      <p className="text-gray-600 text-sm">{milestone.description}</p>
                    )}
                  </div>

                  {/* Deliverables */}
                  <div className="mb-6">
                    <div className="flex items-center space-x-2 mb-3">
                      <FileCheck className="w-5 h-5 text-green-600" />
                      <h4 className="font-semibold text-gray-900">Deliverables</h4>
                    </div>
                    <div className="space-y-2">
                      {milestone.deliverables && milestone.deliverables.length > 0 ? (
                        milestone.deliverables.map((deliverable, idx) => {
                          const displayName = typeof deliverable === 'string'
                            ? deliverable
                            : (deliverable.title || deliverable.fileName || 'Deliverable');
                          return (
                            <div key={idx} className="flex items-start space-x-2 p-3 bg-green-50 rounded-lg">
                              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-gray-700">{displayName}</span>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-sm text-gray-500 italic">No deliverables specified</p>
                      )}
                    </div>
                  </div>

                  {/* Acceptance Criteria */}
                  <div className="mb-6">
                    <div className="flex items-center space-x-2 mb-3">
                      <Target className="w-5 h-5 text-blue-600" />
                      <h4 className="font-semibold text-gray-900">Acceptance Criteria</h4>
                    </div>
                    <div className="space-y-2">
                      {milestone.acceptanceCriteria && milestone.acceptanceCriteria.length > 0 ? (
                        milestone.acceptanceCriteria.map((criteria, idx) => (
                          <div key={idx} className="flex items-start space-x-2 p-3 bg-blue-50 rounded-lg">
                            <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-700">{criteria}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 italic">No acceptance criteria specified</p>
                      )}
                    </div>
                  </div>

                  {/* Approval Notes (Optional) */}
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Approval Notes (Optional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add any comments about the approval..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                      rows={4}
                      disabled={isSubmitting || loading}
                    />
                  </div>
                </div>

                {/* Right Column - Payment Summary (Sticky) */}
                <div className="lg:w-80 bg-gradient-to-br from-green-50 to-emerald-50 p-6 lg:overflow-y-auto">
                  <div className="sticky top-0 space-y-6">
                    {/* Payment Amount */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-green-200">
                      <div className="flex items-center justify-center mb-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center">
                          <DollarSign className="w-8 h-8 text-white" />
                        </div>
                      </div>
                      <div className="text-center mb-4">
                        <p className="text-sm text-gray-600 mb-1">Payment Amount</p>
                        <p className="text-4xl font-black text-gray-900">
                          {formatAmount(milestone.amount)}
                        </p>
                      </div>
                      {milestone.paymentStatus && (
                        <div className="flex items-center justify-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            milestone.paymentStatus === 'paid'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {milestone.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Warning */}
                    <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
                      <div className="flex items-start space-x-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-amber-900 mb-1">
                            Payment Release
                          </p>
                          <p className="text-xs text-amber-700">
                            Approving this milestone will immediately release the payment to the developer. This action cannot be undone.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Milestone Info */}
                    <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Status</span>
                        <span className="font-semibold text-gray-900 capitalize">
                          {milestone.status.replace('_', ' ')}
                        </span>
                      </div>
                      {milestone.submittedAt && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Submitted</span>
                          <span className="font-semibold text-gray-900">
                            {new Date(milestone.submittedAt).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {milestone.submissionCount !== undefined && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Revisions</span>
                          <span className="font-semibold text-gray-900">
                            {milestone.submissionCount}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Confirmation Warning */}
                    {showConfirmation && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-50 border-2 border-red-200 rounded-xl p-4"
                      >
                        <div className="flex items-start space-x-3">
                          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-red-900 mb-1">
                              Final Confirmation
                            </p>
                            <p className="text-xs text-red-700">
                              Are you sure you want to release {formatAmount(milestone.amount)}? Click the button below to confirm.
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
                <div className="flex items-center justify-end space-x-3">
                  <button
                    onClick={handleClose}
                    disabled={isSubmitting || loading}
                    className="px-6 py-2.5 text-gray-700 font-semibold hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApprove}
                    disabled={isSubmitting || loading}
                    className={`px-8 py-2.5 font-bold rounded-lg transition-all disabled:opacity-50 ${
                      showConfirmation
                        ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white'
                        : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white'
                    }`}
                  >
                    {isSubmitting || loading ? (
                      <span className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Processing...</span>
                      </span>
                    ) : showConfirmation ? (
                      'Confirm & Release Payment'
                    ) : (
                      'Approve & Release Payment'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ApprovePaymentModal;
