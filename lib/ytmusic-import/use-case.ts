import type { Track } from "@/lib/api/types";
import { findBestPlayableMatch } from "@/lib/ytmusic-import/matcher";
import { buildTrackSearchQuery } from "@/lib/ytmusic-import/normalize";
import type {
  ImportedPlaylistTrack,
  PlayableTrackSearch,
  PlaylistImportResult,
  PlaylistImportSource,
} from "@/lib/ytmusic-import/types";

const MATCH_CONCURRENCY = 4;

async function mapWithConcurrencyLimit<Input, Output>(
  values: Input[],
  limit: number,
  mapper: (value: Input) => Promise<Output>,
): Promise<Output[]> {
  const results: Output[] = new Array(values.length);
  let nextIndex = 0;

  async function runWorker(): Promise<void> {
    while (nextIndex < values.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await mapper(values[currentIndex]);
    }
  }

  const workers = Array.from({ length: Math.min(limit, values.length) }, () => runWorker());
  await Promise.all(workers);

  return results;
}

async function matchImportedTrack(
  track: ImportedPlaylistTrack,
  playableTrackSearch: PlayableTrackSearch,
): Promise<Track | null> {
  const query = buildTrackSearchQuery(track.title, track.artistName);
  if (!query) return null;

  try {
    const candidateTracks = await playableTrackSearch.searchPlayableTracks(query);
    return findBestPlayableMatch(track, candidateTracks);
  } catch {
    return null;
  }
}

export class ImportPublicYtMusicPlaylist {
  constructor(
    private readonly playlistImportSource: PlaylistImportSource,
    private readonly playableTrackSearch: PlayableTrackSearch,
  ) {}

  async execute(urlPlaylistId: string): Promise<PlaylistImportResult> {
    const importedPlaylist = await this.playlistImportSource.importPlaylist(urlPlaylistId);
    const matchedResults = await mapWithConcurrencyLimit(
      importedPlaylist.tracks,
      MATCH_CONCURRENCY,
      async (track) => ({
        track,
        matchedTrack: await matchImportedTrack(track, this.playableTrackSearch),
      }),
    );

    const matchedTracks = matchedResults
      .map((result) => result.matchedTrack)
      .filter((track): track is Track => track !== null);
    const unmatchedTracks = matchedResults
      .filter((result) => result.matchedTrack === null)
      .map((result) => result.track);

    return {
      playlistName: importedPlaylist.title,
      matchedTracks,
      unmatchedTracks,
      stats: {
        total: importedPlaylist.tracks.length,
        matched: matchedTracks.length,
        unmatched: unmatchedTracks.length,
      },
    };
  }
}
