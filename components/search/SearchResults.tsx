"use client";

import { Track, Album } from "@/lib/api/types";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { useState } from "react";
import { SearchResultCard } from "./SearchResultCard";
import AlbumCard from "./AlbumCard";
import ArtistCard from "./ArtistCard";
import PlaylistCard from "./PlaylistCard";
import { motion, AnimatePresence } from "motion/react";
import { Search, Music2, Disc, Users, ListMusic } from "lucide-react";

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
}: SearchResultsProps) {
  const { setQueue, currentTrack, isPlaying } = useAudioPlayer();
  const [loadingTrackId, setLoadingTrackId] = useState<number | null>(null);

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
      {/* Tab Navigation - Pill Style */}
      <div className="sticky top-0 z-10 pb-6 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange?.(tab.id)}
              className={`relative px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-walkman-orange ${
                contentType === tab.id
                  ? "text-white"
                  : "text-neutral-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {contentType === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-walkman-orange rounded-full"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
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
      <div className="mb-6 px-1">
        <div className="text-sm font-medium text-white/50">
            {totalNumberOfItems !== undefined ? (
              <>
                Showing {offset + 1}-
                {Math.min(offset + limit, totalNumberOfItems)} of{" "}
                {totalNumberOfItems.toLocaleString()} {contentType}
              </>
            ) : (
              `${items.length} ${contentType}`
            )}
        </div>
      </div>

      {/* Content Area */}
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {contentType === "tracks" ? (
            <div className="space-y-1">
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
        ) : (
             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {contentType === "albums" &&
                    albums?.map((album) => (
                        <div key={album.id} className="w-full">
                            <AlbumCard album={album} />
                        </div>
                    ))}

                {contentType === "artists" &&
                    artists?.map((artist) => (
                         <div key={artist.id} className="w-full">
                            <ArtistCard
                                artist={artist}
                                onClick={handleArtistClick}
                            />
                        </div>
                    ))}

                {contentType === "playlists" &&
                    playlists?.map((playlist) => (
                         <div key={playlist.uuid} className="w-full">
                            <PlaylistCard
                                playlist={playlist}
                                onClick={handlePlaylistClick}
                            />
                        </div>
                    ))}
             </div>
        )}

      </motion.div>
    </div>
  );
}
