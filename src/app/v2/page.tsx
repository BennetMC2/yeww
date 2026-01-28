'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Scale, Camera, FlaskConical, Zap, ChevronRight, AlertCircle } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import HealthScoreRing from '@/components/v2/HealthScoreRing';
import BondCard from '@/components/v2/BondCard';
import QuickStatsGrid from '@/components/v2/QuickStatsGrid';
import HPCard from '@/components/v2/HPCard';
import InsightCard from '@/components/v2/InsightCard';
import WeightEntryModal from '@/components/data/WeightEntryModal';
import ScreenshotImportModal from '@/components/data/ScreenshotImportModal';
import PatternCard from '@/components/insights/PatternCard';
import Link from 'next/link';
import { ProactiveInsight, HealthMetrics, DetectedPattern, ProofOpportunity, ReputationLevel } from '@/types';

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
  const [hpBalance, setHpBalance] = useState<number>(0);
  const [isLoadingHP, setIsLoadingHP] = useState(true);

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
          // Fetch HP balance
          fetch(`/api/rewards/balance?userId=${userId}`)
            .then(res => res.ok ? res.json() : { hpBalance: 0 })
            .catch(() => ({ hpBalance: 0 })),
        ])
          .then(([, , patternsData, opportunitiesData, hpData]) => {
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
            // Set HP balance
            setHpBalance(hpData.hpBalance ?? 0);
            setIsLoadingHP(false);
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
    reputationLevel: 'regular' as ReputationLevel,
    reputationPoints: 180,
  };

  // Use mock metrics if no real data
  const displayMetrics = homeDataCache?.metrics ?? MOCK_METRICS;

  // Track if using mock data
  // If we have real proactive insights, we have a connected wearable even if metrics fetch failed
  const hasRealInsights = proactiveInsights.length > 0;
  const usingMockMetrics = !homeDataCache?.metrics && !hasRealInsights;
  const usingMockInsights = !hasRealInsights;

  // Use mock insight for demo if no real insights
  // Limit to 2 most recent insights to avoid overwhelming the user
  const displayInsights = hasRealInsights
    ? proactiveInsights.slice(0, 2)
    : [MOCK_INSIGHT];

  // Calculate sleep quality from metrics
  const getSleepQuality = () => {
    const hours = displayMetrics.sleep?.lastNightHours ?? 0;
    if (hours >= 7.5) return 'excellent';
    if (hours >= 7) return 'good';
    if (hours >= 6) return 'fair';
    return 'poor';
  };

  // Calculate recovery score
  const getRecoveryScore = () => {
    return displayMetrics.recovery?.score ?? 75;
  };

  // Get activity status
  const getActivityStatus = () => {
    const steps = displayMetrics.steps?.today ?? 0;
    const avgSteps = displayMetrics.steps?.avgDaily ?? 7000;
    if (steps >= avgSteps * 1.2) return 'Crushing it';
    if (steps >= avgSteps) return 'On track';
    if (steps >= avgSteps * 0.7) return 'Behind pace';
    return 'Getting started';
  };

  return (
    <div className="px-6 pb-6 space-y-5">
      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 animate-fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Mock Data Indicator */}
      {(usingMockMetrics || usingMockInsights) && !isLoadingInsights && (
        <div className="text-xs text-amber-600 text-center py-1 animate-fade-in">
          Using demo data — connect your wearable for real metrics
        </div>
      )}

      {/* Health Score Ring - Hero Section */}
      <div
        className="rounded-[24px] p-5 animate-on-load animate-fade-in"
        style={{
          background: 'linear-gradient(135deg, #FFFFFF 0%, #FDF9F5 100%)',
          boxShadow: '0 4px 24px rgba(224, 122, 95, 0.12), 0 1px 3px rgba(45, 42, 38, 0.08)',
        }}
      >
        <HealthScoreRing
          score={displayProfile.healthScore ?? 72}
          sleepQuality={getSleepQuality()}
          recoveryScore={getRecoveryScore()}
          activityStatus={getActivityStatus()}
          isLoading={isLoadingHomeData}
        />
      </div>

      {/* Our Bond Card */}
      <div className="animate-on-load animate-fade-in stagger-1">
        <BondCard
          level={displayProfile.reputationLevel ?? 'starter'}
          points={displayProfile.reputationPoints ?? 0}
          isLoading={isLoading}
        />
      </div>

      {/* Quick Stats Grid */}
      <div className="animate-on-load animate-fade-in stagger-2">
        <QuickStatsGrid
          metrics={displayMetrics}
          isLoading={isLoadingHomeData}
          onMetricTap={handleMetricTap}
        />
      </div>

      {/* HP Card */}
      <div className="animate-on-load animate-fade-in stagger-3">
        <HPCard
          balance={hpBalance}
          isLoading={isLoadingHP}
        />
      </div>

      {/* Proactive Insights */}
      <div className="animate-on-load animate-fade-in stagger-4">
        {isLoadingInsights ? (
          <InsightCard
            insight={MOCK_INSIGHT}
            onDismiss={() => {}}
            onDiscuss={() => {}}
          />
        ) : (
          displayInsights.map((insight, index) => (
            <div
              key={insight.id}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <InsightCard
                insight={insight}
                onDismiss={dismissInsight}
                onDiscuss={handleDiscussInsight}
              />
            </div>
          ))
        )}
      </div>

      {/* Opportunity Teaser */}
      {eligibleOpportunity && (
        <Link
          href="/v2/rewards"
          className="block rounded-[20px] p-4 transition-all hover:-translate-y-0.5 active:scale-[0.98] animate-on-load animate-slide-in-right stagger-5"
          style={{
            background: 'linear-gradient(135deg, rgba(224, 122, 95, 0.1) 0%, rgba(244, 162, 97, 0.1) 100%)',
            border: '1px solid rgba(224, 122, 95, 0.2)',
            boxShadow: '0 2px 12px rgba(224, 122, 95, 0.1)',
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-[14px] flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #E07A5F 0%, #D36B4F 100%)',
                  boxShadow: '0 4px 12px rgba(224, 122, 95, 0.4)',
                }}
              >
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-[14px] font-semibold text-[#2D2A26]">Ready to earn!</p>
                <p className="text-[12px] text-[#8A8580]">
                  {eligibleOpportunity.title} — {eligibleOpportunity.hpReward} HP
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[#8A8580]" />
          </div>
        </Link>
      )}

      {/* Detected Patterns */}
      {patterns.length > 0 && (
        <div className="animate-on-load animate-fade-in stagger-6">
          <h3 className="text-[13px] font-semibold text-[#8A8580] mb-3">Your Patterns</h3>
          <div className="space-y-3">
            {patterns.slice(0, 3).map((pattern, index) => (
              <div
                key={pattern.id}
                className="animate-on-load animate-slide-in-right"
                style={{ animationDelay: `${500 + index * 100}ms`, animationFillMode: 'forwards' }}
              >
                <PatternCard
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
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data Sources */}
      <div className="animate-on-load animate-fade-in stagger-7">
        <h3 className="text-[13px] font-semibold text-[#8A8580] mb-3">Add Data</h3>
        <div className="flex gap-2.5">
          <button
            onClick={() => setShowWeightModal(true)}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-[16px] text-[#2D2A26] transition-all hover:-translate-y-0.5 active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #FFFFFF 0%, #FDF9F5 100%)',
              boxShadow: '0 2px 12px rgba(45, 42, 38, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
            }}
          >
            <Scale className="w-4 h-4 text-[#E07A5F]" />
            <span className="text-[13px] font-semibold">Weight</span>
          </button>
          <button
            onClick={() => setShowScreenshotModal(true)}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-[16px] text-[#2D2A26] transition-all hover:-translate-y-0.5 active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #FFFFFF 0%, #FDF9F5 100%)',
              boxShadow: '0 2px 12px rgba(45, 42, 38, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
            }}
          >
            <Camera className="w-4 h-4 text-[#E07A5F]" />
            <span className="text-[13px] font-semibold">Screenshot</span>
          </button>
          <button
            disabled
            className="flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-[16px] text-[#B5AFA8] cursor-not-allowed opacity-50"
            style={{
              background: 'linear-gradient(135deg, #FFFFFF 0%, #FDF9F5 100%)',
            }}
          >
            <FlaskConical className="w-4 h-4" />
            <span className="text-[13px] font-semibold">Labs</span>
          </button>
        </div>
      </div>

      {/* Chat Input */}
      <div className="animate-on-load animate-fade-in stagger-8">
        <div
          className="flex items-center gap-3 rounded-[20px] px-4 py-3.5"
          style={{
            background: 'linear-gradient(135deg, #FFFFFF 0%, #FDF9F5 100%)',
            boxShadow: '0 2px 12px rgba(45, 42, 38, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
          }}
        >
          <input
            type="text"
            placeholder="Ask me anything..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-[#2D2A26] text-[15px] placeholder-[#B5AFA8] focus:outline-none"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="w-10 h-10 rounded-[14px] text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:-translate-y-0.5 active:scale-[0.95]"
            style={{
              background: 'linear-gradient(135deg, #E07A5F 0%, #D36B4F 100%)',
              boxShadow: inputValue.trim() ? '0 4px 12px rgba(224, 122, 95, 0.3)' : 'none',
            }}
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
