"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Music2, Search, TrendingUp } from "lucide-react";
import { MobileNav } from "@/components/mobile/MobileNav";
import { MiniPlayer } from "@/components/mobile/MiniPlayer";
import { InstallPrompt } from "@/components/mobile/InstallPrompt";
import { useQueue } from "@/contexts/AudioPlayerContext";

// Dynamic import for desktop audio player
const AudioPlayer = dynamic(
  () => import("@/components/player/AudioPlayer").then((mod) => ({ default: mod.AudioPlayer })),
  { ssr: false }
);

// Dynamic import for fullscreen player (used by MiniPlayer expand)
const FullscreenPlayer = dynamic(
  () => import("@/components/player/FullscreenPlayer").then((mod) => ({ default: mod.FullscreenPlayer })),
  { ssr: false }
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
      {/* Fixed Sidebar - Desktop only */}
      <aside className="fixed top-0 left-0 bottom-0 w-64 bg-foreground text-background border-r border-foreground p-6 hidden lg:flex flex-col transition-colors duration-300 z-40">
        {/* Logo */}
        <div className="mb-8">
          <Link href="/">
            <h1 className="text-3xl font-mono tracking-tight mb-1 font-bold cursor-pointer hover:opacity-70 transition-opacity">
              SIDE A
            </h1>
          </Link>
          <div className="h-0.5 w-16 bg-background"></div>
          <div className="text-[9px] font-mono tracking-widest uppercase text-background/40 mt-2">
            Hi-Fi Music Player
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1">
          <div className="space-y-2">
            <Link href="/">
              <button className="w-full flex items-center gap-3 px-4 py-3 bg-background/10 border border-background/20 hover:bg-background/20 transition-colors text-left">
                <Search className="w-4 h-4" />
                <span className="text-sm font-mono">Search</span>
              </button>
            </Link>
            <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-background/10 border border-transparent hover:border-background/20 transition-colors text-left">
              <Music2 className="w-4 h-4" />
              <span className="text-sm font-mono">Library</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-background/10 border border-transparent hover:border-background/20 transition-colors text-left">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-mono">Trending</span>
            </button>
          </div>
        </nav>

        {/* Footer */}
        <div className="border-t border-background/20 pt-4">
          <div className="text-[9px] font-mono tracking-widest uppercase text-background/40">
            EST. 2025
          </div>
          <div className="text-[10px] font-mono text-background/50 mt-1">
            Detent Music System
          </div>
        </div>
      </aside>

      {/* Main Content */}
      {/* Desktop: margin for sidebar + padding for audio player */}
      {/* Mobile: padding for mini player + bottom nav */}
      <main
        className="min-h-screen lg:ml-64"
        style={{
          paddingBottom: currentTrack
            ? "calc(64px + 56px + env(safe-area-inset-bottom))" // Mini player + nav + safe area
            : "calc(56px + env(safe-area-inset-bottom))", // Nav + safe area only
        }}
      >
        <div className="lg:pb-24">{children}</div>
      </main>

      {/* Desktop Audio Player - hidden on mobile */}
      <div className="hidden lg:block">
        <AudioPlayer />
      </div>

      {/* Mobile Mini Player - positioned above bottom nav */}
      <div
        className="fixed left-0 right-0 z-40 lg:hidden"
        style={{ bottom: "calc(56px + env(safe-area-inset-bottom))" }}
      >
        <MiniPlayer onExpand={handleExpandPlayer} />
      </div>

      {/* Mobile Bottom Navigation */}
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
