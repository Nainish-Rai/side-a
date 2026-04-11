import type { Track } from "@/lib/api/types";
import type {
  RecommendationRequest,
  RecommendationSection,
} from "@/lib/recommendations/types";

export async function fetchRecommendationSections(
  request: RecommendationRequest,
  signal?: AbortSignal,
): Promise<RecommendationSection[]> {
  const response = await fetch("/api/recommendations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
    signal,
  });

  const payload = (await response.json()) as
    | { sections?: RecommendationSection[]; error?: string }
    | undefined;

  if (!response.ok) {
    throw new Error(payload?.error || "Failed to load recommendations.");
  }

  return payload?.sections ?? [];
}

export function flattenRecommendationTracks(
  sections: RecommendationSection[],
): Track[] {
  const seen = new Set<string>();
  const tracks: Track[] = [];

  for (const section of sections) {
    for (const item of section.items) {
      const key = String(item.track.id);
      if (seen.has(key)) continue;
      seen.add(key);
      tracks.push(item.track);
    }
  }

  return tracks;
}
