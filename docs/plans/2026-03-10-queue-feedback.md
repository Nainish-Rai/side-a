# Queue Feedback Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Extend queue actions across track UIs and add shadcn tooltips plus Sonner toast feedback for queue interactions.

**Architecture:** Keep queue mutation logic inside `AudioPlayerContext` and add a small shared UI feedback layer around the action handlers. Mount Sonner and tooltip providers once at the app level so each track surface can opt into consistent feedback with minimal duplication.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS, lucide-react, motion, Radix Tooltip, Sonner

---

### Task 1: Add global feedback primitives

**Files:**
- Modify: `package.json`
- Modify: `components/providers.tsx`
- Create: `components/ui/tooltip.tsx`

**Step 1: Add missing dependencies**

- Add `sonner` and the Radix tooltip primitive package used by shadcn.

**Step 2: Create the tooltip wrapper**

- Add shadcn-style exports for `TooltipProvider`, `Tooltip`, `TooltipTrigger`, and `TooltipContent`.
- Keep the styling aligned to the existing black-and-white UI.

**Step 3: Mount providers once**

- Add global `TooltipProvider` and Sonner `Toaster` in `components/providers.tsx`.

### Task 2: Centralize queue action feedback in search results

**Files:**
- Modify: `components/search/SearchResults.tsx`

**Step 1: Add shared action helpers**

- Create helpers like `handleAddToQueue(track)` and `handlePlayNext(track)`.
- Wrap context mutations in `try/catch` and show Sonner success/error toasts.

**Step 2: Reuse helpers for mobile and desktop rows**

- Replace inline queue callbacks with the shared handlers.

### Task 3: Add desktop tooltips to compact row actions

**Files:**
- Modify: `components/search/TrackRow.tsx`

**Step 1: Wrap action buttons with tooltip primitives**

- Add tooltip labels for `Play Next`, `Add to Queue`, and any adjacent compact action that benefits from it.

**Step 2: Keep event handling intact**

- Ensure tooltip wrappers do not break `stopPropagation` or row click behavior.

### Task 4: Extend queue actions to other track surfaces

**Files:**
- Modify: `components/player/Queue.tsx`
- Modify any additional track list surface found during implementation that reasonably supports compact actions

**Step 1: Add queue action buttons where appropriate**

- Add `Play Next` and `Add to Queue` to the queue drawer rows if the layout supports them.
- Reuse the same tooltip and toast behavior used in search rows.

**Step 2: Preserve existing queue drawer interactions**

- Keep play, remove, and reorder behavior intact.

### Task 5: Verify changed files

**Files:**
- Verify: `components/providers.tsx`
- Verify: `components/ui/tooltip.tsx`
- Verify: `components/search/SearchResults.tsx`
- Verify: `components/search/TrackRow.tsx`
- Verify: `components/mobile/MobileTrackRow.tsx`
- Verify: `components/player/Queue.tsx`

**Step 1: Install dependencies**

Run: `npm install`

**Step 2: Run focused lint on changed files**

Run: `npx eslint "components/providers.tsx" "components/ui/tooltip.tsx" "components/search/SearchResults.tsx" "components/search/TrackRow.tsx" "components/mobile/MobileTrackRow.tsx" "components/player/Queue.tsx"`

Expected: no errors in changed files

**Step 3: Manual verification**

- Hover desktop queue-action icons and confirm tooltip copy.
- Trigger queue actions from desktop search rows, mobile action sheet, and queue drawer.
- Confirm Sonner success toasts appear.
- Confirm failure toasts appear when forcing an invalid action path during development.
