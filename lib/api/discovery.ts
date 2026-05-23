import staticInstances from "@/instances.json";
import { createTimeoutSignal } from "./utils";

const UPTIME_URLS = [
  "https://tidal-uptime.geeked.wtf",
  "https://tidal-uptime.jiffy-puffs-1j.workers.dev/",
  "https://tidal-uptime.props-76styles.workers.dev/",
];

type InstanceType = "api" | "streaming" | "qobuz";

type InstanceEntry = string | { url?: string; version?: string };

type InstanceGroups = Record<InstanceType, string[]>;

type InstanceHealth = {
  latencyMs?: number;
  failureCount: number;
  lastOkAt?: number;
  lastFailureAt?: number;
};

const FALLBACK_INSTANCES: InstanceGroups = {
  api: [
    "https://hifi.geeked.wtf",
    "https://eu-central.monochrome.tf",
    "https://us-west.monochrome.tf",
    "https://api.monochrome.tf",
    "https://monochrome-api.samidy.com",
    "https://maus.qqdl.site",
    "https://vogel.qqdl.site",
    "https://katze.qqdl.site",
    "https://hund.qqdl.site",
    "https://tidal.kinoplus.online",
    "https://wolf.qqdl.site",
    ...staticInstances,
  ],
  streaming: [
    "https://hifi.geeked.wtf",
    "https://maus.qqdl.site",
    "https://vogel.qqdl.site",
    "https://katze.qqdl.site",
    "https://hund.qqdl.site",
    "https://wolf.qqdl.site",
  ],
  qobuz: [
    "https://qdl-api.monochrome.tf",
    "https://qobuz.kennyy.com.br",
  ],
};

let cachedInstances: InstanceGroups | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 1000 * 60 * 10;
const UNKNOWN_LATENCY_MS = 1_500;
const FAILURE_PENALTY_MS = 2_000;
const RECENT_FAILURE_PENALTY_MS = 3_000;
const RECENT_FAILURE_WINDOW_MS = 30_000;
const LATENCY_SMOOTHING = 0.35;
const instanceHealth = new Map<string, InstanceHealth>();

const EXCLUDED_PATTERNS = ["spotisaver.net", "spotify-downloader", "spotdl", ".squid.wtf"];

function isValidInstance(url: string): boolean {
  const lower = url.toLowerCase();
  return !EXCLUDED_PATTERNS.some((pattern) => lower.includes(pattern));
}

function normalizeEntries(entries: unknown): string[] {
  if (!Array.isArray(entries)) return [];

  const instances: string[] = [];
  for (const item of entries as InstanceEntry[]) {
    const url = typeof item === "string" ? item : item?.url;
    if (url && isValidInstance(url)) {
      instances.push(url);
    }
  }

  return Array.from(new Set(instances));
}

function extractInstances(data: unknown): InstanceGroups | null {
  if (!data || typeof data !== "object") return null;
  const obj = data as { api?: unknown; streaming?: unknown; qobuz?: unknown };

  const api = normalizeEntries(obj.api);
  if (api.length === 0) return null;

  const streaming = normalizeEntries(obj.streaming);
  const qobuz = normalizeEntries(obj.qobuz);

  return {
    api,
    streaming: streaming.length > 0 ? streaming : api,
    qobuz: qobuz.length > 0 ? qobuz : FALLBACK_INSTANCES.qobuz,
  };
}

function getFallbackInstances(): InstanceGroups {
  return {
    api: Array.from(new Set(FALLBACK_INSTANCES.api.filter(isValidInstance))),
    streaming: Array.from(new Set(FALLBACK_INSTANCES.streaming.filter(isValidInstance))),
    qobuz: Array.from(new Set(FALLBACK_INSTANCES.qobuz.filter(isValidInstance))),
  };
}

async function getInstanceGroups(): Promise<InstanceGroups> {
  if (cachedInstances && Date.now() - lastFetchTime < CACHE_TTL) {
    return cachedInstances;
  }

  const fetchPromises = UPTIME_URLS.map(async (url) => {
    const { signal, cleanup } = createTimeoutSignal(3_000);
    try {
      const res = await fetch(url, {
        cache: "no-store",
        headers: { "User-Agent": "SideA/1.0" },
        signal,
      });

      if (!res.ok) return null;
      const data = await res.json();
      return extractInstances(data);
    } catch {
      return null;
    } finally {
      cleanup();
    }
  });

  try {
    const results = await Promise.all(fetchPromises);
    const validResult = results.find(
      (r): r is InstanceGroups => r !== null && r.api.length > 0
    );

    if (validResult) {
      cachedInstances = validResult;
      lastFetchTime = Date.now();
      return validResult;
    }
  } catch {
    console.warn("[Discovery] All uptime endpoints failed");
  }

  const fallbackInstances = getFallbackInstances();
  cachedInstances = fallbackInstances;
  lastFetchTime = Date.now();
  return fallbackInstances;
}

export async function getLiveInstances(type: InstanceType = "api"): Promise<string[]> {
  const groups = await getInstanceGroups();
  return groups[type] || groups.api;
}

export async function getQobuzInstances(): Promise<string[]> {
  return getLiveInstances("qobuz");
}

export function recordInstanceHealth(
  baseUrl: string,
  result: { ok: boolean; latencyMs?: number }
): void {
  const current = instanceHealth.get(baseUrl) || { failureCount: 0 };
  const now = Date.now();

  if (result.ok) {
    const latencyMs =
      result.latencyMs !== undefined
        ? current.latencyMs === undefined
          ? result.latencyMs
          : current.latencyMs * (1 - LATENCY_SMOOTHING) +
            result.latencyMs * LATENCY_SMOOTHING
        : current.latencyMs;

    instanceHealth.set(baseUrl, {
      latencyMs,
      failureCount: Math.max(0, current.failureCount - 1),
      lastOkAt: now,
      lastFailureAt: current.lastFailureAt,
    });
    return;
  }

  instanceHealth.set(baseUrl, {
    ...current,
    failureCount: Math.min(current.failureCount + 1, 5),
    lastFailureAt: now,
  });
}

export function rankInstancesByHealth(instances: string[]): string[] {
  const now = Date.now();

  return [...instances].sort((a, b) => {
    const healthA = instanceHealth.get(a);
    const healthB = instanceHealth.get(b);
    const score = (health?: InstanceHealth) => {
      const recentFailure =
        health?.lastFailureAt &&
        now - health.lastFailureAt < RECENT_FAILURE_WINDOW_MS
          ? RECENT_FAILURE_PENALTY_MS
          : 0;

      return (
        (health?.latencyMs ?? UNKNOWN_LATENCY_MS) +
        (health?.failureCount ?? 0) * FAILURE_PENALTY_MS +
        recentFailure
      );
    };

    return score(healthA) - score(healthB);
  });
}

export function clearInstanceCache(): void {
  cachedInstances = null;
  lastFetchTime = 0;
}

export function getCachedInstances(): InstanceGroups | null {
  return cachedInstances;
}
