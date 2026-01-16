import { v4 as uuidv4 } from 'uuid';
import {
  UserProfile,
  ConversationHistory,
  ProgressData,
  Message,
  Conversation,
  ProgressEntry,
  HealthArea,
  CoachingStyle,
  ConnectedApp,
  DataSource,
  Priority,
  PastAttempt,
  Barrier,
  PointsTransaction,
  SharingPreferences,
} from '@/types';

// Storage keys
const STORAGE_KEYS = {
  USER_PROFILE: 'yeww_user_profile',
  CONVERSATIONS: 'yeww_conversations',
  PROGRESS: 'yeww_progress',
} as const;

// Helper to check if we're in browser
const isBrowser = typeof window !== 'undefined';

// ============ User Profile ============

export function createDefaultProfile(): UserProfile {
  return {
    id: uuidv4(),
    name: '',
    createdAt: new Date().toISOString(),
    coachingStyle: 'balanced',
    connectedApps: [],
    healthAreas: [],
    onboardingCompleted: false,
    lastCheckIn: null,
    checkInStreak: 0,
    // New onboarding data
    dataSources: [],
    priorities: [],
    pastAttempt: null,
    barriers: [],
    // Scores
    healthScore: 0,
    reputationLevel: 'starter',
    reputationPoints: 0,
    points: 0,
    pointsHistory: [],
    // Sharing preferences (all default OFF)
    sharingPreferences: {
      research: false,
      brands: false,
      insurance: false,
    },
  };
}

// Migrate existing profiles to include new fields
export function migrateProfile(profile: Partial<UserProfile>): UserProfile {
  const defaultProfile = createDefaultProfile();
  return {
    ...defaultProfile,
    ...profile,
    // Ensure new fields have defaults if missing
    dataSources: profile.dataSources ?? [],
    priorities: profile.priorities ?? [],
    pastAttempt: profile.pastAttempt ?? null,
    barriers: profile.barriers ?? [],
    healthScore: profile.healthScore ?? 0,
    reputationLevel: profile.reputationLevel ?? 'starter',
    reputationPoints: profile.reputationPoints ?? 0,
    points: profile.points ?? 0,
    pointsHistory: profile.pointsHistory ?? [],
    sharingPreferences: profile.sharingPreferences ?? {
      research: false,
      brands: false,
      insurance: false,
    },
  };
}

export function getUserProfile(): UserProfile | null {
  if (!isBrowser) return null;
  try {
    const data = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    if (!data) return null;
    // Migrate existing profiles to ensure they have all new fields
    const parsed = JSON.parse(data);
    return migrateProfile(parsed);
  } catch (error) {
    console.error('Error reading user profile:', error);
    return null;
  }
}

export function saveUserProfile(profile: UserProfile): void {
  if (!isBrowser) return;
  try {
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
  } catch (error) {
    console.error('Error saving user profile:', error);
  }
}

export function updateUserProfile(updates: Partial<UserProfile>): UserProfile {
  const current = getUserProfile() || createDefaultProfile();
  const updated = { ...current, ...updates };
  saveUserProfile(updated);
  return updated;
}

export function setUserName(name: string): UserProfile {
  return updateUserProfile({ name });
}

export function setCoachingStyle(style: CoachingStyle): UserProfile {
  return updateUserProfile({ coachingStyle: style });
}

export function setConnectedApps(apps: ConnectedApp[]): UserProfile {
  return updateUserProfile({ connectedApps: apps });
}

export function completeOnboarding(): UserProfile {
  return updateUserProfile({ onboardingCompleted: true });
}

export function addHealthArea(areaId: string, areaName: string): UserProfile {
  const profile = getUserProfile() || createDefaultProfile();
  const exists = profile.healthAreas.some(a => a.id === areaId);

  if (!exists) {
    const newArea: HealthArea = {
      id: areaId,
      name: areaName,
      active: true,
      addedAt: new Date().toISOString(),
    };
    profile.healthAreas.push(newArea);
    saveUserProfile(profile);
  }

  return profile;
}

export function removeHealthArea(areaId: string): UserProfile {
  const profile = getUserProfile() || createDefaultProfile();
  profile.healthAreas = profile.healthAreas.filter(a => a.id !== areaId);
  saveUserProfile(profile);
  return profile;
}

export function recordCheckIn(): UserProfile {
  const profile = getUserProfile() || createDefaultProfile();
  const now = new Date();
  const lastCheckIn = profile.lastCheckIn ? new Date(profile.lastCheckIn) : null;

  // Check if this is a consecutive day
  let newStreak = 1;
  if (lastCheckIn) {
    const daysDiff = Math.floor((now.getTime() - lastCheckIn.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff === 1) {
      newStreak = profile.checkInStreak + 1;
    } else if (daysDiff === 0) {
      // Same day, keep streak
      newStreak = profile.checkInStreak;
    }
  }

  return updateUserProfile({
    lastCheckIn: now.toISOString(),
    checkInStreak: newStreak,
  });
}

// ============ Conversations ============

export function getConversationHistory(): ConversationHistory {
  if (!isBrowser) return { conversations: [] };
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
    return data ? JSON.parse(data) : { conversations: [] };
  } catch (error) {
    console.error('Error reading conversations:', error);
    return { conversations: [] };
  }
}

export function saveConversationHistory(history: ConversationHistory): void {
  if (!isBrowser) return;
  try {
    localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(history));
  } catch (error) {
    console.error('Error saving conversations:', error);
  }
}

export function getTodayConversation(): Conversation | null {
  const history = getConversationHistory();
  const today = new Date().toISOString().split('T')[0];
  return history.conversations.find(c => c.date === today) || null;
}

export function addMessage(role: 'assistant' | 'user', content: string, quickActions?: { label: string; value: string }[]): Message {
  const history = getConversationHistory();
  const today = new Date().toISOString().split('T')[0];

  let conversation = history.conversations.find(c => c.date === today);

  if (!conversation) {
    conversation = {
      id: uuidv4(),
      date: today,
      messages: [],
    };
    history.conversations.unshift(conversation);
  }

  const message: Message = {
    id: uuidv4(),
    role,
    content,
    timestamp: new Date().toISOString(),
    quickActions,
  };

  conversation.messages.push(message);
  saveConversationHistory(history);

  return message;
}

export function getAllMessages(): Message[] {
  const history = getConversationHistory();
  return history.conversations.flatMap(c => c.messages);
}

// ============ Progress ============

export function getProgressData(): ProgressData {
  if (!isBrowser) return { entries: [] };
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PROGRESS);
    return data ? JSON.parse(data) : { entries: [] };
  } catch (error) {
    console.error('Error reading progress:', error);
    return { entries: [] };
  }
}

export function saveProgressData(data: ProgressData): void {
  if (!isBrowser) return;
  try {
    localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving progress:', error);
  }
}

export function addProgressEntry(entry: Omit<ProgressEntry, 'id' | 'date'>): ProgressEntry {
  const data = getProgressData();

  const newEntry: ProgressEntry = {
    id: uuidv4(),
    date: new Date().toISOString(),
    ...entry,
  };

  data.entries.unshift(newEntry);
  saveProgressData(data);

  return newEntry;
}

export function addMilestone(content: string): ProgressEntry {
  return addProgressEntry({
    type: 'milestone',
    category: 'general',
    content,
  });
}

// ============ New Onboarding Data ============

export function setDataSources(sources: DataSource[]): UserProfile {
  return updateUserProfile({ dataSources: sources });
}

export function setPriorities(priorities: Priority[]): UserProfile {
  return updateUserProfile({ priorities });
}

export function setPastAttempt(attempt: PastAttempt): UserProfile {
  return updateUserProfile({ pastAttempt: attempt });
}

export function setBarriers(barriers: Barrier[]): UserProfile {
  return updateUserProfile({ barriers });
}

// ============ Points System ============

export function addPoints(
  type: PointsTransaction['type'],
  amount: number,
  description: string
): UserProfile {
  const profile = getUserProfile() || createDefaultProfile();

  const transaction: PointsTransaction = {
    id: uuidv4(),
    type,
    amount,
    description,
    timestamp: new Date().toISOString(),
  };

  const updatedProfile = {
    ...profile,
    points: profile.points + amount,
    pointsHistory: [transaction, ...profile.pointsHistory].slice(0, 100), // Keep last 100 transactions
  };

  saveUserProfile(updatedProfile);
  return updatedProfile;
}

// ============ Sharing Preferences ============

export function setSharingPreference(
  key: keyof SharingPreferences,
  value: boolean
): UserProfile {
  const profile = getUserProfile() || createDefaultProfile();
  return updateUserProfile({
    sharingPreferences: {
      ...profile.sharingPreferences,
      [key]: value,
    },
  });
}

// ============ Reset ============

export function resetAllData(): void {
  if (!isBrowser) return;
  try {
    localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
    localStorage.removeItem(STORAGE_KEYS.CONVERSATIONS);
    localStorage.removeItem(STORAGE_KEYS.PROGRESS);
  } catch (error) {
    console.error('Error resetting data:', error);
  }
}
