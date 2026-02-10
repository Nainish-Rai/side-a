import * as SQLite from "expo-sqlite";
import type { Track } from "@side-a/shared/api/types";

const db = SQLite.openDatabaseSync("sidea.db");

// Migrate: old table lacks track_json column — drop and recreate
const columns = db.getAllSync<{ name: string }>(
  `PRAGMA table_info(recently_played)`
);
if (columns.length > 0 && !columns.some((c) => c.name === "track_json")) {
  db.execSync(`DROP TABLE recently_played`);
}

db.execSync(`
  CREATE TABLE IF NOT EXISTS recently_played (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    track_id INTEGER NOT NULL UNIQUE,
    title TEXT NOT NULL,
    artist_name TEXT,
    album_title TEXT,
    cover_id TEXT,
    duration REAL,
    audio_quality TEXT,
    played_at TEXT DEFAULT (datetime('now')),
    track_json TEXT NOT NULL
  )
`);

export function addRecentlyPlayed(track: Track): void {
  const artistName = track.artist?.name ?? track.artists?.[0]?.name ?? null;
  const albumTitle = track.album?.title ?? null;
  const coverId = track.album?.cover ?? null;

  db.runSync(
    `INSERT INTO recently_played (track_id, title, artist_name, album_title, cover_id, duration, audio_quality, played_at, track_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), ?)
     ON CONFLICT(track_id) DO UPDATE SET played_at = datetime('now'), track_json = excluded.track_json`,
    [
      track.id,
      track.title,
      artistName,
      albumTitle,
      coverId,
      track.duration,
      track.audioQuality ?? null,
      JSON.stringify(track),
    ]
  );
}

export function getRecentlyPlayed(limit: number = 20): Track[] {
  const rows = db.getAllSync<{ track_json: string }>(
    `SELECT track_json FROM recently_played ORDER BY played_at DESC LIMIT ?`,
    [limit]
  );
  return rows.map((row) => JSON.parse(row.track_json) as Track);
}

export function clearRecentlyPlayed(): void {
  db.runSync(`DELETE FROM recently_played`);
}
