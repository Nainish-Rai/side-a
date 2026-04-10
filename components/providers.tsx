"use client";

import { ReactNode } from "react";
import { MotionConfig } from "motion/react";
import { AudioPlayerProvider } from "@/contexts/AudioPlayerContext";
import { LibraryProvider } from "@/contexts/LibraryContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { RecentlyPlayedTracker } from "@/components/library/RecentlyPlayedTracker";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/providers/QueryProvider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <QueryProvider>
        <ThemeProvider>
          <AudioPlayerProvider>
            <LibraryProvider>
              <RecentlyPlayedTracker />
              {children}
              <Toaster position="bottom-right" />
            </LibraryProvider>
          </AudioPlayerProvider>
        </ThemeProvider>
      </QueryProvider>
    </MotionConfig>
  );
}
