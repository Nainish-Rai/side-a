"use client";

import { AudioPlayerProvider } from "@/contexts/AudioPlayerContext";
import { LibraryProvider } from "@/contexts/LibraryContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { SearchProvider } from "@/contexts/SearchContext";
import { RecentlyPlayedTracker } from "@/components/library/RecentlyPlayedTracker";
import { QueryProvider } from "@/providers/QueryProvider";
import { ReactNode } from "react";
import { MotionConfig } from "motion/react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <QueryProvider>
        <SearchProvider>
          <ThemeProvider>
            <AudioPlayerProvider>
              <LibraryProvider>
                <RecentlyPlayedTracker />
                {children}
              </LibraryProvider>
            </AudioPlayerProvider>
          </ThemeProvider>
        </SearchProvider>
      </QueryProvider>
    </MotionConfig>
  );
}
