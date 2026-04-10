import type { Track } from "@/lib/api/types";
import type {
  ImportedPlaylistTrack,
  TrackMatchCandidate,
  TrackMatchDiagnostic,
  TrackMatchMethod,
} from "@/lib/playlist-import/types";
import {
  normalizeAlbumName,
  normalizeArtistName,
  normalizeTrackTitle,
} from "@/lib/playlist-import/normalize";

const TITLE_WEIGHT = 0.72;
const ARTIST_WEIGHT = 0.23;
const ALBUM_WEIGHT = 0.05;

const MATCH_SCORE_THRESHOLD = 0.65;
const TITLE_ONLY_MATCH_SCORE_THRESHOLD = 0.86;
const AMBIGUOUS_MARGIN_THRESHOLD = 0.02;
const TITLE_SCORE_EPSILON = 0.01;
const ARTIST_SCORE_EPSILON = 0.01;
const STRONG_TITLE_MATCH_THRESHOLD = 0.97;
const STRONG_ARTIST_MATCH_THRESHOLD = 0.75;
const CLEAR_TITLE_GAP_THRESHOLD = 0.03;
const CLEAR_ARTIST_GAP_THRESHOLD = 0.02;
const CLEAR_DURATION_GAP_SECONDS = 8;
const CLOSE_DURATION_THRESHOLD_SECONDS = 5;

interface CandidateScoreBreakdown {
  titleScore: number;
  artistScore: number;
  albumScore: number;
  score: number;
}

interface CandidateWithBreakdown {
  track: Track;
  breakdown: CandidateScoreBreakdown;
  durationDifferenceSeconds: number | null;
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

function calculateDurationDifferenceSeconds(
  sourceDurationSeconds: number | null,
  candidateDurationSeconds: number | undefined,
): number | null {
  if (!sourceDurationSeconds || !candidateDurationSeconds) return null;
  return Math.abs(sourceDurationSeconds - candidateDurationSeconds);
}

function normalizeIsrc(value: string | null | undefined): string | null {
  if (!value) return null;

  const normalizedValue = value.replace(/[^a-z0-9]/gi, "").toUpperCase();
  return normalizedValue || null;
}

function extractCandidateArtistName(track: Track): string {
  if (track.artists?.length) {
    return track.artists.map((artist) => artist.name).join(" ");
  }

  return track.artist?.name || "";
}

function scoreCandidate(
  sourceTrack: ImportedPlaylistTrack,
  candidateTrack: Track,
): CandidateScoreBreakdown {
  const titleScore = calculateDiceCoefficient(
    normalizeTrackTitle(sourceTrack.title),
    normalizeTrackTitle(candidateTrack.title || ""),
  );
  const artistScore = calculateDiceCoefficient(
    normalizeArtistName(sourceTrack.artistName),
    normalizeArtistName(extractCandidateArtistName(candidateTrack)),
  );
  const albumScore = sourceTrack.albumName
    ? calculateDiceCoefficient(
        normalizeAlbumName(sourceTrack.albumName),
        normalizeAlbumName(candidateTrack.album?.title),
      )
    : 0.5;

  return {
    titleScore,
    artistScore,
    albumScore,
    score:
      titleScore * TITLE_WEIGHT +
      artistScore * ARTIST_WEIGHT +
      albumScore * ALBUM_WEIGHT,
  };
}

function scoreTitleOnlyCandidate(
  sourceTrack: ImportedPlaylistTrack,
  candidateTrack: Track,
): CandidateScoreBreakdown {
  const titleScore = calculateDiceCoefficient(
    normalizeTrackTitle(sourceTrack.title),
    normalizeTrackTitle(candidateTrack.title || ""),
  );

  return {
    titleScore,
    artistScore: 0,
    albumScore: 0,
    score: titleScore,
  };
}

function compareDescending(left: number, right: number, epsilon = 0): number {
  if (Math.abs(left - right) <= epsilon) return 0;
  return right - left;
}

function compareAscending(left: number, right: number): number {
  if (left === right) return 0;
  return left - right;
}

function durationForSorting(durationDifferenceSeconds: number | null): number {
  return durationDifferenceSeconds ?? Number.MAX_SAFE_INTEGER;
}

function compareCandidatePriority(
  left: CandidateWithBreakdown,
  right: CandidateWithBreakdown,
): number {
  return (
    compareDescending(
      left.breakdown.titleScore,
      right.breakdown.titleScore,
      TITLE_SCORE_EPSILON,
    ) ||
    compareDescending(
      left.breakdown.artistScore,
      right.breakdown.artistScore,
      ARTIST_SCORE_EPSILON,
    ) ||
    compareAscending(
      durationForSorting(left.durationDifferenceSeconds),
      durationForSorting(right.durationDifferenceSeconds),
    ) ||
    compareDescending(left.breakdown.score, right.breakdown.score, 0.001) ||
    compareDescending(left.track.popularity ?? 0, right.track.popularity ?? 0) ||
    String(left.track.id).localeCompare(String(right.track.id))
  );
}

function sortCandidates(
  sourceTrack: ImportedPlaylistTrack,
  candidateTracks: Track[],
  scorer: (sourceTrack: ImportedPlaylistTrack, candidateTrack: Track) => CandidateScoreBreakdown,
): CandidateWithBreakdown[] {
  return candidateTracks
    .map((track) => ({
      track,
      breakdown: scorer(sourceTrack, track),
      durationDifferenceSeconds: calculateDurationDifferenceSeconds(
        sourceTrack.durationSeconds,
        track.duration,
      ),
    }))
    .sort(compareCandidatePriority);
}

function toDiagnosticCandidate(
  candidate: CandidateWithBreakdown,
): TrackMatchCandidate {
  return {
    trackId: candidate.track.id,
    title: candidate.track.title,
    artistName: extractCandidateArtistName(candidate.track),
    albumName: candidate.track.album?.title || null,
    durationSeconds: candidate.track.duration ?? null,
    score: candidate.breakdown.score,
    titleScore: candidate.breakdown.titleScore,
    artistScore: candidate.breakdown.artistScore,
    albumScore: candidate.breakdown.albumScore,
    durationDifferenceSeconds: candidate.durationDifferenceSeconds,
  };
}

function buildCandidatesForDiagnostic(candidates: CandidateWithBreakdown[]): TrackMatchCandidate[] {
  return candidates.slice(0, 5).map((candidate) => toDiagnosticCandidate(candidate));
}

function isCloseDurationMatch(durationDifferenceSeconds: number | null): boolean {
  return durationDifferenceSeconds !== null && durationDifferenceSeconds <= CLOSE_DURATION_THRESHOLD_SECONDS;
}

function isDurationClearlyBetter(
  bestCandidate: CandidateWithBreakdown,
  secondCandidate: CandidateWithBreakdown,
): boolean {
  if (
    bestCandidate.durationDifferenceSeconds === null ||
    secondCandidate.durationDifferenceSeconds === null
  ) {
    return false;
  }

  return (
    secondCandidate.durationDifferenceSeconds - bestCandidate.durationDifferenceSeconds >=
    CLEAR_DURATION_GAP_SECONDS
  );
}

function hasAmbiguousTopCandidates(candidates: CandidateWithBreakdown[]): boolean {
  const bestCandidate = candidates[0];
  const secondCandidate = candidates[1];
  if (!bestCandidate || !secondCandidate) return false;

  if (bestCandidate.breakdown.score < MATCH_SCORE_THRESHOLD) {
    return false;
  }

  if (bestCandidate.breakdown.score - secondCandidate.breakdown.score >= AMBIGUOUS_MARGIN_THRESHOLD) {
    return false;
  }

  if (
    bestCandidate.breakdown.titleScore >= STRONG_TITLE_MATCH_THRESHOLD &&
    bestCandidate.breakdown.artistScore >= STRONG_ARTIST_MATCH_THRESHOLD &&
    isCloseDurationMatch(bestCandidate.durationDifferenceSeconds) &&
    (bestCandidate.breakdown.titleScore - secondCandidate.breakdown.titleScore >=
      CLEAR_TITLE_GAP_THRESHOLD ||
      bestCandidate.breakdown.artistScore - secondCandidate.breakdown.artistScore >=
        CLEAR_ARTIST_GAP_THRESHOLD ||
      isDurationClearlyBetter(bestCandidate, secondCandidate))
  ) {
    return false;
  }

  return true;
}

function createDiagnostic(
  sourceTrack: ImportedPlaylistTrack,
  queriesTried: string[],
  candidates: CandidateWithBreakdown[],
  status: TrackMatchDiagnostic["status"],
  reason: TrackMatchDiagnostic["reason"],
  method: TrackMatchMethod | null,
  threshold: number | null,
  selectedTrackId: number | string | null,
): TrackMatchDiagnostic {
  return {
    sourceTrack,
    queriesTried,
    status,
    reason,
    method,
    threshold,
    selectedTrackId,
    candidates: buildCandidatesForDiagnostic(candidates),
  };
}

function resolveFuzzyMatch(
  sourceTrack: ImportedPlaylistTrack,
  candidateTracks: Track[],
  queriesTried: string[],
): TrackMatchDiagnostic {
  const rankedCandidates = sortCandidates(sourceTrack, candidateTracks, scoreCandidate);
  const bestCandidate = rankedCandidates[0];

  if (!bestCandidate) {
    return createDiagnostic(
      sourceTrack,
      queriesTried,
      rankedCandidates,
      "unmatched",
      "no-candidates",
      null,
      null,
      null,
    );
  }

  if (hasAmbiguousTopCandidates(rankedCandidates)) {
    return createDiagnostic(
      sourceTrack,
      queriesTried,
      rankedCandidates,
      "ambiguous",
      "ambiguous",
      "fuzzy",
      MATCH_SCORE_THRESHOLD,
      null,
    );
  }

  if (bestCandidate.breakdown.score < MATCH_SCORE_THRESHOLD) {
    const titleOnlyCandidates = sortCandidates(sourceTrack, candidateTracks, scoreTitleOnlyCandidate);
    const bestTitleOnlyCandidate = titleOnlyCandidates[0];

    if (
      bestTitleOnlyCandidate &&
      bestTitleOnlyCandidate.breakdown.score >= TITLE_ONLY_MATCH_SCORE_THRESHOLD
    ) {
      return createDiagnostic(
        sourceTrack,
        queriesTried,
        titleOnlyCandidates,
        "matched",
        "matched",
        "title-only",
        TITLE_ONLY_MATCH_SCORE_THRESHOLD,
        bestTitleOnlyCandidate.track.id,
      );
    }

    return createDiagnostic(
      sourceTrack,
      queriesTried,
      rankedCandidates,
      "unmatched",
      "below-threshold",
      "fuzzy",
      MATCH_SCORE_THRESHOLD,
      null,
    );
  }

  return createDiagnostic(
    sourceTrack,
    queriesTried,
    rankedCandidates,
    "matched",
    "matched",
    "fuzzy",
    MATCH_SCORE_THRESHOLD,
    bestCandidate.track.id,
  );
}

function resolveIsrcMatch(
  sourceTrack: ImportedPlaylistTrack,
  candidateTracks: Track[],
  queriesTried: string[],
  isrc: string,
): TrackMatchDiagnostic | null {
  const normalizedSourceIsrc = normalizeIsrc(isrc);
  if (!normalizedSourceIsrc) return null;

  const isrcMatches = candidateTracks.filter(
    (candidateTrack) => normalizeIsrc(candidateTrack.isrc) === normalizedSourceIsrc,
  );

  if (isrcMatches.length === 0) return null;

  const nonIsrcCandidates = candidateTracks.filter(
    (candidateTrack) => normalizeIsrc(candidateTrack.isrc) !== normalizedSourceIsrc,
  );
  const rankedIsrcMatches = sortCandidates(sourceTrack, isrcMatches, scoreCandidate);
  const rankedNonIsrcCandidates = sortCandidates(sourceTrack, nonIsrcCandidates, scoreCandidate);
  const diagnosticCandidates = [...rankedIsrcMatches, ...rankedNonIsrcCandidates];
  const selectedCandidate = rankedIsrcMatches[0];

  return createDiagnostic(
    sourceTrack,
    queriesTried,
    diagnosticCandidates,
    "matched",
    "matched",
    "isrc",
    null,
    selectedCandidate?.track.id ?? null,
  );
}

export function diagnosePlayableMatch(
  sourceTrack: ImportedPlaylistTrack,
  candidateTracks: Track[],
  queriesTried: string[],
): TrackMatchDiagnostic {
  return resolveFuzzyMatch(sourceTrack, candidateTracks, queriesTried);
}

export function diagnosePlayableMatchWithIsrc(
  sourceTrack: ImportedPlaylistTrack,
  candidateTracks: Track[],
  queriesTried: string[],
  isrc: string,
): TrackMatchDiagnostic {
  const isrcDiagnostic = resolveIsrcMatch(sourceTrack, candidateTracks, queriesTried, isrc);
  if (isrcDiagnostic) {
    return isrcDiagnostic;
  }

  return resolveFuzzyMatch(sourceTrack, candidateTracks, queriesTried);
}
