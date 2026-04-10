import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, XCircle, Loader2, RefreshCw } from 'lucide-react';
import type { UseJobProgressReturn } from '@/hooks/useJobProgress';

interface JobProgressModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  job: UseJobProgressReturn;
  onRetry?: () => void;
  onSuccess?: () => void;
}

const JobProgressModal: React.FC<JobProgressModalProps> = ({
  open,
  onClose,
  title,
  job,
  onRetry,
  onSuccess,
}) => {
  const { progress, status, result, error } = job;
  const percent = progress?.percent ?? 0;
  const processed = progress?.processed ?? 0;
  const total = progress?.total ?? 0;

  const handleClose = () => {
    if (status === 'completed' && onSuccess) {
      onSuccess();
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={status !== 'running' ? handleClose : undefined}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>

            {/* Running state */}
            {status === 'running' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                  <span>Processing... {processed}/{total}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                  />
                </div>
                <div className="text-right text-xs text-gray-400 font-mono">{percent}%</div>
              </div>
            )}

            {/* Completed state */}
            {status === 'completed' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-medium">Completed</span>
                </div>
                {result?.data && (
                  <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 space-y-1">
                    {result.data.processed !== undefined && (
                      <div>Processed: <span className="font-medium">{result.data.processed}</span></div>
                    )}
                    {result.data.scored !== undefined && (
                      <div>Scored: <span className="font-medium">{result.data.scored}</span></div>
                    )}
                    {result.data.newEntities !== undefined && (
                      <div>New entities: <span className="font-medium">{result.data.newEntities}</span></div>
                    )}
                    {result.data.linkedToExisting !== undefined && (
                      <div>Linked to existing: <span className="font-medium">{result.data.linkedToExisting}</span></div>
                    )}
                    {result.data.newCompanies !== undefined && (
                      <div>New companies: <span className="font-medium">{result.data.newCompanies}</span></div>
                    )}
                    {result.data.skipped !== undefined && (
                      <div>Skipped: <span className="font-medium">{result.data.skipped}</span></div>
                    )}
                    {result.data.errors !== undefined && result.data.errors > 0 && (
                      <div className="text-amber-600">Errors: <span className="font-medium">{result.data.errors}</span></div>
                    )}
                  </div>
                )}
                <button
                  onClick={handleClose}
                  className="w-full px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Done
                </button>
              </div>
            )}

            {/* Failed state */}
            {status === 'failed' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-red-600">
                  <XCircle className="w-5 h-5" />
                  <span className="font-medium">Failed</span>
                </div>
                <div className="bg-red-50 rounded-lg p-3 text-sm text-red-700">
                  {error || 'Unknown error'}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleClose}
                    className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-50"
                  >
                    Close
                  </button>
                  {onRetry && (
                    <button
                      onClick={onRetry}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Retry
                    </button>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default JobProgressModal;
