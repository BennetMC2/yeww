'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import HealthMetricsDashboard from '@/components/HealthMetricsDashboard';
import DailyInsightCard from '@/components/home/DailyInsightCard';
import HealthScoreWithTrend from '@/components/home/HealthScoreWithTrend';
import ProgressFooter from '@/components/home/ProgressFooter';
import AddDataCTA from '@/components/home/AddDataCTA';
import SmartCheckInCard from '@/components/home/SmartCheckInCard';
import { useApp } from '@/contexts/AppContext';
import { generateCheckInContext, CheckInContext, getCheckInResponse } from '@/lib/checkInContext';
import { calculateStreakBonus, POINTS_CONFIG } from '@/lib/scores';

export default function HomePage() {
  const router = useRouter();
  const {
    profile,
    isLoading,
    recordCheckIn,
    addMessage,
    homeDataCache,
    fetchHomeData,
    isLoadingHomeData,
  } = useApp();

  const [checkInContext, setCheckInContext] = useState<CheckInContext | null>(null);
  const [checkedInToday, setCheckedInToday] = useState(false);

  // Check if already checked in today
  useEffect(() => {
    if (profile?.lastCheckIn) {
      const lastCheckIn = new Date(profile.lastCheckIn);
      const now = new Date();
      setCheckedInToday(lastCheckIn.toDateString() === now.toDateString());
    }
  }, [profile?.lastCheckIn]);

  // Redirect to onboarding if not completed
  useEffect(() => {
    if (!isLoading && !profile?.onboardingCompleted) {
      router.replace('/onboarding');
    }
  }, [isLoading, profile, router]);

  // Fetch home data (uses cache if available)
  useEffect(() => {
    if (profile?.onboardingCompleted) {
      fetchHomeData();
    }
  }, [profile?.onboardingCompleted, fetchHomeData]);

  // Generate check-in context when metrics change
  useEffect(() => {
    if (profile) {
      const context = generateCheckInContext(
        homeDataCache?.metrics ?? null,
        profile.checkInStreak,
        profile.lastCheckIn
      );
      setCheckInContext(context);
    }
  }, [homeDataCache?.metrics, profile?.checkInStreak, profile?.lastCheckIn, profile]);

  // Handle check-in
  const handleCheckIn = (value: string) => {
    recordCheckIn();
    setCheckedInToday(true);

    // Map value to user message
    const option = checkInContext?.options.find(o => o.value === value);
    const responseText = option
      ? `${option.emoji || ''} ${option.label}`.trim()
      : value;

    addMessage('user', responseText);

    // Get response message
    const feedbackMessage = getCheckInResponse(value, checkInContext?.contextType || 'default');
    addMessage('assistant', feedbackMessage);
  };

  // Calculate streak bonus
  const streakBonus = profile ? calculateStreakBonus(profile.checkInStreak + 1) : 0;

  // Show loading state only on initial app load (not when navigating back)
  const showSkeleton = isLoading || !profile?.onboardingCompleted;

  if (showSkeleton) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAF6F1] pb-20">
        {/* Header skeleton */}
        <div className="px-6 pt-4 pb-2">
          <div className="flex items-center justify-between">
            <div className="skeleton w-16 h-6 rounded-lg" />
            <div className="skeleton w-8 h-8 rounded-full" />
          </div>
        </div>

        <main className="flex-1 flex flex-col px-6 pt-4 space-y-4">
          {/* Insight skeleton */}
          <div className="skeleton h-20 rounded-2xl" />

          {/* Health Score skeleton */}
          <div className="flex flex-col items-center py-4">
            <div className="skeleton w-[200px] h-[200px] rounded-full" />
            <div className="skeleton w-24 h-6 rounded-full mt-3" />
          </div>

          {/* Metrics section skeleton */}
          <div className="skeleton h-32 rounded-2xl" />

          {/* CTA skeleton */}
          <div className="skeleton h-20 rounded-2xl" />

          {/* Check-in skeleton */}
          <div className="skeleton h-40 rounded-2xl" />

          {/* Progress footer skeleton */}
          <div className="skeleton h-24 rounded-2xl" />
        </main>

        <BottomNav />
      </div>
    );
  }

  // Use cached data or show loading states for individual components
  const isLoadingInsights = isLoadingHomeData && !homeDataCache;

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF6F1] pb-20">
      <Header />

      <main className="flex-1 flex flex-col px-6 pt-4 space-y-4">
        {/* Daily Insight Card */}
        <DailyInsightCard
          insight={homeDataCache?.insight ?? null}
          isLoading={isLoadingInsights}
        />

        {/* Health Score with Trend */}
        <HealthScoreWithTrend
          score={profile.healthScore}
          trend={homeDataCache?.scoreTrend ?? null}
          onClick={() => router.push('/health')}
          isLoading={isLoadingInsights}
        />

        {/* Health Metrics Dashboard */}
        <div>
          <h2 className="text-sm font-medium text-[#8A8580] uppercase tracking-wider mb-3 px-1">
            Today&apos;s Metrics
          </h2>
          <HealthMetricsDashboard
            userId={profile.id}
            initialMetrics={homeDataCache?.metrics}
            initialHasData={homeDataCache?.hasWearable}
          />
        </div>

        {/* Add Data CTA */}
        <AddDataCTA
          dataSources={profile.dataSources}
          hasWearable={homeDataCache?.hasWearable ?? false}
        />

        {/* Smart Check-in Card */}
        {checkInContext && (
          <SmartCheckInCard
            checkInContext={checkInContext}
            onCheckIn={handleCheckIn}
            pointsEarned={POINTS_CONFIG.CHECK_IN}
            streakBonus={streakBonus}
            alreadyCheckedIn={checkedInToday}
          />
        )}

        {/* Progress Footer */}
        <ProgressFooter
          streak={profile.checkInStreak}
          points={profile.points}
          reputationLevel={profile.reputationLevel}
          reputationPoints={profile.reputationPoints}
        />
      </main>

      <BottomNav />
    </div>
  );
}
