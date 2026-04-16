"use client";

import { ReactNode, Suspense, useState } from "react";
import dynamic from "next/dynamic";
import { InstallPrompt } from "@/components/mobile/InstallPrompt";
import { MobileNav } from "@/components/mobile/MobileNav";
import { useQueue } from "@/contexts/AudioPlayerContext";
import { DesktopHeader } from "@/components/layout/DesktopHeader";

// Dynamic import for desktop audio player
const AudioPlayer = dynamic(
 () =>
  import("@/components/player/AudioPlayer").then((mod) => ({
   default: mod.AudioPlayer,
  })),
 { ssr: false },
);

// Dynamic import for fullscreen player (used by MiniPlayer expand)
const FullscreenPlayer = dynamic(
 () =>
  import("@/components/player/FullscreenPlayer").then((mod) => ({
   default: mod.FullscreenPlayer,
  })),
 { ssr: false },
);

// Dynamic import for mini player — depends on client-only AudioPlayerContext
// state (currentTrack), so SSR must be skipped to avoid hydration mismatches.
const MiniPlayer = dynamic(
 () =>
  import("@/components/mobile/MiniPlayer").then((mod) => ({
   default: mod.MiniPlayer,
  })),
 { ssr: false },
);

interface AppLayoutProps {
 children: ReactNode;
}

const MOBILE_NAV_HEIGHT = 64;
const MOBILE_MINI_PLAYER_HEIGHT = 56;

export default function AppLayout({ children }: AppLayoutProps) {
 const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
 const { currentTrack } = useQueue();

 const handleExpandPlayer = () => {
  setIsFullscreenOpen(true);
 };

  return (
   <div className="min-h-screen bg-background transition-colors duration-300">
    {/* Shared desktop navigation header — hidden on mobile */}
    <Suspense fallback={null}>
     <DesktopHeader />
    </Suspense>

    {/* Main Content */}
   {/* Desktop: margin for sidebar + padding for audio player */}
   {/* Mobile: padding for mini player */}
   <main
    id="main-content"
    className="min-h-screen pb-[var(--mobile-shell-offset)] lg:pb-0"
    style={{
     ["--mobile-shell-offset" as string]: currentTrack
      ? `calc(${MOBILE_NAV_HEIGHT + MOBILE_MINI_PLAYER_HEIGHT}px + env(safe-area-inset-bottom))`
      : `calc(${MOBILE_NAV_HEIGHT}px + env(safe-area-inset-bottom))`,
    }}
    suppressHydrationWarning
   >
    <div className="lg:pb-24">{children}</div>
   </main>

   {/* Desktop Audio Player - hidden on mobile */}
   <div className="hidden lg:block">
    <AudioPlayer />
   </div>

   {/* Mobile Mini Player - positioned at bottom */}
   <div
    className="fixed left-0 right-0 z-40 lg:hidden"
    style={{
     bottom: `calc(${MOBILE_NAV_HEIGHT}px + env(safe-area-inset-bottom))`,
    }}
   >
    <MiniPlayer onExpand={handleExpandPlayer} />
   </div>

   {/* Persistent mobile bottom navigation */}
   <MobileNav />

   {/* PWA Install Prompt */}
   <InstallPrompt />

   {/* Fullscreen Player - used by both desktop and mobile */}
   <FullscreenPlayer
    isOpen={isFullscreenOpen}
    onClose={() => setIsFullscreenOpen(false)}
   />
  </div>
 );
}
