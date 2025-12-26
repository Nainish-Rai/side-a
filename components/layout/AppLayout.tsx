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
    <div className="min-h-screen bg-bone dark:bg-carbon transition-colors duration-300">
      {/* Fixed Sidebar */}
      <aside className="fixed top-0 left-0 bottom-0 w-64 bg-carbon dark:bg-bone text-white dark:text-carbon border-r border-carbon dark:border-bone p-6 hidden lg:flex flex-col transition-colors duration-300 z-40">
        {/* Logo */}
        <div className="mb-8">
          <Link href="/">
            <h1 className="text-3xl font-mono tracking-tight mb-1 font-bold cursor-pointer hover:text-walkman-orange transition-colors">
              SIDE A
            </h1>
          </Link>
          <div className="h-0.5 w-16 bg-walkman-orange"></div>
          <div className="text-[9px] font-mono tracking-widest uppercase text-gray-400 dark:text-gray-600 mt-2">
            Hi-Fi Music Player
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1">
          <div className="space-y-2">
            <Link href="/">
              <button className="w-full flex items-center gap-3 px-4 py-3 bg-white/10 dark:bg-carbon/10 border border-white/20 dark:border-carbon/20 hover:bg-white/20 dark:hover:bg-carbon/20 transition-colors text-left">
                <Search className="w-4 h-4" />
                <span className="text-sm font-mono">Search</span>
              </button>
            </Link>
            <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 dark:hover:bg-carbon/10 border border-transparent hover:border-white/20 dark:hover:border-carbon/20 transition-colors text-left">
              <Music2 className="w-4 h-4" />
              <span className="text-sm font-mono">Library</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 dark:hover:bg-carbon/10 border border-transparent hover:border-white/20 dark:hover:border-carbon/20 transition-colors text-left">
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
        <div className="border-t border-white/20 dark:border-carbon/20 pt-4">
          <div className="text-[9px] font-mono tracking-widest uppercase text-gray-400 dark:text-gray-600">
            EST. 2025
          </div>
          <div className="text-[10px] font-mono text-gray-500 mt-1">
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
