import { musicApi } from "@/lib/api";
import type { Provider, Track } from "@/lib/api/types";
import { diagnosePlayableMatch } from "@/lib/playlist-import/matcher";
import { buildTrackSearchQueries } from "@/lib/playlist-import/normalize";
import type { ImportedPlaylistTrack } from "@/lib/playlist-import/types";
import type {
  RecommendationCandidate,
  RecommendationSection,
  RecommendationSectionCandidate,
} from "@/lib/recommendations/types";

const MAX_QUERIES_PER_CANDIDATE = 3;
const SEARCH_RESULT_LIMIT = 15;

function toImportedTrack(
  candidate: RecommendationCandidate,
): ImportedPlaylistTrack {
  return {
    sourceId: candidate.sourceId,
    title: candidate.title,
    artistName: candidate.artistName,
    albumName: candidate.albumName ?? null,
    durationSeconds: candidate.durationSeconds ?? null,
    thumbnailUrl: candidate.thumbnailUrl ?? null,
  };
}

function dedupeTracks(tracks: Track[]): Track[] {
  const seen = new Set<string>();
  const deduped: Track[] = [];

  for (const track of tracks) {
    const key = String(track.id);
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(track);
  }

  return deduped;
}

function normalizeRecommendationKey(track: Track): string {
  const artist =
    track.artist?.name ||
    track.artists?.[0]?.name ||
    "";

  return `${artist}:${track.title}`.trim().toLowerCase();
}

async function resolveCandidate(
  candidate: RecommendationCandidate,
  provider: Provider,
): Promise<Track | null> {
  const importedTrack = toImportedTrack(candidate);
  const queries = buildTrackSearchQueries(importedTrack).slice(
    0,
    MAX_QUERIES_PER_CANDIDATE,
  );
  if (queries.length === 0) return null;

  const allCandidates: Track[] = [];

  for (const query of queries) {
    try {
      const response = await musicApi.searchTracks(query, {
        offset: 0,
        limit: SEARCH_RESULT_LIMIT,
        provider,
      });
      allCandidates.push(...response.items);
    } catch (error) {
      console.error("Recommendation resolver search failed:", error);
    }
  }

  const dedupedCandidates = dedupeTracks(allCandidates);
  if (dedupedCandidates.length === 0) return null;

  const diagnostic = diagnosePlayableMatch(
    importedTrack,
    dedupedCandidates,
    queries,
  );

  if (diagnostic.status !== "matched" || !diagnostic.selectedTrackId) {
    return null;
  }

  return (
    dedupedCandidates.find(
      (track) => String(track.id) === String(diagnostic.selectedTrackId),
    ) ?? null
  );
}

export async function resolveRecommendationSections(
  sections: RecommendationSectionCandidate[],
  provider: Provider,
  perSectionLimit = 4,
): Promise<RecommendationSection[]> {
  const globalSeen = new Set<string>();
  const resolvedSections: RecommendationSection[] = [];

  for (const section of sections) {
    const resolvedItems: RecommendationSection["items"] = [];

    for (const candidate of section.items) {
      if (resolvedItems.length >= perSectionLimit) break;

      const resolvedTrack = await resolveCandidate(candidate, provider);
      if (!resolvedTrack) continue;

      const key = normalizeRecommendationKey(resolvedTrack);
      if (globalSeen.has(key)) continue;

      globalSeen.add(key);
      resolvedItems.push({
        reason: section.reason,
        score: candidate.score,
        source: "ytmusic",
        track: resolvedTrack,
      });
    }

    if (resolvedItems.length > 0) {
      resolvedSections.push({
        id: section.id,
        title: section.title,
        subtitle: section.subtitle,
        items: resolvedItems,
      });
    }
  }

  return resolvedSections;
}
