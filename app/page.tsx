"use client";

import { useState, useCallback, useEffect } from "react";
import { SearchBar } from "@/components/search/SearchBar";
import { SearchResults } from "@/components/search/SearchResults";
import { AudioPlayer } from "@/components/player/AudioPlayer";
import { ThemeToggle } from "@/components/ThemeToggle";
import { api } from "@/lib/api";
import { Track, Album } from "@/lib/api/types";
import { Music2, Search, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

type SearchContentType = "tracks" | "albums" | "artists" | "playlists";

export default function Home() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState<SearchContentType>("tracks");
  const [lastQuery, setLastQuery] = useState<string>("");
  const [searchMetadata, setSearchMetadata] = useState<{
    totalNumberOfItems: number;
    offset: number;
    limit: number;
  } | null>(null);
  const [isCompact, setIsCompact] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    let ticking = false;
    const SCROLL_THRESHOLD = 80; // Threshold to trigger compact mode
    const SCROLL_DELTA = 10; // Minimum scroll amount to register direction change

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const scrollDelta = Math.abs(currentScrollY - lastScrollY);

          // Only update if scrolled enough to avoid jitter
          if (scrollDelta > SCROLL_DELTA) {
            // Compact when scrolling down past threshold
            if (
              currentScrollY > SCROLL_THRESHOLD &&
              currentScrollY > lastScrollY
            ) {
              setIsCompact(true);
            }
            // Expand when scrolling up significantly or near top
            else if (
              currentScrollY < lastScrollY &&
              currentScrollY < SCROLL_THRESHOLD - 20
            ) {
              setIsCompact(false);
            }

            setLastScrollY(currentScrollY);
          }

          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const handleSearch = useCallback(async (query: string) => {
    setLastQuery(query);
    setIsLoading(true);
    try {
      // Always fetch tracks first
      const response = await api.searchTracks(query);
      setTracks(response.items);
      setSearchMetadata({
        totalNumberOfItems: response.totalNumberOfItems,
        offset: response.offset,
        limit: response.limit,
      });
      // Reset to tracks tab on new search
      setCurrentTab("tracks");
      // Clear albums (will be fetched when user switches to albums tab)
      setAlbums([]);
    } catch (error) {
      console.error("Search failed:", error);
      setTracks([]);
      setAlbums([]);
      setSearchMetadata(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleTabChange = useCallback(
    async (tab: SearchContentType) => {
      setCurrentTab(tab);

      // If switching to albums and albums haven't been fetched yet
      if (tab === "albums" && albums.length === 0 && lastQuery) {
        setIsLoading(true);
        try {
          const response = await api.searchAlbums(lastQuery);
          setAlbums(response.items);
          setSearchMetadata({
            totalNumberOfItems: response.totalNumberOfItems,
            offset: response.offset,
            limit: response.limit,
          });
        } catch (error) {
          console.error("Album search failed:", error);
          setAlbums([]);
        } finally {
          setIsLoading(false);
        }
      } else if (tab === "tracks" && tracks.length > 0) {
        // Update metadata when switching back to tracks
        setSearchMetadata({
          totalNumberOfItems: tracks.length,
          offset: 0,
          limit: tracks.length,
        });
      }
    },
    [albums.length, lastQuery, tracks.length]
  );

  return (
    <div className="min-h-screen bg-bone dark:bg-carbon transition-colors duration-300">
      {/* Fixed Sidebar */}
      <aside className="fixed top-0 left-0 bottom-0 w-64 bg-carbon dark:bg-bone text-white dark:text-carbon border-r border-carbon dark:border-bone p-6 hidden lg:flex flex-col transition-colors duration-300 z-40">
        {/* Logo */}
        <div className="mb-8">
          <h1 className="text-3xl font-mono tracking-tight mb-1 font-bold">
            SIDE A
          </h1>
          <div className="h-0.5 w-16 bg-walkman-orange"></div>
          <div className="text-[9px] font-mono tracking-widest uppercase text-gray-400 dark:text-gray-600 mt-2">
            Hi-Fi Music Player
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1">
          <div className="space-y-2">
            <button className="w-full flex items-center gap-3 px-4 py-3 bg-white/10 dark:bg-carbon/10 border border-white/20 dark:border-carbon/20 hover:bg-white/20 dark:hover:bg-carbon/20 transition-colors text-left">
              <Search className="w-4 h-4" />
              <span className="text-sm font-mono">Search</span>
            </button>
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
      <main className="min-h-screen lg:ml-64 pb-24">
        {/* Header - Sticky */}
        <motion.header
          animate={{
            padding: isCompact ? "0.5rem 0.75rem" : "1rem 1.5rem",
          }}
          transition={{
            duration: 0.3,
            ease: [0.4, 0, 0.2, 1],
          }}
          className="sticky top-0 bg-white dark:bg-[#1a1a1a] border-b border-carbon dark:border-bone z-30"
        >
          <div className="max-w-7xl mx-auto">
            <AnimatePresence>
              {!isCompact && (
                <motion.div
                  initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                  animate={{ height: "auto", opacity: 1, marginBottom: "1rem" }}
                  exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                  transition={{
                    duration: 0.3,
                    ease: [0.4, 0, 0.2, 1],
                  }}
                  className="flex items-center justify-between overflow-hidden"
                >
                  <div className="lg:hidden">
                    <h1 className="text-2xl font-mono tracking-tight font-bold text-carbon dark:text-bone">
                      SIDE A
                    </h1>
                  </div>
                  <div className="hidden lg:block">
                    <h2 className="text-2xl font-mono tracking-tight font-bold text-carbon dark:text-bone">
                      Search
                    </h2>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="lg:hidden">
                      <ThemeToggle />
                    </div>
                    <div className="text-right">
                      <div className="bg-carbon dark:bg-bone text-white dark:text-carbon px-3 py-1 text-[9px] font-mono inline-block tracking-widest transition-colors duration-300">
                        26 DEC 2025
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <SearchBar
              onSearch={handleSearch}
              isLoading={isLoading}
              isCompact={isCompact}
            />
          </div>
        </motion.header>

        {/* Content Area - Scrollable */}
        <div className="p-4 lg:p-6">
          <div className="max-w-7xl mx-auto">
            {tracks.length > 0 || albums.length > 0 || isLoading ? (
              <SearchResults
                tracks={tracks}
                albums={albums}
                contentType={currentTab}
                isLoading={isLoading}
                totalNumberOfItems={searchMetadata?.totalNumberOfItems}
                offset={searchMetadata?.offset}
                limit={searchMetadata?.limit}
                onTabChange={handleTabChange}
              />
            ) : (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Music2 className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                  <h3 className="text-lg font-mono font-bold text-carbon dark:text-bone mb-2">
                    No results yet
                  </h3>
                  <p className="text-sm font-mono text-gray-500 dark:text-gray-400">
                    Search for tracks to get started
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Fixed Audio Player */}
      <AudioPlayer />
    </div>
  );
}
