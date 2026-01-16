import { UserProfile, ReputationLevel, REPUTATION_THRESHOLDS } from '@/types';

// Re-export for convenience
export { REPUTATION_THRESHOLDS };

// ============ Health Score Calculation ============
// 0-100 scale based on:
// - Wearable data (40%): connected data sources
// - Self-reported (30%): check-in frequency
// - Consistency (20%): streak
// - Coverage (10%): health areas tracked

const WEARABLE_SOURCES = [
  'apple-health', 'google-fit', 'oura', 'whoop', 'garmin', 'fitbit'
] as const;

export function calculateHealthScore(profile: UserProfile): number {
  // Wearable score (40%) - based on connected data sources
  const connectedWearables = profile.dataSources.filter(s =>
    WEARABLE_SOURCES.includes(s as typeof WEARABLE_SOURCES[number])
  );
  // Max out at 3 wearables connected
  const wearableScore = Math.min(100, (connectedWearables.length / 3) * 100);

  // Self-reported score (30%) - based on check-in history
  // Start with base 20 for completing onboarding
  const baseScore = profile.onboardingCompleted ? 20 : 0;
  // Add up to 80 based on recent check-ins (streak)
  const checkInBonus = Math.min(80, profile.checkInStreak * 10);
  const selfReportedScore = baseScore + checkInBonus;

  // Consistency score (20%) - streak-based
  // Max out at 20 days streak
  const consistencyScore = Math.min(100, (profile.checkInStreak / 20) * 100);

  // Coverage score (10%) - health areas being tracked
  // Max out at 5 health areas
  const coverageScore = Math.min(100, (profile.healthAreas.length / 5) * 100);

  // Weighted calculation
  const overall = Math.round(
    wearableScore * 0.4 +
    selfReportedScore * 0.3 +
    consistencyScore * 0.2 +
    coverageScore * 0.1
  );

  // Ensure within bounds
  return Math.max(0, Math.min(100, overall));
}

// Get color for health score display
export function getHealthScoreColor(score: number): string {
  if (score >= 80) return '#22C55E'; // bright green
  if (score >= 60) return '#4ADE80'; // green
  if (score >= 40) return '#FACC15'; // yellow
  return '#EF4444'; // red
}

// Get label for health score
export function getHealthScoreLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Getting Started';
}

// ============ Reputation Score Calculation ============
// Based on:
// - Consistency (30%): days checked in
// - Verification depth (25%): wearables connected vs self-report only
// - Data completeness (20%): profile completeness
// - History length (15%): days since joined
// - Cross-validation (10%): health areas tracking

export function calculateReputationPoints(profile: UserProfile): number {
  // Calculate days since creation
  const daysSinceCreation = Math.floor(
    (Date.now() - new Date(profile.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  // Consistency: check-in streak (max 30 points)
  const consistencyPoints = Math.min(30, profile.checkInStreak);

  // Verification: connected data sources (max 25 points)
  const verificationPoints = Math.min(25, profile.dataSources.length * 5);

  // Completeness: profile fields filled (max 20 points)
  let completenessPoints = 0;
  if (profile.name) completenessPoints += 4;
  if (profile.priorities.length > 0) completenessPoints += 4;
  if (profile.coachingStyle) completenessPoints += 4;
  if (profile.healthAreas.length > 0) completenessPoints += 4;
  if (profile.dataSources.length > 0) completenessPoints += 4;

  // History: days on platform (max 15 points, 1 point per week up to 15 weeks)
  const historyPoints = Math.min(15, Math.floor(daysSinceCreation / 7));

  // Cross-validation: health areas (max 10 points)
  const crossValidationPoints = Math.min(10, profile.healthAreas.length * 2);

  return consistencyPoints + verificationPoints + completenessPoints + historyPoints + crossValidationPoints;
}

export function calculateReputationLevel(points: number): ReputationLevel {
  if (points >= REPUTATION_THRESHOLDS.expert) return 'expert';
  if (points >= REPUTATION_THRESHOLDS.verified) return 'verified';
  if (points >= REPUTATION_THRESHOLDS.trusted) return 'trusted';
  if (points >= REPUTATION_THRESHOLDS.regular) return 'regular';
  return 'starter';
}

export function getNextReputationLevel(currentLevel: ReputationLevel): ReputationLevel | null {
  const levels: ReputationLevel[] = ['starter', 'regular', 'trusted', 'verified', 'expert'];
  const currentIndex = levels.indexOf(currentLevel);
  if (currentIndex < levels.length - 1) {
    return levels[currentIndex + 1];
  }
  return null;
}

export function getPointsToNextLevel(currentPoints: number, currentLevel: ReputationLevel): number {
  const nextLevel = getNextReputationLevel(currentLevel);
  if (!nextLevel) return 0;
  return REPUTATION_THRESHOLDS[nextLevel] - currentPoints;
}

export function getReputationLevelLabel(level: ReputationLevel): string {
  const labels: Record<ReputationLevel, string> = {
    starter: 'Starter',
    regular: 'Regular',
    trusted: 'Trusted',
    verified: 'Verified',
    expert: 'Expert',
  };
  return labels[level];
}

// ============ Points System Constants ============

export const POINTS_CONFIG = {
  CHECK_IN: 10,
  LOG_DATA: 5,
  HIT_GOAL: 20,
  STREAK_BONUS: 5, // per day after day 3
  CONNECT_SOURCE: 50,
  COMPLETE_ONBOARDING: 100,
} as const;

// Calculate streak bonus
export function calculateStreakBonus(streak: number): number {
  if (streak <= 3) return 0;
  return (streak - 3) * POINTS_CONFIG.STREAK_BONUS;
}
