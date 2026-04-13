import type { Provider } from "@/lib/api/types";
import type { RecommendationSection, RecommendationSeed } from "@/lib/recommendations/types";

const UI_CACHE_PREFIX = "side-a:recommendations";
const UI_CACHE_TTL_MS = 1000 * 60 * 30;

interface RecommendationUIEntry {
  savedAt: number;
  sections: RecommendationSection[];
}

function normalizeValue(value: string | number | null | undefined): string {
  return String(value ?? "").trim().toLowerCase();
}

function normalizeSeed(seed: RecommendationSeed): string {
  return [
    normalizeValue(seed.artist),
    normalizeValue(seed.title),
    normalizeValue(seed.album),
    normalizeValue(seed.duration),
  ].join("::");
}

function buildStorageKey(scope: "home" | "track", key: string): string {
  return `${UI_CACHE_PREFIX}:${scope}:${key}`;
}

function readStorage(key: string): RecommendationSection[] | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as RecommendationUIEntry;
    if (
      !parsed ||
      typeof parsed !== "object" ||
      !Array.isArray(parsed.sections) ||
      typeof parsed.savedAt !== "number"
    ) {
      window.localStorage.removeItem(key);
      return null;
    }

    if (Date.now() - parsed.savedAt > UI_CACHE_TTL_MS) {
      window.localStorage.removeItem(key);
      return null;
    }

    return parsed.sections;
  } catch {
    return null;
  }
}

function writeStorage(key: string, sections: RecommendationSection[]): void {
  if (typeof window === "undefined") return;

  try {
    const payload: RecommendationUIEntry = {
      savedAt: Date.now(),
      sections,
    };
    window.localStorage.setItem(key, JSON.stringify(payload));
  } catch {
    // Ignore storage failures and keep the in-memory flow working.
  }
}

export function buildHomeRecommendationCacheKey(
  provider: Provider,
  seeds: RecommendationSeed[],
): string {
  return [provider, ...seeds.slice(0, 5).map(normalizeSeed)].join("::");
}

export function buildTrackRecommendationCacheKey(
  provider: Provider,
  seed: RecommendationSeed,
): string {
  return [provider, normalizeSeed(seed)].join("::");
}

export function readHomeRecommendationCache(key: string): RecommendationSection[] | null {
  return readStorage(buildStorageKey("home", key));
}

export function writeHomeRecommendationCache(key: string, sections: RecommendationSection[]): void {
  writeStorage(buildStorageKey("home", key), sections);
  writeStorage(buildStorageKey("home", "latest"), sections);
}

export function readLatestHomeRecommendationCache(): RecommendationSection[] | null {
  return readStorage(buildStorageKey("home", "latest"));
}

export function readTrackRecommendationCache(key: string): RecommendationSection[] | null {
  return readStorage(buildStorageKey("track", key));
}

export function writeTrackRecommendationCache(key: string, sections: RecommendationSection[]): void {
  writeStorage(buildStorageKey("track", key), sections);
}
