import type { RecommendationResponse } from "@/lib/recommendations/types";

const CACHE_TTL_MS = 1000 * 60 * 20;

interface CacheEntry {
  expiresAt: number;
  value: RecommendationResponse;
}

const recommendationCache = new Map<string, CacheEntry>();

function pruneExpiredEntries(now: number) {
  for (const [key, entry] of recommendationCache.entries()) {
    if (entry.expiresAt <= now) {
      recommendationCache.delete(key);
    }
  }
}

export function getCachedRecommendations(
  key: string,
): RecommendationResponse | null {
  const now = Date.now();
  pruneExpiredEntries(now);

  const entry = recommendationCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= now) {
    recommendationCache.delete(key);
    return null;
  }

  return {
    ...entry.value,
    cacheHit: true,
  };
}

export function setCachedRecommendations(
  key: string,
  value: RecommendationResponse,
): void {
  const now = Date.now();
  pruneExpiredEntries(now);

  recommendationCache.set(key, {
    expiresAt: now + CACHE_TTL_MS,
    value,
  });
}
