import { api } from "@/lib/api";
import type { Track, UserPlaylist } from "@/lib/api/types";

export function getPlaylistCoverUrl(playlist: UserPlaylist): string | null {
  const firstTrack = playlist.tracks[0];
  const coverId = firstTrack?.album?.cover || firstTrack?.album?.id;
  return coverId ? api.getCoverUrl(coverId, "160") : null;
}

export function getPlaylistDuration(playlist: UserPlaylist): number {
  return playlist.tracks.reduce((total, track) => total + (track.duration || 0), 0);
}

export function dedupeTracksById(tracks: Track[]): Track[] {
  const seen = new Set<number>();
  const result: Track[] = [];

  for (const track of tracks) {
    if (seen.has(track.id)) continue;
    seen.add(track.id);
    result.push(track);
  }

  return result;
}
