'use client';

import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import TabNav from '@/components/v2/TabNav';
import ProfileModal from '@/components/v2/ProfileModal';

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

  // Use mock profile if not onboarded
  const displayProfile = profile?.onboardingCompleted ? profile : MOCK_PROFILE;

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
          <button
            onClick={() => setShowProfile(true)}
            className="w-10 h-10 rounded-full bg-[#FFE8DC] flex items-center justify-center text-lg font-medium text-[#E07A5F] hover:bg-[#FFD9C7] transition-colors"
          >
            {displayProfile.name.charAt(0).toUpperCase()}
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
