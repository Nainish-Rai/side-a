"use client";

import { AudioPlayerProvider } from "@/contexts/AudioPlayerContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { SearchProvider } from "@/contexts/SearchContext";
import { QueryProvider } from "@/providers/QueryProvider";
import { ReactNode } from "react";
import { MotionConfig } from "motion/react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <QueryProvider>
        <SearchProvider>
          <ThemeProvider>
            <AudioPlayerProvider>{children}</AudioPlayerProvider>
          </ThemeProvider>
        </SearchProvider>
      </QueryProvider>
    </MotionConfig>
  );
}
