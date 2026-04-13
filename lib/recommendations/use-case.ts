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
import { getYoutubeRecommendationSections } from "@/lib/recommendations/youtubei-source";

interface RecommendationSourceMetric {
  seed: string;
  source: "youtubei.js" | "ytmusic-api";
  sectionCount: number;
  candidateCount: number;
  ms: number;
}

const FAST_PATH_SECTION_CANDIDATE_LIMIT = 8;
const ENRICHMENT_SECTION_CANDIDATE_LIMIT = 14;

function formatSeedLabel(seed: RecommendationSeed): string {
  return `${seed.artist} - ${seed.title}`;
}

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

function limitSectionCandidates(
  sections: RecommendationSectionCandidate[],
  perSectionLimit: number,
): RecommendationSectionCandidate[] {
  const maxCandidatesPerSection =
    perSectionLimit <= 10
      ? FAST_PATH_SECTION_CANDIDATE_LIMIT
      : ENRICHMENT_SECTION_CANDIDATE_LIMIT;

  return sections.map((section) => ({
    ...section,
    items: section.items.slice(0, maxCandidatesPerSection),
  }));
}

export class GetTrackRecommendations {
  async execute(
    request: RecommendationRequest,
  ): Promise<RecommendationResponse> {
    const startedAt = performance.now();
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
      console.info("[recommendations] cache-hit", {
        provider,
        perSectionLimit,
        seedCount: seeds.length,
        totalMs: Number((performance.now() - startedAt).toFixed(1)),
      });
      return cached;
    }

    const sourceMetrics: RecommendationSourceMetric[] = [];
    const candidateSectionGroups = await Promise.all(
      seeds.map(async (seed) => {
        const seedStartedAt = performance.now();
        try {
          const sections = await getYoutubeRecommendationSections(seed);
          sourceMetrics.push({
            seed: formatSeedLabel(seed),
            source: "youtubei.js",
            sectionCount: sections.length,
            candidateCount: sections.reduce((sum, section) => sum + section.items.length, 0),
            ms: Number((performance.now() - seedStartedAt).toFixed(1)),
          });
          return sections;
        } catch (error) {
          console.error("youtubei.js recommendation source failed, falling back:", error);
          const sections = await getYtMusicRecommendationSections(seed);
          sourceMetrics.push({
            seed: formatSeedLabel(seed),
            source: "ytmusic-api",
            sectionCount: sections.length,
            candidateCount: sections.reduce((sum, section) => sum + section.items.length, 0),
            ms: Number((performance.now() - seedStartedAt).toFixed(1)),
          });
          return sections;
        }
      }),
    );
    const mergedStartedAt = performance.now();
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
    candidateSections = limitSectionCandidates(candidateSections, perSectionLimit);
    const resolveStartedAt = performance.now();
    const { sections, metrics: resolverMetrics } = await resolveRecommendationSections(
      candidateSections,
      provider,
      perSectionLimit,
    );
    const totalMs = Number((performance.now() - startedAt).toFixed(1));

    const response: RecommendationResponse = {
      generatedAt: new Date().toISOString(),
      cacheHit: false,
      sections,
    };

    setCachedRecommendations(cacheKey, response);
    console.info("[recommendations] built", {
      provider,
      perSectionLimit,
      seedCount: seeds.length,
      mergedSectionCount: candidateSections.length,
      finalSectionCount: sections.length,
      sourceMetrics,
      mergeMs: Number((resolveStartedAt - mergedStartedAt).toFixed(1)),
      resolverMetrics,
      totalMs,
    });
    return response;
  }
}
