"use client";

import React, { memo } from "react";
import { Track } from "@/lib/api/types";
import { getTrackTitle, formatTime } from "@/lib/api/utils";
import { Play, Pause, Disc, TrendingUp, Clock } from "lucide-react";
import { api } from "@/lib/api";
import Image from "next/image";
import { motion } from "motion/react";

interface SearchResultCardProps {
  track: Track;
  isCurrentTrack: boolean;
  isPlaying: boolean;
  isLoading: boolean;
  onClick: () => void;
}

function SearchResultCard({
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
    <motion.div
      onClick={onClick}
      whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.05)" }}
      transition={{ duration: 0.15 }}
      className={`group relative flex items-center gap-4 px-4 py-3 rounded-xl transition-all w-full cursor-pointer
        ${
          isCurrentTrack
            ? "bg-white/[0.08]"
            : ""
        }
        ${isLoading ? "opacity-50 pointer-events-none" : ""}
      `}
    >
      {/* Cover Art / Play Overlay */}
      <div className="relative shrink-0 w-14 h-14 rounded-lg overflow-hidden bg-white/5 shadow-lg">
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={track.album?.title || "Album cover"}
            width={56}
            height={56}
            className={`w-full h-full object-cover transition-all duration-300 ${isCurrentTrack && isPlaying ? "scale-105" : "group-hover:scale-105"}`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-white/5">
            <Disc className="w-6 h-6 text-white/20" />
          </div>
        )}

        {/* Overlay Icon (Play/Pause/Wave) */}
        <div className={`absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity duration-200
            ${isCurrentTrack && isPlaying ? "opacity-100" : "opacity-0 group-hover:opacity-100"}
        `}>
           {isCurrentTrack && isPlaying ? (
               <div className="flex items-end gap-[3px] h-5">
                 <motion.div
                   className="w-1 bg-white rounded-full"
                   animate={{ height: ["40%", "100%", "40%"] }}
                   transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
                 />
                 <motion.div
                   className="w-1 bg-white rounded-full"
                   animate={{ height: ["100%", "40%", "100%"] }}
                   transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut", delay: 0.1 }}
                 />
                 <motion.div
                   className="w-1 bg-white rounded-full"
                   animate={{ height: ["60%", "80%", "60%"] }}
                   transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                 />
               </div>
           ) : (
             <Play className="w-6 h-6 text-white fill-white ml-0.5" />
           )}
        </div>
      </div>

      {/* Track Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
        <div className="flex items-center gap-2">
            <h3 className={`font-semibold text-base truncate transition-colors ${isCurrentTrack ? "text-white" : "text-white/90"}`}>
              {getTrackTitle(track)}
            </h3>
            {isExplicit && (
                <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-white/60">E</span>
            )}
        </div>
        <div className="flex items-center gap-2 text-sm text-white/50">
           <span className="truncate hover:text-white/70 transition-colors">
               {displayArtist}
           </span>
           {/* Quality Badges - Inline */}
           {hasDolbyAtmos && (
             <span className="shrink-0 text-[8px] font-bold px-1.5 py-0.5 bg-white/10 text-white/70 rounded">
               ATMOS
             </span>
           )}
           {hasHiRes && (
             <span className="shrink-0 text-[8px] font-bold px-1.5 py-0.5 bg-white/10 text-white/70 rounded">
               HI-RES
             </span>
           )}
        </div>
      </div>

      {/* Album (Hidden on small screens) */}
      <div className="hidden lg:flex flex-1 min-w-0 items-center text-sm text-white/40 truncate group-hover:text-white/60 transition-colors">
        {track.album?.title}
      </div>

      {/* Duration */}
      <div className="shrink-0 text-sm font-mono text-white/40 w-12 text-right group-hover:text-white/60 transition-colors">
        {formatTime(track.duration)}
      </div>
    </motion.div>
  );
}

SearchResultCard.displayName = 'SearchResultCard';

export default memo(SearchResultCard);
