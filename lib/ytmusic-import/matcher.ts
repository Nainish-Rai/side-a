import type { Track } from "@/lib/api/types";
import type { ImportedPlaylistTrack } from "@/lib/ytmusic-import/types";
import {
  normalizeAlbumName,
  normalizeArtistName,
  normalizeTrackTitle,
} from "@/lib/ytmusic-import/normalize";

const TITLE_WEIGHT = 0.55;
const ARTIST_WEIGHT = 0.3;
const DURATION_WEIGHT = 0.1;
const ALBUM_WEIGHT = 0.05;

const MATCH_SCORE_THRESHOLD = 0.72;
const MATCH_MARGIN_THRESHOLD = 0.08;

interface ScoredTrackCandidate {
  track: Track;
  score: number;
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

function calculateDurationScore(
  sourceDurationSeconds: number | null,
  candidateDurationSeconds: number | undefined,
): number {
  if (!sourceDurationSeconds || !candidateDurationSeconds) return 0.5;

  const difference = Math.abs(sourceDurationSeconds - candidateDurationSeconds);
  if (difference <= 2) return 1;
  if (difference <= 5) return 0.9;
  if (difference <= 10) return 0.7;
  if (difference <= 20) return 0.4;
  return 0;
}

function extractCandidateArtistName(track: Track): string {
  return track.artist?.name || track.artists?.[0]?.name || "";
}

function calculateTrackScore(sourceTrack: ImportedPlaylistTrack, candidateTrack: Track): number {
  const titleScore = calculateDiceCoefficient(
    normalizeTrackTitle(sourceTrack.title),
    normalizeTrackTitle(candidateTrack.title || ""),
  );
  const artistScore = calculateDiceCoefficient(
    normalizeArtistName(sourceTrack.artistName),
    normalizeArtistName(extractCandidateArtistName(candidateTrack)),
  );
  const durationScore = calculateDurationScore(
    sourceTrack.durationSeconds,
    candidateTrack.duration,
  );
  const albumScore = sourceTrack.albumName
    ? calculateDiceCoefficient(
        normalizeAlbumName(sourceTrack.albumName),
        normalizeAlbumName(candidateTrack.album?.title),
      )
    : 0.5;

  return (
    titleScore * TITLE_WEIGHT +
    artistScore * ARTIST_WEIGHT +
    durationScore * DURATION_WEIGHT +
    albumScore * ALBUM_WEIGHT
  );
}

function sortCandidatesByScore(
  sourceTrack: ImportedPlaylistTrack,
  candidateTracks: Track[],
): ScoredTrackCandidate[] {
  return candidateTracks
    .map((track) => ({
      track,
      score: calculateTrackScore(sourceTrack, track),
    }))
    .sort((left, right) => right.score - left.score);
}

function isConfidentMatch(scoredCandidates: ScoredTrackCandidate[]): boolean {
  const bestCandidate = scoredCandidates[0];
  if (!bestCandidate) return false;
  if (bestCandidate.score < MATCH_SCORE_THRESHOLD) return false;

  const secondCandidate = scoredCandidates[1];
  if (!secondCandidate) return true;

  return bestCandidate.score - secondCandidate.score >= MATCH_MARGIN_THRESHOLD;
}

export function findBestPlayableMatch(
  sourceTrack: ImportedPlaylistTrack,
  candidateTracks: Track[],
): Track | null {
  const scoredCandidates = sortCandidatesByScore(sourceTrack, candidateTracks);
  if (!isConfidentMatch(scoredCandidates)) {
    return null;
  }

  return scoredCandidates[0]?.track ?? null;
}
