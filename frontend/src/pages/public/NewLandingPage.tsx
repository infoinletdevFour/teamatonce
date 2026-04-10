import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, ArrowRight, CheckCircle2, Shield, Zap, Clock, DollarSign,
  Award, Star, BarChart3, X as XIcon, Upload, Brain, Target,
  Workflow, MessageSquare, Sparkles, Download, Briefcase, Loader2,
  Code, Layers, Cpu, Globe, Palette, HelpCircle, Plus, Minus
} from 'lucide-react';
import UnifiedHeader from '../../components/layout/UnifiedHeader';
import Footer from '../../components/layout/Footer';
import CategoryCard from '../../components/marketplace/CategoryCard';
import DeveloperCard from '../../components/marketplace/DeveloperCard';
import JobCard from '../../components/marketplace/JobCard';
import publicService from '@/services/publicService';
import type { PublicDeveloper, PublicJob, Testimonial, PublicFaq } from '@/services/publicService';
import { SKILL_CATEGORIES } from '@/constants/skills';
import { SEO } from '@/components/SEO';

const NewLandingPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState<'talent' | 'jobs'>('talent');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const navigate = useNavigate();

  // State for fetched data
  const [featuredDevelopers, setFeaturedDevelopers] = useState<PublicDeveloper[]>([]);
  const [featuredJobs, setFeaturedJobs] = useState<PublicJob[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [faqs, setFaqs] = useState<PublicFaq[]>([]);
  const [loading, setLoading] = useState(true);

  // FAQ Data - Using translations
  const faqItems = [
    {
      question: t('landing.faq.items.escrow.question'),
      answer: t('landing.faq.items.escrow.answer')
    },
    {
      question: t('landing.faq.items.dispute.question'),
      answer: t('landing.faq.items.dispute.answer')
    },
    {
      question: t('landing.faq.items.templates.question'),
      answer: t('landing.faq.items.templates.answer')
    },
    {
      question: t('landing.faq.items.team.question'),
      answer: t('landing.faq.items.team.answer')
    },
    {
      question: t('landing.faq.items.communication.question'),
      answer: t('landing.faq.items.communication.answer')
    },
    {
      question: t('landing.faq.items.bidding.question'),
      answer: t('landing.faq.items.bidding.answer')
    },
    {
      question: t('landing.faq.items.proofOfDelivery.question'),
      answer: t('landing.faq.items.proofOfDelivery.answer')
    },
    {
      question: t('landing.faq.items.fees.question'),
      answer: t('landing.faq.items.fees.answer')
    }
  ];

  // Icon mapping for categories (matching skills.ts categories)
  const categoryIconMap: Record<string, any> = {
    'graphics-design': Palette,
    'digital-marketing': BarChart3,
    'writing-translation': MessageSquare,
    'video-animation': Layers,
    'music-audio': Sparkles,
    'programming-tech': Code,
    'business': Briefcase,
    'data-analytics': BarChart3,
    'photography': Globe,
    'lifestyle': Star,
    'ai-services': Cpu,
  };

  // Color mapping for categories (matching skills.ts categories)
  const categoryColorMap: Record<string, string> = {
    'graphics-design': 'from-pink-500 to-rose-500',
    'digital-marketing': 'from-blue-500 to-cyan-500',
    'writing-translation': 'from-purple-500 to-indigo-500',
    'video-animation': 'from-red-500 to-orange-500',
    'music-audio': 'from-green-500 to-emerald-500',
    'programming-tech': 'from-blue-600 to-indigo-600',
    'business': 'from-gray-600 to-slate-600',
    'data-analytics': 'from-teal-500 to-cyan-500',
    'photography': 'from-amber-500 to-yellow-500',
    'lifestyle': 'from-pink-400 to-rose-400',
    'ai-services': 'from-violet-500 to-purple-500',
  };

  // Build categories from skills.ts (static data - no API needed)
  const categories = SKILL_CATEGORIES.slice(0, 8).map((cat) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.id,
    icon: categoryIconMap[cat.id] || Code,
    color: categoryColorMap[cat.id] || 'from-gray-500 to-slate-500',
    count: `${cat.skills.length}+ skills`,
  }));

  // Fetch sellers, jobs, testimonials, and FAQs from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch sellers, jobs, testimonials, and FAQs in parallel
        const [developersData, jobsData, testimonialsData, faqsData] = await Promise.all([
          publicService.getFeaturedDevelopers(4),
          publicService.getFeaturedJobs(6),
          publicService.getTestimonials(6),
          publicService.getFaqs(),
        ]);

        // Transform developers to match component expectations
        const transformedDevelopers = developersData.map((dev) => ({
          ...dev,
          // Capitalize availability
          availability: dev.availability?.charAt(0).toUpperCase() + dev.availability?.slice(1) || 'Available',
          reviewsCount: dev.reviewsCount,
        }));

        // Transform jobs to match component expectations
        const transformedJobs = jobsData.map((job) => ({
          ...job,
          // Pass salary object through - JobCard handles formatting
          // Format type
          type: job.type?.charAt(0).toUpperCase() + job.type?.slice(1) || 'Contract',
          // Format posted date
          postedDate: job.postedAt ? new Date(job.postedAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
          }) : 'Recently',
          experience: '3-5 years', // Default if not provided
          featured: true,
        }));

        setFeaturedDevelopers(transformedDevelopers as any);
        setFeaturedJobs(transformedJobs as any);
        setTestimonials(testimonialsData);
        setFaqs(faqsData);
      } catch (error) {
        console.error('Error fetching landing page data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);


  // Detailed timeline steps with mockups
  const step1Tags = t('landing.howItWorks.steps.step1.tags', { returnObjects: true }) as string[];
  const step3Skills = t('landing.howItWorks.steps.step3.skills', { returnObjects: true }) as string[];
  const step4Columns = t('landing.howItWorks.steps.step4.columns', { returnObjects: true }) as string[];

  const timelineSteps = [
    {
      number: "01",
      title: t('landing.howItWorks.steps.step1.title'),
      description: t('landing.howItWorks.steps.step1.description'),
      icon: Upload,
      color: "from-blue-500 to-cyan-500",
      mockup: (
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border-2 border-blue-200">
          <div className="flex items-start space-x-4">
            <MessageSquare className="w-8 h-8 text-blue-600 flex-shrink-0" />
            <div className="flex-1">
              <div className="bg-white rounded-xl p-4 mb-3 shadow-sm">
                <div className="text-sm text-gray-600 mb-2">{t('landing.howItWorks.steps.step1.mockupLabel')}</div>
                <div className="text-sm text-gray-800">"{t('landing.howItWorks.steps.step1.mockupText')}"</div>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs">{step1Tags[0]}</span>
                <span className="bg-cyan-100 text-cyan-700 px-3 py-1 rounded-full text-xs">{step1Tags[1]}</span>
                <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs">{step1Tags[2]}</span>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      number: "02",
      title: t('landing.howItWorks.steps.step2.title'),
      description: t('landing.howItWorks.steps.step2.description'),
      icon: Brain,
      color: "from-purple-500 to-pink-500",
      mockup: (
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200">
          <div className="text-center mb-4">
            <div className="text-xs text-gray-500 mb-1">{t('landing.howItWorks.steps.step2.matchScore')}</div>
            <div className="flex items-center justify-center space-x-2">
              <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">94%</div>
              <Sparkles className="w-5 h-5 text-purple-500" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-3 mb-3 border border-purple-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400" />
                <div className="text-sm font-semibold text-gray-900">{t('landing.howItWorks.steps.step2.proposerName')}</div>
              </div>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{t('landing.howItWorks.steps.step2.proposerStatus')}</span>
            </div>
            <div className="text-xs text-gray-600">{t('landing.howItWorks.steps.step2.proposerText')}</div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-white rounded-lg p-2">
              <div className="font-semibold text-purple-600">{t('landing.howItWorks.steps.step2.skills')}</div>
              <div className="text-gray-600">{t('landing.howItWorks.steps.step2.skillsMatch')}</div>
            </div>
            <div className="bg-white rounded-lg p-2">
              <div className="font-semibold text-pink-600">{t('landing.howItWorks.steps.step2.experience')}</div>
              <div className="text-gray-600">{t('landing.howItWorks.steps.step2.experienceYears')}</div>
            </div>
            <div className="bg-white rounded-lg p-2">
              <div className="font-semibold text-purple-600">{t('landing.howItWorks.steps.step2.rate')}</div>
              <div className="text-gray-600">{t('landing.howItWorks.steps.step2.inBudget')}</div>
            </div>
          </div>
        </div>
      )
    },
    {
      number: "03",
      title: t('landing.howItWorks.steps.step3.title'),
      description: t('landing.howItWorks.steps.step3.description'),
      icon: Target,
      color: "from-pink-500 to-rose-500",
      mockup: (
        <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl p-6 border-2 border-pink-200">
          <div className="flex items-start space-x-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-400 to-rose-400 flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <div className="font-bold text-gray-900">{t('landing.howItWorks.steps.step3.studioName')}</div>
                <div className="flex items-center space-x-1">
                  {[1,2,3,4,5].map((i) => (
                    <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              </div>
              <div className="text-sm text-gray-600 mb-3">{t('landing.howItWorks.steps.step3.studioType')}</div>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="bg-white px-2 py-1 rounded text-xs">{step3Skills[0]}</span>
                <span className="bg-white px-2 py-1 rounded text-xs">{step3Skills[1]}</span>
                <span className="bg-white px-2 py-1 rounded text-xs">{step3Skills[2]}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="text-gray-600">{t('landing.howItWorks.steps.step3.pricing')}</div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-4 py-1 rounded-full text-xs"
                >
                  {t('landing.howItWorks.steps.step3.chat')}
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      number: "04",
      title: t('landing.howItWorks.steps.step4.title'),
      description: t('landing.howItWorks.steps.step4.description'),
      icon: Workflow,
      color: "from-green-500 to-teal-500",
      mockup: (
        <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-2xl p-6 border-2 border-green-200">
          <div className="grid grid-cols-3 gap-3 mb-4">
            {step4Columns.map((col, idx) => (
              <div key={col} className="bg-white rounded-xl p-3">
                <div className="text-xs font-semibold text-gray-700 mb-2">{col}</div>
                <div className="space-y-2">
                  <div className="bg-gradient-to-br from-green-100 to-teal-100 rounded-lg p-2 text-xs">
                    <div className="font-medium mb-1">{t('landing.howItWorks.steps.step4.task')} {idx + 1}</div>
                    <div className="flex items-center justify-between text-gray-600">
                      <span>2h</span>
                      <div className="w-5 h-5 rounded-full bg-green-300" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2 text-gray-700">
              <Clock className="w-4 h-4" />
              <span>{t('landing.howItWorks.steps.step4.hoursTracked')}</span>
            </div>
            <div className="flex -space-x-2">
              {[1,2,3].map((i) => (
                <div key={i} className="w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-teal-400 border-2 border-white" />
              ))}
            </div>
          </div>
        </div>
      )
    },
    {
      number: "05",
      title: t('landing.howItWorks.steps.step5.title'),
      description: t('landing.howItWorks.steps.step5.description'),
      icon: Award,
      color: "from-orange-500 to-amber-500",
      mockup: (
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border-2 border-orange-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Shield className="w-6 h-6 text-orange-600" />
              <span className="font-semibold text-gray-900">{t('landing.howItWorks.steps.step5.escrowTitle')}</span>
            </div>
            <div className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">{t('landing.howItWorks.steps.step5.protected')}</div>
          </div>
          <div className="space-y-2 mb-4">
            {[
              { day: t('landing.howItWorks.steps.step5.timeline.day0'), event: t('landing.howItWorks.steps.step5.timeline.day0Event'), status: t('landing.howItWorks.steps.step5.timeline.day0Status') },
              { day: t('landing.howItWorks.steps.step5.timeline.day10'), event: t('landing.howItWorks.steps.step5.timeline.day10Event'), status: t('landing.howItWorks.steps.step5.timeline.day10Status') },
              { day: t('landing.howItWorks.steps.step5.timeline.day15'), event: t('landing.howItWorks.steps.step5.timeline.day15Event'), status: t('landing.howItWorks.steps.step5.timeline.day15Status') }
            ].map((m, idx) => (
              <div key={idx} className="bg-white rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-xs font-bold text-orange-600 w-12">{m.day}</div>
                  <div className="text-sm text-gray-700">{m.event}</div>
                </div>
                <div className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                  idx === 2 ? 'bg-green-100 text-green-700' :
                  idx === 1 ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-600'
                }`}>{m.status}</div>
              </div>
            ))}
          </div>
          <div className="text-xs text-center text-gray-500 mb-3">
            {t('landing.howItWorks.steps.step5.autoRelease')}
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white py-3 rounded-xl font-semibold flex items-center justify-center space-x-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{t('landing.howItWorks.steps.step5.releasePayment')}</span>
          </motion.button>
        </div>
      )
    }
  ];

  // Why choose us features - using translations
  const features = [
    {
      icon: Shield,
      title: t('landing.features.items.escrow.title'),
      description: t('landing.features.items.escrow.description')
    },
    {
      icon: Zap,
      title: t('landing.features.items.aiMatching.title'),
      description: t('landing.features.items.aiMatching.description')
    },
    {
      icon: Workflow,
      title: t('landing.features.items.templates.title'),
      description: t('landing.features.items.templates.description')
    },
    {
      icon: Target,
      title: t('landing.features.items.dispute.title'),
      description: t('landing.features.items.dispute.description')
    },
    {
      icon: MessageSquare,
      title: t('landing.features.items.communication.title'),
      description: t('landing.features.items.communication.description')
    },
    {
      icon: Briefcase,
      title: t('landing.features.items.teamTypes.title'),
      description: t('landing.features.items.teamTypes.description')
    },
    {
      icon: Upload,
      title: t('landing.features.items.proofOfDelivery.title'),
      description: t('landing.features.items.proofOfDelivery.description')
    },
    {
      icon: DollarSign,
      title: t('landing.features.items.pricing.title'),
      description: t('landing.features.items.pricing.description')
    },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  // Don't block rendering - show page immediately, loading indicator only for dynamic sections

  return (
    <>
      <SEO
        title="Team@Once - Global Marketplace for Top Talent & Jobs"
        description="Connect with expert developers, designers, and professionals worldwide. Find your dream job or hire top talent for your projects on Team@Once."
        canonical="https://teamatonce.com/"
      />
      <UnifiedHeader />

      <div className="min-h-screen bg-white">
        {/* Professional Hero Section with Video Background */}
        <section className="relative pt-20 pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden min-h-[90vh] flex items-center">
          {/* Background Image */}
          <div className="absolute inset-0 z-0">
            {/* Background Image */}
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: 'url(https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1920&q=80)',
              }}
            />

            {/* Dark Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900/85 via-blue-900/80 to-purple-900/85 z-10" />

            {/* Subtle Animated Overlay */}
            <div className="absolute inset-0 z-10 pointer-events-none">
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.1, 0.05, 0.1],
                }}
                transition={{ duration: 8, repeat: Infinity }}
                className="absolute top-20 left-10 w-96 h-96 bg-blue-500 rounded-full mix-blend-overlay filter blur-3xl"
              />
              <motion.div
                animate={{
                  scale: [1.1, 1, 1.1],
                  opacity: [0.05, 0.1, 0.05],
                }}
                transition={{ duration: 8, repeat: Infinity, delay: 1 }}
                className="absolute top-40 right-10 w-96 h-96 bg-purple-500 rounded-full mix-blend-overlay filter blur-3xl"
              />
            </div>
          </div>

          <div className="max-w-7xl mx-auto relative z-20 w-full">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 mb-6 shadow-xl"
              >
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-xs font-bold text-white">
                  {searchMode === 'talent'
                    ? t('landing.hero.badge.talent')
                    : t('landing.hero.badge.jobs')}
                </span>
              </motion.div>

              {/* Main Heading */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 leading-tight"
              >
                {searchMode === 'talent' ? t('landing.hero.title.talent') : t('landing.hero.title.jobs')}
                <br />
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {searchMode === 'talent' ? t('landing.hero.title.talentHighlight') : t('landing.hero.title.jobsHighlight')}
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-base md:text-lg text-gray-200 mb-8 max-w-2xl mx-auto"
              >
                {searchMode === 'talent'
                  ? t('landing.hero.subtitle.talent')
                  : t('landing.hero.subtitle.jobs')}
              </motion.p>

              {/* Search Bar with Tabs - Centered */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="max-w-3xl mx-auto mb-6"
              >
                <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
                  {/* Tabs */}
                  <div className="flex border-b border-gray-200">
                    <button
                      onClick={() => setSearchMode('talent')}
                      className={`flex-1 px-6 py-3 text-sm font-semibold transition-all ${
                        searchMode === 'talent'
                          ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      {t('header.findTalent')}
                    </button>
                    <button
                      onClick={() => setSearchMode('jobs')}
                      className={`flex-1 px-6 py-3 text-sm font-semibold transition-all ${
                        searchMode === 'jobs'
                          ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      {t('header.findJobs')}
                    </button>
                  </div>

                  {/* Search Form */}
                  <form onSubmit={handleSearch} className="p-2 flex items-center">
                    <Search className="w-5 h-5 text-gray-400 ml-3 flex-shrink-0" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={
                        searchMode === 'talent'
                          ? t('landing.hero.searchPlaceholder.talent')
                          : t('landing.hero.searchPlaceholder.jobs')
                      }
                      className="flex-1 px-3 py-3 text-gray-900 placeholder-gray-500 border-none outline-none text-base bg-transparent"
                    />
                    <button
                      type="submit"
                      className="bg-gradient-to-r from-sky-800 via-sky-700 to-sky-600 text-white px-8 py-3 rounded-lg font-bold hover:shadow-xl transition-all flex-shrink-0 text-sm"
                    >
                      {t('common.search')}
                    </button>
                  </form>
                </div>
              </motion.div>

              {/* Popular Searches */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex flex-wrap items-center justify-center gap-2 mb-8"
              >
                <span className="text-white/70 text-xs font-medium">{t('landing.hero.popular')}</span>
                {searchMode === 'talent'
                  ? (t('landing.hero.popularTalent', { returnObjects: true }) as string[]).map((term) => (
                      <button
                        key={term}
                        onClick={() => setSearchQuery(term)}
                        className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                      >
                        {term}
                      </button>
                    ))
                  : (t('landing.hero.popularJobs', { returnObjects: true }) as string[]).map((term) => (
                      <button
                        key={term}
                        onClick={() => setSearchQuery(term)}
                        className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                      >
                        {term}
                      </button>
                    ))}
              </motion.div>

              {/* CTA Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3"
              >
                <button
                  onClick={() => navigate('/auth/signup')}
                  className="group relative px-8 py-3 bg-white text-blue-600 rounded-xl font-bold text-base shadow-2xl hover:shadow-white/20 transition-all overflow-hidden"
                >
                  <span className="relative z-10 flex items-center justify-center">
                    {t('common.getStartedFree')}
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
                <button
                  onClick={() => document.querySelector('#how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-8 py-3 bg-transparent border-2 border-white/30 rounded-xl font-bold text-white text-base hover:bg-white/10 backdrop-blur-sm transition-all"
                >
                  {t('common.seeHowItWorks')}
                </button>
              </motion.div>

              {/* Trust Badges */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-gray-300"
              >
                <div className="flex items-center space-x-1.5">
                  <Shield className="w-4 h-4 text-green-400" />
                  <span>{t('landing.hero.trustBadges.secure')}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-400" />
                  <span>{t('landing.hero.trustBadges.noCard')}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Zap className="w-4 h-4 text-purple-400" />
                  <span>{t('landing.hero.trustBadges.aiPowered')}</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Popular Categories */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="inline-flex items-center space-x-2 bg-sky-50 border border-sky-200 rounded-full px-4 py-2 mb-4"
              >
                <Sparkles className="w-4 h-4 text-sky-700" />
                <span className="text-sm font-semibold text-sky-700">{t('landing.categories.badge')}</span>
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-3xl md:text-5xl font-black text-gray-900 mb-4"
              >
                {t('landing.categories.title')}
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="text-lg text-gray-600 max-w-2xl mx-auto"
              >
                {t('landing.categories.subtitle')}
              </motion.p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {categories.map((category, index) => (
                <CategoryCard key={category.slug} category={category} index={index} />
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mt-12"
            >
              <Link
                to="/browse-talent"
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-sky-800 via-sky-700 to-sky-600 text-white px-8 py-4 rounded-xl font-bold text-base hover:shadow-xl transition-all group"
              >
                <span>{t('landing.categories.viewAll')}</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Featured Developers */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="inline-flex items-center space-x-2 bg-sky-50 border border-sky-200 rounded-full px-4 py-2 mb-4"
              >
                <Award className="w-4 h-4 text-sky-700" />
                <span className="text-sm font-semibold text-sky-700">{t('landing.featuredDevelopers.badge')}</span>
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-3xl md:text-5xl font-black text-gray-900 mb-4"
              >
                {t('landing.featuredDevelopers.title')}
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="text-lg text-gray-600 max-w-2xl mx-auto"
              >
                {t('landing.featuredDevelopers.subtitle')}
              </motion.p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredDevelopers.map((dev, index) => (
                <DeveloperCard key={dev.id} developer={dev} index={index} />
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mt-12"
            >
              <Link
                to="/browse-talent"
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-sky-800 via-sky-700 to-sky-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:shadow-xl transition-all group"
              >
                <span>{t('landing.featuredDevelopers.viewAll')}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Featured Jobs */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="inline-flex items-center space-x-2 bg-sky-50 border border-sky-200 rounded-full px-4 py-2 mb-4"
              >
                <Briefcase className="w-4 h-4 text-sky-700" />
                <span className="text-sm font-semibold text-sky-700">{t('landing.featuredJobs.badge')}</span>
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-3xl md:text-5xl font-black text-gray-900 mb-4"
              >
                {t('landing.featuredJobs.title')}
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="text-lg text-gray-600 max-w-2xl mx-auto"
              >
                {t('landing.featuredJobs.subtitle')}
              </motion.p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredJobs.map((job, index) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <JobCard job={job} index={index} />
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mt-12"
            >
              <Link
                to="/browse-jobs"
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-sky-800 via-sky-700 to-sky-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:shadow-xl transition-all group"
              >
                <span>{t('landing.featuredJobs.viewAll')}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="inline-flex items-center space-x-2 bg-sky-50 border border-sky-200 rounded-full px-4 py-2 mb-4"
              >
                <Zap className="w-4 h-4 text-sky-700" />
                <span className="text-sm font-semibold text-sky-700">{t('landing.features.badge')}</span>
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-3xl md:text-5xl font-black text-gray-900 mb-4"
              >
                {t('landing.features.title')}
                <br />
                <span className="bg-gradient-to-r from-sky-800 via-sky-700 to-sky-600 bg-clip-text text-transparent">
                  {t('landing.features.titleHighlight')}
                </span>
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="text-lg text-gray-600 max-w-2xl mx-auto"
              >
                {t('landing.features.subtitle')}
              </motion.p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                  className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-200 hover:border-sky-300 hover:shadow-lg transition-all"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-sky-800 via-sky-700 to-sky-600 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works - Detailed Timeline */}
        <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center space-x-2 bg-sky-50 border border-sky-200 rounded-full px-6 py-3 mb-6">
                <Workflow className="w-5 h-5 text-sky-700" />
                <span className="text-sm font-bold text-sky-900">{t('landing.howItWorks.badge')}</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
                {t('landing.howItWorks.title')}
                <br />
                <span className="bg-gradient-to-r from-sky-800 via-sky-700 to-sky-600 bg-clip-text text-transparent">
                  {t('landing.howItWorks.titleHighlight')}
                </span>
              </h2>
              <p className="text-base text-gray-600 max-w-3xl mx-auto">
                {t('landing.howItWorks.subtitle')}
              </p>
            </div>

            <div className="space-y-16">
              {timelineSteps.map((step, index) => (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className={`grid lg:grid-cols-2 gap-12 items-center ${
                    index % 2 === 1 ? 'lg:flex-row-reverse' : ''
                  }`}
                >
                  {/* Content */}
                  <div className={index % 2 === 1 ? 'lg:order-2' : ''}>
                    <div className="flex items-center space-x-4 mb-6">
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg`}>
                        <step.icon className="w-8 h-8 text-white" />
                      </div>
                      <div className="text-6xl font-black text-gray-100">{step.number}</div>
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 mb-4">{step.title}</h3>
                    <p className="text-base text-gray-600 leading-relaxed">{step.description}</p>
                  </div>

                  {/* Mockup */}
                  <div className={index % 2 === 1 ? 'lg:order-1' : ''}>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.2 }}
                    >
                      {step.mockup}
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-sky-50 to-slate-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
                {t('landing.whyChoose.title')}
              </h2>
              <p className="text-base text-gray-600">
                {t('landing.whyChoose.subtitle')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-sky-800 via-sky-700 to-sky-600 rounded-xl flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Comprehensive Comparison Table */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <div className="inline-flex items-center space-x-2 bg-sky-50 border border-sky-200 rounded-full px-6 py-3 mb-6">
                <BarChart3 className="w-5 h-5 text-sky-700" />
                <span className="text-sm font-bold text-sky-900">{t('landing.comparison.badge')}</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-black mb-6">
                {t('landing.comparison.title')}
                <br />
                <span className="bg-gradient-to-r from-sky-800 via-sky-700 to-sky-600 bg-clip-text text-transparent">
                  {t('landing.comparison.titleHighlight')}
                </span>
              </h2>
              <p className="text-base text-gray-600 max-w-3xl mx-auto">
                {t('landing.comparison.subtitle')}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-gray-100"
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-50 to-sky-50">
                      <th className="px-6 py-4 text-left">
                        <div className="text-sm font-black text-gray-900">Feature</div>
                      </th>
                      <th className="px-6 py-4 text-center bg-gradient-to-br from-sky-800 via-sky-700 to-sky-600">
                        <div className="flex flex-col items-center">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mb-2">
                            <Zap className="w-6 h-6 text-sky-700" />
                          </div>
                          <div className="text-sm font-black text-white">Team@Once</div>
                          <div className="text-xs text-white/80">All-in-One</div>
                        </div>
                      </th>
                      <th className="px-6 py-4 text-center">
                        <div className="text-sm font-bold text-gray-700">Upwork</div>
                        <div className="text-xs text-gray-500">Marketplace</div>
                      </th>
                      <th className="px-6 py-4 text-center">
                        <div className="text-sm font-bold text-gray-700">Fiverr</div>
                        <div className="text-xs text-gray-500">Gig Platform</div>
                      </th>
                      <th className="px-6 py-4 text-center">
                        <div className="text-sm font-bold text-gray-700">Toptal</div>
                        <div className="text-xs text-gray-500">Elite Talent</div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {[
                      { feature: "Payment Protection", teamatonce: "14-day auto-release + dispute", upwork: "basic", fiverr: "basic", toptal: "basic" },
                      { feature: "Proof of Delivery", teamatonce: "Required uploads + tracking", upwork: "manual", fiverr: false, toptal: false },
                      { feature: "Team Management", teamatonce: "Company profiles + assignments", upwork: false, fiverr: false, toptal: false },
                      { feature: "Project Templates", teamatonce: "95+ templates, 14 categories", upwork: false, fiverr: "basic", toptal: false },
                      { feature: "Dispute Resolution", teamatonce: "Automated 7-2-2 timeline", upwork: "manual", fiverr: "manual", toptal: "manual" },
                      { feature: "AI Features", teamatonce: "Matching + cost estimation", upwork: false, fiverr: false, toptal: "partial" },
                      { feature: "Communication Hub", teamatonce: "Chat, video, whiteboard", upwork: "basic", fiverr: "basic", toptal: false },
                      { feature: "Milestone Workflow", teamatonce: "Submit → Review → Approve", upwork: "basic", fiverr: false, toptal: false },
                      { feature: "Solo/Team/Agency Support", teamatonce: "full", upwork: "partial", fiverr: false, toptal: false }
                    ].map((row, index) => (
                      <motion.tr
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-sky-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="font-semibold text-sm text-gray-900">{row.feature}</div>
                        </td>
                        <td className="px-8 py-5 text-center bg-gradient-to-r from-sky-50 to-sky-100">
                          {row.teamatonce === "full" ? (
                            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-sky-800 via-sky-700 to-sky-600 text-white px-3 py-1 rounded-full font-bold shadow-lg text-xs">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Full</span>
                            </div>
                          ) : typeof row.teamatonce === "string" ? (
                            <div className="inline-flex items-center space-x-1 bg-gradient-to-r from-sky-800 via-sky-700 to-sky-600 text-white px-3 py-1.5 rounded-full font-semibold shadow-lg text-xs max-w-[180px]">
                              <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="truncate">{row.teamatonce}</span>
                            </div>
                          ) : (
                            <XIcon className="w-5 h-5 text-gray-300 mx-auto" />
                          )}
                        </td>
                        <td className="px-8 py-5 text-center">
                          {row.upwork === "full" ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" />
                          ) : row.upwork === "basic" ? (
                            <div className="text-xs font-semibold text-yellow-600">Basic</div>
                          ) : row.upwork === "partial" ? (
                            <div className="text-xs font-semibold text-yellow-600">Partial</div>
                          ) : row.upwork === "manual" ? (
                            <div className="text-xs font-semibold text-orange-500">Manual</div>
                          ) : (
                            <XIcon className="w-5 h-5 text-gray-300 mx-auto" />
                          )}
                        </td>
                        <td className="px-8 py-5 text-center">
                          {row.fiverr === "full" ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" />
                          ) : row.fiverr === "basic" ? (
                            <div className="text-xs font-semibold text-yellow-600">Basic</div>
                          ) : row.fiverr === "manual" ? (
                            <div className="text-xs font-semibold text-orange-500">Manual</div>
                          ) : (
                            <XIcon className="w-5 h-5 text-gray-300 mx-auto" />
                          )}
                        </td>
                        <td className="px-8 py-5 text-center">
                          {row.toptal === "full" ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" />
                          ) : row.toptal === "partial" ? (
                            <div className="text-xs font-semibold text-yellow-600">Partial</div>
                          ) : row.toptal === "manual" ? (
                            <div className="text-xs font-semibold text-orange-500">Manual</div>
                          ) : row.toptal === "basic" ? (
                            <div className="text-xs font-semibold text-yellow-600">Basic</div>
                          ) : (
                            <XIcon className="w-5 h-5 text-gray-300 mx-auto" />
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <div className="inline-flex items-center space-x-2 bg-sky-50 border border-sky-200 rounded-full px-6 py-3 mb-6">
                <Star className="w-5 h-5 text-sky-700" />
                <span className="text-sm font-bold text-sky-900">{t('landing.testimonials.badge')}</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-black mb-6">
                {t('landing.testimonials.title')}
                <br />
                <span className="bg-gradient-to-r from-sky-800 via-sky-700 to-sky-600 bg-clip-text text-transparent">
                  {t('landing.testimonials.titleHighlight')}
                </span>
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                {t('landing.testimonials.subtitle')}
              </p>
            </motion.div>

            {/* Testimonials Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {testimonials.length > 0 ? (
                // Render testimonials from API
                testimonials.map((testimonial, index) => {
                  // Generate gradient colors based on index
                  const gradients = [
                    'from-blue-500 to-purple-600',
                    'from-green-500 to-teal-600',
                    'from-orange-500 to-red-600',
                    'from-pink-500 to-rose-600',
                    'from-indigo-500 to-purple-600',
                    'from-cyan-500 to-blue-600',
                  ];
                  const gradient = gradients[index % gradients.length];
                  const initials = testimonial.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);

                  return (
                    <motion.div
                      key={testimonial.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: (index + 1) * 0.1 }}
                      className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all"
                    >
                      <div className="flex items-center space-x-1 mb-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star
                            key={i}
                            className={`w-5 h-5 ${
                              i <= testimonial.rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-gray-700 mb-6 leading-relaxed line-clamp-4">
                        "{testimonial.content}"
                      </p>
                      <div className="flex items-center space-x-4">
                        {testimonial.avatar ? (
                          <img
                            src={testimonial.avatar}
                            alt={testimonial.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div
                            className={`w-12 h-12 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold`}
                          >
                            {initials}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-gray-900">{testimonial.name}</div>
                          {testimonial.projectName && (
                            <div className="text-sm text-gray-500">{testimonial.projectName}</div>
                          )}
                          <div className="text-xs text-sky-600 font-semibold mt-0.5">
                            {testimonial.role}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                // Fallback to static testimonials if none from API
                <>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all"
                  >
                    <div className="flex items-center space-x-1 mb-4">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-gray-700 mb-6 leading-relaxed">
                      "{t('landing.testimonials.fallback.testimonial1.content')}"
                    </p>
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                        JM
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">{t('landing.testimonials.fallback.testimonial1.name')}</div>
                        <div className="text-sm text-gray-500">{t('landing.testimonials.fallback.testimonial1.company')}</div>
                        <div className="text-xs text-sky-600 font-semibold mt-0.5">{t('landing.testimonials.fallback.testimonial1.role')}</div>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all"
                  >
                    <div className="flex items-center space-x-1 mb-4">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-gray-700 mb-6 leading-relaxed">
                      "{t('landing.testimonials.fallback.testimonial2.content')}"
                    </p>
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center text-white font-bold">
                        SC
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">{t('landing.testimonials.fallback.testimonial2.name')}</div>
                        <div className="text-sm text-gray-500">{t('landing.testimonials.fallback.testimonial2.title')}</div>
                        <div className="text-xs text-green-600 font-semibold mt-0.5">{t('landing.testimonials.fallback.testimonial2.role')}</div>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 }}
                    className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all"
                  >
                    <div className="flex items-center space-x-1 mb-4">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-gray-700 mb-6 leading-relaxed">
                      "{t('landing.testimonials.fallback.testimonial3.content')}"
                    </p>
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-bold">
                        MR
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">{t('landing.testimonials.fallback.testimonial3.name')}</div>
                        <div className="text-sm text-gray-500">{t('landing.testimonials.fallback.testimonial3.company')}</div>
                        <div className="text-xs text-sky-600 font-semibold mt-0.5">{t('landing.testimonials.fallback.testimonial3.role')}</div>
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-gray-50">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <div className="inline-flex items-center space-x-2 bg-sky-50 border border-sky-200 rounded-full px-6 py-3 mb-6">
                <HelpCircle className="w-5 h-5 text-sky-700" />
                <span className="text-sm font-bold text-sky-900">{t('landing.faq.badge')}</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-black mb-6">
                {t('landing.faq.title')}
                <br />
                <span className="bg-gradient-to-r from-sky-800 via-sky-700 to-sky-600 bg-clip-text text-transparent">
                  {t('landing.faq.titleHighlight')}
                </span>
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                {t('landing.faq.subtitle')}
              </p>
            </motion.div>

            <div className="space-y-4">
              {(faqs.length > 0 ? faqs : faqItems).map((faq, index) => (
                <motion.div
                  key={'id' in faq ? faq.id : index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden shadow-lg hover:shadow-xl transition-all"
                >
                  <button
                    onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-lg font-bold text-gray-900 pr-4">{faq.question}</span>
                    <motion.div
                      animate={{ rotate: openFaqIndex === index ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                        openFaqIndex === index
                          ? 'bg-gradient-to-r from-sky-700 to-sky-600 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {openFaqIndex === index ? (
                        <Minus className="w-5 h-5" />
                      ) : (
                        <Plus className="w-5 h-5" />
                      )}
                    </motion.div>
                  </button>
                  <AnimatePresence>
                    {openFaqIndex === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-5 pt-2">
                          <div className="h-px bg-gradient-to-r from-sky-200 via-sky-300 to-sky-200 mb-4" />
                          <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-12 text-center"
            >
              <p className="text-gray-600 mb-4">{t('landing.faq.stillHaveQuestions')}</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-gradient-to-r from-sky-700 to-sky-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all inline-flex items-center space-x-2"
              >
                <MessageSquare className="w-5 h-5" />
                <span>{t('common.contactSupport')}</span>
              </motion.button>
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative py-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-sky-800 via-sky-700 to-sky-600"></div>

          {/* Animated Background Elements */}
          <div className="absolute inset-0 opacity-20">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{ duration: 8, repeat: Infinity }}
              className="absolute top-10 left-10 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl"
            />
            <motion.div
              animate={{
                scale: [1.2, 1, 1.2],
                opacity: [0.5, 0.3, 0.5],
              }}
              transition={{ duration: 8, repeat: Infinity, delay: 1 }}
              className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl"
            />
          </div>

          <div className="max-w-4xl mx-auto text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
{/* Badge - removed for now */}

              {/* Heading */}
              <h2 className="text-3xl md:text-4xl font-black text-white mb-6 leading-tight">
                {t('landing.cta.title')}
                <br />
                {t('landing.cta.titleLine2')}
              </h2>

              {/* Description */}
              <p className="text-base md:text-lg text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed">
                {t('landing.cta.subtitle')}
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/auth/signup')}
                  className="group bg-white text-sky-700 px-8 py-3 rounded-xl font-bold text-sm hover:shadow-2xl transition-all inline-flex items-center space-x-2"
                >
                  <span>{t('common.getStartedFree')}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/pricing')}
                  className="border-2 border-white text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-white/10 backdrop-blur-sm transition-all"
                >
                  {t('common.viewPricing')}
                </motion.button>
              </div>

              {/* Trust Indicators */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="mt-12 flex flex-wrap items-center justify-center gap-8 text-white/80"
              >
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-green-300" />
                  <span className="text-sm font-medium">{t('landing.cta.trustIndicators.noCard')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-green-300" />
                  <span className="text-sm font-medium">{t('landing.cta.trustIndicators.freeStart')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-green-300" />
                  <span className="text-sm font-medium">{t('landing.cta.trustIndicators.cancel')}</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Contact Form Section */}
        <section id="contact" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center space-x-2 bg-sky-50 border border-sky-200 rounded-full px-4 py-2 mb-4">
                <MessageSquare className="w-4 h-4 text-sky-700" />
                <span className="text-sm font-semibold text-sky-700">{t('landing.contact.badge')}</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
                {t('landing.contact.title')}
                <br />
                <span className="bg-gradient-to-r from-sky-800 via-sky-700 to-sky-600 bg-clip-text text-transparent">
                  {t('landing.contact.titleHighlight')}
                </span>
              </h2>
              <p className="text-base text-gray-600 max-w-2xl mx-auto">
                {t('landing.contact.subtitle')}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 border border-gray-200"
            >
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-semibold text-gray-900 mb-2">
                      {t('landing.contact.form.fullName')}
                    </label>
                    <input
                      type="text"
                      id="name"
                      required
                      placeholder={t('landing.contact.form.fullNamePlaceholder')}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-sky-600 focus:ring-2 focus:ring-sky-600/20 outline-none transition-all text-gray-900"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2">
                      {t('landing.contact.form.email')}
                    </label>
                    <input
                      type="email"
                      id="email"
                      required
                      placeholder={t('landing.contact.form.emailPlaceholder')}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-sky-600 focus:ring-2 focus:ring-sky-600/20 outline-none transition-all text-gray-900"
                    />
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label htmlFor="subject" className="block text-sm font-semibold text-gray-900 mb-2">
                    {t('landing.contact.form.subject')}
                  </label>
                  <input
                    type="text"
                    id="subject"
                    required
                    placeholder={t('landing.contact.form.subjectPlaceholder')}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-sky-600 focus:ring-2 focus:ring-sky-600/20 outline-none transition-all text-gray-900"
                  />
                </div>

                {/* Message */}
                <div>
                  <label htmlFor="message" className="block text-sm font-semibold text-gray-900 mb-2">
                    {t('landing.contact.form.message')}
                  </label>
                  <textarea
                    id="message"
                    required
                    rows={6}
                    placeholder={t('landing.contact.form.messagePlaceholder')}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-sky-600 focus:ring-2 focus:ring-sky-600/20 outline-none transition-all resize-none text-gray-900"
                  />
                </div>

                {/* Submit Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="w-full bg-gradient-to-r from-sky-800 via-sky-700 to-sky-600 text-white px-8 py-3 rounded-xl font-bold text-sm hover:shadow-2xl transition-all flex items-center justify-center space-x-2"
                >
                  <span>{t('common.sendMessage')}</span>
                  <ArrowRight className="w-4 h-4" />
                </motion.button>

                {/* Privacy Notice */}
                <p className="text-xs text-gray-500 text-center">
                  {t('landing.contact.form.privacy')}{' '}
                  <a href="/privacy" className="text-sky-700 hover:underline font-semibold">
                    {t('landing.contact.form.privacyPolicy')}
                  </a>{' '}
                  {t('landing.contact.form.and')}{' '}
                  <a href="/terms" className="text-sky-700 hover:underline font-semibold">
                    {t('landing.contact.form.terms')}
                  </a>
                </p>
              </form>
            </motion.div>
          </div>
        </section>
      </div>

      <Footer />
    </>
  );
};

export default NewLandingPage;
