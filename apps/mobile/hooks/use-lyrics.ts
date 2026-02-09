import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import type { Track, LyricsData } from "@side-a/shared/api/types";

export function useLyrics(currentTrack: Track | null, currentTime: number, isPlaying: boolean) {
  const [lyrics, setLyrics] = useState<LyricsData | null>(null);
  const [currentLineIndex, setCurrentLineIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const previousTrackIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!currentTrack || currentTrack.id === previousTrackIdRef.current) return;

    previousTrackIdRef.current = currentTrack.id;
    let cancelled = false;

    (async () => {
      setIsLoading(true);
      setLyrics(null);
      setCurrentLineIndex(-1);
      try {
        const data = await api.fetchLyrics(currentTrack);
        if (!cancelled) {
          setLyrics(data);
          setIsLoading(false);
        }
      } catch {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [currentTrack]);

  useEffect(() => {
    if (!lyrics?.parsed || !isPlaying) {
      setCurrentLineIndex(-1);
      return;
    }
    let idx = -1;
    for (let i = 0; i < lyrics.parsed.length; i++) {
      if (currentTime >= lyrics.parsed[i].time) idx = i;
      else break;
    }
    setCurrentLineIndex((prev) => (prev !== idx ? idx : prev));
  }, [currentTime, lyrics?.parsed, isPlaying]);

  return {
    lyrics,
    currentLineIndex,
    isLoading,
    hasSyncedLyrics: (lyrics?.parsed?.length ?? 0) > 0,
  };
}
