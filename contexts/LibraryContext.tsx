"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
const DEVICE_ID_KEY = "side-a-device-id";
const SYNC_DEBOUNCE_MS = 1200;
export const RECENTLY_PLAYED_CAP = 100;
const DEFAULT_SYNC_ENDPOINT = "/api/library/state";

const defaultState: LibraryState = {
  likedTracks: [],
  savedAlbums: [],
  recentlyPlayed: [],
};

const LibraryContext = createContext<LibraryContextValue | undefined>(undefined);

interface LibrarySyncMeta {
  deviceId: string;
  isOnline: boolean;
  isBootstrapped: boolean;
  isSyncing: boolean;
  hasPendingSync: boolean;
  lastBootstrapAt: number | null;
  lastSyncedAt: number | null;
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeState(state: Partial<LibraryState> | null | undefined): LibraryState {
  return {
    likedTracks: dedupeById(Array.isArray(state?.likedTracks) ? state.likedTracks : []),
    savedAlbums: dedupeById(Array.isArray(state?.savedAlbums) ? state.savedAlbums : []),
    recentlyPlayed: dedupeById(
      Array.isArray(state?.recentlyPlayed) ? state.recentlyPlayed : [],
    ).slice(0, RECENTLY_PLAYED_CAP),
  };
}

function mergeStates(local: LibraryState, remote: LibraryState): LibraryState {
  return {
    likedTracks: dedupeById([...local.likedTracks, ...remote.likedTracks]),
    savedAlbums: dedupeById([...local.savedAlbums, ...remote.savedAlbums]),
    recentlyPlayed: dedupeById([
      ...local.recentlyPlayed,
      ...remote.recentlyPlayed,
    ]).slice(0, RECENTLY_PLAYED_CAP),
  };
}

function getSyncEndpoint(): string {
  return process.env.NEXT_PUBLIC_LIBRARY_SYNC_ENDPOINT?.trim() || DEFAULT_SYNC_ENDPOINT;
}

function ensureDeviceId(): string {
  if (typeof window === "undefined") {
    return "server";
  }

  const existing = localStorage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;

  const generated =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `device-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  localStorage.setItem(DEVICE_ID_KEY, generated);
  return generated;
}

async function fetchRemoteState(deviceId: string): Promise<LibraryState | null> {
  const endpoint = getSyncEndpoint();
  const url = new URL(endpoint, window.location.origin);
  url.searchParams.set("deviceId", deviceId);

  const response = await fetch(url.toString(), { method: "GET" });
  if (!response.ok) return null;

  const data = (await response.json()) as unknown;
  if (!isObjectRecord(data)) return null;

  const remoteState = isObjectRecord(data.state)
    ? (data.state as Partial<LibraryState>)
    : (data as Partial<LibraryState>);
  return normalizeState(remoteState);
}

async function pushRemoteState(deviceId: string, state: LibraryState): Promise<boolean> {
  const endpoint = getSyncEndpoint();
  const response = await fetch(endpoint, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deviceId, state }),
  });

  return response.ok;
}

function loadInitialState(): LibraryState {
  if (typeof window === "undefined") {
    return defaultState;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;

    const parsed = JSON.parse(raw) as Partial<LibraryState>;
    return normalizeState(parsed);
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
  const [syncMeta, setSyncMeta] = useState<LibrarySyncMeta>(() => ({
    deviceId: typeof window === "undefined" ? "server" : ensureDeviceId(),
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
    isBootstrapped: false,
    isSyncing: false,
    hasPendingSync: false,
    lastBootstrapAt: null,
    lastSyncedAt: null,
  }));
  const stateRef = useRef(state);
  const syncMetaRef = useRef(syncMeta);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    syncMetaRef.current = syncMeta;
  }, [syncMeta]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error("Failed to save library state to localStorage:", error);
    }
  }, [state]);

  const runPushSync = useCallback(async () => {
    const meta = syncMetaRef.current;
    if (!meta.isOnline || meta.isSyncing) return;

    setSyncMeta((prev) => ({ ...prev, isSyncing: true }));

    try {
      const ok = await pushRemoteState(meta.deviceId, stateRef.current);
      if (!ok) {
        setSyncMeta((prev) => ({ ...prev, isSyncing: false }));
        return;
      }
      setSyncMeta((prev) => ({
        ...prev,
        hasPendingSync: false,
        isSyncing: false,
        lastSyncedAt: Date.now(),
      }));
    } catch {
      setSyncMeta((prev) => ({ ...prev, isSyncing: false }));
    }
  }, []);

  const schedulePushSync = useCallback(() => {
    if (typeof window === "undefined") return;

    setSyncMeta((prev) => ({ ...prev, hasPendingSync: true }));

    if (syncTimerRef.current) {
      clearTimeout(syncTimerRef.current);
    }

    syncTimerRef.current = setTimeout(() => {
      void runPushSync();
    }, SYNC_DEBOUNCE_MS);
  }, [runPushSync]);

  const bootstrapFromRemote = useCallback(async () => {
    if (typeof window === "undefined") return;

    const meta = syncMetaRef.current;
    if (!meta.isOnline || meta.isBootstrapped) return;

    try {
      const remote = await fetchRemoteState(meta.deviceId);
      if (remote) {
        setState((prev) => mergeStates(prev, remote));
      }
    } catch {
      // Keep offline-first behavior if remote bootstrap fails.
    } finally {
      setSyncMeta((prev) => ({
        ...prev,
        isBootstrapped: true,
        lastBootstrapAt: Date.now(),
      }));
    }
  }, []);

  useEffect(() => {
    void bootstrapFromRemote();
  }, [bootstrapFromRemote]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onOnline = () => {
      setSyncMeta((prev) => ({ ...prev, isOnline: true }));
      void bootstrapFromRemote();
      if (syncMetaRef.current.hasPendingSync) {
        schedulePushSync();
      }
    };
    const onOffline = () => {
      setSyncMeta((prev) => ({ ...prev, isOnline: false }));
    };

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [bootstrapFromRemote, schedulePushSync]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!syncMeta.isBootstrapped) return;
    schedulePushSync();
  }, [state, syncMeta.isBootstrapped, schedulePushSync]);

  useEffect(
    () => () => {
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
      }
    },
    [],
  );

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
