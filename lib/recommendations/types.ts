import type { Provider, Track } from "@/lib/api/types";

export interface RecommendationSeed {
  title: string;
  artist: string;
  album?: string;
  duration?: number;
}

export interface RecommendationRequest extends RecommendationSeed {
  provider?: Provider;
  seeds?: RecommendationSeed[];
  perSectionLimit?: number;
  sectionIds?: Array<"up-next" | "similar-tracks" | "related-artists">;
}

export interface RecommendationCandidate {
  sourceId: string;
  title: string;
  artistName: string;
  artistId?: string | null;
  albumName?: string | null;
  durationSeconds?: number | null;
  thumbnailUrl?: string | null;
  score: number;
}

export interface RecommendationSectionCandidate {
  id: "up-next" | "similar-tracks" | "related-artists";
  title: string;
  subtitle?: string;
  reason: "autoplay" | "same-artist" | "artist-hop";
  items: RecommendationCandidate[];
}

export interface RecommendationItem {
  reason: "autoplay" | "same-artist" | "artist-hop";
  score: number;
  source: "ytmusic";
  track: Track;
}

export interface RecommendationSection {
  id: "up-next" | "similar-tracks" | "related-artists";
  title: string;
  subtitle?: string;
  items: RecommendationItem[];
}

export interface RecommendationResponse {
  generatedAt: string;
  cacheHit: boolean;
  sections: RecommendationSection[];
}
