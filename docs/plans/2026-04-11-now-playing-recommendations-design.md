# Now Playing Recommendations Design

## Goal

Add a track-context recommendation system to the fullscreen now playing screen.

Phase 1 scope:

- recommendations are derived from the currently playing track only
- recommendations are shown in multiple labeled sections
- YTMusic is the primary recommendation source
- every visible recommendation should resolve to a playable provider-native `Track`
- recommendations should support immediate playback and queue actions

## Product Decision

This app already treats playback as provider-native queue state, not as external-source playback.

That means recommendations cannot stop at YTMusic metadata. The system must:

1. fetch track-context recommendation candidates from YTMusic
2. normalize and rank those candidates
3. resolve them into playable provider-native `Track` objects
4. return labeled sections that can be rendered directly inside the fullscreen player

## Existing Constraints

- The current YTMusic import path is isolated in an outer adapter layer.
- The player expects provider-native `Track` objects because playback depends on `api.getStreamUrl(track.id, quality)`.
- Queue mutation rules already live in `AudioPlayerContext`.
- The current repo dependency is `ytmusic-api` for Node/TypeScript, even though earlier research references Python `ytmusicapi`.

## Chosen Approach

Implement a server-side recommendation pipeline that mirrors the existing playlist import architecture.

- add a new recommendation route: `POST /api/recommendations`
- add a `GetTrackRecommendations` use case
- add a YTMusic recommendation adapter
- add a provider resolver that maps recommendation metadata to playable tracks
- render sections below the queue in the fullscreen player

This keeps external API logic isolated, reuses existing track matching rules, and avoids introducing a separate recommendation storage model.

## Recommendation Sources

### Primary: YTMusic watch-context graph

Use the current YTMusic client boundary to derive sections from the current track:

- `Up Next`
  - use YTMusic up-next results for the current seed song
- `Similar Tracks`
  - use additional items from the same YTMusic watch-context result set
- `From Related Artists`
  - use the current artist's related artists and their top songs

### Fallbacks

- if no seed song can be found, return no sections instead of showing misleading recommendations
- if one section fails, keep the others
- if a candidate cannot be resolved to a playable provider track, drop it

## Architecture

```text
FullscreenPlayer
  -> POST /api/recommendations
    -> GetTrackRecommendations
      -> YtMusicRecommendationSource
      -> ProviderRecommendationResolver
      -> in-memory TTL cache
  -> renders labeled recommendation sections
  -> queue actions reuse AudioPlayerContext
```

## Data Contracts

Request:

```ts
interface RecommendationRequest {
  title: string;
  artist: string;
  album?: string;
  duration?: number;
  provider?: "tidal" | "qobuz";
}
```

Response:

```ts
interface RecommendationResponse {
  generatedAt: string;
  cacheHit: boolean;
  sections: RecommendationSection[];
}

interface RecommendationSection {
  id: "up-next" | "similar-tracks" | "related-artists";
  title: string;
  subtitle?: string;
  items: RecommendationItem[];
}

interface RecommendationItem {
  reason: "autoplay" | "watch-queue" | "artist-hop";
  score: number;
  source: "ytmusic";
  track: Track;
}
```

## Matching and Resolution

Reuse the existing playlist import matching strategy:

- build search queries from normalized title, artist, and album
- search provider tracks
- score candidates using title and artist similarity with duration as a tie-breaker
- accept only confident matches

This keeps imported playlists and now playing recommendations consistent in how external metadata is turned into playable tracks.

## UI Design

Recommendations live inside the queue surface rather than in a separate screen.

- desktop:
  - queue remains first
  - recommendations appear beneath the queue in clearly labeled blocks
- mobile:
  - expanded queue screen shows queue first, then recommendation sections

Each section needs:

- a clear heading and short subtitle
- visible loading state
- explicit empty/error fallback
- row click to start playback from that section
- queue affordances for `Play Next` and `Add to Queue`

## Design of Everyday Things Notes

- Discoverability:
  - section labels explain why tracks appear
  - row actions expose the available queue operations directly
- Mappings:
  - recommendation rows use the same play and queue behaviors users already know
- Constraints:
  - unresolved tracks are hidden rather than shown as dead-end results
- Feedback:
  - loading, partial failure, and queue action toasts make system state visible

## Caching

Use an in-memory TTL cache keyed by normalized seed track identity and provider.

- TTL: 20 minutes
- cache payload: final resolved response
- cache benefit: reduce repeated YTMusic lookups while the user revisits the same track

## Risks

- YTMusic unofficial APIs may change
- recommendation quality depends on seed-song lookup quality
- provider resolution may drop valid recommendations if metadata is noisy

## Deliberate Omissions

- no personalization
- no persistent recommendation store
- no background precomputation
- no user feedback loop or learning model
- no cross-session analytics-based ranking
