'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  UserProfile,
  ConversationHistory,
  ProgressData,
  CoachingStyle,
  ConnectedApp,
  Message,
  MessageImage,
  DataSource,
  Priority,
  PastAttempt,
  Barrier,
  PointsTransaction,
  SharingPreferences,
} from '@/types';
import {
  getUserProfile,
  createDefaultProfile,
  saveUserProfile,
  getConversationHistory,
  getProgressData,
  addMessage as addMessageToStorage,
  recordCheckIn as recordCheckInStorage,
  addHealthArea as addHealthAreaStorage,
  removeHealthArea as removeHealthAreaStorage,
  addProgressEntry as addProgressEntryStorage,
  addMilestone as addMilestoneStorage,
  resetAllData,
  setDataSources as setDataSourcesStorage,
  setPriorities as setPrioritiesStorage,
  setPastAttempt as setPastAttemptStorage,
  setBarriers as setBarriersStorage,
  addPoints as addPointsStorage,
  setSharingPreference as setSharingPreferenceStorage,
  migrateFromLocalStorage,
} from '@/lib/storage';
import {
  calculateHealthScore,
  calculateReputationPoints,
  calculateReputationLevel,
  POINTS_CONFIG,
  calculateStreakBonus,
} from '@/lib/scores';

interface AppContextType {
  // User Profile
  profile: UserProfile | null;
  isLoading: boolean;
  setName: (name: string) => void;
  setCoachingStyle: (style: CoachingStyle) => void;
  setConnectedApps: (apps: ConnectedApp[]) => void;
  completeOnboarding: () => Promise<void>;
  addHealthArea: (areaId: string, areaName: string) => void;
  removeHealthArea: (areaId: string) => void;
  recordCheckIn: () => void;

  // New onboarding data
  setDataSources: (sources: DataSource[]) => void;
  setPriorities: (priorities: Priority[]) => void;
  setPastAttempt: (attempt: PastAttempt) => void;
  setBarriers: (barriers: Barrier[]) => void;

  // Points system
  addPoints: (type: PointsTransaction['type'], amount: number, description: string) => void;

  // Sharing preferences
  setSharingPreference: (key: keyof SharingPreferences, value: boolean) => void;

  // Scores
  recalculateScores: () => void;

  // Conversations
  conversations: ConversationHistory;
  addMessage: (role: 'assistant' | 'user', content: string, options?: { quickActions?: { label: string; value: string }[]; images?: MessageImage[] }) => Promise<Message>;

  // Progress
  progress: ProgressData;
  addProgressEntry: (entry: { type: 'photo' | 'milestone' | 'note'; category: 'body' | 'skin' | 'general'; content: string; note?: string }) => void;
  addMilestone: (content: string) => void;

  // Reset
  resetAll: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [conversations, setConversations] = useState<ConversationHistory>({ conversations: [] });
  const [progress, setProgress] = useState<ProgressData>({ entries: [] });
  const [isLoading, setIsLoading] = useState(true);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // First, migrate any old localStorage data to Supabase
        await migrateFromLocalStorage();

        // Load data from Supabase
        const storedProfile = await getUserProfile();
        const storedConversations = await getConversationHistory();
        const storedProgress = await getProgressData();

        if (storedProfile) {
          setProfile(storedProfile);
        } else {
          // Create new user
          const newProfile = createDefaultProfile();
          await saveUserProfile(newProfile);
          setProfile(newProfile);
        }

        setConversations(storedConversations);
        setProgress(storedProgress);
      } catch (error) {
        console.error('Error loading data:', error);
        // Fallback to empty state
        const newProfile = createDefaultProfile();
        setProfile(newProfile);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const setName = useCallback((name: string) => {
    setProfile(prev => {
      if (!prev) return prev;
      const updated = { ...prev, name };
      saveUserProfile(updated); // Fire and forget
      return updated;
    });
  }, []);

  const setCoachingStyle = useCallback((coachingStyle: CoachingStyle) => {
    setProfile(prev => {
      if (!prev) return prev;
      const updated = { ...prev, coachingStyle };
      saveUserProfile(updated);
      return updated;
    });
  }, []);

  const setConnectedApps = useCallback((connectedApps: ConnectedApp[]) => {
    setProfile(prev => {
      if (!prev) return prev;
      const updated = { ...prev, connectedApps };
      saveUserProfile(updated);
      return updated;
    });
  }, []);

  const completeOnboarding = useCallback(async (): Promise<void> => {
    if (!profile) return;

    const updated = { ...profile, onboardingCompleted: true };

    // Update local state immediately for responsive UI
    setProfile(updated);

    // AWAIT the save - this ensures profile is persisted before navigation
    await saveUserProfile(updated);

    // Add milestone (fire-and-forget, not critical for navigation)
    addMilestoneStorage('Started health journey with yeww').then(() => {
      getProgressData().then(setProgress);
    });
  }, [profile]);

  const addHealthArea = useCallback((areaId: string, areaName: string) => {
    addHealthAreaStorage(areaId, areaName).then(updatedProfile => {
      setProfile(updatedProfile);
      addMilestoneStorage(`Started tracking ${areaName}`).then(() => {
        getProgressData().then(setProgress);
      });
    });
  }, []);

  const removeHealthArea = useCallback((areaId: string) => {
    removeHealthAreaStorage(areaId).then(setProfile);
  }, []);

  const recordCheckIn = useCallback(() => {
    recordCheckInStorage().then(async (updatedProfile) => {
      setProfile(updatedProfile);

      // Award points for check-in
      await addPointsStorage('check-in', POINTS_CONFIG.CHECK_IN, 'Daily check-in');

      // Award streak bonus after day 3
      const streakBonus = calculateStreakBonus(updatedProfile.checkInStreak);
      if (streakBonus > 0) {
        await addPointsStorage('streak-bonus', streakBonus, `${updatedProfile.checkInStreak} day streak bonus`);
      }

      // Refresh profile with new points
      const refreshedProfile = await getUserProfile();
      if (refreshedProfile) {
        setProfile(refreshedProfile);
      }
    });
  }, []);

  // New onboarding data methods
  const setDataSources = useCallback((sources: DataSource[]) => {
    setDataSourcesStorage(sources).then(setProfile);
  }, []);

  const setPriorities = useCallback((priorities: Priority[]) => {
    setPrioritiesStorage(priorities).then(setProfile);
  }, []);

  const setPastAttempt = useCallback((attempt: PastAttempt) => {
    setPastAttemptStorage(attempt).then(setProfile);
  }, []);

  const setBarriers = useCallback((barriers: Barrier[]) => {
    setBarriersStorage(barriers).then(setProfile);
  }, []);

  // Points system
  const addPoints = useCallback((type: PointsTransaction['type'], amount: number, description: string) => {
    addPointsStorage(type, amount, description).then(setProfile);
  }, []);

  // Sharing preferences
  const setSharingPreference = useCallback((key: keyof SharingPreferences, value: boolean) => {
    setSharingPreferenceStorage(key, value).then(setProfile);
  }, []);

  // Recalculate scores
  const recalculateScores = useCallback(() => {
    setProfile(prev => {
      if (!prev) return prev;

      const healthScore = calculateHealthScore(prev);
      const reputationPoints = calculateReputationPoints(prev);
      const reputationLevel = calculateReputationLevel(reputationPoints);

      const updated = {
        ...prev,
        healthScore,
        reputationPoints,
        reputationLevel,
      };

      saveUserProfile(updated);
      return updated;
    });
  }, []);

  const addMessage = useCallback(async (role: 'assistant' | 'user', content: string, options?: { quickActions?: { label: string; value: string }[]; images?: MessageImage[] }) => {
    const message = await addMessageToStorage(role, content, options);
    const updatedConversations = await getConversationHistory();
    setConversations(updatedConversations);
    return message;
  }, []);

  const addProgressEntry = useCallback((entry: { type: 'photo' | 'milestone' | 'note'; category: 'body' | 'skin' | 'general'; content: string; note?: string }) => {
    addProgressEntryStorage(entry).then(() => {
      getProgressData().then(setProgress);
    });
  }, []);

  const addMilestone = useCallback((content: string) => {
    addMilestoneStorage(content).then(() => {
      getProgressData().then(setProgress);
    });
  }, []);

  const resetAll = useCallback(() => {
    resetAllData().then(async () => {
      const newProfile = createDefaultProfile();
      await saveUserProfile(newProfile);
      setProfile(newProfile);
      setConversations({ conversations: [] });
      setProgress({ entries: [] });
    });
  }, []);

  return (
    <AppContext.Provider
      value={{
        profile,
        isLoading,
        setName,
        setCoachingStyle,
        setConnectedApps,
        completeOnboarding,
        addHealthArea,
        removeHealthArea,
        recordCheckIn,
        // New onboarding data
        setDataSources,
        setPriorities,
        setPastAttempt,
        setBarriers,
        // Points system
        addPoints,
        // Sharing preferences
        setSharingPreference,
        // Scores
        recalculateScores,
        // Conversations
        conversations,
        addMessage,
        // Progress
        progress,
        addProgressEntry,
        addMilestone,
        // Reset
        resetAll,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
