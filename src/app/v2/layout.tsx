'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import TabNav from '@/components/v2/TabNav';
import ProfileModal from '@/components/v2/ProfileModal';
import { Zap } from 'lucide-react';
import Link from 'next/link';

import { UserProfile, ConnectedApp } from '@/types';

// Mock profile for demo/preview
const MOCK_PROFILE: UserProfile = {
  id: 'demo',
  name: 'Demo User',
  createdAt: new Date().toISOString(),
  coachingStyle: 'balanced',
  connectedApps: ['garmin'] as ConnectedApp[],
  healthAreas: [],
  onboardingCompleted: true,
  lastCheckIn: null,
  checkInStreak: 5,
  dataSources: [],
  priorities: [],
  pastAttempt: null,
  barriers: [],
  healthScore: 72,
  reputationLevel: 'trusted',
  reputationPoints: 180,
  points: 450,
  pointsHistory: [],
  sharingPreferences: { research: false, brands: false, insurance: false },
};

export default function V2Layout({ children }: { children: React.ReactNode }) {
  const { profile } = useApp();
  const [showProfile, setShowProfile] = useState(false);
  const [hpBalance, setHpBalance] = useState<number | null>(null);

  // Use mock profile if not onboarded
  const displayProfile = profile?.onboardingCompleted ? profile : MOCK_PROFILE;

  // Fetch HP balance with retry logic
  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 3;

    async function fetchBalance() {
      const userId = profile?.id || 'demo-user';
      try {
        const res = await fetch(`/api/rewards/balance?userId=${userId}`);
        if (res.ok) {
          const data = await res.json();
          setHpBalance(data.hpBalance);
        } else if (res.status >= 500 && retryCount < maxRetries) {
          // Server error - retry with backoff
          retryCount++;
          const delay = 1000 * Math.pow(2, retryCount - 1);
          setTimeout(fetchBalance, delay);
        }
      } catch (error) {
        console.error('Error fetching HP balance:', error);
        // Retry on network errors
        if (retryCount < maxRetries) {
          retryCount++;
          const delay = 1000 * Math.pow(2, retryCount - 1);
          setTimeout(fetchBalance, delay);
        }
      }
    }
    fetchBalance();
  }, [profile?.id]);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF6F1]">
      {/* Header */}
      <header className="px-6 pt-6 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[#8A8580]">{today}</p>
          </div>
          {/* HP Balance Pill */}
          {hpBalance !== null && (
            <Link
              href="/v2/rewards"
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#E07A5F]/10 hover:bg-[#E07A5F]/20 transition-colors"
            >
              <Zap className="w-3.5 h-3.5 text-[#E07A5F]" />
              <span className="text-xs font-semibold text-[#E07A5F]">{hpBalance.toLocaleString()}</span>
            </Link>
          )}
          <button
            onClick={() => setShowProfile(true)}
            className="relative flex items-center gap-2 group"
          >
            {/* Health score teaser */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/80 shadow-sm group-hover:bg-white transition-colors">
              <span className="text-xs font-semibold text-[#2D2A26]">{displayProfile.healthScore}</span>
              <span className="text-[10px] text-[#8A8580]">score</span>
            </div>
            {/* Avatar with pulse ring */}
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-[#E07A5F]/20 animate-ping" style={{ animationDuration: '2s' }} />
              <div className="relative w-10 h-10 rounded-full bg-[#FFE8DC] flex items-center justify-center text-lg font-medium text-[#E07A5F] group-hover:bg-[#FFD9C7] transition-colors">
                {displayProfile.name.charAt(0).toUpperCase()}
              </div>
              {/* Streak badge */}
              {displayProfile.checkInStreak > 0 && (
                <div className="absolute -bottom-1 -right-1 flex items-center justify-center w-5 h-5 rounded-full bg-[#E07A5F] text-white text-[10px] font-bold shadow-sm">
                  {displayProfile.checkInStreak}
                </div>
              )}
            </div>
          </button>
        </div>
      </header>

      {/* Tab Navigation */}
      <TabNav />

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>

      {/* Profile Modal */}
      <ProfileModal
        profile={displayProfile}
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
      />
    </div>
  );
}
