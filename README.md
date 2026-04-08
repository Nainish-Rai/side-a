# SIDE A

<p align="center">
  <img width="1470" height="801" alt="SIDE A screenshot" src="https://github.com/user-attachments/assets/f93b6e15-60a1-412a-b2f3-e8ea8f488ce6" />
</p>

SIDE A is an open source web music player focused on lossless playback, synced lyrics, and a cleaner listening experience.


- what the project does
- what works today
- what is in progress
- how FLAC / lossless playback is handled in the current codebase
- how to run and contribute

## Project Focus

The current product direction is:

- lossless-first streaming
- FLAC-oriented playback and quality visibility
- synced lyrics as a core feature
- clean player, queue, and library UX
- no ads
- fully free to use

## Current Status

SIDE A is actively being built as a Next.js web app with PWA support.

What is implemented today:

- track, album, and artist search
- album pages
- playback queue with reordering
- fullscreen player and mobile mini player
- synced lyrics with plain-lyrics fallback
- library persistence and recently played tracking
- playlist creation / add-to-playlist flows
- auth and synced library state infrastructure
- installable PWA support
- cache-aware playback helpers and stats
- crossfade work in progress in the player stack

What is not complete yet:

- Spotify playlist sync
- YouTube Music playlist sync
- full playlist import / migration flow
- richer playlist detail pages
- broader offline and error-state polish

## FLAC / Lossless Streaming

This is the part the repo is increasingly centered around.

Current implementation details:

- playback quality defaults to `LOSSLESS` in the queue / audio player state
- the API client requests stream URLs with an explicit `quality` parameter
- quality tokens and aliases are normalized in [`lib/api/utils.ts`](/Users/nainish/development/side-a/lib/api/utils.ts)
- the player surfaces quality information through badges and the stats panel
- the stats panel maps `LOSSLESS` and `HI_RES_LOSSLESS` playback to FLAC-oriented output
- stream URLs are cached client-side for reuse


Important caveat:

- TIDAL-backed lossless playback is the path currently wired into streaming
- Qobuz search and metadata support exist in the repo
- Qobuz streaming is not implemented yet and currently throws in [`lib/api/index.ts`](/Users/nainish/development/side-a/lib/api/index.ts)

So the README should be read as: SIDE A is a lossless / FLAC-focused streaming project, with the implementation still expanding.

## Screenshots

| Home | Player | Lyrics |
| --- | --- | --- |
| <img width="1470" height="802" alt="SIDE A home" src="https://github.com/user-attachments/assets/ff9f7c7b-675c-4bcb-a150-c0302d8787b1" /> | <img width="1470" height="802" alt="SIDE A player" src="https://github.com/user-attachments/assets/edbeedb1-d76a-49bb-8cfd-815bfb2fbd0e" /> | <img width="1470" height="798" alt="SIDE A lyrics" src="https://github.com/user-attachments/assets/567ac8fa-32ce-4dfa-a93b-67b41930559a" /> |

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- TanStack Query
- Prisma
- Better Auth
- `@ducanh2912/next-pwa`

## Running Locally

1. Install dependencies.
2. Set up environment variables from `.env.example`.
3. Start the dev server.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment

The repo includes [`.env.example`](/Users/nainish/development/side-a/.env.example) for:

- Postgres / Prisma
- Better Auth
- Google OAuth
- app base URLs
- library sync endpoint overrides

## Roadmap

Near term:

- Spotify playlist sync
- YouTube Music playlist sync
- playlist detail pages
- better share flows
- stronger loading / error states
- more complete library and settings surfaces
- continued playback quality and crossfade polish

Medium term:

- better import and migration UX for external playlists
- deeper playback stats
- stronger offline / caching behavior
- broader provider support for lossless playback


## Contributing

Issues and pull requests are welcome.

Areas that currently need the most attention:

- FLAC / lossless playback improvements
- provider integration work
- playlist sync and migration
- player / queue / lyrics polish
- reliability, error handling, and offline support
- library and settings UX
