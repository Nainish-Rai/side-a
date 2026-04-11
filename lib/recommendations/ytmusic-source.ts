import YTMusic, {
  type ArtistDetailed,
  type ArtistFull,
  type SongDetailed,
} from "ytmusic-api";
import { buildTrackSearchQueries } from "@/lib/playlist-import/normalize";
import type { ImportedPlaylistTrack } from "@/lib/playlist-import/types";
import type {
  RecommendationCandidate,
  RecommendationSeed,
  RecommendationSectionCandidate,
} from "@/lib/recommendations/types";

let ytmusicClientPromise: Promise<YTMusic> | null = null;

type UpNextItem = Awaited<ReturnType<YTMusic["getUpNexts"]>>[number];

const VIDEO_NOISE_PATTERN =
  /\b(official video|music video|lyric video|lyrics|live|visualizer|reaction|cover)\b/i;

function getLargestThumbnailUrl(
  thumbnails: { url: string; width: number; height: number }[] | undefined,
): string | null {
  if (!thumbnails?.length) return null;
  const [largest] = [...thumbnails].sort(
    (left, right) => right.width * right.height - left.width * left.height,
  );
  return largest?.url ?? null;
}

function buildBigrams(value: string): string[] {
  if (value.length < 2) return value ? [value] : [];

  const paddedValue = ` ${value} `;
  const bigrams: string[] = [];

  for (let index = 0; index < paddedValue.length - 1; index += 1) {
    bigrams.push(paddedValue.slice(index, index + 2));
  }

  return bigrams;
}

function calculateDiceCoefficient(left: string, right: string): number {
  if (!left && !right) return 1;
  if (!left || !right) return 0;
  if (left === right) return 1;

  const leftBigrams = buildBigrams(left);
  const rightBigrams = buildBigrams(right);
  const rightCounts = new Map<string, number>();

  for (const bigram of rightBigrams) {
    rightCounts.set(bigram, (rightCounts.get(bigram) ?? 0) + 1);
  }

  let matches = 0;
  for (const bigram of leftBigrams) {
    const count = rightCounts.get(bigram) ?? 0;
    if (count === 0) continue;
    rightCounts.set(bigram, count - 1);
    matches += 1;
  }

  return (2 * matches) / (leftBigrams.length + rightBigrams.length);
}

function normalizeForComparison(value: string | null | undefined): string {
  if (!value) return "";

  return value
    .toLowerCase()
    .replace(/[()[\]{}]/g, " ")
    .replace(/['’`]/g, "")
    .replace(/[-–—]/g, " ")
    .replace(/[.,;:!?/\\|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getSeedTrack(request: RecommendationSeed): ImportedPlaylistTrack {
  return {
    sourceId: `${request.artist}:${request.title}`,
    title: request.title,
    artistName: request.artist,
    albumName: request.album ?? null,
    durationSeconds: request.duration ?? null,
    thumbnailUrl: null,
  };
}

function isCleanRecommendationTitle(title: string): boolean {
  return !VIDEO_NOISE_PATTERN.test(title);
}

function scoreSongSeedMatch(
  request: RecommendationSeed,
  song: SongDetailed,
): number {
  const titleScore = calculateDiceCoefficient(
    normalizeForComparison(request.title),
    normalizeForComparison(song.name),
  );
  const artistScore = calculateDiceCoefficient(
    normalizeForComparison(request.artist),
    normalizeForComparison(song.artist.name),
  );

  const durationDifference =
    request.duration && song.duration
      ? Math.abs(request.duration - song.duration)
      : 10;
  const durationScore = Math.max(0, 1 - durationDifference / 20);

  return titleScore * 0.7 + artistScore * 0.25 + durationScore * 0.05;
}

async function getYtMusicClient(): Promise<YTMusic> {
  if (!ytmusicClientPromise) {
    ytmusicClientPromise = (async () => {
      const client = new YTMusic();
      const initializedClient = await client.initialize();
      if (!initializedClient) {
        throw new Error("Failed to initialize YTMusic client.");
      }
      return client;
    })();
  }

  return ytmusicClientPromise;
}

async function findSeedSong(
  request: RecommendationSeed,
): Promise<SongDetailed | null> {
  const client = await getYtMusicClient();
  const queries = buildTrackSearchQueries(getSeedTrack(request)).slice(0, 3);
  const candidates = new Map<string, SongDetailed>();

  for (const query of queries) {
    try {
      const songs = await client.searchSongs(query);
      for (const song of songs.slice(0, 5)) {
        if (!isCleanRecommendationTitle(song.name)) continue;
        candidates.set(song.videoId, song);
      }
    } catch (error) {
      console.error("YTMusic seed search failed:", error);
    }
  }

  const ranked = [...candidates.values()]
    .map((song) => ({
      song,
      score: scoreSongSeedMatch(request, song),
    }))
    .sort((left, right) => right.score - left.score);

  return ranked[0]?.song ?? null;
}

function mapUpNextCandidate(
  item: UpNextItem,
  score: number,
): RecommendationCandidate {
  return {
    sourceId: item.videoId,
    title: item.title,
    artistName: item.artists.name,
    artistId: item.artists.artistId,
    durationSeconds: item.duration,
    thumbnailUrl: getLargestThumbnailUrl(item.thumbnails),
    score,
  };
}

function mapSongCandidate(
  item: SongDetailed,
  score: number,
): RecommendationCandidate {
  return {
    sourceId: item.videoId,
    title: item.name,
    artistName: item.artist.name,
    artistId: item.artist.artistId,
    albumName: item.album?.name ?? null,
    durationSeconds: item.duration ?? null,
    thumbnailUrl: getLargestThumbnailUrl(item.thumbnails),
    score,
  };
}

async function buildRelatedArtistCandidates(
  client: YTMusic,
  artist: ArtistFull,
  excludedIds: Set<string>,
): Promise<RecommendationCandidate[]> {
  const similarArtists = artist.similarArtists
    .filter((candidate): candidate is ArtistDetailed => Boolean(candidate.artistId))
    .slice(0, 3);

  const relatedArtists = await Promise.all(
    similarArtists.map(async (candidate, index) => {
      try {
        const fullArtist = await client.getArtist(candidate.artistId);
        return fullArtist.topSongs
          .slice(0, 2)
          .map((song, songIndex) => ({
            candidate: mapSongCandidate(
              song,
              Math.max(0.4, 0.9 - index * 0.15 - songIndex * 0.05),
            ),
            artistName: candidate.name,
          }));
      } catch (error) {
        console.error("Failed to load related artist recommendations:", error);
        return [];
      }
    }),
  );

  return relatedArtists
    .flat()
    .map((item) => item.candidate)
    .filter((candidate) => {
      if (excludedIds.has(candidate.sourceId)) return false;
      return isCleanRecommendationTitle(candidate.title);
    });
}

export async function getYtMusicRecommendationSections(
  request: RecommendationSeed,
): Promise<RecommendationSectionCandidate[]> {
  const client = await getYtMusicClient();
  const seedSong = await findSeedSong(request);
  if (!seedSong) return [];

  const excludedIds = new Set<string>([seedSong.videoId]);
  const [upNexts, artist] = await Promise.all([
    client.getUpNexts(seedSong.videoId).catch((error) => {
      console.error("Failed to load YTMusic up nexts:", error);
      return [] as UpNextItem[];
    }),
    seedSong.artist.artistId
      ? client.getArtist(seedSong.artist.artistId).catch((error) => {
          console.error("Failed to load YTMusic artist page:", error);
          return null;
        })
      : Promise.resolve(null),
  ]);

  const upNextItems = upNexts
    .filter((item) => item.videoId !== seedSong.videoId)
    .filter((item) => isCleanRecommendationTitle(item.title))
    .map((item, index) => mapUpNextCandidate(item, Math.max(0.45, 1 - index * 0.08)));

  upNextItems.forEach((item) => excludedIds.add(item.sourceId));

  const sameArtistItems =
    artist?.topSongs
      .filter((item) => item.videoId !== seedSong.videoId)
      .filter((item) => !excludedIds.has(item.videoId))
      .filter((item) => isCleanRecommendationTitle(item.name))
      .slice(0, 6)
      .map((item, index) => mapSongCandidate(item, Math.max(0.4, 0.85 - index * 0.07))) ?? [];

  sameArtistItems.forEach((item) => excludedIds.add(item.sourceId));

  const relatedArtistItems = artist
    ? await buildRelatedArtistCandidates(client, artist, excludedIds)
    : [];

  const sections: RecommendationSectionCandidate[] = [];

  if (upNextItems.length > 0) {
    sections.push({
      id: "up-next",
      title: "Up Next",
      subtitle: "A continuation from what is playing now.",
      reason: "autoplay",
      items: upNextItems.slice(0, 30),
    });
  }

  if (sameArtistItems.length > 0) {
    sections.push({
      id: "similar-tracks",
      title: "More Like This",
      subtitle: "Tracks that stay close to the current sound.",
      reason: "same-artist",
      items: sameArtistItems.slice(0, 30),
    });
  }

  if (relatedArtistItems.length > 0) {
    sections.push({
      id: "related-artists",
      title: "From Related Artists",
      subtitle: "A wider step into nearby artists.",
      reason: "artist-hop",
      items: relatedArtistItems.slice(0, 30),
    });
  }

  return sections;
}
