import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Loader2 } from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';

interface AccessDeniedProps {
  message?: string;
}

/**
 * Access Denied Component
 * Displays when a user doesn't have permission to access a project page
 */
export const AccessDenied: React.FC<AccessDeniedProps> = ({
  message = "You don't have permission to access this page. Please contact the project owner or team lead to request access.",
}) => {
  const navigate = useNavigate();
  const { companyId } = useCompany();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl p-8 shadow-xl border-2 border-gray-200 max-w-md text-center"
      >
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600 mb-6">{message}</p>
        <button
          onClick={() => navigate(companyId ? `/company/${companyId}/projects` : '/projects')}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center space-x-2 mx-auto"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Projects</span>
        </button>
      </motion.div>
    </div>
  );
};

/**
 * Access Loading Component
 * Displays while verifying user access to a project
 */
export const AccessLoading: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
        <p className="text-gray-600 font-semibold">Verifying access...</p>
      </div>
    </div>
  );
};

export default AccessDenied;
