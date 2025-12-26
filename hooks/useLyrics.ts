import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { LyricsData, SyncedLyric, Track } from "@/lib/api/types";

export function useLyrics(
  currentTrack: Track | null,
  currentTime: number,
  isPlaying: boolean
) {
  const [lyrics, setLyrics] = useState<LyricsData | null>(null);
  const [currentLineIndex, setCurrentLineIndex] = useState<number>(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previousTrackIdRef = useRef<number | null>(null);

  // Fetch lyrics when track changes
  useEffect(() => {
    if (!currentTrack || currentTrack.id === previousTrackIdRef.current) {
      return;
    }

    const trackId = currentTrack.id;
    previousTrackIdRef.current = trackId;

    // Use a flag to prevent state updates after unmount
    let isMounted = true;

    const fetchLyrics = async () => {
      if (!isMounted) return;

      setIsLoading(true);
      setError(null);
      setLyrics(null);
      setCurrentLineIndex(-1);

      try {
        const data = await api.fetchLyrics(currentTrack);
        if (isMounted) {
          setLyrics(data);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Error fetching lyrics:", err);
        if (isMounted) {
          setError("Failed to load lyrics");
          setIsLoading(false);
        }
      }
    };

    fetchLyrics();

    return () => {
      isMounted = false;
    };
  }, [currentTrack]);

  // Update current line based on playback time
  useEffect(() => {
    if (!lyrics?.parsed || !isPlaying) {
      return;
    }

    const newIndex = getCurrentLineIndex(lyrics.parsed, currentTime);

    // Use requestAnimationFrame to batch state updates
    requestAnimationFrame(() => {
      setCurrentLineIndex((prev) => {
        if (prev !== newIndex) {
          return newIndex;
        }
        return prev;
      });
    });
  }, [currentTime, lyrics, isPlaying]);

  const hasLyrics = Boolean(lyrics?.lyrics || lyrics?.parsed);
  const hasSyncedLyrics = Boolean(lyrics?.parsed && lyrics.parsed.length > 0);

  return {
    lyrics,
    currentLineIndex,
    isLoading,
    error,
    hasLyrics,
    hasSyncedLyrics,
  };
}

// Find the current line index based on playback time
function getCurrentLineIndex(
  syncedLyrics: SyncedLyric[],
  currentTime: number
): number {
  let currentIndex = -1;
  for (let i = 0; i < syncedLyrics.length; i++) {
    if (currentTime >= syncedLyrics[i].time) {
      currentIndex = i;
    } else {
      break;
    }
  }
  return currentIndex;
}
