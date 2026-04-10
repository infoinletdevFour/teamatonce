import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, DollarSign, Clock,
  Grid, List, X, Eye, Send,
  CheckCircle, AlertCircle, Briefcase, ArrowLeft, Loader2, User,
  Star, MapPin, TrendingUp, Zap, Award,
  FileText, Code, Layers,
  Smartphone, Globe, Database, Cpu,
  Palette, PenTool, Film, Music, Laptop, BarChart3, Camera, Sparkles, Bot, LucideIcon
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCompany } from '@/contexts/CompanyContext';
import { proposalService } from '@/services/proposalService';
import { setCompanyId as setApiCompanyId } from '@/lib/api-client';
import type { BrowseableProject } from '@/types/proposal';
import type { CreateProposalData } from '@/types/proposal';
import ProjectDetailModal from '@/components/project/ProjectDetailModal';
import BidSubmissionModal from '@/components/project/BidSubmissionModal';
import { SERVICE_CATEGORIES } from '@/config/service-categories';

// Icon mapper - converts icon string names to Lucide React components
const getIconComponent = (iconName: string): LucideIcon => {
  const iconMap: Record<string, LucideIcon> = {
    'Palette': Palette,
    'TrendingUp': TrendingUp,
    'PenTool': PenTool,
    'Film': Film,
    'Music': Music,
    'Laptop': Laptop,
    'Briefcase': Briefcase,
    'BarChart3': BarChart3,
    'Camera': Camera,
    'Sparkles': Sparkles,
    'Bot': Bot,
    'Layers': Layers,
  };
  return iconMap[iconName] || Briefcase; // Default to Briefcase if icon not found
};

const BrowseProjects: React.FC = () => {
  const { companyId } = useCompany();
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Data
  const [projects, setProjects] = useState<BrowseableProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalProjects, setTotalProjects] = useState(0);
  const ITEMS_PER_PAGE = 20;

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [minBudget, setMinBudget] = useState<number | undefined>();
  const [maxBudget, setMaxBudget] = useState<number | undefined>();
  const [selectedDuration, setSelectedDuration] = useState('');

  // Modal states
  const [selectedProject, setSelectedProject] = useState<BrowseableProject | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showBidModal, setShowBidModal] = useState(false);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);

  // Infinite scroll observer
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Helper to count projects by category
  const getCategoryCount = (categoryId: string): number => {
    if (categoryId === 'all') return projects.length;

    return projects.filter(project => {
      // Match by actual category field if available
      if (project.category === categoryId) {
        return true;
      }

      // Fallback: Try to match by requirements object if category field is not set
      if (project.requirements && typeof project.requirements === 'object') {
        const reqs = project.requirements as any;
        if (reqs.categoryId === categoryId || reqs.category === categoryId) {
          return true;
        }
      }

      return false;
    }).length;
  };

  // Build categories from SERVICE_CATEGORIES
  const categories = [
    { id: 'all', name: 'All Projects', icon: Layers, count: projects.length },
    ...SERVICE_CATEGORIES.map(cat => ({
      id: cat.id,
      name: cat.name,
      icon: getIconComponent(cat.icon),
      count: getCategoryCount(cat.id),
    })),
  ];

  const budgetRanges = [
    { label: 'All Budgets', min: 0, max: undefined },
    { label: '$0 - $500', min: 0, max: 500 },
    { label: '$500 - $1,000', min: 500, max: 1000 },
    { label: '$1,000 - $5,000', min: 1000, max: 5000 },
    { label: '$5,000 - $10,000', min: 5000, max: 10000 },
    { label: '$10,000+', min: 10000, max: undefined },
  ];

  const durationOptions = [
    { label: 'All Durations', value: '' },
    { label: 'Less than 1 month', value: '30' },
    { label: '1-3 months', value: '90' },
    { label: '3-6 months', value: '180' },
    { label: '6+ months', value: '180+' },
  ];

  const availableSkills = [
    'React', 'TypeScript', 'Node.js', 'Next.js', 'React Native',
    'PostgreSQL', 'MongoDB', 'GraphQL', 'NestJS', 'TailwindCSS',
    'Redux', 'Firebase', 'AWS', 'Docker', 'Stripe'
  ];

  // Strip HTML tags from description
  const stripHtml = (html: string): string => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  // Initial load
  useEffect(() => {
    loadProjects(1, true);
  }, [companyId]);

  // Set up infinite scroll observer
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadMoreProjects();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loadingMore, loading, currentPage]);

  const loadProjects = async (page: number = 1, reset: boolean = false) => {
    if (!companyId) return;

    try {
      if (reset) {
        setLoading(true);
        setProjects([]);
        setCurrentPage(1);
      } else {
        setLoadingMore(true);
      }

      setApiCompanyId(companyId);
      const response = await proposalService.browseProjects(page, ITEMS_PER_PAGE);

      if (response?.projects) {
        setProjects(prev => reset ? response.projects : [...prev, ...response.projects]);
        setTotalProjects(response.total || 0);
        setHasMore(response.hasMore || false);
        setCurrentPage(page);
      }

      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load projects');
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreProjects = useCallback(() => {
    if (!loadingMore && hasMore) {
      loadProjects(currentPage + 1, false);
    }
  }, [currentPage, loadingMore, hasMore]);

  const handleViewDetails = (project: BrowseableProject) => {
    setSelectedProject(project);
    setShowDetailModal(true);
  };

  const handleStartBid = (project: BrowseableProject) => {
    setSelectedProject(project);
    setShowBidModal(true);
  };

  const handleSubmitProposal = async (proposalData: CreateProposalData) => {
    if (!selectedProject || !companyId) return;

    try {
      setApiCompanyId(companyId);
      await proposalService.createProposal({
        ...proposalData,
        projectId: selectedProject.id,
      });

      setShowBidModal(false);
      setShowSuccessNotification(true);
      setTimeout(() => setShowSuccessNotification(false), 5000);
      loadProjects(1, true);
    } catch (err: any) {
      console.error('Failed to submit proposal:', err);
      alert(err.message || 'Failed to submit proposal');
    }
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill)
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  const clearAllFilters = () => {
    setSelectedCategory('all');
    setSelectedSkills([]);
    setMinBudget(undefined);
    setMaxBudget(undefined);
    setSelectedDuration('');
  };

  const handleBudgetFilter = (min: number, max: number | undefined) => {
    setMinBudget(min);
    setMaxBudget(max);
  };

  // Filter projects based on all active filters
  const filteredProjects = projects.filter(project => {
    // Category filter
    const matchesCategory = (() => {
      if (selectedCategory === 'all') return true;

      // Match by actual category field
      if (project.category === selectedCategory) {
        return true;
      }

      // Fallback: Try to match by requirements object if category field is not set
      if (project.requirements && typeof project.requirements === 'object') {
        const reqs = project.requirements as any;
        if (reqs.categoryId === selectedCategory || reqs.category === selectedCategory) {
          return true;
        }
      }

      return false;
    })();

    // Search filter
    const matchesSearch = !searchQuery ||
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase());

    // Skills filter
    const matchesSkills = selectedSkills.length === 0 ||
      selectedSkills.some(skill =>
        project.techStack?.some(tech =>
          tech.toLowerCase().includes(skill.toLowerCase())
        )
      );

    // Budget filter
    const matchesBudget =
      (minBudget === undefined || project.estimatedCost >= minBudget) &&
      (maxBudget === undefined || project.estimatedCost <= maxBudget);

    // Duration filter
    const matchesDuration = !selectedDuration ||
      (selectedDuration === '30' && project.estimatedDurationDays <= 30) ||
      (selectedDuration === '90' && project.estimatedDurationDays > 30 && project.estimatedDurationDays <= 90) ||
      (selectedDuration === '180' && project.estimatedDurationDays > 90 && project.estimatedDurationDays <= 180) ||
      (selectedDuration === '180+' && project.estimatedDurationDays > 180);

    return matchesCategory && matchesSearch && matchesSkills && matchesBudget && matchesDuration;
  });

  // Get color class for match score
  const getMatchScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-sky-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-500';
  };

  // Get gradient for match score bar
  const getMatchScoreGradient = (score: number): string => {
    if (score >= 80) return 'from-green-500 to-emerald-500';
    if (score >= 60) return 'from-sky-600 to-sky-500';
    if (score >= 40) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-pink-500';
  };

  const handleBackToProjects = () => {
    if (companyId) {
      navigate(`/company/${companyId}/seller/dashboard`);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-sky-50/30">
      {/* Enhanced Left Sidebar */}
      <aside className="w-72 bg-white border-r border-gray-200 fixed left-0 top-16 bottom-0 overflow-y-auto shadow-sm">
        <div className="p-5">
          {/* Header */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Seller Portal
              </h2>
            </div>

            {/* Back Button */}
            <button
              onClick={handleBackToProjects}
              className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-all font-medium text-sm mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </button>

            <div className="flex items-center space-x-3 px-4 py-3 rounded-xl bg-gradient-to-r from-sky-800 via-sky-700 to-sky-600 text-white shadow-lg">
              <Briefcase className="w-5 h-5" />
              <span className="font-bold">Browse Projects</span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-gradient-to-br from-sky-50 to-sky-100/50 rounded-xl p-3 border border-sky-200">
              <div className="flex items-center space-x-2 mb-1">
                <FileText className="w-4 h-4 text-sky-600" />
                <span className="text-xs font-semibold text-sky-900">Available</span>
              </div>
              <p className="text-lg font-black text-sky-900">{totalProjects}</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl p-3 border border-green-200">
              <div className="flex items-center space-x-2 mb-1">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-xs font-semibold text-green-900">Matching</span>
              </div>
              <p className="text-lg font-black text-green-900">{filteredProjects.length}</p>
            </div>
          </div>

          {/* Categories */}
          <div className="mb-5">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center">
              <Layers className="w-4 h-4 mr-2 text-gray-500" />
              Categories
            </h3>
            <div className="space-y-1">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all ${
                      selectedCategory === category.id
                        ? 'bg-sky-50 text-sky-700 font-semibold border-l-4 border-sky-600'
                        : 'text-gray-600 hover:bg-gray-50 font-medium'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="w-4 h-4" />
                      <span className="text-sm">{category.name}</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      selectedCategory === category.id
                        ? 'bg-sky-100 text-sky-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {category.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Budget Range Filter */}
          <div className="mb-5">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center">
              <DollarSign className="w-4 h-4 mr-2 text-gray-500" />
              Budget Range
            </h3>
            <div className="space-y-1">
              {budgetRanges.map((range, idx) => (
                <button
                  key={idx}
                  onClick={() => handleBudgetFilter(range.min, range.max)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                    minBudget === range.min && maxBudget === range.max
                      ? 'bg-sky-50 text-sky-700 font-semibold'
                      : 'text-gray-600 hover:bg-gray-50 font-medium'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          {/* Duration Filter */}
          <div className="mb-5">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center">
              <Clock className="w-4 h-4 mr-2 text-gray-500" />
              Project Duration
            </h3>
            <div className="space-y-1">
              {durationOptions.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedDuration(option.value)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                    selectedDuration === option.value
                      ? 'bg-sky-50 text-sky-700 font-semibold'
                      : 'text-gray-600 hover:bg-gray-50 font-medium'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Clear Filters */}
          {(selectedCategory !== 'all' || selectedSkills.length > 0 || minBudget !== 0 || selectedDuration) && (
            <button
              onClick={clearAllFilters}
              className="w-full px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold text-sm transition-all flex items-center justify-center space-x-2"
            >
              <X className="w-4 h-4" />
              <span>Clear All Filters</span>
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 ml-72 px-6 pt-2 pb-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <h1 className="text-3xl font-black text-gray-900 mb-1 bg-gradient-to-r from-gray-900 via-sky-800 to-gray-900 bg-clip-text text-transparent">
                  Discover Projects
                </h1>
                <p className="text-gray-600 flex items-center space-x-2">
                  <span className="flex items-center">
                    <Zap className="w-4 h-4 text-amber-500 mr-1" />
                    {totalProjects} projects available
                  </span>
                  {filteredProjects.length !== projects.length && (
                    <>
                      <span className="text-gray-400">•</span>
                      <span className="text-sky-600 font-semibold">{filteredProjects.length} matching</span>
                    </>
                  )}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-md transition-all ${
                      viewMode === 'grid' ? 'bg-sky-100 text-sky-700' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                    title="Grid View"
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md transition-all ${
                      viewMode === 'list' ? 'bg-sky-100 text-sky-700' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                    title="List View"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Enhanced Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-lg border border-gray-200 mb-4 overflow-hidden"
          >
            <div className="p-5">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by project name, description, or skills (e.g., React, Node.js)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-sky-500 focus:bg-white transition-all text-gray-900 placeholder-gray-400 font-medium"
                />
              </div>

              {/* Tech Stack Quick Filters */}
              {selectedSkills.length === 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Popular Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {availableSkills.slice(0, 8).map(skill => (
                      <button
                        key={skill}
                        onClick={() => toggleSkill(skill)}
                        className="px-3 py-1.5 bg-gray-50 hover:bg-sky-50 border border-gray-200 hover:border-sky-300 text-gray-700 hover:text-sky-700 rounded-full text-sm font-semibold transition-all"
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Active Skills */}
              {selectedSkills.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Active Filters ({selectedSkills.length})
                    </p>
                    <button
                      onClick={() => setSelectedSkills([])}
                      className="text-sm font-semibold text-sky-600 hover:text-sky-700"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedSkills.map(skill => (
                      <button
                        key={skill}
                        onClick={() => toggleSkill(skill)}
                        className="px-3 py-1.5 bg-sky-100 border border-sky-300 text-sky-700 rounded-full text-sm font-bold transition-all hover:bg-sky-200 flex items-center space-x-2"
                      >
                        <span>{skill}</span>
                        <X className="w-3 h-3" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-12 h-12 text-sky-600 animate-spin mb-4" />
          <p className="text-gray-600 font-semibold">Loading projects...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl p-12 shadow-lg border-2 border-red-200 text-center"
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Failed to Load Projects</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => loadProjects(1, true)}
            className="px-6 py-3 bg-gradient-to-r from-sky-800 via-sky-700 to-sky-600 text-white rounded-xl font-bold shadow-lg hover:from-sky-900 hover:via-sky-800 hover:to-sky-700 transition-all"
          >
            Try Again
          </motion.button>
        </motion.div>
      )}

      {/* Projects Grid/List */}
      {!loading && !error && (
        <>
          {filteredProjects.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl p-16 shadow-lg border-2 border-dashed border-gray-300 text-center"
            >
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Briefcase className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">No Projects Found</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {searchQuery || selectedSkills.length > 0
                  ? 'Try adjusting your search or filters to find more projects'
                  : 'There are no projects available at the moment. Check back soon!'}
              </p>
              {(searchQuery || selectedSkills.length > 0 || minBudget || selectedDuration) && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={clearAllFilters}
                  className="px-6 py-3 bg-gradient-to-r from-sky-800 via-sky-700 to-sky-600 text-white rounded-xl font-bold shadow-lg hover:from-sky-900 hover:via-sky-800 hover:to-sky-700 transition-all"
                >
                  Clear All Filters
                </motion.button>
              )}
            </motion.div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid md:grid-cols-2 gap-6' : 'space-y-4'}>
              {filteredProjects.map((project, idx) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 hover:border-sky-300 hover:shadow-xl transition-all overflow-hidden group"
                >
                  <div className="p-6">
                    {/* Project Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-black text-gray-900 mb-2 group-hover:text-sky-600 transition-colors line-clamp-1">
                          {project.name}
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                          {stripHtml(project.description)}
                        </p>
                      </div>
                    </div>

                    {/* Client Info */}
                    <div className="flex items-center space-x-3 mb-4 pb-4 border-b border-gray-100">
                      {project.client?.profilePicture ? (
                        <img
                          src={project.client.profilePicture}
                          alt={project.client.name || 'Client'}
                          className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-800 via-sky-700 to-sky-600 flex items-center justify-center shadow-sm">
                          <User className="w-5 h-5 text-white" />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-bold text-gray-900 text-sm">
                          {project.client?.name || 'Client'}
                        </p>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <MapPin className="w-3 h-3" />
                          <span>Remote</span>
                        </div>
                      </div>
                      {project.client?.rating && (
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                          <span className="text-sm font-bold text-gray-900">
                            {project.client.rating.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Tech Stack */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {project.techStack?.slice(0, 5).map((tech, techIdx) => (
                        <span
                          key={techIdx}
                          className="px-3 py-1 bg-sky-50 text-sky-700 rounded-lg text-xs font-bold border border-sky-200"
                        >
                          {tech}
                        </span>
                      ))}
                      {(project.techStack?.length || 0) > 5 && (
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold">
                          +{(project.techStack?.length || 0) - 5} more
                        </span>
                      )}
                    </div>

                    {/* Matched Skills */}
                    {project.matchedSkills && project.matchedSkills.length > 0 && (
                      <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <Award className="w-4 h-4 text-green-600" />
                          <span className="text-xs font-bold text-green-900">Your Matched Skills</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {project.matchedSkills.slice(0, 3).map((skill, skillIdx) => (
                            <span
                              key={skillIdx}
                              className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium"
                            >
                              ✓ {skill}
                            </span>
                          ))}
                          {project.matchedSkills.length > 3 && (
                            <span className="px-2 py-0.5 bg-green-50 text-green-600 rounded-full text-xs">
                              +{project.matchedSkills.length - 3} matched
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Project Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-4 pb-4 border-b border-gray-100">
                      <div className="flex items-center space-x-2">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-sm">
                          <DollarSign className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 font-medium">Budget</div>
                          <div className="font-black text-gray-900 text-sm">
                            ${project.estimatedCost >= 1000
                              ? `${(project.estimatedCost / 1000).toFixed(1)}K`
                              : project.estimatedCost}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center shadow-sm">
                          <Clock className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 font-medium">Duration</div>
                          <div className="font-black text-gray-900 text-sm">
                            {project.estimatedDurationDays}d
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-sm">
                          <Send className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 font-medium">Proposals</div>
                          <div className="font-black text-gray-900 text-sm">
                            {project.proposalsCount}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* AI Match Score */}
                    {project.aiMatchScore !== undefined && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Zap className="w-4 h-4 text-amber-500" />
                            <span className="text-sm font-bold text-gray-900">AI Match Score</span>
                          </div>
                          <span className={`text-lg font-black ${getMatchScoreColor(project.aiMatchScore)}`}>
                            {project.aiMatchScore}%
                          </span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full bg-gradient-to-r ${getMatchScoreGradient(project.aiMatchScore)} transition-all`}
                            style={{ width: `${project.aiMatchScore}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleViewDetails(project)}
                        className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all border-2 border-transparent hover:border-gray-300"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View Details</span>
                      </button>
                      {!project.hasProposal && (
                        <button
                          onClick={() => handleStartBid(project)}
                          className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-sky-800 via-sky-700 to-sky-600 text-white rounded-xl font-bold shadow-lg hover:from-sky-900 hover:via-sky-800 hover:to-sky-700 transition-all"
                        >
                          <Send className="w-4 h-4" />
                          <span>Submit Bid</span>
                        </button>
                      )}
                      {project.hasProposal && (
                        <div className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-green-50 text-green-700 rounded-xl font-bold border-2 border-green-200">
                          <CheckCircle className="w-4 h-4" />
                          <span>Bid Submitted</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

            {/* Infinite Scroll Trigger & Load More Indicator */}
            <div ref={loadMoreRef} className="mt-8">
              {loadingMore && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
                  <span className="ml-3 text-gray-600 font-medium">Loading more projects...</span>
                </div>
              )}

              {!loadingMore && hasMore && filteredProjects.length > 0 && (
                <div className="flex justify-center py-4">
                  <button
                    onClick={loadMoreProjects}
                    className="px-6 py-3 bg-gradient-to-r from-sky-800 via-sky-700 to-sky-600 text-white rounded-xl font-semibold shadow-lg hover:from-sky-900 hover:via-sky-800 hover:to-sky-700 transition-all"
                  >
                    Load More Projects
                  </button>
                </div>
              )}

              {!hasMore && projects.length > 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500 font-medium">
                    You've seen all {totalProjects} projects
                  </p>
                </div>
              )}
            </div>
            </>
          )}
        </div>
      </div>

          {/* Modals */}
          {selectedProject && (
            <>
              <ProjectDetailModal
                isOpen={showDetailModal}
                onClose={() => setShowDetailModal(false)}
                project={selectedProject}
                onSubmitBid={handleStartBid}
              />
              <BidSubmissionModal
                isOpen={showBidModal}
                onClose={() => setShowBidModal(false)}
                project={selectedProject}
                onSubmit={handleSubmitProposal}
              />
            </>
          )}

          {/* Success Notification */}
          <AnimatePresence>
            {showSuccessNotification && (
              <motion.div
                initial={{ opacity: 0, y: -100, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -100, scale: 0.9 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="fixed top-8 left-1/2 -translate-x-1/2 z-50 max-w-md w-full mx-4"
              >
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl shadow-2xl p-6 flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">Bid Submitted Successfully!</h4>
                    <p className="text-sm text-white/90">The client will review your proposal</p>
                  </div>
                  <button
                    onClick={() => setShowSuccessNotification(false)}
                    className="ml-auto p-1 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
    </div>
  );
};

export default BrowseProjects;
