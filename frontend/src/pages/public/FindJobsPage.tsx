import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X, Briefcase, Loader2 } from 'lucide-react';
import UnifiedHeader from '../../components/layout/UnifiedHeader';
import Footer from '../../components/layout/Footer';
import JobCard from '../../components/marketplace/JobCard';
import publicService, { PublicJob } from '@/services/publicService';
import { SEO } from '@/components/SEO';
import { useAuth } from '@/contexts/AuthContext';
import { useCompanyStore } from '@/stores/companyStore';
import { proposalService } from '@/services/proposalService';
import { setCompanyId } from '@/lib/api-client';

const FindJobsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const { user } = useAuth();
  const { currentCompany, companies, fetchUserCompanies } = useCompanyStore();

  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedJobTypes, setSelectedJobTypes] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [remoteOnly, setRemoteOnly] = useState(false);

  // API state
  const [jobs, setJobs] = useState<PublicJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());

  // Check which jobs user has applied to
  const checkAppliedJobs = async () => {
    if (!user || !currentCompany?.id) {
      console.log('Cannot check applied jobs: user or company not loaded', {
        hasUser: !!user,
        hasCompany: !!currentCompany?.id
      });
      return;
    }

    try {
      console.log('Checking applied jobs for company:', currentCompany.id);
      setCompanyId(currentCompany.id);
      const proposals = await proposalService.getCompanyProposals(currentCompany.id);

      console.log('Found proposals:', proposals.length);

      // Get all job IDs that user has applied to
      const appliedIds = new Set(proposals.map(p => p.projectId));
      console.log('Applied job IDs:', Array.from(appliedIds));
      setAppliedJobIds(appliedIds);
    } catch (error) {
      console.error('Error checking applied jobs:', error);
      // Ignore error, just won't show applied status
    }
  };

  // Fetch jobs from API
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await publicService.searchJobs({
          query: searchQuery || undefined,
          limit: 100, // Fetch more jobs for client-side filtering
        });
        setJobs(response.data);

        // Check applied jobs after loading jobs
        checkAppliedJobs();
      } catch (err: any) {
        setError(err.message || 'Failed to load jobs');
        console.error('Error fetching jobs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [searchQuery]);

  // Fetch company if not loaded and user is logged in
  useEffect(() => {
    const ensureCompanyLoaded = async () => {
      if (user && !currentCompany && companies.length === 0) {
        console.log('Fetching user companies...');
        try {
          await fetchUserCompanies();
        } catch (error) {
          console.error('Error fetching companies:', error);
        }
      }
    };

    ensureCompanyLoaded();
  }, [user, currentCompany, companies.length]);

  // Re-check applied jobs when user or company changes
  useEffect(() => {
    if (user && currentCompany?.id && jobs.length > 0) {
      console.log('User and company loaded, checking applied jobs...');
      checkAppliedJobs();
    }
  }, [user, currentCompany?.id, jobs.length]);

  // Extract all unique skills from jobs
  const allSkills = useMemo(() => {
    const skillSet = new Set<string>();
    jobs.forEach(job => {
      job.skills.forEach(skill => skillSet.add(skill));
    });
    return Array.from(skillSet).sort();
  }, [jobs]);

  // Filter jobs based on search and filters
  const filteredJobs = useMemo(() => {
    let filtered = [...jobs];

    // Filter by search query
    if (searchQuery || localSearchQuery) {
      const query = (searchQuery || localSearchQuery).toLowerCase();
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(query) ||
        job.company.toLowerCase().includes(query) ||
        job.description.toLowerCase().includes(query) ||
        job.skills.some(skill => skill.toLowerCase().includes(query)) ||
        job.location.toLowerCase().includes(query)
      );
    }

    // Filter by job type
    if (selectedJobTypes.length > 0) {
      filtered = filtered.filter(job =>
        selectedJobTypes.map(t => t.toLowerCase()).includes(job.type)
      );
    }

    // Filter by remote only
    if (remoteOnly) {
      filtered = filtered.filter(job => job.remote);
    }

    // Filter by skills
    if (selectedSkills.length > 0) {
      filtered = filtered.filter(job =>
        selectedSkills.some(skill => job.skills.includes(skill))
      );
    }

    return filtered;
  }, [jobs, searchQuery, localSearchQuery, selectedJobTypes, remoteOnly, selectedSkills]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (localSearchQuery.trim()) {
      setSearchParams({ q: localSearchQuery });
    }
  };

  const clearFilters = () => {
    setSelectedJobTypes([]);
    setSelectedSkills([]);
    setRemoteOnly(false);
  };

  const activeFiltersCount = [
    selectedJobTypes.length,
    selectedSkills.length,
    remoteOnly ? 1 : 0
  ].reduce((a, b) => a + b, 0);

  // SEO Configuration
  const hasActiveFilters = selectedJobTypes.length > 0 || selectedSkills.length > 0 || remoteOnly || searchQuery.length > 0;
  const shouldNoindex = filteredJobs.length === 0 && hasActiveFilters && !loading;

  return (
    <>
      <SEO
        title="Browse Jobs - Team@Once"
        description="Find your next opportunity. Browse thousands of remote and onsite job openings from top companies worldwide."
        canonical="https://teamatonce.com/browse-jobs"
        noindex={shouldNoindex}
      />
      <UnifiedHeader />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        {/* Header Section */}
        <section className="bg-gradient-to-r from-sky-800 via-sky-700 to-sky-600 pt-28 pb-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-6"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-4">
                <Briefcase className="w-8 h-8 text-white" />
              </div>
              {searchQuery ? (
                <>
                  <h1 className="text-3xl md:text-5xl font-black text-white mb-4">
                    Job Search Results
                  </h1>
                  <p className="text-lg text-white/90">
                    Found {filteredJobs.length} jobs matching "{searchQuery}"
                  </p>
                </>
              ) : (
                <>
                  <h1 className="text-3xl md:text-5xl font-black text-white mb-4">
                    Find Your Dream Job
                  </h1>
                  <p className="text-lg text-white/90">
                    {filteredJobs.length} open positions from top companies
                  </p>
                </>
              )}
            </motion.div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-3xl mx-auto">
              <div className="bg-white rounded-2xl shadow-2xl p-2 flex items-center">
                <Search className="w-6 h-6 text-gray-400 ml-4" />
                <input
                  type="text"
                  value={localSearchQuery}
                  onChange={(e) => setLocalSearchQuery(e.target.value)}
                  placeholder='Search for jobs, companies, or skills...'
                  className="flex-1 px-4 py-3 text-gray-900 placeholder-gray-500 border-none"
                />
                <button
                  type="submit"
                  className="bg-gradient-to-r from-sky-800 via-sky-700 to-sky-600 text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all"
                >
                  Search
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Filter Bar */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="inline-flex items-center space-x-2 bg-white border border-gray-300 hover:border-blue-500 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span>Filters</span>
                  {activeFiltersCount > 0 && (
                    <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>

                {activeFiltersCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-gray-600 hover:text-gray-900 flex items-center space-x-1"
                  >
                    <X className="w-4 h-4" />
                    <span>Clear filters</span>
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-600">
                  {filteredJobs.length} results
                </span>
              </div>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-white rounded-2xl shadow-lg p-6 mb-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Job Type */}
                  <div>
                    <h3 className="font-bold text-gray-900 mb-3">Job Type</h3>
                    <div className="space-y-2">
                      {['Full-time', 'Part-time', 'Contract', 'Freelance'].map((type) => (
                        <label key={type} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedJobTypes.includes(type)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedJobTypes([...selectedJobTypes, type]);
                              } else {
                                setSelectedJobTypes(selectedJobTypes.filter(t => t !== type));
                              }
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Remote */}
                  <div>
                    <h3 className="font-bold text-gray-900 mb-3">Work Location</h3>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={remoteOnly}
                          onChange={(e) => setRemoteOnly(e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Remote only</span>
                      </label>
                    </div>
                  </div>

                  {/* Skills */}
                  <div>
                    <h3 className="font-bold text-gray-900 mb-3">Skills</h3>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {allSkills.slice(0, 10).map((skill) => (
                        <label key={skill} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedSkills.includes(skill)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedSkills([...selectedSkills, skill]);
                              } else {
                                setSelectedSkills(selectedSkills.filter(s => s !== skill));
                              }
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">{skill}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Results Grid */}
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="text-center">
                  <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                  <p className="text-gray-600">Loading jobs...</p>
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">⚠️</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Jobs</h3>
                <p className="text-gray-600 mb-6">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : filteredJobs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredJobs.map((job, index) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    index={index}
                    hasApplied={appliedJobIds.has(job.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">💼</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">No jobs found</h3>
                <p className="text-gray-600 mb-6">
                  Try adjusting your filters or search query
                </p>
                <button
                  onClick={clearFilters}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        </section>
      </div>

      <Footer />
    </>
  );
};

export default FindJobsPage;
