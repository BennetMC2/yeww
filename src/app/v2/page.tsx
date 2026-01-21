'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/contexts/AppContext';
import MorningBrief from '@/components/v2/MorningBrief';
import ExpandableStats from '@/components/v2/ExpandableStats';
import ProactiveInsightCard from '@/components/ProactiveInsightCard';
import { ProactiveInsight, HealthMetrics } from '@/types';

// Mock metrics for demo
const MOCK_METRICS: HealthMetrics = {
  provider: 'GARMIN',
  sleep: {
    lastNightHours: 7.8,
    quality: 'excellent',
    avgWeekHours: 6.9,
  },
  recovery: {
    score: 82,
    status: 'high',
    label: 'Body Battery',
  },
  hrv: {
    current: 58,
    baseline: 52,
    trend: 'up',
  },
  rhr: {
    current: 54,
    baseline: 56,
    trend: 'down',
  },
  steps: {
    today: 8420,
    avgDaily: 7200,
  },
  stress: {
    level: 28,
    category: 'low',
  },
};

// Mock proactive insight for demo
const MOCK_INSIGHT: ProactiveInsight = {
  id: 'demo-insight-1',
  userId: 'demo',
  message: "Your sleep efficiency jumped 23% last night—best in two weeks. Whatever you did yesterday evening, it worked. Keep that bedtime routine going.",
  type: 'notable_change',
  priority: 'medium',
  createdAt: new Date().toISOString(),
  read: false,
};

export default function TodayPage() {
  const router = useRouter();
  const {
    profile,
    isLoading,
    homeDataCache,
    fetchHomeData,
    isLoadingHomeData,
    proactiveInsights,
    fetchProactiveInsights,
    dismissInsight,
  } = useApp();

  const [inputValue, setInputValue] = useState('');

  // Skip onboarding check for v2 preview

  // Fetch data on mount
  useEffect(() => {
    if (profile?.onboardingCompleted) {
      fetchHomeData();
      fetchProactiveInsights();
    }
  }, [profile?.onboardingCompleted, fetchHomeData, fetchProactiveInsights]);

  // Handle discussing a proactive insight
  const handleDiscussInsight = (insight: ProactiveInsight) => {
    const context = `Tell me more about this: ${insight.message}`;
    router.push(`/v2/chat?context=${encodeURIComponent(context)}`);
    dismissInsight(insight.id);
  };

  // Handle tapping a metric
  const handleMetricTap = (metric: string) => {
    const context = `Tell me about my ${metric}`;
    router.push(`/v2/chat?context=${encodeURIComponent(context)}`);
  };

  // Handle sending a message
  const handleSend = () => {
    if (inputValue.trim()) {
      router.push(`/v2/chat?context=${encodeURIComponent(inputValue.trim())}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-[#B5AFA8]">Loading...</p>
      </div>
    );
  }

  // Create mock profile for preview if not onboarded
  const displayProfile = profile || {
    name: 'Demo User',
    healthScore: 72,
    checkInStreak: 5,
  };

  // Use mock metrics if no real data
  const displayMetrics = homeDataCache?.metrics ?? MOCK_METRICS;

  // Use mock insight for demo if no real insights
  const displayInsights = proactiveInsights.length > 0 ? proactiveInsights : [MOCK_INSIGHT];

  return (
    <div className="px-6 pb-6 space-y-4">
      {/* Proactive Insights */}
      <div>
        {displayInsights.map((insight) => (
          <ProactiveInsightCard
            key={insight.id}
            insight={insight}
            onDismiss={dismissInsight}
            onDiscuss={handleDiscussInsight}
          />
        ))}
      </div>

      {/* Morning Brief */}
      <MorningBrief
        name={displayProfile.name}
        metrics={displayMetrics}
        isLoading={false}
      />

      {/* Expandable Stats */}
      <ExpandableStats
        metrics={displayMetrics}
        isLoading={false}
        onMetricTap={handleMetricTap}
      />

      {/* Chat Input */}
      <div className="pt-2">
        <div className="flex items-center gap-2 bg-white rounded-2xl px-4 py-3 shadow-sm">
          <input
            type="text"
            placeholder="Ask me anything..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-[#2D2A26] placeholder-[#B5AFA8] focus:outline-none"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="w-9 h-9 rounded-full bg-[#E07A5F] text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:bg-[#D36B4F]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
