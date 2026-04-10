# Queue and Play Next Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add `Add to Queue` and `Play Next` actions that integrate with the existing audio player queue and preserve current playback.

**Architecture:** Keep all queue mutation rules inside `AudioPlayerContext`, then pass simple action handlers into search result row components. This keeps queue ordering, current index tracking, and queue UI in sync without introducing a second queue state path.

**Tech Stack:** Next.js App Router, React 19, TypeScript, existing context-based audio player, Tailwind CSS, lucide-react, motion

---

### Task 1: Extend queue mutations in the player context

**Files:**
- Modify: `contexts/AudioPlayerContext.tsx`

**Step 1: Add the new context contract**

- Add a `playNextInQueue(track: Track)` method to `AudioPlayerContextValue`.
- Keep `addToQueue(track)` as the append API.

**Step 2: Implement append behavior**

- Ensure `addToQueue` appends the incoming track to `state.queue`.
- Do not interrupt the current track.

**Step 3: Implement stack-based play-next behavior**

- Insert the selected track at `Math.max(state.currentQueueIndex, -1) + 1`.
- If nothing is playing yet, insert at index `0`.
- Do not auto-play the inserted track.

**Step 4: Protect queue index invariants**

- Keep `currentQueueIndex` unchanged when inserting after the current track.
- Preserve compatibility with `removeFromQueue`, `reorderQueue`, `playNext`, and `playPrev`.

**Step 5: Type-check mentally against existing consumers**

- Confirm `useAudioPlayer()` callers still receive a complete value object.
- Make sure `useQueue()` remains read-only and unchanged.

### Task 2: Wire queue actions from search results

**Files:**
- Modify: `components/search/SearchResults.tsx`

**Step 1: Consume the new player actions**

- Read `addToQueue` and `playNextInQueue` from `useAudioPlayer()` alongside `setQueue`.

**Step 2: Add row-level handlers**

- Create small handlers for append and insert-next actions.
- Guard against missing track data only if needed.

**Step 3: Pass handlers to mobile rows**

- Replace the current `console.log` placeholder for `onAddToQueue`.
- Add a new `onPlayNext` prop.

**Step 4: Pass handlers to desktop rows**

- Extend `TrackRow` usage so desktop has the same queue features.

### Task 3: Add queue controls to the mobile action sheet

**Files:**
- Modify: `components/mobile/MobileTrackRow.tsx`

**Step 1: Extend props**

- Add `onPlayNext?: () => void` to `MobileTrackRowProps`.

**Step 2: Expand the action dispatcher**

- Add a `next` action case to the context menu handler.

**Step 3: Add the new menu item**

- Add a `Play Next` button next to the existing `Add to Queue` action.
- Reuse the current visual language and icon set.

### Task 4: Add desktop queue action affordances

**Files:**
- Modify: `components/search/TrackRow.tsx`

**Step 1: Extend props**

- Add optional `onAddToQueue` and `onPlayNext` callbacks.

**Step 2: Add secondary action buttons**

- Add compact row actions near the duration/like controls.
- Stop event propagation so these buttons do not trigger row playback.

**Step 3: Match existing style**

- Keep the buttons subtle until hover, using the same monochrome, minimal treatment already present in the row.

### Task 5: Verify the integrated behavior

**Files:**
- Verify: `contexts/AudioPlayerContext.tsx`
- Verify: `components/search/SearchResults.tsx`
- Verify: `components/mobile/MobileTrackRow.tsx`
- Verify: `components/search/TrackRow.tsx`

**Step 1: Run lint**

Run: `npm run lint`

**Step 2: Manual playback verification**

- Start the app.
- Play any track from search results.
- Trigger `Add to Queue` on one track and confirm it lands at the end of `Queue`.
- Trigger `Play Next` on two tracks and confirm the most recent selection is immediately after the current track.
- Skip forward and confirm order is preserved.

**Step 3: Check queue drawer behavior**

- Open the queue drawer from `components/player/AudioPlayer.tsx`.
- Confirm insertions, removals, and reordering still work after using the new actions.
