# Queue Sonner Feedback Design

**Date**: 2026-03-11
**Status**: Approved
**Type**: Queue action feedback

---

## Overview

Add explicit success and failure feedback for `Add to Queue` and `Play Next` using the shadcn Sonner pattern.

- Mount a single global toast renderer once.
- Keep queue mutations inside `AudioPlayerContext`.
- Trigger toasts from the UI interaction layer where the user action happens.

---

## Architecture

Use shadcn's Sonner integration rather than a custom toast system. A shared `Toaster` wrapper lives in `components/ui/sonner.tsx` and is mounted from `components/providers.tsx` so every page can emit toasts.

Queue action handlers stay close to the track list surfaces in `components/search/SearchResults.tsx` and `app/library/LibraryClient.tsx`. Those handlers validate the selected track, call `addToQueue` or `playNextInQueue`, and emit a success or error toast without moving feedback concerns into `AudioPlayerContext`.

---

## Components

### `components/ui/sonner.tsx`

- Wrap Sonner's `Toaster` in the shadcn style expected by the docs.
- Use the current theme class on the document root to drive toast theme.
- Match the app's monochrome brutalist look with square corners and border-driven styling.

### `components/providers.tsx`

- Mount the shared `Toaster` once inside the existing app providers.

### `components/search/SearchResults.tsx`

- Replace inline queue callbacks with small helpers.
- Show `toast.success("Added to queue")` after append.
- Show `toast.success("Will play next")` after insert-next.
- Show `toast.error("Could not update queue")` if the action cannot complete.

### `app/library/LibraryClient.tsx`

- Reuse the same feedback pattern for Favorites and Recently Played track actions.
- Pass toast-backed handlers down through `TrackSection` into desktop and mobile rows.

---

## Data Flow

1. User taps or clicks `Add to Queue` or `Play Next`.
2. Surface-level handler checks that the track has a valid id.
3. Handler calls the matching `useAudioPlayer()` action.
4. On success, emit a short Sonner success toast.
5. On invalid input or thrown error, emit an error toast.

---

## Error Handling

- Treat missing track ids as invalid actions.
- Catch thrown errors in the UI handler and keep playback untouched.
- Keep failure copy generic and short: `Could not update queue`.

---

## Testing

- Verify lint passes for the changed files.
- Manually trigger both queue actions from search and library surfaces.
- Confirm success toasts appear for both actions.
- Force an invalid track path during development to confirm the error toast appears.
