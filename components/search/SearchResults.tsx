"use client";

import { Track, Album } from "@/lib/api/types";
import {
 useAudioPlayer,
 usePlaybackState,
 useQueue,
} from "@/contexts/AudioPlayerContext";
import { useState, useCallback } from "react";
import React from "react";
import SearchResultCard from "./SearchResultCard";
import AlbumCard from "./AlbumCard";
import ArtistCard from "./ArtistCard";
import PlaylistCard from "./PlaylistCard";
import { motion, AnimatePresence } from "motion/react";
import { Search, Music2, Disc, Users, ListMusic, Loader2 } from "lucide-react";
import { VirtualSearchResults } from "./VirtualSearchResults";

type SearchContentType = "tracks" | "albums" | "artists" | "playlists";

interface Artist {
 id: number;
 name: string;
 picture?: string;
 type?: string;
 popularity?: number;
 bio?: string;
}

interface Playlist {
 uuid: string;
 title: string;
 description?: string;
 image?: string;
 squareImage?: string;
 numberOfTracks?: number;
 duration?: number;
 creator?: {
  id: number;
  name: string;
 };
 type?: string;
 publicPlaylist?: boolean;
}

interface SearchResultsProps {
 tracks?: Track[];
 albums?: Album[];
 artists?: Artist[];
 playlists?: Playlist[];
 contentType?: SearchContentType;
 isLoading?: boolean;
 totalNumberOfItems?: number;
 offset?: number;
 limit?: number;
 onTabChange?: (tab: SearchContentType) => void;
 hasNextPage?: boolean;
 isFetchingMore?: boolean;
 onLoadMore?: () => void;
 prefetchTab?: (tab: "tracks" | "albums" | "artists") => void;
}

export function SearchResults({
 tracks,
 albums,
 artists,
 playlists,
 contentType = "tracks",
 isLoading = false,
 totalNumberOfItems,
 offset = 0,
 limit = 25,
 onTabChange,
 hasNextPage = false,
 isFetchingMore = false,
 onLoadMore,
 prefetchTab,
}: SearchResultsProps) {
 // Use split contexts for state
 const { isPlaying } = usePlaybackState();
 const { currentTrack } = useQueue();

 // Still need AudioPlayerContext for methods
 const { setQueue } = useAudioPlayer();

 const [loadingTrackId, setLoadingTrackId] = useState<number | null>(null);

 // Lazy initialization to avoid SSR issues
 const [windowDimensions, setWindowDimensions] = useState(() => ({
  width: typeof window !== "undefined" ? window.innerWidth : 0,
  height: typeof window !== "undefined" ? window.innerHeight : 0,
 }));

 // Infinite scroll observer
 const observerTarget = React.useRef<HTMLDivElement>(null);

 // Use ref to avoid recreating observer when onLoadMore changes
 const onLoadMoreRef = React.useRef(onLoadMore);
 React.useEffect(() => {
  onLoadMoreRef.current = onLoadMore;
 }, [onLoadMore]);

 // Track window dimensions for virtual scrolling with debounce
 React.useEffect(() => {
  let timeoutId: NodeJS.Timeout;

  const handleResize = () => {
   // Clear existing timeout
   clearTimeout(timeoutId);

   // Debounce the state update
   timeoutId = setTimeout(() => {
    setWindowDimensions({
     width: window.innerWidth,
     height: window.innerHeight,
    });
   }, 150);
  };

  window.addEventListener("resize", handleResize);
  return () => {
   clearTimeout(timeoutId);
   window.removeEventListener("resize", handleResize);
  };
 }, []);

 React.useEffect(() => {
  const observer = new IntersectionObserver(
   (entries) => {
    if (
     entries[0].isIntersecting &&
     hasNextPage &&
     !isFetchingMore &&
     onLoadMoreRef.current
    ) {
     onLoadMoreRef.current();
    }
   },
   { threshold: 0.1, rootMargin: "100px" },
  );

  const currentTarget = observerTarget.current;
  if (currentTarget) {
   observer.observe(currentTarget);
  }

  return () => {
   if (currentTarget) {
    observer.unobserve(currentTarget);
   }
  };
 }, [hasNextPage, isFetchingMore]); // Removed onLoadMore from deps

 const tabs: { id: SearchContentType; label: string; icon: any }[] = [
  { id: "tracks", label: "Songs", icon: Music2 },
  { id: "albums", label: "Albums", icon: Disc },
  { id: "artists", label: "Artists", icon: Users },
  { id: "playlists", label: "Playlists", icon: ListMusic },
 ];

 const handleTrackClick = async (track: Track, index: number) => {
  if (loadingTrackId === track.id) return;

  setLoadingTrackId(track.id);
  try {
   if (tracks) {
    await setQueue(tracks, index);
   }
  } catch (error) {
   console.error("Error playing track:", error);
  } finally {
   setLoadingTrackId(null);
  }
 };

 const handleArtistClick = (artist: Artist) => {
  console.log("Artist clicked:", artist);
 };

 const handlePlaylistClick = (playlist: Playlist) => {
  console.log("Playlist clicked:", playlist);
 };

 if (isLoading) {
  return (
   <div className="w-full space-y-4">
    {[...Array(6)].map((_, i) => (
     <div
      key={i}
      className="flex items-center gap-4 p-3 rounded-xl bg-white/5 animate-pulse"
     >
      <div className="w-12 h-12 rounded-md bg-white/10" />
      <div className="flex-1 space-y-2">
       <div className="h-4 w-1/3 bg-white/10 rounded" />
       <div className="h-3 w-1/4 bg-white/10 rounded" />
      </div>
     </div>
    ))}
   </div>
  );
 }

 const items =
  contentType === "tracks"
   ? tracks
   : contentType === "albums"
     ? albums
     : contentType === "artists"
       ? artists
       : playlists;

 if (!items || items.length === 0) {
  return (
   <div className="flex flex-col items-center justify-center py-20 text-white/40">
    <Search className="w-16 h-16 mb-4 opacity-50" />
    <p className="text-lg font-medium">No results found</p>
    <p className="text-sm">Try searching for something else</p>
   </div>
  );
 }

 return (
  <div className="w-full">
   {/* Tab Navigation - Clean Minimal Style */}
   <div className="sticky top-0 z-10 pb-8 -mx-4 px-4 bg-black/40 backdrop-blur-2xl border-b border-white/5">
    <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-4">
     {tabs.map((tab) => (
      <button
       key={tab.id}
       onClick={() => onTabChange?.(tab.id)}
       onMouseEnter={() => {
        if (tab.id !== "playlists" && prefetchTab) {
         prefetchTab(tab.id as "tracks" | "albums" | "artists");
        }
       }}
       className={`relative px-5 py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap outline-none ${
        contentType === tab.id
         ? "text-black shadow-lg"
         : "text-white/60 hover:text-white hover:bg-white/5"
       }`}
      >
       {contentType === tab.id && (
        <motion.div
         layoutId="activeTab"
         className="absolute inset-0 bg-white rounded-full"
         initial={false}
         transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
       )}
       <span className="relative z-10 flex items-center gap-2">
        <tab.icon className="w-4 h-4" />
        {tab.label}
       </span>
      </button>
     ))}
    </div>
   </div>

   {/* Results Count */}
   <div className="mb-6 px-1 mt-6">
    <div className="text-sm font-medium text-white/40">
     {totalNumberOfItems !== undefined ? (
      <>
       {totalNumberOfItems.toLocaleString()} {contentType}
      </>
     ) : (
      `${items.length} ${contentType}`
     )}
    </div>
   </div>

   {/* Content Area */}
   <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
   >
    {contentType === "tracks" ? (
     <div className="space-y-0.5">
      {tracks?.map((track, index) => {
       const isCurrentTrack = currentTrack?.id === track.id;
       return (
        <SearchResultCard
         key={track.id}
         track={track}
         isCurrentTrack={isCurrentTrack}
         isPlaying={isCurrentTrack && isPlaying}
         isLoading={loadingTrackId === track.id}
         onClick={() => handleTrackClick(track, index)}
        />
       );
      })}
     </div>
    ) : contentType === "albums" &&
      albums &&
      albums.length > 50 &&
      windowDimensions.width > 0 ? (
     <VirtualSearchResults
      albums={albums}
      height={windowDimensions.height - 200}
      width={windowDimensions.width}
     />
    ) : (
     <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
      {contentType === "albums" &&
       albums?.map((album) => (
        <div key={album.id} className="w-full">
         <AlbumCard album={album} />
        </div>
       ))}

      {contentType === "artists" &&
       artists?.map((artist) => (
        <div key={artist.id} className="w-full">
         <ArtistCard artist={artist} onClick={handleArtistClick} />
        </div>
       ))}

      {contentType === "playlists" &&
       playlists?.map((playlist) => (
        <div key={playlist.uuid} className="w-full">
         <PlaylistCard playlist={playlist} onClick={handlePlaylistClick} />
        </div>
       ))}
     </div>
    )}
   </motion.div>

   {/* Infinite Scroll Loading Indicator */}
   {isFetchingMore && (
    <motion.div
     initial={{ opacity: 0 }}
     animate={{ opacity: 1 }}
     className="flex items-center justify-center py-8 mt-4"
    >
     <div className="flex items-center gap-3 text-white/40">
      <Loader2 className="w-5 h-5 animate-spin" />
      <span className="text-sm font-medium">Loading more...</span>
     </div>
    </motion.div>
   )}

   {/* Intersection Observer Target */}
   <div ref={observerTarget} className="h-4" />
  </div>
 );
}
