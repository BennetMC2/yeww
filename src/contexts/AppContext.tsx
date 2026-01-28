'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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
  HealthMetrics,
  DailyInsight,
  HealthScoreTrend,
  ProactiveInsight,
} from '@/types';
import {
  getUserProfile,
  createDefaultProfile,
  saveUserProfile,
  getLocalUserId,
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
import { getLatestHealthMetrics } from '@/lib/healthData';

// Cached home page data
interface HomeDataCache {
  metrics: HealthMetrics | null;
  hasWearable: boolean;
  insight: DailyInsight | null;
  scoreTrend: HealthScoreTrend | null;
  fetchedAt: number;
}

// Cache duration: 2 minutes
const HOME_CACHE_DURATION_MS = 2 * 60 * 1000;

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000;

// Helper function for fetch with retry and exponential backoff
async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  maxRetries: number = MAX_RETRIES
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (response.ok || response.status < 500) {
        // Return on success or client errors (don't retry 4xx)
        return response;
      }
      // Server error - will retry
      lastError = new Error(`Server error: ${response.status}`);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }

    // Wait before retry with exponential backoff
    if (attempt < maxRetries - 1) {
      const delay = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error('Fetch failed after retries');
}

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
  recalculateScores: (prefetchedMetrics?: HealthMetrics | null) => Promise<void>;

  // Conversations
  conversations: ConversationHistory;
  addMessage: (role: 'assistant' | 'user', content: string, options?: { quickActions?: { label: string; value: string }[]; images?: MessageImage[] }) => Promise<Message>;

  // Progress
  progress: ProgressData;
  addProgressEntry: (entry: { type: 'photo' | 'milestone' | 'note'; category: 'body' | 'skin' | 'general'; content: string; note?: string }) => void;
  addMilestone: (content: string) => void;

  // Home data cache
  homeDataCache: HomeDataCache | null;
  fetchHomeData: (forceRefresh?: boolean) => Promise<HomeDataCache | null>;
  isLoadingHomeData: boolean;

  // Proactive insights
  proactiveInsights: ProactiveInsight[];
  fetchProactiveInsights: () => Promise<void>;
  dismissInsight: (insightId: string) => Promise<void>;
  dismissAllInsights: () => Promise<void>;

  // Reset
  resetAll: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [conversations, setConversations] = useState<ConversationHistory>({ conversations: [] });
  const [progress, setProgress] = useState<ProgressData>({ entries: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [homeDataCache, setHomeDataCache] = useState<HomeDataCache | null>(null);
  const [isLoadingHomeData, setIsLoadingHomeData] = useState(false);
  const [proactiveInsights, setProactiveInsights] = useState<ProactiveInsight[]>([]);

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
          // Create new user - preserve existing localStorage ID if set (e.g., from Terra connection)
          const existingId = getLocalUserId();
          const newProfile = createDefaultProfile(existingId || undefined);
          await saveUserProfile(newProfile);
          setProfile(newProfile);
        }

        setConversations(storedConversations);
        setProgress(storedProgress);
      } catch (error) {
        console.error('Error loading data:', error);
        // Fallback to empty state - preserve existing localStorage ID if set
        const existingId = getLocalUserId();
        const newProfile = createDefaultProfile(existingId || undefined);
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

  // Recalculate scores (fetches real health metrics for accurate scoring)
  const recalculateScores = useCallback(async (prefetchedMetrics?: HealthMetrics | null) => {
    if (!profile) return;

    // Use prefetched metrics if provided, otherwise fetch
    const metrics = prefetchedMetrics !== undefined
      ? prefetchedMetrics
      : await getLatestHealthMetrics(profile.id);

    const healthScore = calculateHealthScore(profile, metrics);
    const reputationPoints = calculateReputationPoints(profile, metrics);
    const reputationLevel = calculateReputationLevel(reputationPoints);

    const updated = {
      ...profile,
      healthScore,
      reputationPoints,
      reputationLevel,
    };

    setProfile(updated);
    await saveUserProfile(updated);
  }, [profile]);

  // Track in-flight fetch to prevent duplicate requests
  const fetchInProgressRef = useRef(false);

  // Fetch home page data with caching and retry logic
  const fetchHomeData = useCallback(async (forceRefresh = false): Promise<HomeDataCache | null> => {
    if (!profile?.id) return null;

    // Prevent duplicate in-flight requests
    if (fetchInProgressRef.current) {
      return homeDataCache;
    }

    // Return cached data if still fresh (unless forcing refresh)
    if (!forceRefresh && homeDataCache) {
      const age = Date.now() - homeDataCache.fetchedAt;
      if (age < HOME_CACHE_DURATION_MS) {
        return homeDataCache;
      }
    }

    fetchInProgressRef.current = true;
    setIsLoadingHomeData(true);

    try {
      // Fetch all home data in parallel with retry logic
      const refreshParam = forceRefresh ? '&refresh=true' : '';
      const [metricsRes, insightRes, historyRes] = await Promise.all([
        fetchWithRetry(`/api/health/metrics?userId=${encodeURIComponent(profile.id)}${refreshParam}`),
        fetchWithRetry(`/api/insights/daily?userId=${encodeURIComponent(profile.id)}`),
        fetchWithRetry(`/api/health/score-history?userId=${encodeURIComponent(profile.id)}`),
      ]);

      let metrics: HealthMetrics | null = null;
      let hasWearable = false;
      let insight: DailyInsight | null = null;
      let scoreTrend: HealthScoreTrend | null = null;

      if (metricsRes.ok) {
        const data = await metricsRes.json();
        metrics = data.metrics;
        hasWearable = data.hasData;
        // Recalculate scores with fetched metrics
        recalculateScores(metrics);
      }

      if (insightRes.ok) {
        const data = await insightRes.json();
        insight = data.insight;
      }

      if (historyRes.ok) {
        const data = await historyRes.json();
        scoreTrend = data.scoreTrend;
      }

      const cache: HomeDataCache = {
        metrics,
        hasWearable,
        insight,
        scoreTrend,
        fetchedAt: Date.now(),
      };

      setHomeDataCache(cache);
      return cache;
    } catch (error) {
      console.error('Error fetching home data:', error);
      return homeDataCache; // Return stale cache on error
    } finally {
      fetchInProgressRef.current = false;
      setIsLoadingHomeData(false);
    }
  }, [profile?.id, homeDataCache, recalculateScores]);

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
      setHomeDataCache(null);
      setProactiveInsights([]);
    });
  }, []);

  // Track in-flight insights fetch
  const insightsFetchInProgressRef = useRef(false);

  // Proactive insights management with retry logic
  const fetchProactiveInsights = useCallback(async () => {
    if (!profile?.id) return;

    // Prevent duplicate in-flight requests
    if (insightsFetchInProgressRef.current) {
      return;
    }

    insightsFetchInProgressRef.current = true;

    try {
      const response = await fetchWithRetry(`/api/proactive-insights?userId=${encodeURIComponent(profile.id)}`);
      if (response.ok) {
        const data = await response.json();
        setProactiveInsights(data.insights || []);
      }
    } catch (error) {
      console.error('Error fetching proactive insights:', error);
    } finally {
      insightsFetchInProgressRef.current = false;
    }
  }, [profile?.id]);

  const dismissInsight = useCallback(async (insightId: string) => {
    try {
      const response = await fetch('/api/proactive-insights', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ insightId }),
      });

      if (response.ok) {
        setProactiveInsights(prev => prev.filter(i => i.id !== insightId));
      }
    } catch (error) {
      console.error('Error dismissing insight:', error);
    }
  }, []);

  const dismissAllInsights = useCallback(async () => {
    if (!profile?.id) return;

    try {
      const response = await fetch('/api/proactive-insights', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: profile.id, dismissAll: true }),
      });

      if (response.ok) {
        setProactiveInsights([]);
      }
    } catch (error) {
      console.error('Error dismissing all insights:', error);
    }
  }, [profile?.id]);

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
        // Home data cache
        homeDataCache,
        fetchHomeData,
        isLoadingHomeData,
        // Proactive insights
        proactiveInsights,
        fetchProactiveInsights,
        dismissInsight,
        dismissAllInsights,
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
