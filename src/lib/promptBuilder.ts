import {
  PromptContext,
  UserProfile,
  SessionContext,
  TimeOfDay,
} from '@/types';

import {
  buildIdentitySection,
  buildMissionSection,
  buildUserContextSection,
  buildHealthKnowledgeSection,
  buildCurrentMetricsSection,
  buildConversationSection,
  buildSessionContextSection,
  buildVoiceSection,
  buildSafetySection,
  buildExamplesSection,
  buildPatternGuidelines,
  buildActivePatterns,
  buildFormattingSection,
} from './promptSections';

/**
 * Determines the time of day based on hour
 */
function getTimeOfDay(hour: number): TimeOfDay {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

/**
 * Creates a session context from current state
 */
export function createSessionContext(
  lastCheckIn: string | null,
  conversationTurn: number = 1
): SessionContext {
  const now = new Date();
  const hour = now.getHours();

  // Calculate days since last check-in
  let lastCheckInDaysAgo: number | null = null;
  if (lastCheckIn) {
    const lastCheckInDate = new Date(lastCheckIn);
    const diffTime = now.getTime() - lastCheckInDate.getTime();
    lastCheckInDaysAgo = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  // Determine if this is first message today
  const isFirstMessageToday = !lastCheckIn ||
    new Date(lastCheckIn).toDateString() !== now.toDateString();

  return {
    timeOfDay: getTimeOfDay(hour),
    dayOfWeek: now.toLocaleDateString('en-US', { weekday: 'long' }),
    isFirstMessageToday,
    lastCheckInDaysAgo,
    conversationTurn,
  };
}

/**
 * Creates a minimal PromptContext from UserProfile for API route
 */
export function createPromptContext(
  userProfile: UserProfile,
  conversationTurn: number = 1
): PromptContext {
  return {
    userProfile,
    session: createSessionContext(userProfile.lastCheckIn, conversationTurn),
    // healthMetrics and detectedPatterns will be added when available
  };
}

/**
 * Builds the complete system prompt from context
 * This is the main function used by the chat API
 */
export function buildSystemPrompt(context: PromptContext): string {
  const sections = [
    // Core identity and mission
    buildIdentitySection(),
    buildMissionSection(),

    // User-specific context
    buildUserContextSection(context),

    // Health domain knowledge
    buildHealthKnowledgeSection(),
    buildCurrentMetricsSection(context.healthMetrics),

    // Conversation design
    buildConversationSection(),
    buildSessionContextSection(context),

    // Voice and personality
    buildVoiceSection(),

    // Safety and boundaries
    buildSafetySection(),

    // Pattern handling
    buildPatternGuidelines(),
    buildActivePatterns(context.detectedPatterns),

    // Formatting guidelines
    buildFormattingSection(),

    // Few-shot examples (last for maximum attention)
    buildExamplesSection(context),
  ];

  // Filter out empty sections and join
  return `<system>\n${sections.filter(Boolean).join('\n\n')}\n</system>`;
}

/**
 * Simplified prompt builder for the API route
 * Takes the user profile data directly from the request
 */
export function buildSystemPromptFromProfile(
  userProfile: {
    name: string;
    coachingStyle: 'direct' | 'supportive' | 'balanced';
    healthAreas: { name: string }[];
    createdAt: string;
    healthScore: number;
    reputationLevel: 'starter' | 'regular' | 'trusted' | 'verified' | 'expert';
    points: number;
    priorities: string[];
    pastAttempt: 'many-times' | 'a-few-times' | 'once-or-twice' | 'not-really' | null;
    barriers: string[];
    dataSources: string[];
    checkInStreak: number;
    lastCheckIn?: string | null;
  },
  conversationTurn: number = 1
): string {
  // Convert to full UserProfile format
  const fullProfile: UserProfile = {
    id: 'current-user',
    name: userProfile.name,
    createdAt: userProfile.createdAt,
    coachingStyle: userProfile.coachingStyle,
    connectedApps: [],
    healthAreas: userProfile.healthAreas.map((a, i) => ({
      id: `area-${i}`,
      name: a.name,
      active: true,
      addedAt: userProfile.createdAt,
    })),
    onboardingCompleted: true,
    lastCheckIn: userProfile.lastCheckIn || null,
    checkInStreak: userProfile.checkInStreak,
    dataSources: userProfile.dataSources as UserProfile['dataSources'],
    priorities: userProfile.priorities as UserProfile['priorities'],
    pastAttempt: userProfile.pastAttempt,
    barriers: userProfile.barriers as UserProfile['barriers'],
    healthScore: userProfile.healthScore,
    reputationLevel: userProfile.reputationLevel,
    reputationPoints: userProfile.points,
    points: userProfile.points,
    pointsHistory: [],
    sharingPreferences: {
      research: false,
      brands: false,
      insurance: false,
    },
  };

  const context = createPromptContext(fullProfile, conversationTurn);
  return buildSystemPrompt(context);
}
