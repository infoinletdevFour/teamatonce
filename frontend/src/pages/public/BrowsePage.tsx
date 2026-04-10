import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, useLocation, useParams } from 'react-router-dom';
import {
  Search, SlidersHorizontal, X, Users, Star,
  ChevronRight, ChevronDown,
  Grid, List, Loader2,
  Palette, Megaphone, Pencil, Video, Music,
  Code, Briefcase, BarChart3, Camera, Heart, Bot
} from 'lucide-react';
import UnifiedHeader from '../../components/layout/UnifiedHeader';
import Footer from '../../components/layout/Footer';
import DeveloperCard from '../../components/marketplace/DeveloperCard';
import publicService, { PublicDeveloper } from '@/services/publicService';
import { SKILL_CATEGORIES, searchSkills } from '@/constants/skills';
import { SEO } from '@/components/SEO';

// Icon mapping for category icons
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  palette: Palette,
  megaphone: Megaphone,
  pencil: Pencil,
  video: Video,
  music: Music,
  code: Code,
  briefcase: Briefcase,
  chart: BarChart3,
  camera: Camera,
  heart: Heart,
  bot: Bot,
};

const getCategoryIcon = (iconName: string, className: string = "w-4 h-4") => {
  const IconComponent = iconMap[iconName.toLowerCase()];
  if (IconComponent) {
    return <IconComponent className={className} />;
  }
  return null;
};

const BrowsePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const { categorySlug } = useParams<{ categorySlug?: string }>();
  const searchQuery = searchParams.get('q') || '';

  // API state
  const [developers, setDevelopers] = useState<PublicDeveloper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter state
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  // Filter values
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(searchParams.get('category') || '');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200]);
  const [selectedAvailability, setSelectedAvailability] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState<'relevance' | 'price-low' | 'price-high' | 'rating' | 'newest'>('relevance');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Debounce timer ref
  const searchTimeoutRef = React.useRef<NodeJS.Timeout>();

  // Fetch developers from API with all filters (server-side search)
  useEffect(() => {
    // Clear any pending search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce the search to avoid too many API calls
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        setLoading(true);
        setError(null);

        // Build search params for API
        const searchParams: any = {
          query: searchQuery || localSearchQuery || undefined,
          page: 1,
          limit: 100,
        };

        // Add skills filter
        if (selectedSkills.length > 0) {
          searchParams.skills = selectedSkills.join(',');
        }

        // Add category filter
        if (selectedCategoryId) {
          searchParams.category = selectedCategoryId;
        }

        // Add rate filters (only if modified from default)
        if (priceRange[0] > 0) {
          searchParams.minRate = priceRange[0];
        }
        if (priceRange[1] < 200) {
          searchParams.maxRate = priceRange[1];
        }

        // Add availability filter
        if (selectedAvailability.length === 1) {
          searchParams.availability = selectedAvailability[0];
        }

        // Add rating filter
        if (minRating > 0) {
          searchParams.minRating = minRating;
        }

        const response = await publicService.searchDevelopers(searchParams);
        setDevelopers(response.data);
      } catch (err: any) {
        setError(err.message || 'Failed to load developers');
        setDevelopers([]);
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms debounce

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, localSearchQuery, selectedSkills, selectedCategoryId, priceRange, selectedAvailability, minRating]);

  // Get current category from SKILL_CATEGORIES
  const currentCategory = useMemo(() => {
    return SKILL_CATEGORIES.find(cat => cat.id === selectedCategoryId) || null;
  }, [selectedCategoryId]);

  // Popular skills for quick access (top skills from Programming & Tech and Graphics & Design)
  const popularSkills = useMemo(() => {
    const techCategory = SKILL_CATEGORIES.find(cat => cat.id === 'programming-tech');
    const designCategory = SKILL_CATEGORIES.find(cat => cat.id === 'graphics-design');
    const skills = [
      ...(techCategory?.skills.slice(0, 5) || []),
      ...(designCategory?.skills.slice(0, 5) || []),
    ];
    return skills;
  }, []);

  // Get skills based on selected category or all skills
  const availableSkills = useMemo(() => {
    if (selectedCategoryId && currentCategory) {
      return currentCategory.skills;
    }
    // Return skills from all categories (first 30)
    return SKILL_CATEGORIES.flatMap(cat => cat.skills).slice(0, 30);
  }, [selectedCategoryId, currentCategory]);

  // All languages from developers
  const allLanguages = useMemo(() => {
    const langSet = new Set<string>();
    developers.forEach(dev => {
      if (dev.languages) {
        dev.languages.forEach(lang => langSet.add(lang));
      }
    });
    return Array.from(langSet).sort();
  }, [developers]);

  // Process developers (API handles main filtering, we handle sorting and language filter)
  const filteredDevelopers = useMemo(() => {
    let filtered = [...developers];

    // Filter by languages (not supported by API yet)
    if (selectedLanguages.length > 0) {
      filtered = filtered.filter(dev =>
        dev.languages && selectedLanguages.some(lang => dev.languages?.includes(lang))
      );
    }

    // Sort developers (client-side sorting)
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.hourlyRate - b.hourlyRate);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.hourlyRate - a.hourlyRate);
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
        // Sort by ID as a proxy for newest
        filtered.sort((a, b) => String(b.id).localeCompare(String(a.id)));
        break;
      default:
        // relevance - keep API's ordering (already sorted by relevance score)
        break;
    }

    return filtered;
  }, [developers, selectedLanguages, sortBy]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (localSearchQuery.trim()) {
      setSearchParams({ q: localSearchQuery });
    }
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setSelectedSkills([]); // Reset skill filters when category changes
  };

  const handleSkillSelect = (skill: string) => {
    if (!selectedSkills.includes(skill)) {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const toggleCategoryExpand = (categoryId: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const clearFilters = () => {
    setSelectedCategoryId('');
    setPriceRange([0, 200]);
    setSelectedAvailability([]);
    setSelectedSkills([]);
    setSelectedLanguages([]);
    setMinRating(0);
    setSortBy('relevance');
  };

  const activeFiltersCount = [
    selectedCategoryId,
    priceRange[0] > 0 || priceRange[1] < 200 ? 1 : 0,
    selectedAvailability.length,
    selectedSkills.length,
    selectedLanguages.length,
    minRating > 0 ? 1 : 0,
  ].filter(Boolean).length;

  // Build SEO meta tags
  const baseUrl = 'https://teamatonce.com';
  const canonicalUrl = categorySlug
    ? `${baseUrl}/browse-talent/${categorySlug}`
    : `${baseUrl}/browse-talent`;

  const selectedCategory = SKILL_CATEGORIES.find(cat => cat.id === selectedCategoryId);
  const pageTitle = categorySlug || selectedCategoryId
    ? `${selectedCategory?.label || 'Browse'} Talent - Team@Once`
    : 'Browse Top Talent - Team@Once';

  const pageDescription = categorySlug || selectedCategoryId
    ? `Find expert ${selectedCategory?.label || ''} freelancers on Team@Once. Browse verified professionals with proven track records.`
    : 'Browse and hire top freelancers across all categories. Find verified developers, designers, marketers, and more on Team@Once.';

  return (
    <>
      <SEO
        title={pageTitle}
        description={pageDescription}
        canonical={canonicalUrl}
        noindex={filteredDevelopers.length === 0 && (selectedSkills.length > 0 || searchQuery.length > 0 || activeFiltersCount > 0)}
      />
      <UnifiedHeader />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        {/* Header Section */}
        <section className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 pt-28 pb-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-6"
            >
              {currentCategory ? (
                <>
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-4">
                    {getCategoryIcon(currentCategory.icon, "w-8 h-8 text-white")}
                  </div>
                  <h1 className="text-3xl md:text-5xl font-black text-white mb-4">
                    {currentCategory.name}
                  </h1>
                  <p className="text-lg text-white/90 mb-2">
                    Find experts in {currentCategory.name.toLowerCase()}
                  </p>
                  <p className="text-white/80">
                    {filteredDevelopers.length} freelancers available • {currentCategory.skills.length} skills
                  </p>
                </>
              ) : searchQuery ? (
                <>
                  <h1 className="text-3xl md:text-5xl font-black text-white mb-4">
                    Search Results
                  </h1>
                  <p className="text-lg text-white/90">
                    Found {filteredDevelopers.length} freelancers matching "{searchQuery}"
                  </p>
                </>
              ) : (
                <>
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-4">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <h1 className="text-3xl md:text-5xl font-black text-white mb-4">
                    Find Expert Freelancers
                  </h1>
                  <p className="text-lg text-white/90">
                    {filteredDevelopers.length} talented professionals ready to help
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
                  placeholder="Search freelancers, skills, or services..."
                  className="flex-1 px-4 py-3 text-gray-900 placeholder-gray-500 border-none focus:outline-none"
                />
                <button
                  type="submit"
                  className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-3 rounded-xl font-bold hover:shadow-lg transition-all"
                >
                  Search
                </button>
              </div>
            </form>

            {/* Popular Skills */}
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              {popularSkills.map((skill) => (
                <button
                  key={skill}
                  onClick={() => handleSkillSelect(skill)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedSkills.includes(skill)
                      ? 'bg-white text-purple-700'
                      : 'bg-white/20 backdrop-blur text-white hover:bg-white/30'
                  }`}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Breadcrumb */}
        {(selectedCategoryId || searchQuery || selectedSkills.length > 0) && (
          <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-3">
            <div className="max-w-7xl mx-auto flex items-center gap-2 text-sm flex-wrap">
              <button onClick={clearFilters} className="text-gray-600 hover:text-blue-600">
                All Freelancers
              </button>
              {currentCategory && (
                <>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900 font-medium flex items-center gap-1">
                    {getCategoryIcon(currentCategory.icon, "w-4 h-4")}
                    {currentCategory.name}
                  </span>
                </>
              )}
              {selectedSkills.length > 0 && (
                <>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{selectedSkills.length} skill{selectedSkills.length > 1 ? 's' : ''} selected</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex gap-8">
            {/* Sidebar Filters */}
            <aside className={`w-64 flex-shrink-0 ${showFilters ? 'block' : 'hidden lg:block'}`}>
              <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-900">Filters</h3>
                  {activeFiltersCount > 0 && (
                    <button
                      onClick={clearFilters}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                {/* Category Filter */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Category</h4>
                  <div className="space-y-1 max-h-64 overflow-y-auto">
                    {SKILL_CATEGORIES.map((cat) => (
                      <div key={cat.id}>
                        <button
                          onClick={() => {
                            if (selectedCategoryId === cat.id) {
                              toggleCategoryExpand(cat.id);
                            } else {
                              handleCategorySelect(cat.id);
                              setExpandedCategories([cat.id]);
                            }
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                            selectedCategoryId === cat.id
                              ? 'bg-blue-50 text-blue-700'
                              : 'hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            {getCategoryIcon(cat.icon, "w-4 h-4")}
                            <span className="truncate">{cat.name}</span>
                          </span>
                          <ChevronDown
                            className={`w-4 h-4 flex-shrink-0 transition-transform ${
                              expandedCategories.includes(cat.id) ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                        <AnimatePresence>
                          {expandedCategories.includes(cat.id) && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="pl-8 py-1 space-y-1 max-h-40 overflow-y-auto">
                                {cat.skills.slice(0, 10).map((skill) => (
                                  <button
                                    key={skill}
                                    onClick={() => handleSkillSelect(skill)}
                                    className={`w-full px-3 py-1.5 rounded text-left text-sm transition-colors ${
                                      selectedSkills.includes(skill)
                                        ? 'bg-blue-100 text-blue-700 font-medium'
                                        : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                                  >
                                    {skill}
                                  </button>
                                ))}
                                {cat.skills.length > 10 && (
                                  <span className="px-3 py-1.5 text-sm text-gray-500">
                                    +{cat.skills.length - 10} more skills
                                  </span>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Hourly Rate</h4>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                      <input
                        type="number"
                        min={0}
                        value={priceRange[0]}
                        onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                        className="w-full pl-6 pr-2 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                        placeholder="Min"
                      />
                    </div>
                    <span className="text-gray-400">-</span>
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                      <input
                        type="number"
                        min={priceRange[0]}
                        value={priceRange[1]}
                        onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                        className="w-full pl-6 pr-2 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                        placeholder="Max"
                      />
                    </div>
                  </div>
                </div>

                {/* Skills */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Skills</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {availableSkills.slice(0, 15).map((skill) => (
                      <label key={skill} className="flex items-center gap-2 cursor-pointer">
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
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{skill}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Availability */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Availability</h4>
                  <div className="space-y-2">
                    {[
                      { value: 'available', label: 'Available Now', color: 'bg-green-500' },
                      { value: 'busy', label: 'Partially Available', color: 'bg-yellow-500' },
                      { value: 'away', label: 'Not Available', color: 'bg-gray-400' },
                    ].map((status) => (
                      <label key={status.value} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedAvailability.includes(status.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedAvailability([...selectedAvailability, status.value]);
                            } else {
                              setSelectedAvailability(selectedAvailability.filter(s => s !== status.value));
                            }
                          }}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className={`w-2 h-2 rounded-full ${status.color}`} />
                        <span className="text-sm text-gray-700">{status.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Rating */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Seller Rating</h4>
                  <div className="space-y-2">
                    {[4.5, 4.0, 3.5, 0].map((rating) => (
                      <label key={rating} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="rating"
                          checked={minRating === rating}
                          onChange={() => setMinRating(rating)}
                          className="w-4 h-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        {rating > 0 ? (
                          <span className="flex items-center gap-1 text-sm text-gray-700">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            {rating}+ & up
                          </span>
                        ) : (
                          <span className="text-sm text-gray-700">All ratings</span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Languages */}
                {allLanguages.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Languages</h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {allLanguages.map((lang) => (
                        <label key={lang} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedLanguages.includes(lang)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedLanguages([...selectedLanguages, lang]);
                              } else {
                                setSelectedLanguages(selectedLanguages.filter(l => l !== lang));
                              }
                            }}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{lang}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1">
              {/* Toolbar */}
              <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="lg:hidden inline-flex items-center gap-2 bg-white border border-gray-300 hover:border-blue-500 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                    <span>Filters</span>
                    {activeFiltersCount > 0 && (
                      <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                        {activeFiltersCount}
                      </span>
                    )}
                  </button>

                  <span className="text-sm text-gray-600">
                    {filteredDevelopers.length} freelancers found
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  {/* Sort */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="relevance">Most Relevant</option>
                    <option value="rating">Highest Rated</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="newest">Newest</option>
                  </select>

                  {/* View Mode */}
                  <div className="hidden md:flex items-center border border-gray-300 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:bg-gray-50'}`}
                    >
                      <Grid className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:bg-gray-50'}`}
                    >
                      <List className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Active Filters */}
              {(selectedSkills.length > 0 || selectedAvailability.length > 0 || selectedLanguages.length > 0) && (
                <div className="mb-6 flex flex-wrap gap-2">
                  {selectedSkills.map(skill => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm"
                    >
                      {skill}
                      <button onClick={() => setSelectedSkills(selectedSkills.filter(s => s !== skill))}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {selectedAvailability.map(status => (
                    <span
                      key={status}
                      className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm"
                    >
                      {status}
                      <button onClick={() => setSelectedAvailability(selectedAvailability.filter(s => s !== status))}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {selectedLanguages.map(lang => (
                    <span
                      key={lang}
                      className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm"
                    >
                      {lang}
                      <button onClick={() => setSelectedLanguages(selectedLanguages.filter(l => l !== lang))}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Results Grid */}
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                </div>
              ) : error ? (
                <div className="text-center py-20 bg-white rounded-2xl">
                  <div className="text-red-500 mb-4">
                    <X className="w-16 h-16 mx-auto" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Failed to load developers</h3>
                  <p className="text-gray-600 mb-6">{error}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              ) : filteredDevelopers.length > 0 ? (
                <div className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
                    : 'space-y-4'
                }>
                  {filteredDevelopers.map((developer, index) => (
                    <DeveloperCard key={developer.id} developer={developer} index={index} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-white rounded-2xl">
                  <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">No freelancers found</h3>
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

              {/* Load More */}
              {filteredDevelopers.length > 0 && filteredDevelopers.length >= 12 && (
                <div className="mt-8 text-center">
                  <button className="bg-white border-2 border-gray-200 text-gray-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
                    Load More Freelancers
                  </button>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default BrowsePage;
