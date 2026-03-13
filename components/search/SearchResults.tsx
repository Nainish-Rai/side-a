"use client";

import Image from "next/image";
import Link from "next/link";
import { Track, Album } from "@/lib/api/types";
import {
  useAudioPlayer,
  usePlaybackState,
  useQueue,
} from "@/contexts/AudioPlayerContext";
import { useState } from "react";
import { useRouter } from "next/navigation";
import React from "react";
import { useLibrary } from "@/contexts/LibraryContext";
import { toast } from "sonner";
import { api } from "@/lib/api";
import TrackRow from "./TrackRow";
import MobileTrackRow from "../mobile/MobileTrackRow";
import { TableHeader } from "./TableHeader";
import { motion } from "motion/react";
import {
  Search,
  Music2,
  Disc,
  Users,
  ListMusic,
  type LucideIcon,
} from "lucide-react";
import { VirtualSearchResults } from "./VirtualSearchResults";
import { TrackPlaylistPickerDialog } from "@/components/playlists/PlaylistDialogs";

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

function getAlbumArtistName(album: Album) {
  return album.artist?.name || album.artists?.[0]?.name || "Unknown Artist";
}

function getAlbumCoverUrl(album: Album) {
  const coverId = album.cover || album.imageCover?.[0];
  return coverId ? api.getCoverUrl(coverId, "160") : null;
}

function getArtistImageUrl(artist: Artist) {
  return artist.picture
    ? `https://resources.tidal.com/images/${artist.picture.replace(/-/g, "/")}/160x160.jpg`
    : null;
}

function getPlaylistImageUrl(playlist: Playlist) {
  const imageId = playlist.squareImage || playlist.image;
  return imageId
    ? `https://resources.tidal.com/images/${imageId.replace(/-/g, "/")}/160x160.jpg`
    : null;
}

function getPlaylistCreator(playlist: Playlist) {
  return playlist.creator?.name || "Unknown Curator";
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
  offset: _offset = 0,
  limit: _limit = 25,
  onTabChange,
  hasNextPage: _hasNextPage = false,
  isFetchingMore: _isFetchingMore = false,
  onLoadMore: _onLoadMore,
  prefetchTab,
}: SearchResultsProps) {
  void _offset;
  void _limit;
  void _hasNextPage;
  void _isFetchingMore;
  void _onLoadMore;

  // Use split contexts for state
  const { isPlaying } = usePlaybackState();
  const { currentTrack } = useQueue();

  // Still need AudioPlayerContext for methods
  const { setQueue, addToQueue, playNextInQueue } = useAudioPlayer();
  const { isTrackLiked, toggleTrackLike, addRecentlyPlayed } = useLibrary();
  const router = useRouter();

 const [loadingTrackId, setLoadingTrackId] = useState<number | null>(null);
 const [playlistPickerTrack, setPlaylistPickerTrack] = useState<Track | null>(null);

  // Lazy initialization to avoid SSR issues
  const [windowDimensions, setWindowDimensions] = useState(() => ({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  }));

  // Check if mobile (< 1024px)
  const isMobile = windowDimensions.width > 0 && windowDimensions.width < 1024;

  // DISABLED: Infinite scroll observer
  // const observerTarget = React.useRef<HTMLDivElement>(null);

  // // Use ref to avoid recreating observer when onLoadMore changes
  // const onLoadMoreRef = React.useRef(onLoadMore);
  // React.useEffect(() => {
  //  onLoadMoreRef.current = onLoadMore;
  // }, [onLoadMore]);

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

  // DISABLED: Infinite scroll IntersectionObserver
  // React.useEffect(() => {
  //  const observer = new IntersectionObserver(
  //   (entries) => {
  //    if (
  //     entries[0].isIntersecting &&
  //     hasNextPage &&
  //     !isFetchingMore &&
  //     onLoadMoreRef.current
  //    ) {
  //     onLoadMoreRef.current();
  //    }
  //   },
  //   { threshold: 0.1, rootMargin: "100px" },
  //  );

  //  const currentTarget = observerTarget.current;
  //  if (currentTarget) {
  //   observer.observe(currentTarget);
  //  }

  //  return () => {
  //   if (currentTarget) {
  //    observer.unobserve(currentTarget);
  //   }
  //  };
  // }, [hasNextPage, isFetchingMore]); // Removed onLoadMore from deps

  // Define all available tabs
  const allTabs: { id: SearchContentType; label: string; icon: LucideIcon }[] =
    [
      { id: "tracks", label: "Songs", icon: Music2 },
      { id: "albums", label: "Albums", icon: Disc },
      { id: "artists", label: "Artists", icon: Users },
      { id: "playlists", label: "Playlists", icon: ListMusic },
    ];

  // Show all implemented tabs (lazy load content when tab is clicked)
  // Filter out playlists until backend support is added
  const tabs = allTabs.filter((tab) => tab.id !== "playlists");

  const handleTrackClick = async (track: Track, index: number) => {
    if (loadingTrackId === track.id) return;

    setLoadingTrackId(track.id);
    try {
      if (tracks) {
        await setQueue(tracks, index);
        addRecentlyPlayed(track);
      }
    } catch (error) {
      console.error("Error playing track:", error);
    } finally {
      setLoadingTrackId(null);
    }
  };

  const handleAddToQueue = React.useCallback(
    (track: Track) => {
      if (!track?.id) {
        toast.error("Could not update queue");
        return;
      }

      try {
        addToQueue(track);
        toast.success("Added to queue");
      } catch (error) {
        console.error("Error adding track to queue:", error);
        toast.error("Could not update queue");
      }
    },
    [addToQueue],
  );

  const handlePlayNext = React.useCallback(
    (track: Track) => {
      if (!track?.id) {
        toast.error("Could not update queue");
        return;
      }

      try {
        playNextInQueue(track);
        toast.success("Will play next");
      } catch (error) {
        console.error("Error inserting track as next:", error);
        toast.error("Could not update queue");
      }
    },
    [playNextInQueue],
  );

  const handleArtistClick = (artist: Artist) => {
    if (!artist?.id) return;

    const nameParam = artist.name
      ? `?name=${encodeURIComponent(artist.name)}`
      : "";

    router.push(`/artist/${artist.id}${nameParam}`);
  };

  const handlePlaylistClick = (playlist: Playlist) => {
    console.log("Playlist clicked:", playlist);
  };

  if (isLoading) {
    return (
      <div className="w-full border-t border-foreground/10">
        <TableHeader />
        <div>
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="grid grid-cols-[50px_40px_1fr_180px_120px_80px] lg:grid-cols-[50px_40px_1fr_180px_120px_80px] md:grid-cols-[40px_40px_1fr_60px] gap-4 items-center px-6 py-3 border-b border-foreground/10 animate-pulse"
            >
              <div className="h-3 w-6 bg-foreground/10 mx-auto" />
              <div className="w-10 h-10 bg-foreground/10 border border-foreground/10" />
              <div className="space-y-2">
                <div className="h-4 w-2/3 bg-foreground/10" />
                <div className="h-3 w-1/2 bg-foreground/10" />
              </div>
              <div className="hidden lg:block h-3 w-3/4 bg-foreground/10" />
              <div className="hidden lg:block h-3 w-16 bg-foreground/10" />
              <div className="h-3 w-12 bg-foreground/10 ml-auto" />
            </div>
          ))}
        </div>
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
      <div className="flex min-h-[38vh] items-center justify-center px-8 py-14 text-center">
        <div>
          <Search className="mx-auto mb-4 h-8 w-8 text-foreground/25" />
          <p className="text-sm font-mono uppercase tracking-widest text-foreground/90">
            NO RESULTS FOUND
          </p>
          <p className="mt-2 text-[11px] font-mono uppercase tracking-wider text-foreground/40">
            Try another search term
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Tab Navigation - Block based */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-foreground/10">
        <div
          className="flex items-center gap-1 lg:gap-8 overflow-x-auto no-scrollbar py-2 lg:py-4 px-4 lg:px-6"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange?.(tab.id)}
              onMouseEnter={() => {
                if (tab.id !== "playlists" && prefetchTab) {
                  prefetchTab(tab.id as "tracks" | "albums" | "artists");
                }
              }}
              className={`
        relative flex-shrink-0
        px-4 py-3 lg:px-0 lg:pb-3 lg:pt-0
        text-xs font-mono uppercase tracking-widest
        transition-all whitespace-nowrap outline-none
        active:bg-foreground/5 lg:active:bg-transparent
        ${
          contentType === tab.id
            ? "text-foreground"
            : "text-foreground/40 hover:text-foreground/70"
        }
       `}
            >
              <span className="flex items-center gap-2">
                <tab.icon className="w-4 h-4 lg:w-3.5 lg:h-3.5" />
                {tab.label}
              </span>
              {contentType === tab.id && (
                <motion.div
                  layoutId="activeTabUnderline"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-foreground"
                  initial={false}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count Block */}
      <div className="border-b border-foreground/10 px-4 lg:px-6 py-3">
        <div className="text-[10px] font-mono uppercase tracking-widest text-foreground/40">
          {totalNumberOfItems !== undefined
            ? `${totalNumberOfItems.toLocaleString()} ${contentType}`
            : `${items.length} ${contentType}`}
        </div>
      </div>

      {/* Content Block */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      >
        {contentType === "tracks" ? (
          <div className="border-b border-foreground/10">
            {/* Table header - desktop only */}
            <div className="sticky top-[5.1rem] z-10 hidden lg:block">
              <TableHeader />
            </div>
            <div>
              {tracks?.map((track, index) => {
                const isCurrentTrack = currentTrack?.id === track.id;

                // Use MobileTrackRow on mobile, TrackRow on desktop
                if (isMobile) {
                  return (
                    <MobileTrackRow
                      key={`${track.id}-${index}`}
                      track={track}
                      index={index}
                      isCurrentTrack={isCurrentTrack}
                      isPlaying={isCurrentTrack && isPlaying}
                      isLoading={loadingTrackId === track.id}
                      onClick={() => handleTrackClick(track, index)}
           isLiked={isTrackLiked(track.id)}
            onToggleLike={() => toggleTrackLike(track)}
             onAddToQueue={() => handleAddToQueue(track)}
             onAddToPlaylist={() => setPlaylistPickerTrack(track)}
             onPlayNext={() => handlePlayNext(track)}
            onShare={() => {
                        // Share functionality
                        if (navigator.share) {
                          navigator.share({
                            title: track.title,
                            text: `Check out ${track.title} by ${track.artist?.name}`,
                          });
                        }
                      }}
                    />
                  );
                }

                return (
                  <TrackRow
                    key={`${track.id}-${index}`}
                    track={track}
                    index={index}
                    isCurrentTrack={isCurrentTrack}
                    isPlaying={isCurrentTrack && isPlaying}
                    isLoading={loadingTrackId === track.id}
           onClick={() => handleTrackClick(track, index)}
            onAddToQueue={() => handleAddToQueue(track)}
            onAddToPlaylist={() => setPlaylistPickerTrack(track)}
            onPlayNext={() => handlePlayNext(track)}
           isLiked={isTrackLiked(track.id)}
                    onToggleLike={() => toggleTrackLike(track)}
                  />
                );
              })}
            </div>
          </div>
        ) : contentType === "albums" &&
          albums &&
          albums.length > 50 &&
          windowDimensions.width > 0 ? (
          <div className="px-4 lg:px-6 py-5 border-b border-foreground/10">
            <VirtualSearchResults
              albums={albums}
              height={windowDimensions.height - 200}
              width={windowDimensions.width}
            />
          </div>
        ) : contentType === "albums" ? (
          <div className="border-b border-foreground/10">
            <div className="sticky top-[3.8rem] z-10 hidden lg:block border-b border-foreground/10 bg-background/95 backdrop-blur-xl">
              <div className="grid grid-cols-[40px_1fr_160px_100px_80px] gap-4 px-6 py-3">
                <span className="text-center text-[10px] font-mono uppercase tracking-widest text-foreground/40">
                  #
                </span>
                <span className="text-[10px] font-mono uppercase tracking-widest text-foreground/40">
                  Album
                </span>
                <span className="text-[10px] font-mono uppercase tracking-widest text-foreground/40">
                  Artist
                </span>
                <span className="text-[10px] font-mono uppercase tracking-widest text-foreground/40">
                  Type
                </span>
                <span className="text-right text-[10px] font-mono uppercase tracking-widest text-foreground/40">
                  Year
                </span>
              </div>
            </div>
            {albums?.map((album, index) => {
              const coverUrl = getAlbumCoverUrl(album);
              const artistName = getAlbumArtistName(album);
              const year = album.releaseDate
                ? new Date(album.releaseDate).getFullYear()
                : null;

              return (
                <Link
                  key={album.id}
                  href={`/album/${album.id}`}
                  className="grid grid-cols-[40px_1fr] items-center gap-4 border-b border-foreground/10 px-4 py-3 transition-colors hover:bg-foreground/[0.02] lg:grid-cols-[40px_1fr_160px_100px_80px] lg:px-6"
                >
                  <span className="text-center text-xs font-mono tabular-nums text-foreground/40">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex items-center gap-3">
                    <div className="h-10 w-10 shrink-0 overflow-hidden border border-foreground/10 bg-foreground/5">
                      {coverUrl ? (
                        <Image
                          src={coverUrl}
                          alt={album.title}
                          width={40}
                          height={40}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Disc className="h-4 w-4 text-foreground/25" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-[13px] font-medium tracking-[-0.01em] text-foreground/90">
                        {album.title}
                      </h3>
                      <p className="truncate text-[11px] font-mono uppercase tracking-wider text-foreground/40 lg:hidden">
                        {artistName}
                      </p>
                    </div>
                  </div>
                  <p className="hidden truncate text-[12px] text-foreground/50 lg:block">
                    {artistName}
                  </p>
                  <p className="hidden text-[10px] font-mono uppercase tracking-wider text-foreground/40 lg:block">
                    {album.type || "Album"}
                  </p>
                  <p className="hidden text-right text-[12px] font-mono tabular-nums text-foreground/50 lg:block">
                    {year ?? "-"}
                  </p>
                </Link>
              );
            })}
          </div>
        ) : contentType === "artists" ? (
          <div className="border-b border-foreground/10">
            <div className="sticky top-[3.8rem] z-10 hidden lg:block border-b border-foreground/10 bg-background/95 backdrop-blur-xl">
              <div className="grid grid-cols-[40px_1fr_120px_100px] gap-4 px-6 py-3">
                <span className="text-center text-[10px] font-mono uppercase tracking-widest text-foreground/40">
                  #
                </span>
                <span className="text-[10px] font-mono uppercase tracking-widest text-foreground/40">
                  Artist
                </span>
                <span className="text-[10px] font-mono uppercase tracking-widest text-foreground/40">
                  Type
                </span>
                <span className="text-right text-[10px] font-mono uppercase tracking-widest text-foreground/40">
                  Popularity
                </span>
              </div>
            </div>
            {artists?.map((artist, index) => {
              const imageUrl = getArtistImageUrl(artist);

              return (
                <button
                  key={artist.id}
                  type="button"
                  onClick={() => handleArtistClick(artist)}
                  className="grid w-full grid-cols-[40px_1fr] items-center gap-4 border-b border-foreground/10 px-4 py-3 text-left transition-colors hover:bg-foreground/[0.02] lg:grid-cols-[40px_1fr_120px_100px] lg:px-6"
                >
                  <span className="text-center text-xs font-mono tabular-nums text-foreground/40">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex items-center gap-3">
                    <div className="h-10 w-10 shrink-0 overflow-hidden border border-foreground/10 bg-foreground/5">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={artist.name}
                          width={40}
                          height={40}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Users className="h-4 w-4 text-foreground/25" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-[13px] font-medium tracking-[-0.01em] text-foreground/90">
                        {artist.name}
                      </h3>
                      <p className="truncate text-[11px] font-mono uppercase tracking-wider text-foreground/40 lg:hidden">
                        {artist.type || "Artist"}
                      </p>
                    </div>
                  </div>
                  <p className="hidden text-[10px] font-mono uppercase tracking-wider text-foreground/40 lg:block">
                    {artist.type || "Artist"}
                  </p>
                  <p className="hidden text-right text-[12px] font-mono tabular-nums text-foreground/50 lg:block">
                    {artist.popularity ?? "-"}
                  </p>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="border-b border-foreground/10">
            {playlists?.map((playlist, index) => {
              const coverUrl = getPlaylistImageUrl(playlist);

              return (
                <button
                  key={playlist.uuid}
                  type="button"
                  onClick={() => handlePlaylistClick(playlist)}
                  className="grid w-full grid-cols-[40px_1fr_70px] items-center gap-4 border-b border-foreground/10 px-4 py-3 text-left transition-colors hover:bg-foreground/[0.02] lg:grid-cols-[40px_1fr_160px_80px] lg:px-6"
                >
                  <span className="text-center text-xs font-mono tabular-nums text-foreground/40">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex items-center gap-3">
                    <div className="h-10 w-10 shrink-0 overflow-hidden border border-foreground/10 bg-foreground/5">
                      {coverUrl ? (
                        <Image
                          src={coverUrl}
                          alt={playlist.title}
                          width={40}
                          height={40}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <ListMusic className="h-4 w-4 text-foreground/25" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-[13px] font-medium tracking-[-0.01em] text-foreground/90">
                        {playlist.title}
                      </h3>
                      <p className="truncate text-[11px] font-mono uppercase tracking-wider text-foreground/40 lg:hidden">
                        {getPlaylistCreator(playlist)}
                      </p>
                    </div>
                  </div>
                  <p className="text-right text-[12px] font-mono tabular-nums text-foreground/50 lg:hidden">
                    {playlist.numberOfTracks ?? "-"}
                  </p>
                  <p className="hidden truncate text-[12px] text-foreground/50 lg:block">
                    {getPlaylistCreator(playlist)}
                  </p>
                  <p className="hidden text-right text-[12px] font-mono tabular-nums text-foreground/50 lg:block">
                    {playlist.numberOfTracks ?? "-"}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </motion.div>

   {/* DISABLED: Infinite Scroll Loading Indicator */}
      {/* {isFetchingMore && (
    <motion.div
     initial={{ opacity: 0 }}
     animate={{ opacity: 1 }}
     className="flex items-center justify-center py-8 mt-4"
    >
     <div className="flex items-center gap-3 text-foreground/40">
      <Loader2 className="w-5 h-5 animate-spin" />
      <span className="text-sm font-medium">Loading more...</span>
     </div>
    </motion.div>
   )} */}

   {/* DISABLED: Intersection Observer Target */}
   {/* <div ref={observerTarget} className="h-4" /> */}
   <TrackPlaylistPickerDialog
    isOpen={playlistPickerTrack !== null}
    track={playlistPickerTrack}
    onClose={() => setPlaylistPickerTrack(null)}
   />
  </div>
 );
}
