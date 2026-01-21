'use client';

import { X, Settings, Watch } from 'lucide-react';
import { UserProfile, ReputationLevel } from '@/types';

interface ProfileModalProps {
  profile: UserProfile;
  isOpen: boolean;
  onClose: () => void;
}

const REP_LEVEL_LABELS: Record<ReputationLevel, string> = {
  starter: 'Starter',
  regular: 'Regular',
  trusted: 'Trusted',
  verified: 'Verified',
  expert: 'Expert',
};

const REP_LEVEL_NEXT: Record<ReputationLevel, ReputationLevel | null> = {
  starter: 'regular',
  regular: 'trusted',
  trusted: 'verified',
  verified: 'expert',
  expert: null,
};

const REP_THRESHOLDS: Record<ReputationLevel, number> = {
  starter: 0,
  regular: 50,
  trusted: 150,
  verified: 300,
  expert: 500,
};

export default function ProfileModal({ profile, isOpen, onClose }: ProfileModalProps) {
  if (!isOpen) return null;

  const nextLevel = REP_LEVEL_NEXT[profile.reputationLevel];
  const currentThreshold = REP_THRESHOLDS[profile.reputationLevel];
  const nextThreshold = nextLevel ? REP_THRESHOLDS[nextLevel] : profile.reputationPoints;
  const progress = nextLevel
    ? ((profile.reputationPoints - currentThreshold) / (nextThreshold - currentThreshold)) * 100
    : 100;

  const memberSince = new Date(profile.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-[430px] bg-[#FAF6F1] rounded-t-3xl p-6 pb-10 animate-slide-in-up">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-[#F5EDE4] transition-colors"
        >
          <X className="w-5 h-5 text-[#8A8580]" />
        </button>

        {/* Avatar & Name */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-20 h-20 rounded-full bg-[#FFE8DC] flex items-center justify-center text-3xl mb-3">
            {profile.name.charAt(0).toUpperCase()}
          </div>
          <h2 className="text-xl font-semibold text-[#2D2A26]">{profile.name}</h2>
          <p className="text-sm text-[#8A8580]">Member since {memberSince}</p>
        </div>

        {/* Scores */}
        <div className="bg-white rounded-2xl p-4 mb-4">
          <div className="flex justify-around">
            {/* Health Score */}
            <div className="text-center">
              <p className="text-xs text-[#8A8580] uppercase tracking-wider mb-1">Health</p>
              <p className="text-3xl font-bold text-[#2D2A26]">{profile.healthScore}</p>
            </div>

            {/* Divider */}
            <div className="w-px bg-[#EBE3DA]" />

            {/* Rep Score */}
            <div className="text-center">
              <p className="text-xs text-[#8A8580] uppercase tracking-wider mb-1">Rep</p>
              <p className="text-lg font-semibold text-[#2D2A26]">
                {REP_LEVEL_LABELS[profile.reputationLevel]}
              </p>
              <p className="text-xs text-[#8A8580]">{profile.reputationPoints} pts</p>
              {nextLevel && (
                <div className="mt-2">
                  <div className="w-24 h-1.5 bg-[#F5EDE4] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#E07A5F] rounded-full transition-all"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-[#B5AFA8] mt-1">
                    {nextThreshold - profile.reputationPoints} to {REP_LEVEL_LABELS[nextLevel]}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Streak */}
        <div className="bg-white rounded-2xl p-4 mb-4 flex items-center gap-3">
          <div className="text-2xl">🔥</div>
          <div>
            <p className="font-semibold text-[#2D2A26]">{profile.checkInStreak} day streak</p>
            <p className="text-sm text-[#8A8580]">Keep it going!</p>
          </div>
        </div>

        {/* Connected Device */}
        <div className="bg-white rounded-2xl p-4 mb-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F5EDE4] flex items-center justify-center">
            <Watch className="w-5 h-5 text-[#8A8580]" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-[#2D2A26]">
              {profile.connectedApps.length > 0
                ? `Connected: ${profile.connectedApps.join(', ')}`
                : 'No device connected'}
            </p>
            <p className="text-sm text-[#8A8580]">
              {profile.connectedApps.length > 0 ? 'Syncing data' : 'Connect a wearable'}
            </p>
          </div>
        </div>

        {/* Settings */}
        <button className="w-full bg-[#F5EDE4] rounded-2xl p-4 flex items-center gap-3 hover:bg-[#EBE3DA] transition-colors">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
            <Settings className="w-5 h-5 text-[#8A8580]" />
          </div>
          <p className="font-medium text-[#2D2A26]">Settings</p>
        </button>
      </div>
    </div>
  );
}
