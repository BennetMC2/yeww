import { supabase } from './supabase';
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

// Storage key for local user ID (bridges sessions until we add auth)
const LOCAL_USER_ID_KEY = 'yeww_user_id';

// Helper to check if we're in browser
const isBrowser = typeof window !== 'undefined';

// Get or create local user ID - EXPORTED so AppContext can use it
export function getLocalUserId(): string | null {
  if (!isBrowser) return null;
  return localStorage.getItem(LOCAL_USER_ID_KEY);
}

function setLocalUserId(id: string): void {
  if (!isBrowser) return;
  localStorage.setItem(LOCAL_USER_ID_KEY, id);
}

// ============ Type Mapping Helpers ============

// Convert database user to frontend UserProfile
function dbUserToProfile(dbUser: Record<string, unknown>, pointsHistory: PointsTransaction[] = []): UserProfile {
  return {
    id: dbUser.id as string,
    name: (dbUser.name as string) || '',
    createdAt: dbUser.created_at as string,
    coachingStyle: (dbUser.coaching_style as CoachingStyle) || 'balanced',
    connectedApps: (dbUser.connected_apps as ConnectedApp[]) || [],
    healthAreas: (dbUser.health_areas as HealthArea[]) || [],
    onboardingCompleted: (dbUser.onboarding_completed as boolean) || false,
    lastCheckIn: dbUser.last_check_in as string | null,
    checkInStreak: (dbUser.check_in_streak as number) || 0,
    dataSources: (dbUser.data_sources as DataSource[]) || [],
    priorities: (dbUser.priorities as Priority[]) || [],
    pastAttempt: dbUser.past_attempt as PastAttempt | null,
    barriers: (dbUser.barriers as Barrier[]) || [],
    healthScore: (dbUser.health_score as number) || 0,
    reputationLevel: (dbUser.reputation_level as UserProfile['reputationLevel']) || 'starter',
    reputationPoints: (dbUser.reputation_points as number) || 0,
    points: (dbUser.points as number) || 0,
    pointsHistory,
    sharingPreferences: {
      research: (dbUser.sharing_research as boolean) || false,
      brands: (dbUser.sharing_brands as boolean) || false,
      insurance: (dbUser.sharing_insurance as boolean) || false,
    },
  };
}

// Convert frontend UserProfile to database format
function profileToDbUser(profile: UserProfile): Record<string, unknown> {
  return {
    id: profile.id,
    name: profile.name || null,
    coaching_style: profile.coachingStyle,
    connected_apps: profile.connectedApps,
    health_areas: profile.healthAreas,
    onboarding_completed: profile.onboardingCompleted,
    last_check_in: profile.lastCheckIn,
    check_in_streak: profile.checkInStreak,
    data_sources: profile.dataSources,
    priorities: profile.priorities,
    past_attempt: profile.pastAttempt,
    barriers: profile.barriers,
    health_score: profile.healthScore,
    reputation_level: profile.reputationLevel,
    reputation_points: profile.reputationPoints,
    points: profile.points,
    sharing_research: profile.sharingPreferences.research,
    sharing_brands: profile.sharingPreferences.brands,
    sharing_insurance: profile.sharingPreferences.insurance,
  };
}

// ============ User Profile ============

export function createDefaultProfile(existingId?: string): UserProfile {
  return {
    id: existingId || crypto.randomUUID(),  // Preserve existing ID if provided
    name: '',
    createdAt: new Date().toISOString(),
    coachingStyle: 'balanced',
    connectedApps: [],
    healthAreas: [],
    onboardingCompleted: false,
    lastCheckIn: null,
    checkInStreak: 0,
    dataSources: [],
    priorities: [],
    pastAttempt: null,
    barriers: [],
    healthScore: 0,
    reputationLevel: 'starter',
    reputationPoints: 0,
    points: 0,
    pointsHistory: [],
    sharingPreferences: {
      research: false,
      brands: false,
      insurance: false,
    },
  };
}

export async function getUserProfile(): Promise<UserProfile | null> {
  const userId = getLocalUserId();
  if (!userId) {
    // Check for fallback profile
    if (isBrowser) {
      const fallback = localStorage.getItem('yeww_profile_fallback');
      if (fallback) {
        try {
          return JSON.parse(fallback) as UserProfile;
        } catch {
          // Invalid JSON, ignore
        }
      }
    }
    return null;
  }

  try {
    // Fetch user and their points history
    const [userResult, pointsResult] = await Promise.all([
      supabase.from('users').select('*').eq('id', userId).single(),
      supabase
        .from('points_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100),
    ]);

    if (userResult.error || !userResult.data) {
      // User not in Supabase - check for fallback first
      if (isBrowser) {
        const fallback = localStorage.getItem('yeww_profile_fallback');
        if (fallback) {
          try {
            const fallbackProfile = JSON.parse(fallback) as UserProfile;
            // CRITICAL: Ensure fallback profile ID matches localStorage ID
            // This prevents the wrong ID from propagating through the app
            fallbackProfile.id = userId;
            return fallbackProfile;
          } catch {
            // Invalid JSON, ignore
          }
        }
      }

      // No fallback - create new profile with EXISTING localStorage ID
      // This preserves the ID that was set (e.g., to match Terra reference_id)
      console.log('Creating new profile with existing localStorage ID:', userId);
      const newProfile = createDefaultProfile(userId);
      await saveUserProfile(newProfile);
      return newProfile;
    }

    const pointsHistory: PointsTransaction[] = (pointsResult.data || []).map((p) => ({
      id: p.id,
      type: p.type as PointsTransaction['type'],
      amount: p.amount,
      description: p.description || '',
      timestamp: p.created_at,
    }));

    return dbUserToProfile(userResult.data, pointsHistory);
  } catch (error) {
    console.error('Error reading user profile:', error);
    // Try fallback on error
    if (isBrowser) {
      const fallback = localStorage.getItem('yeww_profile_fallback');
      if (fallback) {
        try {
          const fallbackProfile = JSON.parse(fallback) as UserProfile;
          // CRITICAL: Ensure fallback profile ID matches localStorage ID
          if (userId) fallbackProfile.id = userId;
          return fallbackProfile;
        } catch {
          // Invalid JSON, ignore
        }
      }
    }
    return null;
  }
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  // ALWAYS store locally FIRST for offline resilience
  // This ensures the profile persists even if Supabase save is slow or fails
  setLocalUserId(profile.id);
  if (isBrowser) {
    localStorage.setItem('yeww_profile_fallback', JSON.stringify(profile));
  }

  try {
    const dbUser = profileToDbUser(profile);

    const { error } = await supabase
      .from('users')
      .upsert(dbUser, { onConflict: 'id' });

    if (error) {
      console.error('Error saving user profile to Supabase:', error.message || error);
      // Profile is already saved to localStorage, so app continues to work
      return;
    }

    // Success - clear fallback since Supabase has the data
    if (isBrowser) {
      localStorage.removeItem('yeww_profile_fallback');
    }
  } catch (error) {
    console.error('Error saving user profile:', error);
    // Profile is already saved to localStorage, so app continues to work
  }
}

export async function updateUserProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
  const current = await getUserProfile() || createDefaultProfile();
  const updated = { ...current, ...updates };
  await saveUserProfile(updated);
  return updated;
}

export async function setUserName(name: string): Promise<UserProfile> {
  return updateUserProfile({ name });
}

export async function setCoachingStyle(style: CoachingStyle): Promise<UserProfile> {
  return updateUserProfile({ coachingStyle: style });
}

export async function setConnectedApps(apps: ConnectedApp[]): Promise<UserProfile> {
  return updateUserProfile({ connectedApps: apps });
}

export async function completeOnboarding(): Promise<UserProfile> {
  return updateUserProfile({ onboardingCompleted: true });
}

export async function addHealthArea(areaId: string, areaName: string): Promise<UserProfile> {
  const profile = await getUserProfile() || createDefaultProfile();
  const exists = profile.healthAreas.some((a) => a.id === areaId);

  if (!exists) {
    const newArea: HealthArea = {
      id: areaId,
      name: areaName,
      active: true,
      addedAt: new Date().toISOString(),
    };
    profile.healthAreas.push(newArea);
    await saveUserProfile(profile);
  }

  return profile;
}

export async function removeHealthArea(areaId: string): Promise<UserProfile> {
  const profile = await getUserProfile() || createDefaultProfile();
  profile.healthAreas = profile.healthAreas.filter((a) => a.id !== areaId);
  await saveUserProfile(profile);
  return profile;
}

export async function recordCheckIn(): Promise<UserProfile> {
  const profile = await getUserProfile() || createDefaultProfile();
  const now = new Date();
  const lastCheckIn = profile.lastCheckIn ? new Date(profile.lastCheckIn) : null;

  // Check if this is a consecutive day
  let newStreak = 1;
  if (lastCheckIn) {
    const daysDiff = Math.floor(
      (now.getTime() - lastCheckIn.getTime()) / (1000 * 60 * 60 * 24)
    );
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

const CONVERSATIONS_FALLBACK_KEY = 'yeww_conversations_fallback';

function getLocalConversations(): ConversationHistory {
  if (!isBrowser) return { conversations: [] };
  const stored = localStorage.getItem(CONVERSATIONS_FALLBACK_KEY);
  if (stored) {
    try {
      return JSON.parse(stored) as ConversationHistory;
    } catch {
      return { conversations: [] };
    }
  }
  return { conversations: [] };
}

function saveLocalConversations(history: ConversationHistory): void {
  if (!isBrowser) return;
  localStorage.setItem(CONVERSATIONS_FALLBACK_KEY, JSON.stringify(history));
}

export async function getConversationHistory(): Promise<ConversationHistory> {
  // Always get localStorage data first
  const localHistory = getLocalConversations();

  const userId = getLocalUserId();
  if (!userId) return localHistory;

  try {
    // Get all conversations with their messages
    const { data: convos, error } = await supabase
      .from('conversations')
      .select('id, date, messages(id, role, content, created_at, quick_actions)')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error || !convos || convos.length === 0) {
      // No Supabase data, return localStorage
      return localHistory;
    }

    const conversations: Conversation[] = convos.map((c) => ({
      id: c.id,
      date: c.date,
      messages: ((c.messages as Record<string, unknown>[]) || [])
        .sort((a, b) =>
          new Date(a.created_at as string).getTime() - new Date(b.created_at as string).getTime()
        )
        .map((m) => ({
          id: m.id as string,
          role: m.role as 'assistant' | 'user',
          content: m.content as string,
          timestamp: m.created_at as string,
          quickActions: m.quick_actions as { label: string; value: string }[] | undefined,
        })),
    }));

    // Merge with localStorage (localStorage takes precedence for today's messages)
    const today = new Date().toISOString().split('T')[0];
    const localToday = localHistory.conversations.find(c => c.date === today);

    if (localToday && localToday.messages.length > 0) {
      // Replace or add today's conversation from localStorage
      const filtered = conversations.filter(c => c.date !== today);
      return { conversations: [localToday, ...filtered] };
    }

    return { conversations };
  } catch (error) {
    console.error('Error reading conversations:', error);
    return localHistory;
  }
}

export async function getTodayConversation(): Promise<Conversation | null> {
  const history = await getConversationHistory();
  const today = new Date().toISOString().split('T')[0];
  return history.conversations.find((c) => c.date === today) || null;
}

export async function addMessage(
  role: 'assistant' | 'user',
  content: string,
  options?: {
    quickActions?: { label: string; value: string }[];
    images?: Message['images'];
  }
): Promise<Message> {
  const userId = getLocalUserId();
  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toISOString();

  const quickActions = options?.quickActions;
  const images = options?.images;

  // Create message object
  const newMessage: Message = {
    id: crypto.randomUUID(),
    role,
    content,
    images,
    timestamp: now,
    quickActions,
  };

  // Try Supabase first (note: images stored in localStorage only for now)
  if (userId) {
    try {
      // Get or create today's conversation
      let { data: conversation } = await supabase
        .from('conversations')
        .select('id')
        .eq('user_id', userId)
        .eq('date', today)
        .single();

      if (!conversation) {
        const { data: newConvo, error: convoError } = await supabase
          .from('conversations')
          .insert({ user_id: userId, date: today })
          .select('id')
          .single();

        if (!convoError && newConvo) {
          conversation = newConvo;
        }
      }

      if (conversation) {
        // Add the message (images stored in localStorage, not Supabase for now)
        const { data: message, error: msgError } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversation.id,
            role,
            content,
            quick_actions: quickActions || null,
          })
          .select('id, created_at')
          .single();

        if (!msgError && message) {
          // Still store in localStorage to preserve images
          const history = getLocalConversations();
          let todayConvo = history.conversations.find((c) => c.date === today);
          if (!todayConvo) {
            todayConvo = { id: crypto.randomUUID(), date: today, messages: [] };
            history.conversations.unshift(todayConvo);
          }
          const msgWithImages: Message = {
            id: message.id,
            role,
            content,
            images,
            timestamp: message.created_at,
            quickActions,
          };
          todayConvo.messages.push(msgWithImages);
          saveLocalConversations(history);

          return msgWithImages;
        }
      }
    } catch (error) {
      console.error('Supabase message save failed, using localStorage:', error);
    }
  }

  // Fallback to localStorage
  const history = getLocalConversations();
  let todayConvo = history.conversations.find((c) => c.date === today);

  if (!todayConvo) {
    todayConvo = {
      id: crypto.randomUUID(),
      date: today,
      messages: [],
    };
    history.conversations.unshift(todayConvo);
  }

  todayConvo.messages.push(newMessage);
  saveLocalConversations(history);

  return newMessage;
}

export async function getAllMessages(): Promise<Message[]> {
  const history = await getConversationHistory();
  return history.conversations.flatMap((c) => c.messages);
}

// ============ Progress ============

export async function getProgressData(): Promise<ProgressData> {
  const userId = getLocalUserId();
  if (!userId) return { entries: [] };

  try {
    const { data, error } = await supabase
      .from('progress_entries')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error || !data) {
      console.error('Error reading progress:', error);
      return { entries: [] };
    }

    const entries: ProgressEntry[] = data.map((e) => ({
      id: e.id,
      date: e.date,
      type: e.entry_type as ProgressEntry['type'],
      category: e.category as ProgressEntry['category'],
      content: e.content,
      note: e.note || undefined,
    }));

    return { entries };
  } catch (error) {
    console.error('Error reading progress:', error);
    return { entries: [] };
  }
}

export async function addProgressEntry(
  entry: Omit<ProgressEntry, 'id' | 'date'>
): Promise<ProgressEntry> {
  const userId = getLocalUserId();
  if (!userId) {
    throw new Error('No user ID found');
  }

  const now = new Date().toISOString();

  try {
    const { data, error } = await supabase
      .from('progress_entries')
      .insert({
        user_id: userId,
        date: now,
        entry_type: entry.type,
        category: entry.category,
        content: entry.content,
        note: entry.note || null,
      })
      .select('id')
      .single();

    if (error || !data) {
      throw new Error('Failed to add progress entry');
    }

    return {
      id: data.id,
      date: now,
      ...entry,
    };
  } catch (error) {
    console.error('Error adding progress entry:', error);
    throw error;
  }
}

export async function addMilestone(content: string): Promise<ProgressEntry> {
  return addProgressEntry({
    type: 'milestone',
    category: 'general',
    content,
  });
}

// ============ New Onboarding Data ============

export async function setDataSources(sources: DataSource[]): Promise<UserProfile> {
  return updateUserProfile({ dataSources: sources });
}

export async function setPriorities(priorities: Priority[]): Promise<UserProfile> {
  return updateUserProfile({ priorities });
}

export async function setPastAttempt(attempt: PastAttempt): Promise<UserProfile> {
  return updateUserProfile({ pastAttempt: attempt });
}

export async function setBarriers(barriers: Barrier[]): Promise<UserProfile> {
  return updateUserProfile({ barriers });
}

// ============ Points System ============

export async function addPoints(
  type: PointsTransaction['type'],
  amount: number,
  description: string
): Promise<UserProfile> {
  const userId = getLocalUserId();
  if (!userId) {
    throw new Error('No user ID found');
  }

  const profile = await getUserProfile() || createDefaultProfile();

  try {
    // Add to points_history
    await supabase.from('points_history').insert({
      user_id: userId,
      type,
      amount,
      description,
    });

    // Update user points
    const updatedProfile = {
      ...profile,
      points: profile.points + amount,
    };
    await saveUserProfile(updatedProfile);

    // Refresh to get updated points history
    return (await getUserProfile()) || updatedProfile;
  } catch (error) {
    console.error('Error adding points:', error);
    throw error;
  }
}

// ============ Sharing Preferences ============

export async function setSharingPreference(
  key: keyof SharingPreferences,
  value: boolean
): Promise<UserProfile> {
  const profile = await getUserProfile() || createDefaultProfile();
  return updateUserProfile({
    sharingPreferences: {
      ...profile.sharingPreferences,
      [key]: value,
    },
  });
}

// ============ Reset ============

export async function resetAllData(): Promise<void> {
  const userId = getLocalUserId();

  if (userId) {
    try {
      // Delete all user data from Supabase
      await Promise.all([
        supabase.from('messages').delete().in(
          'conversation_id',
          (await supabase.from('conversations').select('id').eq('user_id', userId)).data?.map(c => c.id) || []
        ),
        supabase.from('conversations').delete().eq('user_id', userId),
        supabase.from('progress_entries').delete().eq('user_id', userId),
        supabase.from('points_history').delete().eq('user_id', userId),
        supabase.from('users').delete().eq('id', userId),
      ]);
    } catch (error) {
      console.error('Error resetting data:', error);
    }
  }

  // Clear local user ID
  if (isBrowser) {
    localStorage.removeItem(LOCAL_USER_ID_KEY);
  }
}

// ============ Migration Helper ============
// Call this once to check if user needs migration from localStorage

export async function migrateFromLocalStorage(): Promise<void> {
  if (!isBrowser) return;

  const OLD_KEYS = {
    USER_PROFILE: 'yeww_user_profile',
    CONVERSATIONS: 'yeww_conversations',
    PROGRESS: 'yeww_progress',
  };

  // Check if old data exists
  const oldProfileStr = localStorage.getItem(OLD_KEYS.USER_PROFILE);
  if (!oldProfileStr) return;

  try {
    const oldProfile = JSON.parse(oldProfileStr);

    // Check if already migrated (user exists in Supabase)
    const existingUserId = getLocalUserId();
    if (existingUserId) {
      const { data } = await supabase.from('users').select('id').eq('id', existingUserId).single();
      if (data) return; // Already migrated
    }

    console.log('Migrating data from localStorage to Supabase...');

    // Create user in Supabase
    const profile: UserProfile = {
      id: existingUserId || oldProfile.id || crypto.randomUUID(),  // Preserve existing localStorage ID!
      name: oldProfile.name || '',
      createdAt: oldProfile.createdAt || new Date().toISOString(),
      coachingStyle: oldProfile.coachingStyle || 'balanced',
      connectedApps: oldProfile.connectedApps || [],
      healthAreas: oldProfile.healthAreas || [],
      onboardingCompleted: oldProfile.onboardingCompleted || false,
      lastCheckIn: oldProfile.lastCheckIn || null,
      checkInStreak: oldProfile.checkInStreak || 0,
      dataSources: oldProfile.dataSources || [],
      priorities: oldProfile.priorities || [],
      pastAttempt: oldProfile.pastAttempt || null,
      barriers: oldProfile.barriers || [],
      healthScore: oldProfile.healthScore || 0,
      reputationLevel: oldProfile.reputationLevel || 'starter',
      reputationPoints: oldProfile.reputationPoints || 0,
      points: oldProfile.points || 0,
      pointsHistory: oldProfile.pointsHistory || [],
      sharingPreferences: oldProfile.sharingPreferences || {
        research: false,
        brands: false,
        insurance: false,
      },
    };

    await saveUserProfile(profile);

    // Migrate conversations
    const oldConvosStr = localStorage.getItem(OLD_KEYS.CONVERSATIONS);
    if (oldConvosStr) {
      const oldConvos = JSON.parse(oldConvosStr);
      for (const conv of oldConvos.conversations || []) {
        // Create conversation
        const { data: newConvo } = await supabase
          .from('conversations')
          .insert({ user_id: profile.id, date: conv.date })
          .select('id')
          .single();

        if (newConvo) {
          // Add messages
          for (const msg of conv.messages || []) {
            await supabase.from('messages').insert({
              conversation_id: newConvo.id,
              role: msg.role,
              content: msg.content,
              quick_actions: msg.quickActions || null,
            });
          }
        }
      }
    }

    // Migrate progress
    const oldProgressStr = localStorage.getItem(OLD_KEYS.PROGRESS);
    if (oldProgressStr) {
      const oldProgress = JSON.parse(oldProgressStr);
      for (const entry of oldProgress.entries || []) {
        await supabase.from('progress_entries').insert({
          user_id: profile.id,
          date: entry.date,
          entry_type: entry.type,
          category: entry.category,
          content: entry.content,
          note: entry.note || null,
        });
      }
    }

    // Migrate points history
    for (const pt of profile.pointsHistory) {
      await supabase.from('points_history').insert({
        user_id: profile.id,
        type: pt.type,
        amount: pt.amount,
        description: pt.description,
      });
    }

    // Clear old localStorage data
    localStorage.removeItem(OLD_KEYS.USER_PROFILE);
    localStorage.removeItem(OLD_KEYS.CONVERSATIONS);
    localStorage.removeItem(OLD_KEYS.PROGRESS);

    console.log('Migration complete!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}
