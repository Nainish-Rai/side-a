import { useEffect, useRef } from "react";
import { useAudio } from "@/contexts/audio-context";
import { useLibrary } from "@/contexts/library-context";

export function LibraryTracker() {
  const { currentTrack } = useAudio();
  const { addToRecentlyPlayed } = useLibrary();
  const lastTrackIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (currentTrack && currentTrack.id !== lastTrackIdRef.current) {
      lastTrackIdRef.current = currentTrack.id;
      addToRecentlyPlayed(currentTrack);
    }
  }, [currentTrack, addToRecentlyPlayed]);

  return null;
}
