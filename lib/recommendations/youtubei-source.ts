import Innertube, { YTNodes } from "youtubei.js";
import { buildTrackSearchQueries } from "@/lib/playlist-import/normalize";
import type { ImportedPlaylistTrack } from "@/lib/playlist-import/types";
import type {
  RecommendationCandidate,
  RecommendationSeed,
  RecommendationSectionCandidate,
} from "@/lib/recommendations/types";

let youtubeClientPromise: Promise<Innertube> | null = null;

type Message = InstanceType<typeof YTNodes.Message>;
type MusicCarouselShelf = InstanceType<typeof YTNodes.MusicCarouselShelf>;
type MusicResponsiveListItem = InstanceType<
  typeof YTNodes.MusicResponsiveListItem
>;
type MusicShelf = InstanceType<typeof YTNodes.MusicShelf>;
type MusicTwoRowItem = InstanceType<typeof YTNodes.MusicTwoRowItem>;
type PlaylistPanel = InstanceType<typeof YTNodes.PlaylistPanel>;
type PlaylistPanelVideo = InstanceType<typeof YTNodes.PlaylistPanelVideo>;
type SectionList = InstanceType<typeof YTNodes.SectionList>;

const VIDEO_NOISE_PATTERN =
  /\b(official video|music video|lyric video|lyrics|live|visualizer|reaction|cover)\b/i;

function getLargestThumbnailUrl(
  thumbnails:
    | Array<{ url: string; width?: number; height?: number }>
    | undefined,
): string | null {
  if (!thumbnails?.length) return null;

  const [largest] = [...thumbnails].sort((left, right) => {
    const leftArea = (left.width ?? 0) * (left.height ?? 0);
    const rightArea = (right.width ?? 0) * (right.height ?? 0);
    return rightArea - leftArea;
  });

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

function getItemTitle(item: MusicResponsiveListItem | MusicTwoRowItem): string {
  if ("title" in item && typeof item.title === "string") {
    return item.title;
  }

  return item.title?.toString() ?? "";
}

function getItemArtistName(
  item: MusicResponsiveListItem | MusicTwoRowItem,
): string {
  return item.artists?.[0]?.name || item.author?.name || "";
}

function scoreSongSeedMatch(
  request: RecommendationSeed,
  song: MusicResponsiveListItem,
): number {
  const titleScore = calculateDiceCoefficient(
    normalizeForComparison(request.title),
    normalizeForComparison(song.title),
  );
  const artistScore = calculateDiceCoefficient(
    normalizeForComparison(request.artist),
    normalizeForComparison(getItemArtistName(song)),
  );

  const durationDifference =
    request.duration && song.duration?.seconds
      ? Math.abs(request.duration - song.duration.seconds)
      : 10;
  const durationScore = Math.max(0, 1 - durationDifference / 20);

  return titleScore * 0.7 + artistScore * 0.25 + durationScore * 0.05;
}

async function getYoutubeClient(): Promise<Innertube> {
  if (!youtubeClientPromise) {
    youtubeClientPromise = Innertube.create();
  }

  return youtubeClientPromise;
}

async function findSeedSong(
  request: RecommendationSeed,
): Promise<MusicResponsiveListItem | null> {
  const client = await getYoutubeClient();
  const queries = buildTrackSearchQueries(getSeedTrack(request)).slice(0, 3);
  const candidates = new Map<string, MusicResponsiveListItem>();

  for (const query of queries) {
    try {
      const search = await client.music.search(query, { type: "song" });
      const songs = search.songs?.contents ?? [];

      for (const song of songs.slice(0, 5)) {
        if (song.item_type !== "song" || !song.id || !song.title) continue;
        if (!isCleanRecommendationTitle(song.title)) continue;
        candidates.set(song.id, song);
      }
    } catch (error) {
      console.error("youtubei.js seed search failed:", error);
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

function mapResponsiveItemCandidate(
  item: MusicResponsiveListItem,
  score: number,
): RecommendationCandidate | null {
  if (!item.id || !item.title) return null;

  return {
    sourceId: item.id,
    title: item.title,
    artistName: getItemArtistName(item),
    artistId: item.artists?.[0]?.channel_id,
    albumName: item.album?.name ?? null,
    durationSeconds: item.duration?.seconds ?? null,
    thumbnailUrl: getLargestThumbnailUrl(item.thumbnails),
    score,
  };
}

function mapTwoRowItemCandidate(
  item: MusicTwoRowItem,
  score: number,
): RecommendationCandidate | null {
  if (!item.id) return null;

  return {
    sourceId: item.id,
    title: item.title.toString(),
    artistName: getItemArtistName(item),
    artistId: item.artists?.[0]?.channel_id,
    durationSeconds: null,
    thumbnailUrl: getLargestThumbnailUrl(item.thumbnail),
    score,
  };
}

function mapPlaylistPanelCandidate(
  item: PlaylistPanelVideo,
  score: number,
): RecommendationCandidate {
  return {
    sourceId: item.video_id,
    title: item.title.toString(),
    artistName: item.artists?.[0]?.name || item.author || "",
    artistId: item.artists?.[0]?.channel_id,
    albumName: item.album?.name ?? null,
    durationSeconds: item.duration?.seconds ?? null,
    thumbnailUrl: getLargestThumbnailUrl(item.thumbnail),
    score,
  };
}

function extractUpNextCandidates(
  playlistPanel: PlaylistPanel,
  excludedIds: Set<string>,
): RecommendationCandidate[] {
  return playlistPanel.contents
    .filter(
      (item): item is PlaylistPanelVideo =>
        "video_id" in item && typeof item.video_id === "string",
    )
    .filter((item) => item.video_id && !excludedIds.has(item.video_id))
    .filter((item) => isCleanRecommendationTitle(item.title.toString()))
    .map((item, index) =>
      mapPlaylistPanelCandidate(item, Math.max(0.45, 1 - index * 0.08)),
    );
}

function extractShelfSongCandidates(
  shelf: MusicShelf | MusicCarouselShelf,
  baseScore: number,
  excludedIds: Set<string>,
): RecommendationCandidate[] {
  return shelf.contents
    .map((item, index) => {
      if ("item_type" in item && item.item_type === "song") {
        return mapResponsiveItemCandidate(
          item as MusicResponsiveListItem,
          Math.max(0.35, baseScore - index * 0.06),
        );
      }

      if ("title" in item && "id" in item && item.id) {
        return mapTwoRowItemCandidate(
          item as MusicTwoRowItem,
          Math.max(0.35, baseScore - index * 0.06),
        );
      }

      return null;
    })
    .filter((candidate): candidate is RecommendationCandidate => Boolean(candidate))
    .filter((candidate) => {
      if (excludedIds.has(candidate.sourceId)) return false;
      return isCleanRecommendationTitle(candidate.title);
    });
}

function getShelfTitle(shelf: MusicShelf | MusicCarouselShelf): string {
  if ("title" in shelf && shelf.title) {
    return shelf.title.toString();
  }

  if ("header" in shelf) {
    return shelf.header?.title?.toString() ?? "";
  }

  return "";
}

function extractRelatedSectionCandidates(
  related: SectionList | Message,
  excludedIds: Set<string>,
): RecommendationCandidate[] {
  if ("text" in related) {
    return [];
  }

  const shelves = related.contents.filter(
    (item): item is MusicShelf | MusicCarouselShelf =>
      item.type === "MusicShelf" || item.type === "MusicCarouselShelf",
  );

  const rankedShelves = shelves
    .map((shelf) => ({
      shelf,
      title: normalizeForComparison(getShelfTitle(shelf)),
    }))
    .filter(({ title }) => title.length > 0)
    .sort((left, right) => {
      const leftBoost = left.title.includes("related") ? 1 : 0;
      const rightBoost = right.title.includes("related") ? 1 : 0;
      return rightBoost - leftBoost;
    });

  const candidates: RecommendationCandidate[] = [];

  for (const { shelf } of rankedShelves) {
    candidates.push(...extractShelfSongCandidates(shelf, 0.65, excludedIds));
    if (candidates.length >= 12) break;
  }

  return candidates.slice(0, 12);
}

async function buildSameArtistCandidates(
  artistId: string | undefined,
  excludedIds: Set<string>,
): Promise<RecommendationCandidate[]> {
  if (!artistId) return [];

  try {
    const client = await getYoutubeClient();
    const artist = await client.music.getArtist(artistId);
    const primaryShelf = artist.sections.find(
      (section): section is MusicShelf =>
        section.type === "MusicShelf" &&
        section.contents.some((item) => "item_type" in item && item.item_type === "song"),
    );

    if (!primaryShelf) return [];
    return extractShelfSongCandidates(primaryShelf, 0.85, excludedIds).slice(0, 6);
  } catch (error) {
    console.error("youtubei.js artist page failed:", error);
    return [];
  }
}

export async function getYoutubeRecommendationSections(
  request: RecommendationSeed,
): Promise<RecommendationSectionCandidate[]> {
  const client = await getYoutubeClient();
  const seedSong = await findSeedSong(request);
  if (!seedSong?.id) return [];

  const excludedIds = new Set<string>([seedSong.id]);
  const [upNextPanel, related, sameArtistItems] = await Promise.all([
    client.music.getUpNext(seedSong.id).catch((error) => {
      console.error("youtubei.js up next failed:", error);
      return null;
    }),
    client.music.getRelated(seedSong.id).catch((error) => {
      console.error("youtubei.js related failed:", error);
      return null;
    }),
    buildSameArtistCandidates(seedSong.artists?.[0]?.channel_id, excludedIds),
  ]);

  const upNextItems = upNextPanel
    ? extractUpNextCandidates(upNextPanel, excludedIds).slice(0, 30)
    : [];
  upNextItems.forEach((item) => excludedIds.add(item.sourceId));

  const filteredSameArtistItems = sameArtistItems
    .filter((item) => !excludedIds.has(item.sourceId))
    .slice(0, 30);
  filteredSameArtistItems.forEach((item) => excludedIds.add(item.sourceId));

  const relatedArtistItems = related
    ? extractRelatedSectionCandidates(related, excludedIds).slice(0, 30)
    : [];

  const sections: RecommendationSectionCandidate[] = [];

  if (upNextItems.length > 0) {
    sections.push({
      id: "up-next",
      title: "Up Next",
      subtitle: "A continuation from what is playing now.",
      reason: "autoplay",
      items: upNextItems,
    });
  }

  if (filteredSameArtistItems.length > 0) {
    sections.push({
      id: "similar-tracks",
      title: "More Like This",
      subtitle: "Tracks that stay close to the current sound.",
      reason: "same-artist",
      items: filteredSameArtistItems,
    });
  }

  if (relatedArtistItems.length > 0) {
    sections.push({
      id: "related-artists",
      title: "From Related Artists",
      subtitle: "A wider step into nearby artists.",
      reason: "artist-hop",
      items: relatedArtistItems,
    });
  }

  return sections;
}
