"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Album, Track } from "@/lib/api/types";
import { api } from "@/lib/api";
import {
 useAudioPlayer,
 usePlaybackState,
 useQueue,
} from "@/contexts/AudioPlayerContext";
import { useLibrary } from "@/contexts/LibraryContext";
import { Heart, Library, Music2 } from "lucide-react";
import { toast } from "sonner";
import TrackRow from "@/components/search/TrackRow";
import MobileTrackRow from "@/components/mobile/MobileTrackRow";
import { TrackPlaylistPickerDialog } from "@/components/playlists/PlaylistDialogs";

interface TrackSectionProps {
 title: string;
 tracks: Track[];
 emptyText: string;
 isMobile: boolean;
 currentTrackId?: number;
 isPlaying: boolean;
 loadingTrackId: number | null;
 onPlayTrack: (index: number) => void;
 onAddToQueue?: (track: Track) => void;
 onPlayNext?: (track: Track) => void;
 onAddToPlaylist?: (track: Track) => void;
 onToggleLike?: (track: Track) => void;
 isTrackLiked?: (trackId: number) => boolean;
}

function TrackSection({
 title,
 tracks,
 emptyText,
 isMobile,
 currentTrackId,
 isPlaying,
 loadingTrackId,
 onPlayTrack,
 onAddToQueue,
 onPlayNext,
 onAddToPlaylist,
 onToggleLike,
 isTrackLiked,
}: TrackSectionProps) {
 return (
  <section className="space-y-3">
   <div className="flex items-center justify-between">
    <h2 className="text-xs font-mono uppercase tracking-widest text-foreground/90">
     {title}
    </h2>
    <span className="text-[10px] font-mono uppercase tracking-widest text-foreground/40">
     {tracks.length}
    </span>
   </div>

   {tracks.length === 0 ? (
    <div className="border border-foreground/10 px-6 py-10 text-center">
     <p className="text-[11px] font-mono uppercase tracking-wider text-foreground/40">
      {emptyText}
     </p>
    </div>
   ) : (
    <div className="border border-foreground/10">
     {!isMobile && (
      <div className="border-b border-foreground/10">
       <div className="grid grid-cols-[50px_40px_1fr_180px_120px_80px] gap-4 px-6 py-3">
        <span className="text-center text-[10px] font-mono uppercase tracking-widest text-foreground/40">
         #
        </span>
        <span />
        <span className="text-[10px] font-mono uppercase tracking-widest text-foreground/40">
         Title
        </span>
        <span className="text-[10px] font-mono uppercase tracking-widest text-foreground/40">
         Album
        </span>
        <span className="text-[10px] font-mono uppercase tracking-widest text-foreground/40">
         Quality
        </span>
        <span className="text-right text-[10px] font-mono uppercase tracking-widest text-foreground/40">
         Time
        </span>
       </div>
      </div>
     )}

     <div>
      {tracks.map((track, index) => {
       const isCurrentTrack = currentTrackId === track.id;

       if (isMobile) {
        return (
         <MobileTrackRow
          key={`${title}-${track.id}-${index}`}
          track={track}
          index={index}
          isCurrentTrack={isCurrentTrack}
          isPlaying={isCurrentTrack && isPlaying}
          isLoading={loadingTrackId === track.id}
          onClick={() => onPlayTrack(index)}
          onAddToQueue={onAddToQueue ? () => onAddToQueue(track) : undefined}
          onAddToPlaylist={onAddToPlaylist ? () => onAddToPlaylist(track) : undefined}
          onPlayNext={onPlayNext ? () => onPlayNext(track) : undefined}
          isLiked={isTrackLiked?.(track.id)}
          onToggleLike={onToggleLike ? () => onToggleLike(track) : undefined}
         />
        );
       }

       return (
        <TrackRow
         key={`${title}-${track.id}-${index}`}
         track={track}
         index={index}
         isCurrentTrack={isCurrentTrack}
         isPlaying={isCurrentTrack && isPlaying}
         isLoading={loadingTrackId === track.id}
         onClick={() => onPlayTrack(index)}
         onAddToPlaylist={onAddToPlaylist ? () => onAddToPlaylist(track) : undefined}
         onAddToQueue={onAddToQueue ? () => onAddToQueue(track) : undefined}
         onPlayNext={onPlayNext ? () => onPlayNext(track) : undefined}
         isLiked={isTrackLiked?.(track.id)}
         onToggleLike={onToggleLike ? () => onToggleLike(track) : undefined}
        />
       );
      })}
     </div>
    </div>
   )}
  </section>
 );
}

function getAlbumCoverUrl(album: Album): string | null {
 if (!album.cover) return null;
 return api.getCoverUrl(album.cover, "320");
}

export function LibraryClient() {
 const { isPlaying } = usePlaybackState();
 const { currentTrack } = useQueue();
 const { setQueue, addToQueue, playNextInQueue } = useAudioPlayer();
 const {
  likedTracks,
  recentlyPlayed,
  savedAlbums,
  isTrackLiked,
  toggleTrackLike,
  toggleAlbumSave,
  addRecentlyPlayed,
 } = useLibrary();

 const [loadingTrackId, setLoadingTrackId] = useState<number | null>(null);
 const [isMobile, setIsMobile] = useState(false);
 const [playlistPickerTrack, setPlaylistPickerTrack] = useState<Track | null>(null);

 useEffect(() => {
  const checkMobile = () => {
   setIsMobile(window.innerWidth < 1024);
  };
  checkMobile();
  window.addEventListener("resize", checkMobile);
  return () => window.removeEventListener("resize", checkMobile);
 }, []);

 const playTrackFromCollection = useCallback(
  async (collection: Track[], index: number) => {
   const selected = collection[index];
   if (!selected || loadingTrackId === selected.id) return;

   setLoadingTrackId(selected.id);
   try {
    await setQueue(collection, index);
    addRecentlyPlayed(selected);
   } finally {
    setLoadingTrackId(null);
   }
  },
  [addRecentlyPlayed, loadingTrackId, setQueue],
 );

 const handleAddToQueue = useCallback(
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

 const handlePlayNext = useCallback(
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

 const topRecentTracks = useMemo(() => recentlyPlayed.slice(0, 20), [recentlyPlayed]);

 return (
  <div className="min-h-screen">
   <header className="sticky top-0 z-30 border-b border-foreground/10 bg-background/95 backdrop-blur-xl">
    <div className="mx-auto max-w-6xl px-6 py-4">
     <div className="flex items-end justify-between">
      <div>
       <p className="text-[10px] font-mono uppercase tracking-widest text-foreground/40">
        Collection
       </p>
       <h1 className="mt-1 flex items-center gap-2 text-base font-semibold tracking-tight text-foreground/90">
        <Library className="h-4 w-4" />
        LIBRARY
       </h1>
      </div>
      <Link
       href="/"
       className="text-[10px] font-mono uppercase tracking-widest text-foreground/40 transition-colors hover:text-foreground/70"
      >
       Search
      </Link>
     </div>
    </div>
   </header>

   <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-8">
    <TrackSection
     title="Favorites"
     tracks={likedTracks}
     emptyText="No liked tracks yet"
     isMobile={isMobile}
     currentTrackId={currentTrack?.id}
     isPlaying={isPlaying}
     loadingTrackId={loadingTrackId}
     onPlayTrack={(index) => playTrackFromCollection(likedTracks, index)}
     onAddToQueue={handleAddToQueue}
     onPlayNext={handlePlayNext}
     onAddToPlaylist={setPlaylistPickerTrack}
     onToggleLike={toggleTrackLike}
     isTrackLiked={isTrackLiked}
    />

    <TrackSection
     title="Recently Played"
     tracks={topRecentTracks}
     emptyText="No recently played tracks yet"
     isMobile={isMobile}
     currentTrackId={currentTrack?.id}
     isPlaying={isPlaying}
     loadingTrackId={loadingTrackId}
     onPlayTrack={(index) => playTrackFromCollection(topRecentTracks, index)}
     onAddToQueue={handleAddToQueue}
     onPlayNext={handlePlayNext}
     onAddToPlaylist={setPlaylistPickerTrack}
     onToggleLike={toggleTrackLike}
     isTrackLiked={isTrackLiked}
    />

    <section className="space-y-3">
     <div className="flex items-center justify-between">
      <h2 className="text-xs font-mono uppercase tracking-widest text-foreground/90">
       Saved Albums
      </h2>
      <span className="text-[10px] font-mono uppercase tracking-widest text-foreground/40">
       {savedAlbums.length}
      </span>
     </div>

     {savedAlbums.length === 0 ? (
      <div className="border border-foreground/10 px-6 py-10 text-center">
       <p className="text-[11px] font-mono uppercase tracking-wider text-foreground/40">
        No saved albums yet
       </p>
      </div>
     ) : (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
       {savedAlbums.map((album) => {
        const coverUrl = getAlbumCoverUrl(album);
        const artistName =
         album.artist?.name || album.artists?.[0]?.name || "Unknown Artist";

        return (
         <article
          key={album.id}
          className="flex h-full flex-col border border-foreground/10 bg-background"
         >
          <Link href={`/album/${album.id}`} className="group block">
           <div className="relative aspect-square overflow-hidden border-b border-foreground/10 bg-foreground/5">
            {coverUrl ? (
             <Image
              src={coverUrl}
              alt={album.title}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover"
             />
            ) : (
             <div className="flex h-full w-full items-center justify-center">
              <Music2 className="h-6 w-6 text-foreground/25" />
             </div>
            )}
           </div>
           <div className="space-y-1 p-3">
            <h3 className="truncate text-[13px] font-medium text-foreground/90 group-hover:text-foreground">
             {album.title}
            </h3>
            <p className="truncate text-[12px] text-foreground/50">{artistName}</p>
           </div>
          </Link>
          <div className="mt-auto border-t border-foreground/10 p-2">
           <button
            type="button"
            onClick={() => toggleAlbumSave(album)}
            className="flex w-full items-center justify-center gap-2 border border-foreground/20 px-2 py-1.5 text-[10px] font-mono uppercase tracking-widest text-foreground/60 transition-colors hover:text-foreground"
           >
            <Heart className="h-3.5 w-3.5 fill-foreground text-foreground" />
            Remove
           </button>
          </div>
         </article>
        );
       })}
      </div>
     )}
   </section>
   <TrackPlaylistPickerDialog
    isOpen={playlistPickerTrack !== null}
    track={playlistPickerTrack}
    onClose={() => setPlaylistPickerTrack(null)}
   />
  </div>
 </div>
);
}
