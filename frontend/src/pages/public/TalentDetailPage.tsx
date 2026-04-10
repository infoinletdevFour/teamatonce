import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Star,
  MapPin,
  Briefcase,
  Clock,
  TrendingUp,
  CheckCircle2,
  MessageSquare,
  Heart,
  Share2,
  Globe,
  Award,
  DollarSign,
  ArrowLeft,
  Check,
  Loader2,
  GraduationCap,
  Calendar,
  ExternalLink,
  Github,
  Linkedin,
  Twitter,
  Shield,
  BadgeCheck,
  Timer,
  Package,
} from 'lucide-react';
import UnifiedHeader from '../../components/layout/UnifiedHeader';
import Footer from '../../components/layout/Footer';
import publicService, { PublicDeveloperDetail } from '@/services/publicService';
import { toast, Toaster } from 'sonner';

const TalentDetailPage: React.FC = () => {
  const { developerId } = useParams<{ developerId: string }>();
  const navigate = useNavigate();
  const [developer, setDeveloper] = useState<PublicDeveloperDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  useEffect(() => {
    const fetchDeveloper = async () => {
      if (!developerId) {
        setError('Developer ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await publicService.getDeveloperById(developerId);

        if (!data) {
          setError('Developer not found');
          setDeveloper(null);
        } else {
          setDeveloper(data);
          setError(null);
        }
      } catch (err: any) {
        console.error('Error fetching developer:', err);
        setError(err.message || 'Failed to load developer');
        setDeveloper(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDeveloper();
  }, [developerId]);

  const handleLike = () => {
    setIsLiked(!isLiked);
    toast.success(isLiked ? 'Removed from favorites' : 'Added to favorites');
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
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading developer profile...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  // Error or not found state
  if (error || !developer) {
    return (
      <>
        <UnifiedHeader />
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center pt-32">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Developer Not Found</h1>
            <p className="text-gray-600 mb-8">
              {error || "The developer you're looking for doesn't exist."}
            </p>
            <button
              onClick={() => navigate('/browse-talent')}
              className="bg-gradient-to-r from-sky-800 via-sky-700 to-sky-600 text-white px-8 py-3 rounded-xl font-bold hover:shadow-xl transition-all"
            >
              Browse All Developers
            </button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const availabilityColors: Record<string, string> = {
    available: 'bg-green-100 text-green-700 border-green-200',
    busy: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    away: 'bg-red-100 text-red-700 border-red-200',
  };

  const availabilityLabels: Record<string, string> = {
    available: 'Available',
    busy: 'Busy',
    away: 'Away',
  };

  return (
    <>
      <UnifiedHeader />

      <div className="min-h-screen pt-20">
        {/* Cover Image */}
        {developer.coverImage && developer.coverImage.trim() !== '' && (
          <div className="relative h-64 md:h-80 overflow-hidden">
            <img
              src={developer.coverImage}
              alt="Cover"
              className="w-full h-full object-cover"
            />
            {/* Light overlay only at bottom for text area */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/30" />
          </div>
        )}

        {/* Hero Section */}
        <section className={`${developer.coverImage && developer.coverImage.trim() !== '' ? 'relative -mt-32 bg-gradient-to-b from-sky-800/80 via-sky-700/85 to-sky-600/90 backdrop-blur-sm' : 'bg-gradient-to-r from-sky-800 via-sky-700 to-sky-600'} pb-10 px-4 sm:px-6 lg:px-8 pt-8`}>
          <div className="max-w-7xl mx-auto">
            {/* Back Button */}
            <Link
              to="/browse-talent"
              className={`inline-flex items-center space-x-2 ${developer.coverImage ? 'text-white drop-shadow-lg' : 'text-white/80 hover:text-white'} mb-6 transition-colors`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back to Browse</span>
            </Link>

            <div className="flex flex-col md:flex-row gap-8 items-start">
              {/* Avatar */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex-shrink-0"
              >
                <img
                  src={developer.avatar}
                  alt={developer.name}
                  className={`w-32 h-32 rounded-2xl object-cover ring-4 ${developer.coverImage ? 'ring-white' : 'ring-white/20'} shadow-2xl`}
                  onError={(e) => {
                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      developer.name
                    )}&size=256&background=3b82f6&color=fff&bold=true`;
                  }}
                />
              </motion.div>

              {/* Info */}
              <div className="flex-1">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <h1 className={`text-3xl md:text-4xl font-black text-white ${developer.coverImage ? 'drop-shadow-lg' : ''}`}>
                      {developer.name}
                    </h1>
                    {developer.verified && (
                      <div className="flex items-center gap-1 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                        <BadgeCheck className="w-4 h-4" />
                        Verified
                      </div>
                    )}
                    {developer.topRated && (
                      <div className="flex items-center gap-1 bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                        <Star className="w-4 h-4 fill-white" />
                        Top Rated
                      </div>
                    )}
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        developer.coverImage
                          ? (availabilityColors[developer.availability] || 'bg-gray-100 text-gray-700 border border-gray-200')
                          : (developer.availability === 'available'
                              ? 'bg-green-500 text-white border border-green-400'
                              : developer.availability === 'busy'
                              ? 'bg-yellow-500 text-white border border-yellow-400'
                              : 'bg-gray-500 text-white border border-gray-400')
                      }`}
                    >
                      {availabilityLabels[developer.availability] || developer.availability}
                    </span>
                  </div>

                  <p className={`text-xl font-semibold mb-2 ${developer.coverImage ? 'text-white/90 drop-shadow-md' : 'text-white'}`}>{developer.title}</p>
                  {developer.tagline && (
                    <p className={`text-lg mb-4 italic ${developer.coverImage ? 'text-white/80 drop-shadow-md' : 'text-white/95'}`}>"{developer.tagline}"</p>
                  )}

                  {/* Stats */}
                  <div className={`flex flex-wrap items-center gap-6 mb-6 ${developer.coverImage ? 'text-white/80' : 'text-white'}`}>
                    {developer.reviewsCount > 0 ? (
                      <div className="flex items-center space-x-2">
                        <Star className="w-5 h-5 text-yellow-300 fill-yellow-300" />
                        <span className="font-bold text-white">{developer.rating}</span>
                        <span className="text-sm">({developer.reviewsCount} reviews)</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium text-white">
                          New Seller
                        </span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-5 h-5" />
                      <span className="text-sm">{developer.location}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Briefcase className="w-5 h-5" />
                      <span className="text-sm">{developer.completedProjects} projects</span>
                    </div>
                    {developer.responseTime && (
                      <div className="flex items-center space-x-2">
                        <Clock className="w-5 h-5" />
                        <span className="text-sm">{developer.responseTime}</span>
                      </div>
                    )}
                    {developer.timezone && (
                      <div className="flex items-center space-x-2">
                        <Globe className="w-5 h-5" />
                        <span className="text-sm">{developer.timezone}</span>
                      </div>
                    )}
                  </div>

                  {/* Hourly Rate */}
                  <div className="flex items-baseline space-x-2 mb-6">
                    <span className="text-4xl font-black text-white">
                      ${developer.hourlyRate}
                    </span>
                    <span className={developer.coverImage ? 'text-white/80' : 'text-white'}>/hour</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => navigate(`/developer/${developerId}/hire`)}
                      className="bg-white text-blue-600 px-8 py-3 rounded-xl font-bold shadow-xl hover:shadow-2xl transition-all flex items-center space-x-2"
                    >
                      <MessageSquare className="w-5 h-5" />
                      <span>Hire Now</span>
                    </motion.button>
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
        <section className="py-8 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Main Info */}
              <div className="lg:col-span-2 space-y-6">
                {/* About */}
                {developer.bio && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="bg-white rounded-2xl shadow-lg p-6"
                  >
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">About</h2>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">{developer.bio}</p>
                  </motion.div>
                )}

                {/* Skills */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="bg-white rounded-2xl shadow-lg p-6"
                >
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Skills & Expertise</h2>
                  <div className="flex flex-wrap gap-3">
                    {developer.skills.map((skill, index) => {
                      const skillName = typeof skill === 'string' ? skill : skill.name;
                      return (
                        <motion.span
                          key={skillName || index}
                          initial={{ opacity: 0, scale: 0.8 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: index * 0.05 }}
                          className="bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-semibold border border-blue-200 hover:shadow-md transition-all"
                        >
                          {skillName}
                        </motion.span>
                      );
                    })}
                  </div>
                </motion.div>

                {/* Languages */}
                {developer.languages && developer.languages.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="bg-white rounded-2xl shadow-lg p-6"
                  >
                    <div className="flex items-center space-x-3 mb-4">
                      <Globe className="w-6 h-6 text-blue-600" />
                      <h2 className="text-2xl font-bold text-gray-900">Languages</h2>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {developer.languages.map((language, index) => {
                        const languageName = typeof language === 'string' ? language : language.name;
                        return (
                          <span
                            key={languageName || index}
                            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium"
                          >
                            {languageName}
                          </span>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* Portfolio */}
                {developer.portfolio && developer.portfolio.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="bg-white rounded-2xl shadow-lg p-6"
                  >
                    <div className="flex items-center space-x-3 mb-6">
                      <Briefcase className="w-6 h-6 text-blue-600" />
                      <h2 className="text-2xl font-bold text-gray-900">Portfolio</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {developer.portfolio.map((item, index) => (
                        <motion.div
                          key={item.id || index}
                          initial={{ opacity: 0, scale: 0.95 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: index * 0.1 }}
                          className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl overflow-hidden border-2 border-gray-200 hover:border-blue-300 transition-all hover:shadow-lg"
                        >
                          {item.imageUrl && (
                            <div className="relative h-48 overflow-hidden">
                              <img
                                src={item.imageUrl}
                                alt={item.title}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                            </div>
                          )}
                          <div className="p-5">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="text-lg font-bold text-gray-900">{item.title}</h3>
                              {item.projectUrl && (
                                <a
                                  href={item.projectUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-700"
                                >
                                  <ExternalLink className="w-5 h-5" />
                                </a>
                              )}
                            </div>
                            <p className="text-gray-700 text-sm mb-3 line-clamp-2">{item.description}</p>
                            {item.technologies && item.technologies.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-3">
                                {item.technologies.map((tech, idx) => (
                                  <span
                                    key={idx}
                                    className="bg-white border border-blue-200 text-blue-700 px-2 py-1 rounded-full text-xs font-semibold"
                                  >
                                    {tech}
                                  </span>
                                ))}
                              </div>
                            )}
                            {item.completedDate && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Calendar className="w-4 h-4" />
                                {new Date(item.completedDate).toLocaleDateString('en-US', {
                                  month: 'long',
                                  year: 'numeric',
                                })}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Work Experience */}
                {developer.experience && developer.experience.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="bg-white rounded-2xl shadow-lg p-6"
                  >
                    <div className="flex items-center space-x-3 mb-6">
                      <Briefcase className="w-6 h-6 text-blue-600" />
                      <h2 className="text-2xl font-bold text-gray-900">Work Experience</h2>
                    </div>
                    <div className="space-y-6">
                      {developer.experience.map((exp, index) => (
                        <motion.div
                          key={exp.id || index}
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: index * 0.1 }}
                          className="border-l-4 border-blue-500 pl-6 pb-6 last:pb-0 relative"
                        >
                          <div className="absolute -left-2 top-0 w-4 h-4 bg-blue-500 rounded-full border-4 border-white" />
                          <h3 className="text-lg font-bold text-gray-900">{exp.position}</h3>
                          <p className="text-blue-600 font-semibold mb-2">{exp.company}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                            <Calendar className="w-4 h-4" />
                            {new Date(exp.startDate).toLocaleDateString('en-US', {
                              month: 'short',
                              year: 'numeric',
                            })}{' '}
                            -{' '}
                            {exp.current
                              ? 'Present'
                              : new Date(exp.endDate).toLocaleDateString('en-US', {
                                  month: 'short',
                                  year: 'numeric',
                                })}
                          </div>
                          {exp.description && (
                            <p className="text-gray-700 text-sm leading-relaxed">{exp.description}</p>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Education */}
                {developer.education && developer.education.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="bg-white rounded-2xl shadow-lg p-6"
                  >
                    <div className="flex items-center space-x-3 mb-6">
                      <GraduationCap className="w-6 h-6 text-blue-600" />
                      <h2 className="text-2xl font-bold text-gray-900">Education</h2>
                    </div>
                    <div className="space-y-6">
                      {developer.education.map((edu, index) => (
                        <motion.div
                          key={edu.id || index}
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: index * 0.1 }}
                          className="border-l-4 border-purple-500 pl-6 pb-6 last:pb-0 relative"
                        >
                          <div className="absolute -left-2 top-0 w-4 h-4 bg-purple-500 rounded-full border-4 border-white" />
                          <h3 className="text-lg font-bold text-gray-900">
                            {edu.degree} in {edu.field}
                          </h3>
                          <p className="text-purple-600 font-semibold mb-2">{edu.institution}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                            <Calendar className="w-4 h-4" />
                            {new Date(edu.startDate).toLocaleDateString('en-US', {
                              month: 'short',
                              year: 'numeric',
                            })}{' '}
                            -{' '}
                            {new Date(edu.endDate).toLocaleDateString('en-US', {
                              month: 'short',
                              year: 'numeric',
                            })}
                          </div>
                          {edu.description && (
                            <p className="text-gray-700 text-sm leading-relaxed">{edu.description}</p>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Certifications */}
                {developer.certifications && developer.certifications.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="bg-white rounded-2xl shadow-lg p-6"
                  >
                    <div className="flex items-center space-x-3 mb-6">
                      <Award className="w-6 h-6 text-blue-600" />
                      <h2 className="text-2xl font-bold text-gray-900">Certifications</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {developer.certifications.map((cert, index) => (
                        <motion.div
                          key={cert.id || index}
                          initial={{ opacity: 0, scale: 0.95 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: index * 0.1 }}
                          className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl p-4 hover:shadow-md transition-all"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="text-base font-bold text-gray-900">{cert.name}</h3>
                            {cert.url && (
                              <a
                                href={cert.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                          <p className="text-sm text-gray-700 font-semibold mb-2">{cert.issuer}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            Issued:{' '}
                            {new Date(cert.date).toLocaleDateString('en-US', {
                              month: 'short',
                              year: 'numeric',
                            })}
                          </div>
                          {cert.expiresAt && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                              <Timer className="w-4 h-4" />
                              Expires:{' '}
                              {new Date(cert.expiresAt).toLocaleDateString('en-US', {
                                month: 'short',
                                year: 'numeric',
                              })}
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Reviews Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="bg-white rounded-2xl shadow-lg p-6"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center space-x-4">
                      <h2 className="text-2xl font-bold text-gray-900">
                        Client Reviews ({developer.reviewsCount})
                      </h2>
                      {developer.rating > 0 && (
                        <div className="flex items-center space-x-2 bg-yellow-50 px-4 py-2 rounded-lg">
                          <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                          <span className="text-xl font-bold text-gray-900">{developer.rating}</span>
                          <span className="text-sm text-gray-600">average</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {developer.reviews && developer.reviews.length > 0 ? (
                    <div className="space-y-6">
                      {developer.reviews.map((review, index) => (
                        <motion.div
                          key={review.id}
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: index * 0.1 }}
                          className="border-b border-gray-100 pb-6 last:border-0"
                        >
                          <div className="flex items-start space-x-4">
                            {/* Avatar */}
                            <img
                              src={
                                review.clientAvatar ||
                                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                  review.clientName
                                )}&background=3b82f6&color=fff&size=128`
                              }
                              alt={review.clientName}
                              className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-100"
                            />

                            <div className="flex-1">
                              {/* Header */}
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h4 className="font-bold text-gray-900">{review.clientName}</h4>
                                  {review.projectTitle && (
                                    <p className="text-sm text-gray-600">{review.projectTitle}</p>
                                  )}
                                </div>
                                <div className="flex items-center space-x-1">
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

                              {/* Comment */}
                              <p className="text-gray-700 leading-relaxed mb-2">{review.comment}</p>

                              {/* Date */}
                              <p className="text-sm text-gray-500">{review.date}</p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <Star className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No reviews yet</p>
                    </div>
                  )}
                </motion.div>
              </div>

              {/* Right Column - Stats & Info */}
              <div className="space-y-6">
                {/* Quick Stats */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="bg-white rounded-2xl shadow-lg p-6"
                >
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Stats</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Completed Projects</p>
                          <p className="font-bold text-gray-900">
                            {developer.completedProjects}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                          <Award className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Total Reviews</p>
                          <p className="font-bold text-gray-900">{developer.reviewsCount}</p>
                        </div>
                      </div>
                    </div>

                    {developer.successRate !== undefined && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Success Rate</p>
                            <p className="font-bold text-gray-900">{developer.successRate}%</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {developer.onTimeDelivery !== undefined && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Clock className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">On-Time Delivery</p>
                            <p className="font-bold text-gray-900">{developer.onTimeDelivery}%</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {developer.totalEarnings !== undefined && developer.totalEarnings > 0 && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                            <Package className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Total Earnings</p>
                            <p className="font-bold text-gray-900">
                              ${developer.totalEarnings.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Social Links */}
                {developer.socialLinks && Object.values(developer.socialLinks).some((v) => v) && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="bg-white rounded-2xl shadow-lg p-6"
                  >
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Connect</h3>
                    <div className="space-y-3">
                      {developer.socialLinks.github && (
                        <a
                          href={developer.socialLinks.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-3 text-gray-700 hover:text-blue-600 transition-colors"
                        >
                          <Github className="w-5 h-5" />
                          <span className="text-sm font-medium">GitHub</span>
                        </a>
                      )}
                      {developer.socialLinks.linkedin && (
                        <a
                          href={developer.socialLinks.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-3 text-gray-700 hover:text-blue-600 transition-colors"
                        >
                          <Linkedin className="w-5 h-5" />
                          <span className="text-sm font-medium">LinkedIn</span>
                        </a>
                      )}
                      {developer.socialLinks.twitter && (
                        <a
                          href={developer.socialLinks.twitter}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-3 text-gray-700 hover:text-blue-600 transition-colors"
                        >
                          <Twitter className="w-5 h-5" />
                          <span className="text-sm font-medium">Twitter</span>
                        </a>
                      )}
                      {developer.socialLinks.website && (
                        <a
                          href={developer.socialLinks.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-3 text-gray-700 hover:text-blue-600 transition-colors"
                        >
                          <Globe className="w-5 h-5" />
                          <span className="text-sm font-medium">Website</span>
                        </a>
                      )}
                      {developer.socialLinks.portfolio && (
                        <a
                          href={developer.socialLinks.portfolio}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-3 text-gray-700 hover:text-blue-600 transition-colors"
                        >
                          <ExternalLink className="w-5 h-5" />
                          <span className="text-sm font-medium">Portfolio</span>
                        </a>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Pricing */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="bg-gradient-to-br from-sky-800 via-sky-700 to-sky-600 rounded-2xl shadow-lg p-6 text-white"
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <DollarSign className="w-6 h-6" />
                    <h3 className="text-lg font-bold">Pricing</h3>
                  </div>
                  <div className="mb-6">
                    <div className="text-4xl font-black mb-2">
                      ${developer.hourlyRate}
                      <span className="text-lg font-normal text-white/80">/hour</span>
                    </div>
                    <p className="text-white/80 text-sm">Competitive market rate</p>
                  </div>
                  <button
                    onClick={() => navigate(`/developer/${developerId}/hire`)}
                    className="w-full bg-white text-blue-600 py-3 rounded-xl font-bold hover:shadow-xl transition-all"
                  >
                    Hire Now
                  </button>
                </motion.div>

                {/* Safety Badge */}
                {developer.verified && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="bg-white rounded-2xl shadow-lg p-6 border-2 border-green-200"
                  >
                    <div className="flex items-start space-x-3">
                      <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-bold text-gray-900 mb-2">Verified Professional</h3>
                        <p className="text-sm text-gray-600">
                          This developer has been verified and vetted by our team. All skills and
                          credentials have been confirmed.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Top Rated Badge */}
                {developer.topRated && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl shadow-lg p-6 border-2 border-yellow-300"
                  >
                    <div className="flex items-start space-x-3">
                      <Star className="w-6 h-6 text-yellow-600 fill-yellow-600 flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-bold text-gray-900 mb-2">Top Rated Seller</h3>
                        <p className="text-sm text-gray-600">
                          This developer is among the top performers on our platform with
                          exceptional ratings and reviews.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Member Since */}
                {developer.joinedDate && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="bg-white rounded-2xl shadow-lg p-6"
                  >
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-6 h-6 text-blue-600" />
                      <div>
                        <h3 className="font-bold text-gray-900 mb-1">Member Since</h3>
                        <p className="text-sm text-gray-600">
                          {new Date(developer.joinedDate).toLocaleDateString('en-US', {
                            month: 'long',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      <Footer />
      <Toaster position="top-right" richColors />
    </>
  );
};

export default TalentDetailPage;
