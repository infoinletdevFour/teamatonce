import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Package, Eye, Edit2, Trash2, Pause, Play,
  DollarSign, ShoppingCart, Star, Search,
  MoreVertical, AlertCircle, CheckCircle2,
  Clock, MousePointerClick, BarChart3, ExternalLink
} from 'lucide-react';
import { Gig, GigStats, GigStatus } from '@/types/gig';
import { gigService } from '@/services/gigService';
import { getCategoryById, getSubcategoryById } from '@/config/service-categories';
import { useCompany } from '@/contexts/CompanyContext';

const MyGigs: React.FC = () => {
  const navigate = useNavigate();
  const { company } = useCompany();
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [stats, setStats] = useState<GigStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<GigStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [gigsData, statsData] = await Promise.all([
        gigService.getMyGigs(),
        gigService.getGigStats(),
      ]);
      setGigs(gigsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading gigs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePauseGig = async (gigId: string) => {
    try {
      const updated = await gigService.pauseGig(gigId);
      setGigs(gigs.map(g => g.id === gigId ? updated : g));
    } catch (error) {
      console.error('Error pausing gig:', error);
    }
    setActionMenuOpen(null);
  };

  const handleResumeGig = async (gigId: string) => {
    try {
      const updated = await gigService.resumeGig(gigId);
      setGigs(gigs.map(g => g.id === gigId ? updated : g));
    } catch (error) {
      console.error('Error resuming gig:', error);
    }
    setActionMenuOpen(null);
  };

  const handleDeleteGig = async (gigId: string) => {
    if (!confirm('Are you sure you want to delete this gig?')) return;
    try {
      await gigService.deleteGig(gigId);
      setGigs(gigs.filter(g => g.id !== gigId));
    } catch (error) {
      console.error('Error deleting gig:', error);
    }
    setActionMenuOpen(null);
  };

  const filteredGigs = gigs.filter(gig => {
    const matchesFilter = activeFilter === 'all' || gig.status === activeFilter;
    const matchesSearch = gig.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status: GigStatus) => {
    const styles: Record<GigStatus, { bg: string; text: string; icon: React.ReactNode }> = {
      active: { bg: 'bg-green-100', text: 'text-green-700', icon: <CheckCircle2 className="w-3 h-3" /> },
      paused: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: <Pause className="w-3 h-3" /> },
      draft: { bg: 'bg-gray-100', text: 'text-gray-700', icon: <Edit2 className="w-3 h-3" /> },
      pending_review: { bg: 'bg-blue-100', text: 'text-blue-700', icon: <Clock className="w-3 h-3" /> },
      rejected: { bg: 'bg-red-100', text: 'text-red-700', icon: <AlertCircle className="w-3 h-3" /> },
    };
    const style = styles[status];
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
        {style.icon}
        {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your gigs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Gigs</h1>
            <p className="text-gray-600">Create and manage your service offerings</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(`/company/${company?.id}/seller/gigs/create`)}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-shadow"
          >
            <Plus className="w-5 h-5" />
            Create New Gig
          </motion.button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8"
        >
          <div className="bg-white rounded-xl p-4 border-2 border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.activeGigs}</p>
                <p className="text-xs text-gray-500">Active Gigs</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border-2 border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">${stats.totalEarnings.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Total Earnings</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border-2 border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.completedOrders}</p>
                <p className="text-xs text-gray-500">Completed Orders</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border-2 border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Star className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.averageRating.toFixed(1)}</p>
                <p className="text-xs text-gray-500">Avg Rating</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border-2 border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
                <Eye className="w-5 h-5 text-cyan-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.impressions.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Impressions</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border-2 border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <MousePointerClick className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{(stats.conversionRate * 100).toFixed(1)}%</p>
                <p className="text-xs text-gray-500">Conversion</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Filters and Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl border-2 border-gray-100 p-4 mb-6"
      >
        <div className="flex flex-col md:flex-row items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search your gigs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Status Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
            {(['all', 'active', 'paused', 'draft', 'pending_review'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setActiveFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                  activeFilter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {status === 'all' ? 'All' : status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Gigs Grid */}
      {filteredGigs.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {gigs.length === 0 ? "You haven't created any gigs yet" : "No gigs match your filters"}
          </h3>
          <p className="text-gray-600 mb-6">
            {gigs.length === 0
              ? "Start selling your services by creating your first gig"
              : "Try adjusting your search or filter criteria"}
          </p>
          {gigs.length === 0 && (
            <button
              onClick={() => navigate(`/company/${company?.id}/seller/gigs/create`)}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Your First Gig
            </button>
          )}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredGigs.map((gig, index) => {
            const category = getCategoryById(gig.categoryId);
            const subcategory = getSubcategoryById(gig.categoryId, gig.subcategoryId);
            const lowestPrice = Math.min(...gig.packages.map(p => p.price));

            return (
              <motion.div
                key={gig.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="bg-white rounded-xl border-2 border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow group"
              >
                {/* Gig Image */}
                <div className="relative aspect-video bg-gradient-to-br from-blue-500 to-purple-600">
                  {gig.images[0] ? (
                    <img
                      src={gig.images[0].url}
                      alt={gig.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-6xl">{category?.icon || '📦'}</span>
                    </div>
                  )}
                  {/* Status Badge */}
                  <div className="absolute top-3 left-3">
                    {getStatusBadge(gig.status)}
                  </div>
                  {/* Quick Actions */}
                  <div className="absolute top-3 right-3">
                    <div className="relative">
                      <button
                        onClick={() => setActionMenuOpen(actionMenuOpen === gig.id ? null : gig.id)}
                        className="w-8 h-8 bg-white/90 backdrop-blur rounded-lg flex items-center justify-center hover:bg-white transition-colors"
                      >
                        <MoreVertical className="w-4 h-4 text-gray-600" />
                      </button>
                      <AnimatePresence>
                        {actionMenuOpen === gig.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10"
                          >
                            <button
                              onClick={() => navigate(`/company/${company?.id}/seller/gigs/${gig.id}/edit`)}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Edit2 className="w-4 h-4" />
                              Edit Gig
                            </button>
                            <button
                              onClick={() => window.open(`/gigs/${gig.id}`, '_blank')}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <ExternalLink className="w-4 h-4" />
                              View Live
                            </button>
                            {gig.status === 'active' && (
                              <button
                                onClick={() => handlePauseGig(gig.id)}
                                className="w-full px-4 py-2 text-left text-sm text-yellow-700 hover:bg-yellow-50 flex items-center gap-2"
                              >
                                <Pause className="w-4 h-4" />
                                Pause Gig
                              </button>
                            )}
                            {gig.status === 'paused' && (
                              <button
                                onClick={() => handleResumeGig(gig.id)}
                                className="w-full px-4 py-2 text-left text-sm text-green-700 hover:bg-green-50 flex items-center gap-2"
                              >
                                <Play className="w-4 h-4" />
                                Resume Gig
                              </button>
                            )}
                            <button
                              onClick={() => navigate(`/company/${company?.id}/seller/gigs/${gig.id}/analytics`)}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <BarChart3 className="w-4 h-4" />
                              Analytics
                            </button>
                            <hr className="my-1" />
                            <button
                              onClick={() => handleDeleteGig(gig.id)}
                              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete Gig
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                {/* Gig Content */}
                <div className="p-4">
                  {/* Category */}
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                    <span>{category?.icon}</span>
                    <span>{category?.name}</span>
                    <span>•</span>
                    <span>{subcategory?.name}</span>
                  </div>

                  {/* Title */}
                  <h3 className="font-semibold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {gig.title}
                  </h3>

                  {/* Stats Row */}
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      <span>{gig.impressions}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MousePointerClick className="w-4 h-4" />
                      <span>{gig.clicks}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ShoppingCart className="w-4 h-4" />
                      <span>{gig.orders}</span>
                    </div>
                    {gig.rating > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span>{gig.rating.toFixed(1)}</span>
                        <span className="text-gray-400">({gig.reviewCount})</span>
                      </div>
                    )}
                  </div>

                  {/* Price */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="text-sm text-gray-500">Starting at</span>
                    <span className="text-xl font-bold text-gray-900">${lowestPrice}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
};

export default MyGigs;
