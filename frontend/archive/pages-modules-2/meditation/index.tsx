import React from 'react';

// Import new modular components
import { WelcomeSection } from '../../components/meditation/WelcomeSection';
import { TodaysPractice } from '../../components/meditation/TodaysPractice';
import { MeditationWheelContainer } from '../../components/meditation/MeditationWheelContainer';
import { FeaturedSessions } from '../../components/meditation/FeaturedSessions';
import { ExploreMore } from '../../components/meditation/ExploreMore';
import { InspirationalFooter } from '../../components/meditation/InspirationalFooter';

// Import hooks and utilities
import { useMeditationDataManager } from '../../components/meditation/MeditationDataManager';
import { useMeditationWheelManager } from '../../components/meditation/MeditationWheelManager';

const MeditationHome: React.FC = () => {
  // Use the new modular data manager hook
  const {
    meditationOptions,
    userStats,
    quickSessions,
    featuredSessions,
    weeklyStats,
    avgDailyMinutes,
    typedAudioLibrary,
    loading,
    statsLoading,
    goalsLoading,
    categoriesError
  } = useMeditationDataManager();

  // Use the meditation wheel manager hook
  const {
    selectedDuration,
    setSelectedDuration,
    selectedCategory,
    handleOptionClick,
    handleSubOptionClick,
    handleBackClick,
    getGreeting,
    getColorForCategory,
    getFilteredSessionCount
  } = useMeditationWheelManager(typedAudioLibrary);
















  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <WelcomeSection 
        greeting={getGreeting()}
        currentStreak={userStats.currentStreak}
        totalSessions={userStats.totalSessions}
        statsLoading={statsLoading}
      />

      {/* Primary Section - Today's Focus & Circular Wheel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Practice */}
        <TodaysPractice 
          userStats={userStats}
          quickSessions={quickSessions}
          weeklyStats={weeklyStats}
          avgDailyMinutes={avgDailyMinutes}
          goalsLoading={goalsLoading}
          statsLoading={statsLoading}
        />

        {/* Meditation Wheel Container */}
        <MeditationWheelContainer 
          selectedCategory={selectedCategory}
          selectedDuration={selectedDuration}
          setSelectedDuration={setSelectedDuration}
          meditationOptions={meditationOptions}
          typedAudioLibrary={typedAudioLibrary}
          loading={loading}
          onOptionClick={handleOptionClick}
          onSubOptionClick={handleSubOptionClick}
          onBackClick={handleBackClick}
          getColorForCategory={getColorForCategory}
          getFilteredSessionCount={getFilteredSessionCount}
        />
      </div>

      {/* Secondary Section - Features */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Featured Sessions */}
        <FeaturedSessions sessions={featuredSessions} />

        {/* Explore More */}
        <ExploreMore />
      </div>

      {/* Inspirational Footer */}
      <InspirationalFooter />
    </div>
  );
};

export default MeditationHome;