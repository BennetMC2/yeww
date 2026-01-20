/**
 * Simple in-memory cache for health metrics
 * Prevents redundant database queries within the same request cycle
 * TTL: 60 seconds (suitable for serverless function lifetime)
 */

import { HealthMetrics } from '@/types';

interface CacheEntry {
  data: HealthMetrics | null;
  timestamp: number;
}

// In-memory cache (reset on cold start in serverless)
const cache = new Map<string, CacheEntry>();

// Cache TTL in milliseconds
const CACHE_TTL_MS = 60_000; // 60 seconds

/**
 * Get cached metrics for a user
 * Returns null if cache miss or expired
 */
export function getCachedMetrics(userId: string): HealthMetrics | null | undefined {
  const entry = cache.get(userId);

  if (!entry) {
    return undefined; // Cache miss
  }

  const age = Date.now() - entry.timestamp;
  if (age > CACHE_TTL_MS) {
    cache.delete(userId);
    return undefined; // Cache expired
  }

  return entry.data; // Cache hit (could be null if user has no data)
}

/**
 * Store metrics in cache
 */
export function setCachedMetrics(userId: string, data: HealthMetrics | null): void {
  cache.set(userId, {
    data,
    timestamp: Date.now(),
  });
}

/**
 * Check if a user's metrics are cached (regardless of value)
 */
export function hasCachedMetrics(userId: string): boolean {
  const entry = cache.get(userId);
  if (!entry) return false;

  const age = Date.now() - entry.timestamp;
  return age <= CACHE_TTL_MS;
}

/**
 * Clear cache for a user (call after data updates)
 */
export function clearCachedMetrics(userId: string): void {
  cache.delete(userId);
}

/**
 * Clear entire cache (for testing/debugging)
 */
export function clearAllCachedMetrics(): void {
  cache.clear();
}
