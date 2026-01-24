'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Scale, Camera, FlaskConical } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import MorningBrief from '@/components/v2/MorningBrief';
import ExpandableStats from '@/components/v2/ExpandableStats';
import ProactiveInsightCard from '@/components/ProactiveInsightCard';
import WeightEntryModal from '@/components/data/WeightEntryModal';
import ScreenshotImportModal from '@/components/data/ScreenshotImportModal';
import PatternCard from '@/components/insights/PatternCard';
import { ProactiveInsight, HealthMetrics, DetectedPattern } from '@/types';

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

  // Skip onboarding check for v2 preview

  // Fetch data on mount
  useEffect(() => {
    if (profile?.onboardingCompleted) {
      fetchHomeData();
      fetchProactiveInsights();
    }
  }, [profile?.onboardingCompleted, fetchHomeData, fetchProactiveInsights]);

  // Fetch patterns
  useEffect(() => {
    async function fetchPatterns() {
      if (!profile?.id) return;
      try {
        const response = await fetch(`/api/insights/patterns?userId=${profile.id}`);
        if (response.ok) {
          const data = await response.json();
          if (data.patterns) {
            setPatterns(data.patterns.map((p: Record<string, unknown>) => ({
              id: p.id as string,
              description: p.description as string,
              confidence: p.confidence as number,
              lastTriggered: p.lastObserved as string,
              metricA: p.metricA as string,
              metricB: p.metricB as string | undefined,
              correlationStrength: p.correlationStrength as number | undefined,
              direction: p.direction as 'positive' | 'negative' | undefined,
              sampleSize: p.sampleSize as number | undefined,
            })));
          }
        }
      } catch (err) {
        console.error('Error fetching patterns:', err);
      }
    }
    fetchPatterns();
  }, [profile?.id]);

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
