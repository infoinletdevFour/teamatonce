import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sparkles, Play, Pause, ChevronLeft, ChevronRight } from 'lucide-react';
import { heroSlides } from '@/lib/landing-data';
import { SearchMockup, DashboardMockup, PaymentMockup, GlobalMockup } from './mockups';

/**
 * HeroSlider Component
 * Main hero section with auto-playing carousel and visual mockups
 * Features 4 slides showcasing different platform capabilities
 */

interface HeroSliderProps {
  autoPlayInterval?: number;
}

export const HeroSlider: React.FC<HeroSliderProps> = ({ autoPlayInterval = 5000 }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);

  // Auto-play functionality
  useEffect(() => {
    if (isAutoPlay) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
      }, autoPlayInterval);
      return () => clearInterval(timer);
    }
  }, [isAutoPlay, autoPlayInterval]);

  // Render appropriate visual mockup based on slide type
  const renderVisual = (type: string) => {
    switch (type) {
      case 'search':
        return <SearchMockup />;
      case 'dashboard':
        return <DashboardMockup />;
      case 'payment':
        return <PaymentMockup />;
      case 'global':
        return <GlobalMockup />;
      default:
        return null;
    }
  };

  // Navigation handlers
  const goToPrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  const goToNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const toggleAutoPlay = () => {
    setIsAutoPlay((prev) => !prev);
  };

  return (
    <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden min-h-[90vh] flex items-center">
      {/* Animated Background Gradient Orbs */}
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
            {/* Left Content */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center space-x-2 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-full px-6 py-3 mb-8 shadow-lg"
              >
                <Sparkles className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {heroSlides[currentSlide].subtitle}
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className={`text-4xl md:text-5xl font-black mb-6 leading-tight bg-gradient-to-r ${heroSlides[currentSlide].gradient} bg-clip-text text-transparent`}
              >
                {heroSlides[currentSlide].title}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-base text-gray-700 mb-8 leading-relaxed"
              >
                {heroSlides[currentSlide].description}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-wrap gap-4 mb-8"
              >
                {heroSlides[currentSlide].stats.map((stat, idx) => (
                  <div
                    key={idx}
                    className="bg-white/70 backdrop-blur-sm rounded-2xl px-6 py-3 shadow-lg border border-gray-200"
                  >
                    <div className="font-bold text-gray-900">{stat}</div>
                  </div>
                ))}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}
                  whileTap={{ scale: 0.95 }}
                  className={`bg-gradient-to-r ${heroSlides[currentSlide].gradient} text-white px-8 py-3 rounded-2xl font-bold text-sm flex items-center justify-center space-x-2 shadow-2xl`}
                >
                  <span>Try It Now</span>
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="border-3 border-gray-300 bg-white/50 backdrop-blur-sm text-gray-900 px-8 py-3 rounded-2xl font-bold text-sm flex items-center justify-center space-x-2 shadow-xl"
                >
                  <Play className="w-5 h-5" />
                  <span>Watch Demo</span>
                </motion.button>
              </motion.div>
            </div>

            {/* Right Visual Mockup */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="relative text-white"
            >
              {renderVisual(heroSlides[currentSlide].visual)}
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* Slider Navigation Controls */}
        <div className="flex items-center justify-center space-x-6 mt-12">
          {/* Previous Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={goToPrevSlide}
            className="w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </motion.button>

          {/* Dot Indicators */}
          <div className="flex space-x-3">
            {heroSlides.map((_, idx) => (
              <motion.button
                key={idx}
                onClick={() => goToSlide(idx)}
                whileHover={{ scale: 1.2 }}
                className={`h-3 rounded-full transition-all ${
                  idx === currentSlide
                    ? 'w-12 bg-gradient-to-r from-blue-600 to-purple-600'
                    : 'w-3 bg-gray-300'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          {/* Next Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={goToNextSlide}
            className="w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6 text-gray-700" />
          </motion.button>

          {/* Play/Pause Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleAutoPlay}
            className="w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center hover:shadow-xl ml-4 transition-shadow"
            aria-label={isAutoPlay ? 'Pause autoplay' : 'Start autoplay'}
          >
            {isAutoPlay ? (
              <Pause className="w-6 h-6 text-gray-700" />
            ) : (
              <Play className="w-6 h-6 text-gray-700" />
            )}
          </motion.button>
        </div>
      </div>
    </section>
  );
};

export default HeroSlider;
