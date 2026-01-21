'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/contexts/AppContext';
import MorningBrief from '@/components/v2/MorningBrief';
import ExpandableStats from '@/components/v2/ExpandableStats';
import ProactiveInsightCard from '@/components/ProactiveInsightCard';
import { ProactiveInsight } from '@/types';

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

  // Redirect to onboarding if not completed
  useEffect(() => {
    if (!isLoading && !profile?.onboardingCompleted) {
      router.replace('/onboarding');
    }
  }, [isLoading, profile, router]);

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

  if (isLoading || !profile?.onboardingCompleted) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-[#B5AFA8]">Loading...</p>
      </div>
    );
  }

  return (
    <div className="px-6 pb-6 space-y-4">
      {/* Proactive Insights */}
      {proactiveInsights.length > 0 && (
        <div>
          {proactiveInsights.map((insight) => (
            <ProactiveInsightCard
              key={insight.id}
              insight={insight}
              onDismiss={dismissInsight}
              onDiscuss={handleDiscussInsight}
            />
          ))}
        </div>
      )}

      {/* Morning Brief */}
      <MorningBrief
        name={profile.name}
        metrics={homeDataCache?.metrics ?? null}
        isLoading={isLoadingHomeData && !homeDataCache}
      />

      {/* Expandable Stats */}
      <ExpandableStats
        metrics={homeDataCache?.metrics ?? null}
        isLoading={isLoadingHomeData && !homeDataCache}
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
