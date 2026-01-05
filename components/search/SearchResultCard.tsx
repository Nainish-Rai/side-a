"use client";

import { Track } from "@/lib/api/types";
import { getTrackTitle, formatTime } from "@/lib/api/utils";
import { Play, Disc, TrendingUp, Clock } from "lucide-react";
import { api } from "@/lib/api";
import Image from "next/image";

interface SearchResultCardProps {
  track: Track;
  isCurrentTrack: boolean;
  isPlaying: boolean;
  isLoading: boolean;
  onClick: () => void;
}

export function SearchResultCard({
  track,
  isCurrentTrack,
  isPlaying,
  isLoading,
  onClick,
}: SearchResultCardProps) {
  const coverId = track.album?.cover || track.album?.id;
  const coverUrl = coverId ? api.getCoverUrl(coverId, "320") : undefined;

  // Artists
  const allArtists = track.artists || (track.artist ? [track.artist] : []);
  const mainArtists = allArtists.filter((a) => a.type === "MAIN");
  const displayArtist = mainArtists.length > 0 ? mainArtists.map(a => a.name).join(", ") : track.artist?.name || "Unknown Artist";

  const isExplicit = track.explicit;

  // Metadata Tags
  const qualityTags = track.mediaMetadata?.tags || [];
  const hasHiRes = qualityTags.includes("HIRES_LOSSLESS");
  const hasLossless = qualityTags.includes("LOSSLESS");
  const hasDolbyAtmos = qualityTags.includes("DOLBY_ATMOS");

  return (
    <div
      onClick={onClick}
      className={`group relative flex items-center gap-4 p-2 pr-4 rounded-lg transition-colors w-full cursor-pointer
        ${
          isCurrentTrack
            ? "bg-walkman-orange/10 hover:bg-walkman-orange/20"
            : "hover:bg-white/5"
        }
        ${isLoading ? "opacity-50 pointer-events-none" : ""}
      `}
    >
      {/* Cover Art / Play Overlay */}
      <div className="relative shrink-0 w-12 h-12 rounded-md overflow-hidden bg-neutral-800 shadow-sm">
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={track.album?.title || "Album cover"}
            width={48}
            height={48}
            className={`w-full h-full object-cover transition-opacity duration-300 ${isCurrentTrack && isPlaying ? "opacity-40" : "group-hover:opacity-40"}`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-white/5">
            <Disc className="w-5 h-5 text-white/20" />
          </div>
        )}

        {/* Overlay Icon (Play/Pause/Wave) */}
        <div className={`absolute inset-0 flex items-center justify-center
            ${isCurrentTrack && isPlaying ? "opacity-100" : "opacity-0 group-hover:opacity-100"}
        `}>
           {isCurrentTrack && isPlaying ? (
               <div className="flex items-end gap-[2px] h-4 mb-1">
                 <div className="w-1 bg-walkman-orange animate-[music-bar_0.5s_ease-in-out_infinite]" />
                 <div className="w-1 bg-walkman-orange animate-[music-bar_0.5s_ease-in-out_0.1s_infinite]" />
                 <div className="w-1 bg-walkman-orange animate-[music-bar_0.5s_ease-in-out_0.2s_infinite]" />
                 <div className="w-1 bg-walkman-orange animate-[music-bar_0.5s_ease-in-out_0.3s_infinite]" />
               </div>
           ) : (
             <Play className="w-5 h-5 text-white fill-white" />
           )}
        </div>
      </div>

      {/* Track Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex items-center gap-2">
            <h3 className={`font-medium text-sm truncate ${isCurrentTrack ? "text-walkman-orange" : "text-white"}`}>
              {getTrackTitle(track)}
            </h3>
            {isExplicit && (
                <span className="shrink-0 text-[9px] font-bold px-1 rounded text-neutral-400 border border-neutral-600">E</span>
            )}
        </div>
        <div className="flex items-center text-sm text-neutral-400 truncate mt-0.5">
           <span className="truncate hover:text-white transition-colors">
               {displayArtist}
           </span>
        </div>
      </div>

      {/* Album (Hidden on small screens) */}
      <div className="hidden md:flex flex-1 min-w-0 items-center text-sm text-neutral-500 truncate group-hover:text-neutral-300 transition-colors">
        {track.album?.title}
      </div>

      {/* Duration */}
      <div className="shrink-0 text-xs font-mono text-neutral-500 w-10 text-right group-hover:text-neutral-300">
        {formatTime(track.duration)}
      </div>

      {/* Detailed Metadata Popover (Hover) */}
      <div className="absolute top-full left-0 sm:left-14 right-0 z-50 pt-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-[-5px] group-hover:translate-y-0 pointer-events-none group-hover:pointer-events-auto hidden sm:block">
        <div className="bg-[#1a1a1a] border border-white/10 rounded-lg p-3 shadow-2xl backdrop-blur-xl">
           <div className="flex items-center gap-3 flex-wrap">
              {/* Quality Badges */}
              {hasDolbyAtmos && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 bg-walkman-orange text-white rounded-sm">
                  DOLBY ATMOS
                </span>
              )}
              {hasHiRes && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 bg-walkman-yellow text-black rounded-sm">
                  HI-RES
                </span>
              )}
              {hasLossless && !hasHiRes && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 bg-white/10 text-white border border-white/10 rounded-sm">
                  LOSSLESS
                </span>
              )}

              {/* Popularity */}
              {track.popularity !== undefined && (
                <div className="flex items-center gap-1 text-[10px] text-neutral-400">
                  <TrendingUp className="w-3 h-3" />
                  <span>{track.popularity}</span>
                </div>
              )}

              {/* BPM */}
              {track.bpm && (
                <div className="flex items-center gap-1 text-[10px] text-neutral-400">
                  <Clock className="w-3 h-3" />
                  <span>{track.bpm} BPM</span>
                </div>
              )}

              {/* Key */}
              {track.key && (
                  <div className="text-[10px] text-neutral-400 border-l border-white/10 pl-3">
                    Key: <span className="text-white">{track.key}</span>
                  </div>
              )}

              {/* Date */}
               {track.streamStartDate && (
                  <div className="text-[10px] text-neutral-400 border-l border-white/10 pl-3">
                    {new Date(track.streamStartDate).getFullYear()}
                  </div>
              )}
           </div>

           {/* Copyright / Extra */}
           {(track.copyright || track.isrc) && (
             <div className="mt-2 pt-2 border-t border-white/5 flex gap-4 text-[9px] text-neutral-600 font-mono">
                {track.isrc && <span>ISRC: {track.isrc}</span>}
                {track.copyright && <span className="truncate max-w-[200px]">{track.copyright}</span>}
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
