"use client";

import { useLibrary } from "@/contexts/LibraryContext";
import { useQueue } from "@/contexts/AudioPlayerContext";
import { useEffect, useRef } from "react";

export function RecentlyPlayedTracker() {
  const { currentTrack } = useQueue();
  const { addRecentlyPlayed } = useLibrary();
  const lastTrackedIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!currentTrack) {
      return;
    }

    const currentId = String(currentTrack.id);
    if (lastTrackedIdRef.current === currentId) {
      return;
    }

    addRecentlyPlayed(currentTrack);
    lastTrackedIdRef.current = currentId;
  }, [addRecentlyPlayed, currentTrack]);

  return null;
}
