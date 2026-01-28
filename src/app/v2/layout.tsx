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
      <header className="px-6 pt-6 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] font-medium text-[#8A8580]">{today}</p>
          </div>
          <div className="flex items-center gap-3">
            {/* HP Balance Pill */}
            {hpBalance !== null && (
              <Link
                href="/v2/rewards"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all hover:-translate-y-0.5 active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(135deg, rgba(242, 204, 143, 0.2) 0%, rgba(233, 185, 73, 0.2) 100%)',
                  boxShadow: '0 2px 8px rgba(242, 204, 143, 0.2)',
                }}
              >
                <Zap className="w-3.5 h-3.5 text-[#E9B949]" />
                <span className="text-[12px] font-bold text-[#C9A03D]">{hpBalance.toLocaleString()}</span>
              </Link>
            )}
            {/* Avatar with health score ring */}
            <button
              onClick={() => setShowProfile(true)}
              className="relative group"
            >
              {/* Outer ring showing health score */}
              <div className="relative w-12 h-12">
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 48 48">
                  {/* Background ring */}
                  <circle
                    cx="24"
                    cy="24"
                    r="21"
                    fill="none"
                    stroke="#F5EDE4"
                    strokeWidth="3"
                  />
                  {/* Progress ring */}
                  <circle
                    cx="24"
                    cy="24"
                    r="21"
                    fill="none"
                    stroke="url(#headerScoreGradient)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={`${(displayProfile.healthScore / 100) * 132} 132`}
                    style={{ transition: 'stroke-dasharray 0.5s ease-out' }}
                  />
                  <defs>
                    <linearGradient id="headerScoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#E07A5F" />
                      <stop offset="100%" stopColor="#81B29A" />
                    </linearGradient>
                  </defs>
                </svg>
                {/* Avatar */}
                <div
                  className="absolute inset-1.5 rounded-full flex items-center justify-center text-[15px] font-semibold text-[#E07A5F] group-hover:scale-105 transition-transform"
                  style={{
                    background: 'linear-gradient(135deg, #FFE8DC 0%, #FFD4C4 100%)',
                  }}
                >
                  {displayProfile.name.charAt(0).toUpperCase()}
                </div>
              </div>
              {/* Streak badge */}
              {displayProfile.checkInStreak > 0 && (
                <div
                  className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center w-5 h-5 rounded-full text-white text-[10px] font-bold"
                  style={{
                    background: 'linear-gradient(135deg, #E07A5F 0%, #D36B4F 100%)',
                    boxShadow: '0 2px 6px rgba(224, 122, 95, 0.4)',
                  }}
                >
                  {displayProfile.checkInStreak}
                </div>
              )}
            </button>
          </div>
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
