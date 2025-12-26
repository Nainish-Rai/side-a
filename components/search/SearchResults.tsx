"use client";

import { Track } from "@/lib/api/types";
import { getTrackTitle, getTrackArtists, formatTime } from "@/lib/api/utils";
import { Music, Play } from "lucide-react";
import { api } from "@/lib/api";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import Image from "next/image";
import { useState } from "react";

interface SearchResultsProps {
  tracks: Track[];
  isLoading?: boolean;
}

export function SearchResults({
  tracks,
  isLoading = false,
}: SearchResultsProps) {
  const { playTrack, currentTrack, isPlaying } = useAudioPlayer();
  const [loadingTrackId, setLoadingTrackId] = useState<number | null>(null);

  const handleTrackClick = async (track: Track) => {
    if (loadingTrackId === track.id) return;

    setLoadingTrackId(track.id);
    try {
      const streamUrl = await api.getStreamUrl(track.id);
      if (streamUrl) {
        playTrack(track, streamUrl);
      } else {
        console.error("Failed to get stream URL for track:", track.id);
      }
    } catch (error) {
      console.error("Error playing track:", error);
    } finally {
      setLoadingTrackId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="grid grid-cols-1 gap-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="p-4 bg-bone border border-gray-300 animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-gray-200"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (tracks.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 gap-3">
        {tracks.map((track) => {
          // Check if album has a cover UUID, otherwise use album ID
          const coverId = track.album?.cover || track.album?.id;
          const coverUrl = coverId
            ? api.getCoverUrl(coverId, "320")
            : undefined;

          const isCurrentTrack = currentTrack?.id === track.id;

          return (
            <div
              key={track.id}
              onClick={() => handleTrackClick(track)}
              className={`group relative p-4 bg-white border border-carbon
                         hover:bg-bone hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]
                         active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]
                         active:translate-x-[1px] active:translate-y-[1px]
                         transition-all duration-150 cursor-pointer
                         ${isCurrentTrack && isPlaying ? "border-walkman-orange border-2" : ""}
                         ${loadingTrackId === track.id ? "opacity-50" : ""}`}
            >
              {loadingTrackId === track.id && (
                <div className="absolute inset-0 bg-white/90 flex items-center justify-center z-10">
                  <div className="w-6 h-6 border-2 border-carbon border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              
              <div className="flex items-center gap-4">
                {/* Album Art */}
                <div className="relative flex-shrink-0 w-14 h-14 bg-bone border border-carbon overflow-hidden
                               shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]">
                  {coverUrl ? (
                    <Image
                      src={coverUrl}
                      alt={track.album?.title || "Album cover"}
                      width={56}
                      height={56}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music className="w-6 h-6 text-carbon" />
                    </div>
                  )}
                  
                  {/* Play indicator overlay */}
                  <div className="absolute inset-0 bg-carbon/0 group-hover:bg-carbon/70 
                                  transition-all duration-200 flex items-center justify-center">
                    <Play className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 
                                   transition-opacity duration-200 fill-white" />
                  </div>
                </div>

                {/* Track Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-[9px] font-mono tracking-widest mb-1 uppercase text-gray-500">
                    TRACK
                  </div>
                  <h3 className="text-carbon font-medium text-sm truncate mb-0.5 font-mono">
                    {getTrackTitle(track)}
                  </h3>
                  <p className="text-gray-600 text-xs truncate font-mono">
                    {getTrackArtists(track)}
                  </p>
                  {track.album?.title && (
                    <p className="text-gray-400 text-[10px] truncate mt-1 font-mono">
                      {track.album.title}
                    </p>
                  )}
                </div>

                {/* Duration Display */}
                <div className="flex-shrink-0 text-right">
                  <div className="text-[9px] font-mono tracking-widest mb-1 uppercase text-gray-500">
                    DURATION
                  </div>
                  <div className="text-carbon text-sm font-mono tabular-nums font-bold">
                    {formatTime(track.duration)}
                  </div>
                </div>

                {/* Now Playing Indicator */}
                {isCurrentTrack && isPlaying && (
                  <div className="absolute top-2 right-2">
                    <div className="flex items-center gap-0.5">
                      <div className="w-0.5 h-3 bg-walkman-orange animate-pulse"></div>
                      <div className="w-0.5 h-2 bg-walkman-orange animate-pulse" style={{ animationDelay: "0.1s" }}></div>
                      <div className="w-0.5 h-4 bg-walkman-orange animate-pulse" style={{ animationDelay: "0.2s" }}></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
