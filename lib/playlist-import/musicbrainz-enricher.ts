import {
  normalizeArtistName,
  normalizeTrackTitle,
} from "@/lib/playlist-import/normalize";
import type {
  EnrichedImportedTrackMetadata,
  ImportedPlaylistTrack,
  TrackMetadataEnricher,
} from "@/lib/playlist-import/types";

const MUSICBRAINZ_API_BASE_URL = "https://musicbrainz.org/ws/2";
const MUSICBRAINZ_USER_AGENT = "SideA/0.1.0 (playlist import metadata enrichment)";
const MUSICBRAINZ_MIN_REQUEST_INTERVAL_MS = 1100;
const SEARCH_RESULT_LIMIT = 5;
const SEARCH_SCORE_THRESHOLD = 0.78;
const SEARCH_SCORE_GAP_THRESHOLD = 0.03;
const DURATION_MISMATCH_REJECTION_SECONDS = 20;
const VARIANT_PATTERN =
  /\b(acoustic|live|remix|mix|lofi|lo-fi|instrumental|karaoke|demo|edit|version|radio edit|club mix|trending)\b/i;

interface MusicBrainzArtistCredit {
  name?: string;
  artist?: {
    name?: string;
  };
}

interface MusicBrainzRelease {
  title?: string;
}

interface MusicBrainzRecordingSearchResult {
  id: string;
  title: string;
  length?: number;
  score?: string | number;
  disambiguation?: string;
  releases?: MusicBrainzRelease[];
  "artist-credit"?: MusicBrainzArtistCredit[];
}

interface MusicBrainzRecordingSearchResponse {
  recordings?: MusicBrainzRecordingSearchResult[];
}

interface MusicBrainzRecordingLookupResponse {
  id: string;
  title: string;
  length?: number;
  isrcs?: string[];
  releases?: MusicBrainzRelease[];
  "artist-credit"?: MusicBrainzArtistCredit[];
}

interface RankedRecording {
  recording: MusicBrainzRecordingSearchResult;
  score: number;
}

let queuedRequest: Promise<void> = Promise.resolve();
let nextAllowedRequestAt = 0;

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function normalizeIsrc(value: string | null | undefined): string | null {
  if (!value) return null;

  const normalizedValue = value.replace(/[^a-z0-9]/gi, "").toUpperCase();
  return normalizedValue || null;
}

function getPrimaryArtistName(artistCredits: MusicBrainzArtistCredit[] | undefined): string {
  if (!artistCredits?.length) return "";

  return artistCredits
    .map((artistCredit) => artistCredit.name || artistCredit.artist?.name || "")
    .filter(Boolean)
    .join(" ");
}

function getRecordingDurationSeconds(lengthMilliseconds: number | undefined): number | null {
  if (!lengthMilliseconds) return null;
  return Math.round(lengthMilliseconds / 1000);
}

function calculateDurationScore(
  sourceDurationSeconds: number | null,
  candidateDurationSeconds: number | null,
): number {
  if (!sourceDurationSeconds || !candidateDurationSeconds) return 0.5;

  const durationDifference = Math.abs(sourceDurationSeconds - candidateDurationSeconds);
  if (durationDifference >= DURATION_MISMATCH_REJECTION_SECONDS) return 0;
  if (durationDifference <= 2) return 1;
  if (durationDifference <= 5) return 0.95;
  if (durationDifference <= 10) return 0.8;
  return 0.6;
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

function containsVariantMarker(value: string | undefined): boolean {
  if (!value) return false;
  return VARIANT_PATTERN.test(value);
}

function scoreRecording(
  track: ImportedPlaylistTrack,
  recording: MusicBrainzRecordingSearchResult,
): RankedRecording {
  const normalizedTrackTitle = normalizeTrackTitle(track.title);
  const normalizedTrackArtist = normalizeArtistName(track.artistName);
  const normalizedRecordingTitle = normalizeTrackTitle(recording.title);
  const normalizedRecordingArtist = normalizeArtistName(
    getPrimaryArtistName(recording["artist-credit"]),
  );
  const durationScore = calculateDurationScore(
    track.durationSeconds,
    getRecordingDurationSeconds(recording.length),
  );
  const searchScore =
    typeof recording.score === "string"
      ? Number(recording.score) / 100
      : typeof recording.score === "number"
        ? recording.score / 100
        : 0.5;
  const titleScore = calculateDiceCoefficient(normalizedTrackTitle, normalizedRecordingTitle);
  const artistScore = calculateDiceCoefficient(normalizedTrackArtist, normalizedRecordingArtist);
  const variantPenalty =
    containsVariantMarker(recording.title) || containsVariantMarker(recording.disambiguation)
      ? 0.08
      : 0;

  return {
    recording,
    score:
      titleScore * 0.5 +
      artistScore * 0.25 +
      durationScore * 0.15 +
      searchScore * 0.1 -
      variantPenalty,
  };
}

function buildSearchQuery(track: ImportedPlaylistTrack): string {
  const queryParts = [
    `recording:"${normalizeTrackTitle(track.title)}"`,
    `artist:"${normalizeArtistName(track.artistName)}"`,
  ];

  if (track.durationSeconds) {
    queryParts.push(`qdur:${Math.round((track.durationSeconds * 1000) / 2000)}`);
  }

  return queryParts.join(" AND ");
}

async function fetchRateLimitedJson<T>(url: URL): Promise<T> {
  const waitForTurn = queuedRequest.then(async () => {
    const waitMilliseconds = Math.max(0, nextAllowedRequestAt - Date.now());
    if (waitMilliseconds > 0) {
      await delay(waitMilliseconds);
    }

    nextAllowedRequestAt = Date.now() + MUSICBRAINZ_MIN_REQUEST_INTERVAL_MS;
  });

  queuedRequest = waitForTurn.catch(() => undefined);
  await waitForTurn;

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": MUSICBRAINZ_USER_AGENT,
    },
  });

  if (!response.ok) {
    throw new Error(`MusicBrainz request failed with status ${response.status}.`);
  }

  return (await response.json()) as T;
}

async function searchRecordings(
  track: ImportedPlaylistTrack,
): Promise<MusicBrainzRecordingSearchResult[]> {
  const url = new URL(`${MUSICBRAINZ_API_BASE_URL}/recording`);
  url.searchParams.set("fmt", "json");
  url.searchParams.set("limit", String(SEARCH_RESULT_LIMIT));
  url.searchParams.set("query", buildSearchQuery(track));

  const response = await fetchRateLimitedJson<MusicBrainzRecordingSearchResponse>(url);
  return response.recordings ?? [];
}

async function lookupRecording(
  recordingId: string,
): Promise<MusicBrainzRecordingLookupResponse> {
  const url = new URL(`${MUSICBRAINZ_API_BASE_URL}/recording/${recordingId}`);
  url.searchParams.set("fmt", "json");
  url.searchParams.set("inc", "artist-credits+releases+isrcs");

  return fetchRateLimitedJson<MusicBrainzRecordingLookupResponse>(url);
}

function selectBestRecording(
  track: ImportedPlaylistTrack,
  recordings: MusicBrainzRecordingSearchResult[],
): MusicBrainzRecordingSearchResult | null {
  const rankedRecordings = recordings
    .map((recording) => scoreRecording(track, recording))
    .sort((left, right) => right.score - left.score);
  const bestRecording = rankedRecordings[0];
  const secondRecording = rankedRecordings[1];

  if (!bestRecording) return null;
  if (bestRecording.score < SEARCH_SCORE_THRESHOLD) return null;

  if (
    secondRecording &&
    bestRecording.score - secondRecording.score < SEARCH_SCORE_GAP_THRESHOLD
  ) {
    return null;
  }

  return bestRecording.recording;
}

export class MusicBrainzEnricher implements TrackMetadataEnricher {
  async enrichTrack(track: ImportedPlaylistTrack): Promise<EnrichedImportedTrackMetadata | null> {
    try {
      const searchResults = await searchRecordings(track);
      const selectedRecording = selectBestRecording(track, searchResults);
      if (!selectedRecording) return null;

      const recording = await lookupRecording(selectedRecording.id);

      return {
        source: "musicbrainz",
        title: recording.title,
        artistName: getPrimaryArtistName(recording["artist-credit"]) || track.artistName,
        albumName: recording.releases?.[0]?.title ?? track.albumName,
        durationSeconds: getRecordingDurationSeconds(recording.length) ?? track.durationSeconds,
        isrc: normalizeIsrc(recording.isrcs?.[0]),
      };
    } catch {
      return null;
    }
  }
}
