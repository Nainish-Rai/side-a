"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { Album, Track } from "@/lib/api/types";
import {
 useAudioPlayer,
 usePlaybackState,
 useQueue,
} from "@/contexts/AudioPlayerContext";
import { Play, Pause, ArrowLeft, Music2 } from "lucide-react";
import { getTrackTitle, getTrackArtists, formatTime } from "@/lib/api/utils";
import { AudioPlayer } from "@/components/player/AudioPlayer";

interface AlbumClientProps {
 album: Album;
 tracks: Track[];
}

export function AlbumClient({ album, tracks }: AlbumClientProps) {
 const router = useRouter();

 // Use split contexts for state
 const { isPlaying } = usePlaybackState();
 const { currentTrack } = useQueue();

 // Still need AudioPlayerContext for methods
 const { setQueue, togglePlayPause } = useAudioPlayer();

 const handlePlayAlbum = () => {
  if (tracks.length > 0) {
   setQueue(tracks, 0);
  }
 };

 const handlePlayTrack = (track: Track, index: number) => {
  if (currentTrack?.id === track.id) {
   togglePlayPause();
  } else {
   setQueue(tracks, index);
  }
 };

 const totalDuration = tracks.reduce((acc, track) => acc + track.duration, 0);
 const formatTotalDuration = (seconds: number) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hrs > 0) return `${hrs} hr ${mins} min`;
  return `${mins} min`;
 };

 const coverUrl = album?.cover
  ? `https://resources.tidal.com/images/${album.cover.replace(
     /-/g,
     "/",
    )}/1280x1280.jpg`
  : null;

 const artistName =
  album?.artist?.name || album?.artists?.[0]?.name || "Unknown Artist";

 const year = album?.releaseDate
  ? new Date(album.releaseDate).getFullYear()
  : null;

 const isAlbumPlaying =
  currentTrack && tracks.some((t) => t.id === currentTrack.id);

 return (
  <div className="relative min-h-screen w-full bg-black">
   {/* Header Navigation - Brutalist Style */}
   <header className="sticky top-0 z-30 bg-black border-b border-white/10">
    <div className="max-w-6xl mx-auto px-6 py-4">
     <button
      onClick={() => router.back()}
      className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
     >
      <ArrowLeft className="w-5 h-5" />
      <span className="text-xs font-mono uppercase tracking-widest">Back</span>
     </button>
    </div>
   </header>

   {/* Content Container */}
   <div className="max-w-6xl mx-auto px-6 py-8 text-white">

    {/* Album Header Section - Brutalist Layout */}
    <div className="flex flex-col md:flex-row   gap-8 md:gap-12 mb-12 pb-8 border-b border-white/10">
     {/* Album Art - Square with Border */}
     <div className="relative shrink-0 w-[280px] md:w-[320px] aspect-square border border-white/10 overflow-hidden bg-white/5">
      {coverUrl ? (
       <Image
        src={coverUrl}
        alt={album.title}
        width={320}
        height={320}
        sizes="(max-width: 768px) 280px, 320px"
        quality={90}
        className="object-cover"
        priority={true}
       />
      ) : (
       <div className="w-full h-full bg-white/5 flex items-center justify-center">
        <Music2 className="w-20 h-20 text-white/20" />
       </div>
      )}
     </div>

     {/* Album Info */}
     <div className="flex-1 min-w-0 space-y-6">
      <div>
       <div className="text-[9px] tracking-widest uppercase text-white/40 font-mono mb-3">
        Album
       </div>
       <h1 className="text-3xl md:text-4xl lg:text-5xl font-medium text-white tracking-tight leading-tight mb-4">
        {album.title}
       </h1>

       <div className="text-base text-white/70 mb-4">{artistName}</div>

       {/* Album Metadata Grid */}
       <div className="flex items-center gap-6 pt-4 border-t border-white/10">
        {year && (
         <div>
          <div className="text-[9px] tracking-widest uppercase text-white/40 font-mono mb-1">
           Year
          </div>
          <div className="text-sm font-mono tabular-nums text-white/70">
           {year}
          </div>
         </div>
        )}
        <div>
         <div className="text-[9px] tracking-widest uppercase text-white/40 font-mono mb-1">
          Tracks
         </div>
         <div className="text-sm font-mono tabular-nums text-white/70">
          {tracks.length}
         </div>
        </div>
        <div>
         <div className="text-[9px] tracking-widest uppercase text-white/40 font-mono mb-1">
          Duration
         </div>
         <div className="text-sm font-mono tabular-nums text-white/70">
          {formatTotalDuration(totalDuration)}
         </div>
        </div>
       </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 pt-2">
       <button
        onClick={handlePlayAlbum}
        className="px-6 py-3 border-2 border-white bg-transparent text-white hover:bg-white hover:text-black transition-all flex items-center gap-2 font-mono uppercase text-xs tracking-widest"
       >
        {isAlbumPlaying && isPlaying ? (
         <>
          <Pause className="w-4 h-4 fill-current" />
          <span>Pause</span>
         </>
        ) : (
         <>
          <Play className="w-4 h-4 fill-current" />
          <span>Play Album</span>
         </>
        )}
       </button>
      </div>
     </div>
    </div>

    {/* Track List - Brutalist Table */}
    <div className="border-t border-white/10">
     {/* Table Header */}
     <div className="sticky top-0 z-20 bg-black/95 backdrop-blur-xl border-b border-white/10">
      <div className="grid grid-cols-[50px_1fr_120px_80px] md:grid-cols-[50px_1fr_180px_120px_80px] gap-4 px-6 py-3">
       <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">
        #
       </span>
       <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">
        Title
       </span>
       <span className="hidden md:block text-[10px] font-mono uppercase tracking-widest text-white/40 text-right">
        Album
       </span>
       <span className="text-[10px] font-mono uppercase tracking-widest text-white/40 text-right">
        Plays
       </span>
       <span className="text-[10px] font-mono uppercase tracking-widest text-white/40 text-right">
        Time
       </span>
      </div>
     </div>

     {/* Track Rows */}
     <div>
      {tracks.map((track, index) => {
       const isCurrent = currentTrack?.id === track.id;

       return (
        <div
         key={track.id}
         onClick={() => handlePlayTrack(track, index)}
         className={`grid grid-cols-[50px_1fr_120px_80px] md:grid-cols-[50px_1fr_180px_120px_80px] gap-4 items-center px-6 py-3 border-b border-white/10 cursor-pointer transition-all duration-200 hover:bg-white/[0.02] ${
          isCurrent
           ? "border-l-[3px] border-l-white pl-[21px]"
           : "border-l-[3px] border-l-transparent"
         }`}
        >
         {/* Track Number */}
         <div className="text-center">
          <span
           className={`text-sm font-mono ${isCurrent ? "text-white" : "text-white/40"}`}
          >
           {String(index + 1).padStart(2, "0")}
          </span>
         </div>

         {/* Title & Artist */}
         <div className="min-w-0">
          <h3
           className={`font-medium text-[15px] truncate transition-colors ${isCurrent ? "text-white" : "text-white/90 hover:text-white"}`}
          >
           {getTrackTitle(track)}
          </h3>
          <p
           className={`text-[13px] truncate transition-colors ${isCurrent ? "text-white/70" : "text-white/50 hover:text-white/70"}`}
          >
           {getTrackArtists(track)}
          </p>
         </div>

         {/* Album - Hidden on mobile */}
         <div className="hidden md:block min-w-0">
          <span className="text-[13px] text-white/30 italic truncate">
           {album.title}
          </span>
         </div>

         {/* Popularity */}
         <div className="text-right">
          <span className="text-[12px] font-mono text-white/40 tabular-nums">
           {track.popularity || "-"}
          </span>
         </div>

         {/* Duration */}
         <div className="text-right">
          <span className="text-[12px] font-mono text-white/40 tabular-nums">
           {formatTime(track.duration)}
          </span>
         </div>
        </div>
       );
      })}
     </div>
    </div>
   </div>

   {/* Fixed Audio Player */}
   <AudioPlayer />
  </div>
 );
}
