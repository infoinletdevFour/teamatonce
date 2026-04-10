import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Category } from '@/services/publicService';
import { LucideIcon } from 'lucide-react';

interface CategoryCardProps {
  category: Category & { color?: string; count?: number; icon?: LucideIcon };
  index?: number;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category, index = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -5, scale: 1.01 }}
      className="h-full"
    >
      <Link
        to={`/browse-talent/${category.slug}`}
        className="group relative bg-white rounded-xl shadow-md overflow-hidden cursor-pointer border border-gray-200 hover:border-blue-300 hover:shadow-xl transition-all block h-full flex flex-col"
      >
        {/* Gradient Background */}
        <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-5 group-hover:opacity-10 transition-opacity`}></div>

        {/* Content */}
        <div className="relative p-4 flex flex-col flex-1">
          {/* Icon with background */}
          <div className="relative w-10 h-10 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-10 rounded-lg`}></div>
            <category.icon className="w-5 h-5 text-blue-600 relative z-10" />
          </div>

          {/* Title */}
          <h3 className="text-base font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">
            {category.name}
          </h3>

          {/* Count */}
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
            <p className="text-xs font-medium text-gray-500">
              {category.count} available
            </p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default CategoryCard;
