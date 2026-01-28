// Re-export types from lib files for convenience
export type { DailyInsight, InsightSentiment } from '@/lib/insightGenerator';
export type { CheckInContext, CheckInOption } from '@/lib/checkInContext';
export type { HealthScoreTrend, MetricTrend, MetricTrends } from '@/lib/healthHistory';

export type CoachingStyle = 'direct' | 'supportive' | 'balanced';

export type ConnectedApp = 'apple-health' | 'oura' | 'whoop' | 'garmin' | 'fitbit';

// Data sources for fragmentation reveal (expanded)
export type DataSource =
  | 'apple-health' | 'google-fit' | 'oura' | 'whoop' | 'garmin' | 'fitbit'
  | 'myfitnesspal' | 'strava' | 'photos' | 'notes' | 'medical-records'
  | 'spreadsheets' | 'memory' | 'other';

// Priorities for "What Matters" screen
export type Priority =
  | 'sleep-better' | 'more-energy' | 'lose-weight' | 'build-muscle'
  | 'reduce-stress' | 'improve-focus' | 'live-longer' | 'understand-body'
  | 'be-consistent' | 'feel-better';

// Past attempts options
export type PastAttempt = 'many-times' | 'a-few-times' | 'once-or-twice' | 'using-ai-already' | 'not-really';

// Barriers that get in the way
export type Barrier =
  | 'life-busy' | 'lose-motivation' | 'no-results-fast' | 'advice-generic'
  | 'forget-to-track' | 'feels-like-chore' | 'not-sure-what-works';

// Reputation levels
export type ReputationLevel = 'starter' | 'regular' | 'trusted' | 'verified' | 'expert';

// Sharing preferences
export interface SharingPreferences {
  research: boolean;
  brands: boolean;
  insurance: boolean;
}

// Points transaction record
export interface PointsTransaction {
  id: string;
  type: 'check-in' | 'log-data' | 'hit-goal' | 'streak-bonus' | 'connect-source' | 'complete-onboarding';
  amount: number;
  description: string;
  timestamp: string;
}

export interface HealthArea {
  id: string;
  name: string;
  active: boolean;
  addedAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  createdAt: string;
  coachingStyle: CoachingStyle;
  connectedApps: ConnectedApp[];
  healthAreas: HealthArea[];
  onboardingCompleted: boolean;
  lastCheckIn: string | null;
  checkInStreak: number;

  // Onboarding data
  dataSources: DataSource[];
  priorities: Priority[];
  pastAttempt: PastAttempt | null;
  barriers: Barrier[];

  // Scores
  healthScore: number;
  reputationLevel: ReputationLevel;
  reputationPoints: number;
  points: number;
  pointsHistory: PointsTransaction[];

  // Sharing preferences
  sharingPreferences: SharingPreferences;
}

export type MessageRole = 'assistant' | 'user';

export interface QuickAction {
  label: string;
  value: string;
}

export interface MessageImage {
  id: string;
  data: string;  // base64 data URL
  mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  images?: MessageImage[];
  timestamp: string;
  quickActions?: QuickAction[];
}

export interface Conversation {
  id: string;
  date: string;
  messages: Message[];
}

export interface ConversationHistory {
  conversations: Conversation[];
}

export type ProgressEntryType = 'photo' | 'milestone' | 'note';

export type ProgressCategory = 'body' | 'skin' | 'general';

export interface ProgressEntry {
  id: string;
  date: string;
  type: ProgressEntryType;
  category: ProgressCategory;
  content: string;
  note?: string;
}

export interface ProgressData {
  entries: ProgressEntry[];
}

// Health area definitions
export interface HealthAreaDefinition {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export const HEALTH_AREAS: HealthAreaDefinition[] = [
  { id: 'sleep', name: 'Sleep', icon: 'Moon', description: 'Track your sleep patterns and quality' },
  { id: 'activity', name: 'Activity', icon: 'Activity', description: 'Monitor your physical activity and exercise' },
  { id: 'nutrition', name: 'Nutrition', icon: 'Apple', description: 'Track your eating habits and nutrition' },
  { id: 'mental-health', name: 'Mental Health', icon: 'Brain', description: 'Monitor your mental wellbeing and stress' },
  { id: 'energy', name: 'Energy', icon: 'Zap', description: 'Track your energy levels throughout the day' },
  { id: 'weight', name: 'Weight', icon: 'Scale', description: 'Monitor your weight and body composition' },
  { id: 'heart-health', name: 'Heart Health', icon: 'Heart', description: 'Track heart rate and cardiovascular health' },
  { id: 'eyes', name: 'Eyes', icon: 'Eye', description: 'Monitor eye health and screen time' },
  { id: 'skin', name: 'Skin', icon: 'Sparkles', description: 'Track skin health and conditions' },
  { id: 'bloodwork', name: 'Bloodwork', icon: 'Droplet', description: 'Track lab results and biomarkers' },
];

// Data source definitions for onboarding
export interface DataSourceDefinition {
  id: DataSource;
  name: string;
  icon: string;
}

export const DATA_SOURCES: DataSourceDefinition[] = [
  { id: 'apple-health', name: 'Apple Health', icon: 'Apple' },
  { id: 'google-fit', name: 'Google Fit', icon: 'Activity' },
  { id: 'oura', name: 'Oura', icon: 'Circle' },
  { id: 'whoop', name: 'Whoop', icon: 'Activity' },
  { id: 'garmin', name: 'Garmin', icon: 'Watch' },
  { id: 'fitbit', name: 'Fitbit', icon: 'Heart' },
  { id: 'myfitnesspal', name: 'MyFitnessPal', icon: 'Utensils' },
  { id: 'strava', name: 'Strava', icon: 'Bike' },
  { id: 'photos', name: 'Photos on your phone', icon: 'Camera' },
  { id: 'notes', name: 'Notes app', icon: 'FileText' },
  { id: 'medical-records', name: 'Doctor/medical records', icon: 'ClipboardList' },
  { id: 'spreadsheets', name: 'Spreadsheets', icon: 'Table' },
  { id: 'memory', name: 'Your memory', icon: 'Brain' },
  { id: 'other', name: 'Other apps', icon: 'MoreHorizontal' },
];

// Priority definitions for onboarding
export interface PriorityDefinition {
  id: Priority;
  name: string;
}

export const PRIORITIES: PriorityDefinition[] = [
  { id: 'sleep-better', name: 'Sleep better' },
  { id: 'more-energy', name: 'More energy' },
  { id: 'lose-weight', name: 'Lose weight' },
  { id: 'build-muscle', name: 'Build muscle' },
  { id: 'reduce-stress', name: 'Reduce stress' },
  { id: 'improve-focus', name: 'Improve focus' },
  { id: 'live-longer', name: 'Live longer' },
  { id: 'understand-body', name: 'Understand my body' },
  { id: 'be-consistent', name: 'Be more consistent' },
  { id: 'feel-better', name: 'Feel better overall' },
];

// Past attempt definitions
export interface PastAttemptDefinition {
  id: PastAttempt;
  label: string;
}

export const PAST_ATTEMPTS: PastAttemptDefinition[] = [
  { id: 'many-times', label: "Yeah, many times. Never sticks." },
  { id: 'a-few-times', label: "A few times. Some things worked for a while." },
  { id: 'once-or-twice', label: "Once or twice. Didn't really commit." },
  { id: 'using-ai-already', label: "Tracking with AI already. Clunky, scattered, forgetful." },
  { id: 'not-really', label: "Not really. This is new for me." },
];

// Barrier definitions
export interface BarrierDefinition {
  id: Barrier;
  label: string;
}

export const BARRIERS: BarrierDefinition[] = [
  { id: 'life-busy', label: 'Life gets busy' },
  { id: 'lose-motivation', label: 'I lose motivation' },
  { id: 'no-results-fast', label: "I don't see results fast enough" },
  { id: 'advice-generic', label: 'The advice feels generic' },
  { id: 'forget-to-track', label: 'I forget to track' },
  { id: 'feels-like-chore', label: 'It feels like a chore' },
  { id: 'not-sure-what-works', label: "I'm not sure what actually works for me" },
];

// Reputation level thresholds
export const REPUTATION_THRESHOLDS: Record<ReputationLevel, number> = {
  starter: 0,
  regular: 50,
  trusted: 150,
  verified: 300,
  expert: 500,
};

// Prompt Context for AI system prompt building
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

export interface SessionContext {
  timeOfDay: TimeOfDay;
  dayOfWeek: string;
  isFirstMessageToday: boolean;
  lastCheckInDaysAgo: number | null;
  conversationTurn: number;
}

export type HealthProvider = 'GARMIN' | 'WHOOP' | 'OURA' | 'FITBIT' | 'APPLE' | 'GOOGLE' | 'UNKNOWN';

export interface HealthMetrics {
  // Provider context
  provider?: HealthProvider;

  // Common metrics
  hrv?: {
    current: number;
    baseline: number;
    trend: 'up' | 'down' | 'stable';
  };
  sleep?: {
    lastNightHours: number;
    quality: 'poor' | 'fair' | 'good' | 'excellent';
    avgWeekHours: number;
    sleepDate?: string; // ISO date of the sleep night
  };
  rhr?: {
    current: number;
    baseline: number;
    trend: 'up' | 'down' | 'stable';
  };
  recovery?: {
    score: number;
    status: 'low' | 'moderate' | 'high';
    label: string; // "Body Battery", "Recovery", "Readiness" depending on provider
  };
  steps?: {
    today: number;
    avgDaily: number;
  };

  // Garmin-specific: Stress (not strain)
  stress?: {
    level: number; // 0-100, lower is calmer
    category: 'rest' | 'low' | 'medium' | 'high';
  };

  // Whoop-specific: Strain
  strain?: {
    score: number;
    weeklyAvg: number;
  };

  // Fitness metrics
  fitnessAge?: number;
  vo2Max?: number; // ml/kg/min - if available
}

export interface DetectedPattern {
  id: string;
  description: string;
  confidence: number;
  lastTriggered: string;
  // Extended fields from correlation engine
  metricA?: string;
  metricB?: string;
  correlationStrength?: number;
  direction?: 'positive' | 'negative';
  timeLagDays?: number;
  sampleSize?: number;
}

// Proactive insight types
export type ProactiveInsightType = 'notable_change' | 'pattern' | 'milestone' | 'concern';
export type ProactiveInsightPriority = 'high' | 'medium' | 'low';
export type InsightMetricType = 'steps' | 'sleep_hours' | 'hrv' | 'rhr' | 'recovery';

export interface ProactiveInsight {
  id: string;
  userId: string;
  message: string;
  type: ProactiveInsightType;
  priority: ProactiveInsightPriority;
  dataContext?: Record<string, unknown>;
  createdAt: string;
  read: boolean;
  // New fields for deduplication and dual comparison
  metricType?: InsightMetricType;
  metricDate?: string; // ISO date string (YYYY-MM-DD)
  todayValue?: number;
  yesterdayValue?: number;
  baseline7day?: number;
  updatedAt?: string;
}

export interface PromptContext {
  userProfile: UserProfile;
  session: SessionContext;
  healthMetrics?: HealthMetrics;
  detectedPatterns?: DetectedPattern[];
  recentTopics?: string[];
}

// ============================================
// Rewards & Proof System Types
// ============================================

export type ReputationTier = 'starter' | 'verified' | 'trusted' | 'elite';

export interface UserRewards {
  userId: string;
  hpBalance: number;
  lifetimeEarned: number;
  reputationScore: number;
  reputationTier: ReputationTier;
}

export type HPTransactionType = 'earn_behavior' | 'earn_sharing' | 'redeem' | 'bonus';

export interface HPTransaction {
  id: string;
  userId: string;
  amount: number;
  type: HPTransactionType;
  description: string;
  referenceId?: string;
  createdAt: string;
}

export type RequirementType = 'steps_avg' | 'sleep_avg' | 'recovery_avg' | 'hrv_avg' | 'rhr_avg';

export interface ProofOpportunity {
  id: string;
  title: string;
  description: string;
  partnerName: string;
  partnerLogo?: string;
  hpReward: number;
  requirementType: RequirementType;
  requirementThreshold: number;
  requirementDays: number;
  expiresAt?: string;
  isActive: boolean;
  maxClaims?: number;
  currentClaims?: number;
}

export type ProofStatus = 'pending' | 'verified' | 'claimed' | 'failed';

export interface UserProof {
  id: string;
  userId: string;
  opportunityId: string;
  status: ProofStatus;
  proofHash?: string;
  verifiedAt?: string;
  hpAwarded?: number;
  createdAt: string;
}

export interface DailyRewardClaim {
  id: string;
  userId: string;
  claimDate: string;
  rewardType: 'steps' | 'sleep' | 'recovery';
  hpAwarded: number;
  createdAt: string;
}
