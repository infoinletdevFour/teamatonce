import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search, Grid, List, Star,
  ChevronDown, ChevronRight, SlidersHorizontal, Heart,
  Sparkles, TrendingUp
} from 'lucide-react';
import { Gig, GigSearchParams, DeliveryTime } from '@/types/gig';
import { gigService } from '@/services/gigService';
import {
  SERVICE_CATEGORIES,
  getCategoryById, getSubcategoryById, getPopularSubcategories
} from '@/config/service-categories';
import { SEO } from '@/components/SEO';

const BrowseGigs: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // State
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('category') || '');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>(searchParams.get('subcategory') || '');
  const [priceRange, setPriceRange] = useState<[number, number]>([5, 1000]);
  const [deliveryTime, setDeliveryTime] = useState<DeliveryTime | ''>('');
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'relevance' | 'best_selling' | 'newest' | 'price_low' | 'price_high'>('relevance');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  // Featured & trending
  const [featuredGigs, setFeaturedGigs] = useState<Gig[]>([]);
  const [trendingGigs, setTrendingGigs] = useState<Gig[]>([]);
  const popularServices = getPopularSubcategories().slice(0, 8);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    searchGigs();
  }, [selectedCategory, selectedSubcategory, priceRange, deliveryTime, minRating, sortBy, currentPage]);

  const loadInitialData = async () => {
    try {
      const [featured, trending] = await Promise.all([
        gigService.getFeaturedGigs(6),
        gigService.getTrendingGigs(6),
      ]);
      setFeaturedGigs(featured);
      setTrendingGigs(trending);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const searchGigs = async () => {
    try {
      setLoading(true);
      const params: GigSearchParams = {
        query: searchQuery,
        categoryId: selectedCategory,
        subcategoryId: selectedSubcategory,
        minPrice: priceRange[0],
        maxPrice: priceRange[1],
        deliveryTime: deliveryTime || undefined,
        minRating: minRating || undefined,
        sortBy,
        page: currentPage,
        limit: 20,
      };

      const result = await gigService.searchGigs(params);
      setGigs(currentPage === 1 ? result.gigs : [...gigs, ...result.gigs]);
      setTotalResults(result.total);
      setHasMore(result.hasMore);
    } catch (error) {
      console.error('Error searching gigs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    searchGigs();
  };

  const handleCategorySelect = (categoryId: string, subcategoryId?: string) => {
    setSelectedCategory(categoryId);
    setSelectedSubcategory(subcategoryId || '');
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedSubcategory('');
    setPriceRange([5, 1000]);
    setDeliveryTime('');
    setMinRating(0);
    setSortBy('relevance');
    setCurrentPage(1);
  };

  const toggleCategoryExpand = (categoryId: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const category = getCategoryById(selectedCategory);
  const subcategory = getSubcategoryById(selectedCategory, selectedSubcategory);
  const activeFiltersCount = [
    selectedCategory,
    deliveryTime,
    minRating > 0,
    priceRange[0] > 5 || priceRange[1] < 1000,
  ].filter(Boolean).length;

  const GigCard: React.FC<{ gig: Gig; featured?: boolean }> = ({ gig, featured }) => {
    const gigCategory = getCategoryById(gig.categoryId);
    const lowestPrice = Math.min(...gig.packages.map(p => p.price));

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4 }}
        onClick={() => navigate(`/gigs/${gig.id}`)}
        className={`bg-white rounded-xl border-2 border-gray-100 overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group ${
          featured ? 'ring-2 ring-yellow-400' : ''
        }`}
      >
        {/* Image */}
        <div className="relative aspect-video bg-gradient-to-br from-blue-500 to-purple-600">
          {gig.images[0] ? (
            <img
              src={gig.images[0].url}
              alt={gig.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-6xl">{gigCategory?.icon || '📦'}</span>
            </div>
          )}
          {featured && (
            <div className="absolute top-3 left-3 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Featured
            </div>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); /* Handle favorite */ }}
            className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Heart className="w-4 h-4 text-gray-600 hover:text-red-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Freelancer */}
          {gig.freelancer && (
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white text-xs font-bold">
                {gig.freelancer.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{gig.freelancer.name}</p>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  {gig.freelancer.rating > 0 && (
                    <>
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <span>{gig.freelancer.rating.toFixed(1)}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Title */}
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {gig.title}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-2 mb-3">
            {gig.rating > 0 ? (
              <>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium text-gray-900">{gig.rating.toFixed(1)}</span>
                </div>
                <span className="text-gray-400">({gig.reviewCount})</span>
              </>
            ) : (
              <span className="text-sm text-gray-500">New</span>
            )}
          </div>

          {/* Price */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <span className="text-sm text-gray-500">From</span>
            <span className="text-lg font-bold text-gray-900">${lowestPrice}</span>
          </div>
        </div>
      </motion.div>
    );
  };

  // Build SEO meta tags
  const baseUrl = 'https://teamatonce.com';
  const categoryData = getCategoryById(selectedCategory);
  const subcategoryData = getSubcategoryById(selectedSubcategory);

  const canonicalUrl = selectedSubcategory
    ? `${baseUrl}/gigs?category=${selectedCategory}&subcategory=${selectedSubcategory}`
    : selectedCategory
    ? `${baseUrl}/gigs?category=${selectedCategory}`
    : `${baseUrl}/gigs`;

  const pageTitle = subcategoryData?.name
    ? `${subcategoryData.name} Services - Team@Once`
    : categoryData?.name
    ? `${categoryData.name} Services - Team@Once`
    : 'Browse Services & Gigs - Team@Once';

  const pageDescription = subcategoryData?.description ||
    (categoryData ? `Find expert ${categoryData.name.toLowerCase()} services on Team@Once. Browse verified professionals offering quality services.` : 'Browse and hire professionals for services and gigs across all categories on Team@Once.');

  // Determine if we should noindex (empty results with active filters)
  const hasActiveFilters = selectedCategory || selectedSubcategory || searchQuery || minRating > 0 || deliveryTime;
  const shouldNoindex = gigs.length === 0 && hasActiveFilters && !loading;

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO
        title={pageTitle}
        description={pageDescription}
        canonical={canonicalUrl}
        noindex={shouldNoindex}
      />
      {/* Search Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-6">
            Find the perfect service for your needs
          </h1>
          <form onSubmit={handleSearch} className="max-w-3xl mx-auto">
            <div className="flex bg-white rounded-xl overflow-hidden shadow-xl">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for any service..."
                className="flex-1 px-6 py-4 text-gray-900 focus:outline-none"
              />
              <button
                type="submit"
                className="px-8 py-4 bg-green-500 text-white font-semibold hover:bg-green-600 transition-colors"
              >
                Search
              </button>
            </div>
          </form>

          {/* Popular Services */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {popularServices.map((service) => (
              <button
                key={`${service.categoryId}-${service.id}`}
                onClick={() => handleCategorySelect(service.categoryId, service.id)}
                className="px-4 py-2 bg-white/20 backdrop-blur rounded-full text-sm font-medium hover:bg-white/30 transition-colors"
              >
                {service.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        {(selectedCategory || searchQuery) && (
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
            <button onClick={clearFilters} className="hover:text-blue-600">All Services</button>
            {category && (
              <>
                <ChevronRight className="w-4 h-4" />
                <button
                  onClick={() => handleCategorySelect(selectedCategory)}
                  className="hover:text-blue-600 flex items-center gap-1"
                >
                  <span>{category.icon}</span>
                  {category.name}
                </button>
              </>
            )}
            {subcategory && (
              <>
                <ChevronRight className="w-4 h-4" />
                <span className="text-gray-900 font-medium">{subcategory.name}</span>
              </>
            )}
            {searchQuery && (
              <>
                <ChevronRight className="w-4 h-4" />
                <span className="text-gray-900">Results for "{searchQuery}"</span>
              </>
            )}
          </div>
        )}

        <div className="flex gap-8">
          {/* Sidebar Filters */}
          <div className={`w-64 flex-shrink-0 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white rounded-xl border-2 border-gray-100 p-4 sticky top-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">Filters</h3>
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
                  {SERVICE_CATEGORIES.map((cat) => (
                    <div key={cat.id}>
                      <button
                        onClick={() => toggleCategoryExpand(cat.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                          selectedCategory === cat.id
                            ? 'bg-blue-50 text-blue-700'
                            : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span>{cat.icon}</span>
                          {cat.name}
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 transition-transform ${
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
                            <div className="pl-8 py-1 space-y-1">
                              {cat.subcategories.map((sub) => (
                                <button
                                  key={sub.id}
                                  onClick={() => handleCategorySelect(cat.id, sub.id)}
                                  className={`w-full px-3 py-1.5 rounded text-left text-sm transition-colors ${
                                    selectedSubcategory === sub.id
                                      ? 'bg-blue-100 text-blue-700 font-medium'
                                      : 'text-gray-600 hover:bg-gray-50'
                                  }`}
                                >
                                  {sub.name}
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Time Filter */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Delivery Time</h4>
                <select
                  value={deliveryTime}
                  onChange={(e) => setDeliveryTime(e.target.value as DeliveryTime | '')}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="">Any</option>
                  <option value="1_day">Up to 1 day</option>
                  <option value="3_days">Up to 3 days</option>
                  <option value="7_days">Up to 1 week</option>
                  <option value="14_days">Up to 2 weeks</option>
                  <option value="30_days">Up to 1 month</option>
                </select>
              </div>

              {/* Price Range Filter */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Budget</h4>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      min={5}
                      value={priceRange[0]}
                      onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                      className="w-full pl-7 pr-2 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <span className="text-gray-400">-</span>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      min={priceRange[0]}
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                      className="w-full pl-7 pr-2 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Rating Filter */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Seller Rating</h4>
                <div className="space-y-2">
                  {[4.5, 4.0, 3.5, 0].map((rating) => (
                    <label key={rating} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="rating"
                        checked={minRating === rating}
                        onChange={() => setMinRating(rating)}
                        className="w-4 h-4 text-blue-600"
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
            </div>
          </div>

          {/* Main Results */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-gray-600">
                  {totalResults.toLocaleString()} services available
                </span>
              </div>
              <div className="flex items-center gap-4">
                {/* Sort */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="relevance">Relevance</option>
                    <option value="best_selling">Best Selling</option>
                    <option value="newest">Newest</option>
                    <option value="price_low">Price: Low to High</option>
                    <option value="price_high">Price: High to Low</option>
                  </select>
                </div>

                {/* View Mode */}
                <div className="flex items-center border-2 border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-gray-400'}`}
                  >
                    <Grid className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'text-gray-400'}`}
                  >
                    <List className="w-5 h-5" />
                  </button>
                </div>

                {/* Mobile Filter Toggle */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden flex items-center gap-2 px-4 py-2 border-2 border-gray-200 rounded-lg text-gray-700"
                >
                  <SlidersHorizontal className="w-5 h-5" />
                  Filters
                  {activeFiltersCount > 0 && (
                    <span className="w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Featured Section (only on initial load) */}
            {!selectedCategory && !searchQuery && featuredGigs.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-yellow-500" />
                  <h2 className="text-xl font-bold text-gray-900">Featured Services</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {featuredGigs.slice(0, 3).map((gig) => (
                    <GigCard key={gig.id} gig={gig} featured />
                  ))}
                </div>
              </div>
            )}

            {/* Trending Section (only on initial load) */}
            {!selectedCategory && !searchQuery && trendingGigs.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  <h2 className="text-xl font-bold text-gray-900">Trending Now</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {trendingGigs.slice(0, 3).map((gig) => (
                    <GigCard key={gig.id} gig={gig} />
                  ))}
                </div>
              </div>
            )}

            {/* Results Grid */}
            {loading && gigs.length === 0 ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-gray-600">Loading services...</p>
                </div>
              </div>
            ) : gigs.length === 0 ? (
              <div className="text-center py-16">
                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No services found</h3>
                <p className="text-gray-600 mb-6">Try adjusting your search or filters</p>
                <button
                  onClick={clearFilters}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                <div
                  className={
                    viewMode === 'grid'
                      ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                      : 'space-y-4'
                  }
                >
                  {gigs.map((gig) => (
                    <GigCard key={gig.id} gig={gig} />
                  ))}
                </div>

                {/* Load More */}
                {hasMore && (
                  <div className="text-center mt-8">
                    <button
                      onClick={() => setCurrentPage(prev => prev + 1)}
                      disabled={loading}
                      className="px-8 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 disabled:opacity-50 transition-colors"
                    >
                      {loading ? 'Loading...' : 'Load More'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrowseGigs;
