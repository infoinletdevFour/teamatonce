import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Star, Clock, RefreshCcw, ChevronLeft, ChevronRight,
  Heart, Share2, Flag, MapPin, Calendar,
  Globe, CheckCircle2, Zap, ShieldCheck, ChevronDown, Play
} from 'lucide-react';
import { Gig, GigReview, DELIVERY_TIME_LABELS, REVISION_LABELS } from '@/types/gig';
import { gigService } from '@/services/gigService';
import { getCategoryById, getSubcategoryById } from '@/config/service-categories';
import { useAuth } from '@/contexts/AuthContext';

const GigDetail: React.FC = () => {
  const { gigId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [gig, setGig] = useState<Gig | null>(null);
  const [reviews, setReviews] = useState<GigReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<'basic' | 'standard' | 'premium'>('standard');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [expandedFAQs, setExpandedFAQs] = useState<string[]>([]);
  const [showAllReviews, setShowAllReviews] = useState(false);

  const loadGig = useCallback(async () => {
    try {
      setLoading(true);
      const [gigData, reviewsData] = await Promise.all([
        gigService.getGigById(gigId!),
        gigService.getGigReviews(gigId!, 1, 5),
      ]);
      setGig(gigData);
      setReviews(reviewsData.reviews);
    } catch (error) {
      console.error('Error loading gig:', error);
    } finally {
      setLoading(false);
    }
  }, [gigId]);

  useEffect(() => {
    if (gigId) {
      loadGig();
    }
  }, [gigId, loadGig]);

  const handleOrder = () => {
    if (!user) {
      navigate('/auth/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }
    navigate(`/gigs/${gigId}/order?package=${selectedPackage}`);
  };

  const toggleFAQ = (faqId: string) => {
    setExpandedFAQs(prev =>
      prev.includes(faqId) ? prev.filter(id => id !== faqId) : [...prev, faqId]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading gig...</p>
        </div>
      </div>
    );
  }

  if (!gig) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Gig not found</h2>
          <p className="text-gray-600 mb-6">This gig may have been removed or is no longer available.</p>
          <button
            onClick={() => navigate('/gigs')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Browse Gigs
          </button>
        </div>
      </div>
    );
  }

  const category = getCategoryById(gig.categoryId);
  const subcategory = getSubcategoryById(gig.categoryId, gig.subcategoryId);
  const currentPackage = gig.packages.find(p => p.name === selectedPackage) || gig.packages[0];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <button onClick={() => navigate('/gigs')} className="hover:text-blue-600">
            All Services
          </button>
          <ChevronRight className="w-4 h-4" />
          {category && (
            <>
              <button
                onClick={() => navigate(`/gigs?category=${category.id}`)}
                className="hover:text-blue-600 flex items-center gap-1"
              >
                <span>{category.icon}</span>
                {category.name}
              </button>
              <ChevronRight className="w-4 h-4" />
            </>
          )}
          {subcategory && (
            <span className="text-gray-900">{subcategory.name}</span>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1">
            {/* Title */}
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              {gig.title}
            </h1>

            {/* Seller Info Bar */}
            {gig.freelancer && (
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white font-bold text-lg">
                  {gig.freelancer.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{gig.freelancer.name}</p>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    {gig.rating > 0 && (
                      <span className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        {gig.rating.toFixed(1)}
                        <span className="text-gray-400">({gig.reviewCount})</span>
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {gig.freelancer.location}
                    </span>
                  </div>
                </div>
                <button className="ml-auto text-blue-600 font-medium hover:text-blue-700">
                  Contact Me
                </button>
              </div>
            )}

            {/* Image Gallery */}
            <div className="mb-8">
              <div className="relative aspect-video bg-gray-200 rounded-xl overflow-hidden mb-4">
                {gig.images.length > 0 ? (
                  <>
                    <img
                      src={gig.images[currentImageIndex].url}
                      alt={gig.title}
                      className="w-full h-full object-cover"
                    />
                    {gig.images.length > 1 && (
                      <>
                        <button
                          onClick={() => setCurrentImageIndex(prev => (prev - 1 + gig.images.length) % gig.images.length)}
                          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
                        >
                          <ChevronLeft className="w-6 h-6" />
                        </button>
                        <button
                          onClick={() => setCurrentImageIndex(prev => (prev + 1) % gig.images.length)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
                        >
                          <ChevronRight className="w-6 h-6" />
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-8xl">{category?.icon || '📦'}</span>
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {gig.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {gig.images.map((image, index) => (
                    <button
                      key={image.id}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-colors ${
                        index === currentImageIndex ? 'border-blue-500' : 'border-transparent'
                      }`}
                    >
                      <img
                        src={image.thumbnailUrl || image.url}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                  {gig.video && (
                    <button className="flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 border-transparent bg-gray-800 flex items-center justify-center">
                      <Play className="w-6 h-6 text-white" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* About This Gig */}
            <div className="bg-white rounded-xl border-2 border-gray-100 p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">About This Gig</h2>
              <div className="prose prose-gray max-w-none">
                <p className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                  {gig.description}
                </p>
              </div>
            </div>

            {/* About The Seller */}
            {gig.freelancer && (
              <div className="bg-white rounded-xl border-2 border-gray-100 p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">About The Seller</h2>
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white font-bold text-2xl">
                    {gig.freelancer.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 text-lg">{gig.freelancer.name}</p>
                    <p className="text-gray-600 mb-3">{gig.freelancer.title}</p>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                      {gig.freelancer.rating > 0 && (
                        <span className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          {gig.freelancer.rating.toFixed(1)}
                          <span className="text-gray-400">({gig.freelancer.reviewCount} reviews)</span>
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {gig.freelancer.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Member since {new Date(gig.freelancer.memberSince).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Avg. response: {gig.freelancer.responseTime}
                      </span>
                    </div>
                    {gig.freelancer.languages.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {gig.freelancer.languages.join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                  <button className="px-6 py-2 border-2 border-gray-200 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                    Contact Me
                  </button>
                </div>
              </div>
            )}

            {/* FAQ */}
            {gig.faqs.length > 0 && (
              <div className="bg-white rounded-xl border-2 border-gray-100 p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">FAQ</h2>
                <div className="space-y-3">
                  {gig.faqs.map((faq) => (
                    <div key={faq.id} className="border-b border-gray-100 last:border-0 pb-3 last:pb-0">
                      <button
                        onClick={() => toggleFAQ(faq.id)}
                        className="w-full flex items-center justify-between py-2 text-left"
                      >
                        <span className="font-medium text-gray-900">{faq.question}</span>
                        <ChevronDown
                          className={`w-5 h-5 text-gray-400 transition-transform ${
                            expandedFAQs.includes(faq.id) ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      <AnimatePresence>
                        {expandedFAQs.includes(faq.id) && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <p className="text-gray-600 pb-2">{faq.answer}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            {reviews.length > 0 && (
              <div className="bg-white rounded-xl border-2 border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Reviews</h2>
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-bold text-gray-900">{gig.rating.toFixed(1)}</span>
                    <span className="text-gray-500">({gig.reviewCount} reviews)</span>
                  </div>
                </div>

                <div className="space-y-6">
                  {reviews.slice(0, showAllReviews ? undefined : 3).map((review) => (
                    <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-teal-400 flex items-center justify-center text-white font-bold">
                          {review.buyer?.name?.charAt(0) || 'U'}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="font-medium text-gray-900">{review.buyer?.name || 'Anonymous'}</p>
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                {review.buyer?.location && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {review.buyer.location}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < review.rating
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-gray-700 mb-2">{review.comment}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </p>
                          {review.freelancerResponse && (
                            <div className="mt-4 pl-4 border-l-2 border-gray-200">
                              <p className="text-sm font-medium text-gray-900 mb-1">Seller's Response</p>
                              <p className="text-sm text-gray-600">{review.freelancerResponse}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {reviews.length > 3 && (
                  <button
                    onClick={() => setShowAllReviews(!showAllReviews)}
                    className="mt-4 w-full py-3 text-blue-600 font-medium hover:text-blue-700"
                  >
                    {showAllReviews ? 'Show Less' : `See All ${gig.reviewCount} Reviews`}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Sidebar - Pricing */}
          <div className="w-full lg:w-96 flex-shrink-0">
            <div className="sticky top-4">
              <div className="bg-white rounded-xl border-2 border-gray-100 overflow-hidden shadow-lg">
                {/* Package Tabs */}
                <div className="flex border-b border-gray-100">
                  {gig.packages.map((pkg) => (
                    <button
                      key={pkg.name}
                      onClick={() => setSelectedPackage(pkg.name)}
                      className={`flex-1 py-4 font-semibold capitalize transition-colors ${
                        selectedPackage === pkg.name
                          ? 'bg-white text-gray-900 border-b-2 border-blue-600'
                          : 'bg-gray-50 text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {pkg.name}
                    </button>
                  ))}
                </div>

                {/* Package Details */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xl font-bold text-gray-900">{currentPackage.title}</span>
                    <span className="text-3xl font-bold text-gray-900">${currentPackage.price}</span>
                  </div>

                  <p className="text-gray-600 mb-6">{currentPackage.description}</p>

                  <div className="flex items-center gap-6 mb-6">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-5 h-5" />
                      <span>{DELIVERY_TIME_LABELS[currentPackage.deliveryTime]} Delivery</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <RefreshCcw className="w-5 h-5" />
                      <span>{REVISION_LABELS[currentPackage.revisions]}</span>
                    </div>
                  </div>

                  {/* Features */}
                  {currentPackage.features.length > 0 && (
                    <div className="mb-6">
                      <ul className="space-y-2">
                        {currentPackage.features.map((feature, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <button
                    onClick={handleOrder}
                    className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl hover:from-green-600 hover:to-emerald-600 transition-colors shadow-lg"
                  >
                    Continue (${currentPackage.price})
                  </button>

                  <button className="w-full mt-3 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors">
                    Contact Seller
                  </button>
                </div>
              </div>

              {/* Trust Signals */}
              <div className="mt-4 bg-white rounded-xl border-2 border-gray-100 p-4">
                <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
                  <ShieldCheck className="w-5 h-5 text-green-500" />
                  <span>Money back guarantee</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  <span>Fast response time</span>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 flex items-center justify-center gap-6 text-sm text-gray-500">
                <button className="flex items-center gap-1 hover:text-gray-700">
                  <Heart className="w-4 h-4" />
                  Save
                </button>
                <button className="flex items-center gap-1 hover:text-gray-700">
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
                <button className="flex items-center gap-1 hover:text-gray-700">
                  <Flag className="w-4 h-4" />
                  Report
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GigDetail;
