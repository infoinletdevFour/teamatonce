import React from 'react';
import { motion } from 'framer-motion';
import { Construction, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * PlaceholderPage Component
 * Generic placeholder for pages under development
 */

interface PlaceholderPageProps {
  title: string;
  description?: string;
  icon?: React.ElementType;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({
  title,
  description = 'This page is currently under development. Check back soon!',
  icon: Icon = Construction,
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <div className="mb-6">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl">
            <Icon className="w-12 h-12 text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
          {title}
        </h1>
        <p className="text-gray-600 mb-8 text-lg">{description}</p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(-1)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-2xl font-bold flex items-center space-x-2 mx-auto shadow-xl"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Go Back</span>
        </motion.button>
      </motion.div>
    </div>
  );
};

export default PlaceholderPage;
