"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { api } from "@/lib/api";
import { Album, Track } from "@/lib/api/types";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import AppLayout from "@/components/layout/AppLayout";
import {
  Play,
  Pause,
  ArrowLeft,
  Clock,
  Calendar,
  Disc3,
  Music2,
} from "lucide-react";

export default function AlbumPage() {
  const params = useParams();
  const router = useRouter();
  const albumId = parseInt(params.id as string);
  const { setQueue, currentTrack, isPlaying } = useAudioPlayer();

  const [album, setAlbum] = useState<Album | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAlbumData = async () => {
      if (!albumId || isNaN(albumId)) {
        setError("Invalid album ID");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const data = await api.getAlbum(albumId);
        setAlbum(data.album);
        setTracks(data.tracks);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch album:", err);
        setError("Failed to load album details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAlbumData();
  }, [albumId]);

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
              {error || "Album not found"}
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
        {/* Album Header - Bento Grid Style */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Album Cover - Large Block */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-1"
          >
            <div
              className="relative bg-white dark:bg-[#1a1a1a] border-2 border-carbon dark:border-bone
                          shadow-[8px_8px_0px_0px_rgba(16,16,16,1)] dark:shadow-[8px_8px_0px_0px_rgba(242,239,233,1)]
                          overflow-hidden"
            >
              {/* Cover Image */}
              <div className="relative w-full aspect-square">
                <Image
                  src={coverUrl}
                  alt={album.title}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  className="object-cover"
                />
              </div>

              {/* Label Strip */}
              <div className="border-t-2 border-carbon dark:border-bone p-3 bg-walkman-orange">
                <div className="text-[9px] tracking-widest uppercase font-mono text-carbon">
                  Hi-Fi Lossless
                </div>
              </div>
            </div>
          </motion.div>

          {/* Album Info - Information Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-2"
          >
            <div
              className="bg-white dark:bg-[#1a1a1a] border-2 border-carbon dark:border-bone
                          shadow-[8px_8px_0px_0px_rgba(16,16,16,1)] dark:shadow-[8px_8px_0px_0px_rgba(242,239,233,1)]
                          p-6 h-full flex flex-col"
            >
              {/* Label */}
              <div className="text-[9px] tracking-widest uppercase text-gray-500 dark:text-gray-400 font-mono mb-3">
                ALBUM
              </div>

              {/* Album Title */}
              <h1 className="text-3xl lg:text-4xl font-mono font-bold text-carbon dark:text-bone mb-4 leading-tight">
                {album.title}
              </h1>

              {/* Artist */}
              <p className="text-xl font-mono text-gray-700 dark:text-gray-300 mb-6">
                {artistName}
              </p>

              {/* Stats Grid - Swiss Style */}
              <div className="grid grid-cols-3 gap-4 mb-6 pb-6 border-b-2 border-gray-200 dark:border-gray-800">
                {year && (
                  <div className="text-center">
                    <Calendar className="w-5 h-5 mx-auto mb-2 text-walkman-orange" />
                    <div className="text-[9px] tracking-widest uppercase text-gray-400 dark:text-gray-600 font-mono mb-1">
                      YEAR
                    </div>
                    <div className="text-lg font-mono font-bold text-carbon dark:text-bone">
                      {year}
                    </div>
                  </div>
                )}
                <div className="text-center">
                  <Music2 className="w-5 h-5 mx-auto mb-2 text-walkman-orange" />
                  <div className="text-[9px] tracking-widest uppercase text-gray-400 dark:text-gray-600 font-mono mb-1">
                    TRACKS
                  </div>
                  <div className="text-lg font-mono font-bold text-carbon dark:text-bone">
                    {tracks.length}
                  </div>
                </div>
                <div className="text-center">
                  <Clock className="w-5 h-5 mx-auto mb-2 text-walkman-orange" />
                  <div className="text-[9px] tracking-widest uppercase text-gray-400 dark:text-gray-600 font-mono mb-1">
                    DURATION
                  </div>
                  <div className="text-lg font-mono font-bold text-carbon dark:text-bone">
                    {totalMinutes} MIN
                  </div>
                </div>
              </div>

              {/* Play Button - Tactile Control */}
              <button
                onClick={handlePlayAlbum}
                disabled={tracks.length === 0}
                className="mt-auto w-full py-4 bg-walkman-orange border-2 border-carbon dark:border-bone
                         font-mono font-bold text-lg text-carbon
                         shadow-[4px_4px_0px_0px_rgba(16,16,16,1)] dark:shadow-[4px_4px_0px_0px_rgba(16,16,16,1)]
                         hover:shadow-[6px_6px_0px_0px_rgba(16,16,16,1)] dark:hover:shadow-[6px_6px_0px_0px_rgba(16,16,16,1)]
                         hover:translate-x-[-2px] hover:translate-y-[-2px]
                         active:shadow-[2px_2px_0px_0px_rgba(16,16,16,1)]
                         active:translate-x-[2px] active:translate-y-[2px]
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-all duration-150 flex items-center justify-center gap-3"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>PLAY ALBUM</span>
              </button>
            </div>
          </motion.div>
        </div>

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
