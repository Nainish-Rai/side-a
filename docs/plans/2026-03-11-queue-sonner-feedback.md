# Queue Sonner Feedback Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add shadcn Sonner success and failure feedback to `Add to Queue` and `Play Next` across current track list surfaces.

**Architecture:** Add a shared Sonner `Toaster` wrapper and mount it once in the app providers. Keep queue mutations in `AudioPlayerContext`, and add toast-backed action helpers in the search and library surfaces so feedback stays close to the user interaction.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS v4, shadcn/ui Sonner, existing context-based audio player

---

### Task 1: Add Sonner primitives

**Files:**
- Modify: `package.json`
- Create: `components/ui/sonner.tsx`
- Modify: `components/providers.tsx`

**Step 1: Add the dependency**

- Add `sonner` to `dependencies` in `package.json`.

**Step 2: Add the shared toaster wrapper**

- Create `components/ui/sonner.tsx` using the shadcn Sonner pattern.
- Read the theme from the existing app theme state on the root element.
- Keep the default styling aligned with the monochrome app tokens.

**Step 3: Mount the toaster once**

- Render `<Toaster />` from `components/providers.tsx` so all client components can call `toast()`.

### Task 2: Add toast-backed search queue actions

**Files:**
- Modify: `components/search/SearchResults.tsx`

**Step 1: Create shared handlers**

- Add `handleAddToQueue(track)` and `handlePlayNext(track)` helpers.
- Validate `track.id` before calling player actions.
- Wrap calls in `try/catch`.

**Step 2: Add feedback copy**

- Success copy: `Added to queue` and `Will play next`.
- Failure copy: `Could not update queue`.

**Step 3: Reuse handlers in both row variants**

- Replace inline callbacks passed to `MobileTrackRow` and `TrackRow` with the shared handlers.

### Task 3: Add toast-backed library queue actions

**Files:**
- Modify: `app/library/LibraryClient.tsx`

**Step 1: Create shared handlers**

- Add the same `handleAddToQueue(track)` and `handlePlayNext(track)` pattern used in search.

**Step 2: Reuse handlers through `TrackSection`**

- Pass the toast-backed handlers into Favorites and Recently Played rows for both mobile and desktop.

### Task 4: Verify behavior

**Files:**
- Verify: `package.json`
- Verify: `components/ui/sonner.tsx`
- Verify: `components/providers.tsx`
- Verify: `components/search/SearchResults.tsx`
- Verify: `app/library/LibraryClient.tsx`

**Step 1: Install dependencies**

Run: `npm install`

**Step 2: Run lint on changed files**

Run: `npm run lint -- components/providers.tsx components/ui/sonner.tsx components/search/SearchResults.tsx app/library/LibraryClient.tsx`

Expected: no lint errors

**Step 3: Manual verification**

- Trigger `Add to Queue` from search results and library rows.
- Trigger `Play Next` from search results and library rows.
- Confirm success toasts appear with the expected copy.
- Confirm invalid track handling shows `Could not update queue`.
