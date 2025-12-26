"use client";

import { Track, Album } from "@/lib/api/types";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { useState } from "react";
import { SearchResultCard } from "./SearchResultCard";
import AlbumCard from "./AlbumCard";
import ArtistCard from "./ArtistCard";
import PlaylistCard from "./PlaylistCard";
import { LayoutGrid, LayoutList } from "lucide-react";

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
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");

  // Determine the content to display based on contentType
  const items =
    contentType === "tracks"
      ? tracks
      : contentType === "albums"
      ? albums
      : contentType === "artists"
      ? artists
      : playlists;

  const contentTypeLabel =
    contentType === "tracks"
      ? "tracks"
      : contentType === "albums"
      ? "albums"
      : contentType === "artists"
      ? "artists"
      : "playlists";

  const handleTrackClick = async (track: Track, index: number) => {
    if (loadingTrackId === track.id) return;

    setLoadingTrackId(track.id);
    try {
      // Set the entire search results as the queue, starting from the clicked track
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
    // TODO: Navigate to artist page
  };

  const handlePlaylistClick = (playlist: Playlist) => {
    console.log("Playlist clicked:", playlist);
    // TODO: Navigate to playlist page or load playlist tracks
  };

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="grid grid-cols-1 gap-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="p-4 bg-bone dark:bg-[#1a1a1a] border border-gray-300 dark:border-gray-700 animate-pulse transition-colors duration-300"
            >
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-800"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-800 w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      {/* Tab Navigation */}
      <div className="mb-4 flex items-center border border-carbon dark:border-bone bg-white dark:bg-[#1a1a1a] transition-colors duration-300">
        <button
          onClick={() => onTabChange?.("tracks")}
          className={`flex-1 px-6 py-3 font-mono text-[10px] tracking-widest uppercase transition-all duration-200
                     ${
                       contentType === "tracks"
                         ? "bg-carbon dark:bg-bone text-white dark:text-carbon border-r border-carbon dark:border-bone"
                         : "bg-white dark:bg-[#1a1a1a] text-carbon dark:text-bone hover:bg-bone dark:hover:bg-[#2a2a2a] border-r border-carbon dark:border-bone"
                     }`}
        >
          <span className="block text-center">Tracks</span>
          {tracks && tracks.length > 0 && (
            <span className="block text-center text-[8px] mt-1 opacity-60">
              {tracks.length}
            </span>
          )}
        </button>
        <button
          onClick={() => onTabChange?.("albums")}
          className={`flex-1 px-6 py-3 font-mono text-[10px] tracking-widest uppercase transition-all duration-200
                     ${
                       contentType === "albums"
                         ? "bg-carbon dark:bg-bone text-white dark:text-carbon"
                         : "bg-white dark:bg-[#1a1a1a] text-carbon dark:text-bone hover:bg-bone dark:hover:bg-[#2a2a2a]"
                     }`}
        >
          <span className="block text-center">Albums</span>
          {albums && albums.length > 0 && (
            <span className="block text-center text-[8px] mt-1 opacity-60">
              {albums.length}
            </span>
          )}
        </button>
      </div>

      {/* Header with Results Count and View Toggle */}
      <div className="mb-4 flex items-center justify-between bg-white dark:bg-[#1a1a1a] border border-carbon dark:border-bone p-3 transition-colors duration-300">
        <div className="font-mono">
          <span className="text-[9px] tracking-widest uppercase text-gray-500 dark:text-gray-400">
            SEARCH RESULTS
          </span>
          <div className="text-sm font-bold text-carbon dark:text-bone mt-0.5">
            {totalNumberOfItems !== undefined ? (
              <>
                Showing {offset + 1}-
                {Math.min(offset + limit, totalNumberOfItems)} of{" "}
                {totalNumberOfItems.toLocaleString()} {contentTypeLabel}
              </>
            ) : (
              `${items.length} ${contentTypeLabel}`
            )}
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 border border-carbon dark:border-bone">
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 font-mono text-xs transition-colors
                       ${
                         viewMode === "list"
                           ? "bg-carbon dark:bg-bone text-white dark:text-carbon"
                           : "bg-white dark:bg-[#1a1a1a] text-carbon dark:text-bone hover:bg-bone dark:hover:bg-[#2a2a2a]"
                       }`}
            title="List View"
          >
            <LayoutList className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 font-mono text-xs transition-colors
                       ${
                         viewMode === "grid"
                           ? "bg-carbon dark:bg-bone text-white dark:text-carbon"
                           : "bg-white dark:bg-[#1a1a1a] text-carbon dark:text-bone hover:bg-bone dark:hover:bg-[#2a2a2a]"
                       }`}
            title="Grid View"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Results Grid/List */}
      <div
        className={
          viewMode === "grid"
            ? `grid grid-cols-1 sm:grid-cols-2 ${
                contentType === "albums" ? "lg:grid-cols-4" : ""
              } gap-4`
            : "grid grid-cols-1 gap-3"
        }
      >
        {contentType === "tracks" &&
          tracks?.map((track, index) => {
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

        {contentType === "albums" &&
          albums?.map((album) => <AlbumCard key={album.id} album={album} />)}

        {contentType === "artists" &&
          artists?.map((artist) => (
            <ArtistCard
              key={artist.id}
              artist={artist}
              onClick={handleArtistClick}
            />
          ))}

        {contentType === "playlists" &&
          playlists?.map((playlist) => (
            <PlaylistCard
              key={playlist.uuid}
              playlist={playlist}
              onClick={handlePlaylistClick}
            />
          ))}
      </div>
    </div>
  );
}
