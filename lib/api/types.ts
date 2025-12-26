export interface Artist {
  id: number;
  name: string;
  picture?: string;
  type?: string;
  artistTypes?: string[];
}

export interface Album {
  id: number;
  title: string;
  numberOfTracks?: number;
  releaseDate?: string;
  artist?: Artist;
  artists?: Artist[];
  type?: string;
  explicit?: boolean;
  cover?: string; // UUID for cover image
  imageCover?: string[]; // Alternative cover field
  mediaMetadata?: {
    tags?: string[];
  };
}

export interface Track {
  id: number;
  title: string;
  duration: number;
  trackNumber?: number;
  version?: string;
  explicit?: boolean;
  explicitLyrics?: boolean;
  audioQuality?: string;
  popularity?: number;
  streamStartDate?: string;
  artist?: Artist;
  artists?: Artist[];
  album?: Album;
  mediaMetadata?: {
    tags?: string[];
  };
}

export interface Playlist {
  id: string;
  uuid?: string;
  title: string;
  numberOfTracks?: number;
  description?: string;
  creator?: string;
  explicit?: boolean;
  explicitLyrics?: boolean;
}

export interface SearchResponse<T> {
  items: T[];
  limit: number;
  offset: number;
  totalNumberOfItems: number;
}

export interface TrackInfo {
  manifest: string;
}

export interface TrackLookup {
  track: Track;
  info: TrackInfo;
  originalTrackUrl?: string;
}

export interface AlbumResponse {
  album: Album;
  tracks: Track[];
}

export interface PlaylistResponse {
  playlist: Playlist;
  tracks: Track[];
}

export interface ArtistResponse {
  id: number;
  name: string;
  picture?: string;
  type?: string;
  albums: Album[];
  eps: Album[];
  tracks: Track[];
}

export interface CacheStats {
  total: number;
  byType: Record<string, number>;
  streamUrls?: number;
}

export interface APISettings {
  getInstances: () => Promise<string[]>;
}
