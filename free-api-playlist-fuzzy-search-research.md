# Free API Research: Fetching Playlists from Links + Fuzzy Search for Track Matching

> **Purpose**: Research free/low-effort APIs and libraries to parse Spotify & YouTube Music playlist links, extract track data, and perform fuzzy search for cross-platform track matching.
>
> **Date**: April 2026

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Spotify: Fetching Playlists from Links](#2-spotify-fetching-playlists-from-links)
   - 2.1 [Official Spotify Web API (Client Credentials Flow)](#21-official-spotify-web-api-client-credentials-flow)
   - 2.2 [spotify-url-info (No Auth Scraper)](#22-spotify-url-info-no-auth-scraper)
   - 2.3 [spotify-uri (URL Parser)](#23-spotify-uri-url-parser)
   - 2.4 [Spotify Approach Comparison](#24-spotify-approach-comparison)
3. [YouTube Music: Fetching Playlists from Links](#3-youtube-music-fetching-playlists-from-links)
   - 3.1 [ytmusic-api (npm)](#31-ytmusic-api-npm)
   - 3.2 [youtubei.js / InnerTube Wrapper](#32-youtubeijs--innertube-wrapper)
   - 3.3 [ytmusicapiJS (TypeScript Port)](#33-ytmusicapijs-typescript-port)
   - 3.4 [Invidious Public API](#34-invidious-public-api)
   - 3.5 [Piped Public API](#35-piped-public-api)
   - 3.6 [YTMusic Approach Comparison](#36-ytmusic-approach-comparison)
4. [Fuzzy Search Libraries for Track Matching](#4-fuzzy-search-libraries-for-track-matching)
   - 4.1 [fuse.js](#41-fusejs)
   - 4.2 [string-similarity](#42-string-similarity)
   - 4.3 [fast-levenshtein](#43-fast-levenshtein)
   - 4.4 [fast-fuzzy](#44-fast-fuzzy)
   - 4.5 [FlexSearch](#45-flexsearch)
   - 4.6 [Fuzzy Library Comparison](#46-fuzzy-library-comparison)
5. [Cross-Platform Track Matching Strategy](#5-cross-platform-track-matching-strategy)
6. [Recommended Architecture](#6-recommended-architecture)
7. [Complete Code Examples](#7-complete-code-examples)
8. [Limitations & Gotchas](#8-limitations--gotchas)

---

## 1. Executive Summary

### Key Findings

| Platform | Method | Auth Required? | Free? | Reliable? |
|----------|--------|----------------|-------|-----------|
| **Spotify** | Client Credentials Flow | App-level only (no user login) | Yes | ⚠️ NO — playlist items blocked as of 2026 |
| **Spotify** | `spotify-url-info` (scraper) | None | Yes | ✅ Works but limited metadata (no ISRC) |
| **Spotify** | User OAuth flow | User login | Yes | ✅ Full access but requires user auth |
| **YTMusic** | `ytmusic-api` (npm) | None for public playlists | Yes | ✅ Good, but cookie setup recommended |
| **YTMusic** | `youtubei.js` | None | Yes | ✅ Full-featured, actively maintained |
| **YTMusic** | Invidious API | None | Yes | ⚠️ Depends on public instance uptime |
| **YTMusic** | Piped API | None | Yes | ⚠️ Depends on public instance uptime |

### ⚠️ Critical Spotify API Change (March 2026)

**Spotify has restricted the Client Credentials flow** — it can no longer retrieve playlist items (tracks). You can still get playlist metadata (name, description, image), but NOT the actual track list. This means you need **one of these alternatives**:

1. **`spotify-url-info`** — scrapes Spotify's embed/open graph data, works without auth, but returns limited metadata
2. **User OAuth Authorization Code Flow** — requires user to log in once, gives full access (including ISRC codes)
3. **Hybrid approach** — use `spotify-url-info` for quick preview, fall back to OAuth for full sync

### Recommended Stack

```
Spotify: spotify-url-info (no auth) OR spotify-web-api-node (OAuth)
YTMusic: ytmusic-api (npm) OR youtubei.js
Matching: string-similarity + fuse.js
```

---

## 2. Spotify: Fetching Playlists from Links

### 2.1 Official Spotify Web API (Client Credentials Flow)

**Status: ⚠️ PARTIALLY BROKEN for playlists**

The Spotify Web API is free to use. You register an app at [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard) to get a Client ID and Client Secret. The Client Credentials Flow lets you get an app-level access token without any user interaction.

**What still works with Client Credentials:**
- Search for tracks, albums, artists
- Get album tracks
- Get artist top tracks
- Get track audio features/analysis
- Get playlist **metadata** (name, description, image, follower count)

**What NO LONGER works (as of March 2026):**
- Get playlist **items** (the actual track list) — this endpoint now requires user authorization

#### Token Acquisition (Server-Side)

```typescript
// POST https://accounts.spotify.com/api/token
const response = await fetch('https://accounts.spotify.com/api/token', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    Authorization: 'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64'),
  },
  body: 'grant_type=client_credentials',
});
const { access_token } = await response.json();
// Token is valid for 1 hour
```

#### Getting Playlist (Metadata Only — No Tracks)

```typescript
// GET https://api.spotify.com/v1/playlists/{playlist_id}
const playlist = await fetch(
  `https://api.spotify.com/v1/playlists/${playlistId}`,
  { headers: { Authorization: `Bearer ${access_token}` } }
).then(r => r.json());
// Returns: name, description, images, followers, etc.
// Does NOT include track items anymore
```

#### Getting Tracks via Search (Workaround)

If you know the track names from another source, you can search:

```typescript
const search = await fetch(
  `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=5`,
  { headers: { Authorization: `Bearer ${access_token}` } }
).then(r => r.json());
// Returns tracks with ISRC, duration, popularity, etc.
```

**Useful npm packages:**
- `spotify-web-api-node` — full Spotify Web API wrapper with pagination helpers
- `spotify-web-api-js` — client-side wrapper (not recommended for server use)

---

### 2.2 spotify-url-info (No Auth Scraper) ✅ RECOMMENDED for quick access

**The best option for zero-auth Spotify playlist fetching.** This package scrapes Spotify's open graph / embed data from the URL itself — no API token, no user login, no app registration needed.

| Feature | Details |
|---------|---------|
| **npm** | `spotify-url-info` |
| **GitHub** | https://github.com/nickp10/spotify-url-info |
| **Auth** | None required |
| **Cost** | Free |
| **Metadata** | Track title, artist, album, duration, artwork, tracklist (for playlists) |
| **ISRC** | ❌ Not available (no ISRC codes in scraped data) |
| **Rate Limits** | Subject to Spotify's scraping protections (use sparingly) |

#### Installation

```bash
npm install spotify-url-info
```

#### Usage

```typescript
import spotify from 'spotify-url-info';
import fetch from 'node-fetch'; // or undici, axios

// Pass a fetch implementation (required)
const spotifyInfo = spotify(fetch);

// For a PLAYLIST link
const data = await spotifyInfo.getData(
  'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M'
);
// Returns: { type: 'playlist', name, description, tracks: [...], ... }

// Get just the preview data (lighter)
const preview = await spotifyInfo.getPreview(
  'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M'
);

// For individual track links
const trackData = await spotifyInfo.getTracks(
  'https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT'
);

// Also supports album links
const albumData = await spotifyInfo.getData(
  'https://open.spotify.com/album/1DFixLWuPkv3KT3TnV35m3'
);
```

#### Playlist Data Shape

```typescript
{
  type: 'playlist',
  id: '37i9dQZF1DXcBWIGoYBM5M',
  name: "Today's Top Hits",
  description: 'The hottest tracks right now',
  uri: 'spotify:playlist:37i9dQZF1DXcBWIGoYBM5M',
  // Tracks array — shape similar to Spotify API
  tracks: {
    items: [
      {
        track: {
          id: '4cOdK2wGLETKBW3PvgPWqT',
          name: 'Flowers',
          artists: [{ name: 'Miley Cyrus', id: '...' }],
          album: { name: 'Endless Summer Vacation', images: [...] },
          duration_ms: 200453,
          uri: 'spotify:track:4cOdK2wGLETKBW3PvgPWqT',
          // Note: NO external_ids.isrc via this method
        }
      },
      // ... more tracks
    ]
  }
}
```

#### Pros & Cons

| Pros | Cons |
|------|------|
| Zero auth — no app registration, no tokens | No ISRC codes (critical for cross-platform matching) |
| Free, unlimited (within rate limits) | May break if Spotify changes their HTML/embed structure |
| Works with any public Spotify URL | Rate limited by Spotify's anti-scraping measures |
| Returns full track list for playlists | Pagination may be limited |
| Simple API — just pass URL | Less reliable than official API |

---

### 2.3 spotify-uri (URL Parser)

**Not a data fetcher, but useful for parsing Spotify links.**

| Feature | Details |
|---------|---------|
| **npm** | `spotify-uri` |
| **Purpose** | Parse Spotify URLs/URIs into structured objects |
| **Auth** | N/A |

```typescript
import { parse } from 'spotify-uri';

// Parses any Spotify URL format into a structured object
parse('https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M?si=abc123');
// { type: 'playlist', id: '37i9dQZF1DXcBWIGoYBM5M' }

parse('spotify:track:4cOdK2wGLETKBW3PvgPWqT');
// { type: 'track', id: '4cOdK2wGLETKBW3PvgPWqT' }

parse('https://open.spotify.com/album/1DFixLWuPkv3KT3TnV35m3');
// { type: 'album', id: '1DFixLWuPkv3KT3TnV35m3' }
```

**Use in pipeline**: Use `spotify-uri` to extract the playlist ID from any Spotify link format, then pass to `spotify-url-info` or Spotify Web API.

---

### 2.4 Spotify Approach Comparison

| Approach | Auth | ISRC | Track List | Reliability | Best For |
|----------|------|------|------------|-------------|----------|
| Client Credentials | App-level | ✅ via search | ❌ Blocked | High | Searching tracks by name |
| User OAuth | User login | ✅ Yes | ✅ Full | Highest | Full-featured sync |
| `spotify-url-info` | None | ❌ No | ✅ Full | Medium | Quick, no-auth access |
| `spotify-uri` + search | App-level | ✅ via search | Manual | High | Parsing links then searching |

**Recommended for your app**: Use `spotify-url-info` for the initial fetch (zero friction), and optionally add OAuth for users who want ISRC-based precise matching.

---

## 3. YouTube Music: Fetching Playlists from Links

YouTube Music has **no official public API**. All options are third-party scrapers/wrappers. Fortunately, several excellent npm packages exist.

### 3.1 ytmusic-api (npm) ✅ RECOMMENDED

The most popular npm package for YouTube Music. It's a TypeScript-first data scraper that emulates YouTube Music web client requests.

| Feature | Details |
|---------|---------|
| **npm** | `ytmusic-api` (v5.3.1+) |
| **GitHub** | https://github.com/nickp10/ytmusic-api |
| **Auth** | None for public playlists (cookie setup recommended for better rate limits) |
| **Cost** | Free |
| **TypeScript** | Full TypeScript support with return types |
| **Playlist fetch** | ✅ Full track list from playlist ID or URL |

#### Installation

```bash
npm install ytmusic-api
```

#### Basic Setup & Usage

```typescript
import YTMusic from 'ytmusic-api';

const ytmusic = new YTMusic();

// Initialize (required before any calls)
await ytmusic.initialize();

// Fetch a playlist by ID
const playlist = await ytmusic.getPlaylist('PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf');
console.log(playlist.name);       // Playlist title
console.log(playlist.tracks);     // Array of track objects

// Each track contains:
// {
//   title: string,
//   artists: [{ name: string, id: string }],
//   album: { name: string, id: string },
//   duration: number (seconds),
//   videoId: string,
//   thumbnails: [...],
//   isAvailable: boolean,
//   likeStatus: string
// }
```

#### Parsing YTMusic URLs

YouTube Music playlist URLs come in several formats:

```
https://music.youtube.com/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf
https://music.youtube.com/watch?v=abc&list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf
https://www.youtube.com/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf
```

Extract the `list` parameter (the playlist ID) from the URL:

```typescript
function extractPlaylistId(url: string): string {
  const urlObj = new URL(url);
  return urlObj.searchParams.get('list')!;
}

// Usage
const url = 'https://music.youtube.com/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf';
const playlistId = extractPlaylistId(url);
const playlist = await ytmusic.getPlaylist(playlistId);
```

#### Search Tracks (for matching)

```typescript
const searchResults = await ytmusic.search('Bohemian Rhapsody Queen', 'songs');
// Returns array of SongDetailed objects with:
// { title, artists, album, duration, videoId, thumbnails }
```

#### Cookie Setup (Recommended for Rate Limits)

```typescript
import YTMusic from 'ytmusic-api';

const ytmusic = new YTMusic();

// Optional: Set up cookie for better rate limits
// You can get cookies from browser dev tools on music.youtube.com
await ytmusic.initialize({
  cookies: {
    // Paste your browser cookies here
    HSID: 'your_hsid',
    SSID: 'your_ssid',
    APISID: 'your_apisid',
    SAPISID: 'your_sapisid',
  },
});
```

#### Pros & Cons

| Pros | Cons |
|------|------|
| Full TypeScript support | No official API — may break on YouTube changes |
| No auth needed for public playlists | Cookies recommended for stability |
| Playlist + search support | YTMusic sometimes mixes music videos with songs |
| Active maintenance | Video IDs, not track IDs (YTMusic quirk) |
| Lightweight, no dependencies | Rate limited without cookies |

---

### 3.2 youtubei.js / InnerTube Wrapper ✅ FULL-FEATURED ALTERNATIVE

A comprehensive JavaScript client for YouTube's private InnerTube API. Supports YouTube, YouTube Music, and YouTube Kids.

| Feature | Details |
|---------|---------|
| **npm** | `youtubei.js` (or `@np-dev/youtubei-js`) |
| **GitHub** | https://github.com/LuanRT/YouTube.js |
| **Docs** | https://www.ytjs.dev |
| **Auth** | None for public data |
| **Cost** | Free |
| **TypeScript** | Full TypeScript support |
| **Playlist fetch** | ✅ Full playlist data with pagination |

#### Installation

```bash
npm install youtubei.js
```

#### Usage

```typescript
import { Innertube } from 'youtubei.js';

const yt = await Innertube.create();

// Fetch a YouTube Music playlist
const playlist = await yt.getPlaylist('PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf');
console.log(playlist.info.title);
console.log(playlist.info.total_items);

// Iterate through videos
for await (const video of playlist.videos) {
  console.log(video.title, video.duration.seconds, 'seconds');
}

// Search on YouTube Music
const musicSearch = await yt.music.search('Bohemian Rhapsody', 'songs');
```

#### Pros & Cons

| Pros | Cons |
|------|------|
| Extremely full-featured | Larger bundle size |
| Supports YouTube AND YouTube Music | More complex API surface |
| Async iterators for pagination | Higher learning curve |
| Actively maintained | InnerTube API may change |
| No auth for public content | |

---

### 3.3 ytmusicapiJS (TypeScript Port)

A TypeScript reimplementation of the popular Python `ytmusicapi` library.

| Feature | Details |
|---------|---------|
| **npm** | `@codyduong/ytmusicapi` |
| **Docs** | https://codyduong.github.io/ytmusicapiJS |
| **Auth** | None for public playlists (cookie for auth features) |
| **TypeScript** | Native TypeScript |

```typescript
import { YTMusic } from '@codyduong/ytmusicapi';

const ytmusic = new YTMusic();
await ytmusic.initialize();
const playlist = await ytmusic.getPlaylist('PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf');
```

---

### 3.4 Invidious Public API

Invidious is an open-source alternative YouTube frontend that exposes a JSON API. No auth needed for public playlists.

| Feature | Details |
|---------|---------|
| **Cost** | Free (uses public instances) |
| **Auth** | None for public playlists |
| **Endpoint** | `GET /api/v1/playlists/:plid` |

#### Usage

```typescript
// Using any public Invidious instance
const instance = 'https://inv.tux.pizza'; // or other public instances

// Fetch playlist by ID
const response = await fetch(`${instance}/api/v1/playlists/${playlistId}`);
const playlist = await response.json();

// Response includes:
// {
//   title: string,
//   playlistId: string,
//   author: string,
//   authorId: string,
//   videoCount: number,
//   videos: [{
//     title: string,
//     videoId: string,
//     author: string,
//     lengthSeconds: number,
//     videoThumbnails: [...]
//   }],
//   continuation: string // for pagination
// }
```

**Public instances**: `https://inv.tux.pizza`, `https://vid.puffyan.us`, `https://invidious.fdn.fr`
⚠️ **Warning**: Public instances can be slow, unreliable, or shut down. Not recommended for production use unless you self-host.

---

### 3.5 Piped Public API

Similar to Invidious, Piped is a privacy-focused YouTube frontend with a public API.

```typescript
const instance = 'https://pipedapi.kavin.rocks';

// Fetch playlist
const response = await fetch(`${instance}/playlists/${playlistId}`);
const data = await response.json();

// Response shape:
// {
//   name: string,
//   url: string,
//   uploaderName: string,
//   uploaderUrl: string,
//   videos: [{ url, title, uploader, duration, thumbnail }],
//   nextpage: string // for pagination
// }
```

⚠️ Same reliability warnings as Invidious. Use for prototyping, not production.

---

### 3.6 YTMusic Approach Comparison

| Approach | Auth | Data Quality | Reliability | Bundle Size | Best For |
|----------|------|-------------|-------------|-------------|----------|
| `ytmusic-api` | Optional cookies | Good | High | Small | Production use |
| `youtubei.js` | None | Excellent | High | Large | Full YT + YTM integration |
| `ytmusicapiJS` | Optional cookies | Good | Medium | Medium | Python API parity |
| Invidious API | None | Basic | Low | N/A (HTTP) | Prototyping |
| Piped API | None | Basic | Low | N/A (HTTP) | Prototyping |

**Recommended**: `ytmusic-api` for simplicity, `youtubei.js` if you need YouTube + YouTube Music integration.

---

## 4. Fuzzy Search Libraries for Track Matching

When ISRC matching fails (which is common), you need fuzzy string matching to match track titles and artist names across platforms. Here are the best options:

### 4.1 fuse.js ✅ BEST FOR OBJECT SEARCH

**The most popular and feature-rich fuzzy search library for JavaScript.** Designed for searching through arrays of objects using fuzzy matching on specified keys.

| Feature | Details |
|---------|---------|
| **npm** | `fuse.js` |
| **Size** | ~25KB (minified + gzipped) |
| **Dependencies** | Zero |
| **TypeScript** | Built-in |
| **Website** | https://www.fusejs.io |

#### Installation

```bash
npm install fuse.js
```

#### Usage for Track Matching

```typescript
import Fuse from 'fuse.js';

// Define track type
interface Track {
  title: string;
  artist: string;
  album: string;
  duration: number; // ms
}

// Source tracks (e.g., from Spotify)
const sourceTracks: Track[] = [
  { title: 'Bohemian Rhapsody', artist: 'Queen', album: 'A Night at the Opera', duration: 354400 },
  { title: 'Blinding Lights', artist: 'The Weeknd', album: 'After Hours', duration: 200040 },
];

// Target tracks (e.g., from YTMusic)
const targetTracks: Track[] = [
  { title: 'Bohemian Rhapsody (Remastered)', artist: 'Queen', album: 'A Night at the Opera', duration: 355000 },
  { title: 'Blinding Lights', artist: 'The Weeknd', album: 'After Hours (Deluxe)', duration: 200040 },
  { title: 'Bohemian Rhapsody - Live', artist: 'Queen', album: 'Live Killers', duration: 361000 },
];

// Configure Fuse to search on title and artist
const fuse = new Fuse(targetTracks, {
  keys: [
    { name: 'title', weight: 0.5 },
    { name: 'artist', weight: 0.3 },
    { name: 'album', weight: 0.2 },
  ],
  threshold: 0.3, // Lower = stricter matching (0.0 exact, 1.0 anything)
  includeScore: true,
});

// Search for each source track in the target
for (const sourceTrack of sourceTracks) {
  const results = fuse.search(`${sourceTrack.title} ${sourceTrack.artist}`);
  const bestMatch = results[0];

  if (bestMatch && bestMatch.score < 0.3) {
    console.log(`✅ Match: "${sourceTrack.title}" → "${bestMatch.item.title}" (score: ${bestMatch.score})`);
  } else {
    console.log(`❌ No match for: "${sourceTrack.title}"`);
  }
}
```

#### Key Configuration Options

```typescript
const fuse = new Fuse(tracks, {
  keys: ['title', 'artist'],     // Fields to search
  threshold: 0.3,                // 0.0 = exact, 0.4 = good fuzzy, 1.0 = match anything
  includeScore: true,            // Include match score in results
  includeMatches: true,          // Include match details
  minMatchCharLength: 2,         // Minimum chars to match
  shouldSort: true,              // Sort by score
  findAllMatches: false,         // Only return best match per item
  ignoreLocation: false,         // Consider distance between matches
  useExtendedSearch: false,      // Enable extended search syntax
  getFn: (obj, path) => {
    // Custom getter — useful for nested artist arrays
    const value = obj[path[0]];
    return Array.isArray(value) ? value.join(', ') : value;
  },
});
```

#### Pros & Cons

| Pros | Cons |
|------|------|
| Object-based search (search multiple fields) | Not the fastest for large datasets |
| Highly configurable scoring | Doesn't do substring matching by default |
| Zero dependencies | Threshold tuning can be tricky |
| TypeScript support | No built-in duration comparison |
| Well documented | |

---

### 4.2 string-similarity ✅ BEST FOR PAIRWISE COMPARISON

**Simple, lightweight library for comparing two strings.** Uses Dice's Coefficient (bigram similarity), which returns a score between 0 and 1.

| Feature | Details |
|---------|---------|
| **npm** | `string-similarity` |
| **Size** | ~5KB |
| **Dependencies** | Zero |

#### Installation

```bash
npm install string-similarity
```

#### Usage

```typescript
import { compareTwoStrings, findBestMatch } from 'string-similarity';

// Compare two strings (returns 0.0 to 1.0)
const score = compareTwoStrings('Bohemian Rhapsody', 'Bohemian Rhapsody (Remastered)');
console.log(score); // ~0.85 (high similarity)

// Find best match from a list
const targetTitles = [
  'Bohemian Rhapsody (Remastered)',
  'Bohemian Rhapsody - Live',
  'Blinding Lights',
];

const match = findBestMatch('Bohemian Rhapsody', targetTitles);
console.log(match.bestMatch);    // { target: 'Bohemian Rhapsody (Remastered)', rating: 0.85 }
console.log(match.bestMatchIndex); // 0
console.log(match.ratings);      // Array of all ratings
```

#### Pros & Cons

| Pros | Cons |
|------|------|
| Extremely simple API | Only compares single strings (not objects) |
| Very lightweight | No built-in multi-field matching |
| Fast | Bigram-based (may miss some matches) |
| Zero dependencies | No TypeScript types (needs @types) |

---

### 4.3 fast-levenshtein

**Pure JavaScript Levenshtein distance calculation.** Returns the edit distance between two strings.

| Feature | Details |
|---------|---------|
| **npm** | `fast-levenshtein` |
| **Size** | ~3KB |
| **Dependencies** | Zero |
| **TypeScript** | Built-in |

```typescript
import levenshtein from 'fast-levenshtein';

const distance = levenshtein.get('Bohemian Rhapsody', 'Bohemian Rhapsody (Remastered)');
console.log(distance); // 14 (number of edits needed)

// Convert to similarity percentage
function similarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  return 1 - levenshtein.get(a, b) / maxLen;
}

console.log(similarity('Blinding Lights', 'Blinding Lights'));     // 1.0
console.log(similarity('Blinding Lights', 'Blind Lights'));        // ~0.89
console.log(similarity('Hello', 'Goodbye'));                       // ~0.17
```

---

### 4.4 fast-fuzzy

**Lightning-quick fuzzy searching using a modified Sellers algorithm.** Best for large datasets where performance matters.

| Feature | Details |
|---------|---------|
| **npm** | `fast-fuzzy` |
| **Size** | ~5KB |
| **Dependencies** | Zero |

```typescript
import { Searcher } from 'fast-fuzzy';

const searcher = new Searcher(tracks, {
  keySelector: (track) => `${track.title} ${track.artist}`,
  threshold: 0.6,
});

const results = searcher.search('Bohemian Rhapsody Queen');
```

---

### 4.5 FlexSearch

**The fastest full-text search library for JavaScript.** Not strictly "fuzzy" — it's more of an indexed full-text search engine. Best if you need to search through thousands of tracks.

| Feature | Details |
|---------|---------|
| **npm** | `flexsearch` |
| **Size** | ~7KB (module) |
| **Dependencies** | Zero |
| **Best for** | Large datasets (10,000+ tracks) |

```typescript
import { Index } from 'flexsearch';

const index = new Index({ tokenize: 'forward' });

// Add tracks
tracks.forEach((track, i) => {
  index.add(i, `${track.title} ${track.artist}`);
});

// Search
const results = index.search('Bohemian Rhapsody');
```

---

### 4.6 Fuzzy Library Comparison

| Library | Size | Speed | Object Search | TypeScript | Best Use Case |
|---------|------|-------|---------------|------------|---------------|
| **fuse.js** | 25KB | Medium | ✅ Yes | ✅ Built-in | Multi-field track matching |
| **string-similarity** | 5KB | Fast | ❌ No | ❌ Needs @types | Simple pairwise comparison |
| **fast-levenshtein** | 3KB | Fastest | ❌ No | ✅ Built-in | Custom scoring algorithms |
| **fast-fuzzy** | 5KB | Very fast | ✅ Yes | ✅ Built-in | Large dataset performance |
| **FlexSearch** | 7KB | Ultra fast | ❌ No | ✅ Built-in | Large indexed search |

**Recommended**: Use **`string-similarity`** for simple title/artist comparison (it's what most playlist converters use), and **`fuse.js`** if you want multi-field weighted matching out of the box. For the best results, combine both approaches with a custom scoring function.

---

## 5. Cross-Platform Track Matching Strategy

This is the most critical part of the playlist sync pipeline. Here's the recommended matching strategy, used by the best open-source tools:

### 5.1 Matching Pipeline (Priority Order)

```
1. ISRC Match (exact) ──────────── Score: 1.0 (100%)
   │
2. Title + Artist Fuzzy Match ─── Score: 0.7-0.95
   │  - Clean both strings (lowercase, remove special chars)
   │  - Use string-similarity on both title and artist
   │  - Combine scores: title * 0.6 + artist * 0.4
   │
3. Title-only Fuzzy Match ──────── Score: 0.5-0.85
   │  - If artist match fails, try title only
   │  - Higher threshold needed to avoid false positives
   │
4. Duration Filter ──────────────── Applied as secondary check
   │  - |duration_source - duration_target| < 5 seconds
   │  - Helps eliminate remix/live version mismatches
```

### 5.2 String Normalization (Critical for Good Results)

Before comparing, ALWAYS normalize strings:

```typescript
function normalize(str: string): string {
  return str
    .toLowerCase()
    .replace(/[''`]/g, '')           // Remove quotes
    .replace(/[()[\]{}]/g, '')       // Remove brackets
    .replace(/[-–—]/g, ' ')         // Replace dashes with spaces
    .replace(/[.,;:!?]/g, '')       // Remove punctuation
    .replace(/\s+/g, ' ')           // Collapse whitespace
    .replace(/feat\.?/g, 'ft')      // Normalize "feat." to "ft"
    .replace(/vs\.?/g, 'vs')        // Normalize "vs."
    .trim();
}

// Examples:
normalize("Bohemian Rhapsody (Remastered 2011)")     // "bohemian rhapsody remastered 2011"
normalize("Blinding Lights - The Weeknd (Official)")  // "blinding lights the weeknd official"
normalize("Don't Stop Me Now")                        // "dont stop me now"
normalize("DJ Khaled ft. Drake")                      // "dj khaled ft drake"
```

### 5.3 Complete Matching Function

```typescript
import { compareTwoStrings } from 'string-similarity';

interface NormalizedTrack {
  title: string;
  artist: string;
  album?: string;
  isrc?: string;
  duration?: number; // milliseconds
}

function matchTrack(
  source: NormalizedTrack,
  candidates: NormalizedTrack[]
): { match: NormalizedTrack; score: number; method: string } | null {
  // Step 1: ISRC exact match (if available)
  if (source.isrc) {
    const isrcMatch = candidates.find(c => c.isrc === source.isrc);
    if (isrcMatch) {
      return { match: isrcMatch, score: 1.0, method: 'isrc' };
    }
  }

  // Step 2: Duration filter (within 5 seconds)
  const durationFiltered = source.duration
    ? candidates.filter(c =>
        c.duration && Math.abs(c.duration - source.duration) < 5000
      )
    : candidates;

  // Step 3: Fuzzy match on title + artist
  let bestScore = 0;
  let bestMatch: NormalizedTrack | null = null;

  for (const candidate of durationFiltered) {
    const titleScore = compareTwoStrings(
      normalize(source.title),
      normalize(candidate.title)
    );
    const artistScore = compareTwoStrings(
      normalize(source.artist),
      normalize(candidate.artist)
    );

    // Weighted combination (title matters more than artist)
    const combinedScore = titleScore * 0.6 + artistScore * 0.4;

    if (combinedScore > bestScore) {
      bestScore = combinedScore;
      bestMatch = candidate;
    }
  }

  // Step 4: Apply threshold
  const THRESHOLD = 0.65;
  if (bestMatch && bestScore >= THRESHOLD) {
    return {
      match: bestMatch,
      score: bestScore,
      method: 'fuzzy',
    };
  }

  return null;
}
```

### 5.4 Bulk Match Function (For Full Playlist Sync)

```typescript
function matchPlaylists(
  sourceTracks: NormalizedTrack[],
  targetTracks: NormalizedTrack[]
): {
  matched: { source: NormalizedTrack; target: NormalizedTrack; score: number; method: string }[];
  unmatched: NormalizedTrack[];
} {
  const matched = [];
  const unmatched = [];

  for (const sourceTrack of sourceTracks) {
    const result = matchTrack(sourceTrack, targetTracks);
    if (result) {
      matched.push({
        source: sourceTrack,
        target: result.match,
        score: result.score,
        method: result.method,
      });
      // Remove matched target to prevent duplicate matching
      const idx = targetTracks.indexOf(result.match);
      if (idx > -1) targetTracks.splice(idx, 1);
    } else {
      unmatched.push(sourceTrack);
    }
  }

  return { matched, unmatched };
}
```

---

## 6. Recommended Architecture

### 6.1 Complete Pipeline

```
User Input: Spotify or YTMusic playlist URL
    │
    ├─► Parse URL → Extract playlist ID
    │     ├─ spotify-uri (for Spotify links)
    │     └─ URL parser (for YTMusic links — extract 'list' param)
    │
    ├─► Fetch Playlist Tracks
    │     ├─ Spotify → spotify-url-info (no auth) or spotify-web-api-node (OAuth)
    │     └─ YTMusic → ytmusic-api or youtubei.js
    │
    ├─► Normalize Tracks
    │     └─ Clean titles, artists, extract ISRC, parse durations
    │
    ├─► Search Target Platform
    │     ├─ Spotify → GET /v1/search?q={title}+{artist}&type=track
    │     ├─ YTMusic → ytmusic.search(title artist, 'songs')
    │     ├─ Tidal  → hifi-api /search endpoint
    │     └─ Qobuz  → hifi-api /search endpoint
    │
    ├─► Match Tracks (ISRC → Fuzzy)
    │     ├─ Primary: ISRC exact match
    │     ├─ Secondary: string-similarity (title + artist)
    │     ├─ Tertiary: fuse.js (multi-field fallback)
    │     └─ Filter: Duration ±5 seconds
    │
    └─► Report Results
          ├─ Matched tracks (with confidence scores)
          ├─ Unmatched tracks (with search suggestions)
          └─ Ambiguous matches (multiple close candidates)
```

### 6.2 Recommended npm Dependencies

```json
{
  "dependencies": {
    "spotify-url-info": "^3.0.0",
    "spotify-uri": "^2.3.0",
    "ytmusic-api": "^5.3.1",
    "string-similarity": "^4.0.4",
    "fuse.js": "^7.0.0",
    "fast-levenshtein": "^3.0.0",
    "p-limit": "^4.0.0"
  },
  "devDependencies": {
    "@types/string-similarity": "^4.0.2"
  }
}
```

### 6.3 Why This Stack?

- **`spotify-url-info`**: Zero-auth access to Spotify playlists. Users paste a link and get tracks instantly. No app registration or OAuth flow needed.
- **`ytmusic-api`**: The most mature YTMusic npm package. TypeScript-first, well-maintained, handles cookies for better rate limits.
- **`string-similarity`**: Simple, fast Dice's Coefficient comparison. Used by most open-source playlist converters (SyncDisBoi, spotify_to_ytmusic). Proven in production.
- **`fuse.js`**: Backup for when you need multi-field weighted matching (e.g., matching on title + artist + album simultaneously).
- **`p-limit`**: Essential for rate-limiting API calls. Both Spotify and YTMusic will block you if you hammer them.

---

## 7. Complete Code Examples

### 7.1 Fetch Spotify Playlist (No Auth)

```typescript
import spotify from 'spotify-url-info';
import fetch from 'node-fetch';

const spotifyInfo = spotify(fetch);

export async function fetchSpotifyPlaylist(url: string) {
  // Validate and parse URL
  if (!url.includes('spotify.com') && !url.includes('spotify:')) {
    throw new Error('Invalid Spotify URL');
  }

  const data = await spotifyInfo.getData(url);

  if (data.type !== 'playlist') {
    throw new Error(`Expected playlist, got ${data.type}`);
  }

  // Normalize tracks
  const tracks = (data.tracks?.items || []).map((item: any) => ({
    title: item.track?.name || '',
    artist: item.track?.artists?.map((a: any) => a.name).join(', ') || '',
    album: item.track?.album?.name || '',
    duration: item.track?.duration_ms || 0,
    isrc: null, // Not available via spotify-url-info
    spotifyId: item.track?.id || null,
    artwork: item.track?.album?.images?.[0]?.url || null,
  }));

  return {
    name: data.name,
    description: data.description,
    trackCount: tracks.length,
    tracks,
  };
}

// Usage
const playlist = await fetchSpotifyPlaylist(
  'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M'
);
console.log(`Found ${playlist.trackCount} tracks in "${playlist.name}"`);
```

### 7.2 Fetch YTMusic Playlist (No Auth)

```typescript
import YTMusic from 'ytmusic-api';

let ytmusicInstance: YTMusic | null = null;

async function getYTMusic(): Promise<YTMusic> {
  if (!ytmusicInstance) {
    ytmusicInstance = new YTMusic();
    await ytmusicInstance.initialize();
  }
  return ytmusicInstance;
}

function extractPlaylistId(url: string): string {
  try {
    const urlObj = new URL(url);
    const listId = urlObj.searchParams.get('list');
    if (listId) return listId;
  } catch {}
  // Maybe it's just a bare ID
  if (/^[A-Za-z0-9_-]{10,}$/.test(url)) return url;
  throw new Error('Could not extract playlist ID from URL');
}

export async function fetchYTMusicPlaylist(url: string) {
  const ytmusic = await getYTMusic();
  const playlistId = extractPlaylistId(url);

  const playlist = await ytmusic.getPlaylist(playlistId);

  const tracks = (playlist.tracks || []).map((track: any) => ({
    title: track.title || '',
    artist: track.artists?.map((a: any) => a.name).join(', ') || '',
    album: track.album?.name || '',
    duration: (track.duration || 0) * 1000, // Convert seconds to ms
    isrc: null,
    videoId: track.videoId || null,
    artwork: track.thumbnails?.[0]?.url || null,
  }));

  return {
    name: playlist.name,
    description: playlist.description || '',
    trackCount: tracks.length,
    tracks,
  };
}

// Usage
const playlist = await fetchYTMusicPlaylist(
  'https://music.youtube.com/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf'
);
console.log(`Found ${playlist.trackCount} tracks in "${playlist.name}"`);
```

### 7.3 Complete Playlist Sync (Spotify → YTMusic)

```typescript
import { compareTwoStrings } from 'string-similarity';
import pLimit from 'p-limit';
import YTMusic from 'ytmusic-api';

const limit = pLimit(5); // Max 5 concurrent API calls

async function syncSpotifyToYTMusic(
  spotifyTracks: NormalizedTrack[],
  ytmusic: YTMusic,
  createPlaylist: boolean = true
): Promise<{
  matched: { source: NormalizedTrack; target: any; score: number }[];
  unmatched: NormalizedTrack[];
}> {
  const matched = [];
  const unmatched = [];

  for (const sourceTrack of spotifyTracks) {
    // Search YTMusic for each track
    const query = `${sourceTrack.title} ${sourceTrack.artist}`;
    const searchResults = await limit(() => ytmusic.search(query, 'songs'));

    if (!searchResults || searchResults.length === 0) {
      unmatched.push(sourceTrack);
      continue;
    }

    // Find best match using fuzzy comparison
    let bestScore = 0;
    let bestResult = null;

    for (const result of searchResults.slice(0, 5)) {
      const titleScore = compareTwoStrings(
        normalize(sourceTrack.title),
        normalize(result.title)
      );
      const artistScore = compareTwoStrings(
        normalize(sourceTrack.artist),
        normalize(result.artists?.map(a => a.name).join(', ') || '')
      );

      // Duration check
      const durationDiff = sourceTrack.duration
        ? Math.abs(sourceTrack.duration - (result.duration || 0) * 1000)
        : Infinity;

      const combinedScore = titleScore * 0.6 + artistScore * 0.4;

      if (combinedScore > bestScore && durationDiff < 5000) {
        bestScore = combinedScore;
        bestResult = result;
      }
    }

    if (bestResult && bestScore >= 0.65) {
      matched.push({ source: sourceTrack, target: bestResult, score: bestScore });
    } else {
      unmatched.push(sourceTrack);
    }
  }

  return { matched, unmatched };
}
```

### 7.4 Spotify URL Validation & Parsing

```typescript
import { parse } from 'spotify-uri';

export function parseSpotifyUrl(url: string): {
  type: string;
  id: string;
} | null {
  try {
    const parsed = parse(url);
    return { type: parsed.type, id: parsed.id };
  } catch {
    // Try manual extraction for open.spotify.com URLs
    const match = url.match(/open\.spotify\.com\/(playlist|track|album)\/([a-zA-Z0-9]+)/);
    if (match) {
      return { type: match[1], id: match[2] };
    }
    return null;
  }
}

// Usage
parseSpotifyUrl('https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M?si=abc');
// { type: 'playlist', id: '37i9dQZF1DXcBWIGoYBM5M' }

parseSpotifyUrl('https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT');
// { type: 'track', id: '4cOdK2wGLETKBW3PvgPWqT' }
```

---

## 8. Limitations & Gotchas

### Spotify Limitations

1. **Client Credentials = No Playlist Tracks** (as of March 2026). This is a breaking change. You cannot use the free server-to-server flow to get playlist items anymore. Use `spotify-url-info` or require user OAuth.

2. **`spotify-url-info` has no ISRC**. Since ISRC is the most reliable cross-platform identifier, losing it means you'll rely more on fuzzy matching, which has ~85-90% accuracy vs ~98% with ISRC.

3. **Rate limiting**. Even without auth, Spotify will start returning 429 errors if you make too many requests. Implement exponential backoff and respect `Retry-After` headers.

4. **Pagination**. Spotify API returns max 100 tracks per request (when using OAuth). Large playlists need offset-based pagination. `spotify-url-info` may handle this automatically but verify with large playlists.

5. **Private playlists**. `spotify-url-info` can only access public playlists. Private playlists require user OAuth with the `playlist-read-private` scope.

### YouTube Music Limitations

1. **No official API**. All YTMusic packages work by reverse-engineering YouTube's internal API. This means they can break at any time without notice.

2. **Music videos mixed with songs**. YTMusic search results often include official music videos, lyric videos, and covers alongside the actual album tracks. You need to filter these out, typically by checking if the title contains "(Official Music Video)", "(Lyric Video)", "- Topic", etc.

3. **Video IDs, not track IDs**. YTMusic doesn't have separate track IDs — everything is a video. The same song might have multiple video IDs (official audio, music video, live version). You need fuzzy matching + duration check to pick the right one.

4. **Cookie expiration**. Without cookies, YTMusic scraping works but with stricter rate limits. Cookies expire periodically and need to be refreshed.

5. **Region restrictions**. Some content on YTMusic is region-locked. The `ytmusic-api` package doesn't handle region bypassing.

### Fuzzy Matching Limitations

1. **85-90% accuracy** (without ISRC). Even with the best fuzzy matching, you'll miss some tracks. Common failure cases:
   - Same title, different artist (e.g., covers)
   - Slightly different titles across platforms (localization)
   - Featured artists listed differently ("ft." vs "feat." vs "featuring")

2. **Threshold tuning is critical**. Set threshold too low and you get false positives. Set it too high and you miss valid matches. The sweet spot is typically 0.60-0.70.

3. **Performance**. Fuzzy matching is O(n*m) where n is source tracks and m is search results per track. For a 1000-track playlist with 5 search results each, that's 5000 comparisons. Still fast for JavaScript but use `p-limit` for API calls.

4. **Duration mismatch**. Don't rely solely on duration — different masterings can have 5-10 second differences. But a 30+ second difference is almost certainly a different version.

---

## Quick Reference: URL Format Patterns

### Spotify URL Patterns

```
https://open.spotify.com/playlist/{ID}
https://open.spotify.com/track/{ID}
https://open.spotify.com/album/{ID}
spotify:playlist:{ID}
spotify:track:{ID}
```

### YouTube Music URL Patterns

```
https://music.youtube.com/playlist?list={PLAYLIST_ID}
https://music.youtube.com/watch?v={VIDEO_ID}&list={PLAYLIST_ID}
https://www.youtube.com/playlist?list={PLAYLIST_ID}
https://youtu.be/{VIDEO_ID}?list={PLAYLIST_ID}
```

### Extract IDs

```typescript
// Spotify
import { parse } from 'spotify-uri';
const { id, type } = parse(spotifyUrl);

// YTMusic
const playlistId = new URL(ytmusicUrl).searchParams.get('list');
```
