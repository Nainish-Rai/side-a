# Queue Feedback Design

**Date**: 2026-03-10
**Status**: Approved
**Type**: Queue action UX refinement

---

## Overview

Extend queue controls across all track surfaces and add consistent feedback for queue mutations.

- Add `Add to Queue` and `Play Next` anywhere compact track actions make sense.
- Use shadcn-style tooltips for desktop icon hints.
- Use Sonner toasts for success and failure feedback on queue actions.

---

## Architecture

Queue mutation stays in `AudioPlayerContext`, while user feedback is triggered by shared UI action handlers closer to the interaction source. Global providers mount Sonner and tooltip context once so all components can reuse the same primitives.

The queue action API remains small: append, insert-next, and existing playback controls. UI components receive handlers and feedback helpers rather than implementing their own queue rules.

---

## Components

### `components/providers.tsx`

- Mount `TooltipProvider` globally.
- Mount Sonner `Toaster` globally.

### `components/ui/tooltip.tsx`

- Add the shadcn tooltip wrapper built on Radix Tooltip primitives.
- Keep styling aligned with the app's monochrome visual language.

### Queue action call sites

- Reuse one feedback pattern for `Add to Queue` and `Play Next`.
- Show success toasts when the action is applied.
- Show failure toasts only if the action cannot complete.

### Track surfaces

- `components/search/TrackRow.tsx`: keep compact desktop icon actions with tooltips.
- `components/mobile/MobileTrackRow.tsx`: keep action sheet labels, plus toasts after execution.
- `components/player/Queue.tsx` and any other compact track list surfaces: add the same actions where interaction density allows.

---

## Data Flow

1. User activates `Add to Queue` or `Play Next`.
2. The UI handler calls the player context mutation.
3. If the mutation succeeds, show a Sonner success toast.
4. If the mutation throws or receives invalid data, show a Sonner error toast.
5. Desktop-only compact icon buttons expose action names via tooltip on hover and focus.

---

## Error Handling

- Treat missing track identifiers or unexpected mutation failures as toastable errors.
- Do not interrupt current playback when feedback fails.
- Keep toasts short and action-oriented.

---

## Testing

- Verify tooltips appear on desktop queue-action icons.
- Verify success toast copy for both actions.
- Verify error toast appears if an invalid action path is triggered.
- Verify added actions still preserve queue order and stack-based `Play Next` behavior.
