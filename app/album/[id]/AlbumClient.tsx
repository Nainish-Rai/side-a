"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "motion/react";
import { Album, Track } from "@/lib/api/types";
import { useAudioPlayer, usePlaybackState, useQueue } from "@/contexts/AudioPlayerContext";
import AppLayout from "@/components/layout/AppLayout";
import {
  Play,
  Pause,
  ArrowLeft,
  Clock,
  Music2,
  MoreHorizontal
} from "lucide-react";
import { getTrackTitle, getTrackArtists, formatTime } from "@/lib/api/utils";

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
        "/"
      )}/1280x1280.jpg`
    : null;

  const artistName =
    album?.artist?.name || album?.artists?.[0]?.name || "Unknown Artist";

  const year = album?.releaseDate
    ? new Date(album.releaseDate).getFullYear()
    : null;

  const isAlbumPlaying = currentTrack && tracks.some(t => t.id === currentTrack.id);

  return (
    <AppLayout>
      <div className="relative min-h-screen w-full overflow-hidden">
        {/* Background Layer - Blurry Album Art */}
        {/* Using fixed positioning to cover the screen, but z-0 to stay behind content.
            Sidebar in AppLayout has z-40 so it will stay on top. */}
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
          {coverUrl && (
            <div className="absolute inset-0">
              <Image
                src={coverUrl}
                alt=""
                fill
                sizes="100vw"
                quality={20}
                className="object-cover opacity-30 blur-3xl"
                priority={false}
                loading="eager"
              />
              <div className="absolute inset-0 bg-white/30 dark:bg-black/40" /> {/* Adaptable overlay */}
              <div className="absolute inset-0 bg-linear-to-b from-white/40 via-white/80 to-white dark:from-black/20 dark:via-black/60 dark:to-black" />
            </div>
          )}
          {/* Fallback gradient if no cover */}
          {!coverUrl && (
             <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-black" />
          )}
        </div>

        {/* Content Container */}
        <div className="relative z-10 px-6 py-8 md:px-8 lg:px-12 text-gray-900 dark:text-white">
          {/* Header Navigation */}
          <header className="flex items-center justify-between mb-8">
            <button
              onClick={() => router.back()}
              className="group flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 dark:bg-white/10 hover:bg-white/80 dark:hover:bg-white/20 backdrop-blur-md transition-all shadow-sm"
            >
              <ArrowLeft className="w-5 h-5 text-gray-900 dark:text-white/90" />
              <span className="text-sm font-medium text-gray-900 dark:text-white/90">Back</span>
            </button>
          </header>

          {/* Album Header Section */}
          <div className="flex flex-col md:flex-row gap-8 md:gap-12 lg:gap-16 mb-12 items-start md:items-end">
            {/* Album Art */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="relative shrink-0 w-[240px] md:w-[280px] lg:w-[320px] aspect-square rounded-xl overflow-hidden shadow-[0_24px_60px_-12px_rgba(0,0,0,0.3)] dark:shadow-[0_24px_60px_-12px_rgba(0,0,0,0.8)]"
            >
               {coverUrl ? (
                  <Image
                    src={coverUrl}
                    alt={album.title}
                    width={320}
                    height={320}
                    sizes="(max-width: 768px) 160px, 320px"
                    quality={90}
                    className="object-cover"
                    priority={true}
                  />
                ) : (
                  <div className="w-full h-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center">
                    <Music2 className="w-20 h-20 text-gray-400 dark:text-white/20" />
                  </div>
                )}
            </motion.div>

            {/* Album Info */}
            <div className="flex-1 min-w-0 space-y-6">
               <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
               >
                  <h4 className="text-xs font-bold tracking-widest uppercase text-gray-500 dark:text-white/60 mb-2">Album</h4>
                  <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold text-gray-900 dark:text-white tracking-tight leading-tight mb-4 drop-shadow-sm">
                    {album.title}
                  </h1>

                  <div className="flex items-center gap-2 text-lg md:text-xl text-gray-800 dark:text-white/90 font-medium">
                     <span className="hover:underline cursor-pointer">{artistName}</span>
                     <span className="text-gray-400 dark:text-white/40">•</span>
                     <span className="text-gray-600 dark:text-white/60">{year}</span>
                     <span className="text-gray-400 dark:text-white/40">•</span>
                     <span className="text-gray-600 dark:text-white/60 text-base">{tracks.length} tracks, {formatTotalDuration(totalDuration)}</span>
                  </div>
               </motion.div>

               {/* Actions */}
               <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="flex items-center gap-4 pt-2"
                >
                  <button
                    onClick={handlePlayAlbum}
                    className="h-14 px-8 rounded-full bg-walkman-orange text-white font-bold text-lg hover:scale-105 active:scale-95 transition-all shadow-lg shadow-walkman-orange/30 flex items-center gap-2"
                  >
                    {isAlbumPlaying && isPlaying ? (
                      <>
                         <Pause className="w-5 h-5 fill-current" />
                         <span>Pause</span>
                      </>
                    ) : (
                      <>
                         <Play className="w-5 h-5 fill-current" />
                         <span>Play</span>
                      </>
                    )}
                  </button>

                  {/* <button className="w-12 h-12 rounded-full border border-gray-300 dark:border-white/20 flex items-center justify-center text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-all">
                     <MoreHorizontal className="w-6 h-6" />
                  </button> */}
               </motion.div>
            </div>
          </div>

          {/* Track List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="rounded-2xl overflow-hidden"
          >
            {/* Table Header */}
            <div className="grid grid-cols-[auto_1fr_auto] md:grid-cols-[auto_1fr_auto_auto] gap-4 px-6 py-3 border-b border-gray-200/50 dark:border-white/5 text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider sticky top-0 bg-white/30 dark:bg-black/20 backdrop-blur-md z-10">
              <div className="w-8 text-center">#</div>
              <div>Title</div>
              <div className="hidden md:block text-right">Plays</div>
              <div className="text-right w-16"><Clock className="w-4 h-4 ml-auto" /></div>
            </div>

            <div className="divide-y divide-gray-200/50 dark:divide-white/5 bg-white/30 dark:bg-black/20 backdrop-blur-md">
               {tracks.map((track, index) => {
                 const isCurrent = currentTrack?.id === track.id;

                 return (
                   <div
                      key={track.id}
                      onClick={() => handlePlayTrack(track, index)}
                      className={`group grid grid-cols-[auto_1fr_auto] md:grid-cols-[auto_1fr_auto_auto] gap-4 px-6 py-3.5 hover:bg-white/40 dark:hover:bg-white/10 transition-colors cursor-pointer items-center ${
                        isCurrent ? "bg-white/50 dark:bg-white/15 shadow-sm" : ""
                      }`}
                   >
                      {/* Number / Play Icon */}
                      <div className="w-8 text-center text-sm font-medium text-gray-500 dark:text-white/40 group-hover:text-gray-900 dark:group-hover:text-white relative flex justify-center">
                         <span className={`group-hover:opacity-0 ${isCurrent ? 'opacity-0' : 'opacity-100'}`}>
                           {index + 1}
                         </span>
                         <div className={`absolute inset-0 flex items-center justify-center ${isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                            {isCurrent && isPlaying ? (
                               <div className="w-4 h-4">
                                  <div className="flex items-end justify-center gap-[2px] h-full w-full">
                                      <div className="w-[3px] h-full bg-walkman-orange animate-[music-bar_0.5s_ease-in-out_infinite]" />
                                      <div className="w-[3px] h-3/4 bg-walkman-orange animate-[music-bar_0.5s_ease-in-out_infinite_0.1s]" />
                                      <div className="w-[3px] h-1/2 bg-walkman-orange animate-[music-bar_0.5s_ease-in-out_infinite_0.2s]" />
                                  </div>
                               </div>
                            ) : (
                               <Play className="w-4 h-4 text-gray-900 dark:text-white fill-current" />
                            )}
                         </div>
                      </div>

                      {/* Title & Artist */}
                      <div className="min-w-0">
                         <div className={`font-medium text-base truncate ${isCurrent ? "text-walkman-orange" : "text-gray-900 dark:text-white group-hover:text-black dark:group-hover:text-white"}`}>
                            {getTrackTitle(track)}
                         </div>
                         <div className={`text-sm truncate mt-0.5 ${isCurrent ? "text-walkman-orange/80" : "text-gray-500 dark:text-white/50 group-hover:text-gray-700 dark:group-hover:text-white/70"}`}>
                            {getTrackArtists(track)}
                         </div>
                      </div>

                      {/* Popularity (Hidden on mobile) */}
                      <div className="hidden md:block text-right text-sm text-gray-500 dark:text-white/40 font-mono">
                          {track.popularity ? <span className="opacity-50">{track.popularity}%</span> : "-"}
                      </div>

                      {/* Duration */}
                      <div className="text-right text-sm text-gray-500 dark:text-white/40 font-mono tabular-nums w-16">
                         {formatTime(track.duration)}
                      </div>
                   </div>
                 );
               })}
            </div>
          </motion.div>

          <div className="mt-8 text-xs text-gray-400 dark:text-white/30 text-center font-mono">
             {year} • {tracks.length} tracks • {formatTotalDuration(totalDuration)}
          </div>
        </div>
      </div>

      {/* Animation Styles */}
      <style jsx global>{`
        @keyframes music-bar {
          0%, 100% { height: 40%; }
          50% { height: 100%; }
        }
      `}</style>
    </AppLayout>
  );
}
