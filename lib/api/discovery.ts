import staticInstances from "@/instances.json";

const UPTIME_URLS = [
  "https://tidal-uptime.jiffy-puffs-1j.workers.dev/",
  "https://tidal-uptime.props-76styles.workers.dev/",
];

let cachedInstances: string[] | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 1000 * 60 * 10;

const EXCLUDED_PATTERNS = ["spotisaver.net", "spotify-downloader", "spotdl"];

function isValidInstance(url: string): boolean {
  const lower = url.toLowerCase();
  return !EXCLUDED_PATTERNS.some((pattern) => lower.includes(pattern));
}

function extractInstances(data: unknown): string[] | null {
  if (!data || typeof data !== "object") return null;
  const obj = data as { api?: unknown };
  if (!obj.api || !Array.isArray(obj.api)) return null;

  const instances: string[] = [];
  for (const item of obj.api) {
    const url = typeof item === "string" ? item : (item as { url?: string })?.url;
    if (url && isValidInstance(url)) {
      instances.push(url);
    }
  }
  return instances.length > 0 ? instances : null;
}

export async function getLiveInstances(): Promise<string[]> {
  if (cachedInstances && Date.now() - lastFetchTime < CACHE_TTL) {
    return cachedInstances;
  }

  const fetchPromises = UPTIME_URLS.map(async (url) => {
    try {
      const res = await fetch(url, {
        next: { revalidate: 600 },
        headers: { "User-Agent": "SideA/1.0" },
      });

      if (!res.ok) return null;
      const data = await res.json();
      return extractInstances(data);
    } catch {
      return null;
    }
  });

  try {
    const results = await Promise.all(fetchPromises);
    const validResult = results.find((r): r is string[] => r !== null && r.length > 0);

    if (validResult) {
      cachedInstances = validResult;
      lastFetchTime = Date.now();
      return validResult;
    }
  } catch {
    console.warn("[Discovery] All uptime endpoints failed");
  }

  return staticInstances as string[];
}

export function clearInstanceCache(): void {
  cachedInstances = null;
  lastFetchTime = 0;
}

export function getCachedInstances(): string[] | null {
  return cachedInstances;
}