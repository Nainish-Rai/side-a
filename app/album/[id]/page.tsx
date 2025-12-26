"use client";

import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { useAlbum } from "@/hooks/useAlbum";
import { Track } from "@/lib/api/types";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import AppLayout from "@/components/layout/AppLayout";
import { Play, Pause, ArrowLeft, Clock, Disc3, Music2 } from "lucide-react";

export default function AlbumPage() {
  const params = useParams();
  const router = useRouter();
  const albumId = parseInt(params.id as string);
  const { setQueue, currentTrack, isPlaying } = useAudioPlayer();

  const { data, isLoading, error } = useAlbum(albumId);

  const album = data?.album || null;
  const tracks = data?.tracks || [];

  const handlePlayAlbum = () => {
    if (tracks.length > 0) {
      setQueue(tracks, 0);
    }
  };

  const handlePlayTrack = (track: Track, index: number) => {
    setQueue(tracks, index);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const totalDuration = tracks.reduce((acc, track) => acc + track.duration, 0);
  const totalMinutes = Math.floor(totalDuration / 60);

  const coverUrl = album?.cover
    ? `https://resources.tidal.com/images/${album.cover.replace(
        /-/g,
        "/"
      )}/1280x1280.jpg`
    : "/placeholder-album.png";

  const artistName =
    album?.artist?.name || album?.artists?.[0]?.name || "Unknown Artist";
  const year = album?.releaseDate
    ? new Date(album.releaseDate).getFullYear()
    : null;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="inline-block"
            >
              <Disc3 className="w-12 h-12 text-carbon dark:text-bone" />
            </motion.div>
            <p className="mt-4 font-mono text-sm text-carbon dark:text-bone">
              LOADING ALBUM...
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error || !album) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Music2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-mono font-bold text-carbon dark:text-bone mb-2">
              {error
                ? error instanceof Error
                  ? error.message
                  : String(error)
                : "Album not found"}
            </h2>
            <button
              onClick={() => router.back()}
              className="mt-4 px-6 py-2 border-2 border-carbon dark:border-bone font-mono text-sm
                       hover:bg-carbon hover:text-bone dark:hover:bg-bone dark:hover:text-carbon
                       transition-colors duration-200"
            >
              GO BACK
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* Header with Back Button */}
      <header className="sticky top-0 bg-white dark:bg-[#1a1a1a] border-b-2 border-carbon dark:border-bone z-30 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-2 border-2 border-carbon dark:border-bone
                     font-mono text-sm hover:bg-carbon hover:text-bone dark:hover:bg-bone dark:hover:text-carbon
                     transition-colors duration-200 shadow-[2px_2px_0px_0px_rgba(16,16,16,1)]
                     dark:shadow-[2px_2px_0px_0px_rgba(242,239,233,1)]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>BACK</span>
          </button>

          <div className="text-[9px] tracking-widest uppercase font-mono text-gray-500 dark:text-gray-400">
            Album Details
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8">
        {/* Cassette Tape Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          {/* Cassette Shell */}
          <div
            className="relative bg-white dark:bg-[#1a1a1a] border-4 border-carbon dark:border-bone rounded-lg
                          shadow-[12px_12px_0px_0px_rgba(16,16,16,1)] dark:shadow-[12px_12px_0px_0px_rgba(242,239,233,1)]
                          overflow-hidden"
          >
            {/* Cassette Top Section - Orange Header */}
            <div className="bg-walkman-orange border-b-4 border-carbon dark:border-bone p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Cassette Reel Circles */}
                  <div className="flex gap-2">
                    <motion.div
                      animate={{ rotate: isPlaying ? 360 : 0 }}
                      transition={{
                        duration: 2,
                        repeat: isPlaying ? Infinity : 0,
                        ease: "linear",
                      }}
                      className="w-8 h-8 rounded-full border-4 border-carbon bg-white flex items-center justify-center"
                    >
                      <div className="w-3 h-3 rounded-full bg-carbon" />
                    </motion.div>
                    <motion.div
                      animate={{ rotate: isPlaying ? 360 : 0 }}
                      transition={{
                        duration: 2,
                        repeat: isPlaying ? Infinity : 0,
                        ease: "linear",
                      }}
                      className="w-8 h-8 rounded-full border-4 border-carbon bg-white flex items-center justify-center"
                    >
                      <div className="w-3 h-3 rounded-full bg-carbon" />
                    </motion.div>
                  </div>
                  <div className="font-mono text-[10px] tracking-widest uppercase text-carbon font-bold">
                    SIDE A • Hi-Fi
                  </div>
                </div>
                <div className="font-mono text-[10px] text-carbon/70">
                  {totalMinutes}&apos; {tracks.length} TRACKS
                </div>
              </div>
            </div>

            {/* Main Cassette Body */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
              {/* Left: Album Cover Window */}
              <div
                className="lg:col-span-1 p-6 border-r-0 lg:border-r-4 border-b-4 lg:border-b-0 border-carbon dark:border-bone
                              bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#151515] dark:to-[#0a0a0a]"
              >
                <div className="relative">
                  {/* Cassette Window Frame */}
                  <div
                    className="absolute inset-0 border-2 border-carbon dark:border-bone -m-2 pointer-events-none z-10"
                    style={{ boxShadow: "inset 0 0 20px rgba(0,0,0,0.1)" }}
                  />

                  {/* Cover Image */}
                  <div className="relative w-full aspect-square border-2 border-carbon dark:border-bone overflow-hidden">
                    <Image
                      src={coverUrl}
                      alt={album.title}
                      fill
                      priority
                      sizes="(max-width: 1024px) 100vw, 33vw"
                      className="object-cover"
                    />
                  </div>

                  {/* Magnetic Tape Visual */}
                  <div className="mt-3 flex gap-1 justify-center">
                    {[...Array(12)].map((_, i) => (
                      <div
                        key={i}
                        className="w-1 h-2 bg-carbon/20 dark:bg-bone/20"
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: Handwritten Label Insert */}
              <div
                className="lg:col-span-2 p-8 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50
                              dark:from-[#1a1510] dark:via-[#1a1612] dark:to-[#1a1410]
                              relative overflow-hidden"
              >
                {/* Paper Texture Overlay */}
                <div
                  className="absolute inset-0 opacity-30 dark:opacity-20"
                  style={{
                    backgroundImage: `repeating-linear-gradient(
                         0deg,
                         transparent,
                         transparent 2px,
                         rgba(0,0,0,0.03) 2px,
                         rgba(0,0,0,0.03) 4px
                       )`,
                  }}
                />

                {/* Handwritten Style Content */}
                <div className="relative z-10">
                  {/* Small Label Text */}
                  <div className="mb-4 pb-2 border-b border-dashed border-carbon/30 dark:border-bone/30">
                    <div className="font-mono text-[9px] tracking-widest text-carbon/60 dark:text-bone/60 uppercase">
                      Album Details
                    </div>
                  </div>

                  {/* Album Title - Handwritten Style */}
                  <div className="mb-6">
                    <h1
                      className="text-3xl lg:text-4xl font-bold text-carbon dark:text-bone mb-2 leading-tight
                                   tracking-tight"
                      style={{
                        fontFamily:
                          'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
                        textShadow: "1px 1px 0px rgba(0,0,0,0.1)",
                      }}
                    >
                      {album.title}
                    </h1>
                    <div className="h-px bg-carbon/20 dark:bg-bone/20 w-24" />
                  </div>

                  {/* Artist Name - Handwritten */}
                  <div className="mb-8">
                    <div className="text-[10px] tracking-widest uppercase text-carbon/50 dark:text-bone/50 font-mono mb-1">
                      Artist
                    </div>
                    <p
                      className="text-xl lg:text-2xl text-carbon dark:text-bone"
                      style={{
                        fontFamily:
                          'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
                      }}
                    >
                      {artistName}
                    </p>
                  </div>

                  {/* Info Grid - Handwritten Notes Style */}
                  <div className="grid grid-cols-3 gap-6 mb-8">
                    {year && (
                      <div>
                        <div className="text-[9px] tracking-widest uppercase text-carbon/50 dark:text-bone/50 font-mono mb-1.5">
                          Year
                        </div>
                        <div
                          className="text-2xl font-bold text-carbon dark:text-bone"
                          style={{ fontFamily: "ui-serif, Georgia, Cambria" }}
                        >
                          {year}
                        </div>
                        <div className="h-px bg-carbon/20 dark:bg-bone/20 w-12 mt-1" />
                      </div>
                    )}
                    <div>
                      <div className="text-[9px] tracking-widest uppercase text-carbon/50 dark:text-bone/50 font-mono mb-1.5">
                        Tracks
                      </div>
                      <div
                        className="text-2xl font-bold text-carbon dark:text-bone"
                        style={{ fontFamily: "ui-serif, Georgia, Cambria" }}
                      >
                        {tracks.length}
                      </div>
                      <div className="h-px bg-carbon/20 dark:bg-bone/20 w-12 mt-1" />
                    </div>
                    <div>
                      <div className="text-[9px] tracking-widest uppercase text-carbon/50 dark:text-bone/50 font-mono mb-1.5">
                        Duration
                      </div>
                      <div
                        className="text-2xl font-bold text-carbon dark:text-bone"
                        style={{ fontFamily: "ui-serif, Georgia, Cambria" }}
                      >
                        {totalMinutes}&apos;
                      </div>
                      <div className="h-px bg-carbon/20 dark:bg-bone/20 w-12 mt-1" />
                    </div>
                  </div>

                  {/* Play Button - Cassette Player Style */}
                  <button
                    onClick={handlePlayAlbum}
                    disabled={tracks.length === 0}
                    className="w-full py-4 bg-walkman-orange border-3 border-carbon
                             font-mono font-bold text-base text-carbon uppercase tracking-wider
                             shadow-[4px_4px_0px_0px_rgba(16,16,16,1)]
                             hover:shadow-[6px_6px_0px_0px_rgba(16,16,16,1)]
                             hover:translate-x-[-2px] hover:translate-y-[-2px]
                             active:shadow-[2px_2px_0px_0px_rgba(16,16,16,1)]
                             active:translate-x-[2px] active:translate-y-[2px]
                             disabled:opacity-50 disabled:cursor-not-allowed
                             transition-all duration-150 flex items-center justify-center gap-3
                             rounded-sm"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-carbon border-b-[6px] border-b-transparent" />
                      <span>Play Album</span>
                    </div>
                  </button>

                  {/* Bottom Corner Note */}
                  <div className="mt-6 pt-4 border-t border-dashed border-carbon/20 dark:border-bone/20">
                    <div className="text-[10px] text-carbon/40 dark:text-bone/40 font-mono italic">
                      Recorded {year || "N/A"} • {tracks.length} selections
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Cassette Bottom Screws */}
            <div className="absolute bottom-4 left-4 w-3 h-3 rounded-full border-2 border-carbon/30 dark:border-bone/30 bg-gray-300 dark:bg-gray-700" />
            <div className="absolute bottom-4 right-4 w-3 h-3 rounded-full border-2 border-carbon/30 dark:border-bone/30 bg-gray-300 dark:bg-gray-700" />
            <div className="absolute top-20 left-4 w-3 h-3 rounded-full border-2 border-carbon/30 dark:border-bone/30 bg-gray-300 dark:bg-gray-700" />
            <div className="absolute top-20 right-4 w-3 h-3 rounded-full border-2 border-carbon/30 dark:border-bone/30 bg-gray-300 dark:bg-gray-700" />
          </div>
        </motion.div>

        {/* Track List - Control Panel Style */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div
            className="bg-white dark:bg-[#1a1a1a] border-2 border-carbon dark:border-bone
                        shadow-[8px_8px_0px_0px_rgba(16,16,16,1)] dark:shadow-[8px_8px_0px_0px_rgba(242,239,233,1)]"
          >
            {/* Header */}
            <div className="border-b-2 border-carbon dark:border-bone p-4 bg-gray-50 dark:bg-[#0f0f0f]">
              <div className="text-[9px] tracking-widest uppercase text-gray-500 dark:text-gray-400 font-mono">
                TRACK LISTING
              </div>
            </div>

            {/* Track Grid Header */}
            <div className="border-b border-gray-200 dark:border-gray-800 p-4 hidden lg:grid grid-cols-12 gap-4 text-[9px] tracking-widest uppercase text-gray-500 dark:text-gray-400 font-mono">
              <div className="col-span-1 text-center">#</div>
              <div className="col-span-6">TITLE</div>
              <div className="col-span-3">ARTIST</div>
              <div className="col-span-2 text-right">
                <Clock className="w-3 h-3 inline mr-1" />
                TIME
              </div>
            </div>

            {/* Tracks */}
            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              <AnimatePresence>
                {tracks.map((track, index) => {
                  const isCurrentTrack = currentTrack?.id === track.id;
                  const isTrackPlaying = isCurrentTrack && isPlaying;

                  return (
                    <motion.div
                      key={track.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.03 }}
                      className={`group grid grid-cols-12 gap-4 p-4 hover:bg-gray-50 dark:hover:bg-[#0f0f0f]
                                transition-colors duration-150 cursor-pointer
                                ${
                                  isCurrentTrack
                                    ? "bg-walkman-orange/10 dark:bg-walkman-orange/5"
                                    : ""
                                }`}
                      onClick={() => handlePlayTrack(track, index)}
                    >
                      {/* Track Number / Play Button */}
                      <div className="col-span-12 lg:col-span-1 flex items-center justify-center">
                        <div className="relative w-8 h-8 flex items-center justify-center">
                          <span
                            className={`font-mono text-sm group-hover:opacity-0 transition-opacity
                                        ${
                                          isCurrentTrack
                                            ? "text-walkman-orange font-bold"
                                            : "text-gray-600 dark:text-gray-400"
                                        }`}
                          >
                            {track.trackNumber || index + 1}
                          </span>
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            {isTrackPlaying ? (
                              <Pause className="w-4 h-4 text-walkman-orange fill-current" />
                            ) : (
                              <Play className="w-4 h-4 text-walkman-orange fill-current" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Title */}
                      <div className="col-span-12 lg:col-span-6 flex items-center">
                        <div className="min-w-0">
                          <p
                            className={`font-mono font-medium text-sm truncate
                                      ${
                                        isCurrentTrack
                                          ? "text-walkman-orange"
                                          : "text-carbon dark:text-bone"
                                      }`}
                          >
                            {track.title}
                          </p>
                          {track.version && (
                            <p className="text-xs font-mono text-gray-500 dark:text-gray-400 truncate mt-0.5">
                              {track.version}
                            </p>
                          )}
                        </div>
                        {track.explicit && (
                          <span className="ml-2 px-1.5 py-0.5 text-[8px] font-mono border border-gray-400 dark:border-gray-600 rounded">
                            E
                          </span>
                        )}
                      </div>

                      {/* Artist */}
                      <div className="col-span-8 lg:col-span-3 flex items-center">
                        <p className="text-sm font-mono text-gray-600 dark:text-gray-400 truncate">
                          {track.artist?.name ||
                            track.artists?.[0]?.name ||
                            artistName}
                        </p>
                      </div>

                      {/* Duration */}
                      <div className="col-span-4 lg:col-span-2 flex items-center justify-end">
                        <p className="text-sm font-mono text-gray-600 dark:text-gray-400 tabular-nums">
                          {formatDuration(track.duration)}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
}
