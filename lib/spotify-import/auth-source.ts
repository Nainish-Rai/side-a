import type { ImportedPlaylist, ImportedPlaylistTrack, PlaylistImportSource } from "@/lib/playlist-import/types";
import { getSpotifyAccessTokenForUser } from "@/lib/spotify-import/account";

const SPOTIFY_API_BASE_URL = "https://api.spotify.com/v1";
const PLAYLIST_PAGE_SIZE = 100;
const USER_PLAYLIST_PAGE_SIZE = 50;

export interface SpotifyImportablePlaylist {
  id: string;
  name: string;
  description: string | null;
  ownerName: string;
  trackCount: number;
  thumbnailUrl: string | null;
}

interface SpotifyPlaylistOwner {
  display_name?: string | null;
}

interface SpotifyPlaylistImage {
  url: string;
}

interface SpotifyPlaylistSummaryResponse {
  id: string;
  name: string;
  description?: string | null;
  owner?: SpotifyPlaylistOwner | null;
  images?: SpotifyPlaylistImage[] | null;
  tracks?: {
    total?: number;
  } | null;
}

interface SpotifyArtistResponse {
  id?: string;
  name: string;
}

interface SpotifyTrackResponse {
  id?: string;
  name?: string;
  duration_ms?: number;
  is_local?: boolean;
  external_ids?: {
    isrc?: string;
  } | null;
  artists?: SpotifyArtistResponse[] | null;
  album?: {
    name?: string | null;
    images?: SpotifyPlaylistImage[] | null;
  } | null;
}

interface SpotifyPlaylistTrackItemResponse {
  track?: SpotifyTrackResponse | null;
}

interface SpotifyPlaylistTracksResponse {
  items?: SpotifyPlaylistTrackItemResponse[];
  total?: number;
  next?: string | null;
}

interface SpotifyUserPlaylistsPageResponse {
  items?: SpotifyPlaylistSummaryResponse[];
  next?: string | null;
}

export class SpotifyPlaylistUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SpotifyPlaylistUnavailableError";
  }
}

async function fetchSpotifyJson<T>(url: string, accessToken: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new SpotifyPlaylistUnavailableError(
      `Spotify request failed with status ${response.status}.`,
    );
  }

  return (await response.json()) as T;
}

function getLargestImageUrl(images: SpotifyPlaylistImage[] | null | undefined): string | null {
  if (!images?.length) return null;
  return images[0]?.url ?? null;
}

function mapSpotifyTrack(track: SpotifyTrackResponse): ImportedPlaylistTrack | null {
  if (!track.id || !track.name) return null;

  const artistName = track.artists?.map((artist) => artist.name).filter(Boolean).join(", ") || "";
  if (!artistName) return null;

  return {
    sourceId: track.id,
    title: track.name,
    artistName,
    albumName: track.album?.name ?? null,
    durationSeconds: typeof track.duration_ms === "number" ? Math.round(track.duration_ms / 1000) : null,
    thumbnailUrl: getLargestImageUrl(track.album?.images),
    isrc: track.external_ids?.isrc ?? null,
  };
}

async function fetchSpotifyPlaylistSummary(
  playlistId: string,
  accessToken: string,
): Promise<SpotifyPlaylistSummaryResponse> {
  const url =
    `${SPOTIFY_API_BASE_URL}/playlists/${playlistId}` +
    "?fields=id,name,description,owner(display_name),images(url),tracks(total)";
  return fetchSpotifyJson<SpotifyPlaylistSummaryResponse>(url, accessToken);
}

async function fetchSpotifyPlaylistTracks(
  playlistId: string,
  accessToken: string,
): Promise<ImportedPlaylistTrack[]> {
  const tracks: ImportedPlaylistTrack[] = [];
  let offset = 0;

  while (true) {
    const url =
      `${SPOTIFY_API_BASE_URL}/playlists/${playlistId}/tracks` +
      `?limit=${PLAYLIST_PAGE_SIZE}&offset=${offset}` +
      "&fields=items(track(id,name,duration_ms,is_local,external_ids(isrc),artists(id,name),album(name,images(url)))),total,next";
    const page = await fetchSpotifyJson<SpotifyPlaylistTracksResponse>(url, accessToken);

    for (const item of page.items ?? []) {
      if (!item.track || item.track.is_local) continue;
      const mappedTrack = mapSpotifyTrack(item.track);
      if (mappedTrack) {
        tracks.push(mappedTrack);
      }
    }

    if (!page.next) {
      return tracks;
    }

    offset += PLAYLIST_PAGE_SIZE;
  }
}

export async function listSpotifyImportablePlaylistsForUser(
  userId: string,
): Promise<SpotifyImportablePlaylist[]> {
  const accessToken = await getSpotifyAccessTokenForUser(userId);
  const playlists: SpotifyImportablePlaylist[] = [];
  let nextUrl: string | null = `${SPOTIFY_API_BASE_URL}/me/playlists?limit=${USER_PLAYLIST_PAGE_SIZE}&offset=0`;

  while (nextUrl) {
    const page: SpotifyUserPlaylistsPageResponse = await fetchSpotifyJson<SpotifyUserPlaylistsPageResponse>(
      nextUrl,
      accessToken,
    );

    for (const playlist of page.items ?? []) {
      if (!playlist.id || !playlist.name) continue;

      playlists.push({
        id: playlist.id,
        name: playlist.name,
        description: playlist.description ?? null,
        ownerName: playlist.owner?.display_name ?? "Spotify",
        trackCount: playlist.tracks?.total ?? 0,
        thumbnailUrl: getLargestImageUrl(playlist.images),
      });
    }

    nextUrl = page.next ?? null;
  }

  return playlists;
}

export class SpotifyAuthorizedPlaylistSource implements PlaylistImportSource {
  constructor(private readonly userId: string) {}

  async importPlaylist(playlistId: string): Promise<ImportedPlaylist> {
    const accessToken = await getSpotifyAccessTokenForUser(this.userId);
    const [playlist, tracks] = await Promise.all([
      fetchSpotifyPlaylistSummary(playlistId, accessToken),
      fetchSpotifyPlaylistTracks(playlistId, accessToken),
    ]);

    if (tracks.length === 0) {
      throw new SpotifyPlaylistUnavailableError("Spotify playlist is empty or unavailable.");
    }

    return {
      sourceId: playlist.id,
      title: playlist.name,
      creatorName: playlist.owner?.display_name ?? "Spotify",
      thumbnailUrl: getLargestImageUrl(playlist.images),
      trackCount: playlist.tracks?.total ?? tracks.length,
      tracks,
    };
  }
}
