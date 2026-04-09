import type { Track } from "@/lib/api/types";

export interface ImportedPlaylistTrack {
  sourceId: string;
  title: string;
  artistName: string;
  albumName: string | null;
  durationSeconds: number | null;
  thumbnailUrl: string | null;
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
  unmatched: number;
}

export interface PlaylistImportResult {
  playlistName: string;
  matchedTracks: Track[];
  unmatchedTracks: ImportedPlaylistTrack[];
  stats: PlaylistImportStats;
}

export interface PlaylistImportSource {
  importPlaylist(playlistId: string): Promise<ImportedPlaylist>;
}

export interface PlayableTrackSearch {
  searchPlayableTracks(query: string): Promise<Track[]>;
}
