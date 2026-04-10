# Playlist Management Design

## Goal

Add local-first playlist management to SIDE A with DB sync through the existing library state path. Users can create, rename, delete, and manage playlists, and a track can belong to multiple playlists.

## Product Decisions

- Playlists are local to SIDE A, not TIDAL.
- Playlist state syncs through the existing `/api/library/state` flow.
- Tracks can exist in multiple playlists.
- Playlist editing happens on a dedicated detail page.
- Quick add happens from track surfaces through a modal or sheet.

## Data Model

Extend `LibraryState` with:

- `playlists: UserPlaylist[]`

`UserPlaylist` shape:

- `id: string`
- `name: string`
- `description?: string`
- `createdAt: string`
- `updatedAt: string`
- `tracks: Track[]`

This keeps the system simple and local-first. Each playlist stores track snapshots so playback and rendering do not depend on another cache.

## UX Surfaces

### Playlists Manager

`/playlists` becomes a manager page with:

- primary `NEW PLAYLIST` action
- user playlists section first
- browse/search playlists as a secondary section

### Playlist Detail

`/playlists/[id]` supports:

- rename and description edit
- reorder tracks
- remove tracks
- delete playlist with confirmation
- play playlist from the current ordering

### Add To Playlist

Track actions open a picker with:

- checklist of existing playlists
- inline quick create
- immediate membership feedback

## Motion Direction

- Primary reference: Jakub Krehel
- Secondary reference: Emil Kowalski
- Selective reference: Jhey Tompkins

Rules:

- overlays use restrained opacity + translate transitions
- reorder interactions stay fast and direct
- success feedback is small and sharp, not celebratory
- destructive actions use explicit confirmation without flourish

## Visual Direction

Keep the existing SIDE A brutalist monochrome language:

- bordered structural panels
- monospace labels
- table-first list layouts
- one strong primary action per screen
- minimal fill, no decorative gradients

## Implementation Order

1. Extend library types, context methods, and sync route.
2. Build playlist manager page and playlist detail page.
3. Add add-to-playlist modal and wire it into track surfaces.
4. Verify typecheck and lint.
