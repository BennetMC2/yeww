'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, User, Flame, Check, AlertTriangle, X, Coins, History, Watch } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { CoachingStyle, ConnectedApp, SharingPreferences } from '@/types';
import ReputationBadge from '@/components/scores/ReputationBadge';
import PointsDisplay from '@/components/scores/PointsDisplay';
import ConnectWearable from '@/components/ConnectWearable';
import { getPointsToNextLevel, getNextReputationLevel, getReputationLevelLabel, REPUTATION_THRESHOLDS } from '@/lib/scores';

export default function ProfilePage() {
  const router = useRouter();
  const { profile, setName, setCoachingStyle, setConnectedApps, setSharingPreference, resetAll, isLoading } = useApp();
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [showStylePicker, setShowStylePicker] = useState(false);
  const [showAppsPicker, setShowAppsPicker] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showPointsHistory, setShowPointsHistory] = useState(false);

  // Redirect to onboarding if not completed (skip with ?skip=1 for testing)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const skip = params.get('skip') === '1';
    if (!isLoading && !profile?.onboardingCompleted && !skip) {
      router.replace('/onboarding');
    }
  }, [isLoading, profile, router]);

  useEffect(() => {
    if (profile) {
      setNameInput(profile.name);
    }
  }, [profile]);

  // Allow bypass with ?skip=1 for testing
  const skipOnboarding = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('skip') === '1';

  if (isLoading || (!profile?.onboardingCompleted && !skipOnboarding)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF6F1]">
        <p className="text-[#B5AFA8]">Loading...</p>
      </div>
    );
  }

  // After this point, profile is guaranteed to exist (or we show empty state)
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF6F1]">
        <p className="text-[#B5AFA8]">No profile found</p>
      </div>
    );
  }

  const handleSaveName = () => {
    if (nameInput.trim()) {
      setName(nameInput.trim());
      setEditingName(false);
    }
  };

  const handleReset = () => {
    resetAll();
    router.replace('/onboarding');
  };

  const handleSharingToggle = (key: keyof SharingPreferences) => {
    if (!profile) return;
    setSharingPreference(key, !profile.sharingPreferences[key]);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTransactionDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const styleLabels: Record<CoachingStyle, string> = {
    direct: 'Direct',
    supportive: 'Supportive',
    balanced: 'Balanced',
  };

  const styles: { value: CoachingStyle; title: string; description: string }[] = [
    { value: 'direct', title: 'Direct', description: 'Tell it like it is' },
    { value: 'supportive', title: 'Supportive', description: 'Gentle encouragement' },
    { value: 'balanced', title: 'Balanced', description: 'A bit of both' },
  ];

  const apps: { value: ConnectedApp; name: string; color: string }[] = [
    { value: 'apple-health', name: 'Apple Health', color: '#FF2D55' },
    { value: 'oura', name: 'Oura', color: '#2D2A26' },
    { value: 'whoop', name: 'Whoop', color: '#FF6B00' },
    { value: 'garmin', name: 'Garmin', color: '#007CC3' },
    { value: 'fitbit', name: 'Fitbit', color: '#00B0B9' },
  ];

  const toggleApp = (app: ConnectedApp) => {
    if (!profile) return;
    const current = profile.connectedApps || [];
    if (current.includes(app)) {
      setConnectedApps(current.filter(a => a !== app));
    } else {
      setConnectedApps([...current, app]);
    }
  };

  // Calculate reputation progress
  const nextLevel = getNextReputationLevel(profile.reputationLevel);
  const pointsToNext = nextLevel ? getPointsToNextLevel(profile.reputationPoints, profile.reputationLevel) : 0;
  const currentThreshold = REPUTATION_THRESHOLDS[profile.reputationLevel];
  const nextThreshold = nextLevel ? REPUTATION_THRESHOLDS[nextLevel] : currentThreshold;
  const progressInLevel = nextLevel
    ? ((profile.reputationPoints - currentThreshold) / (nextThreshold - currentThreshold)) * 100
    : 100;

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF6F1]">
      {/* Header */}
      <header className="flex items-center px-4 pt-8 pb-4 bg-[#FAF6F1] sticky top-0 z-10">
        <Link
          href="/home"
          className="p-2 -ml-2 text-[#8A8580] hover:text-[#2D2A26] transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <h1 className="flex-1 text-center font-semibold text-[#2D2A26]">Profile</h1>
        <div className="w-10" />
      </header>

      <main className="flex-1 px-6 py-6 overflow-y-auto">
        {/* Profile Info */}
        <section className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-[#FFE8DC] flex items-center justify-center">
              <User className="w-8 h-8 text-[#E07A5F]" />
            </div>
            <div>
              {editingName ? (
                <div className="flex items-center gap-2">
                  <input
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    autoFocus
                    className="px-3 py-1.5 bg-[#F5EDE4] text-[#2D2A26] rounded-xl border-2 border-transparent focus:outline-none focus:border-[#E07A5F]/30 focus:bg-white transition-all"
                  />
                  <button
                    onClick={handleSaveName}
                    className="p-2 rounded-full bg-[#E07A5F] text-white"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setEditingName(true)}
                  className="text-xl font-semibold text-[#2D2A26] hover:text-[#E07A5F] transition-colors"
                >
                  {profile.name}
                </button>
              )}
              <p className="text-sm text-[#8A8580]">Member since {formatDate(profile.createdAt)}</p>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-3">
            {/* Streak */}
            <div className="bg-white rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FFE8DC] flex items-center justify-center">
                <Flame className="w-5 h-5 text-[#E07A5F]" />
              </div>
              <div>
                <p className="font-semibold text-[#2D2A26]">{profile.checkInStreak} days</p>
                <p className="text-xs text-[#8A8580]">Streak</p>
              </div>
            </div>

            {/* Points */}
            <button
              onClick={() => setShowPointsHistory(true)}
              className="bg-white rounded-2xl p-4 flex items-center gap-3 text-left hover:bg-[#FAFAFA] transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-[#FEF3C7] flex items-center justify-center">
                <Coins className="w-5 h-5 text-[#F59E0B]" />
              </div>
              <div>
                <p className="font-semibold text-[#2D2A26]">{profile.points}</p>
                <p className="text-xs text-[#8A8580]">Points</p>
              </div>
            </button>
          </div>
        </section>

        {/* Reputation Section */}
        <section className="mb-8">
          <h2 className="text-sm font-medium text-[#8A8580] uppercase tracking-wider mb-3">
            Reputation
          </h2>

          <div className="bg-white rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <ReputationBadge level={profile.reputationLevel} size="lg" />
              {nextLevel && (
                <span className="text-xs text-[#8A8580]">
                  {pointsToNext} points to {getReputationLevelLabel(nextLevel)}
                </span>
              )}
            </div>

            {/* Progress bar */}
            {nextLevel && (
              <div className="h-2 bg-[#F5EDE4] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#E07A5F] rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, progressInLevel)}%` }}
                />
              </div>
            )}

            <p className="text-xs text-[#8A8580] mt-3">
              Higher reputation unlocks more personalized advice
            </p>
          </div>
        </section>

        {/* Settings */}
        <section className="mb-8">
          <h2 className="text-sm font-medium text-[#8A8580] uppercase tracking-wider mb-3">
            Settings
          </h2>

          <div className="space-y-3">
            {/* Coaching Style */}
            <button
              onClick={() => setShowStylePicker(true)}
              className="w-full bg-[#F5EDE4] hover:bg-[#EBE3DA] rounded-2xl p-4 transition-colors text-left"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-[#2D2A26]">Coaching Style</h3>
                  <p className="text-sm text-[#8A8580]">{styleLabels[profile.coachingStyle]}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-[#8A8580]" />
              </div>
            </button>

            {/* Connected Apps */}
            <button
              onClick={() => setShowAppsPicker(true)}
              className="w-full bg-[#F5EDE4] hover:bg-[#EBE3DA] rounded-2xl p-4 transition-colors text-left"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-[#2D2A26]">Connected Apps</h3>
                  <p className="text-sm text-[#8A8580]">
                    {profile.connectedApps.length > 0
                      ? `${profile.connectedApps.length} connected`
                      : 'None connected'}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-[#8A8580]" />
              </div>
            </button>

            {/* Health Areas Link */}
            <Link href="/health">
              <div className="w-full bg-[#F5EDE4] hover:bg-[#EBE3DA] rounded-2xl p-4 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-[#2D2A26]">Health Areas</h3>
                    <p className="text-sm text-[#8A8580]">
                      {profile.healthAreas.length > 0
                        ? `Tracking ${profile.healthAreas.length} area${profile.healthAreas.length > 1 ? 's' : ''}`
                        : 'Not tracking any yet'}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#8A8580]" />
                </div>
              </div>
            </Link>
          </div>
        </section>

        {/* Connected Devices (Terra) */}
        <section className="mb-8">
          <h2 className="text-sm font-medium text-[#8A8580] uppercase tracking-wider mb-3">
            Connected Devices
          </h2>

          <div className="bg-white rounded-2xl p-4">
            <ConnectWearable userId={profile.id} />
          </div>
        </section>

        {/* Data Sharing */}
        <section className="mb-8">
          <h2 className="text-sm font-medium text-[#8A8580] uppercase tracking-wider mb-3">
            Data Sharing
          </h2>

          <div className="bg-white rounded-2xl overflow-hidden divide-y divide-[#F5EDE4]">
            {/* Research Partners */}
            <div className="p-4 flex items-center justify-between">
              <div>
                <h3 className="font-medium text-[#2D2A26]">Share with research partners</h3>
                <p className="text-xs text-[#8A8580]">Help advance health research</p>
              </div>
              <button
                onClick={() => handleSharingToggle('research')}
                className={`w-12 h-7 rounded-full transition-colors relative ${
                  profile.sharingPreferences.research ? 'bg-[#E07A5F]' : 'bg-[#D1D5DB]'
                }`}
              >
                <div
                  className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    profile.sharingPreferences.research ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Wellness Brands */}
            <div className="p-4 flex items-center justify-between">
              <div>
                <h3 className="font-medium text-[#2D2A26]">Share with wellness brands</h3>
                <p className="text-xs text-[#8A8580]">Get personalized offers</p>
              </div>
              <button
                onClick={() => handleSharingToggle('brands')}
                className={`w-12 h-7 rounded-full transition-colors relative ${
                  profile.sharingPreferences.brands ? 'bg-[#E07A5F]' : 'bg-[#D1D5DB]'
                }`}
              >
                <div
                  className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    profile.sharingPreferences.brands ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Insurance Partners */}
            <div className="p-4 flex items-center justify-between">
              <div>
                <h3 className="font-medium text-[#2D2A26]">Share with insurance partners</h3>
                <p className="text-xs text-[#8A8580]">May unlock premium discounts</p>
              </div>
              <button
                onClick={() => handleSharingToggle('insurance')}
                className={`w-12 h-7 rounded-full transition-colors relative ${
                  profile.sharingPreferences.insurance ? 'bg-[#E07A5F]' : 'bg-[#D1D5DB]'
                }`}
              >
                <div
                  className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    profile.sharingPreferences.insurance ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          <p className="text-xs text-[#8A8580] mt-2 px-1">
            Your data is always encrypted. You can change these settings anytime.
          </p>
        </section>

        {/* Danger Zone */}
        <section className="pb-8">
          <h2 className="text-sm font-medium text-[#E07A5F] uppercase tracking-wider mb-3">
            Danger Zone
          </h2>

          <div className="bg-white rounded-2xl p-4">
            <button
              onClick={() => setShowResetConfirm(true)}
              className="w-full text-left"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-[#E07A5F]">Reset All Data</h3>
                  <p className="text-sm text-[#8A8580]">Delete all your data and start fresh</p>
                </div>
                <AlertTriangle className="w-5 h-5 text-[#E07A5F]" />
              </div>
            </button>
          </div>
        </section>
      </main>

      {/* Coaching Style Picker Modal */}
      {showStylePicker && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50" onClick={() => setShowStylePicker(false)}>
          <div
            className="bg-[#FAF6F1] rounded-t-3xl w-full max-w-[430px] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-[#2D2A26]">Coaching Style</h3>
              <button
                onClick={() => setShowStylePicker(false)}
                className="p-2 rounded-full hover:bg-[#F5EDE4] transition-colors"
              >
                <X className="w-5 h-5 text-[#8A8580]" />
              </button>
            </div>

            <div className="space-y-3">
              {styles.map((style) => (
                <button
                  key={style.value}
                  onClick={() => {
                    setCoachingStyle(style.value);
                    setShowStylePicker(false);
                  }}
                  className={`w-full p-4 rounded-2xl text-left transition-all ${profile.coachingStyle === style.value ? 'bg-[#FFE8DC]' : 'bg-[#F5EDE4] hover:bg-[#EBE3DA]'}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className={`font-medium ${profile.coachingStyle === style.value ? 'text-[#E07A5F]' : 'text-[#2D2A26]'}`}>
                        {style.title}
                      </h4>
                      <p className="text-sm text-[#8A8580]">{style.description}</p>
                    </div>
                    {profile.coachingStyle === style.value && (
                      <div className="w-6 h-6 rounded-full bg-[#E07A5F] flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Apps Picker Modal */}
      {showAppsPicker && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50" onClick={() => setShowAppsPicker(false)}>
          <div
            className="bg-[#FAF6F1] rounded-t-3xl w-full max-w-[430px] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-[#2D2A26]">Connected Apps</h3>
              <button
                onClick={() => setShowAppsPicker(false)}
                className="p-2 rounded-full hover:bg-[#F5EDE4] transition-colors"
              >
                <X className="w-5 h-5 text-[#8A8580]" />
              </button>
            </div>

            <div className="space-y-3">
              {apps.map((app) => {
                const isConnected = profile.connectedApps.includes(app.value);
                return (
                  <button
                    key={app.value}
                    onClick={() => toggleApp(app.value)}
                    className={`w-full p-4 rounded-2xl text-left transition-all ${isConnected ? 'bg-[#FFE8DC]' : 'bg-[#F5EDE4] hover:bg-[#EBE3DA]'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-semibold"
                          style={{ backgroundColor: app.color }}
                        >
                          {app.name.charAt(0)}
                        </div>
                        <span className="font-medium text-[#2D2A26]">{app.name}</span>
                      </div>
                      {isConnected && (
                        <div className="w-6 h-6 rounded-full bg-[#E07A5F] flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Points History Modal */}
      {showPointsHistory && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50" onClick={() => setShowPointsHistory(false)}>
          <div
            className="bg-[#FAF6F1] rounded-t-3xl w-full max-w-[430px] p-6 max-h-[70vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-[#E07A5F]" />
                <h3 className="text-lg font-semibold text-[#2D2A26]">Points History</h3>
              </div>
              <button
                onClick={() => setShowPointsHistory(false)}
                className="p-2 rounded-full hover:bg-[#F5EDE4] transition-colors"
              >
                <X className="w-5 h-5 text-[#8A8580]" />
              </button>
            </div>

            {/* Total Points */}
            <div className="bg-[#FEF3C7] rounded-2xl p-4 mb-4 flex items-center justify-between">
              <span className="font-medium text-[#2D2A26]">Total Points</span>
              <PointsDisplay points={profile.points} size="lg" />
            </div>

            {/* History List */}
            <div className="flex-1 overflow-y-auto space-y-2">
              {profile.pointsHistory.length > 0 ? (
                profile.pointsHistory.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="bg-white rounded-xl p-3 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium text-[#2D2A26] text-sm">{transaction.description}</p>
                      <p className="text-xs text-[#8A8580]">{formatTransactionDate(transaction.timestamp)}</p>
                    </div>
                    <span className="font-semibold text-[#4ADE80]">+{transaction.amount}</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-[#8A8580]">No points earned yet</p>
                  <p className="text-sm text-[#8A8580] mt-1">Check in daily to start earning!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#FAF6F1] rounded-2xl w-full max-w-[350px] p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[#FFE8DC] flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-[#E07A5F]" />
            </div>
            <h3 className="text-lg font-semibold text-[#2D2A26] mb-2">Reset All Data?</h3>
            <p className="text-[#8A8580] mb-6">
              This will delete all your conversations, progress, and settings. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 px-6 py-3.5 rounded-full bg-[#F5EDE4] text-[#2D2A26] font-medium hover:bg-[#EBE3DA] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                className="flex-1 px-6 py-3.5 rounded-full bg-[#E07A5F] text-white font-medium hover:bg-[#D36B4F] transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
