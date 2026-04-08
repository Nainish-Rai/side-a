# SIDE A

<p align="center">
  <img width="1470" height="801" alt="image" src="https://github.com/user-attachments/assets/f93b6e15-60a1-412a-b2f3-e8ea8f488ce6" />

</p>

<p align="center">
  <strong>An open source, completely free streaming app built for a better listening experience.</strong>
</p>

<p align="center">
  No ads. No premium wall. Synced lyrics. Hi-fi direction. Modern queue and library UX.
</p>

## What SIDE A Is

SIDE A is a lyric-first, playback-first music app for people who care about the listening experience, not growth hacks, interruptions, or feature clutter.

The goal is simple:

- make music feel premium without charging for basic dignity
- keep the product open source and transparent
- deliver a high-quality streaming experience with synced lyrics at the center
- remove the friction, noise, and ad-heavy patterns that define too many music apps

This project is built with Next.js and ships as a web app with PWA support.

## Why It Exists

Most streaming apps compete in the same red ocean:

- subscriptions stacked on subscriptions
- ad-supported free tiers that degrade the experience
- bloated product surfaces
- weak lyric experiences
- lock-in around playlists and ecosystems

SIDE A is aiming at a different curve.

Instead of fighting on the usual terms, it focuses on value innovation:

| Eliminate | Reduce | Raise | Create |
| --- | --- | --- | --- |
| Ads, artificial friction, paywall-style experience tax | Clutter, noise, unnecessary complexity | Listening quality, lyric experience, UI clarity, playback feel | A free and open source streaming experience that feels premium |

That is the product bet: make the experience better while keeping it free.

## Current Features

These are already present in the codebase today:

- track, album, and artist search
- playback queue with reordering
- fullscreen player experience
- synced lyrics and plain lyrics fallback
- album pages
- library foundations with persisted state
- recently played tracking
- playlist primitives and add-to-playlist flows
- mobile-first layout with mini player
- installable PWA support
- auth flow and synced library state infrastructure
- multi-source lyrics fetching

## In Progress

These are the near-term features currently in focus:

- Spotify playlist sync
- YouTube Music playlist sync
- stronger playlist import and migration flows
- richer library and settings surfaces
- playlist detail pages and sharing polish
- reliability improvements around errors, offline states, and loading UX

## Screenshots

These are placeholders for now and can be replaced with real captures later.

| Home | Player | Lyrics |
| --- | --- | --- |
| <img width="1470" height="802" alt="image" src="https://github.com/user-attachments/assets/ff9f7c7b-675c-4bcb-a150-c0302d8787b1" />| <img width="1470" height="802" alt="image" src="https://github.com/user-attachments/assets/edbeedb1-d76a-49bb-8cfd-815bfb2fbd0e" />| <img width="1470" height="798" alt="image" src="https://github.com/user-attachments/assets/567ac8fa-32ce-4dfa-a93b-67b41930559a" />|

## Product Philosophy

### 1. Completely Free Means Completely Free

No ads. No fake free tier. No "listen with limits" pattern.

If a feature makes listening worse in order to monetize attention, it does not belong here.

### 2. Open Source Is a Product Feature

Open source is not just a distribution model. It is part of the trust model.

- the app can be inspected
- the direction can be discussed in public
- contributors can shape the roadmap
- users are not trapped inside a black box

### 3. Lyrics Are Not a Side Panel

Lyrics change how people experience music. SIDE A treats synced lyrics as a first-class part of the product, not a throwaway extra.

### 4. Quality Matters

SIDE A is built around a hi-fi listening direction and a cleaner playback experience. The standard is not "good enough for free." The standard is "this should feel better than paid apps."

## Why People Share SIDE A

This product naturally maps to the strongest word-of-mouth drivers:

### Social Currency

People like sharing products that make them look early, sharp, and taste-driven. An open source music app that is free, ad-free, and lyric-first gives people something worth recommending.

### Triggers

Music is a daily habit. So are lyric searches, queue building, and playlist migration pain. SIDE A connects to moments people already repeat every day.

### Emotion

There is real emotional energy behind this category:

- frustration with ads
- fatigue with subscriptions
- excitement around finding something cleaner
- delight when synced lyrics actually feel good

### Public

The product is visually legible. Fullscreen player states, lyrics, and future screenshot-ready listening cards make the experience easy to show and easy to talk about.

### Practical Value

The message is immediately useful:

- it is free
- it has no ads
- it supports synced lyrics
- it is open source
- playlist sync is being worked on

That is the kind of information people pass to friends.

### Stories

The story is simple and retellable:

> We wanted a streaming app that felt better, stayed free, respected listeners, and treated lyrics like part of the music.

That story carries the product on its own.

## Who This Is For

SIDE A is especially for:

- listeners who are tired of ads and degraded free tiers
- people who care about synced lyrics
- users who want a cleaner, sharper player UI
- open source users who prefer transparent software
- people with playlists trapped in other ecosystems

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- TanStack Query
- Prisma
- Better Auth
- PWA support via `@ducanh2912/next-pwa`

## Running Locally

1. Install dependencies.
2. Copy `.env.example` into your local environment.
3. Run the dev server.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment

The project includes `.env.example` with the expected variables for:

- Postgres / Prisma
- Better Auth
- Google OAuth
- app URLs
- library sync endpoint overrides

## Roadmap

### Near Term

- Spotify playlist sync
- YouTube Music playlist sync
- playlist detail pages
- stronger share flows
- better loading and error states
- expanded library and settings

### Longer Term

- smoother onboarding for imported playlists
- stronger offline and caching behavior
- deeper listening stats
- more polished social and shareable listening surfaces

## Contributing

Issues, ideas, and pull requests are welcome.

If you want to contribute, the highest-leverage areas right now are:

- playlist sync and migration flows
- player and lyrics polish
- library and settings UX
- reliability, performance, and offline support
- screenshot assets and README polish
