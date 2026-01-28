import {
  PromptContext,
  UserProfile,
  SessionContext,
  TimeOfDay,
  CoachingStyle,
  ReputationLevel,
  Priority,
  PastAttempt,
  Barrier,
  DataSource,
  HealthArea,
  HealthMetrics,
  DetectedPattern,
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
  buildVO2MaxKnowledgeSection,
  buildVO2MaxInsights,
  buildSleepKnowledgeSection,
  buildSleepInsights,
  buildHRVKnowledgeSection,
  buildHRVInsights,
  buildRecoveryInsights,
  buildExerciseKnowledgeSection,
  buildExerciseInsights,
  buildStressKnowledgeSection,
  buildLongevityKnowledgeSection,
  buildCircadianKnowledgeSection,
  buildNutritionKnowledgeSection,
  buildSupplementsKnowledgeSection,
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

    // Health domain knowledge (general + specialized)
    buildHealthKnowledgeSection(),
    buildVO2MaxKnowledgeSection(),
    buildSleepKnowledgeSection(),
    buildHRVKnowledgeSection(),
    buildExerciseKnowledgeSection(),
    buildStressKnowledgeSection(),
    buildLongevityKnowledgeSection(),
    buildCircadianKnowledgeSection(),
    buildNutritionKnowledgeSection(),
    buildSupplementsKnowledgeSection(),

    // Current metrics and insights
    buildCurrentMetricsSection(context.healthMetrics),
    buildVO2MaxInsights(context.healthMetrics),
    buildSleepInsights(context.healthMetrics),
    buildHRVInsights(context.healthMetrics),
    buildRecoveryInsights(context.healthMetrics),
    buildExerciseInsights(context.healthMetrics),

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
    id?: string;
    name: string;
    coachingStyle: CoachingStyle;
    healthAreas: HealthArea[];
    createdAt: string;
    healthScore: number;
    reputationLevel: ReputationLevel;
    points: number;
    priorities: Priority[];
    pastAttempt: PastAttempt | null;
    barriers: Barrier[];
    dataSources: DataSource[];
    checkInStreak: number;
    lastCheckIn?: string | null;
  },
  conversationTurn: number = 1,
  healthMetrics?: HealthMetrics,
  detectedPatterns?: DetectedPattern[]
): string {
  // Convert to full UserProfile format
  const fullProfile: UserProfile = {
    id: userProfile.id || 'current-user',
    name: userProfile.name,
    createdAt: userProfile.createdAt,
    coachingStyle: userProfile.coachingStyle,
    connectedApps: [],
    healthAreas: userProfile.healthAreas,
    onboardingCompleted: true,
    lastCheckIn: userProfile.lastCheckIn || null,
    checkInStreak: userProfile.checkInStreak,
    dataSources: userProfile.dataSources,
    priorities: userProfile.priorities,
    pastAttempt: userProfile.pastAttempt,
    barriers: userProfile.barriers,
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

  // Add health metrics if available from Terra
  if (healthMetrics) {
    context.healthMetrics = healthMetrics;
  }

  // Add detected patterns if available
  if (detectedPatterns && detectedPatterns.length > 0) {
    context.detectedPatterns = detectedPatterns;
  }

  return buildSystemPrompt(context);
}
