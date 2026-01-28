"use client";

import { AudioPlayerProvider } from "@/contexts/AudioPlayerContext";
import { PlaybackStateProvider } from "@/contexts/PlaybackStateContext";
import { QueueProvider } from "@/contexts/QueueContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { SearchProvider } from "@/contexts/SearchContext";
import { QueryProvider } from "@/providers/QueryProvider";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <SearchProvider>
        <ThemeProvider>
          <PlaybackStateProvider>
            <QueueProvider>
              <AudioPlayerProvider>{children}</AudioPlayerProvider>
            </QueueProvider>
          </PlaybackStateProvider>
        </ThemeProvider>
      </SearchProvider>
    </QueryProvider>
  );
}
