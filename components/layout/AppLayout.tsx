"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { AudioPlayer } from "@/components/player/AudioPlayer";
import { Music2, Search, TrendingUp } from "lucide-react";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      {/* Fixed Sidebar */}
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

        {/* Theme Toggle */}
        {/* <div className="mb-4 flex justify-center">
          <ThemeToggle />
        </div> */}

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

      {/* Main Content - with left margin to account for fixed sidebar */}
      <main className="min-h-screen lg:ml-64 pb-24">{children}</main>

      {/* Fixed Audio Player */}
      <AudioPlayer />
    </div>
  );
}
