import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Briefcase,
  Clock,
  Users,
  DollarSign,
  Building2,
  ArrowLeft,
  Heart,
  Share2,
  CheckCircle2,
  AlertCircle,
  Calendar,
  TrendingUp,
  Check,
  Loader2,
} from 'lucide-react';
import UnifiedHeader from '../../components/layout/UnifiedHeader';
import Footer from '../../components/layout/Footer';
import publicService, { PublicJobDetail } from '@/services/publicService';
import { toast, Toaster } from 'sonner';
import DOMPurify from 'dompurify';
import { useAuth } from '@/contexts/AuthContext';
import { useCompanyStore } from '@/stores/companyStore';
import BidSubmissionModal from '@/components/project/BidSubmissionModal';
import { proposalService } from '@/services/proposalService';
import { setCompanyId } from '@/lib/api-client';
import type { BrowseableProject, CreateProposalData } from '@/types/proposal';

const JobDetailPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentCompany, companies, fetchUserCompanies } = useCompanyStore();
  const [job, setJob] = useState<PublicJobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [hasAppliedLocally, setHasAppliedLocally] = useState(false);

  // Check if user is a client (clients shouldn't see apply buttons)
  const isClient = user?.role === 'client';

  // Handle apply button click - check authentication first
  const handleApplyClick = () => {
    if (!user) {
      // Not logged in - redirect to login and save the return URL
      toast.info('Please login to apply for this job');
      navigate('/auth/login', { state: { from: `/job/${jobId}` } });
      return;
    }
    // User is logged in - show application modal
    setShowApplicationModal(true);
  };

  // Handle application submission
  const handleSubmitApplication = async (applicationData: CreateProposalData) => {
    if (!jobId) {
      toast.error('Unable to submit application. Please try again.');
      return;
    }

    // Get company - fetch if not loaded
    let companyId = currentCompany?.id;

    if (!companyId && companies.length === 0) {
      // Try to fetch companies if not loaded
      try {
        await fetchUserCompanies();
        companyId = currentCompany?.id;
      } catch (error) {
        toast.error('Unable to load your company information. Please try again.');
        return;
      }
    }

    if (!companyId) {
      toast.error('You need to create a company profile before applying. Please complete onboarding first.');
      navigate('/onboarding');
      return;
    }

    try {
      // Set company ID for API calls
      setCompanyId(companyId);

      // Submit proposal/application to backend
      await proposalService.createProposal({
        ...applicationData,
        projectId: jobId, // Use job ID as project ID for applications
      });

      setShowApplicationModal(false);
      toast.success('Application submitted successfully!');

      // Update local state immediately
      setHasAppliedLocally(true);

      // Reload job to get updated hasApplied status from backend
      const updatedJob = await publicService.getJobById(jobId);
      if (updatedJob) {
        setJob(updatedJob);
      }
    } catch (error: any) {
      console.error('Failed to submit application:', error);
      toast.error(error.message || 'Failed to submit application');
      throw error;
    }
  };

  // Whether user has already applied (from backend or client-side check)
  const hasApplied = job?.hasApplied || hasAppliedLocally;

  // Convert job to project format for the modal
  const jobAsProject: BrowseableProject | null = job ? {
    id: job.id,
    title: job.title,
    description: job.description,
    companyName: job.company,
    category: 'job-application',
    skills: job.skills || [],
    estimatedCost: job.salary?.min || 0,
    estimatedDurationDays: 30,
    status: 'open',
    postedAt: job.postedAt,
    hasProposal: hasApplied,
  } as BrowseableProject : null;

  // Check if user has already applied (client-side fallback)
  const checkIfApplied = async () => {
    if (!jobId || !user) return;

    const companyId = currentCompany?.id;
    if (!companyId) return;

    try {
      // Fetch user's proposals for their company
      setCompanyId(companyId);
      const proposals = await proposalService.getCompanyProposals(companyId);

      // Check if any proposal is for this job
      const hasApplied = proposals.some(p => p.projectId === jobId);
      setHasAppliedLocally(hasApplied);
    } catch (error) {
      console.error('Error checking application status:', error);
      // Ignore error, just won't show applied status
    }
  };

  useEffect(() => {
    const fetchJob = async () => {
      if (!jobId) {
        setError('Job ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const jobData = await publicService.getJobById(jobId);
        if (jobData) {
          setJob(jobData);
          setError(null);
          // Check if user has applied after job is loaded
          checkIfApplied();
        } else {
          setError('Job not found');
        }
      } catch (err: any) {
        console.error('Error fetching job:', err);
        setError(err.message || 'Failed to load job details');
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [jobId]);

  // Re-check application status when user or company changes
  useEffect(() => {
    if (user && currentCompany?.id && jobId) {
      checkIfApplied();
    }
  }, [user, currentCompany?.id, jobId]);

  const handleLike = () => {
    setIsLiked(!isLiked);
    toast.success(isLiked ? 'Removed from saved jobs' : 'Added to saved jobs');
  };

  const handleShare = () => {
    setShowShareMenu(!showShareMenu);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard!');
    setShowShareMenu(false);
  };

  // Loading state
  if (loading) {
    return (
      <>
        <UnifiedHeader />
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center pt-32">
          <div className="text-center">
            <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Loading job details...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  // Error or not found state
  if (error || !job) {
    return (
      <>
        <UnifiedHeader />
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center pt-32">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Job Not Found</h1>
            <p className="text-gray-600 mb-8">
              {error || "The job you're looking for doesn't exist."}
            </p>
            <button
              onClick={() => navigate('/browse-jobs')}
              className="bg-gradient-to-r from-sky-800 via-sky-700 to-sky-600 text-white px-8 py-3 rounded-xl font-bold hover:shadow-xl transition-all"
            >
              Browse All Jobs
            </button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  // Format salary display
  const formatSalary = () => {
    if (!job.salary) return 'Competitive salary';
    const { min, max, currency, period } = job.salary;
    const currencySymbol = currency === 'USD' ? '$' : currency;

    // Handle project budget display
    if (period === 'project') {
      if (min && max && min !== max) {
        return `${currencySymbol}${min.toLocaleString()} - ${currencySymbol}${max.toLocaleString()}`;
      } else if (min || max) {
        return `${currencySymbol}${(min || max).toLocaleString()}`;
      }
    }

    // Handle other periods (hourly, monthly, yearly)
    const periodText = period === 'hourly' ? '/hr' : period === 'monthly' ? '/mo' : '/yr';
    if (min && max && min !== max) {
      return `${currencySymbol}${min.toLocaleString()} - ${currencySymbol}${max.toLocaleString()}${periodText}`;
    } else if (min || max) {
      return `${currencySymbol}${(min || max).toLocaleString()}${periodText}`;
    }
    return 'Competitive salary';
  };

  return (
    <>
      <UnifiedHeader />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-sky-800 via-sky-700 to-sky-600 pt-28 pb-10 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Back Button */}
            <Link
              to="/browse-jobs"
              className="inline-flex items-center space-x-2 text-white/80 hover:text-white mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back to Jobs</span>
            </Link>

            <div className="flex flex-col gap-4">
              {/* Job Info */}
              <div className="flex-1">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <h1 className="text-3xl md:text-4xl font-black text-white">{job.title}</h1>
                  </div>

                  <div className="flex items-center space-x-2 text-white/90 mb-4">
                    <Building2 className="w-5 h-5" />
                    <span className="text-xl font-semibold">{job.company}</span>
                  </div>

                  {/* Quick Info */}
                  <div className="flex flex-wrap items-center gap-6 text-white/80 mb-6">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-5 h-5" />
                      <span className="text-sm">{job.location}</span>
                      {job.remote && (
                        <span className="ml-2 px-3 py-1 bg-green-500/20 text-green-200 rounded-full text-xs font-semibold border border-green-400/30">
                          Remote
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Briefcase className="w-5 h-5" />
                      <span className="text-sm capitalize">{job.type}</span>
                    </div>
                  </div>

                  {/* Salary */}
                  <div className="flex items-baseline space-x-2 mb-6">
                    <span className="text-4xl font-black text-white">{formatSalary()}</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-4">
                    {!isClient && (
                      <motion.button
                        whileHover={{ scale: hasApplied ? 1 : 1.05 }}
                        whileTap={{ scale: hasApplied ? 1 : 0.95 }}
                        onClick={hasApplied ? undefined : handleApplyClick}
                        disabled={hasApplied}
                        className={`px-8 py-3 rounded-xl font-bold shadow-xl transition-all flex items-center space-x-2 ${
                          hasApplied
                            ? 'bg-green-100 text-green-700 cursor-not-allowed border-2 border-green-300'
                            : 'bg-white text-blue-600 hover:shadow-2xl'
                        }`}
                      >
                        <CheckCircle2 className="w-5 h-5" />
                        <span>{hasApplied ? 'Already Applied' : 'Apply Now'}</span>
                      </motion.button>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleLike}
                      className={`backdrop-blur-md border px-6 py-3 rounded-xl font-bold transition-all ${
                        isLiked
                          ? 'bg-red-500 text-white border-red-500'
                          : 'bg-white/10 text-white border-white/30 hover:bg-white/20'
                      }`}
                    >
                      <Heart className={`w-5 h-5 ${isLiked ? 'fill-white' : ''}`} />
                    </motion.button>
                    <div className="relative">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleShare}
                        className="bg-white/10 backdrop-blur-md text-white border border-white/30 px-6 py-3 rounded-xl font-bold hover:bg-white/20 transition-all"
                      >
                        <Share2 className="w-5 h-5" />
                      </motion.button>
                      <AnimatePresence>
                        {showShareMenu && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-2xl p-3 z-50 min-w-[200px]"
                          >
                            <button
                              onClick={copyLink}
                              className="w-full flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-all text-left"
                            >
                              <Check className="w-4 h-4" />
                              <span className="text-sm font-medium">Copy Link</span>
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Main Info */}
              <div className="lg:col-span-2 space-y-6">
                {/* Job Description */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="bg-white rounded-2xl shadow-lg p-6"
                >
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Job Description</h2>
                  <div
                    className="text-gray-700 leading-relaxed mb-6 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(job.description || '') }}
                  />

                  {job.responsibilities && job.responsibilities.length > 0 && (
                    <>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">Responsibilities</h3>
                      <ul className="space-y-2 mb-6">
                        {job.responsibilities.map((responsibility, index) => (
                          <li key={index} className="flex items-start space-x-3">
                            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700">{responsibility}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}

                  {job.requirements && job.requirements.length > 0 && (
                    <>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">Requirements</h3>
                      <ul className="space-y-2">
                        {job.requirements.map((requirement, index) => (
                          <li key={index} className="flex items-start space-x-3">
                            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700">{requirement}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </motion.div>

                {/* Required Skills */}
                {job.skills && job.skills.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="bg-white rounded-2xl shadow-lg p-6"
                  >
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Required Skills</h2>
                    <div className="flex flex-wrap gap-3">
                      {job.skills.map((skill, index) => (
                        <motion.span
                          key={skill}
                          initial={{ opacity: 0, scale: 0.8 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: index * 0.05 }}
                          className="bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-semibold border border-blue-200 hover:shadow-md transition-all"
                        >
                          {skill}
                        </motion.span>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Benefits */}
                {job.benefits && job.benefits.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="bg-white rounded-2xl shadow-lg p-6"
                  >
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Benefits</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {job.benefits.map((benefit, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Right Column - Job Info */}
              <div className="space-y-6">
                {/* Job Details Card */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="bg-white rounded-2xl shadow-lg p-6"
                >
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Job Details</h3>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <DollarSign className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">Salary Range</p>
                        <p className="font-bold text-gray-900">{formatSalary()}</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Briefcase className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">Job Type</p>
                        <p className="font-bold text-gray-900 capitalize">{job.type}</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">Location</p>
                        <p className="font-bold text-gray-900">{job.location}</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Clock className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">Posted</p>
                        <p className="font-bold text-gray-900">
                          {new Date(job.postedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>

                    {job.deadline && (
                      <div className="flex items-start space-x-3">
                        <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-600">Deadline</p>
                          <p className="font-bold text-gray-900">
                            {new Date(job.deadline).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                    )}

                    {job.applicationsCount !== undefined && (
                      <div className="flex items-start space-x-3">
                        <Users className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-600">Applicants</p>
                          <p className="font-bold text-gray-900">{job.applicationsCount} candidates</p>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Apply CTA - Hidden for clients */}
                {!isClient && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="bg-gradient-to-br from-sky-800 via-sky-700 to-sky-600 rounded-2xl shadow-lg p-6 text-white"
                  >
                    <div className="flex items-center space-x-3 mb-4">
                      <Calendar className="w-6 h-6" />
                      <h3 className="text-lg font-bold">Ready to Apply?</h3>
                    </div>
                    <p className="text-white/90 text-sm mb-6">
                      Join {job.company} and be part of an innovative team building the future of
                      technology.
                    </p>
                    <button
                      onClick={hasApplied ? undefined : handleApplyClick}
                      disabled={hasApplied}
                      className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center space-x-2 ${
                        hasApplied
                          ? 'bg-green-100 text-green-700 cursor-not-allowed border-2 border-green-300'
                          : 'bg-white text-blue-600 hover:shadow-xl'
                      }`}
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      <span>{hasApplied ? 'Already Applied' : 'Apply for This Position'}</span>
                    </button>
                  </motion.div>
                )}

                {/* Company Info */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="bg-white rounded-2xl shadow-lg p-6"
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <img
                      src={job.companyLogo}
                      alt={job.company}
                      className="w-12 h-12 rounded-lg object-cover"
                      onError={(e) => {
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          job.company
                        )}&size=128&background=3b82f6&color=fff&bold=true`;
                      }}
                    />
                    <div>
                      <h3 className="font-bold text-gray-900">{job.company}</h3>
                      <p className="text-sm text-gray-600">View company profile</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700">
                    A leading technology company focused on innovation and excellence in software
                    development.
                  </p>
                </motion.div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <Footer />
      <Toaster position="top-right" richColors />

      {/* Application Modal - Same as Browse Projects */}
      {jobAsProject && (
        <BidSubmissionModal
          isOpen={showApplicationModal}
          onClose={() => setShowApplicationModal(false)}
          project={jobAsProject}
          onSubmit={handleSubmitApplication}
        />
      )}
    </>
  );
};

export default JobDetailPage;
