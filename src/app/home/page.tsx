'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { DailyInsight, HealthScoreTrend, HealthMetrics } from '@/types';
import { generateCheckInContext, CheckInContext, getCheckInResponse } from '@/lib/checkInContext';
import { calculateStreakBonus, POINTS_CONFIG } from '@/lib/scores';

export default function HomePage() {
  const router = useRouter();
  const { profile, isLoading, recordCheckIn, addMessage, recalculateScores } = useApp();

  // New state for insights and trends
  const [dailyInsight, setDailyInsight] = useState<DailyInsight | null>(null);
  const [scoreTrend, setScoreTrend] = useState<HealthScoreTrend | null>(null);
  const [checkInContext, setCheckInContext] = useState<CheckInContext | null>(null);
  const [healthMetrics, setHealthMetrics] = useState<HealthMetrics | null>(null);
  const [hasWearable, setHasWearable] = useState(false);
  const [isLoadingInsights, setIsLoadingInsights] = useState(true);
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

  // Recalculate scores on mount
  useEffect(() => {
    if (profile?.onboardingCompleted) {
      recalculateScores();
    }
  }, [profile?.onboardingCompleted, recalculateScores]);

  // Fetch insights, trends, and metrics
  const fetchHomeData = useCallback(async () => {
    if (!profile?.id) return;

    setIsLoadingInsights(true);

    try {
      // Fetch metrics FIRST to populate cache, then fetch others in parallel
      // This prevents 3x redundant calls to getLatestHealthMetrics
      const metricsRes = await fetch(`/api/health/metrics?userId=${encodeURIComponent(profile.id)}`);

      // Now fetch insights and history (will use cached metrics)
      const [insightRes, historyRes] = await Promise.all([
        fetch(`/api/insights/daily?userId=${encodeURIComponent(profile.id)}`),
        fetch(`/api/health/score-history?userId=${encodeURIComponent(profile.id)}`),
      ]);

      // Process responses
      if (insightRes.ok) {
        const data = await insightRes.json();
        setDailyInsight(data.insight);
      }

      if (historyRes.ok) {
        const data = await historyRes.json();
        setScoreTrend(data.scoreTrend);
      }

      let hasDevice = false;
      if (metricsRes.ok) {
        const data = await metricsRes.json();
        setHealthMetrics(data.metrics);
        hasDevice = data.hasData;

        // Generate check-in context based on metrics
        const context = generateCheckInContext(
          data.metrics,
          profile.checkInStreak,
          profile.lastCheckIn
        );
        setCheckInContext(context);
      } else {
        // Generate default check-in context
        const context = generateCheckInContext(
          null,
          profile.checkInStreak,
          profile.lastCheckIn
        );
        setCheckInContext(context);
      }

      setHasWearable(hasDevice);
    } catch (error) {
      console.error('Error fetching home data:', error);
      // Set fallback check-in context
      const context = generateCheckInContext(
        null,
        profile?.checkInStreak ?? 0,
        profile?.lastCheckIn ?? null
      );
      setCheckInContext(context);
    } finally {
      setIsLoadingInsights(false);
    }
  }, [profile?.id, profile?.checkInStreak, profile?.lastCheckIn]);

  useEffect(() => {
    if (profile?.onboardingCompleted) {
      fetchHomeData();
    }
  }, [profile?.onboardingCompleted, fetchHomeData]);

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

  if (isLoading || !profile?.onboardingCompleted) {
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

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF6F1] pb-20">
      <Header />

      <main className="flex-1 flex flex-col px-6 pt-4 space-y-4">
        {/* Daily Insight Card */}
        <DailyInsightCard
          insight={dailyInsight}
          isLoading={isLoadingInsights}
        />

        {/* Health Score with Trend */}
        <HealthScoreWithTrend
          score={profile.healthScore}
          trend={scoreTrend}
          onClick={() => router.push('/health')}
          isLoading={isLoadingInsights}
        />

        {/* Health Metrics Dashboard */}
        <div>
          <h2 className="text-sm font-medium text-[#8A8580] uppercase tracking-wider mb-3 px-1">
            Today&apos;s Metrics
          </h2>
          <HealthMetricsDashboard userId={profile.id} />
        </div>

        {/* Add Data CTA */}
        <AddDataCTA
          dataSources={profile.dataSources}
          hasWearable={hasWearable}
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
