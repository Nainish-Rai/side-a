# YTMusic Public Playlist Import Design

## Goal

Add a one-time public YouTube Music playlist import flow to SIDE A using `ytmusicapi`, with immediate playback in the app.

Phase 1 scope is intentionally narrow:

- public YTMusic playlist URL input
- no YTMusic auth
- one-time import only
- imported playlist becomes a normal local SIDE A playlist
- imported tracks must be immediately playable

## Key Product Decision

Immediate playback means the app cannot store raw YTMusic tracks as the final playlist payload.

Phase 1 must import through a matching pipeline:

1. fetch public playlist data from YTMusic
2. normalize imported track metadata
3. match each imported track to a playable SIDE A provider track
4. create a local playlist from matched playable tracks only

Given the current codebase, "playable" means TIDAL-backed tracks. Qobuz search exists, but streaming is not implemented yet.

## Requirements

### Functional

- Accept a public YTMusic playlist URL.
- Fetch playlist metadata and track list with `ytmusicapi`.
- Match imported tracks to playable TIDAL tracks.
- Create a local playlist in the existing library/playlists flow.
- Report partial import results when some tracks cannot be matched.
- Reject invalid, unsupported, private, or unavailable playlists with clear errors.

### Non-Functional

- Keep `ytmusicapi` isolated to the outer layer.
- Reuse existing local playlist persistence.
- Avoid schema changes unless they unlock essential UX.
- Keep the request synchronous for phase 1.
- Make future auth-based sync or refresh additive rather than a rewrite.

## Existing Constraints

- Local playlists are already modeled as `UserPlaylist` and stored via the existing library state path.
- Playback currently depends on provider-native `Track` objects because the player calls `api.getStreamUrl(track.id, quality)`.
- TIDAL is the only currently playable provider path.

## Chosen Approach

Use a thin import use case over the existing local playlist architecture.

- Add one server-side import route for YTMusic URLs.
- Route calls a use case that depends on inward-facing ports.
- A `ytmusicapi` adapter fetches public playlist data.
- A provider search adapter finds playable TIDAL matches.
- The use case returns a playlist draft plus import stats.
- The client saves the matched `Track[]` as a normal local playlist using existing library context methods.

This is the simplest path because it avoids new storage models, avoids background jobs, and keeps external dependencies at the edge.

## Rejected Approaches

### Directly store imported YTMusic tracks

Rejected because those tracks are not playable in the current app architecture.

### Persist import source metadata now

Rejected for phase 1 because one-time import does not need refresh or source linkage. This can be added later without changing the core use case boundary.

### Server writes directly into library state

Rejected because it couples external import logic to persistence mutation logic. Returning a playlist draft keeps the import use case reusable and easier to test.

## Clean Architecture Shape

### Entities

Framework-agnostic import models:

- `ImportedPlaylist`
- `ImportedTrack`
- `TrackMatchResult`

These shapes must not depend on Next.js, Prisma, React, or `ytmusicapi`.

### Use Cases

Primary use case:

- `ImportPublicYtMusicPlaylist`

Input:

- `{ url: string }`

Output:

- `playlistName`
- `matchedTracks: Track[]`
- `unmatchedTracks: ImportedTrack[]`
- `stats`

Ports defined inward:

- `PlaylistImportSource`
- `PlayableTrackSearch`

### Interface Adapters

Outbound adapters:

- `YtMusicPublicPlaylistSource` backed by `ytmusicapi`
- `TidalPlayableTrackSearch` backed by existing TIDAL search functionality

Inbound adapters:

- Next route handler request/response mapping
- client dialog form submission and result display

### Frameworks and Drivers

- Next.js route
- `ytmusicapi`
- existing API/search clients

All framework and library details stay in the outermost circle.

## Data Flow

1. User opens playlists page.
2. User clicks `Import YTMusic`.
3. User pastes a YTMusic playlist URL.
4. Client posts URL to a server import route.
5. Route validates request shape and invokes `ImportPublicYtMusicPlaylist`.
6. Use case asks `YtMusicPublicPlaylistSource` for playlist metadata and tracks.
7. Use case normalizes each imported track into a search-ready form.
8. Use case asks `PlayableTrackSearch` for TIDAL candidates per imported track.
9. Use case scores and selects the best confident match.
10. Use case returns matched playable tracks, unmatched imported tracks, and summary stats.
11. Client creates a normal local playlist using the matched `Track[]`.
12. UI shows success, partial success, or failure summary.

## Matching Strategy

Phase 1 should favor deterministic matching over elaborate heuristics.

### Input Normalization

For each YTMusic track:

- normalize title
- normalize primary artist
- strip noise such as:
  - `(Official Video)`
  - `(Official Audio)`
  - `(Lyrics)`
  - `(Remastered 20XX)`
  - bracketed metadata
- collapse repeated whitespace
- preserve duration when available

### Candidate Retrieval

For each normalized track:

- build query from `title + artist`
- search TIDAL for top `5-10` candidates

### Candidate Scoring

Use a small weighted scoring model:

- title similarity: strongest signal
- primary artist similarity: second strongest signal
- duration difference: strong tie-breaker
- album similarity: optional bonus

### Acceptance Rule

Accept only if:

- best candidate crosses a confidence threshold
- and beats the next-best candidate by a minimum margin

Otherwise:

- mark as unmatched
- do not include it in the final playlist

### Phase 1 Deliberate Omissions

- no ISRC matching
- no fuzzy library dependency unless native scoring proves insufficient
- no retry queue
- no manual per-track correction UI

## API Boundary

Recommended route:

- `POST /api/import/ytmusic`

Request:

```json
{
  "url": "https://music.youtube.com/playlist?list=..."
}
```

Response:

```json
{
  "playlistName": "Imported Playlist",
  "matchedTracks": [],
  "unmatchedTracks": [],
  "stats": {
    "total": 12,
    "matched": 10,
    "unmatched": 2
  }
}
```

This route should not mutate storage directly in phase 1.

## UI Scope

Add a minimal import flow to the playlists page:

- new `Import YTMusic` button near `New Playlist`
- dialog with one URL field
- loading state while import runs
- success/error toast
- partial-result summary

On success:

- call existing local playlist creation flow with the matched `Track[]`

Suggested default playlist naming:

- imported YTMusic playlist name

Optional description:

- `Imported from YouTube Music`

## Error Handling

Map use case outcomes to clear route responses:

- `400` invalid request body or invalid URL
- `404` playlist not found
- `422` private, unavailable, or zero playable matches
- `502` upstream import/search failure

User-facing messaging should distinguish:

- invalid URL
- playlist unavailable/private
- imported partially
- imported nothing because no playable matches were found

## Performance and Scale

Phase 1 does not need queues, workers, or extra persistence.

Expected usage:

- one import per user action
- tens to hundreds of tracks per playlist
- one YTMusic fetch plus one TIDAL search per imported track

This is acceptable for a synchronous request/response flow at current product scale.

If large playlists become slow later, the first optimization should be bounded concurrency in the matcher, not a background job system.

## Testing Strategy

### Unit Tests

- URL parser/validator
- title and artist normalization
- candidate scoring
- acceptance threshold behavior
- use case behavior for full, partial, and zero-match results

### Integration Tests

- route validation
- adapter mapping from YTMusic raw response to `ImportedTrack`
- TIDAL candidate selection contract

### Manual Verification

- valid public playlist imports fully
- partially matchable playlist imports with summary
- invalid URL rejected
- private playlist rejected
- created playlist plays immediately in existing player flow

## Incremental Implementation Plan

1. Add import domain types and use case contract.
2. Add YTMusic public playlist adapter backed by `ytmusicapi`.
3. Add TIDAL playable track search adapter using existing search capabilities.
4. Implement normalization and matching scorer.
5. Add `POST /api/import/ytmusic` route.
6. Add import dialog and playlists-page wiring.
7. Save returned matched tracks into local playlist state.
8. Verify import, partial import, and playback manually.

## Risks

- YTMusic public data shape may be inconsistent across playlists.
- Search-based matching can produce false positives if thresholds are too loose.
- Search-based matching can produce too many misses if thresholds are too strict.
- Large playlists may feel slow if matching is fully sequential.

## Future Extensions

- store source metadata for refresh/re-import
- support authenticated/private YTMusic playlists
- add manual resolution UI for unmatched tracks
- add Qobuz matching when playback support exists
- add import preview before commit

## Score

- System design: 9/10
- Clean architecture: 9/10

To reach 10/10 later:

- formalize exact match thresholds with real sample data
- define explicit test fixtures for tricky title/artist normalization cases
- confirm bounded concurrency limits for large playlist imports
