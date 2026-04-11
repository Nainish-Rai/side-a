import type { ImportedPlaylistTrack } from "@/lib/playlist-import/types";

const COMPARISON_TITLE_NOISE_PATTERNS = [
  /\((official|audio|video|lyrics?|lyric video|visualizer)\)/gi,
  /\[(official|audio|video|lyrics?|lyric video|visualizer)\]/gi,
  /-+\s*(official|audio|video|lyrics?|lyric video|visualizer)\b.*$/gi,
];

const SEARCH_TITLE_NOISE_PATTERNS = [
  ...COMPARISON_TITLE_NOISE_PATTERNS,
  /\((official music video|official video|music video)\)/gi,
  /\[(official music video|official video|music video)\]/gi,
  /-+\s*(official music video|official video|music video)\b.*$/gi,
  /\|\s*(official|audio|video|lyrics?|lyric video|visualizer|music video)\b.*$/gi,
];

const QUOTE_PATTERN = /[''`]/g;
const BRACKET_PATTERN = /[()[\]{}]/g;
const DASH_PATTERN = /[-–—]/g;
const PUNCTUATION_PATTERN = /[.,;:!?/\\]/g;
const PIPE_PATTERN = /\|/g;
const FEAT_PATTERN = /\bfeat\.?\b/gi;
const FT_PATTERN = /\bft\.?\b/gi;
const WITH_PATTERN = /\bwith\b/gi;
const VS_PATTERN = /\bvs\.?\b/gi;
const X_PATTERN = /\s+x\s+/gi;
const MULTIPLE_WHITESPACE_PATTERN = /\s+/g;

function stripNoise(value: string | null | undefined, patterns: RegExp[]): string {
  const safeValue = value ?? "";
  return patterns.reduce(
    (currentValue, pattern) => currentValue.replace(pattern, " "),
    safeValue,
  );
}

function collapseWhitespace(value: string | null | undefined): string {
  return (value ?? "").replace(MULTIPLE_WHITESPACE_PATTERN, " ").trim();
}

function normalizeForComparison(value: string | null | undefined): string {
  const safeValue = value ?? "";
  return collapseWhitespace(
    safeValue
      .toLowerCase()
      .replace(QUOTE_PATTERN, "")
      .replace(BRACKET_PATTERN, " ")
      .replace(DASH_PATTERN, " ")
      .replace(PUNCTUATION_PATTERN, "")
      .replace(FEAT_PATTERN, " ft ")
      .replace(FT_PATTERN, " ft ")
      .replace(WITH_PATTERN, " ")
      .replace(VS_PATTERN, " vs ")
      .replace(X_PATTERN, " "),
  );
}

function normalizeForSearch(value: string | null | undefined): string {
  const safeValue = value ?? "";
  return collapseWhitespace(
    safeValue
      .replace(BRACKET_PATTERN, " ")
      .replace(DASH_PATTERN, " ")
      .replace(PIPE_PATTERN, " ")
      .replace(PUNCTUATION_PATTERN, " ")
      .replace(MULTIPLE_WHITESPACE_PATTERN, " "),
  );
}

function removeFeaturedArtists(value: string | null | undefined): string {
  const safeValue = value ?? "";
  return collapseWhitespace(safeValue.split(/\b(?:feat|ft)\.?\b/i)[0] || safeValue);
}

function extractPrimaryTitleSegment(value: string | null | undefined): string {
  const withoutNoise = stripNoise(value, SEARCH_TITLE_NOISE_PATTERNS);
  const [pipeLead] = withoutNoise.split("|");
  const dashSegments = pipeLead
    .split(/\s+-\s+/)
    .map(collapseWhitespace)
    .filter(Boolean);

  return dashSegments[0] || collapseWhitespace(pipeLead);
}

function normalizeSearchTrackTitle(title: string | null | undefined): string {
  return normalizeForSearch(stripNoise(title, SEARCH_TITLE_NOISE_PATTERNS));
}

export function normalizeTrackTitle(title: string | null | undefined): string {
  return normalizeForComparison(stripNoise(title, COMPARISON_TITLE_NOISE_PATTERNS));
}

export function normalizeArtistName(name: string | null | undefined): string {
  return normalizeForComparison(name);
}

export function normalizeAlbumName(name: string | null | undefined): string {
  if (!name) return "";
  return normalizeForComparison(name);
}

function buildSearchQueryParts(values: (string | null | undefined)[]): string {
  return values
    .map((value) => (value ? normalizeForSearch(value) : ""))
    .filter(Boolean)
    .join(" ")
    .trim();
}

export function buildTrackSearchQueries(track: ImportedPlaylistTrack): string[] {
  const titleWithoutFeatures = removeFeaturedArtists(track.title);
  const cleanedTitle = normalizeSearchTrackTitle(titleWithoutFeatures);
  const primaryTitle = normalizeSearchTrackTitle(extractPrimaryTitleSegment(titleWithoutFeatures));
  const queries = [
    buildSearchQueryParts([cleanedTitle, track.artistName]),
    buildSearchQueryParts([primaryTitle, track.artistName]),
    buildSearchQueryParts([cleanedTitle]),
    buildSearchQueryParts([primaryTitle]),
    buildSearchQueryParts([primaryTitle, track.albumName]),
    buildSearchQueryParts([cleanedTitle, track.albumName]),
  ];

  return Array.from(new Set(queries.filter(Boolean)));
}
