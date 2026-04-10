import type { Track } from "@/lib/api/types";
import {
  diagnosePlayableMatch,
  diagnosePlayableMatchWithIsrc,
} from "@/lib/playlist-import/matcher";
import { buildTrackSearchQueries } from "@/lib/playlist-import/normalize";
import type {
  AmbiguousPlaylistTrack,
  EnrichedImportedTrackMetadata,
  ImportedPlaylist,
  ImportedPlaylistTrack,
  PlayableTrackSearch,
  PlaylistImportProgressSnapshot,
  PlaylistImportResult,
  PlaylistImportSource,
  PlaylistImportTrackCompletedEvent,
  PlaylistImportTrackStartedEvent,
  TrackMetadataEnricher,
  TrackMatchDiagnostic,
} from "@/lib/playlist-import/types";

const MATCH_CONCURRENCY = 4;

interface MatchImportedTrackResult {
  diagnostic: TrackMatchDiagnostic;
  candidateTracksById: Map<string, Track>;
}

interface ExecuteWithProgressHandlers {
  onPlaylistImported?: (args: { playlist: ImportedPlaylist }) => void;
  onTrackStarted?: (event: PlaylistImportTrackStartedEvent) => void;
  onTrackCompleted?: (event: PlaylistImportTrackCompletedEvent) => void;
}

async function mapWithConcurrencyLimit<Input, Output>(
  values: Input[],
  limit: number,
  mapper: (value: Input, index: number) => Promise<Output>,
): Promise<Output[]> {
  const results: Output[] = new Array(values.length);
  let nextIndex = 0;

  async function runWorker(): Promise<void> {
    while (nextIndex < values.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await mapper(values[currentIndex], currentIndex);
    }
  }

  const workers = Array.from({ length: Math.min(limit, values.length) }, () => runWorker());
  await Promise.all(workers);

  return results;
}

async function matchImportedTrack(
  track: ImportedPlaylistTrack,
  playableTrackSearch: PlayableTrackSearch,
  trackMetadataEnricher: TrackMetadataEnricher | null,
): Promise<MatchImportedTrackResult> {
  const queries = buildTrackSearchQueries(track);
  if (queries.length === 0) {
    return {
      diagnostic: {
        sourceTrack: track,
        queriesTried: [],
        status: "unmatched",
        reason: "no-queries",
        method: null,
        threshold: null,
        selectedTrackId: null,
        candidates: [],
      },
      candidateTracksById: new Map(),
    };
  }

  try {
    const candidateTracksById = new Map<string, Track>();

    await collectPlayableTrackCandidates(queries, playableTrackSearch, candidateTracksById);

    const initialDiagnostic = track.isrc
      ? diagnosePlayableMatchWithIsrc(
          track,
          Array.from(candidateTracksById.values()),
          queries,
          track.isrc,
        )
      : diagnosePlayableMatch(track, Array.from(candidateTracksById.values()), queries);

    if (initialDiagnostic.status === "matched" || !trackMetadataEnricher) {
      return {
        diagnostic: initialDiagnostic,
        candidateTracksById,
      };
    }

    try {
      const enrichedTrackMetadata = await trackMetadataEnricher.enrichTrack(track);
      if (!enrichedTrackMetadata) {
        return {
          diagnostic: initialDiagnostic,
          candidateTracksById,
        };
      }

      const enrichedTrack = applyTrackEnrichment(track, enrichedTrackMetadata);
      const enrichedQueries = buildTrackSearchQueries(enrichedTrack).filter(
        (query) => !queries.includes(query),
      );

      await collectPlayableTrackCandidates(
        enrichedQueries,
        playableTrackSearch,
        candidateTracksById,
      );

      const allQueries = [...queries, ...enrichedQueries];
      const enrichedDiagnostic = patchDiagnosticSourceTrack(
        enrichedTrackMetadata.isrc
          ? diagnosePlayableMatchWithIsrc(
              enrichedTrack,
              Array.from(candidateTracksById.values()),
              allQueries,
              enrichedTrackMetadata.isrc,
            )
          : diagnosePlayableMatch(
              enrichedTrack,
              Array.from(candidateTracksById.values()),
              allQueries,
            ),
        track,
      );

      return {
        diagnostic: selectPreferredDiagnostic(initialDiagnostic, enrichedDiagnostic),
        candidateTracksById,
      };
    } catch {
      return {
        diagnostic: initialDiagnostic,
        candidateTracksById,
      };
    }
  } catch {
    return {
      diagnostic: {
        sourceTrack: track,
        queriesTried: queries,
        status: "unmatched",
        reason: "search-error",
        method: null,
        threshold: null,
        selectedTrackId: null,
        candidates: [],
      },
      candidateTracksById: new Map(),
    };
  }
}

export class ImportPlaylistUseCase {
  constructor(
    private readonly playlistImportSource: PlaylistImportSource,
    private readonly playableTrackSearch: PlayableTrackSearch,
    private readonly trackMetadataEnricher: TrackMetadataEnricher | null = null,
  ) {}

  async execute(
    playlistId: string,
    handlers?: ExecuteWithProgressHandlers,
  ): Promise<PlaylistImportResult> {
    const importedPlaylist = await this.playlistImportSource.importPlaylist(playlistId);
    handlers?.onPlaylistImported?.({ playlist: importedPlaylist });

    const progress = createProgressSnapshot(importedPlaylist.tracks.length);
    const matchResults = await mapWithConcurrencyLimit(
      importedPlaylist.tracks,
      MATCH_CONCURRENCY,
      async (track, index) => {
        handlers?.onTrackStarted?.({
          index,
          total: importedPlaylist.tracks.length,
          track,
          progress: { ...progress },
        });

        const result = await matchImportedTrack(
          track,
          this.playableTrackSearch,
          this.trackMetadataEnricher,
        );
        const matchedTrack = resolveMatchedTrack(result);

        progress.completed += 1;
        if (result.diagnostic.status === "matched") {
          progress.matched += 1;
        } else if (result.diagnostic.status === "ambiguous") {
          progress.ambiguous += 1;
        } else {
          progress.unmatched += 1;
        }

        handlers?.onTrackCompleted?.({
          index,
          total: importedPlaylist.tracks.length,
          diagnostic: result.diagnostic,
          matchedTrack,
          progress: { ...progress },
        });

        return {
          ...result,
          index,
        };
      },
    );
    const diagnostics = matchResults.map((result) => result.diagnostic);

    const matchedTracks = matchResults
      .map((result) => {
        if (result.diagnostic.status !== "matched") return null;
        const selectedTrackId = result.diagnostic.selectedTrackId;
        if (selectedTrackId === null) return null;
        return result.candidateTracksById.get(String(selectedTrackId)) ?? null;
      })
      .filter((track): track is Track => track !== null);

    const ambiguousTracks: AmbiguousPlaylistTrack[] = diagnostics
      .filter((diagnostic) => diagnostic.status === "ambiguous")
      .map((diagnostic) => ({
        sourceTrack: diagnostic.sourceTrack,
        diagnostic,
      }));

    const unmatchedTracks = diagnostics
      .filter((diagnostic) => diagnostic.status === "unmatched")
      .map((diagnostic) => diagnostic.sourceTrack);

    return {
      playlistName: importedPlaylist.title,
      matchedTracks,
      ambiguousTracks,
      unmatchedTracks,
      stats: {
        total: importedPlaylist.tracks.length,
        matched: matchedTracks.length,
        ambiguous: ambiguousTracks.length,
        unmatched: unmatchedTracks.length,
      },
      diagnostics,
    };
  }
}

async function collectPlayableTrackCandidates(
  queries: string[],
  playableTrackSearch: PlayableTrackSearch,
  candidateTracksById: Map<string, Track>,
): Promise<void> {
  for (const query of queries) {
    const candidateTracks = await playableTrackSearch.searchPlayableTracks(query);
    for (const candidateTrack of candidateTracks) {
      candidateTracksById.set(String(candidateTrack.id), candidateTrack);
    }
  }
}

function applyTrackEnrichment(
  track: ImportedPlaylistTrack,
  enrichedTrackMetadata: EnrichedImportedTrackMetadata,
): ImportedPlaylistTrack {
  return {
    ...track,
    title: enrichedTrackMetadata.title || track.title,
    artistName: enrichedTrackMetadata.artistName || track.artistName,
    albumName: enrichedTrackMetadata.albumName ?? track.albumName,
    durationSeconds: enrichedTrackMetadata.durationSeconds ?? track.durationSeconds,
    isrc: enrichedTrackMetadata.isrc ?? track.isrc ?? null,
  };
}

function patchDiagnosticSourceTrack(
  diagnostic: TrackMatchDiagnostic,
  sourceTrack: ImportedPlaylistTrack,
): TrackMatchDiagnostic {
  return {
    ...diagnostic,
    sourceTrack,
  };
}

function getDiagnosticPriority(diagnostic: TrackMatchDiagnostic): number {
  switch (diagnostic.status) {
    case "matched":
      return 2;
    case "ambiguous":
      return 1;
    default:
      return 0;
  }
}

function selectPreferredDiagnostic(
  initialDiagnostic: TrackMatchDiagnostic,
  enrichedDiagnostic: TrackMatchDiagnostic,
): TrackMatchDiagnostic {
  const initialPriority = getDiagnosticPriority(initialDiagnostic);
  const enrichedPriority = getDiagnosticPriority(enrichedDiagnostic);

  if (enrichedPriority > initialPriority) {
    return enrichedDiagnostic;
  }

  if (enrichedPriority < initialPriority) {
    return initialDiagnostic;
  }

  return enrichedDiagnostic;
}

function createProgressSnapshot(total: number): PlaylistImportProgressSnapshot {
  return {
    total,
    completed: 0,
    matched: 0,
    ambiguous: 0,
    unmatched: 0,
  };
}

function resolveMatchedTrack(result: MatchImportedTrackResult): Track | null {
  if (result.diagnostic.status !== "matched") return null;
  const selectedTrackId = result.diagnostic.selectedTrackId;
  if (selectedTrackId === null) return null;
  return result.candidateTracksById.get(String(selectedTrackId)) ?? null;
}
