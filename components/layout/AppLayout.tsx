"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Music2, Search, TrendingUp } from "lucide-react";
import { MiniPlayer } from "@/components/mobile/MiniPlayer";
import { InstallPrompt } from "@/components/mobile/InstallPrompt";
import { useQueue } from "@/contexts/AudioPlayerContext";

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

interface AppLayoutProps {
 children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
 const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
 const { currentTrack } = useQueue();

 const handleExpandPlayer = () => {
  setIsFullscreenOpen(true);
 };

 return (
  <div className="min-h-screen bg-background transition-colors duration-300">
   {/* Main Content */}
   {/* Desktop: margin for sidebar + padding for audio player */}
   {/* Mobile: padding for mini player */}
   <main
    className="min-h-screen "
    style={{
     paddingBottom: currentTrack
      ? "calc(64px + env(safe-area-inset-bottom))" // Mini player + safe area
      : "env(safe-area-inset-bottom)", // Safe area only
    }}
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
    style={{ bottom: "env(safe-area-inset-bottom)" }}
   >
    <MiniPlayer onExpand={handleExpandPlayer} />
   </div>

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
