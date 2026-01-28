'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Scale, Camera, FlaskConical, Zap, ChevronRight, AlertCircle } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import MorningBrief from '@/components/v2/MorningBrief';
import ExpandableStats from '@/components/v2/ExpandableStats';
import ProactiveInsightCard from '@/components/ProactiveInsightCard';
import WeightEntryModal from '@/components/data/WeightEntryModal';
import ScreenshotImportModal from '@/components/data/ScreenshotImportModal';
import PatternCard from '@/components/insights/PatternCard';
import Link from 'next/link';
import { ProactiveInsight, HealthMetrics, DetectedPattern, ProofOpportunity } from '@/types';

// Pattern response from API
interface PatternResponse {
  id: string;
  description: string;
  confidence: number;
  lastObserved: string;
  metricA: string;
  metricB?: string;
  correlationStrength?: number;
  direction?: 'positive' | 'negative';
  sampleSize?: number;
}

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
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showScreenshotModal, setShowScreenshotModal] = useState(false);
  const [patterns, setPatterns] = useState<DetectedPattern[]>([]);
  const [eligibleOpportunity, setEligibleOpportunity] = useState<(ProofOpportunity & { isEligible: boolean }) | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(true);

  // Track if initial fetch has been done to prevent multiple triggers
  const hasFetchedRef = useRef(false);
  const profileIdRef = useRef<string | null>(null);

  // Skip onboarding check for v2 preview

  // Fetch all data on mount - consolidated to prevent multiple re-renders
  useEffect(() => {
    // Only fetch once when profile is ready and onboarding is completed
    if (profile?.onboardingCompleted && !hasFetchedRef.current) {
      // Also check if profile ID changed (e.g., user switch)
      if (profileIdRef.current !== profile.id) {
        profileIdRef.current = profile.id;
        hasFetchedRef.current = true;
        setIsLoadingInsights(true);
        setError(null);

        const userId = profile.id;

        // Fetch all data in parallel
        Promise.all([
          fetchHomeData(true), // Force refresh to bypass cache
          fetchProactiveInsights(),
          // Fetch patterns
          fetch(`/api/insights/patterns?userId=${userId}`)
            .then(res => res.ok ? res.json() : { patterns: [] })
            .catch(() => ({ patterns: [] })),
          // Fetch opportunities
          fetch(`/api/proofs/opportunities?userId=${userId}`)
            .then(res => res.ok ? res.json() : { opportunities: [] })
            .catch(() => ({ opportunities: [] })),
        ])
          .then(([, , patternsData, opportunitiesData]) => {
            // Set patterns
            if (patternsData.patterns) {
              setPatterns(patternsData.patterns.map((p: PatternResponse) => ({
                id: p.id,
                description: p.description,
                confidence: p.confidence,
                lastTriggered: p.lastObserved,
                metricA: p.metricA,
                metricB: p.metricB,
                correlationStrength: p.correlationStrength,
                direction: p.direction,
                sampleSize: p.sampleSize,
              })));
            }
            // Set eligible opportunity
            const eligible = opportunitiesData.opportunities?.find(
              (o: ProofOpportunity & { isEligible: boolean; alreadyClaimed: boolean }) =>
                o.isEligible && !o.alreadyClaimed
            );
            if (eligible) {
              setEligibleOpportunity(eligible);
            }
          })
          .catch((err) => {
            console.error('Error fetching initial data:', err);
            setError('Failed to load some data. Pull down to refresh.');
          })
          .finally(() => {
            setIsLoadingInsights(false);
          });
      }
    }
  }, [profile?.onboardingCompleted, profile?.id, fetchHomeData, fetchProactiveInsights]);

  // Handle discussing a proactive insight
  const handleDiscussInsight = (insight: ProactiveInsight) => {
    const context = `Tell me more about this: ${insight.message}`;
    router.push(`/v2/chat?context=${encodeURIComponent(context)}`);
    dismissInsight(insight.id);
  };

  // Handle tapping a pattern
  const handlePatternTap = (pattern: { id: string; description: string }) => {
    const context = `Tell me more about this pattern: ${pattern.description}`;
    router.push(`/v2/chat?context=${encodeURIComponent(context)}`);
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

  // Handle saving weight
  const handleSaveWeight = async (weightKg: number, date: string) => {
    const response = await fetch('/api/health/weight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: profile?.id || 'demo-user',
        weightKg,
        date,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to save weight');
    }

    // Refresh home data to show updated weight
    fetchHomeData();
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

  // Track if using mock data
  const usingMockMetrics = !homeDataCache?.metrics;
  const usingMockInsights = proactiveInsights.length === 0;

  // Use mock insight for demo if no real insights
  // Limit to 2 most recent insights to avoid overwhelming the user
  const displayInsights = proactiveInsights.length > 0
    ? proactiveInsights.slice(0, 2)
    : [MOCK_INSIGHT];

  return (
    <div className="px-6 pb-6 space-y-4">
      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Mock Data Indicator */}
      {(usingMockMetrics || usingMockInsights) && !isLoadingInsights && (
        <div className="text-xs text-amber-600 text-center py-1">
          Using demo data — connect your wearable for real metrics
        </div>
      )}

      {/* Proactive Insights */}
      <div>
        {isLoadingInsights ? (
          <div className="bg-white rounded-2xl p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        ) : (
          displayInsights.map((insight) => (
            <ProactiveInsightCard
              key={insight.id}
              insight={insight}
              onDismiss={dismissInsight}
              onDiscuss={handleDiscussInsight}
            />
          ))
        )}
      </div>

      {/* Opportunity Teaser */}
      {eligibleOpportunity && (
        <Link
          href="/v2/rewards"
          className="block bg-gradient-to-r from-[#E07A5F]/10 to-[#F4A261]/10 border border-[#E07A5F]/20 rounded-xl p-4 hover:from-[#E07A5F]/15 hover:to-[#F4A261]/15 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#E07A5F]/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-[#E07A5F]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#2D2A26]">Ready to earn!</p>
                <p className="text-xs text-[#8A8580]">
                  {eligibleOpportunity.title} - {eligibleOpportunity.hpReward} HP
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[#8A8580]" />
          </div>
        </Link>
      )}

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

      {/* Detected Patterns */}
      {patterns.length > 0 && (
        <div className="pt-2">
          <h3 className="text-sm font-medium text-[#8A8580] mb-2">Your Patterns</h3>
          <div className="space-y-2">
            {patterns.slice(0, 3).map((pattern) => (
              <PatternCard
                key={pattern.id}
                pattern={{
                  id: pattern.id,
                  description: pattern.description,
                  metricA: pattern.metricA || '',
                  metricB: pattern.metricB,
                  correlationStrength: pattern.correlationStrength,
                  confidence: pattern.confidence,
                  direction: pattern.direction,
                  sampleSize: pattern.sampleSize,
                }}
                onTap={handlePatternTap}
              />
            ))}
          </div>
        </div>
      )}

      {/* Data Sources */}
      <div className="pt-2">
        <h3 className="text-sm font-medium text-[#8A8580] mb-2">Add Data</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowWeightModal(true)}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-white rounded-xl text-[#2D2A26] hover:bg-[#F5EDE4] transition-colors"
          >
            <Scale className="w-4 h-4 text-[#E07A5F]" />
            <span className="text-sm font-medium">Weight</span>
          </button>
          <button
            onClick={() => setShowScreenshotModal(true)}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-white rounded-xl text-[#2D2A26] hover:bg-[#F5EDE4] transition-colors"
          >
            <Camera className="w-4 h-4 text-[#E07A5F]" />
            <span className="text-sm font-medium">Screenshot</span>
          </button>
          <button
            disabled
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-white/50 rounded-xl text-[#B5AFA8] cursor-not-allowed"
          >
            <FlaskConical className="w-4 h-4" />
            <span className="text-sm font-medium">Labs</span>
          </button>
        </div>
      </div>

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

      {/* Modals */}
      <WeightEntryModal
        isOpen={showWeightModal}
        onClose={() => setShowWeightModal(false)}
        onSave={handleSaveWeight}
      />
      <ScreenshotImportModal
        isOpen={showScreenshotModal}
        onClose={() => setShowScreenshotModal(false)}
        userId={profile?.id || 'demo-user'}
        onSaveComplete={() => fetchHomeData()}
      />
    </div>
  );
}
