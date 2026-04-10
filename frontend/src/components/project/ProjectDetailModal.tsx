/**
 * Project Detail Modal
 * Shows complete project information for developers to review before bidding
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  DollarSign,
  Calendar,
  Clock,
  Code,
  Layers,
  CheckCircle,
  FileText,
  Target,
} from 'lucide-react';
import type { BrowseableProject } from '@/types/proposal';
import { proposalService } from '@/services/proposalService';

interface ProjectDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: BrowseableProject;
  onSubmitBid: (project: BrowseableProject) => void;
}

const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  isOpen,
  onClose,
  project,
  onSubmitBid,
}) => {
  const [loading, setLoading] = useState(false);
  const [milestones, setMilestones] = useState<any[]>([]);

  const loadProjectDetails = useCallback(async () => {
    try {
      setLoading(true);
      const details = await proposalService.getProjectForBidding(project.id);
      setMilestones(details.milestones || []);
    } catch (error) {
      console.error('Error loading project details:', error);
    } finally {
      setLoading(false);
    }
  }, [project.id]);

  useEffect(() => {
    if (isOpen && project) {
      loadProjectDetails();
    }
  }, [isOpen, project, loadProjectDetails]);

  const handleSubmitBid = () => {
    onSubmitBid(project);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-sky-50 to-sky-100">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-3xl font-black text-gray-900 mb-2">
                    {project.name}
                  </h2>

                  {/* Quick Stats */}
                  <div className="flex flex-wrap gap-4 mt-4">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-5 h-5 text-green-600" />
                      <div>
                        <div className="text-sm text-gray-500">Budget</div>
                        <div className="font-bold text-gray-900">
                          ${project.estimatedCost?.toLocaleString()} {project.currency}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-5 h-5 text-sky-600" />
                      <div>
                        <div className="text-sm text-gray-500">Duration</div>
                        <div className="font-bold text-gray-900">
                          {project.estimatedDurationDays} days
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FileText className="w-5 h-5 text-purple-600" />
                      <div>
                        <div className="text-sm text-gray-500">Proposals</div>
                        <div className="font-bold text-gray-900">
                          {project.proposalsCount} submitted
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white rounded-xl transition-colors"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Description */}
                  <section>
                    <div className="flex items-center space-x-2 mb-3">
                      <FileText className="w-5 h-5 text-gray-600" />
                      <h3 className="text-xl font-bold text-gray-900">Description</h3>
                    </div>
                    <div
                      className="prose prose-sm max-w-none text-gray-700"
                      dangerouslySetInnerHTML={{ __html: project.description }}
                    />
                  </section>

                  {/* Tech Stack */}
                  <section>
                    <div className="flex items-center space-x-2 mb-3">
                      <Code className="w-5 h-5 text-sky-600" />
                      <h3 className="text-xl font-bold text-gray-900">Tech Stack</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {project.techStack?.map((tech, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1.5 bg-sky-100 text-sky-700 rounded-lg text-sm font-semibold border border-sky-200"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </section>

                  {/* Frameworks */}
                  {project.frameworks && project.frameworks.length > 0 && (
                    <section>
                      <div className="flex items-center space-x-2 mb-3">
                        <Layers className="w-5 h-5 text-purple-600" />
                        <h3 className="text-xl font-bold text-gray-900">Frameworks</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {project.frameworks.map((framework, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-sm font-semibold"
                          >
                            {framework}
                          </span>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Features */}
                  {project.features && project.features.length > 0 && (
                    <section>
                      <div className="flex items-center space-x-2 mb-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <h3 className="text-xl font-bold text-gray-900">Required Features</h3>
                      </div>
                      <div className="grid gap-2">
                        {project.features.map((feature, idx) => (
                          <div key={idx} className="flex items-start space-x-2">
                            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Requirements */}
                  {project.requirements && Object.keys(project.requirements).length > 0 && (
                    <section>
                      <div className="flex items-center space-x-2 mb-3">
                        <Target className="w-5 h-5 text-orange-600" />
                        <h3 className="text-xl font-bold text-gray-900">Requirements</h3>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                        {Object.entries(project.requirements).map(([key, value]) => {
                          // Format the key
                          const formattedKey = key
                            .replace(/([A-Z])/g, ' $1') // Add space before capital letters
                            .replace(/_/g, ' ') // Replace underscores with spaces
                            .replace(/^./, str => str.toUpperCase()); // Capitalize first letter

                          // Format the value based on type
                          const renderValue = () => {
                            // Handle arrays (Skills, Deliverables)
                            if (Array.isArray(value)) {
                              return (
                                <div className="flex flex-wrap gap-2">
                                  {value.map((item: any, idx: number) => (
                                    <span
                                      key={idx}
                                      className="px-2.5 py-1 bg-sky-100 text-sky-700 rounded-lg text-sm font-semibold border border-sky-200"
                                    >
                                      {typeof item === 'object' ? item.name || JSON.stringify(item) : String(item)}
                                    </span>
                                  ))}
                                </div>
                              );
                            }

                            // Handle budget range object
                            if (typeof value === 'object' && value !== null && ('min' in value || 'max' in value)) {
                              const budgetRange = value as { min?: number; max?: number };
                              return (
                                <span className="text-gray-900 font-bold">
                                  ${budgetRange.min?.toLocaleString() || '0'} - ${budgetRange.max?.toLocaleString() || '0'}
                                </span>
                              );
                            }

                            // Handle duration (format like "1-3-months" -> "1-3 months")
                            if (key.toLowerCase().includes('duration') && typeof value === 'string') {
                              return (
                                <span className="text-gray-900 font-semibold">
                                  {value.replace(/-/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2')}
                                </span>
                              );
                            }

                            // Handle category/subcategory IDs (format like "web-development" -> "Web Development")
                            if ((key.toLowerCase().includes('category') || key.toLowerCase().includes('subcategory')) && typeof value === 'string') {
                              return (
                                <span className="text-gray-900 font-semibold capitalize">
                                  {value.replace(/-/g, ' ').replace(/_/g, ' ')}
                                </span>
                              );
                            }

                            // Handle experience level
                            if (key.toLowerCase().includes('experience') && typeof value === 'string') {
                              return (
                                <span className="text-gray-900 font-semibold capitalize">
                                  {value}
                                </span>
                              );
                            }

                            // Handle other objects
                            if (typeof value === 'object' && value !== null) {
                              return (
                                <span className="text-gray-900 font-mono text-xs">
                                  {JSON.stringify(value, null, 2)}
                                </span>
                              );
                            }

                            // Handle strings and other primitives
                            return (
                              <span className="text-gray-900 font-semibold">
                                {String(value)}
                              </span>
                            );
                          };

                          return (
                            <div key={key} className="flex flex-col space-y-1">
                              <span className="text-gray-600 font-medium text-sm">
                                {formattedKey}:
                              </span>
                              {renderValue()}
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  )}

                  {/* Milestones */}
                  {milestones && milestones.length > 0 && (
                    <section>
                      <div className="flex items-center space-x-2 mb-3">
                        <Calendar className="w-5 h-5 text-indigo-600" />
                        <h3 className="text-xl font-bold text-gray-900">Project Milestones</h3>
                      </div>
                      <div className="space-y-3">
                        {milestones.map((milestone, idx) => (
                          <div
                            key={milestone.id}
                            className="bg-white border-2 border-gray-200 rounded-xl p-4"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <div className="font-bold text-gray-900">
                                  {idx + 1}. {milestone.name || milestone.title}
                                </div>
                                {milestone.description && (
                                  <p className="text-sm text-gray-600 mt-1">
                                    {milestone.description}
                                  </p>
                                )}
                              </div>
                              {milestone.milestoneAmount && (
                                <div className="text-right">
                                  <div className="text-sm text-gray-500">Amount</div>
                                  <div className="font-bold text-green-600">
                                    ${milestone.milestoneAmount?.toLocaleString()}
                                  </div>
                                </div>
                              )}
                            </div>
                            {milestone.deliverables && milestone.deliverables.length > 0 && (
                              <div className="mt-3 space-y-1">
                                <div className="text-sm font-semibold text-gray-700">Deliverables:</div>
                                {milestone.deliverables.map((deliverable: any, dIdx: number) => {
                                  const displayName = typeof deliverable === 'string'
                                    ? deliverable
                                    : (deliverable.title || deliverable.fileName || 'Deliverable');
                                  return (
                                    <div key={dIdx} className="text-sm text-gray-600 flex items-start space-x-2">
                                      <span>•</span>
                                      <span>{displayName}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Timeline */}
                  <section>
                    <div className="flex items-center space-x-2 mb-3">
                      <Calendar className="w-5 h-5 text-red-600" />
                      <h3 className="text-xl font-bold text-gray-900">Timeline</h3>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="grid grid-cols-2 gap-4">
                        {project.startDate && (
                          <div>
                            <div className="text-sm text-gray-500">Expected Start</div>
                            <div className="font-semibold text-gray-900">
                              {new Date(project.startDate).toLocaleDateString()}
                            </div>
                          </div>
                        )}
                        {project.expectedCompletionDate && (
                          <div>
                            <div className="text-sm text-gray-500">Expected Completion</div>
                            <div className="font-semibold text-gray-900">
                              {new Date(project.expectedCompletionDate).toLocaleDateString()}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </section>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {project.hasProposal ? (
                    <div className="flex items-center space-x-2 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-semibold">You've already submitted a proposal</span>
                    </div>
                  ) : (
                    <span>Ready to submit your proposal for this project?</span>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                  {!project.hasProposal && (
                    <button
                      onClick={handleSubmitBid}
                      className="px-6 py-3 bg-gradient-to-r from-sky-800 via-sky-700 to-sky-600 text-white rounded-xl font-bold shadow-lg hover:from-sky-900 hover:via-sky-800 hover:to-sky-700 transition-all"
                    >
                      Submit Proposal
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProjectDetailModal;
