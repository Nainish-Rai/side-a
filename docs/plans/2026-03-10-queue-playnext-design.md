# Queue and Play Next Design

**Date**: 2026-03-10
**Status**: Approved
**Type**: Playback queue behavior

---

## Overview

Add two queue actions to the existing web player:

- `Add to Queue` appends a track to the end of the active queue.
- `Play Next` inserts a track immediately after the currently playing track.

The approved `Play Next` behavior is stack-based: if the user triggers it multiple times, the most recently chosen track stays closest to the current track and will play first.

---

## Architecture

`AudioPlayerContext` remains the source of truth for playback, queue order, and queue mutation. UI components call explicit queue APIs instead of mutating arrays locally.

This keeps all index bookkeeping in one place and ensures the queue drawer, transport controls, and search result actions stay synchronized.

---

## Components

### `contexts/AudioPlayerContext.tsx`

- Extend the context API with explicit queue mutation methods for append and insert-next behavior.
- Keep current playback uninterrupted when queue contents change.
- Adjust `currentQueueIndex` only when an insertion happens before the current pointer.
- Preserve compatibility with existing queue rendering and reorder behavior.

### `components/search/SearchResults.tsx`

- Wire track actions to the new context methods.
- Reuse the current playback list when a track row is played normally.
- Pass queue action handlers into mobile and desktop row components.

### `components/mobile/MobileTrackRow.tsx`

- Expand the action sheet so mobile users can trigger both `Add to Queue` and `Play Next`.
- Keep the current visual style and interaction model.

### `components/search/TrackRow.tsx`

- Add a compact desktop affordance for queue actions that matches the current row styling.
- Ensure row click still plays the selected track while secondary actions do not trigger playback.

---

## Data Flow

1. User taps or clicks a queue action from a track row.
2. The row component calls an action passed from `SearchResults`.
3. `SearchResults` delegates to `AudioPlayerContext`.
4. `AudioPlayerContext` updates queue order and queue index.
5. Queue-dependent UI reads the updated state through existing hooks.

`Play Next` insertion rules:

- If a track is currently playing, insert at `currentQueueIndex + 1`.
- If nothing is playing but a queue exists, insert at the front as the next item to be played.
- Repeated `Play Next` calls always insert at the same insertion point so the latest track becomes next up.

---

## Error Handling

- Queue actions are synchronous state updates and should fail silently only if track data is missing.
- Playback startup behavior remains unchanged; queue mutation alone does not fetch streams.
- Existing playback error handling in `AudioPlayerContext` continues to handle stream failures.

---

## Testing

- Verify normal play still replaces the active queue with the visible result set.
- Verify `Add to Queue` appends tracks without interrupting playback.
- Verify `Play Next` inserts directly after the current track.
- Verify two consecutive `Play Next` actions produce stack order.
- Verify removing and reordering queue items still behaves correctly after insertions.

---

## Notes

- `contexts/QueueContext.tsx` appears legacy and should not become the mutation source.
- No new dependencies are required.
