const TITLE_NOISE_PATTERNS = [
  /\((official|audio|video|lyrics?|visualizer|remaster(?:ed)?(?:\s+\d{4})?)\)/gi,
  /\[(official|audio|video|lyrics?|visualizer|remaster(?:ed)?(?:\s+\d{4})?)\]/gi,
  /-+\s*(official|audio|video|lyrics?|visualizer)\b.*$/gi,
];

const FEATURE_SEPARATOR_PATTERN = /\b(feat|ft)\.?\b/gi;
const NON_ALPHANUMERIC_PATTERN = /[^a-z0-9\s]/gi;
const MULTIPLE_WHITESPACE_PATTERN = /\s+/g;

function stripTitleNoise(value: string): string {
  return TITLE_NOISE_PATTERNS.reduce(
    (currentValue, pattern) => currentValue.replace(pattern, " "),
    value,
  );
}

function normalizeForComparison(value: string): string {
  return value
    .toLowerCase()
    .replace(FEATURE_SEPARATOR_PATTERN, " ")
    .replace(NON_ALPHANUMERIC_PATTERN, " ")
    .replace(MULTIPLE_WHITESPACE_PATTERN, " ")
    .trim();
}

export function normalizeTrackTitle(title: string): string {
  return normalizeForComparison(stripTitleNoise(title));
}

export function normalizeArtistName(name: string): string {
  return normalizeForComparison(name);
}

export function normalizeAlbumName(name: string | null | undefined): string {
  if (!name) return "";
  return normalizeForComparison(name);
}

export function buildTrackSearchQuery(title: string, artistName: string): string {
  return [normalizeTrackTitle(title), normalizeArtistName(artistName)]
    .filter(Boolean)
    .join(" ")
    .trim();
}
