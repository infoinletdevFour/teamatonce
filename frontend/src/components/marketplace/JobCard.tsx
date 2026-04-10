import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Briefcase, Clock, DollarSign, Building2, CheckCircle, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PublicJob } from '@/services/publicService';
import DOMPurify from 'dompurify';

interface JobCardProps {
  job: PublicJob & { featured?: boolean; experience?: string; postedDate?: string };
  index?: number;
  onApply?: (job: PublicJob) => void;
  hasApplied?: boolean;
}

const JobCard: React.FC<JobCardProps> = ({ job, onApply, hasApplied = false }) => {
  const handleApplyClick = (e: React.MouseEvent) => {
    if (hasApplied) {
      // Don't apply if already applied, let the link navigate to detail page
      return;
    }
    if (onApply) {
      e.preventDefault();
      onApply(job);
    }
  };

  // Format salary - handle both string and object formats
  const formatSalary = (): string => {
    if (!job.salary) return 'Competitive';
    if (typeof job.salary === 'string') return job.salary;
    // Handle object format: { min, max, currency, period }
    const { min, max, currency, period } = job.salary as { min: number; max: number; currency: string; period: string };
    const currencySymbol = currency === 'USD' ? '$' : currency;

    // Handle project budget display
    if (period === 'project') {
      if (min && max && min !== max) {
        return `${currencySymbol}${min.toLocaleString()} - ${currencySymbol}${max.toLocaleString()}`;
      } else if (min || max) {
        return `${currencySymbol}${(min || max).toLocaleString()}`;
      }
    }

    // Handle hourly/monthly/yearly rates
    if (min && max && min !== max) {
      return `${currencySymbol}${min.toLocaleString()} - ${currencySymbol}${max.toLocaleString()} ${period}`;
    } else if (min || max) {
      return `${currencySymbol}${(min || max).toLocaleString()} ${period}`;
    }

    return 'Competitive';
  };

  return (
    <div className="h-full">
      <motion.div
        whileHover={{ y: -5 }}
        transition={{ duration: 0.2 }}
        className="h-full"
      >
      <Link
        to={`/job/${job.id}`}
        className="group bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all cursor-pointer border border-gray-200 hover:border-sky-300 block h-full flex flex-col"
      >
        <div className="p-5 flex flex-col flex-1">
          {/* Header with Title and Featured Badge */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-gray-800 mb-1 group-hover:text-sky-700 transition-colors line-clamp-1">
                {job.title}
              </h3>
              <div className="flex items-center text-xs text-gray-600">
                <Building2 className="w-3.5 h-3.5 mr-1 text-gray-400" />
                <span className="truncate">{job.company}</span>
              </div>
            </div>
            {job.featured && (
              <span className="px-2.5 py-1 bg-gradient-to-r from-sky-700 to-sky-600 text-white rounded-full text-xs font-semibold flex-shrink-0 shadow-sm ml-2">
                Featured
              </span>
            )}
          </div>

          {/* Description */}
          <div
            className="text-xs text-gray-600 mb-4 line-clamp-2 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(job.description || '') }}
          />

          {/* Job Details */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center text-xs text-gray-600">
              <MapPin className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
              {job.remote ? (
                <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs font-medium">
                  Remote
                </span>
              ) : (
                <span>{job.location || 'Location not specified'}</span>
              )}
            </div>
            <div className="flex items-center text-xs text-gray-600">
              <Briefcase className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
              <span>{job.type || 'Contract'}</span>
            </div>
            <div className="flex items-center text-xs text-gray-600">
              <DollarSign className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
              <span className="font-medium text-gray-800">{formatSalary()}</span>
            </div>
          </div>

          {/* Skills */}
          <div className="flex flex-wrap gap-2 mb-4 flex-1">
            {job.skills.slice(0, 3).map((skill) => (
              <span key={skill} className="bg-sky-50 text-sky-700 px-3 py-1.5 rounded-md text-xs font-semibold">
                {skill}
              </span>
            ))}
            {job.skills.length > 3 && (
              <span className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-md text-xs font-semibold">
                +{job.skills.length - 3}
              </span>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 pt-3 flex items-center justify-between gap-2 mt-auto">
            <div className="flex items-center text-xs text-gray-500">
              <Clock className="w-3.5 h-3.5 mr-1" />
              <span>{job.postedDate || (job.postedAt ? new Date(job.postedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Recently')}</span>
            </div>
            {hasApplied ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-2 bg-green-50 text-green-700 rounded-lg text-xs font-semibold border border-green-200">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Applied</span>
                </div>
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1.5 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-xs font-semibold hover:bg-gray-200 transition-all flex-shrink-0"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View</span>
                </button>
              </div>
            ) : (
              <button
                onClick={handleApplyClick}
                className="bg-gradient-to-r from-sky-700 to-sky-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:from-sky-800 hover:to-sky-700 transition-all shadow-md flex-shrink-0"
              >
                Apply Now
              </button>
            )}
          </div>
        </div>
      </Link>
      </motion.div>
    </div>
  );
};

export default JobCard;
