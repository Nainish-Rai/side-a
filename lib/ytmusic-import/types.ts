import type { Track } from "@/lib/api/types";

export interface ImportedPlaylistTrack {
  sourceId: string;
  title: string;
  artistName: string;
  albumName: string | null;
  durationSeconds: number | null;
  thumbnailUrl: string | null;
}

export interface EnrichedImportedTrackMetadata {
  source: "musicbrainz";
  title: string;
  artistName: string;
  albumName: string | null;
  durationSeconds: number | null;
  isrc: string | null;
}

export interface ImportedPlaylist {
  sourceId: string;
  title: string;
  creatorName: string;
  thumbnailUrl: string | null;
  trackCount: number;
  tracks: ImportedPlaylistTrack[];
}

export interface PlaylistImportStats {
  total: number;
  matched: number;
  ambiguous: number;
  unmatched: number;
}

export type TrackMatchMethod = "fuzzy" | "title-only" | "isrc";

export type TrackMatchStatus = "matched" | "ambiguous" | "unmatched";

export interface TrackMatchCandidate {
  trackId: number | string;
  title: string;
  artistName: string;
  albumName: string | null;
  durationSeconds: number | null;
  score: number;
  titleScore: number;
  artistScore: number;
  albumScore: number;
  durationDifferenceSeconds: number | null;
}

export interface TrackMatchDiagnostic {
  sourceTrack: ImportedPlaylistTrack;
  queriesTried: string[];
  status: TrackMatchStatus;
  reason:
    | "no-queries"
    | "search-error"
    | "no-candidates"
    | "below-threshold"
    | "ambiguous"
    | "matched";
  method: TrackMatchMethod | null;
  threshold: number | null;
  selectedTrackId: number | string | null;
  candidates: TrackMatchCandidate[];
}

export interface AmbiguousPlaylistTrack {
  sourceTrack: ImportedPlaylistTrack;
  diagnostic: TrackMatchDiagnostic;
}

export interface PlaylistImportResult {
  playlistName: string;
  matchedTracks: Track[];
  ambiguousTracks: AmbiguousPlaylistTrack[];
  unmatchedTracks: ImportedPlaylistTrack[];
  stats: PlaylistImportStats;
  diagnostics: TrackMatchDiagnostic[];
}

export interface PlaylistImportProgressSnapshot {
  total: number;
  completed: number;
  matched: number;
  ambiguous: number;
  unmatched: number;
}

export interface PlaylistImportTrackStartedEvent {
  index: number;
  total: number;
  track: ImportedPlaylistTrack;
  progress: PlaylistImportProgressSnapshot;
}

export interface PlaylistImportTrackCompletedEvent {
  index: number;
  total: number;
  diagnostic: TrackMatchDiagnostic;
  matchedTrack: Track | null;
  progress: PlaylistImportProgressSnapshot;
}

export type PlaylistImportStreamEvent =
  | {
      type: "playlist";
      playlist: ImportedPlaylist;
    }
  | {
      type: "track-started";
      payload: PlaylistImportTrackStartedEvent;
    }
  | {
      type: "track-completed";
      payload: PlaylistImportTrackCompletedEvent;
    }
  | {
      type: "complete";
      result: PlaylistImportResult;
    }
  | {
      type: "error";
      message: string;
    };

export interface PlaylistImportSource {
  importPlaylist(playlistId: string): Promise<ImportedPlaylist>;
}

export interface PlayableTrackSearch {
  searchPlayableTracks(query: string): Promise<Track[]>;
}

export interface TrackMetadataEnricher {
  enrichTrack(track: ImportedPlaylistTrack): Promise<EnrichedImportedTrackMetadata | null>;
}
