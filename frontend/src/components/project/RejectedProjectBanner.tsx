import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface RejectedProjectBannerProps {
  reason?: string;
  onDismiss?: () => void;
  className?: string;
}

/**
 * Banner component to show when a project has been rejected by admin
 * Displays a warning message and optionally the rejection reason
 */
export const RejectedProjectBanner: React.FC<RejectedProjectBannerProps> = ({
  reason,
  onDismiss,
  className = '',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg ${className}`}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-red-500" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-semibold text-red-800">
            Project Rejected
          </h3>
          <div className="mt-1 text-sm text-red-700">
            <p>
              This project has been rejected by an administrator and is no longer available for modifications.
              All actions such as creating milestones, sending messages, scheduling events, and processing payments are disabled.
            </p>
            {reason && (
              <p className="mt-2 font-medium">
                <span className="font-semibold">Reason:</span> {reason}
              </p>
            )}
          </div>
        </div>
        {onDismiss && (
          <div className="flex-shrink-0 ml-4">
            <button
              onClick={onDismiss}
              className="inline-flex text-red-400 hover:text-red-600 focus:outline-none"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default RejectedProjectBanner;
