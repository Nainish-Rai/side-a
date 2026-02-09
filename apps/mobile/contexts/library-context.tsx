import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import * as db from "@/lib/database";
import type { Track } from "@side-a/shared/api/types";

interface LibraryContextValue {
  favorites: Track[];
  recentlyPlayed: Track[];
  isFavorite: (trackId: number) => boolean;
  toggleFavorite: (track: Track) => void;
  addToRecentlyPlayed: (track: Track) => void;
  isLoading: boolean;
}

const LibraryContext = createContext<LibraryContextValue | null>(null);

export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<Track[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<Track[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [favs, recents] = await Promise.all([
        db.getFavorites(),
        db.getRecentlyPlayed(),
      ]);
      setFavorites(favs);
      setFavoriteIds(new Set(favs.map((t) => t.id)));
      setRecentlyPlayed(recents);
      setIsLoading(false);
    })();
  }, []);

  const isFavorite = useCallback(
    (trackId: number) => favoriteIds.has(trackId),
    [favoriteIds]
  );

  const toggleFavorite = useCallback(
    async (track: Track) => {
      if (favoriteIds.has(track.id)) {
        await db.removeFavorite(track.id);
        setFavorites((prev) => prev.filter((t) => t.id !== track.id));
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          next.delete(track.id);
          return next;
        });
      } else {
        await db.addFavorite(track);
        setFavorites((prev) => [track, ...prev]);
        setFavoriteIds((prev) => new Set(prev).add(track.id));
      }
    },
    [favoriteIds]
  );

  const addToRecentlyPlayed = useCallback(async (track: Track) => {
    await db.addRecentlyPlayed(track);
    setRecentlyPlayed((prev) => {
      const filtered = prev.filter((t) => t.id !== track.id);
      return [track, ...filtered].slice(0, 50);
    });
  }, []);

  const value = useMemo(
    () => ({ favorites, recentlyPlayed, isFavorite, toggleFavorite, addToRecentlyPlayed, isLoading }),
    [favorites, recentlyPlayed, isFavorite, toggleFavorite, addToRecentlyPlayed, isLoading]
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary() {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error("useLibrary must be used within LibraryProvider");
  return ctx;
}
