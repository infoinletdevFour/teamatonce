import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, CheckCircle2, Zap, Users,
  MessageSquare, Clock, DollarSign, Star,
  Briefcase, Code, Sparkles, ChevronRight,
  FileText, Lock, BarChart3, Calendar,
  Play, Pause, ChevronLeft,
  Settings, Bell, Brain,
  Workflow, Layers, X, Shield, Video,
  PenTool, Building2, UserPlus, Scale,
  FileCheck, GitBranch, Receipt, Gavel
} from 'lucide-react';
import UnifiedHeader from '../../components/layout/UnifiedHeader';
import Footer from '../../components/layout/Footer';

const TeamAtOnceLanding = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);

  // Hero Slides - Based on actual platform features from README
  const heroSlides = [
    {
      title: "AI-Powered Developer Matching",
      subtitle: "Find Perfect Teams Instantly",
      description: "Post your project and receive proposals from verified developers. Our AI scores matches based on tech stack, experience, and past performance.",
      gradient: "from-blue-600 via-cyan-500 to-teal-400",
      visual: "search",
      stats: ["95+ Project Templates", "AI Match Scoring", "Verified Developers"]
    },
    {
      title: "Escrow Payment Protection",
      subtitle: "14-Day Auto-Release System",
      description: "Funds held securely until delivery confirmed. Automatic release after 14 days of approval. Complete protection for both clients and developers.",
      gradient: "from-emerald-600 via-teal-500 to-cyan-400",
      visual: "payment",
      stats: ["Escrow Protected", "14-Day Review", "Auto Release"]
    },
    {
      title: "Complete Project Workspace",
      subtitle: "Chat, Video, Whiteboard & More",
      description: "Real-time messaging, video conferencing, collaborative whiteboard, meeting scheduler, and calendar - all integrated in one platform.",
      gradient: "from-purple-600 via-pink-500 to-rose-400",
      visual: "dashboard",
      stats: ["Real-time Chat", "Video Calls", "Whiteboard"]
    },
    {
      title: "Professional Milestone Workflow",
      subtitle: "Transparent Delivery Process",
      description: "Track progress from pending to completion. Required proof-of-delivery uploads. Client feedback loops. Everything documented.",
      gradient: "from-orange-600 via-amber-500 to-yellow-400",
      visual: "global",
      stats: ["Milestone Tracking", "Proof of Delivery", "Feedback System"]
    }
  ];

  useEffect(() => {
    if (isAutoPlay) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [isAutoPlay, heroSlides.length]);

  // Visual Mockup Components
  const DashboardMockup = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative"
    >
      <div className="bg-white rounded-3xl p-6 border-4 border-purple-200 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Layers className="w-5 h-5 text-purple-600" />
            <span className="font-bold text-gray-900 text-base">Project Dashboard</span>
          </div>
          <div className="flex space-x-2">
            <motion.div whileHover={{ scale: 1.1 }} className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center cursor-pointer">
              <Bell className="w-5 h-5 text-purple-600" />
            </motion.div>
            <motion.div whileHover={{ scale: 1.1 }} className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center cursor-pointer">
              <Settings className="w-5 h-5 text-purple-600" />
            </motion.div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { status: 'To Do', color: 'blue', tasks: ['Design mockups', 'API planning'] },
            { status: 'In Progress', color: 'purple', tasks: ['Frontend dev', 'Database setup'] },
            { status: 'Done', color: 'green', tasks: ['Requirements', 'Kickoff meeting'] }
          ].map((col, idx) => (
            <motion.div
              key={col.status}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + idx * 0.1 }}
              className={`bg-gradient-to-br from-${col.color}-50 to-${col.color}-100 rounded-xl p-4 border-2 border-${col.color}-200`}
            >
              <div className="text-sm font-bold text-gray-900 mb-3">{col.status}</div>
              <div className="space-y-2">
                {col.tasks.map((task, i) => (
                  <div key={i} className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                    <div className="text-sm font-semibold text-gray-800 mb-1">{task}</div>
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span>2h</span>
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 border-2 border-white" />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
        <div className="flex items-center justify-between bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border-2 border-purple-200">
          <div className="flex items-center space-x-2 text-gray-900">
            <Clock className="w-5 h-5 text-purple-600" />
            <span className="font-semibold">24h tracked this week</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-900">
            <Users className="w-5 h-5 text-purple-600" />
            <span className="font-semibold">5 members</span>
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 text-gray-900 overflow-x-hidden">
      {/* Unified Header */}
      <UnifiedHeader />

      {/* Animated Hero Slider */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden min-h-[90vh] flex items-center">
        <div className="absolute inset-0 -z-10">
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-0 left-1/4 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30"
          />
          <motion.div 
            animate={{ 
              scale: [1.2, 1, 1.2],
              rotate: [90, 0, 90],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-0 right-1/4 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30"
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, -90, 0],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30"
          />
        </div>

        <div className="max-w-7xl mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.5 }}
              className="grid lg:grid-cols-2 gap-12 items-center"
            >
              <div>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="inline-flex items-center space-x-2 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-full px-6 py-3 mb-8 shadow-lg"
                >
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    AI-Powered Developer Marketplace
                  </span>
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className={`text-5xl md:text-6xl font-black mb-6 leading-tight bg-gradient-to-r from-sky-800 via-sky-700 to-sky-600 bg-clip-text text-transparent`}
                >
                  Outsource Development Without The Risk
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-base text-gray-700 mb-8 leading-relaxed"
                >
                  The complete platform for software development outsourcing. AI-powered developer matching, escrow-protected payments with 14-day review, milestone tracking with proof-of-delivery, and integrated communication tools.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex flex-wrap gap-4 mb-8"
                >
                  {[
                    { icon: Shield, label: "Escrow Protected" },
                    { icon: FileCheck, label: "95+ Templates" },
                    { icon: Users, label: "Solo to Agency" }
                  ].map((stat, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 + idx * 0.1 }}
                      className="bg-white/70 backdrop-blur-sm rounded-2xl px-6 py-3 shadow-lg border border-gray-200 flex items-center space-x-2"
                    >
                      <stat.icon className="w-5 h-5 text-sky-700" />
                      <div className="font-bold text-gray-900">{stat.label}</div>
                    </motion.div>
                  ))}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex flex-col sm:flex-row gap-4"
                >
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => window.location.href = '/auth/signup'}
                    className="bg-gradient-to-r from-sky-800 via-sky-700 to-sky-600 text-white px-6 py-2.5 rounded-2xl font-bold text-sm flex items-center justify-center space-x-2 shadow-2xl"
                  >
                    <span>Get Started Free</span>
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="border-3 border-gray-300 bg-white/50 backdrop-blur-sm text-gray-900 px-6 py-2.5 rounded-2xl font-bold text-sm flex items-center justify-center space-x-2 shadow-xl"
                  >
                    <Play className="w-4 h-4" />
                    <span>Watch Demo</span>
                  </motion.button>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="relative"
              >
                <DashboardMockup />
              </motion.div>
            </motion.div>
          </AnimatePresence>

          {/* Slider Controls */}
          <div className="flex items-center justify-center space-x-6 mt-12">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length)}
              className="w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center hover:shadow-xl"
            >
              <ChevronLeft className="w-6 h-6 text-gray-700" />
            </motion.button>

            <div className="flex space-x-3">
              {heroSlides.map((_, idx) => (
                <motion.button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  whileHover={{ scale: 1.2 }}
                  className={`h-3 rounded-full transition-all ${
                    idx === currentSlide 
                      ? 'w-12 bg-gradient-to-r from-blue-600 to-purple-600' 
                      : 'w-3 bg-gray-300'
                  }`}
                />
              ))}
            </div>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setCurrentSlide((prev) => (prev + 1) % heroSlides.length)}
              className="w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center hover:shadow-xl"
            >
              <ChevronRight className="w-6 h-6 text-gray-700" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsAutoPlay(!isAutoPlay)}
              className="w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center hover:shadow-xl ml-4"
            >
              {isAutoPlay ? <Pause className="w-6 h-6 text-gray-700" /> : <Play className="w-6 h-6 text-gray-700" />}
            </motion.button>
          </div>
        </div>
      </section>

      {/* Timeline - How It Works */}
      <section id="how-it-works" className="py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-sky-100 to-blue-100 rounded-full px-6 py-3 mb-6">
              <Workflow className="w-5 h-5 text-sky-600" />
              <span className="text-sm font-bold text-sky-900">Smart Workflow</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-black mb-6">
              How It
              <span className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent"> Works</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              From posting your project to receiving proposals, funding milestones, and releasing payment - a complete transparent workflow
            </p>
          </motion.div>

          {/* Animated Workflow Diagram */}
          <div className="relative min-h-[600px] flex items-center justify-center">
            {/* Animated Connection Lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
              <defs>
                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.3" />
                  <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.3" />
                </linearGradient>
              </defs>

              {/* Post → AI Match */}
              <motion.path
                d="M 180 250 Q 300 200, 450 250"
                stroke="url(#lineGradient)"
                strokeWidth="3"
                fill="none"
                strokeDasharray="8 8"
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />

              {/* AI Match → Collaborate */}
              <motion.path
                d="M 600 280 Q 700 350, 800 280"
                stroke="url(#lineGradient)"
                strokeWidth="3"
                fill="none"
                strokeDasharray="8 8"
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 2, delay: 0.5, repeat: Infinity, ease: "linear" }}
              />

              {/* Post → Track */}
              <motion.path
                d="M 200 350 Q 300 450, 450 420"
                stroke="url(#lineGradient)"
                strokeWidth="3"
                fill="none"
                strokeDasharray="8 8"
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 2, delay: 0.8, repeat: Infinity, ease: "linear" }}
              />

              {/* Collaborate → Payment */}
              <motion.path
                d="M 900 320 Q 1000 400, 1100 360"
                stroke="url(#lineGradient)"
                strokeWidth="3"
                fill="none"
                strokeDasharray="8 8"
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 2, delay: 1.2, repeat: Infinity, ease: "linear" }}
              />
            </svg>

            {/* Workflow Cards - Updated to match README workflow */}
            <div className="relative w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {/* Card 1: Post Project */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                whileHover={{ y: -10, scale: 1.05 }}
                className="relative bg-white rounded-2xl p-5 shadow-xl border-2 border-gray-100 hover:border-sky-300 transition-all duration-300"
              >
                <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-sky-500 flex items-center justify-center text-white font-bold text-sm">1</div>
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center mb-3 shadow-lg">
                  <FileText className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1">Post Project</h3>
                <p className="text-xs text-gray-600">Choose from 95+ templates or describe custom needs</p>
              </motion.div>

              {/* Card 2: Receive Proposals */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                whileHover={{ y: -10, scale: 1.05 }}
                className="relative bg-white rounded-2xl p-5 shadow-xl border-2 border-gray-100 hover:border-blue-300 transition-all duration-300"
              >
                <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">2</div>
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-3 shadow-lg">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1">Get Proposals</h3>
                <p className="text-xs text-gray-600">Receive bids with AI match scores & portfolios</p>
              </motion.div>

              {/* Card 3: Fund Escrow */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                whileHover={{ y: -10, scale: 1.05 }}
                className="relative bg-white rounded-2xl p-5 shadow-2xl border-4 border-emerald-400 hover:border-emerald-500 transition-all duration-300"
              >
                <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-sm">3</div>
                <div className="absolute -top-2 -right-2">
                  <div className="px-2 py-1 bg-emerald-500 text-white text-xs font-bold rounded-lg">
                    Protected
                  </div>
                </div>
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-3 shadow-lg">
                  <Shield className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1">Fund Escrow</h3>
                <p className="text-xs text-gray-600">Money held secure until delivery confirmed</p>
              </motion.div>

              {/* Card 4: Work & Collaborate */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                whileHover={{ y: -10, scale: 1.05 }}
                className="relative bg-white rounded-2xl p-5 shadow-xl border-2 border-gray-100 hover:border-purple-300 transition-all duration-300"
              >
                <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold text-sm">4</div>
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mb-3 shadow-lg">
                  <MessageSquare className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1">Collaborate</h3>
                <p className="text-xs text-gray-600">Chat, video, whiteboard & meetings</p>
              </motion.div>

              {/* Card 5: Submit & Review */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
                whileHover={{ y: -10, scale: 1.05 }}
                className="relative bg-white rounded-2xl p-5 shadow-xl border-2 border-gray-100 hover:border-orange-300 transition-all duration-300"
              >
                <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-sm">5</div>
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center mb-3 shadow-lg">
                  <FileCheck className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1">Submit & Review</h3>
                <p className="text-xs text-gray-600">14-day review with proof-of-delivery</p>
              </motion.div>

              {/* Card 6: Release Payment */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6 }}
                whileHover={{ y: -10, scale: 1.05 }}
                className="relative bg-white rounded-2xl p-5 shadow-2xl border-4 border-green-400 hover:border-green-500 transition-all duration-300"
              >
                <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-sm">6</div>
                <div className="absolute -top-2 -right-2">
                  <div className="px-2 py-1 bg-green-500 text-white text-xs font-bold rounded-lg">
                    Auto-Release
                  </div>
                </div>
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-3 shadow-lg">
                  <DollarSign className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1">Payment Released</h3>
                <p className="text-xs text-gray-600">Approve or auto-release after 14 days</p>
              </motion.div>
            </div>
          </div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-16"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-sky-600 to-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all"
            >
              Start Your Project Now
              <ArrowRight className="w-5 h-5 inline ml-2" />
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Core Features Section - Based on README */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-full px-6 py-3 mb-6">
              <Zap className="w-5 h-5 text-emerald-600" />
              <span className="text-sm font-bold text-emerald-900">Platform Features</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black mb-6">
              Everything You Need To
              <br />
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                Outsource With Confidence
              </span>
            </h2>
            <p className="text-base text-gray-600 max-w-3xl mx-auto">
              A complete platform built specifically for software development outsourcing - not a generic freelance marketplace
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1: Intelligent Bidding */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100 hover:shadow-xl transition-all"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-4">
                <Users className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Intelligent Bidding System</h3>
              <p className="text-gray-600 text-sm mb-4">
                Post projects to marketplace, receive multiple proposals with AI match scoring, compare bids side-by-side, and auto-assign when accepted.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center"><CheckCircle2 className="w-4 h-4 text-blue-500 mr-2" /> One proposal per company per project</li>
                <li className="flex items-center"><CheckCircle2 className="w-4 h-4 text-blue-500 mr-2" /> AI match scoring by tech stack</li>
                <li className="flex items-center"><CheckCircle2 className="w-4 h-4 text-blue-500 mr-2" /> Portfolio & experience verification</li>
              </ul>
            </motion.div>

            {/* Feature 2: Escrow Payment */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-100 hover:shadow-xl transition-all"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-4">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Escrow Payment Protection</h3>
              <p className="text-gray-600 text-sm mb-4">
                Stripe-powered escrow with 14-day auto-release. Funds held until delivery confirmed. Automated dispute resolution with 7-2-2 day timeline.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center"><CheckCircle2 className="w-4 h-4 text-emerald-500 mr-2" /> 14-day review period</li>
                <li className="flex items-center"><CheckCircle2 className="w-4 h-4 text-emerald-500 mr-2" /> Auto-release on approval</li>
                <li className="flex items-center"><CheckCircle2 className="w-4 h-4 text-emerald-500 mr-2" /> Evidence-based disputes</li>
              </ul>
            </motion.div>

            {/* Feature 3: Milestone Workflow */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100 hover:shadow-xl transition-all"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mb-4">
                <GitBranch className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Milestone Workflow System</h3>
              <p className="text-gray-600 text-sm mb-4">
                Professional workflow from pending to completion. Required proof-of-delivery uploads, client feedback loops, and timeline tracking.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center"><CheckCircle2 className="w-4 h-4 text-purple-500 mr-2" /> Submit → Review → Approve flow</li>
                <li className="flex items-center"><CheckCircle2 className="w-4 h-4 text-purple-500 mr-2" /> File uploads as proof</li>
                <li className="flex items-center"><CheckCircle2 className="w-4 h-4 text-purple-500 mr-2" /> Feedback & resubmission</li>
              </ul>
            </motion.div>

            {/* Feature 4: Team Management */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border border-orange-100 hover:shadow-xl transition-all"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center mb-4">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Company & Team Management</h3>
              <p className="text-gray-600 text-sm mb-4">
                Support for solo developers, small teams, and full agencies. Manage team members with roles, workload tracking, and project assignments.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center"><CheckCircle2 className="w-4 h-4 text-orange-500 mr-2" /> Solo / Team / Agency accounts</li>
                <li className="flex items-center"><CheckCircle2 className="w-4 h-4 text-orange-500 mr-2" /> Role-based permissions</li>
                <li className="flex items-center"><CheckCircle2 className="w-4 h-4 text-orange-500 mr-2" /> Workload & capacity tracking</li>
              </ul>
            </motion.div>

            {/* Feature 5: Communication Hub */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-br from-cyan-50 to-sky-50 rounded-2xl p-6 border border-cyan-100 hover:shadow-xl transition-all"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-sky-600 flex items-center justify-center mb-4">
                <Video className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Communication Hub</h3>
              <p className="text-gray-600 text-sm mb-4">
                All-in-one collaboration: real-time chat with file sharing, video conferencing, collaborative whiteboard, meeting scheduler, and calendar.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center"><CheckCircle2 className="w-4 h-4 text-cyan-500 mr-2" /> Real-time chat & threads</li>
                <li className="flex items-center"><CheckCircle2 className="w-4 h-4 text-cyan-500 mr-2" /> Video calls & screen share</li>
                <li className="flex items-center"><CheckCircle2 className="w-4 h-4 text-cyan-500 mr-2" /> Whiteboard & meetings</li>
              </ul>
            </motion.div>

            {/* Feature 6: Project Templates */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
              className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl p-6 border border-rose-100 hover:shadow-xl transition-all"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center mb-4">
                <Layers className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">95+ Project Templates</h3>
              <p className="text-gray-600 text-sm mb-4">
                Pre-built templates across 14 categories: E-commerce, Healthcare, AI/ML, SaaS, Mobile Apps, and more. Each with milestones and estimates.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center"><CheckCircle2 className="w-4 h-4 text-rose-500 mr-2" /> 14 industry categories</li>
                <li className="flex items-center"><CheckCircle2 className="w-4 h-4 text-rose-500 mr-2" /> Pre-built milestones</li>
                <li className="flex items-center"><CheckCircle2 className="w-4 h-4 text-rose-500 mr-2" /> Cost & timeline estimates</li>
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust Section with Live Stats */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                y: [0, -30, 0],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
              className="absolute w-2 h-2 bg-white rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
            />
          ))}
        </div>

        <div className="max-w-7xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-6xl font-black mb-6">
              Trusted By Thousands
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Around The World
              </span>
            </h2>
            <p className="text-base text-gray-300 max-w-2xl mx-auto">
              Join the growing community of successful projects and happy developers
            </p>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { value: "50K+", label: "Active Developers", icon: Users },
              { value: "100K+", label: "Projects Completed", icon: Briefcase },
              { value: "$50M+", label: "Paid Out", icon: DollarSign },
              { value: "4.9/5", label: "Average Rating", icon: Star }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 text-center border border-white/20"
              >
                <stat.icon className="w-10 h-10 mx-auto mb-4 text-blue-400" />
                <div className="text-3xl font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-300">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Comprehensive Comparison Table */}
      <section className="py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full px-6 py-3 mb-6">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-bold text-blue-900">See The Difference</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black mb-6">
              Why Team@Once
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Beats The Competition
              </span>
            </h2>
            <p className="text-base text-gray-600 max-w-3xl mx-auto">
              We've built the all-in-one platform that does what others can't
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
                  <tr className="bg-gradient-to-r from-gray-50 to-blue-50">
                    <th className="px-6 py-4 text-left">
                      <div className="text-base font-black text-gray-900">Feature</div>
                    </th>
                    <th className="px-6 py-4 text-center bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600">
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mb-2">
                          <Zap className="w-6 h-6 text-purple-600" />
                        </div>
                        <div className="text-base font-black text-white">Team@Once</div>
                        <div className="text-xs text-white/80">All-in-One Platform</div>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-center">
                      <div className="text-base font-bold text-gray-700">Upwork</div>
                      <div className="text-xs text-gray-500">Marketplace</div>
                    </th>
                    <th className="px-6 py-4 text-center">
                      <div className="text-base font-bold text-gray-700">Deel</div>
                      <div className="text-xs text-gray-500">Payment Platform</div>
                    </th>
                    <th className="px-6 py-4 text-center">
                      <div className="text-base font-bold text-gray-700">Toptal</div>
                      <div className="text-xs text-gray-500">Elite Talent</div>
                    </th>
                    <th className="px-6 py-4 text-center">
                      <div className="text-base font-bold text-gray-700">Fiverr</div>
                      <div className="text-xs text-gray-500">Gig Platform</div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {[
                    { feature: "Payment Protection", teamatonce: "full", upwork: "basic", deel: false, toptal: "basic", fiverr: "basic", desc: "14-day auto-release + dispute resolution with evidence" },
                    { feature: "Proof of Delivery", teamatonce: "full", upwork: false, deel: false, toptal: false, fiverr: false, desc: "Required file uploads + timeline tracking + audit trail" },
                    { feature: "Team Management", teamatonce: "full", upwork: false, deel: false, toptal: false, fiverr: false, desc: "Company profiles with team assignment & workload tracking" },
                    { feature: "Project Workflow", teamatonce: "full", upwork: "basic", deel: false, toptal: false, fiverr: "basic", desc: "Template-based with 95+ project types & milestones" },
                    { feature: "Dispute Resolution", teamatonce: "full", upwork: "partial", deel: "partial", toptal: "partial", fiverr: "partial", desc: "Automated 7-2-2 day timeline with mediation" },
                    { feature: "AI Features", teamatonce: "full", upwork: false, deel: false, toptal: "partial", fiverr: false, desc: "Smart matching, cost estimation, team optimization" },
                    { feature: "Bidding System", teamatonce: "full", upwork: "full", deel: false, toptal: false, fiverr: "basic", desc: "Multiple proposals per project with AI scoring" },
                    { feature: "Video & Whiteboard", teamatonce: "full", upwork: false, deel: false, toptal: false, fiverr: false, desc: "Built-in video calls, screen share & collaborative whiteboard" },
                    { feature: "Meeting Scheduler", teamatonce: "full", upwork: false, deel: false, toptal: false, fiverr: false, desc: "Calendar integration with timezone support" },
                    { feature: "Contract Generation", teamatonce: "full", upwork: "basic", deel: "full", toptal: "partial", fiverr: "basic", desc: "Auto-generated contracts with e-signatures" },
                    { feature: "Real-Time Chat", teamatonce: "full", upwork: "basic", deel: false, toptal: false, fiverr: "basic", desc: "Project channels, file sharing, threaded replies" },
                    { feature: "Stripe Connect Payouts", teamatonce: "full", upwork: "partial", deel: "full", toptal: "partial", fiverr: "partial", desc: "Direct developer payouts with platform fee" },
                    { feature: "Solo/Team/Agency Support", teamatonce: "full", upwork: "partial", deel: false, toptal: false, fiverr: false, desc: "Flexible account types with role-based permissions" },
                    { feature: "Milestone Feedback Loop", teamatonce: "full", upwork: "basic", deel: false, toptal: false, fiverr: "basic", desc: "Submit → Review → Feedback → Resubmit → Approve" },
                    { feature: "Analytics Dashboard", teamatonce: "full", upwork: "basic", deel: "partial", toptal: false, fiverr: "basic", desc: "Project metrics, team performance, revenue tracking" }
                  ].map((row, index) => (
                    <motion.tr
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-blue-50 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="font-bold text-sm text-gray-900">{row.feature}</div>
                        <div className="text-xs text-gray-600 mt-1">{row.desc}</div>
                      </td>
                      <td className="px-8 py-5 text-center bg-gradient-to-r from-blue-50 to-purple-50">
                        {row.teamatonce === "full" ? (
                          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full font-bold shadow-lg">
                            <CheckCircle2 className="w-5 h-5" />
                            <span>Full</span>
                          </div>
                        ) : row.teamatonce === "partial" ? (
                          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-2 rounded-full font-bold">
                            <span>Partial</span>
                          </div>
                        ) : (
                          <X className="w-6 h-6 text-gray-300 mx-auto" />
                        )}
                      </td>
                      <td className="px-8 py-5 text-center">
                        {row.upwork === "full" ? (
                          <CheckCircle2 className="w-6 h-6 text-green-500 mx-auto" />
                        ) : row.upwork === "basic" ? (
                          <div className="text-sm font-semibold text-yellow-600">Basic</div>
                        ) : row.upwork === "partial" ? (
                          <div className="text-sm font-semibold text-yellow-600">Partial</div>
                        ) : (
                          <X className="w-6 h-6 text-gray-300 mx-auto" />
                        )}
                      </td>
                      <td className="px-8 py-5 text-center">
                        {row.deel === "full" ? (
                          <CheckCircle2 className="w-6 h-6 text-green-500 mx-auto" />
                        ) : row.deel === "partial" ? (
                          <div className="text-sm font-semibold text-yellow-600">Partial</div>
                        ) : (
                          <X className="w-6 h-6 text-gray-300 mx-auto" />
                        )}
                      </td>
                      <td className="px-8 py-5 text-center">
                        {row.toptal === "full" ? (
                          <CheckCircle2 className="w-6 h-6 text-green-500 mx-auto" />
                        ) : row.toptal === "partial" ? (
                          <div className="text-sm font-semibold text-yellow-600">Partial</div>
                        ) : (
                          <X className="w-6 h-6 text-gray-300 mx-auto" />
                        )}
                      </td>
                      <td className="px-8 py-5 text-center">
                        {row.fiverr === "full" ? (
                          <CheckCircle2 className="w-6 h-6 text-green-500 mx-auto" />
                        ) : row.fiverr === "basic" ? (
                          <div className="text-sm font-semibold text-yellow-600">Basic</div>
                        ) : (
                          <X className="w-6 h-6 text-gray-300 mx-auto" />
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gradient-to-r from-gray-50 to-blue-50">
                    <td className="px-6 py-4 font-black text-gray-900 text-base">Platform Fee</td>
                    <td className="px-6 py-4 text-center bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600">
                      <div className="text-xl font-black text-white">3-5%</div>
                      <div className="text-xs text-white/80 mt-1">Lowest in industry</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="text-base font-bold text-gray-700">10-20%</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="text-base font-bold text-gray-700">Custom</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="text-base font-bold text-gray-700">None*</div>
                      <div className="text-xs text-gray-500">+2x markup</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="text-base font-bold text-gray-700">20%</div>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 text-center"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white px-8 py-3 rounded-2xl font-black text-base shadow-2xl shadow-purple-500/30"
            >
              Start Using Team@Once Free
            </motion.button>
            <p className="text-sm text-gray-600 mt-4">No credit card required • 14-day trial • Cancel anytime</p>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <motion.div
            animate={{
              scale: [1, 1.5, 1],
              rotate: [0, 180, 360],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-0 left-1/4 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1.5, 1, 1.5],
              rotate: [360, 180, 0],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-0 right-1/4 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl"
          />
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 mb-8">
              <Zap className="w-5 h-5 text-white" />
              <span className="text-white font-bold">Start In 60 Seconds</span>
            </div>

            <h2 className="text-4xl md:text-6xl font-black text-white mb-8 leading-tight">
              Ready to Build
              <br />
              Something Amazing?
            </h2>
            <p className="text-base text-white/90 mb-12 max-w-3xl mx-auto leading-relaxed">
              Join developers and companies already using Team@Once
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 30px 60px rgba(0,0,0,0.3)" }}
                whileTap={{ scale: 0.95 }}
                className="bg-white text-purple-600 px-8 py-3 rounded-2xl font-black text-base flex items-center justify-center space-x-2 shadow-2xl"
              >
                <span>Start For Free</span>
                <ArrowRight className="w-5 h-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="border-4 border-white text-white px-8 py-3 rounded-2xl font-black text-base flex items-center justify-center space-x-2 backdrop-blur-sm bg-white/10"
              >
                <Calendar className="w-5 h-5" />
                <span>Schedule Demo</span>
              </motion.button>
            </div>

            <div className="flex items-center justify-center space-x-8 text-white/80">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5" />
                <span>No Credit Card</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5" />
                <span>14-Day Trial</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5" />
                <span>Cancel Anytime</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default TeamAtOnceLanding;