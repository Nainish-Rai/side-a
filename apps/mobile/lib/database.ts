import * as SQLite from "expo-sqlite";
import type { Track } from "@side-a/shared/api/types";

const DB_NAME = "sidea.db";

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DB_NAME).then(async (database) => {
      await database.execAsync(`
        CREATE TABLE IF NOT EXISTS favorites (
          id INTEGER PRIMARY KEY,
          data TEXT NOT NULL,
          added_at INTEGER NOT NULL DEFAULT (unixepoch())
        );
        CREATE TABLE IF NOT EXISTS recently_played (
          id INTEGER PRIMARY KEY,
          data TEXT NOT NULL,
          played_at INTEGER NOT NULL DEFAULT (unixepoch())
        );
      `);
      return database;
    });
  }
  return dbPromise;
}

export async function getFavorites(): Promise<Track[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<{ data: string }>(
    "SELECT data FROM favorites ORDER BY added_at DESC"
  );
  return rows.map((r) => JSON.parse(r.data));
}

export async function addFavorite(track: Track): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    "INSERT OR REPLACE INTO favorites (id, data, added_at) VALUES (?, ?, unixepoch())",
    [track.id, JSON.stringify(track)]
  );
}

export async function removeFavorite(trackId: number): Promise<void> {
  const database = await getDatabase();
  await database.runAsync("DELETE FROM favorites WHERE id = ?", [trackId]);
}

export async function isFavorite(trackId: number): Promise<boolean> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{ id: number }>(
    "SELECT id FROM favorites WHERE id = ?",
    [trackId]
  );
  return !!row;
}

export async function getRecentlyPlayed(limit = 50): Promise<Track[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<{ data: string }>(
    "SELECT data FROM recently_played ORDER BY played_at DESC LIMIT ?",
    [limit]
  );
  return rows.map((r) => JSON.parse(r.data));
}

export async function addRecentlyPlayed(track: Track): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    "INSERT OR REPLACE INTO recently_played (id, data, played_at) VALUES (?, ?, unixepoch())",
    [track.id, JSON.stringify(track)]
  );
}
