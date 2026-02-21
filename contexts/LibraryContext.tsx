"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Album, Track } from "@/lib/api/types";

interface LibraryState {
  likedTracks: Track[];
  savedAlbums: Album[];
  recentlyPlayed: Track[];
}

interface LibraryContextValue extends LibraryState {
  isTrackLiked: (trackId: number) => boolean;
  toggleTrackLike: (track: Track) => void;
  removeLikedTrack: (trackId: number) => void;
  clearLikedTracks: () => void;
  isAlbumSaved: (albumId: number) => boolean;
  toggleAlbumSave: (album: Album) => void;
  removeSavedAlbum: (albumId: number) => void;
  clearSavedAlbums: () => void;
  addRecentlyPlayed: (track: Track) => void;
  removeRecentlyPlayed: (trackId: number) => void;
  clearRecent: () => void;
}

const STORAGE_KEY = "side-a-library";
export const RECENTLY_PLAYED_CAP = 100;

const defaultState: LibraryState = {
  likedTracks: [],
  savedAlbums: [],
  recentlyPlayed: [],
};

const LibraryContext = createContext<LibraryContextValue | undefined>(undefined);

function loadInitialState(): LibraryState {
  if (typeof window === "undefined") {
    return defaultState;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;

    const parsed = JSON.parse(raw) as Partial<LibraryState>;
    return {
      likedTracks: Array.isArray(parsed.likedTracks) ? parsed.likedTracks : [],
      savedAlbums: Array.isArray(parsed.savedAlbums) ? parsed.savedAlbums : [],
      recentlyPlayed: Array.isArray(parsed.recentlyPlayed)
        ? parsed.recentlyPlayed
        : [],
    };
  } catch (error) {
    console.error("Failed to load library state from localStorage:", error);
    return defaultState;
  }
}

function dedupeById<T extends { id: number | string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];

  for (const item of items) {
    const key = String(item.id);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }

  return result;
}

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LibraryState>(loadInitialState);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error("Failed to save library state to localStorage:", error);
    }
  }, [state]);

  const isTrackLiked = useCallback(
    (trackId: number) => state.likedTracks.some((track) => track.id === trackId),
    [state.likedTracks],
  );

  const toggleTrackLike = useCallback((track: Track) => {
    setState((prev) => {
      if (prev.likedTracks.some((item) => item.id === track.id)) {
        return {
          ...prev,
          likedTracks: prev.likedTracks.filter((item) => item.id !== track.id),
        };
      }

      return {
        ...prev,
        likedTracks: dedupeById([track, ...prev.likedTracks]),
      };
    });
  }, []);

  const removeLikedTrack = useCallback((trackId: number) => {
    setState((prev) => ({
      ...prev,
      likedTracks: prev.likedTracks.filter((track) => track.id !== trackId),
    }));
  }, []);

  const clearLikedTracks = useCallback(() => {
    setState((prev) => ({ ...prev, likedTracks: [] }));
  }, []);

  const isAlbumSaved = useCallback(
    (albumId: number) => state.savedAlbums.some((album) => album.id === albumId),
    [state.savedAlbums],
  );

  const toggleAlbumSave = useCallback((album: Album) => {
    setState((prev) => {
      if (prev.savedAlbums.some((item) => item.id === album.id)) {
        return {
          ...prev,
          savedAlbums: prev.savedAlbums.filter((item) => item.id !== album.id),
        };
      }

      return {
        ...prev,
        savedAlbums: dedupeById([album, ...prev.savedAlbums]),
      };
    });
  }, []);

  const removeSavedAlbum = useCallback((albumId: number) => {
    setState((prev) => ({
      ...prev,
      savedAlbums: prev.savedAlbums.filter((album) => album.id !== albumId),
    }));
  }, []);

  const clearSavedAlbums = useCallback(() => {
    setState((prev) => ({ ...prev, savedAlbums: [] }));
  }, []);

  const addRecentlyPlayed = useCallback((track: Track) => {
    setState((prev) => ({
      ...prev,
      recentlyPlayed: dedupeById([track, ...prev.recentlyPlayed]).slice(
        0,
        RECENTLY_PLAYED_CAP,
      ),
    }));
  }, []);

  const removeRecentlyPlayed = useCallback((trackId: number) => {
    setState((prev) => ({
      ...prev,
      recentlyPlayed: prev.recentlyPlayed.filter((track) => track.id !== trackId),
    }));
  }, []);

  const clearRecent = useCallback(() => {
    setState((prev) => ({ ...prev, recentlyPlayed: [] }));
  }, []);

  const value = useMemo<LibraryContextValue>(
    () => ({
      ...state,
      isTrackLiked,
      toggleTrackLike,
      removeLikedTrack,
      clearLikedTracks,
      isAlbumSaved,
      toggleAlbumSave,
      removeSavedAlbum,
      clearSavedAlbums,
      addRecentlyPlayed,
      removeRecentlyPlayed,
      clearRecent,
    }),
    [
      state,
      isTrackLiked,
      toggleTrackLike,
      removeLikedTrack,
      clearLikedTracks,
      isAlbumSaved,
      toggleAlbumSave,
      removeSavedAlbum,
      clearSavedAlbums,
      addRecentlyPlayed,
      removeRecentlyPlayed,
      clearRecent,
    ],
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary(): LibraryContextValue {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error("useLibrary must be used within LibraryProvider");
  }
  return context;
}
