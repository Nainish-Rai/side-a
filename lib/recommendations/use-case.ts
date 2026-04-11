import type { Provider } from "@/lib/api/types";
import { normalizeArtistName, normalizeTrackTitle } from "@/lib/playlist-import/normalize";
import { getCachedRecommendations, setCachedRecommendations } from "@/lib/recommendations/cache";
import { resolveRecommendationSections } from "@/lib/recommendations/provider-resolver";
import type {
  RecommendationRequest,
  RecommendationSeed,
  RecommendationSectionCandidate,
  RecommendationResponse,
} from "@/lib/recommendations/types";
import { getYtMusicRecommendationSections } from "@/lib/recommendations/ytmusic-source";

function normalizeSeedKey(seed: RecommendationSeed): string {
  return [
    normalizeArtistName(seed.artist),
    normalizeTrackTitle(seed.title),
    normalizeTrackTitle(seed.album ?? ""),
    seed.duration ?? 0,
  ].join("::");
}

function buildCacheKey(
  seeds: RecommendationSeed[],
  provider: Provider,
  perSectionLimit: number,
  sectionIds?: RecommendationRequest["sectionIds"],
) {
  return [
    provider,
    perSectionLimit,
    sectionIds?.join(",") ?? "all",
    ...seeds.map(normalizeSeedKey),
  ].join("::");
}

function mergeCandidateSections(
  sectionGroups: RecommendationSectionCandidate[][],
  multipleSeeds: boolean,
): RecommendationSectionCandidate[] {
  const merged = new Map<
    RecommendationSectionCandidate["id"],
    RecommendationSectionCandidate
  >();

  sectionGroups.forEach((sections, groupIndex) => {
    const groupPenalty = groupIndex * 0.03;

    sections.forEach((section) => {
      const existing = merged.get(section.id);
      const nextItems = section.items.map((item) => ({
        ...item,
        score: Math.max(0, item.score - groupPenalty),
      }));

      if (!existing) {
        merged.set(section.id, {
          ...section,
          items: nextItems,
        });
        return;
      }

      existing.items.push(...nextItems);
     });
  });

  const output = Array.from(merged.values()).map((section) => ({
    ...section,
    items: section.items.sort((left, right) => right.score - left.score),
  }));

  if (!multipleSeeds) {
    return output;
  }

  return output.map((section) => {
    if (section.id === "up-next") {
      return {
        ...section,
        title: "Recommended For You",
        subtitle: "Fresh picks from your recent listens.",
      };
    }

    if (section.id === "similar-tracks") {
      return {
        ...section,
        title: "Because You Played",
        subtitle: "A tighter match based on your recent rotation.",
      };
    }

    return {
      ...section,
      title: "Artist Trail",
      subtitle: "A wider lane built from the artists you recently played.",
    };
  });
}

export class GetTrackRecommendations {
  async execute(
    request: RecommendationRequest,
  ): Promise<RecommendationResponse> {
    const provider = request.provider ?? "tidal";
    const perSectionLimit = request.perSectionLimit ?? 10;
    const seeds = (
      request.seeds?.length
        ? request.seeds
        : [
            {
              title: request.title,
              artist: request.artist,
              album: request.album,
              duration: request.duration,
            },
          ]
    ).slice(0, 5);
    const cacheKey = buildCacheKey(
      seeds,
      provider,
      perSectionLimit,
      request.sectionIds,
    );

    const cached = getCachedRecommendations(cacheKey);
    if (cached) {
      return cached;
    }

    const candidateSectionGroups = await Promise.all(
      seeds.map((seed) => getYtMusicRecommendationSections(seed)),
    );
    let candidateSections = mergeCandidateSections(
      candidateSectionGroups,
      seeds.length > 1,
    );
    if (request.sectionIds?.length) {
      const allowed = new Set(request.sectionIds);
      candidateSections = candidateSections.filter((section) =>
        allowed.has(section.id),
      );
    }
    const sections = await resolveRecommendationSections(
      candidateSections,
      provider,
      perSectionLimit,
    );

    const response: RecommendationResponse = {
      generatedAt: new Date().toISOString(),
      cacheHit: false,
      sections,
    };

    setCachedRecommendations(cacheKey, response);
    return response;
  }
}
