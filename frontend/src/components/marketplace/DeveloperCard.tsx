import React from 'react';
import { motion } from 'framer-motion';
import { Star, MapPin, BadgeCheck, Briefcase, Clock, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PublicDeveloper } from '@/services/publicService';

interface DeveloperCardProps {
  developer: PublicDeveloper;
  index?: number;
  onContact?: (developer: PublicDeveloper) => void;
}

const DeveloperCard: React.FC<DeveloperCardProps> = ({ developer, index = 0, onContact }) => {
  const handleContactClick = (e: React.MouseEvent) => {
    if (onContact) {
      e.preventDefault();
      onContact(developer);
    }
  };

  // Use avatar or generate from name if not provided
  const avatarUrl = developer.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(developer.name)}&background=3b82f6&color=fff&size=256&bold=true`;

  // Use cover image or gradient fallback
  const coverImageUrl = developer.coverImage || null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -8, boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' }}
      className="h-full"
    >
      <Link
        to={`/developer/${developer.id}`}
        className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all cursor-pointer border border-gray-200 hover:border-blue-400 block h-full flex flex-col"
      >
        {/* Cover Image or Gradient */}
        {coverImageUrl ? (
          <div className="relative h-32 overflow-hidden">
            <img
              src={coverImageUrl}
              alt="Cover"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {/* Light overlay only at bottom to preserve cover image color */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            {/* Status Badge on Cover */}
            <div className="absolute top-3 right-3">
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md ${
                developer.availability === 'available'
                  ? 'bg-green-500/90 text-white'
                  : developer.availability === 'busy'
                  ? 'bg-yellow-500/90 text-white'
                  : 'bg-gray-500/90 text-white'
              }`}>
                {developer.availability === 'available' ? 'Available' : developer.availability === 'busy' ? 'Busy' : 'Away'}
              </span>
            </div>
          </div>
        ) : (
          <div className="relative h-32 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600">
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            {/* Status Badge on Gradient */}
            <div className="absolute top-3 right-3">
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md ${
                developer.availability === 'available'
                  ? 'bg-green-500/90 text-white'
                  : developer.availability === 'busy'
                  ? 'bg-yellow-500/90 text-white'
                  : 'bg-gray-500/90 text-white'
              }`}>
                {developer.availability === 'available' ? 'Available' : developer.availability === 'busy' ? 'Busy' : 'Away'}
              </span>
            </div>
          </div>
        )}

        {/* Avatar - Overlapping Cover */}
        <div className="relative px-5 -mt-10 mb-2">
          <img
            src={avatarUrl}
            alt={developer.name}
            className="w-20 h-20 rounded-full object-cover ring-4 ring-white shadow-xl group-hover:ring-blue-100 transition-all"
            onError={(e) => {
              e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(developer.name)}&background=3b82f6&color=fff&size=256&bold=true`;
            }}
          />
        </div>

        <div className="px-5 pb-5 flex flex-col flex-1">
          {/* Name, Title, and Badges */}
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-700 transition-colors line-clamp-1">
                {developer.name}
              </h3>
              {developer.verified && (
                <BadgeCheck className="w-5 h-5 text-blue-500 flex-shrink-0" title="Verified Professional" />
              )}
              {developer.topRated && (
                <div className="bg-yellow-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-yellow-600 fill-yellow-600" />
                  <span className="text-xs font-bold text-yellow-700">Top</span>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-700 font-medium mb-1 line-clamp-1">{developer.title}</p>
            {developer.tagline && (
              <p className="text-xs text-gray-500 italic line-clamp-2 leading-relaxed">"{developer.tagline}"</p>
            )}
          </div>

          {/* Rating and Stats Row */}
          <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-100">
            {/* Rating */}
            {developer.reviewsCount > 0 ? (
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-bold text-sm text-gray-900">{developer.rating}</span>
                <span className="text-xs text-gray-500">({developer.reviewsCount})</span>
              </div>
            ) : (
              <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-xs font-semibold">
                New Seller
              </span>
            )}

            {/* Completed Projects */}
            {developer.completedProjects > 0 && (
              <div className="flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-xs font-medium text-gray-700">{developer.completedProjects} projects</span>
              </div>
            )}
          </div>

          {/* Additional Stats */}
          {(developer.successRate !== undefined || developer.responseTime) && (
            <div className="flex items-center gap-3 mb-3 text-xs">
              {developer.successRate !== undefined && developer.successRate > 0 && (
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-green-600" />
                  <span className="text-gray-700 font-medium">{developer.successRate}% success</span>
                </div>
              )}
              {developer.responseTime && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span className="text-gray-700">{developer.responseTime}</span>
                </div>
              )}
            </div>
          )}

          {/* Location */}
          <div className="flex items-center text-xs text-gray-600 mb-3">
            <MapPin className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
            <span className="line-clamp-1">{developer.location}</span>
          </div>

          {/* Skills */}
          <div className="flex flex-wrap gap-1.5 mb-4 flex-1 items-start">
            {developer.skills.slice(0, 4).map((skill, idx) => {
              const skillName = typeof skill === 'string' ? skill : skill.name;
              return (
                <span
                  key={skillName || idx}
                  className="bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 px-2.5 py-1 rounded-md text-xs font-semibold border border-blue-200"
                >
                  {skillName}
                </span>
              );
            })}
            {developer.skills.length > 4 && (
              <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md text-xs font-semibold">
                +{developer.skills.length - 4}
              </span>
            )}
          </div>

          {/* Price and Contact */}
          <div className="border-t border-gray-200 pt-4 flex items-center justify-between mt-auto">
            <div>
              <div className="text-xs text-gray-500 mb-0.5">Starting at</div>
              <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                ${developer.hourlyRate}<span className="text-sm text-gray-600">/hr</span>
              </div>
            </div>
            <button
              onClick={handleContactClick}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:shadow-xl hover:scale-105 transition-all"
            >
              Contact
            </button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default DeveloperCard;
